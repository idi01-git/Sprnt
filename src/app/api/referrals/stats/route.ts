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
 * GET /api/referrals/stats
 * Get referral statistics: total referred, successful, pending, earnings.
 * Auth: Session Cookie
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

        // Aggregate referral stats
        const [total, completed, pending] = await Promise.all([
            prisma.referral.count({
                where: { referrerId: user.id },
            }),
            prisma.referral.count({
                where: { referrerId: user.id, status: 'completed' },
            }),
            prisma.referral.count({
                where: { referrerId: user.id, status: 'pending' },
            }),
        ])

        // Get total earnings from completed referrals
        const earnings = await prisma.referral.aggregate({
            where: {
                referrerId: user.id,
                status: 'completed',
            },
            _sum: { amount: true },
        })

        // Get wallet balance
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { walletBalance: true },
        })

        return createSuccessResponse({
            stats: {
                totalReferred: total,
                completedReferrals: completed,
                pendingReferrals: pending,
                totalEarnings: Number(earnings._sum.amount ?? 0),
                walletBalance: Number(userData?.walletBalance ?? 0),
            },
        })
    } catch (error) {
        console.error('[GET /api/referrals/stats]', error)
        return serverError('Failed to fetch referral stats')
    }
}
