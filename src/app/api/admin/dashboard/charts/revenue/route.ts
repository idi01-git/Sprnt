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
 * GET /api/admin/dashboard/charts/revenue
 * Returns daily revenue data for charting.
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

        const transactions = await prisma.transaction.groupBy({
            by: ['createdAt'],
            where: {
                transactionType: 'course_purchase',
                status: 'completed',
                createdAt: { gte: startDate },
            },
            _sum: { amount: true },
        })

        // Group by date (strip time)
        const dailyMap = new Map<string, number>()
        for (const tx of transactions) {
            const dateKey = tx.createdAt.toISOString().split('T')[0]
            dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + Number(tx._sum.amount ?? 0))
        }

        const chart = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, revenue]) => ({ date, revenue, refunds: 0, netRevenue: revenue }))

        return createSuccessResponse({ chart, source: 'live' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/charts/revenue]', error)
        return serverError('Failed to fetch revenue chart data')
    }
}
