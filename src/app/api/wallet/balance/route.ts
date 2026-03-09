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

        const now = new Date()

        // Parallel queries for balance, pending withdrawals, and locked funds from referrals
        const [userData, pendingWithdrawal, pendingWithdrawalAmount, lockedReferrals] = await Promise.all([
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
            // Find referrals where withdrawal is not yet eligible (7-day lock period)
            prisma.referral.aggregate({
                where: {
                    referrerId: user.id,
                    status: 'pending',
                    withdrawalEligibleAt: { gt: now },
                },
                _sum: { amount: true },
            }),
        ])

        const totalBalance = Number(userData?.walletBalance ?? 0)
        const pendingWithdrawalAmountValue = Number(pendingWithdrawalAmount._sum.amount ?? 0)
        const lockedFromReferrals = Number(lockedReferrals._sum.amount ?? 0)

        // Total locked = pending withdrawals + locked referral totalLocked = pendingWithdrawalAmountValue + lockedFromRefer earnings
        constrals

        // Available balance = total - locked (what can be withdrawn now)
        const availableBalance = Math.max(0, totalBalance - totalLocked)

        // Total withdrawn (for reference)
        const totalWithdrawn = await prisma.transaction.aggregate({
            where: {
                userId: user.id,
                transactionType: 'withdrawal',
                status: 'completed',
            },
            _sum: { amount: true },
        })

        return createSuccessResponse({
            wallet: {
                totalBalance,
                availableBalance,
                lockedBalance: totalLocked,
                pendingWithdrawal: pendingWithdrawalAmountValue,
                lockedFromReferrals,
                totalWithdrawn: Math.abs(Number(totalWithdrawn._sum.amount ?? 0)),
                upiId: userData?.upiId ?? null,
                hasPendingWithdrawal: !!pendingWithdrawal,
                pendingWithdrawalDetails: pendingWithdrawal
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
