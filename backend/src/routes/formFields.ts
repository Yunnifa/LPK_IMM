import { Hono } from 'hono';
import { db } from '../db';
import { formFields, formFieldOptions, formResponses } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';

const formFieldsRouter = new Hono();

// ========================
// GET /api/form-fields - Get all active form fields with options
// ========================
formFieldsRouter.get('/', async (c) => {
  try {
    const fields = await db.query.formFields.findMany({
      where: eq(formFields.isActive, true),
      orderBy: [asc(formFields.sortOrder)],
      with: {
        options: {
          where: eq(formFieldOptions.isActive, true),
          orderBy: [asc(formFieldOptions.sortOrder)],
        },
      },
    });

    return c.json(fields);
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return c.json({ error: 'Failed to fetch form fields' }, 500);
  }
});

// ========================
// GET /api/form-fields/all - Get all form fields (including inactive) - Admin only
// ========================
formFieldsRouter.get('/all', async (c) => {
  try {
    const fields = await db.query.formFields.findMany({
      orderBy: [asc(formFields.sortOrder)],
      with: {
        options: {
          orderBy: [asc(formFieldOptions.sortOrder)],
        },
      },
    });

    return c.json(fields);
  } catch (error) {
    console.error('Error fetching all form fields:', error);
    return c.json({ error: 'Failed to fetch form fields' }, 500);
  }
});

// ========================
// GET /api/form-fields/:id - Get single form field
// ========================
formFieldsRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const field = await db.query.formFields.findFirst({
      where: eq(formFields.id, id),
      with: {
        options: {
          orderBy: [asc(formFieldOptions.sortOrder)],
        },
      },
    });

    if (!field) {
      return c.json({ error: 'Form field not found' }, 404);
    }

    return c.json(field);
  } catch (error) {
    console.error('Error fetching form field:', error);
    return c.json({ error: 'Failed to fetch form field' }, 500);
  }
});

// ========================
// POST /api/form-fields - Create new form field
// ========================
formFieldsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      fieldKey, 
      label, 
      fieldType, 
      groupName, 
      placeholder, 
      helpText, 
      validationRules, 
      defaultValue, 
      sortOrder, 
      isRequired, 
      isSystemField,
      options // Array of { value, label, sortOrder }
    } = body;

    // Validate required fields
    if (!fieldKey || !label || !fieldType) {
      return c.json({ error: 'fieldKey, label, and fieldType are required' }, 400);
    }

    // Create field
    const [newField] = await db.insert(formFields).values({
      fieldKey,
      label,
      fieldType,
      groupName,
      placeholder,
      helpText,
      validationRules: validationRules ? JSON.stringify(validationRules) : null,
      defaultValue,
      sortOrder: sortOrder || 0,
      isRequired: isRequired || false,
      isSystemField: isSystemField || false,
    }).returning();

    // Create options if provided (for select, radio, checkbox)
    if (options && Array.isArray(options) && options.length > 0) {
      await db.insert(formFieldOptions).values(
        options.map((opt: { value: string; label: string; sortOrder?: number }, index: number) => ({
          fieldId: newField.id,
          value: opt.value,
          label: opt.label,
          sortOrder: opt.sortOrder ?? index,
        }))
      );
    }

    // Return field with options
    const fieldWithOptions = await db.query.formFields.findFirst({
      where: eq(formFields.id, newField.id),
      with: { options: true },
    });

    return c.json(fieldWithOptions, 201);
  } catch (error: unknown) {
    console.error('Error creating form field:', error);
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      return c.json({ error: 'Field key already exists' }, 400);
    }
    return c.json({ error: 'Failed to create form field' }, 500);
  }
});

