import { z } from 'zod'

// ============================================================================
// NOTIFICATION VALIDATIONS
// ============================================================================

/**
 * Notification list query params.
 */
export const notificationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int('Page must be a whole number')
        .positive('Page must be positive')
        .default(1),
    pageSize: z.coerce
        .number()
        .int('Page size must be a whole number')
        .min(1, 'Page size must be at least 1')
        .max(50, 'Page size must be at most 50')
        .default(15),
    unreadOnly: z.coerce.boolean().default(false),
})

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>
