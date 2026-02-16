import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/analytics/referrals
 * Returns referral analytics: totals, conversion rate, top referrers, payouts.
 * Auth: Admin with analytics:view permission
 */
export async function GET(_request: NextRequest) {
    try {
        await requirePermission('analytics:view')

        const [totalReferrals, completedReferrals, pendingReferrals, totalPayouts, topReferrers] =
            await Promise.all([
                prisma.referral.count(),
                prisma.referral.count({ where: { status: 'completed' } }),
                prisma.referral.count({ where: { status: 'pending' } }),
                prisma.referral.aggregate({
                    where: { status: 'completed' },
                    _sum: { amount: true },
                }),
                prisma.referral.groupBy({
                    by: ['referrerId'],
                    where: { status: 'completed' },
                    _count: { id: true },
                    _sum: { amount: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
            ])

        // Enrich top referrers with user data
        const topReferrerIds = topReferrers.map((r) => r.referrerId)
        const referrerUsers = await prisma.user.findMany({
            where: { id: { in: topReferrerIds } },
            select: { id: true, name: true, email: true },
        })
        const userMap = new Map(referrerUsers.map((u) => [u.id, u]))

        const conversionRate =
            totalReferrals > 0
                ? Math.round((completedReferrals / totalReferrals) * 100 * 100) / 100
                : 0

        return createSuccessResponse({
            referrals: {
                totalReferrals,
                completedReferrals,
                pendingReferrals,
                conversionRate,
                totalPayouts: Number(totalPayouts._sum.amount ?? 0),
                topReferrers: topReferrers.map((r) => {
                    const userData = userMap.get(r.referrerId)
                    return {
                        userId: r.referrerId,
                        name: userData?.name ?? 'Unknown',
                        email: userData?.email ?? 'Unknown',
                        completedReferrals: r._count.id,
                        totalEarnings: Number(r._sum.amount ?? 0),
                    }
                }),
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/referrals]', error)
        return serverError('Failed to fetch referral analytics')
    }
}
