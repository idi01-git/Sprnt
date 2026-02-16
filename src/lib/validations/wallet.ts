import { z } from 'zod'

// ============================================================================
// WALLET & WITHDRAWAL VALIDATIONS
// ============================================================================

/**
 * Withdrawal request body schema.
 * - amount: minimum ₹100
 * - upiId: standard UPI format (e.g., user@upi, user@paytm)
 */
export const withdrawalRequestSchema = z.object({
    amount: z
        .number({ error: 'Amount is required' })
        .positive('Amount must be positive')
        .min(100, 'Minimum withdrawal amount is ₹100')
        .max(50000, 'Maximum withdrawal amount is ₹50,000'),
    upiId: z
        .string({ error: 'UPI ID is required' })
        .min(5, 'UPI ID is too short')
        .max(100, 'UPI ID is too long')
        .regex(
            /^[\w.\-]+@[\w]+$/,
            'Invalid UPI ID format (e.g., user@upi)'
        ),
})

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>

/**
 * Transaction history query params.
 */
export const transactionQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    type: z
        .enum([
            'course_purchase',
            'referral_bonus',
            'withdrawal',
            'refund',
            'admin_credit',
            'admin_debit',
        ])
        .optional(),
})

export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
