import { z } from 'zod'

// =============================================================================
// MODULE 4: ENROLLMENT & PAYMENT VALIDATION SCHEMAS
// =============================================================================

/**
 * POST /api/promocode/validate — Validate a promocode
 */
export const validatePromocodeSchema = z.object({
    code: z.string().min(1).max(50).trim().toUpperCase(),
    /** Business-facing course identifier (e.g., "FSWD-101"), NOT the internal CUID */
    courseId: z.string().min(1),
})

/**
 * POST /api/enroll/create-order — Create Razorpay order
 */
export const createOrderSchema = z.object({
    /** Business-facing course identifier (e.g., "FSWD-101"), NOT the internal CUID */
    courseId: z.string().min(1),
    promocode: z.string().max(50).trim().toUpperCase().optional(),
})

/**
 * POST /api/enroll/verify-payment — Verify Razorpay payment
 */
export const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
})

/**
 * GET /api/enrollments — Query params for enrollment listing
 */
export const enrollmentListQuerySchema = z.object({
    status: z.enum(['in_progress', 'completed', 'all']).optional().default('all'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export type ValidatePromocodeInput = z.infer<typeof validatePromocodeSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
export type EnrollmentListQuery = z.infer<typeof enrollmentListQuerySchema>