// ========================
// PUT /api/form-fields/:id - Update form field
// ========================
formFieldsRouter.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { 
      fieldKey, 
      label, 
      fieldType, 
      groupName, 
      placeholder, 
      helpText, 
      validationRules, 
      defaultValue, 
      sortOrder, 
      isRequired, 
      isActive,
      options // Array of { id?, value, label, sortOrder, isActive? }
    } = body;

    // Check if field exists
    const existingField = await db.query.formFields.findFirst({
      where: eq(formFields.id, id),
    });

    if (!existingField) {
      return c.json({ error: 'Form field not found' }, 404);
    }

    // Update all fields
    await db.update(formFields).set({
      fieldKey: fieldKey ?? existingField.fieldKey,
      label: label ?? existingField.label,
      fieldType: fieldType ?? existingField.fieldType,
      groupName: groupName !== undefined ? groupName : existingField.groupName,
      placeholder: placeholder !== undefined ? placeholder : existingField.placeholder,
      helpText: helpText !== undefined ? helpText : existingField.helpText,
      validationRules: validationRules ? JSON.stringify(validationRules) : existingField.validationRules,
      defaultValue: defaultValue !== undefined ? defaultValue : existingField.defaultValue,
      sortOrder: sortOrder ?? existingField.sortOrder,
      isRequired: isRequired ?? existingField.isRequired,
      isActive: isActive ?? existingField.isActive,
      updatedAt: new Date(),
    }).where(eq(formFields.id, id));

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Get existing option IDs
      const existingOptions = await db.query.formFieldOptions.findMany({
        where: eq(formFieldOptions.fieldId, id),
      });
      const existingOptionIds = existingOptions.map(o => o.id);
      const providedOptionIds = options.filter((o: { id?: number }) => o.id).map((o: { id: number }) => o.id);

      // Delete removed options
      for (const existingId of existingOptionIds) {
        if (!providedOptionIds.includes(existingId)) {
          await db.delete(formFieldOptions).where(eq(formFieldOptions.id, existingId));
        }
      }

      // Update or insert options
      for (const opt of options) {
        if (opt.id) {
          // Update existing
          await db.update(formFieldOptions).set({
            value: opt.value,
            label: opt.label,
            sortOrder: opt.sortOrder,
            isActive: opt.isActive ?? true,
          }).where(eq(formFieldOptions.id, opt.id));
        } else {
          // Insert new
          await db.insert(formFieldOptions).values({
            fieldId: id,
            value: opt.value,
            label: opt.label,
            sortOrder: opt.sortOrder ?? 0,
          });
        }
      }
    }

    // Return updated field with options
    const updatedField = await db.query.formFields.findFirst({
      where: eq(formFields.id, id),
      with: { options: { orderBy: [asc(formFieldOptions.sortOrder)] } },
    });

    return c.json(updatedField);
  } catch (error: unknown) {
    console.error('Error updating form field:', error);
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      return c.json({ error: 'Field key already exists' }, 400);
    }
    return c.json({ error: 'Failed to update form field' }, 500);
  }
});

// ========================
// DELETE /api/form-fields/:id - Soft delete form field
// ========================
formFieldsRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    const field = await db.query.formFields.findFirst({
      where: eq(formFields.id, id),
    });

    if (!field) {
      return c.json({ error: 'Form field not found' }, 404);
    }

    // Soft delete
    await db.update(formFields).set({ 
      isActive: false,
      updatedAt: new Date(),
    }).where(eq(formFields.id, id));

    return c.json({ message: 'Form field deleted successfully' });
  } catch (error) {
    console.error('Error deleting form field:', error);
    return c.json({ error: 'Failed to delete form field' }, 500);
  }
});

// ========================
// POST /api/form-fields/reorder - Reorder form fields
// ========================
formFieldsRouter.post('/reorder', async (c) => {
  try {
    const body = await c.req.json();
    const { fieldOrders } = body; // Array of { id, sortOrder }

    if (!fieldOrders || !Array.isArray(fieldOrders)) {
      return c.json({ error: 'fieldOrders array is required' }, 400);
    }

    for (const order of fieldOrders) {
      await db.update(formFields)
        .set({ sortOrder: order.sortOrder, updatedAt: new Date() })
        .where(eq(formFields.id, order.id));
    }

    return c.json({ message: 'Fields reordered successfully' });
  } catch (error) {
    console.error('Error reordering form fields:', error);
    return c.json({ error: 'Failed to reorder form fields' }, 500);
  }
});

// ========================
// GET /api/form-fields/responses/:requestId - Get responses for a request
// ========================
formFieldsRouter.get('/responses/:requestId', async (c) => {
  try {
    const requestId = parseInt(c.req.param('requestId'));

    const responses = await db.query.formResponses.findMany({
      where: eq(formResponses.requestId, requestId),
      with: {
        field: true,
      },
    });

    return c.json(responses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return c.json({ error: 'Failed to fetch responses' }, 500);
  }
});

// ========================
// POST /api/form-fields/responses - Save responses for a request
// ========================
formFieldsRouter.post('/responses', async (c) => {
  try {
    const body = await c.req.json();
    const { requestId, responses } = body; // responses: Array of { fieldId, fieldKey, value }

    if (!requestId || !responses || !Array.isArray(responses)) {
      return c.json({ error: 'requestId and responses array are required' }, 400);
    }

    // Delete existing responses for this request (for re-submission)
    await db.delete(formResponses).where(eq(formResponses.requestId, requestId));

    // Insert new responses
    if (responses.length > 0) {
      await db.insert(formResponses).values(
        responses.map((r: { fieldId: number; fieldKey: string; value: string }) => ({
          requestId,
          fieldId: r.fieldId,
          fieldKey: r.fieldKey,
          value: r.value,
        }))
      );
    }

    return c.json({ message: 'Responses saved successfully' }, 201);
  } catch (error) {
    console.error('Error saving form responses:', error);
    return c.json({ error: 'Failed to save responses' }, 500);
  }
});

export default formFieldsRouter;
