import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const [totalReferrals, completedReferrals, totalPayouts] = await Promise.all([
            prisma.referral.count(),
            prisma.referral.count({ where: { status: 'completed' } }),
            prisma.referral.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
        ])

        const topReferrersRaw = await prisma.referral.groupBy({
            by: ['referrerId'],
            where: { status: 'completed' },
            _count: true,
            _sum: { amount: true },
            orderBy: { _count: { referrerId: 'desc' } },
            take: 5,
        })

        const referrerIds = topReferrersRaw.map(r => r.referrerId)
        const users = await prisma.user.findMany({
            where: { id: { in: referrerIds } },
            select: { id: true, name: true, email: true }
        })
        const userMap = Object.fromEntries(users.map(u => [u.id, u]))

        const topReferrers = topReferrersRaw.map(r => ({
            ...r,
            user: userMap[r.referrerId] || null
        }))

        const conversionRate = totalReferrals > 0
            ? Number(((completedReferrals / totalReferrals) * 100).toFixed(1))
            : 0

        return createSuccessResponse({
            stats: {
                totalReferrals,
                completedReferrals,
                conversionRate,
                totalPayouts: totalPayouts._sum.amount ?? 0,
                topReferrers
            }
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/referrals/stats]', error)
        return serverError()
    }
}
