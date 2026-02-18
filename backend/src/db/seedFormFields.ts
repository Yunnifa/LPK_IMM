/**
 * Seed script untuk form fields default
 * Jalankan dengan: npx tsx src/db/seedFormFields.ts
 */

import { db } from './index';
import { formFields, formFieldOptions } from './schema';
import { eq } from 'drizzle-orm';

const defaultFormFields = [
  // Group: Jenis Layanan
  {
    fieldKey: 'service_type',
    label: 'Jenis Layanan',
    fieldType: 'radio',
    groupName: 'Jenis Layanan',
    placeholder: null,
    helpText: 'Pilih jenis layanan yang dibutuhkan',
    sortOrder: 1,
    isRequired: true,
    isSystemField: true,
    options: [
      { value: 'layanan_pool', label: 'Peminjaman Kendaraan di Pool Kendaraan' },
      { value: 'izin_khusus', label: 'Surat Izin/Rekomendasi Penggunaan Kendaraan Khusus' },
    ],
  },
  
  // Group: Data Pribadi
  {
    fieldKey: 'name',
    label: 'Nama Lengkap',
    fieldType: 'text',
    groupName: 'Data Pribadi',
    placeholder: 'Masukkan nama lengkap',
    helpText: null,
    sortOrder: 2,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  {
    fieldKey: 'nik',
    label: 'NIK',
    fieldType: 'text',
    groupName: 'Data Pribadi',
    placeholder: 'Masukkan NIK',
    helpText: 'Nomor Induk Kepegawaian',
    sortOrder: 3,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  {
    fieldKey: 'email',
    label: 'Email',
    fieldType: 'text',
    groupName: 'Data Pribadi',
    placeholder: 'contoh@email.com',
    helpText: null,
    sortOrder: 4,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  {
    fieldKey: 'department_id',
    label: 'Bagian/Departemen',
    fieldType: 'select',
    groupName: 'Data Pribadi',
    placeholder: 'Pilih bagian',
    helpText: 'Data diambil dari master departemen',
    sortOrder: 5,
    isRequired: true,
    isSystemField: true,
    options: [], // Options populated from departments table
  },
  
  // Group: Keperluan Kendaraan
  {
    fieldKey: 'vehicle_purpose',
    label: 'Jenis Keperluan',
    fieldType: 'radio',
    groupName: 'Keperluan Kendaraan',
    placeholder: null,
    helpText: null,
    sortOrder: 6,
    isRequired: true,
    isSystemField: true,
    options: [
      { value: 'dinas', label: 'Dinas' },
      { value: 'pribadi', label: 'Pribadi' },
    ],
  },
  {
    fieldKey: 'purpose_reason',
    label: 'Keperluan',
    fieldType: 'textarea',
    groupName: 'Keperluan Kendaraan',
    placeholder: 'Jelaskan keperluan penggunaan kendaraan',
    helpText: null,
    sortOrder: 7,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  
  // Group: Lokasi
  {
    fieldKey: 'location_type',
    label: 'Lokasi Tujuan',
    fieldType: 'radio',
    groupName: 'Lokasi',
    placeholder: null,
    helpText: null,
    sortOrder: 8,
    isRequired: true,
    isSystemField: true,
    options: [
      { value: 'desa_binaan', label: 'Desa Binaan' },
      { value: 'non_desa_binaan', label: 'Non Desa Binaan' },
    ],
  },
  
  // Group: Waktu
  {
    fieldKey: 'start_date',
    label: 'Waktu Mulai',
    fieldType: 'datetime',
    groupName: 'Waktu Penggunaan',
    placeholder: null,
    helpText: 'Pilih tanggal dan waktu mulai',
    sortOrder: 9,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  {
    fieldKey: 'end_date',
    label: 'Waktu Selesai',
    fieldType: 'datetime',
    groupName: 'Waktu Penggunaan',
    placeholder: null,
    helpText: 'Pilih tanggal dan waktu selesai',
    sortOrder: 10,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
  
  // Group: Persetujuan
  {
    fieldKey: 'agreement',
    label: 'Persetujuan',
    fieldType: 'checkbox',
    groupName: 'Persetujuan',
    placeholder: null,
    helpText: 'Saya menyetujui syarat dan ketentuan yang berlaku',
    sortOrder: 11,
    isRequired: true,
    isSystemField: true,
    options: [],
  },
];

async function seedFormFields() {
  console.log('🌱 Seeding form fields...');
  
  try {
    for (const fieldData of defaultFormFields) {
      // Check if field already exists
      const existing = await db.query.formFields.findFirst({
        where: eq(formFields.fieldKey, fieldData.fieldKey),
      });
      
      if (existing) {
        console.log(`  ⏭️  Field "${fieldData.fieldKey}" already exists, skipping...`);
        continue;
      }
      
      // Insert field
      const [newField] = await db.insert(formFields).values({
        fieldKey: fieldData.fieldKey,
        label: fieldData.label,
        fieldType: fieldData.fieldType,
        groupName: fieldData.groupName,
        placeholder: fieldData.placeholder,
        helpText: fieldData.helpText,
        sortOrder: fieldData.sortOrder,
        isRequired: fieldData.isRequired,
        isSystemField: fieldData.isSystemField,
      }).returning();
      
      console.log(`  ✅ Created field: ${fieldData.fieldKey}`);
      
      // Insert options if any
      if (fieldData.options.length > 0) {
        await db.insert(formFieldOptions).values(
          fieldData.options.map((opt, index) => ({
            fieldId: newField.id,
            value: opt.value,
            label: opt.label,
            sortOrder: index,
          }))
        );
        console.log(`     📋 Added ${fieldData.options.length} options`);
      }
    }
    
    console.log('\n✅ Form fields seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding form fields:', error);
    process.exit(1);
  }
}

seedFormFields();
