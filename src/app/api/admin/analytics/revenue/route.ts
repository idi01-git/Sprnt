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
import { analyticsDateRangeSchema, periodToStartDate } from '@/lib/validations/admin'

/**
 * GET /api/admin/analytics/revenue
 * Returns revenue analytics: totals, breakdown by course, AOV.
 * Query params: startDate, endDate, period
 * Auth: Admin with analytics:view permission
 */
export async function GET(request: NextRequest) {
    try {
        await requirePermission('analytics:view')

        const { searchParams } = new URL(request.url)
        const parsed = analyticsDateRangeSchema.safeParse({
            startDate: searchParams.get('startDate') ?? undefined,
            endDate: searchParams.get('endDate') ?? undefined,
            period: searchParams.get('period') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { issues: parsed.error.issues })
        }

        // Calculate date range
        const { period } = parsed.data
        let startDate = parsed.data.startDate
        const endDate = parsed.data.endDate ?? new Date()

        if (!startDate) {
            startDate = periodToStartDate(period)
        }

        const dateFilter = { gte: startDate, lte: endDate }

        const [totalRevenue, totalRefunds, byCourse, enrollmentCount] =
            await Promise.all([
                prisma.transaction.aggregate({
                    where: {
                        transactionType: 'course_purchase',
                        status: 'completed',
                        createdAt: dateFilter,
                    },
                    _sum: { amount: true },
                }),
                prisma.transaction.aggregate({
                    where: {
                        transactionType: 'refund',
                        status: 'completed',
                        createdAt: dateFilter,
                    },
                    _sum: { amount: true },
                }),
                prisma.transaction.groupBy({
                    by: ['enrollmentId'],
                    where: {
                        transactionType: 'course_purchase',
                        status: 'completed',
                        createdAt: dateFilter,
                        enrollmentId: { not: null },
                    },
                    _sum: { amount: true },
                    _count: true,
                }),
                prisma.enrollment.count({
                    where: {
                        paymentStatus: 'success',
                        enrolledAt: dateFilter,
                    },
                }),
            ])

        const gross = Number(totalRevenue._sum.amount ?? 0)
        const refunds = Number(totalRefunds._sum.amount ?? 0)
        const net = gross - refunds
        const aov = enrollmentCount > 0 ? gross / enrollmentCount : 0

        return createSuccessResponse({
            revenue: {
                grossRevenue: gross,
                totalRefunds: refunds,
                netRevenue: net,
                averageOrderValue: Math.round(aov * 100) / 100,
                totalPaidEnrollments: enrollmentCount,
                courseBreakdownCount: byCourse.length,
            },
            period: { startDate, endDate },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/revenue]', error)
        return serverError('Failed to fetch revenue analytics')
    }
}
