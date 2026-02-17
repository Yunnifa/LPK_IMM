import { Hono } from 'hono';
import { db } from '../db';
import { rentals, vehicles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { HonoEnv } from '../types';

const rentalsRoute = new Hono<HonoEnv>();

// Get all rentals (admin/staff can see all, user can see their own)
rentalsRoute.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    let allRentals;
    if (user.role === 'admin' || user.role === 'staff') {
      allRentals = await db.select().from(rentals);
    } else {
      allRentals = await db.select().from(rentals).where(eq(rentals.userId, user.id));
    }

    return c.json(allRentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get rental by id
rentalsRoute.get('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');
    
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));

    if (!rental) {
      return c.json({ error: 'Rental not found' }, 404);
    }

    // Check if user has permission to view this rental
    if (user.role !== 'admin' && user.role !== 'staff' && rental.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create rental (authenticated users)
rentalsRoute.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const rentalData = await c.req.json();

    // Check if vehicle is available
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, rentalData.vehicleId));

    if (!vehicle) {
      return c.json({ error: 'Vehicle not found' }, 404);
    }

    if (vehicle.status !== 'available') {
      return c.json({ error: 'Vehicle is not available' }, 400);
    }

    const [newRental] = await db
      .insert(rentals)
      .values({
        ...rentalData,
        userId: user.id,
        status: 'pending',
      })
      .returning();

    return c.json(newRental, 201);
  } catch (error) {
    console.error('Error creating rental:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update rental status (admin/staff only)
rentalsRoute.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'staff') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const id = parseInt(c.req.param('id'));
    const { status } = await c.req.json();

    const [updatedRental] = await db
      .update(rentals)
      .set({
        status,
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, id))
      .returning();

    if (!updatedRental) {
      return c.json({ error: 'Rental not found' }, 404);
    }

    // Update vehicle status if rental is approved
    if (status === 'approved' || status === 'active') {
      await db
        .update(vehicles)
        .set({ status: 'rented' })
        .where(eq(vehicles.id, updatedRental.vehicleId));
    } else if (status === 'completed' || status === 'cancelled') {
      await db
        .update(vehicles)
        .set({ status: 'available' })
        .where(eq(vehicles.id, updatedRental.vehicleId));
    }

    return c.json(updatedRental);
  } catch (error) {
    console.error('Error updating rental:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Cancel rental (user can cancel their own pending rental)
rentalsRoute.patch('/:id/cancel', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));

    if (!rental) {
      return c.json({ error: 'Rental not found' }, 404);
    }

    if (rental.userId !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    if (rental.status !== 'pending') {
      return c.json({ error: 'Only pending rentals can be cancelled' }, 400);
    }

    const [updatedRental] = await db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(rentals.id, id))
      .returning();

    return c.json(updatedRental);
  } catch (error) {
    console.error('Error cancelling rental:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default rentalsRoute;
