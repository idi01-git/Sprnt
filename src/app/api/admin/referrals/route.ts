import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminReferralListQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminReferralListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { status, dateFrom, dateTo, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.ReferralWhereInput = {}

        if (status !== 'all') {
            where.status = status
        }

        if (dateFrom || dateTo) {
            where.registeredAt = {}
            if (dateFrom) where.registeredAt.gte = dateFrom
            if (dateTo) where.registeredAt.lte = dateTo
        }

        const [referrals, total] = await Promise.all([
            prisma.referral.findMany({
                where,
                skip,
                take: limit,
                orderBy: { registeredAt: 'desc' },
                include: {
                    referrer: { select: { name: true, email: true } },
                    referee: { select: { name: true, email: true } },
                }
            }),
            prisma.referral.count({ where }),
        ])

        // Format referrals to match AdminReferral interface
        const formattedReferrals = referrals.map(r => ({
            id: r.id,
            referrerName: r.referrer.name || 'Unknown',
            referrerEmail: r.referrer.email || '',
            refereeName: r.referee.name || 'Unknown',
            refereeEmail: r.referee.email || '',
            status: r.status,
            bonusAmount: Number(r.amount),
            createdAt: r.registeredAt.toISOString(),
            convertedAt: r.completedAt?.toISOString() || null,
        }))

        return createPaginatedResponse({ referrals: formattedReferrals }, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/referrals]', error)
        return serverError()
    }
}
