import { Hono } from 'hono';
import { db } from '../db';
import { users, departments, vehicleRequests } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const telegramRoute = new Hono();

// Get Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ========================
// TELEGRAM API HELPERS
// ========================

// Send text message
async function sendText(chatId: string | number, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json() as { ok: boolean };
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Edit existing message (for inline keyboards)
async function editMessage(chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const body: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const response = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json() as { ok: boolean };
    return result.ok;
  } catch (error) {
    console.error('Error editing Telegram message:', error);
    return false;
  }
}

// Answer callback query (remove loading state on inline buttons)
async function answerCallback(callbackQueryId: string) {
  try {
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (error) {
    console.error('Error answering callback:', error);
  }
}

// ========================
// ROLE HELPERS
// ========================

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    superadmin: 'Super Administrator',
    admin: 'Administrator',
    head_departemen: 'Head Departemen',
    ga_transport: 'GA Transport',
    general_affair: 'Head Of General Affairs',
    general_service: 'Head Of General Service',
    user: 'User',
  };
  return labels[role] || role;
};

const getRoleEmoji = (role: string) => {
  const emojis: Record<string, string> = {
    superadmin: '\u{1F451}',
    admin: '\u{1F527}',
    head_departemen: '\u{1F454}',
    ga_transport: '\u{1F697}',
    general_affair: '\u{1F3E2}',
    general_service: '\u{1F3ED}',
    user: '\u{1F464}',
  };
  return emojis[role] || '\u{1F464}';
};

const getApprovalLevelLabel = (level: number) => {
  const labels: Record<number, string> = {
    1: 'Head Departemen',
    2: 'GA Transport',
    3: 'Head Of General Affairs',
    4: 'Head Of General Service',
  };
  return labels[level] || `Level ${level}`;
};

const formatDateID = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ========================
// COMMAND HANDLERS
// ========================

// /start - Welcome message
async function handleStart(chatId: string | number, firstName: string) {
  const text =
    '\u{1F44B} <b>Selamat datang, ' + firstName + '!</b>\n\n' +
    'Saya adalah <b>Bot Notifikasi FPK-IMM</b> \u{1F3E2}\n' +
    'Sistem Layanan Peminjaman Kendaraan PT Indominco Mandiri.\n\n' +
    'Untuk menerima notifikasi persetujuan kendaraan, ' +
    'silakan hubungkan akun Anda:\n\n' +
    '\u{1F449} Ketik /department untuk memilih departemen Anda';

  await sendText(chatId, text);
}

// /department - Show department list with inline keyboard
async function handleDepartment(chatId: string | number) {
  const deptList = await db.select({
    id: departments.id,
    name: departments.name,
  }).from(departments);

  if (deptList.length === 0) {
    await sendText(chatId, '\u{26A0}\u{FE0F} Belum ada departemen yang terdaftar di sistem.');
    return;
  }

  // Build inline keyboard - 2 columns
  const buttons = deptList.map(d => ({
    text: d.name,
    callback_data: `dept:${d.id}:${d.name}`,
  }));

  const keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  await sendText(
    chatId,
    '\u{1F3E2} <b>Pilih Departemen Anda:</b>\n\nSilakan pilih departemen tempat Anda bekerja.',
    { inline_keyboard: keyboard },
  );
}

// Handle department selection callback -> show users in that department
async function handleDepartmentSelection(chatId: string | number, messageId: number, deptId: number, deptName: string) {
  const userList = await db.select({
    id: users.id,
    fullName: users.fullName,
    role: users.role,
    username: users.username,
    telegramChatId: users.telegramChatId,
  })
  .from(users)
  .where(eq(users.departmentId, deptId));

  if (userList.length === 0) {
    await editMessage(
      chatId,
      messageId,
      '\u{1F3E2} Departemen: <b>' + deptName + '</b>\n\n\u{26A0}\u{FE0F} Belum ada user terdaftar di departemen ini.\n\n\u{1F449} Hubungi admin untuk mendaftarkan akun Anda.',
    );
    return;
  }

  // Build user list keyboard - 1 per row
  const keyboard = userList.map(u => {
    const linked = u.telegramChatId ? ' \u{2705}' : '';
    const emoji = getRoleEmoji(u.role);
    return [{
      text: `${emoji} ${u.fullName}${linked}`,
      callback_data: `user:${u.id}`,
    }];
  });

  // Add back button
  keyboard.push([{
    text: '\u{2B05}\u{FE0F} Kembali ke Departemen',
    callback_data: 'back:dept',
  }]);

  await editMessage(
    chatId,
    messageId,
    '\u{1F3E2} Departemen: <b>' + deptName + '</b>\n\n\u{1F464} <b>Pilih nama Anda:</b>\n<i>(\u{2705} = sudah terhubung)</i>',
    { inline_keyboard: keyboard },
  );
}

