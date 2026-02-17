import { db } from './index';
import { users, vehicles, departments, formFields, formFieldOptions } from './schema';
import bcrypt from 'bcryptjs';

export default async function autoSeed() {
  console.log('🌱 Seeding database...');

  // Create departments
  await db.insert(departments).values([
    { name: 'Human Resource', description: 'Departemen SDM' },
    { name: 'Finance', description: 'Departemen Keuangan' },
    { name: 'IT', description: 'Departemen Teknologi Informasi' },
    { name: 'Marketing', description: 'Departemen Pemasaran' },
    { name: 'Operations', description: 'Departemen Operasional' },
    { name: 'General Affairs', description: 'Departemen Umum' },
    { name: 'Production', description: 'Departemen Produksi' },
    { name: 'Quality Control', description: 'Departemen QC' },
  ]);
  console.log('✅ Departments seeded');

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values([
    {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      email: 'admin@lpkimm.com',
      phone: '081234567890',
      role: 'admin',
    },
    {
      username: 'superadmin',
      password: await bcrypt.hash('superadmin123', 10),
      fullName: 'Super Administrator',
      email: 'superadmin@lpkimm.com',
      phone: '081234567891',
      role: 'superadmin',
    },
  ]);
  console.log('✅ Users seeded');

  // Create sample vehicles
  await db.insert(vehicles).values([
    {
      licensePlate: 'B 1234 XYZ',
      brand: 'Toyota',
      model: 'Avanza',
      year: 2022,
      color: 'Putih',
      type: 'mobil',
      capacity: 7,
      fuelType: 'bensin',
      transmission: 'manual',
      status: 'available',
      dailyRate: '350000',
      description: 'Mobil keluarga 7 penumpang',
    },
    {
      licensePlate: 'B 5678 ABC',
      brand: 'Honda',
      model: 'Jazz',
      year: 2023,
      color: 'Merah',
      type: 'mobil',
      capacity: 5,
      fuelType: 'bensin',
      transmission: 'automatic',
      status: 'available',
      dailyRate: '400000',
      description: 'City car dengan transmisi automatic',
    },
    {
      licensePlate: 'B 9999 DEF',
      brand: 'Yamaha',
      model: 'NMAX',
      year: 2023,
      color: 'Hitam',
      type: 'motor',
      capacity: 2,
      fuelType: 'bensin',
      transmission: 'automatic',
      status: 'available',
      dailyRate: '100000',
      description: 'Motor matic modern',
    },
  ]);
  console.log('✅ Vehicles seeded');

  // ================================
  // FORM FIELDS
  // ================================

  const [ketentuan] = await db.insert(formFields).values({
    fieldKey: 'ketentuan',
    label: 'Ketentuan Peminjaman Kendaraan',
    fieldType: 'select',
    groupName: 'Ketentuan',
    helpText: 'Pastikan Anda memahami dan menyetujui ketentuan berikut:',
    sortOrder: 0,
    isRequired: false,
    isActive: true,
    isSystemField: true,
  }).returning();

  await db.insert(formFieldOptions).values([
    { fieldId: ketentuan.id, value: 'ketentuan_1', label: 'Peminjam bertanggung jawab penuh atas kendaraan selama masa peminjaman', sortOrder: 0 },
    { fieldId: ketentuan.id, value: 'ketentuan_2', label: 'Kendaraan harus dikembalikan dalam kondisi baik dan bersih', sortOrder: 1 },
    { fieldId: ketentuan.id, value: 'ketentuan_3', label: 'Segala kerusakan menjadi tanggung jawab peminjam', sortOrder: 2 },
    { fieldId: ketentuan.id, value: 'ketentuan_4', label: 'Peminjam wajib mematuhi peraturan lalu lintas', sortOrder: 3 },
    { fieldId: ketentuan.id, value: 'ketentuan_5', label: 'Kendaraan hanya untuk keperluan yang diajukan', sortOrder: 4 },
    { fieldId: ketentuan.id, value: 'ketentuan_6', label: 'Peminjam wajib mengembalikan kendaraan tepat waktu', sortOrder: 5 },
    { fieldId: ketentuan.id, value: 'ketentuan_7', label: 'Keterlambatan dikenakan sanksi sesuai ketentuan', sortOrder: 6 },
  ]);

  const [jenisLayanan] = await db.insert(formFields).values({
    fieldKey: 'jenis_layanan',
    label: 'Jenis Layanan',
    fieldType: 'radio',
    groupName: 'Layanan',
    sortOrder: 1,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  }).returning();

  await db.insert(formFieldOptions).values([
    { fieldId: jenisLayanan.id, value: 'layanan_pool', label: 'Layanan Pool', sortOrder: 0 },
    { fieldId: jenisLayanan.id, value: 'izin_khusus', label: 'Izin Khusus Kendaraan Operasional', sortOrder: 1 },
  ]);

  await db.insert(formFields).values({
    fieldKey: 'nama_lengkap',
    label: 'Nama Lengkap',
    fieldType: 'text',
    groupName: 'Data Diri',
    placeholder: 'Masukkan nama lengkap',
    sortOrder: 2,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  await db.insert(formFields).values({
    fieldKey: 'nomor_induk_kependudukan',
    label: 'Nomor Induk Kependudukan',
    fieldType: 'text',
    groupName: 'Data Diri',
    placeholder: 'Masukkan NIK (16 digit)',
    sortOrder: 3,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  await db.insert(formFields).values({
    fieldKey: 'alamat_email',
    label: 'Alamat Email',
    fieldType: 'text',
    groupName: 'Data Diri',
    placeholder: 'Masukkan alamat email',
    sortOrder: 4,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  await db.insert(formFields).values({
    fieldKey: 'department_bagian',
    label: 'Department / Bagian',
    fieldType: 'select',
    groupName: 'Data Diri',
    placeholder: 'Pilih department',
    sortOrder: 5,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  const [jenisKeperluan] = await db.insert(formFields).values({
    fieldKey: 'jenis_keperluan_kendaraan',
    label: 'Jenis Keperluan Kendaraan',
    fieldType: 'radio',
    groupName: 'Keperluan Kendaraan',
    sortOrder: 6,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  }).returning();

  await db.insert(formFieldOptions).values([
    { fieldId: jenisKeperluan.id, value: 'dinas', label: 'Dinas', sortOrder: 0 },
    { fieldId: jenisKeperluan.id, value: 'pribadi', label: 'Pribadi', sortOrder: 1 },
  ]);

  await db.insert(formFields).values({
    fieldKey: 'alasan_keperluan_kendaraan',
    label: 'Alasan Keperluan Kendaraan',
    fieldType: 'textarea',
    groupName: 'Keperluan Kendaraan',
    placeholder: 'Jelaskan alasan keperluan kendaraan',
    sortOrder: 7,
    isRequired: true,
    isActive: true,
    isSystemField: false,
  });

  const [lokasiTempat] = await db.insert(formFields).values({
    fieldKey: 'lokasi_tempat_tujuan',
    label: 'Lokasi Tempat Tujuan',
    fieldType: 'radio',
    groupName: 'Lokasi',
    sortOrder: 8,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  }).returning();

  await db.insert(formFieldOptions).values([
    { fieldId: lokasiTempat.id, value: 'desa_binaan', label: 'Desa Binaan', sortOrder: 0 },
    { fieldId: lokasiTempat.id, value: 'non_desa_binaan', label: 'Non-Desa Binaan', sortOrder: 1 },
  ]);

  await db.insert(formFields).values({
    fieldKey: 'tanggal_mulai',
    label: 'Dibutuhkan Pada',
    fieldType: 'datetime',
    groupName: 'Waktu Peminjaman',
    sortOrder: 9,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  await db.insert(formFields).values({
    fieldKey: 'tanggal_selesai',
    label: 'Kembali Pada',
    fieldType: 'datetime',
    groupName: 'Waktu Peminjaman',
    sortOrder: 10,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  });

  const [persetujuan] = await db.insert(formFields).values({
    fieldKey: 'persetujuan_ketentuan',
    label: 'Persetujuan Ketentuan',
    fieldType: 'radio',
    groupName: 'Persetujuan',
    helpText: 'Dengan ini saya menyetujui semua ketentuan yang berlaku',
    sortOrder: 11,
    isRequired: true,
    isActive: true,
    isSystemField: true,
  }).returning();

  await db.insert(formFieldOptions).values([
    { fieldId: persetujuan.id, value: 'setuju', label: 'Setuju', sortOrder: 0 },
    { fieldId: persetujuan.id, value: 'tidak_setuju', label: 'Tidak Setuju', sortOrder: 1 },
  ]);

  console.log('✅ Form Fields seeded');
  console.log('🎉 Database seeding complete!');
}
