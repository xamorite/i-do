import { z } from 'zod';

/**
 * Validation schemas for API input validation
 * Using Zod for runtime type-safe validation
 */

// Task validation schema
export const taskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
    notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
    channel: z.enum(['Work', 'Personal', 'Health', 'Errands']).optional(),
    estimateMinutes: z.number().positive('Estimate must be positive').max(1440, 'Estimate cannot exceed 24 hours').optional(),
    actualMinutes: z.number().positive().max(1440).optional(),
    ownerId: z.string().optional(),
    accountabilityPartnerId: z.string().optional(),
    status: z.enum([
        'inbox',
        'backlog',
        'draft',
        'planned',
        'done',
        'pending_acceptance',
        'awaiting_approval',
        'rejected',
        'blocked'
    ]).optional(),
    plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Planned date must be in YYYY-MM-DD format').optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    tags: z.array(z.string()).optional(),
    isTimeboxed: z.boolean().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    originalIntegration: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrencePattern: z.string().optional(),
    rejectionReason: z.string().max(1000).optional(),
    projectId: z.string().optional(),
    sharedWith: z.array(z.object({
        userId: z.string(),
        role: z.enum(['viewer', 'commenter', 'accountability_partner']),
        addedAt: z.string(),
    })).optional(),
}).refine(
    (data) => {
        // Owner cannot be their own accountability partner
        if (data.accountabilityPartnerId && data.ownerId && data.accountabilityPartnerId === data.ownerId) {
            return false;
        }
        return true;
    },
    {
        message: 'Owner cannot be their own accountability partner',
        path: ['accountabilityPartnerId'],
    }
);

// Partial task schema for updates
export const taskUpdateSchema = taskSchema.partial();

// Partner request validation schema
export const partnerRequestSchema = z.object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
});

// Partner action validation schema
export const partnerActionSchema = z.object({
    action: z.enum(['accept', 'decline', 'block']),
});

// Notification validation schema
export const notificationSchema = z.object({
    recipientId: z.string().min(1),
    senderId: z.string().min(1),
    taskId: z.string().min(1),
    taskTitle: z.string().min(1),
    type: z.enum([
        'task_assigned',
        'task_accepted',
        'task_rejected',
        'task_submitted',
        'task_approved',
        'task_changes_requested'
    ]),
});

// Task action validation (for accountability actions)
export const taskActionSchema = z.object({
    action: z.enum(['accept', 'reject', 'submit', 'approve', 'request_changes']),
    rejectionReason: z.string().max(1000).optional(),
}).refine(
    (data) => {
        // If action is reject or request_changes, rejection reason should be provided
        if ((data.action === 'reject' || data.action === 'request_changes') && !data.rejectionReason) {
            return false;
        }
        return true;
    },
    {
        message: 'Rejection reason is required for reject or request_changes actions',
        path: ['rejectionReason'],
    }
);

// Helper function to validate and return formatted errors
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
    const result = schema.safeParse(data);
    if (!result.success) {
        return {
            success: false as const,
            error: result.error.format(),
        };
    }
    return {
        success: true as const,
        data: result.data,
    };
}
