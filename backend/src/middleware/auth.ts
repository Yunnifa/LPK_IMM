import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
};

export const adminOnly = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
};
