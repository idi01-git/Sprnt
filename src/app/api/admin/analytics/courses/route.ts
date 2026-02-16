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
 * GET /api/admin/analytics/courses
 * Returns analytics per course: enrollments, completion rates, revenue.
 * Auth: Admin with analytics:view permission
 */
export async function GET(_request: NextRequest) {
    try {
        await requirePermission('analytics:view')

        // Get all active courses with enrollment & certificate counts
        const courses = await prisma.course.findMany({
            where: { isActive: true, deletedAt: null },
            select: {
                id: true,
                courseId: true,
                courseName: true,
                coursePrice: true,
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                    },
                },
            },
            orderBy: { courseName: 'asc' },
        })

        const courseIds = courses.map((c) => c.id)

        // Batch-fetch all completion counts in a single query
        const completedCounts = await prisma.enrollment.groupBy({
            by: ['courseId'],
            where: {
                courseId: { in: courseIds },
                completedAt: { not: null },
            },
            _count: { _all: true },
        })
        const completedCountMap = new Map<string, number>()
        for (const item of completedCounts) {
            completedCountMap.set(item.courseId, item._count._all)
        }

        // Batch-fetch all revenue aggregates in a single query
        const transactions = await prisma.transaction.findMany({
            where: {
                enrollment: { courseId: { in: courseIds } },
                transactionType: 'course_purchase',
                status: 'completed',
            },
            select: {
                amount: true,
                enrollment: { select: { courseId: true } },
            },
        })

        const revenueMap = new Map<string, number>()
        for (const tx of transactions) {
            if (!tx.enrollment) continue
            const cid = tx.enrollment.courseId
            revenueMap.set(cid, (revenueMap.get(cid) ?? 0) + Number(tx.amount ?? 0))
        }

        // Combine data in memory
        const enriched = courses.map((course) => {
            const completedCount = completedCountMap.get(course.id) ?? 0
            const totalEnrollments = course._count.enrollments
            const completionRate =
                totalEnrollments > 0
                    ? Math.round((completedCount / totalEnrollments) * 100 * 100) / 100
                    : 0

            return {
                id: course.id,
                courseId: course.courseId,
                courseName: course.courseName,
                coursePrice: Number(course.coursePrice),
                totalEnrollments,
                completedEnrollments: completedCount,
                completionRate,
                certificatesIssued: course._count.certificates,
                totalRevenue: revenueMap.get(course.id) ?? 0,
            }
        })

        return createSuccessResponse({ courses: enriched })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/courses]', error)
        return serverError('Failed to fetch course analytics')
    }
}