// Handle user selection callback -> link telegram to user account
async function handleUserSelection(chatId: string | number, messageId: number, userId: number) {
  const chatIdStr = chatId.toString();

  // Check if this chat is already linked to another user
  const [alreadyLinked] = await db.select()
    .from(users)
    .where(eq(users.telegramChatId, chatIdStr));

  if (alreadyLinked && alreadyLinked.id !== userId) {
    await editMessage(
      chatId,
      messageId,
      '\u{26A0}\u{FE0F} Telegram ini sudah terhubung ke akun <b>' + alreadyLinked.fullName + '</b>.\n\n' +
      'Untuk menghubungkan ke akun lain, putuskan koneksi dulu:\n\u{1F449} Ketik /unlink',
    );
    return;
  }

  // Link telegram chat to user
  const [updatedUser] = await db
    .update(users)
    .set({ telegramChatId: chatIdStr, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    await editMessage(chatId, messageId, '\u{274C} User tidak ditemukan.');
    return;
  }

  const roleLabel = getRoleLabel(updatedUser.role);

  // Get department name
  let deptName = '-';
  if (updatedUser.departmentId) {
    const [dept] = await db.select().from(departments).where(eq(departments.id, updatedUser.departmentId));
    if (dept) deptName = dept.name;
  }

  await editMessage(
    chatId,
    messageId,
    '\u{2705} <b>Akun Berhasil Terhubung!</b>\n\n' +
    '\u{1F464} <b>Nama:</b> ' + updatedUser.fullName + '\n' +
    '\u{1F3E2} <b>Departemen:</b> ' + deptName + '\n' +
    '\u{1F511} <b>Role:</b> ' + roleLabel + '\n\n' +
    'Anda akan menerima notifikasi Telegram saat ada permintaan kendaraan yang membutuhkan persetujuan Anda.\n\n' +
    '\u{1F4CC} Ketik /status untuk cek status\n' +
    '\u{1F4CC} Ketik /unlink untuk putuskan koneksi',
  );
}

// /status - Check connection status
async function handleStatus(chatId: string | number) {
  const chatIdStr = chatId.toString();

  const [linked] = await db.select()
    .from(users)
    .where(eq(users.telegramChatId, chatIdStr));

  if (linked) {
    const roleLabel = getRoleLabel(linked.role);
    let deptName = '-';
    if (linked.departmentId) {
      const [dept] = await db.select().from(departments).where(eq(departments.id, linked.departmentId));
      if (dept) deptName = dept.name;
    }

    await sendText(chatId,
      '\u{1F4CA} <b>Status Koneksi</b>\n\n' +
      '\u{2705} Terhubung ke:\n' +
      '\u{1F464} <b>' + linked.fullName + '</b>\n' +
      '\u{1F3E2} ' + deptName + '\n' +
      '\u{1F511} ' + roleLabel + '\n\n' +
      'Anda akan menerima notifikasi kendaraan otomatis.',
    );
  } else {
    await sendText(chatId,
      '\u{1F4CA} <b>Status Koneksi</b>\n\n' +
      '\u{274C} Belum terhubung ke akun manapun.\n\n' +
      '\u{1F449} Ketik /department untuk menghubungkan akun.',
    );
  }
}

// /unlink - Disconnect telegram from account
async function handleUnlink(chatId: string | number) {
  const chatIdStr = chatId.toString();

  const [linked] = await db.select()
    .from(users)
    .where(eq(users.telegramChatId, chatIdStr));

  if (!linked) {
    await sendText(chatId,
      '\u{26A0}\u{FE0F} Telegram ini belum terhubung ke akun manapun.\n\n' +
      '\u{1F449} Ketik /department untuk menghubungkan akun.',
    );
    return;
  }

  await db
    .update(users)
    .set({ telegramChatId: null, updatedAt: new Date() })
    .where(eq(users.id, linked.id));

  await sendText(chatId,
    '\u{1F513} <b>Koneksi Diputus</b>\n\n' +
    'Akun <b>' + linked.fullName + '</b> sudah tidak terhubung dengan Telegram ini.\n\n' +
    '\u{1F449} Ketik /department untuk menghubungkan ulang.',
  );
}

// /cek TIKET - Check ticket status
async function handleCekTiket(chatId: string | number, ticketNumber: string) {
  const [ticket] = await db.select()
    .from(vehicleRequests)
    .where(eq(vehicleRequests.ticketNumber, ticketNumber.toUpperCase()));

  if (!ticket) {
    await sendText(chatId,
      '\u{274C} <b>Tiket Tidak Ditemukan</b>\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
      'Tiket <code>' + ticketNumber + '</code> tidak ditemukan.\n\n' +
      'Pastikan nomor tiket yang dimasukkan benar.\n' +
      'Format: <code>GA-TR-XXXX</code>',
    );
    return;
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'approved': return '\u{2705}';
      case 'rejected': return '\u{274C}';
      default: return '\u{23F3}';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Menunggu';
    }
  };

  const isDesaBinaan = ticket.locationType === 'desa_binaan';
  const overallStatus = ticket.status === 'approved' ? '\u{2705} DISETUJUI' :
                         ticket.status === 'rejected' ? '\u{274C} DITOLAK' : '\u{23F3} MENUNGGU PERSETUJUAN';

  let approvalLines =
    getStatusEmoji(ticket.approval1) + ' ' + getApprovalLevelLabel(1) + ': ' + getStatusLabel(ticket.approval1) + '\n' +
    getStatusEmoji(ticket.approval2) + ' ' + getApprovalLevelLabel(2) + ': ' + getStatusLabel(ticket.approval2) + '\n' +
    getStatusEmoji(ticket.approval3) + ' ' + getApprovalLevelLabel(3) + ': ' + getStatusLabel(ticket.approval3);

  if (!isDesaBinaan) {
    approvalLines += '\n' + getStatusEmoji(ticket.approval4) + ' ' + getApprovalLevelLabel(4) + ': ' + getStatusLabel(ticket.approval4);
  }

  await sendText(chatId,
    '\u{1F4CB} <b>Detail Tiket Permohonan</b>\n' +
    '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
    '\u{1F3AB} <b>Tiket:</b> <code>' + ticket.ticketNumber + '</code>\n' +
    '\u{1F464} <b>Nama:</b> ' + ticket.name + '\n' +
    '\u{1F4CB} <b>Keperluan:</b> ' + ticket.purposeReason + '\n' +
    '\u{1F4CD} <b>Lokasi:</b> ' + (isDesaBinaan ? 'Desa Binaan' : 'Non-Desa Binaan') + '\n' +
    '\u{1F4C5} <b>Mulai:</b> ' + formatDateID(ticket.startDate) + '\n' +
    '\u{1F4C5} <b>Selesai:</b> ' + formatDateID(ticket.endDate) + '\n\n' +
    '\u{1F4CA} <b>Status Approval:</b>\n' + approvalLines + '\n\n' +
    '\u{1F516} <b>Status:</b> ' + overallStatus + '\n' +
    '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
    '<i>Sistem Layanan Peminjaman Kendaraan</i>\n' +
    '<i>PT Indominco Mandiri</i>',
  );
}

