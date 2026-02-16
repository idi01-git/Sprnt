import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { dashboardChartQuerySchema } from '@/lib/validations/admin'

/**
 * GET /api/admin/dashboard/charts/signups
 * Returns daily user signup data for charting.
 * Query params: days (7-90, default 30)
 * Auth: Admin (any role)
 */
export async function GET(request: NextRequest) {
    try {
        await requireAdmin()

        const { searchParams } = new URL(request.url)
        const parsed = dashboardChartQuerySchema.safeParse({
            days: searchParams.get('days') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { issues: parsed.error.issues })
        }

        const { days } = parsed.data
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Try pre-computed analytics first
        const analyticsData = await prisma.analyticsDaily.findMany({
            where: { date: { gte: startDate } },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                newUsers: true,
                activeUsers: true,
            },
        })

        if (analyticsData.length > 0) {
            return createSuccessResponse({
                chart: analyticsData.map((d) => ({
                    date: d.date,
                    newUsers: d.newUsers,
                    activeUsers: d.activeUsers,
                })),
                source: 'pre_computed',
            })
        }

        // Fallback: raw groupBy from users
        const users = await prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
                deletedAt: null,
            },
            _count: { id: true },
        })

        // Group by date
        const dailyMap = new Map<string, number>()
        for (const u of users) {
            const dateKey = u.createdAt.toISOString().split('T')[0]
            dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + u._count.id)
        }

        const chart = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, newUsers]) => ({ date, newUsers, activeUsers: 0 }))

        return createSuccessResponse({ chart, source: 'live' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/charts/signups]', error)
        return serverError('Failed to fetch signups chart data')
    }
}
