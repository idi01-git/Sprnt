import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { userId } = await params

        const [user, referrals, stats, withdrawals] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { referralCode: true }
            }),
            prisma.referral.findMany({
                where: { referrerId: userId },
                include: {
                    referee: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { registeredAt: 'desc' },
            }),
            prisma.referral.aggregate({
                where: { referrerId: userId, status: 'completed' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.withdrawalRequest.aggregate({
                where: { userId, status: 'completed' },
                _sum: { amount: true },
            }),
        ])

        const responseData = {
            referralCode: user?.referralCode ?? null,
            referrals,
            stats: {
                totalReferrals: stats._count,
                totalEarned: stats._sum.amount ?? 0,
                totalWithdrawn: withdrawals._sum.amount ?? 0,
            }
        }

        return createSuccessResponse(responseData)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]/referrals]', error)
        return serverError()
    }
}
