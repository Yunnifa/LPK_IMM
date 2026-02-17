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
import { departments } from './db/schema';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

// ── Global error handlers to prevent silent crashes ──
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});

const app = new Hono();
const port = parseInt(process.env.PORT || '3000');

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

console.log('Allowed origins:', allowedOrigins);
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware - CORS
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0] || '*';
    if (allowedOrigins.includes(origin)) return origin;
    if (origin.endsWith('.up.railway.app')) return origin;
    // Still allow for debugging
    console.log('CORS: unknown origin', origin);
    return origin;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}));

// Middleware - Logger
app.use('*', apiLogger);

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'LPK IMM Vehicle Request API', 
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
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
  console.error('Hono error handler:', err.message, err.stack);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Auto-seed database if empty (for fresh deployments)
async function autoSeed() {
  try {
    const deptCount = await db.select({ count: sql<number>`count(*)` }).from(departments);
    const count = Number(deptCount[0]?.count || 0);
    
    if (count === 0) {
      console.log('🌱 Database is empty, running auto-seed...');
      const { default: runSeed } = await import('./db/autoSeed');
      await runSeed();
      console.log('✅ Auto-seed completed!');
    } else {
      console.log(`📊 Database already has ${count} departments, skipping seed.`);
    }
  } catch (error) {
    console.error('⚠️ Auto-seed error:', error);
  }
}

// Start server immediately, seed in background
const server = serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`🚀 Server is running on http://${info.address}:${info.port}`);
  // Seed after server is listening
  autoSeed().catch((err) => console.error('Seed error:', err));
});
