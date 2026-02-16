import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/analytics/export/pdf
 * Generates a JSON summary report (for client-side PDF rendering).
 * Returns structured data that can be used by a PDF library on the frontend.
 * Auth: Admin with analytics:view permission
 */
export async function GET(_request: NextRequest) {
    try {
        const { admin } = await requirePermission('analytics:view')

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Gather comprehensive summary data
        const [
            totalUsers,
            newUsersMonth,
            totalEnrollments,
            paidEnrollments,
            completedEnrollments,
            totalRevenue,
            monthRevenue,
            totalReferrals,
            completedReferrals,
            pendingWithdrawals,
            totalCourses,
            certificatesIssued,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: { createdAt: { gte: monthStart }, deletedAt: null },
            }),
            prisma.enrollment.count(),
            prisma.enrollment.count({ where: { paymentStatus: 'success' } }),
            prisma.enrollment.count({ where: { completedAt: { not: null } } }),
            prisma.transaction.aggregate({
                where: {
                    transactionType: 'course_purchase',
                    status: 'completed',
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
            prisma.referral.count(),
            prisma.referral.count({ where: { status: 'completed' } }),
            prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
            prisma.course.count({ where: { isActive: true, deletedAt: null } }),
            prisma.certificate.count({ where: { isRevoked: false } }),
        ])

        return createSuccessResponse({
            report: {
                title: 'Sprintern Platform Report',
                generatedAt: now.toISOString(),
                generatedBy: admin.email ?? admin.id,
                period: {
                    label: `As of ${now.toLocaleDateString('en-IN')}`,
                    monthStart: monthStart.toISOString(),
                },
                summary: {
                    users: {
                        total: totalUsers,
                        newThisMonth: newUsersMonth,
                    },
                    enrollments: {
                        total: totalEnrollments,
                        paid: paidEnrollments,
                        completed: completedEnrollments,
                    },
                    courses: {
                        totalActive: totalCourses,
                        certificatesIssued,
                    },
                    revenue: {
                        allTime: Number(totalRevenue._sum.amount ?? 0),
                        thisMonth: Number(monthRevenue._sum.amount ?? 0),
                    },
                    referrals: {
                        total: totalReferrals,
                        completed: completedReferrals,
                        conversionRate:
                            totalReferrals > 0
                                ? Math.round(
                                    (completedReferrals / totalReferrals) * 100 * 100
                                ) / 100
                                : 0,
                    },
                    pendingActions: {
                        withdrawals: pendingWithdrawals,
                    },
                },
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
        console.error('[GET /api/admin/analytics/export/pdf]', error)
        return serverError('Failed to generate report data')
    }
}
