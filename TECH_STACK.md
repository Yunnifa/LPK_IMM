# Tech Stack - Sistem Layanan Peminjaman Kendaraan

## Overview

Aplikasi Sistem Layanan Peminjaman Kendaraan LPK IMM menggunakan arsitektur modern dengan pemisahan frontend dan backend yang jelas.

---

## Backend

### Framework & Runtime
| Technology | Version | Description |
|------------|---------|-------------|
| **Node.js** | 18.x | JavaScript runtime |
| **Hono** | ^4.6.0 | Lightweight web framework (faster than Express) |
| **@hono/node-server** | ^1.13.0 | Node.js adapter untuk Hono |
| **TypeScript** | ^5.6.0 | Static type checking |
| **tsx** | ^4.19.0 | TypeScript execution & watch mode |

### Database
| Technology | Version | Description |
|------------|---------|-------------|
| **PostgreSQL** | 15+ | Relational database |
| **Drizzle ORM** | ^0.33.0 | Type-safe ORM |
| **drizzle-kit** | ^0.24.0 | Database migrations & studio |
| **postgres** | ^3.4.0 | PostgreSQL client |

### Authentication & Security
| Technology | Version | Description |
|------------|---------|-------------|
| **jsonwebtoken** | ^9.0.2 | JWT authentication |
| **bcryptjs** | ^2.4.3 | Password hashing |

### Utilities
| Technology | Version | Description |
|------------|---------|-------------|
| **Zod** | ^3.23.0 | Schema validation |
| **dotenv** | ^17.2.3 | Environment variables |
| **@hono/swagger-ui** | ^0.4.0 | API documentation |

### Scripts
```bash
npm run dev          # Development dengan hot reload
npm run start        # Production start
npm run db:push      # Push schema ke database
npm run db:seed      # Seed data awal
npm run db:seed:fields  # Seed form fields
npm run db:studio    # Drizzle Studio GUI
```

---

## Frontend

### Framework & Build
| Technology | Version | Description |
|------------|---------|-------------|
| **React** | ^18.2.0 | UI library |
| **React Router DOM** | ^7.12.0 | Client-side routing |
| **TypeScript** | ^5.2.2 | Static type checking |
| **Vite** | ^5.0.8 | Build tool & dev server |
| **@vitejs/plugin-react** | ^4.2.1 | React plugin for Vite |

### Styling
| Technology | Version | Description |
|------------|---------|-------------|
| **Tailwind CSS** | ^3.4.0 | Utility-first CSS framework |
| **PostCSS** | ^8.4.32 | CSS transformation |
| **Autoprefixer** | ^10.4.16 | CSS vendor prefixing |

### HTTP & Data
| Technology | Version | Description |
|------------|---------|-------------|
| **Axios** | ^1.13.4 | HTTP client |

### Export & PDF
| Technology | Version | Description |
|------------|---------|-------------|
| **ExcelJS** | ^4.4.0 | Excel file generation (proper .xlsx) |
| **jsPDF** | ^2.5.1 | PDF generation |
| **jspdf-autotable** | ^3.8.0 | PDF table plugin |
| **xlsx** | ^0.18.5 | Excel parsing (import) |

### Linting
| Technology | Version | Description |
|------------|---------|-------------|
| **ESLint** | ^8.55.0 | Code linting |
| **@typescript-eslint** | ^6.0.0 | TypeScript ESLint rules |

### Scripts
```bash
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Deployment

### Platform
| Service | Purpose |
|---------|---------|
| **Railway** | Hosting (backend, frontend, PostgreSQL) |
| **Nixpacks** | Build system |

### Configuration Files
```
backend/
├── railway.toml     # Railway deployment config
├── nixpacks.toml    # Nixpacks build config
└── .env.example     # Environment template

frontend/
├── railway.toml     # Railway deployment config
└── nixpacks.toml    # Nixpacks build config
```

### Environment Variables

**Backend:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-32-char-string>
ALLOWED_ORIGINS=https://frontend.up.railway.app
PORT=3000
TELEGRAM_BOT_TOKEN=<optional>
```

**Frontend:**
```env
VITE_API_URL=https://backend.up.railway.app/api
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React 18  │  │  Vite Build │  │   Tailwind CSS      │  │
│  │  + Router   │  │  + HMR      │  │   + Responsive      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│              ┌────────────┴────────────┐                    │
│              │   Axios HTTP Client     │                    │
│              └────────────┬────────────┘                    │
└───────────────────────────┼─────────────────────────────────┘
                            │ REST API
                            ▼
┌───────────────────────────┼─────────────────────────────────┐
│                        BACKEND                               │
│              ┌────────────┴────────────┐                    │
│              │     Hono Framework      │                    │
│              │   + CORS + API Logger   │                    │
│              └────────────┬────────────┘                    │
│                           │                                  │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────┐  │
│  │  JWT Auth   │  │   Routes    │  │   Zod Validation    │  │
│  │  + bcrypt   │  │   + CRUD    │  │   + Type Safety     │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │     Drizzle ORM       │                      │
│              └───────────┬───────────┘                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     PostgreSQL         │
              │   (Railway Postgres)   │
              └────────────────────────┘
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Vehicle Requests
- `GET /api/vehicle-requests` - Get all requests (admin)
- `GET /api/vehicle-requests/:ticketNumber` - Search by ticket
- `POST /api/vehicle-requests` - Create new request
- `PUT /api/vehicle-requests/:id/approve` - Approve request

### Form Fields (Dynamic Form)
- `GET /api/form-fields` - Get all form fields
- `POST /api/form-fields` - Create field
- `PUT /api/form-fields/:id` - Update field
- `DELETE /api/form-fields/:id` - Delete field

### Users
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

---

## Key Features

✅ **Dynamic Form System** - Form fields configurable via admin panel  
✅ **Multi-level Approval** - 4 approval levels (Head Dept → GA Transport → Head GA → Head GS)  
✅ **Ticket Tracking** - Public ticket search without login  
✅ **Excel Export** - Proper multi-column Excel with ExcelJS  
✅ **CSV/PDF Export** - Multiple export formats  
✅ **Responsive Design** - Mobile-friendly UI  
✅ **Telegram Integration** - Notification bot support  
✅ **Role-based Access** - admin, superadmin, approver roles  

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Performance

- **Frontend Bundle**: ~250KB gzipped
- **API Response**: <100ms average
- **Cold Start**: ~2s on Railway

---

*Last Updated: February 2026*
