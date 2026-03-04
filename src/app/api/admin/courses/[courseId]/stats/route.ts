import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    notFound,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

// =============================================================================
// GET /api/admin/courses/[courseId]/stats — Course statistics
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        const [
            totalEnrollments,
            completedEnrollments,
            revenueAgg,
        ] = await Promise.all([
            prisma.enrollment.count({
                where: { courseId: course.id, paymentStatus: 'success' },
            }),
            prisma.enrollment.count({
                where: {
                    courseId: course.id,
                    paymentStatus: 'success',
                    certificateIssued: true,
                },
            }),
            prisma.enrollment.aggregate({
                where: { courseId: course.id, paymentStatus: 'success' },
                _sum: { amountPaid: true },
            }),
        ])

        return createSuccessResponse({
            courseId,
            courseName: course.courseName,
            totalEnrollments,
            completedEnrollments,
            completionRate:
                totalEnrollments > 0
                    ? Math.round((completedEnrollments / totalEnrollments) * 100)
                    : 0,
            revenue: revenueAgg._sum.amountPaid || 0,
            // Add more stats as needed
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/courses/[courseId]/stats]', error)
        return serverError('Failed to fetch course statistics')
    }
}
