import { z } from 'zod'

// =============================================================================
// COURSE QUERY SCHEMAS
// =============================================================================

/**
 * GET /api/courses — Query params for course listing
 */
export const courseListQuerySchema = z.object({
    branch: z.enum([
        'Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS_IT',
    ]).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name']).optional().default('newest'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

/**
 * GET /api/courses/search — Search query
 */
export const courseSearchQuerySchema = z.object({
    q: z.string().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(20).optional().default(10),
})

export type CourseListQuery = z.infer<typeof courseListQuerySchema>
export type CourseSearchQuery = z.infer<typeof courseSearchQuerySchema>
