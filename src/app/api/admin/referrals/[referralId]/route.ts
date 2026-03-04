import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ referralId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { referralId } = await params

        const referral = await prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                referrer: { select: { name: true, email: true, referralCode: true } },
                referee: { select: { name: true, email: true } },
            },
        })

        if (!referral) {
            return notFound('Referral')
        }

        return createSuccessResponse(referral)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/referrals/[referralId]]', error)
        return serverError()
    }
}
