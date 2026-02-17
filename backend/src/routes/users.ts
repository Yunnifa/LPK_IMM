import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { HonoEnv, JwtUser } from '../types';

const usersRoute = new Hono<HonoEnv>();

// Get all users (admin only)
usersRoute.get('/', authMiddleware, adminOnly, async (c) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        birthdate: users.birthdate,
        role: users.role,
        departmentId: users.departmentId,
        createdAt: users.createdAt,
      })
      .from(users);

    return c.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user profile
usersRoute.get('/me', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user') as JwtUser;
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        birthdate: users.birthdate,
        role: users.role,
        departmentId: users.departmentId,
      })
      .from(users)
      .where(eq(users.id, currentUser.id));

    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user (admin or own profile)
usersRoute.put('/:id', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user') as JwtUser;
    const id = parseInt(c.req.param('id'));
    const userData = await c.req.json();

    // Check permission
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Don't allow regular users to change their role
    if (currentUser.role !== 'admin' && userData.role) {
      delete userData.role;
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        birthdate: users.birthdate,
        role: users.role,
        departmentId: users.departmentId,
      });

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reset user password (admin only)
usersRoute.put('/:id/reset-password', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { password } = await c.req.json();

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
      });

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'Password reset successfully', user: updatedUser });
  } catch (error) {
    console.error('Error resetting password:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete user (admin only)
usersRoute.delete('/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await db.delete(users).where(eq(users.id, id));
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default usersRoute;
