import { Hono } from 'hono';
import { db } from '../db';
import { vehicles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middleware/auth';

const vehiclesRoute = new Hono();

// Get all vehicles
vehiclesRoute.get('/', async (c) => {
  try {
    const allVehicles = await db.select().from(vehicles);
    return c.json(allVehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get vehicle by id
vehiclesRoute.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));

    if (!vehicle) {
      return c.json({ error: 'Vehicle not found' }, 404);
    }

    return c.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create vehicle (admin only)
vehiclesRoute.post('/', authMiddleware, adminOnly, async (c) => {
  try {
    const vehicleData = await c.req.json();
    const [newVehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return c.json(newVehicle, 201);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.code === '23505') {
      return c.json({ error: 'License plate already exists' }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update vehicle (admin only)
vehiclesRoute.put('/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const vehicleData = await c.req.json();
    
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...vehicleData, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    if (!updatedVehicle) {
      return c.json({ error: 'Vehicle not found' }, 404);
    }

    return c.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete vehicle (admin only)
vehiclesRoute.delete('/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return c.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default vehiclesRoute;