// /help - Show help
async function handleHelp(chatId: string | number) {
  await sendText(chatId,
    '\u{1F4D6} <b>Bantuan Bot FPK-IMM</b>\n\n' +
    'Bot ini mengirimkan notifikasi otomatis untuk persetujuan peminjaman kendaraan.\n\n' +
    '<b>Perintah:</b>\n' +
    '/start \u{2014} Mulai & selamat datang\n' +
    '/department \u{2014} Pilih departemen & hubungkan akun\n' +
    '/status \u{2014} Cek status koneksi\n' +
    '/unlink \u{2014} Putuskan koneksi akun\n' +
    '/cek <i>NOMOR_TIKET</i> \u{2014} Cek status tiket permohonan\n' +
    '/help \u{2014} Tampilkan bantuan ini',
  );
}

// ========================
// NOTIFICATION FUNCTIONS (exported for use in other routes)
// ========================

// Send notification to all users with a specific role (optionally in a department)
export const sendNotificationToRole = async (role: string, message: string, departmentId?: number) => {
  let userList;
  if (departmentId) {
    userList = await db.select().from(users).where(
      and(eq(users.role, role), eq(users.departmentId, departmentId))
    );
  } else {
    userList = await db.select().from(users).where(eq(users.role, role));
  }

  for (const user of userList) {
    if (user.telegramChatId) {
      await sendText(user.telegramChatId, message);
    }
  }
  return userList.filter(u => u.telegramChatId).length > 0;
};

