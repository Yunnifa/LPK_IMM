# Dokumentasi Halaman "Kelola Pertanyaan"

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Vue.js 3** | ^3.5.24 | Framework utama (Composition API + `<script setup>`) |
| **Vite** | ^7.2.4 | Build tool & dev server |
| **Vue Router** | ^4.6.4 | Client-side routing (SPA) |
| **Tailwind CSS** | ^4.1.18 | Utility-first CSS framework |
| **Heroicons Vue** | ^2.2.0 | Icon library (outline style) |
| **PostCSS** | ^8.5.6 | CSS post-processing |
| **Autoprefixer** | ^10.4.23 | Vendor prefix otomatis |
| Font | Montserrat | Font utama via `font-family` |

---

## Struktur File Terkait

```
frontend-lpk/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── kelola-pertanyaan.vue    ← Halaman utama (743 baris)
│   │   └── bar/
│   │       ├── aside.vue                ← Sidebar navigasi (363 baris)
│   │       └── header-admin.vue         ← Header admin (110 baris)
│   ├── composables/
│   │   └── useSideBar.js               ← Composable sidebar state
│   └── router/
│       └── index.js                     ← Routing (path: /kelola-pertanyaan)
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Cara Halaman Kelola Pertanyaan Dibangun

### 1. Layout Utama (`kelola-pertanyaan.vue`)

Layout menggunakan pola **flex full-height** khas admin panel:

```
┌──────────────────────────────────────────────┐
│ [Aside Sidebar] │ [Main Content Area]        │
│                 │ ┌────────────────────────┐ │
│  - Formulir     │ │ HeaderAdmin            │ │
│  - Data Monitor │ ├────────────────────────┤ │
│  - Kelola       │ │ Kelola Pertanyaan      │ │
│    Pertanyaan ← │ │ ┌────────────────────┐ │ │
│  - Master Data  │ │ │ Pertanyaan Card 1  │ │ │
│  - Profil       │ │ │ Pertanyaan Card 2  │ │ │
│                 │ │ │ ...                │ │ │
│                 │ │ └────────────────────┘ │ │
│                 │ └────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Kode Layout:**
```html
<div class="h-screen flex flex-col font-['Montserrat']">
  <div class="flex flex-1 overflow-hidden">
    <Aside />                          <!-- Sidebar -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <HeaderAdmin />                  <!-- Header -->
      <main class="bg-[#EFEFEF] flex-1 flex flex-col p-4 overflow-hidden">
        <!-- White card container -->
        <div class="bg-white rounded-xl shadow p-6 flex-1 flex flex-col overflow-hidden min-h-0">
          ...konten...
        </div>
      </main>
    </div>
  </div>
</div>
```

### 2. Data Model (Reactive State)

Setiap pertanyaan memiliki struktur:

```javascript
{
  id: Number,
  nama_tabel: String,       // Nama tabel di database
  label: String,             // Label pertanyaan yang ditampilkan
  jawaban_list: [            // Array jawaban
    {
      id: Number,
      tipe: "text" | "date" | "multiple",  // Tipe input
      label: String,                         // Label jawaban
      pilihan_list: String[]                 // Opsi (hanya untuk tipe "multiple")
    }
  ]
}
```

State management sepenuhnya menggunakan **Vue 3 `ref()`** tanpa Vuex/Pinia:

```javascript
const pertanyaanList = ref([...]);     // Daftar pertanyaan
const tambahPertanyaan = ref(false);   // Toggle modal tambah
const editPertanyaan = ref(false);     // Toggle modal edit
const formNamaTabel = ref("");         // Form input nama tabel
const formLabel = ref("");             // Form input label
const formJawabanList = ref([...]);    // Form daftar jawaban
```

### 3. Fitur-Fitur

#### a. Daftar Pertanyaan (List View)
- Menampilkan semua pertanyaan dalam card `bg-gray-50` dengan border
- Setiap card menunjukkan: nomor, label, nama tabel, dan daftar jawaban
- Badge warna ungu (`bg-[#6444C6]`) menunjukkan tipe jawaban
- Tombol **Edit** (ungu) dan **Hapus** (merah) di setiap card
- Empty state jika belum ada pertanyaan

#### b. Tambah Pertanyaan (Modal)
- Modal overlay `bg-black/50` dengan `z-50`
- Form: Nama Tabel, Label Pertanyaan, Daftar Jawaban
- Setiap jawaban bisa dipilih tipe: Text, Pilihan Ganda, Tanggal
- Tipe "Pilihan Ganda" menampilkan input opsi dinamis
- Validasi: nama tabel & label wajib diisi, minimal 1 jawaban, pilihan ganda minimal 2 opsi
- Klik di luar modal menutup modal (`@click.self`)

#### c. Edit Pertanyaan (Modal)
- Struktur sama dengan modal tambah
- Data pertanyaan yang dipilih di-load ke form edit
- State terpisah (`formEdit*`) untuk menghindari mutasi langsung
- Perubahan tipe jawaban ke "multiple" otomatis inisialisasi opsi

#### d. Hapus Pertanyaan
- Konfirmasi `confirm()` sebelum menghapus
- Menggunakan `splice()` untuk menghapus dari array

### 4. Komponen Pendukung

#### Aside (Sidebar)
- Navigasi menu dengan highlight aktif (indigo)
- Responsive: hidden di mobile, muncul sebagai overlay
- Menu collapse/expand untuk "Master Data"
- Dropdown pemilihan bahasa (Indonesia/English)
- Tombol Logout

#### HeaderAdmin
- Menampilkan judul halaman berdasarkan route
- Tanggal hari ini (format Indonesia)
- Info admin di kanan
- Tombol hamburger untuk mobile sidebar

#### Komunikasi Komponen
```
kelola-pertanyaan.vue
  ├── provide("isMobileMenuOpen", ref)     → Aside inject
  ├── provide("toggleMobileMenu", fn)      → HeaderAdmin inject
  ├── <Aside />
  └── <HeaderAdmin />
```

### 5. Styling & Design System

- **Warna utama**: `#6444C6` (ungu) untuk tombol, badge, dan aksen
- **Background**: `#EFEFEF` untuk area main, putih untuk card
- **Font**: Montserrat
- **Border radius**: `rounded-lg` (8px), `rounded-xl` (12px)
- **Responsive**: Menggunakan breakpoints Tailwind (`sm:`, `md:`, `lg:`)
- **Shadow**: `shadow`, `shadow-lg` untuk elevasi

### 6. Routing

Di `router/index.js`:
```javascript
{
  path: '/kelola-pertanyaan',
  name: 'kelola-pertanyaan',
  component: () => import('../components/admin/kelola-pertanyaan.vue')  // Lazy loaded
}
```

---

## Cara Menjalankan

```bash
cd frontend-lpk
npm install
npm run dev
```

Akses di browser: `http://localhost:5173/kelola-pertanyaan`
