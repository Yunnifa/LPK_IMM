import { Hono } from 'hono';
import { db } from '../db';
import { vehicleRequests, departments, users } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { sendTicketNotification, sendApprovalNotification } from './telegram';
import { HonoEnv } from '../types';

const vehicleRequestsRoute = new Hono<HonoEnv>();

// Generate ticket number GA-TR-XX
const generateTicketNumber = async () => {
  // Count existing requests
  const [result] = await db.select({ total: count() }).from(vehicleRequests);
  const nextNumber = (result?.total || 0) + 1;
  
  // Format: GA-TR-01, GA-TR-02, ... GA-TR-10, GA-TR-11, ...
  const paddedNumber = nextNumber.toString().padStart(2, '0');
  return `GA-TR-${paddedNumber}`;
};

// Get all vehicle requests (admin/superadmin only)
vehicleRequestsRoute.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const requests = await db
      .select({
        id: vehicleRequests.id,
        ticketNumber: vehicleRequests.ticketNumber,
        serviceType: vehicleRequests.serviceType,
        name: vehicleRequests.name,
        nik: vehicleRequests.nik,
        email: vehicleRequests.email,
        departmentId: vehicleRequests.departmentId,
        departmentName: departments.name,
        vehiclePurpose: vehicleRequests.vehiclePurpose,
        purposeReason: vehicleRequests.purposeReason,
        locationType: vehicleRequests.locationType,
        startDate: vehicleRequests.startDate,
        endDate: vehicleRequests.endDate,
        status: vehicleRequests.status,
        approval1: vehicleRequests.approval1,
        approval2: vehicleRequests.approval2,
        approval3: vehicleRequests.approval3,
        approval4: vehicleRequests.approval4,
        approvedBy: vehicleRequests.approvedBy,
        approvedAt: vehicleRequests.approvedAt,
        rejectionReason: vehicleRequests.rejectionReason,
        createdAt: vehicleRequests.createdAt,
      })
      .from(vehicleRequests)
      .leftJoin(departments, eq(vehicleRequests.departmentId, departments.id))
      .orderBy(desc(vehicleRequests.createdAt));

    return c.json(requests);
  } catch (error) {
    console.error('Error fetching vehicle requests:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Search ticket by ticket number (PUBLIC - no auth required)
vehicleRequestsRoute.get('/search/:ticketNumber', async (c) => {
  try {
    const ticketNumber = c.req.param('ticketNumber');
    
    const [request] = await db
      .select({
        id: vehicleRequests.id,
        ticketNumber: vehicleRequests.ticketNumber,
        serviceType: vehicleRequests.serviceType,
        name: vehicleRequests.name,
        nik: vehicleRequests.nik,
        email: vehicleRequests.email,
        departmentName: departments.name,
        vehiclePurpose: vehicleRequests.vehiclePurpose,
        purposeReason: vehicleRequests.purposeReason,
        locationType: vehicleRequests.locationType,
        startDate: vehicleRequests.startDate,
        endDate: vehicleRequests.endDate,
        status: vehicleRequests.status,
        // Approval levels
        approval1: vehicleRequests.approval1,
        approval1At: vehicleRequests.approval1At,
        approval1Notes: vehicleRequests.approval1Notes,
        approval2: vehicleRequests.approval2,
        approval2At: vehicleRequests.approval2At,
        approval2Notes: vehicleRequests.approval2Notes,
        approval3: vehicleRequests.approval3,
        approval3At: vehicleRequests.approval3At,
        approval3Notes: vehicleRequests.approval3Notes,
        approval4: vehicleRequests.approval4,
        approval4At: vehicleRequests.approval4At,
        approval4Notes: vehicleRequests.approval4Notes,
        createdAt: vehicleRequests.createdAt,
      })
      .from(vehicleRequests)
      .leftJoin(departments, eq(vehicleRequests.departmentId, departments.id))
      .where(eq(vehicleRequests.ticketNumber, ticketNumber.toUpperCase()));

    if (!request) {
      return c.json({ error: 'Tiket tidak ditemukan' }, 404);
    }

    return c.json(request);
  } catch (error) {
    console.error('Error searching ticket:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get vehicle request by id (admin only)
vehicleRequestsRoute.get('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const [request] = await db
      .select({
        id: vehicleRequests.id,
        ticketNumber: vehicleRequests.ticketNumber,
        serviceType: vehicleRequests.serviceType,
        name: vehicleRequests.name,
        nik: vehicleRequests.nik,
        email: vehicleRequests.email,
        departmentId: vehicleRequests.departmentId,
        departmentName: departments.name,
        vehiclePurpose: vehicleRequests.vehiclePurpose,
        purposeReason: vehicleRequests.purposeReason,
        locationType: vehicleRequests.locationType,
        startDate: vehicleRequests.startDate,
        endDate: vehicleRequests.endDate,
        status: vehicleRequests.status,
        approvedBy: vehicleRequests.approvedBy,
        approvedAt: vehicleRequests.approvedAt,
        rejectionReason: vehicleRequests.rejectionReason,
        createdAt: vehicleRequests.createdAt,
      })
      .from(vehicleRequests)
      .leftJoin(departments, eq(vehicleRequests.departmentId, departments.id))
      .where(eq(vehicleRequests.id, id));

    if (!request) {
      return c.json({ error: 'Vehicle request not found' }, 404);
    }

    return c.json(request);
  } catch (error) {
    console.error('Error fetching vehicle request:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create vehicle request (PUBLIC - no auth required)
vehicleRequestsRoute.post('/', async (c) => {
  try {
    const requestData = await c.req.json();
    const ticketNumber = await generateTicketNumber();

    const [newRequest] = await db
      .insert(vehicleRequests)
      .values({
        ticketNumber,
        serviceType: requestData.serviceType,
        name: requestData.name,
        nik: requestData.nik,
        email: requestData.email,
        departmentId: requestData.departmentId,
        vehiclePurpose: requestData.vehiclePurpose,
        purposeReason: requestData.purposeReason,
        locationType: requestData.locationType,
        startDate: new Date(requestData.startDate),
        endDate: new Date(requestData.endDate),
        agreement: requestData.agreement,
        status: 'pending',
      })
      .returning();

    // Send Telegram notification to Head Dept + Superadmins
    try {
      await sendTicketNotification(requestData.nik, ticketNumber, requestData.name, requestData.departmentId);
    } catch (telegramError) {
      console.error('Error sending Telegram notification:', telegramError);
      // Don't fail the request if Telegram notification fails
    }

    return c.json({ 
      ...newRequest, 
      ticketNumber,
      message: 'Permintaan berhasil dikirim' 
    }, 201);
  } catch (error) {
    console.error('Error creating vehicle request:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update vehicle request status (admin/superadmin only)
vehicleRequestsRoute.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const id = parseInt(c.req.param('id'));
    const { status, rejectionReason } = await c.req.json();

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'approved' || status === 'rejected') {
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const [updatedRequest] = await db
      .update(vehicleRequests)
      .set(updateData)
      .where(eq(vehicleRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return c.json({ error: 'Vehicle request not found' }, 404);
    }

    return c.json(updatedRequest);
  } catch (error) {
    console.error('Error updating vehicle request:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 4-Level approval endpoint (3 levels for desa_binaan, 4 levels for non-desa_binaan)
vehicleRequestsRoute.patch('/:id/approval', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const id = parseInt(c.req.param('id'));
    const { level, status, notes } = await c.req.json();

    // Get current request to check approval chain and locationType
    const [currentRequest] = await db
      .select()
      .from(vehicleRequests)
      .where(eq(vehicleRequests.id, id));

    if (!currentRequest) {
      return c.json({ error: 'Vehicle request not found' }, 404);
    }

    // Determine max levels based on locationType
    // desa_binaan = 3 levels, non_desa_binaan (or anything else) = 4 levels
    const isDesaBinaan = currentRequest.locationType === 'desa_binaan';
    const maxLevels = isDesaBinaan ? 3 : 4;
    const validLevels = isDesaBinaan ? [1, 2, 3] : [1, 2, 3, 4];

    // Validate level
    if (!validLevels.includes(level)) {
      return c.json({ error: `Invalid approval level. Must be ${validLevels.join(', ')} for ${isDesaBinaan ? 'Desa Binaan' : 'Non-Desa Binaan'}` }, 400);
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Invalid status. Must be approved or rejected' }, 400);
    }

    // Check approval chain - previous levels must be approved
    if (level > 1) {
      const prevLevel = level - 1;
      const prevApprovalField = `approval${prevLevel}` as keyof typeof currentRequest;
      if (currentRequest[prevApprovalField] !== 'approved') {
        return c.json({ error: `Approval ${prevLevel} must be approved first` }, 400);
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Set the approval field based on level
    updateData[`approval${level}`] = status;
    updateData[`approval${level}By`] = user.id;
    updateData[`approval${level}At`] = new Date();
    updateData[`approval${level}Notes`] = notes || null;

    // If rejected, set overall status to rejected
    if (status === 'rejected') {
      updateData.status = 'rejected';
      updateData.rejectionReason = notes || null;
    }

    // Check if this is the final approval level
    const isFinalLevel = level === maxLevels;
    if (isFinalLevel && status === 'approved') {
      updateData.status = 'approved';
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    }

    const [updatedRequest] = await db
      .update(vehicleRequests)
      .set(updateData)
      .where(eq(vehicleRequests.id, id))
      .returning();

    // Send Telegram notification to user about approval update
    try {
      if (updatedRequest.ticketNumber) {
        await sendApprovalNotification(
          updatedRequest.ticketNumber,
          level,
          status,
          notes || undefined
        );
      }
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
    }

    return c.json(updatedRequest);
  } catch (error) {
    console.error('Error updating approval:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete vehicle request (admin/superadmin only)
vehicleRequestsRoute.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const id = parseInt(c.req.param('id'));

    const [deletedRequest] = await db
      .delete(vehicleRequests)
      .where(eq(vehicleRequests.id, id))
      .returning();

    if (!deletedRequest) {
      return c.json({ error: 'Vehicle request not found' }, 404);
    }

    return c.json({ message: 'Vehicle request deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle request:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default vehicleRequestsRoute;
