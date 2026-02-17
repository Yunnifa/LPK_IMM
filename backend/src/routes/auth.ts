import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const auth = new Hono();
const JWT_SECRET = process.env.JWT_SECRET!;

// Login
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Register
auth.post('/register', async (c) => {
  try {
    const { username, password, fullName, email, phone, birthdate, role, departmentId } = await c.req.json();

    if (!username || !password || !fullName) {
      return c.json({ error: 'Username, password, and fullName are required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        fullName,
        email,
        phone,
        birthdate: birthdate || null,
        role: role || 'user',
        departmentId: departmentId || null,
      })
      .returning();

    return c.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        birthdate: newUser.birthdate,
      },
    }, 201);
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return c.json({ error: 'Username or email already exists' }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
