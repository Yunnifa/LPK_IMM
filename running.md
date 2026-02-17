# 🚀 Panduan Menjalankan Aplikasi LPK-IMM

Dokumentasi ini berisi cara menjalankan **Frontend** dan **Backend** dari aplikasi LPK-IMM (Vehicle Request Management System).

---

## 📋 Prasyarat

Pastikan Anda sudah menginstall:

- **Node.js** v18+ (Download: https://nodejs.org/)
- **PostgreSQL** v15+ (Download: https://www.postgresql.org/download/)
- **npm** (sudah termasuk di Node.js)

---

## 🗄️ Setup Database (PostgreSQL)

### 1. Pastikan PostgreSQL Running

```powershell
# Cek status PostgreSQL
Get-Service -Name postgresql*

# Jika Stopped, start dengan:
Start-Service -Name "postgresql-x64-15"
```

### 2. Buat Database

Buka **PgAdmin4** dan buat database baru:
- **Database name**: `lpk_imm`
- **Owner**: postgres
- **Port**: 5433

Atau via SQL:
```sql
CREATE DATABASE lpk_imm;
```

### 3. Konfigurasi Environment

File `.env` sudah ada di folder `backend/`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:root@localhost:5433/lpk_imm
JWT_SECRET=your-super-secret-jwt-key-for-vehicle-rental
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Sesuaikan `root` dengan password PostgreSQL Anda jika berbeda!

---

## ⚙️ Backend

### Lokasi: `D:\LPK_IMM\backend`

### Langkah-langkah:

#### 1. Install Dependencies

```powershell
cd D:\LPK_IMM\backend
npm install
```

#### 2. Push Database Schema

```powershell
npx drizzle-kit push
```

#### 3. Seed Data Awal (Opsional)

```powershell
npm run db:seed
```

#### 4. Jalankan Development Server

```powershell
npm run dev
```

**Atau menggunakan npx (langsung):**
```powershell
npx tsx watch src/index.ts
```

✅ Backend akan berjalan di: **http://localhost:3000**

### Script Backend yang Tersedia:

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| `dev` | `npm run dev` | Menjalankan server development dengan hot reload |
| `start` | `npm run start` | Menjalankan production build |
| `db:push` | `npm run db:push` | Push schema database ke PostgreSQL |
| `db:seed` | `npm run db:seed` | Insert data awal (admin, departments) |
| `db:studio` | `npm run db:studio` | Buka Drizzle Studio untuk melihat database |

---

## 🎨 Frontend

### Lokasi: `D:\LPK_IMM\frontend`

### Langkah-langkah:

#### 1. Install Dependencies

```powershell
cd D:\LPK_IMM\frontend
npm install
```

#### 2. Jalankan Development Server

```powershell
npm run dev
```

**Atau menggunakan npx (langsung):**
```powershell
npx vite
```

✅ Frontend akan berjalan di: **http://localhost:5173**

### Script Frontend yang Tersedia:

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| `dev` | `npm run dev` | Menjalankan Vite dev server dengan hot reload |
| `build` | `npm run build` | Build untuk production |
| `preview` | `npm run preview` | Preview hasil build production |
| `lint` | `npm run lint` | Jalankan ESLint untuk cek kode |

---

## 🏃 Quick Start (Menjalankan Keduanya)

Buka **2 terminal terpisah**:

### Terminal 1 - Backend:
```powershell
cd D:\LPK_IMM\backend
npm install
npx drizzle-kit push
npm run db:seed
npm run dev
```

### Terminal 2 - Frontend:
```powershell
cd D:\LPK_IMM\frontend
npm install
npm run dev
```

---

## 🌐 Akses Aplikasi

| Layanan | URL | Deskripsi |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Aplikasi React |
| Backend API | http://localhost:3000 | Hono.js REST API |
| Form Permohonan | http://localhost:5173/permohonan | Form publik untuk permohonan kendaraan |
| Admin Login | http://localhost:5173 | Login untuk admin |

### Login Admin:
- **Username**: `admin`
- **Password**: `admin123`

---

## ❗ Troubleshooting

### Error: "ECONNREFUSED"
- ✅ Pastikan PostgreSQL sudah running di port **5433**
- ✅ Cek password di file `.env`
- ✅ Pastikan database `lpk_imm` sudah dibuat

### Error: "Module not found"
- ✅ Jalankan `npm install` di folder yang bermasalah

### Port sudah digunakan
- ✅ Matikan proses yang menggunakan port tersebut:
  ```powershell
  # Cek proses di port 3000
  netstat -ano | findstr :3000
  
  # Kill proses (ganti PID dengan nomor yang muncul)
  taskkill /PID <PID> /F
  ```

### Error CORS
- ✅ Pastikan frontend berjalan di port 5173
- ✅ Restart backend setelah mengubah `.env`

---

## 📁 Struktur Project

```
D:\LPK_IMM\
├── backend/                 # Backend API (Hono.js + PostgreSQL)
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── db/             # Database config & schema
│   │   │   ├── index.ts    # Database connection
│   │   │   ├── schema.ts   # Table definitions
│   │   │   └── seed.ts     # Data seeder
│   │   ├── routes/         # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── departments.ts
│   │   │   ├── vehicleRequests.ts
│   │   │   └── ...
│   │   └── middleware/     # Auth middleware
│   ├── package.json
│   ├── drizzle.config.ts   # Drizzle ORM config
│   └── .env                # Environment variables
│
├── frontend/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx         # Main routing
│   │   ├── main.tsx        # Entry point
│   │   ├── components/     # UI components
│   │   │   ├── Login.tsx
│   │   │   ├── DataMonitoring.tsx
│   │   │   ├── KelolaPertanyaan.tsx
│   │   │   ├── PermohonanKendaraan.tsx
│   │   │   └── ...
│   │   └── services/       # API services
│   │       ├── api.ts
│   │       └── apiService.ts
│   ├── package.json
│   └── vite.config.ts
│
└── running.md              # File ini
```

---

## 🛠️ Tech Stack

### Backend:
- **Hono.js** - Web framework
- **PostgreSQL** - Database (port 5433)
- **Drizzle ORM** - Database ORM
- **Zod** - Validation
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend:
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router DOM** - Routing

---

## 📊 Fitur Aplikasi

### Public:
- Form permohonan kendaraan
- Cek status tiket

### Admin:
- Data Monitoring (dengan 4-level approval)
- Kelola Pertanyaan (manage form fields)
- Export data ke CSV

---

## 📝 Kelola Pertanyaan (Form Builder)

Sistem dynamic form builder untuk mengelola pertanyaan pada form permohonan kendaraan.

### Database Tables:

| Table | Deskripsi |
|-------|-----------|
| `form_fields` | Master data pertanyaan/field |
| `form_field_options` | Pilihan untuk field select/radio/checkbox |
| `form_responses` | Jawaban yang disimpan per request |

### Field Types:
- `text` - Input text biasa
- `textarea` - Text area panjang
- `date` - Pilih tanggal
- `datetime` - Pilih tanggal dan waktu
- `select` - Dropdown pilihan
- `radio` - Pilihan tunggal (radio button)
- `checkbox` - Checkbox

### Seed Default Fields:

```bash
cd backend
npx tsx src/db/seedFormFields.ts
```

### API Endpoints:

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/form-fields` | Get active fields (public) |
| GET | `/api/form-fields/all` | Get all fields (admin) |
| GET | `/api/form-fields/:id` | Get single field |
| POST | `/api/form-fields` | Create new field |
| PUT | `/api/form-fields/:id` | Update field |
| DELETE | `/api/form-fields/:id` | Soft delete field |
| POST | `/api/form-fields/reorder` | Reorder fields |
| GET | `/api/form-fields/responses/:requestId` | Get responses |
| POST | `/api/form-fields/responses` | Save responses |

### Contoh Create Field:

```json
POST /api/form-fields
{
  "fieldKey": "nama_lengkap",
  "label": "Nama Lengkap",
  "fieldType": "text",
  "groupName": "Data Pribadi",
  "placeholder": "Masukkan nama",
  "isRequired": true,
  "sortOrder": 1
}
```

### Contoh Field dengan Options:

```json
POST /api/form-fields
{
  "fieldKey": "jenis_kelamin",
  "label": "Jenis Kelamin",
  "fieldType": "radio",
  "groupName": "Data Pribadi",
  "isRequired": true,
  "options": [
    { "value": "L", "label": "Laki-laki" },
    { "value": "P", "label": "Perempuan" }
  ]
}
```

### System Fields:
Field dengan `isSystemField: true` tidak dapat dihapus dan hanya label/placeholder yang bisa diedit. Ini untuk menjaga integritas data utama form.

---

## 🤖 Integrasi Telegram Bot

### Setup Bot Telegram:

1. **Buat Bot di Telegram:**
   - Buka Telegram dan cari @BotFather
   - Ketik `/newbot` dan ikuti instruksi
   - Simpan token yang diberikan

2. **Konfigurasi Token:**
   ```bash
   # Edit file backend/.env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   ```

3. **Push Schema Database:**
   ```bash
   cd backend
   npx drizzle-kit push
   ```

4. **Set Webhook (setelah backend berjalan):**
   ```
   GET http://localhost:3000/api/telegram/set-webhook?url=https://your-domain.com/api/telegram/webhook
   ```
   
   Untuk development dengan ngrok:
   ```bash
   ngrok http 3000
   # Kemudian set webhook dengan URL ngrok
   ```

### Perintah Bot:
- `/start` - Memulai bot
- `/daftar [NIK]` - Mendaftarkan notifikasi untuk NIK tertentu
- `/cek [NOMOR_TIKET]` - Mengecek status tiket
- `/help` - Bantuan

### Alur Notifikasi:
1. User submit permohonan kendaraan → mendapat nomor tiket
2. User klik link Telegram atau copy nomor tiket
3. User daftar di bot dengan `/daftar [NIK]`
4. Sistem mengirim notifikasi ke user saat ada update status

---

## 🚀 Deployment Guide

### Data yang Diseed (seed.ts)

Menjalankan `npm run db:seed` akan membuat data berikut:

#### 1. Admin Users:
| Username | Password | Role | Email |
|----------|----------|------|-------|
| `admin` | `admin123` | admin | admin@lpkimm.com |
| `superadmin` | `superadmin123` | superadmin | superadmin@lpkimm.com |

#### 2. Departments:
- Human Resource
- Finance
- IT
- Marketing
- Operations
- General Affairs
- Production
- Quality Control

#### 3. Sample Vehicles:
- Toyota Avanza (Mobil)
- Honda Jazz (Mobil)
- Yamaha NMAX (Motor)

#### 4. Form Fields (Kelola Pertanyaan):
| Field Key | Label | Type | Group |
|-----------|-------|------|-------|
| `ketentuan` | Ketentuan Peminjaman Kendaraan | select* | Ketentuan |
| `jenis_layanan` | Jenis Layanan | radio | Layanan |
| `nama_lengkap` | Nama Lengkap | text | Data Diri |
| `nomor_induk_kependudukan` | NIK | text | Data Diri |
| `alamat_email` | Alamat Email | text | Data Diri |
| `department_bagian` | Department/Bagian | select | Data Diri |
| `jenis_keperluan_kendaraan` | Jenis Keperluan | radio | Keperluan Kendaraan |
| `alasan_keperluan_kendaraan` | Alasan Keperluan | textarea | Keperluan Kendaraan |
| `lokasi_tempat_tujuan` | Lokasi Tempat Tujuan | radio | Lokasi |
| `tanggal_mulai` | Dibutuhkan Pada | date | Waktu Peminjaman |
| `tanggal_selesai` | Kembali Pada | date | Waktu Peminjaman |
| `persetujuan_ketentuan` | Persetujuan | radio | Persetujuan |

**Note:** Field `ketentuan` menggunakan type `select` untuk menyimpan poin-poin ketentuan sebagai options, namun ditampilkan sebagai bullet list (bukan dropdown) di form. Admin dapat menambah/mengedit/menghapus poin ketentuan melalui halaman Kelola Pertanyaan.

### Langkah Deployment:

#### 1. Setup Database Produksi
```powershell
# Set DATABASE_URL di environment production
DATABASE_URL=postgresql://user:password@host:port/database
```

#### 2. Push Schema & Seed
```powershell
cd backend
npm install
npx drizzle-kit push    # Push schema ke database
npm run db:seed         # Insert data awal
```

#### 3. Build & Start
```powershell
# Backend
cd backend
npm run start

# Frontend
cd frontend
npm run build
npm run preview
```

### Fresh Deployment (Reset Database)
```powershell
# 1. Drop & recreate database
# 2. Push schema
npx drizzle-kit push

# 3. Seed data
npm run db:seed
```

---

## 📝 API Logging

Semua request API dicatat ke file log untuk debugging dan monitoring.

### Lokasi Log Files
```
backend/logs/
├── api-2026-02-16.log    # Log per tanggal
├── api-2026-02-17.log
└── ...
```

### Format Log Entry
```json
{
  "timestamp": "2026-02-16T10:30:45.123Z",
  "method": "POST",
  "url": "/api/vehicle-requests",
  "status": 201,
  "duration": 45,
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "body": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "[REDACTED]"
  }
}
```

### Features:
- ✅ Log ke file harian (`api-YYYY-MM-DD.log`)
- ✅ Redact sensitive data (password, token)
- ✅ Catat request body untuk POST/PUT/PATCH
- ✅ Catat query parameters
- ✅ Catat error messages
- ✅ Console output dengan color-coded status

### Melihat Log
```powershell
# Lihat log hari ini
Get-Content backend/logs/api-$(Get-Date -Format "yyyy-MM-dd").log

# Tail log (realtime)
Get-Content backend/logs/api-$(Get-Date -Format "yyyy-MM-dd").log -Wait

# Cari error di log
Select-String -Path "backend/logs/*.log" -Pattern '"status":5'
```

---

## 🔧 Typed API Service

Frontend menggunakan typed API service dengan interface yang jelas.

### Penggunaan di Component

```tsx
import { getUsers, createUser, type User, type CreateUserParams } from '../services/apiService';

const MyComponent = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Type-safe params - defined at initiator level
    const params: CreateUserParams = {
      username: 'john_doe',
      password: 'secure123',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      departmentId: 1,
    };

    try {
      setSaving(true);
      const newUser = await createUser(params);
      setUsers([...users, newUser]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };
};
```

### Available Types (from `frontend/src/types/index.ts`)

| Type | Description |
|------|-------------|
| `User`, `CreateUserParams`, `UpdateUserParams` | User data types |
| `Department`, `CreateDepartmentParams`, `UpdateDepartmentParams` | Department types |
| `Vehicle`, `CreateVehicleParams`, `UpdateVehicleParams` | Vehicle types |
| `VehicleRequest`, `CreateVehicleRequestParams` | Request types |
| `FormField`, `CreateFormFieldParams`, `UpdateFormFieldParams` | Form field types |
| `LoginResponse` | Auth response type |

### Key Principles:
1. **Try/Catch/Finally** - Handle errors at component level
2. **Typed Params** - Define params with interface at initiator
3. **No filtering in service** - Pass params directly, no conditional logic
4. **Return types** - All functions have explicit return types

---
