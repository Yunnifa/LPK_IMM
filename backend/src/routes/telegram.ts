import { Hono } from 'hono';
import { db } from '../db';
import { telegramSubscribers, vehicleRequests } from '../db/schema';
import { eq } from 'drizzle-orm';

const telegramRoute = new Hono();

// Get Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Telegram API response type
interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

// Send message via Telegram API
export const sendTelegramMessage = async (chatId: string, message: string) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json() as TelegramResponse;
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
};

// Send ticket notification to a specific NIK's subscribers
export const sendTicketNotification = async (nik: string, ticketNumber: string, name: string) => {
  try {
    // Find all subscribers for this NIK
    const subscribers = await db
      .select()
      .from(telegramSubscribers)
      .where(eq(telegramSubscribers.nik, nik));

    if (subscribers.length === 0) {
      console.log(`No Telegram subscribers found for NIK: ${nik}`);
      return false;
    }

    const message = `
🎫 <b>Tiket Permohonan Kendaraan</b>

Halo <b>${name}</b>!

Permohonan kendaraan Anda berhasil disubmit.

📋 <b>Nomor Tiket:</b>
<code>${ticketNumber}</code>

Simpan nomor tiket ini untuk mengecek status permohonan Anda.

---
LPK-IMM Vehicle Request System
    `.trim();

    // Send to all subscribers for this NIK
    for (const subscriber of subscribers) {
      await sendTelegramMessage(subscriber.chatId, message);
    }

    return true;
  } catch (error) {
    console.error('Error sending ticket notification:', error);
    return false;
  }
};

// Webhook endpoint for Telegram Bot updates
telegramRoute.post('/webhook', async (c) => {
  try {
    const update = await c.req.json();

    // Handle /start command
    if (update.message?.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;
      const fromUser = update.message.from;

      // /start command with optional ticket number
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const ticketNumber = parts[1]; // If user clicked link with ?start=TKTxxxxxxxx

        // Check if subscriber exists
        const [existingSubscriber] = await db
          .select()
          .from(telegramSubscribers)
          .where(eq(telegramSubscribers.chatId, chatId));

        if (!existingSubscriber) {
          // Save new subscriber
          await db.insert(telegramSubscribers).values({
            chatId,
            name: fromUser.first_name || fromUser.username || 'User',
            isActive: true,
          });

          let welcomeMessage = `
🎉 <b>Selamat datang di LPK-IMM Bot!</b>

Anda telah berhasil terdaftar untuk menerima notifikasi tiket permohonan kendaraan.

<b>Cara menghubungkan NIK Anda:</b>
Kirim pesan dengan format:
<code>/daftar NIK_ANDA</code>

Contoh: <code>/daftar 1234567890123456</code>

Setelah terdaftar, setiap kali Anda membuat permohonan kendaraan, nomor tiket akan otomatis dikirim ke sini.
          `.trim();

          // If started with ticket number, show it
          if (ticketNumber) {
            // Find the ticket
            const [ticket] = await db
              .select()
              .from(vehicleRequests)
              .where(eq(vehicleRequests.ticketNumber, ticketNumber.toUpperCase()));

            if (ticket) {
              welcomeMessage += `

---

📋 <b>Tiket Anda:</b>
<code>${ticket.ticketNumber}</code>

Untuk menghubungkan NIK, kirim:
<code>/daftar ${ticket.nik}</code>`;
            }
          }

          await sendTelegramMessage(chatId, welcomeMessage);
        } else {
          await sendTelegramMessage(chatId, `
👋 <b>Halo kembali!</b>

Anda sudah terdaftar di sistem kami${existingSubscriber.nik ? ` dengan NIK: ${existingSubscriber.nik}` : ''}.

${!existingSubscriber.nik ? 'Untuk menghubungkan NIK, kirim:\n<code>/daftar NIK_ANDA</code>' : 'Anda akan menerima notifikasi tiket secara otomatis.'}
          `.trim());
        }

        return c.json({ ok: true });
      }

      // /daftar command - register NIK
      if (text.startsWith('/daftar ')) {
        const nik = text.replace('/daftar ', '').trim();

        if (!nik || nik.length < 10) {
          await sendTelegramMessage(chatId, '❌ NIK tidak valid. Pastikan NIK minimal 10 karakter.');
          return c.json({ ok: true });
        }

        // Update subscriber with NIK
        await db
          .update(telegramSubscribers)
          .set({ nik, updatedAt: new Date() })
          .where(eq(telegramSubscribers.chatId, chatId));

        await sendTelegramMessage(chatId, `
✅ <b>Berhasil!</b>

NIK <code>${nik}</code> telah terdaftar.

Sekarang setiap kali Anda membuat permohonan kendaraan dengan NIK ini, nomor tiket akan otomatis dikirim ke sini.
        `.trim());

        return c.json({ ok: true });
      }

      // /cek command - check ticket status
      if (text.startsWith('/cek ')) {
        const ticketNumber = text.replace('/cek ', '').trim().toUpperCase();

        const [ticket] = await db
          .select()
          .from(vehicleRequests)
          .where(eq(vehicleRequests.ticketNumber, ticketNumber));

        if (!ticket) {
          await sendTelegramMessage(chatId, `❌ Tiket <code>${ticketNumber}</code> tidak ditemukan.`);
        } else {
          const getStatusEmoji = (status: string) => {
            switch (status) {
              case 'approved': return '✅';
              case 'rejected': return '❌';
              default: return '⏳';
            }
          };

          const statusMessage = `
📋 <b>Status Tiket</b>

<b>Nomor:</b> <code>${ticket.ticketNumber}</code>
<b>Nama:</b> ${ticket.name}
<b>Keperluan:</b> ${ticket.purposeReason}

<b>Status Approval:</b>
${getStatusEmoji(ticket.approval1)} Level 1: ${ticket.approval1}
${getStatusEmoji(ticket.approval2)} Level 2: ${ticket.approval2}
${getStatusEmoji(ticket.approval3)} Level 3: ${ticket.approval3}
${getStatusEmoji(ticket.approval4)} Level 4: ${ticket.approval4}
          `.trim();

          await sendTelegramMessage(chatId, statusMessage);
        }

        return c.json({ ok: true });
      }

      // /help command
      if (text === '/help' || text === '/bantuan') {
        await sendTelegramMessage(chatId, `
📖 <b>Panduan Bot LPK-IMM</b>

<b>Perintah tersedia:</b>

📝 <code>/daftar NIK</code>
Daftarkan NIK Anda untuk menerima notifikasi otomatis

🔍 <code>/cek NOMOR_TIKET</code>
Cek status tiket permohonan

❓ <code>/help</code>
Tampilkan panduan ini

---
Hubungi admin jika ada masalah.
        `.trim());

        return c.json({ ok: true });
      }
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return c.json({ ok: true }); // Always return ok to Telegram
  }
});

// Set webhook URL (call this once to configure)
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
