import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        submissions: true,
                        certificates: true,
                        referralsSent: true,
                    }
                }
            }
        })

        if (!user) {
            return notFound('User')
        }

        const referralStats = await prisma.referral.aggregate({
            where: { referrerId: userId, status: 'completed' },
            _sum: { amount: true },
            _count: true,
        })

        const responseData = {
            ...user,
            referralStats: {
                totalReferrals: referralStats._count,
                totalEarned: referralStats._sum.amount ?? 0,
            }
        }

        return createSuccessResponse(responseData)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]]', error)
        return serverError()
    }
}