// Notify when ticket is submitted
// Sends to: Head Departemen of pemohon's department (Level 1) + superadmins
export const sendTicketNotification = async (nik: string, ticketNumber: string, name: string, departmentId: number) => {
  try {
    const [dept] = await db.select().from(departments).where(eq(departments.id, departmentId));
    const deptName = dept?.name || 'Unknown';

    // 1. Notify Head Departemen of pemohon's department (they do Level 1 approval)
    const headDeptMessage =
      '\u{1F514} <b>Permohonan Kendaraan Baru</b>\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
      '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n\n' +
      '\u{1F464} <b>Pemohon:</b> ' + name + '\n' +
      '\u{1F194} <b>NIK:</b> ' + nik + '\n' +
      '\u{1F3E2} <b>Departemen:</b> ' + deptName + '\n\n' +
      '\u{23F3} <b>Menunggu persetujuan Anda (Level 1)</b>\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
      '<i>Segera lakukan review di dashboard admin.</i>';

    await sendNotificationToRole('head_departemen', headDeptMessage, departmentId);

    // 2. Notify superadmins
    const adminMessage =
      '\u{1F514} <b>Permohonan Kendaraan Baru</b>\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
      '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
      '\u{1F464} <b>Pemohon:</b> ' + name + '\n' +
      '\u{1F3E2} <b>Departemen:</b> ' + deptName + '\n\n' +
      '\u{23F3} Menunggu persetujuan Level 1 (Head Departemen)\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}';

    await sendNotificationToRole('superadmin', adminMessage);

    return true;
  } catch (error) {
    console.error('Error sending ticket notification:', error);
    return false;
  }
};

