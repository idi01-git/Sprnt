import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createPaginatedResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/referrals/list
 * List all referrals made by the current user (with pagination).
 * Auth: Session Cookie
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
        const skip = (page - 1) * limit

        const [referrals, total] = await Promise.all([
            prisma.referral.findMany({
                where: { referrerId: user.id },
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    registeredAt: true,
                    paymentCompletedAt: true,
                    withdrawalEligibleAt: true,
                    referee: {
                        select: {
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                },
                orderBy: { registeredAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.referral.count({
                where: { referrerId: user.id },
            }),
        ])

        const formattedReferrals = referrals.map((r) => ({
            id: r.id,
            refereeName: r.referee.name,
            refereeEmail: maskEmail(r.referee.email),
            refereeAvatar: r.referee.avatarUrl,
            status: r.status,
            amount: Number(r.amount),
            registeredAt: r.registeredAt,
            paymentCompletedAt: r.paymentCompletedAt,
            withdrawalEligibleAt: r.withdrawalEligibleAt,
        }))

        return createPaginatedResponse(
            { referrals: formattedReferrals },
            { total, page, pageSize: limit }
        )
    } catch (error) {
        console.error('[GET /api/referrals/list]', error)
        return serverError('Failed to fetch referrals')
    }
}

/** Partially mask an email for privacy */
function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return '****'
    const visible = local.slice(0, 2)
    return `${visible}***@${domain}`
}
