# Vehicle Rental System

Sistem Manajemen Peminjaman Kendaraan menggunakan React + TypeScript (Frontend) dan Hono + PostgreSQL (Backend).

## 🚀 Quick Start

### Prasyarat
- Node.js v18+
- PostgreSQL v15+
- npm atau yarn

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Setup Database**
- Buat database PostgreSQL dengan nama `vehicle_rental`
- Update `DATABASE_URL` di file `.env` jika perlu

3. **Push Schema ke Database**
```bash
npm run db:push
```

4. **Seed Database (Optional)**
```bash
npm run db:seed
```

5. **Jalankan Backend**
```bash
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Jalankan Frontend**
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 📋 Default Users (setelah seed)

- **Admin**: username: `admin`, password: `admin123`
- **Staff**: username: `staff`, password: `staff123`
- **User**: username: `user1`, password: `user123`

## 🏗️ Struktur Database

### Tables
- **users** - User accounts (admin, staff, user)
- **vehicles** - Vehicle inventory
- **rentals** - Rental transactions
- **payments** - Payment records
- **maintenance** - Vehicle maintenance history

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios
- Tailwind CSS

### Backend
- Hono (Fast web framework)
- TypeScript
- Drizzle ORM
- PostgreSQL
- JWT Authentication
- bcryptjs

## 📡 API Endpoints

### Auth
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register

### Vehicles
- GET `/api/vehicles` - Get all vehicles
- GET `/api/vehicles/:id` - Get vehicle by ID
- POST `/api/vehicles` - Create vehicle (admin only)
- PUT `/api/vehicles/:id` - Update vehicle (admin only)
- DELETE `/api/vehicles/:id` - Delete vehicle (admin only)

### Rentals
- GET `/api/rentals` - Get rentals (filtered by role)
- GET `/api/rentals/:id` - Get rental by ID
- POST `/api/rentals` - Create rental
- PATCH `/api/rentals/:id/status` - Update rental status (admin/staff)
- PATCH `/api/rentals/:id/cancel` - Cancel rental

### Users
- GET `/api/users` - Get all users (admin only)
- GET `/api/users/me` - Get current user profile
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user (admin only)

## 🔧 Development

### Backend Commands
```bash
npm run dev          # Run development server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
```

### Frontend Commands
```bash
npm run dev          # Run development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📝 Features

- ✅ User Authentication (JWT)
- ✅ Role-based Access Control (Admin, Staff, User)
- ✅ Vehicle Management
- ✅ Rental Management
- ✅ User Profile Management
- ✅ Responsive Design with Tailwind CSS

## 🔜 Next Steps

Aplikasi siap dikembangkan lebih lanjut. Beberapa fitur yang bisa ditambahkan:
- Payment integration
- Vehicle availability calendar
- Rental approval workflow
- Email notifications
- File upload for vehicle images
- Advanced filtering and search
- Reports and analytics

## 📄 License

MIT