// Notify when approval status changes
// Flow: Head Dept (L1) -> GA Transport (L2) -> General Affair (L3) -> General Service (L4)
export const sendApprovalNotification = async (
  ticketNumber: string,
  level: number,
  status: 'approved' | 'rejected',
  notes?: string
) => {
  try {
    const [request] = await db.select()
      .from(vehicleRequests)
      .where(eq(vehicleRequests.ticketNumber, ticketNumber));

    if (!request) return false;

    const [dept] = await db.select().from(departments).where(eq(departments.id, request.departmentId));
    const deptName = dept?.name || '-';

    const isDesaBinaan = request.locationType === 'desa_binaan';
    const maxLevels = isDesaBinaan ? 3 : 4;
    const isApproved = status === 'approved';
    const isFinalApproval = level === maxLevels && isApproved;
    const isRejected = status === 'rejected';

    // -- Notify the NEXT approver in chain (if approved and not final) --
    if (isApproved && !isFinalApproval) {
      const nextLevel = level + 1;
      const nextRoleMap: Record<number, string> = {
        2: 'ga_transport',
        3: 'general_affair',
        4: 'general_service',
      };
      const nextRole = nextRoleMap[nextLevel];

      if (nextRole) {
        const nextApproverMessage =
          '\u{1F514} <b>Permohonan Kendaraan Perlu Approval</b>\n' +
          '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
          '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
          '\u{1F464} <b>Pemohon:</b> ' + request.name + '\n' +
          '\u{1F3E2} <b>Departemen:</b> ' + deptName + '\n' +
          '\u{1F4CB} <b>Keperluan:</b> ' + request.purposeReason + '\n' +
          '\u{1F4C5} <b>Mulai:</b> ' + formatDateID(request.startDate) + '\n' +
          '\u{1F4C5} <b>Selesai:</b> ' + formatDateID(request.endDate) + '\n\n' +
          '\u{2705} Level ' + level + ' telah disetujui.\n' +
          '\u{23F3} <b>Menunggu persetujuan Anda (Level ' + nextLevel + ')</b>\n' +
          '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
          '<i>Segera lakukan review di dashboard admin.</i>';

        // GA Transport, General Affair, General Service are NOT department-scoped
        await sendNotificationToRole(nextRole, nextApproverMessage);
      }
    }

    // -- Notify superadmins about any approval action --
    const adminStatusText = isApproved ? '\u{2705} Disetujui' : '\u{274C} Ditolak';
    const adminMessage =
      '\u{1F4CA} <b>Update Approval Kendaraan</b>\n' +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
      '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
      '\u{1F464} <b>Pemohon:</b> ' + request.name + '\n' +
      '\u{1F4CA} <b>Level ' + level + ' (' + getApprovalLevelLabel(level) + '):</b> ' + adminStatusText + '\n' +
      (notes ? '\u{1F4DD} <b>Catatan:</b> ' + notes + '\n' : '') +
      '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}';

    await sendNotificationToRole('superadmin', adminMessage);

    // -- Notify the PEMOHON about their request status --
    const pemohonUsers = await db.select().from(users).where(eq(users.email, request.email));

    let pemohonMessage = '';

    if (isFinalApproval) {
      pemohonMessage =
        '\u{1F389} <b>Permohonan Kendaraan DISETUJUI</b>\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        'Halo <b>' + request.name + '</b>,\n\n' +
        'Selamat! Seluruh proses persetujuan telah selesai.\n\n' +
        '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
        '\u{2705} <b>Status:</b> <b>DISETUJUI</b>\n\n' +
        '\u{1F4CB} <b>Detail Permohonan:</b>\n' +
        '\u{2022} Keperluan: ' + request.purposeReason + '\n' +
        '\u{2022} Waktu Mulai: ' + formatDateID(request.startDate) + '\n' +
        '\u{2022} Waktu Selesai: ' + formatDateID(request.endDate) + '\n\n' +
        'Silakan hubungi GA Transport untuk pengambilan kendaraan.\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        '\u{1F3E2} <i>Sistem Layanan Peminjaman Kendaraan</i>\n' +
        '<i>PT Indominco Mandiri</i>';
    } else if (isRejected) {
      pemohonMessage =
        '\u{274C} <b>Permohonan Kendaraan DITOLAK</b>\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        'Halo <b>' + request.name + '</b>,\n\n' +
        'Mohon maaf, permohonan kendaraan Anda ditolak.\n\n' +
        '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
        '\u{274C} <b>Status:</b> <b>DITOLAK</b>\n' +
        '\u{1F464} <b>Oleh:</b> ' + getApprovalLevelLabel(level) + '\n' +
        (notes ? '\u{1F4DD} <b>Catatan:</b> ' + notes + '\n' : '') +
        '\nSilakan ajukan permohonan baru dengan perbaikan yang diperlukan.\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        '\u{1F3E2} <i>Sistem Layanan Peminjaman Kendaraan</i>\n' +
        '<i>PT Indominco Mandiri</i>';
    } else {
      // Approved at intermediate level
      const nextLevel = level + 1;
      pemohonMessage =
        '\u{2705} <b>Update Permohonan Kendaraan</b>\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        'Halo <b>' + request.name + '</b>,\n\n' +
        'Permohonan Anda telah <b>Disetujui</b> oleh <b>' + getApprovalLevelLabel(level) + '</b>.\n\n' +
        '\u{1F3AB} <b>Tiket:</b> <code>' + ticketNumber + '</code>\n' +
        '\u{1F4CA} <b>Progress:</b> Level ' + level + '/' + maxLevels + ' \u{2705}\n' +
        (notes ? '\u{1F4DD} <b>Catatan:</b> ' + notes + '\n' : '') +
        '\n\u{23F3} Menunggu persetujuan <b>' + getApprovalLevelLabel(nextLevel) + '</b>.\n\n' +
        '\u{1F4A1} <i>Ketik</i> /cek ' + ticketNumber + ' <i>untuk detail lengkap.</i>\n' +
        '\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\n' +
        '\u{1F3E2} <i>Sistem Layanan Peminjaman Kendaraan</i>\n' +
        '<i>PT Indominco Mandiri</i>';
    }

    // Send to pemohon if they have telegram linked
    for (const pemohon of pemohonUsers) {
      if (pemohon.telegramChatId) {
        await sendText(pemohon.telegramChatId, pemohonMessage);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending approval notification:', error);
    return false;
  }
};

// Legacy export for backward compatibility
export const sendTelegramMessage = sendText;

// ========================
// WEBHOOK ROUTE
// ========================

telegramRoute.post('/webhook', async (c) => {
  try {
    const update = await c.req.json();

    // Handle text commands
    if (update.message?.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;
      const firstName = update.message.from?.first_name || 'Pengguna';

      if (text === '/start' || text.startsWith('/start ')) {
        await handleStart(chatId, firstName);
      } else if (text === '/department') {
        await handleDepartment(chatId);
      } else if (text === '/status') {
        await handleStatus(chatId);
      } else if (text === '/unlink') {
        await handleUnlink(chatId);
      } else if (text.startsWith('/cek ')) {
        const ticketNumber = text.replace('/cek ', '').trim();
        await handleCekTiket(chatId, ticketNumber);
      } else if (text === '/help' || text === '/bantuan') {
        await handleHelp(chatId);
      }
    }

    // Handle callback queries (inline keyboard button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      // Answer callback to remove loading state
      await answerCallback(callbackQuery.id);

      if (data.startsWith('dept:')) {
        // dept:{id}:{name}
        const parts = data.split(':');
        const deptId = parseInt(parts[1]);
        const deptName = parts.slice(2).join(':');
        await handleDepartmentSelection(chatId, messageId, deptId, deptName);
      } else if (data.startsWith('user:')) {
        // user:{id}
        const userId = parseInt(data.split(':')[1]);
        await handleUserSelection(chatId, messageId, userId);
      } else if (data === 'back:dept') {
        // Back to department list
        const deptList = await db.select({
          id: departments.id,
          name: departments.name,
        }).from(departments);

        const buttons = deptList.map(d => ({
          text: d.name,
          callback_data: `dept:${d.id}:${d.name}`,
        }));

        const keyboard: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < buttons.length; i += 2) {
          keyboard.push(buttons.slice(i, i + 2));
        }

        await editMessage(
          chatId,
          messageId,
          '\u{1F3E2} <b>Pilih Departemen Anda:</b>\n\nSilakan pilih departemen tempat Anda bekerja.',
          { inline_keyboard: keyboard },
        );
      }
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return c.json({ ok: true }); // Always return ok to Telegram
  }
});

// ========================
// ADMIN ENDPOINTS
// ========================

// Set webhook URL
telegramRoute.get('/set-webhook', async (c) => {
  const webhookUrl = c.req.query('url');

  if (!webhookUrl) {
    return c.json({ error: 'Missing url parameter' }, 400);
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, 500);
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${webhookUrl}/api/telegram/webhook` }),
    });

    const result = await response.json();
    return c.json(result);
  } catch (error) {
    console.error('Error setting webhook:', error);
    return c.json({ error: 'Failed to set webhook' }, 500);
  }
});

// Get webhook info
telegramRoute.get('/webhook-info', async (c) => {
  if (!TELEGRAM_BOT_TOKEN) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, 500);
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const result = await response.json();
    return c.json(result);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return c.json({ error: 'Failed to get webhook info' }, 500);
  }
});

export default telegramRoute;
