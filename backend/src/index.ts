import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiLogger } from './middleware/apiLogger';
import authRoutes from './routes/auth';
import vehiclesRoutes from './routes/vehicles';
import rentalsRoutes from './routes/rentals';
import usersRoutes from './routes/users';
import departmentsRoutes from './routes/departments';
import vehicleRequestsRoutes from './routes/vehicleRequests';
import telegramRoutes from './routes/telegram';
import formFieldsRoutes from './routes/formFields';
import 'dotenv/config';

const app = new Hono();

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

// Middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return '*';
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return origin;
    }
    return null;
  },
  credentials: true,
}));
app.use('*', apiLogger);

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Vehicle Rental API', 
    status: 'running',
    version: '1.0.0'
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/vehicles', vehiclesRoutes);
app.route('/api/rentals', rentalsRoutes);
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

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
