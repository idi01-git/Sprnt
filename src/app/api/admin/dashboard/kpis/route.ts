import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/dashboard/kpis
 * Returns key performance indicators for the admin dashboard.
 * Auth: Admin (any role)
 */
export async function GET(_request: NextRequest) {
    try {
        await requireAdmin()

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalUsers,
            totalEnrollments,
            paidEnrollments,
            totalCourses,
            revenueToday,
            revenueMonth,
            newUsersToday,
            newUsersMonth,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.enrollment.count(),
            prisma.enrollment.count({ where: { paymentStatus: 'success' } }),
            prisma.course.count({ where: { isActive: true, deletedAt: null } }),
            prisma.transaction.aggregate({
                where: {
                    transactionType: 'course_purchase',
                    status: 'completed',
                    createdAt: { gte: todayStart },
                },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: {
                    transactionType: 'course_purchase',
                    status: 'completed',
                    createdAt: { gte: monthStart },
                },
                _sum: { amount: true },
            }),
            prisma.user.count({
                where: { createdAt: { gte: todayStart }, deletedAt: null },
            }),
            prisma.user.count({
                where: { createdAt: { gte: monthStart }, deletedAt: null },
            }),
        ])

        return createSuccessResponse({
            kpis: {
                totalUsers,
                totalEnrollments,
                paidEnrollments,
                totalCourses,
                revenueToday: Number(revenueToday._sum.amount ?? 0),
                revenueMonth: Number(revenueMonth._sum.amount ?? 0),
                newUsersToday,
                newUsersMonth,
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/kpis]', error)
        return serverError('Failed to fetch KPIs')
    }
}
