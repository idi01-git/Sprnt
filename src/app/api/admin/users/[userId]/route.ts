import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'

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
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            dob: user.dob?.toISOString() || null,
            studyLevel: user.studyLevel,
            status: user.deletedAt !== null ? 'suspended' : 'active',
            emailVerified: !!user.emailVerified,
            createdAt: user.createdAt.toISOString(),
            referralStats: {
                totalReferrals: referralStats._count,
                totalEarned: referralStats._sum.amount ?? 0,
            }
        }

        return createSuccessResponse({ user: responseData })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]]', error)
        return serverError()
    }
}
