import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Departments Table
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  birthdate: date('birthdate'),
  role: varchar('role', { length: 20 }).notNull().default('user'), // superadmin, head_departemen, ga_transport, general_affair, general_service
  departmentId: integer('department_id').references(() => departments.id),
  telegramChatId: varchar('telegram_chat_id', { length: 50 }), // Telegram chat ID for notifications
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Vehicles Table
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull().unique(),
  brand: varchar('brand', { length: 50 }).notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  year: integer('year').notNull(),
  color: varchar('color', { length: 30 }),
  type: varchar('type', { length: 30 }).notNull(), // mobil, motor, truck
  capacity: integer('capacity'), // jumlah penumpang
  fuelType: varchar('fuel_type', { length: 20 }), // bensin, diesel, electric
  transmission: varchar('transmission', { length: 20 }), // manual, automatic
  status: varchar('status', { length: 20 }).notNull().default('available'), // available, rented, maintenance, unavailable
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Vehicle Requests Table
export const vehicleRequests = pgTable('vehicle_requests', {
  id: serial('id').primaryKey(),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull().unique(),
  
  // Service Type
  serviceType: varchar('service_type', { length: 100 }).notNull(), // layanan_pool, izin_khusus
  
  // Personal Info
  name: varchar('name', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  departmentId: integer('department_id').notNull().references(() => departments.id),
  
  // Vehicle Purpose
  vehiclePurpose: varchar('vehicle_purpose', { length: 100 }).notNull(), // dinas, pribadi
  purposeReason: text('purpose_reason').notNull(),
  
  // Location
  locationType: varchar('location_type', { length: 100 }).notNull(), // desa_binaan, non_desa_binaan
  
  // Time
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  
  // Agreement
  agreement: boolean('agreement').notNull().default(false),
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  
  // 4-Level Approval System
  approval1: varchar('approval1', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approval1By: integer('approval1_by').references(() => users.id),
  approval1At: timestamp('approval1_at'),
  approval1Notes: text('approval1_notes'),
  
  approval2: varchar('approval2', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approval2By: integer('approval2_by').references(() => users.id),
  approval2At: timestamp('approval2_at'),
  approval2Notes: text('approval2_notes'),
  
  approval3: varchar('approval3', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approval3By: integer('approval3_by').references(() => users.id),
  approval3At: timestamp('approval3_at'),
  approval3Notes: text('approval3_notes'),
  
  approval4: varchar('approval4', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approval4By: integer('approval4_by').references(() => users.id),
  approval4At: timestamp('approval4_at'),
  approval4Notes: text('approval4_notes'),
  
  // Legacy (keep for compatibility)
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Telegram Subscribers Table - untuk notifikasi tiket via Telegram
export const telegramSubscribers = pgTable('telegram_subscribers', {
  id: serial('id').primaryKey(),
  chatId: varchar('chat_id', { length: 50 }).notNull().unique(),
  nik: varchar('nik', { length: 20 }), // Link ke NIK user untuk notifikasi personal
  name: varchar('name', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ========================
// FORM BUILDER TABLES
// ========================

// Form Fields - Master table untuk konfigurasi pertanyaan form
export const formFields = pgTable('form_fields', {
  id: serial('id').primaryKey(),
  fieldKey: varchar('field_key', { length: 50 }).notNull().unique(), // e.g. "nama_lengkap", "tanggal_mulai"
  label: varchar('label', { length: 200 }).notNull(), // Label yang ditampilkan
  fieldType: varchar('field_type', { length: 20 }).notNull(), // text, date, select, radio, checkbox, textarea
  groupName: varchar('group_name', { length: 100 }), // Untuk mengelompokkan fields (e.g. "Data Pribadi", "Waktu")
  placeholder: varchar('placeholder', { length: 200 }), // Placeholder text
  helpText: text('help_text'), // Teks bantuan di bawah field
  validationRules: text('validation_rules'), // JSON: { required: true, minLength: 5, pattern: "..." }
  defaultValue: text('default_value'), // Nilai default
  sortOrder: integer('sort_order').notNull().default(0), // Urutan tampil
  isRequired: boolean('is_required').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true), // Soft delete
  isSystemField: boolean('is_system_field').notNull().default(false), // Field bawaan sistem (tidak bisa dihapus)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Form Field Options - Pilihan untuk field tipe select, radio, checkbox
export const formFieldOptions = pgTable('form_field_options', {
  id: serial('id').primaryKey(),
  fieldId: integer('field_id').notNull().references(() => formFields.id, { onDelete: 'cascade' }),
  value: varchar('value', { length: 100 }).notNull(), // Nilai yang disimpan
  label: varchar('label', { length: 200 }).notNull(), // Label yang ditampilkan
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Form Responses - Menyimpan jawaban dari setiap submission
export const formResponses = pgTable('form_responses', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => vehicleRequests.id, { onDelete: 'cascade' }),
  fieldId: integer('field_id').notNull().references(() => formFields.id),
  fieldKey: varchar('field_key', { length: 50 }).notNull(), // Duplikasi untuk query cepat
  value: text('value'), // Nilai jawaban (string untuk semua tipe)
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================
// RELATIONS
// ========================
export const usersRelations = relations(users, ({ many }) => ({
  vehicleRequests: many(vehicleRequests),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  // Future: vehicle assignments
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  vehicleRequests: many(vehicleRequests),
}));

export const vehicleRequestsRelations = relations(vehicleRequests, ({ one, many }) => ({
  department: one(departments, {
    fields: [vehicleRequests.departmentId],
    references: [departments.id],
  }),
  approver: one(users, {
    fields: [vehicleRequests.approvedBy],
    references: [users.id],
  }),
  formResponses: many(formResponses),
}));

// Form Builder Relations
export const formFieldsRelations = relations(formFields, ({ many }) => ({
  options: many(formFieldOptions),
  responses: many(formResponses),
}));

export const formFieldOptionsRelations = relations(formFieldOptions, ({ one }) => ({
  field: one(formFields, {
    fields: [formFieldOptions.fieldId],
    references: [formFields.id],
  }),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  request: one(vehicleRequests, {
    fields: [formResponses.requestId],
    references: [vehicleRequests.id],
  }),
  field: one(formFields, {
    fields: [formResponses.fieldId],
    references: [formFields.id],
  }),
}));