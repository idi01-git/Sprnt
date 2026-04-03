import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { analyticsPeriodSchema, periodToStartDate } from '@/lib/validations/admin'

/**
 * GET /api/admin/analytics/users
 * Returns user analytics: sign-ups over time, study level distribution, verification stats.
 * Auth: Admin with analytics:view permission
 */
export async function GET(request: NextRequest) {
    try {
        await requirePermission('analytics:view')

        const { searchParams } = new URL(request.url)
        const parsed = analyticsPeriodSchema.safeParse({
            period: searchParams.get('period') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { issues: parsed.error.issues })
        }

        const { period } = parsed.data
        const startDate = periodToStartDate(period)

        const [
            totalUsers,
            newUsersInPeriod,
            verifiedEmail,
            studyLevelDist,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: { createdAt: { gte: startDate }, deletedAt: null },
            }),
            prisma.user.count({
                where: { emailVerified: true, deletedAt: null },
            }),
            prisma.user.groupBy({
                by: ['studyLevel'],
                where: { deletedAt: null },
                _count: { id: true },
            }),
        ])

        return createSuccessResponse({
            users: {
                totalUsers,
                newUsersInPeriod,
                emailVerified: verifiedEmail,
                studyLevelDistribution: studyLevelDist.map((s) => ({
                    studyLevel: s.studyLevel ?? 'unknown',
                    count: s._count.id,
                })),
            },
            period: { startDate, days: period },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/users]', error)
        return serverError('Failed to fetch user analytics')
    }
}
