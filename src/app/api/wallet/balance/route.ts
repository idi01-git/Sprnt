import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/wallet/balance
 * Returns the user's wallet balance summary including available, pending, and locked amounts.
 * Auth: Student Session Cookie
 */
export async function GET(_request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Parallel queries for balance, pending withdrawals, and locked funds
        const [userData, pendingWithdrawal, pendingAmount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: user.id },
                select: { walletBalance: true, upiId: true },
            }),
            prisma.withdrawalRequest.findFirst({
                where: { userId: user.id, status: 'pending' },
                select: { id: true, amount: true, requestedAt: true },
            }),
            prisma.withdrawalRequest.aggregate({
                where: { userId: user.id, status: 'pending' },
                _sum: { amount: true },
            }),
        ])

        const totalBalance = Number(userData?.walletBalance ?? 0)
        const lockedAmount = Number(pendingAmount._sum.amount ?? 0)
        const availableBalance = Math.max(0, totalBalance - lockedAmount)

        return createSuccessResponse({
            wallet: {
                totalBalance,
                availableBalance,
                lockedAmount,
                upiId: userData?.upiId ?? null,
                hasPendingWithdrawal: !!pendingWithdrawal,
                pendingWithdrawal: pendingWithdrawal
                    ? {
                        id: pendingWithdrawal.id,
                        amount: Number(pendingWithdrawal.amount),
                        requestedAt: pendingWithdrawal.requestedAt,
                    }
                    : null,
            },
        })
    } catch (error) {
        console.error('[GET /api/wallet/balance]', error)
        return serverError('Failed to fetch wallet balance')
    }
}
