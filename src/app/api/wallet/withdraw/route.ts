import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { withdrawalRequestSchema } from '@/lib/validations/wallet'

/**
 * POST /api/wallet/withdraw
 * Creates a new withdrawal request.
 * Validates balance, no pending request exists, and UPI ID is valid.
 * Uses Prisma $transaction for atomic balance check + request creation.
 * Auth: Student Session Cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Parse and validate body
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return badRequest('Invalid JSON body')
        }

        const parsed = withdrawalRequestSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { amount, upiId } = parsed.data

        // Atomic transaction: check balance + create withdrawal
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check for existing pending withdrawal
            const existingPending = await tx.withdrawalRequest.findFirst({
                where: { userId: user.id, status: 'pending' },
            })
            if (existingPending) {
                return { error: 'WALLET_WITHDRAWAL_PENDING' as const }
            }

            // 2. Get current balance
            const userData = await tx.user.findUnique({
                where: { id: user.id },
                select: { walletBalance: true },
            })

            const balance = Number(userData?.walletBalance ?? 0)
            if (balance < amount) {
                return { error: 'WALLET_INSUFFICIENT_BALANCE' as const }
            }

            // 3. Create withdrawal request
            const withdrawal = await tx.withdrawalRequest.create({
                data: {
                    userId: user.id,
                    amount,
                    upiId,
                    status: 'pending',
                },
            })

            // 4. Update user's UPI ID if different
            await tx.user.update({
                where: { id: user.id },
                data: { upiId },
            })

            return { withdrawal }
        })

        // Handle transaction result
        if ('error' in result) {
            if (result.error === 'WALLET_WITHDRAWAL_PENDING') {
                return createErrorResponse(
                    ErrorCode.WALLET_WITHDRAWAL_PENDING,
                    'You already have a pending withdrawal request',
                    HttpStatus.CONFLICT
                )
            }
            if (result.error === 'WALLET_INSUFFICIENT_BALANCE') {
                return createErrorResponse(
                    ErrorCode.WALLET_INSUFFICIENT_BALANCE,
                    'Insufficient wallet balance',
                    HttpStatus.UNPROCESSABLE_ENTITY
                )
            }
        }

        if (!('withdrawal' in result)) {
            return serverError('Unexpected error during withdrawal')
        }

        return createSuccessResponse(
            {
                withdrawal: {
                    id: result.withdrawal.id,
                    amount: Number(result.withdrawal.amount),
                    upiId: result.withdrawal.upiId,
                    status: result.withdrawal.status,
                    requestedAt: result.withdrawal.requestedAt,
                },
            },
            HttpStatus.CREATED
        )
    } catch (error) {
        console.error('[POST /api/wallet/withdraw]', error)
        return serverError('Failed to create withdrawal request')
    }
}
