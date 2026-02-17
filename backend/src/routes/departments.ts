import { Hono } from 'hono';
import { db } from '../db';
import { departments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { HonoEnv } from '../types';

const departmentsRoute = new Hono<HonoEnv>();

// Get all departments (public)
departmentsRoute.get('/', async (c) => {
  try {
    const allDepartments = await db.select().from(departments);
    return c.json(allDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get department by id
departmentsRoute.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const [department] = await db.select().from(departments).where(eq(departments.id, id));

    if (!department) {
      return c.json({ error: 'Department not found' }, 404);
    }

    return c.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create department (admin only)
departmentsRoute.post('/', authMiddleware, adminOnly, async (c) => {
  try {
    const departmentData = await c.req.json();
    const [newDepartment] = await db.insert(departments).values(departmentData).returning();
    return c.json(newDepartment, 201);
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === '23505') {
      return c.json({ error: 'Department name already exists' }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update department (admin only)
departmentsRoute.put('/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const departmentData = await c.req.json();
    
    const [updatedDepartment] = await db
      .update(departments)
      .set(departmentData)
      .where(eq(departments.id, id))
      .returning();

    if (!updatedDepartment) {
      return c.json({ error: 'Department not found' }, 404);
    }

    return c.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete department (admin only)
departmentsRoute.delete('/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await db.delete(departments).where(eq(departments.id, id));
    return c.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default departmentsRoute;
