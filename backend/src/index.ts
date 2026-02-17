import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiLogger } from './middleware/apiLogger';
import authRoutes from './routes/auth';
import vehiclesRoutes from './routes/vehicles';
import usersRoutes from './routes/users';
import departmentsRoutes from './routes/departments';
import vehicleRequestsRoutes from './routes/vehicleRequests';
import telegramRoutes from './routes/telegram';
import formFieldsRoutes from './routes/formFields';
import { db } from './db';
import { users, departments, formFields } from './db/schema';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const app = new Hono();

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

console.log('Allowed origins:', allowedOrigins);

// Middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return '*';
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return origin;
    }
    // In production, also allow Railway domains
    if (origin.endsWith('.up.railway.app')) {
      return origin;
    }
    console.log('CORS blocked origin:', origin);
    return origin; // Allow all for now to debug, tighten later
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use('*', apiLogger);

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'LPK IMM Vehicle Request API', 
    status: 'running',
    version: '1.0.0'
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/vehicles', vehiclesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/departments', departmentsRoutes);
app.route('/api/vehicle-requests', vehicleRequestsRoutes);
app.route('/api/telegram', telegramRoutes);
app.route('/api/form-fields', formFieldsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = parseInt(process.env.PORT || '3000');

// Auto-seed database if empty (for fresh deployments)
async function autoSeed() {
  try {
    // Check if departments exist
    const deptCount = await db.select({ count: sql<number>`count(*)` }).from(departments);
    const count = Number(deptCount[0]?.count || 0);
    
    if (count === 0) {
      console.log('🌱 Database is empty, running auto-seed...');
      // Import and run seed
      const { default: runSeed } = await import('./db/autoSeed');
      await runSeed();
      console.log('✅ Auto-seed completed!');
    } else {
      console.log(`📊 Database already has ${count} departments, skipping seed.`);
    }
  } catch (error) {
    console.error('⚠️ Auto-seed error (tables may not exist yet):', error);
  }
}

// Start server
autoSeed().then(() => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
});
