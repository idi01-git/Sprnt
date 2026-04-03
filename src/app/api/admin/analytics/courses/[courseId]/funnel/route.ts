import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    notFound,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        await requirePermission('analytics:view')

        const { courseId } = await params

        const course = await prisma.course.findUnique({
            where: { courseId: courseId },
            select: { id: true, courseName: true, courseId: true },
        })

        if (!course) {
            return notFound('Course')
        }

        const totalEnrollments = await prisma.enrollment.count({
            where: { courseId: course.id },
        })

        const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id },
            orderBy: { dayNumber: 'asc' },
            select: {
                id: true,
                dayNumber: true,
                title: true,
            },
        })

        const funnel = modules.map((mod) => ({
            moduleId: mod.id,
            dayNumber: mod.dayNumber,
            title: mod.title,
            viewersCount: 0,
            dropOffRate: 0,
        }))

        return createSuccessResponse({
            course: {
                id: course.id,
                courseId: course.courseId,
                courseName: course.courseName,
            },
            totalEnrollments,
            funnel,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/courses/:id/funnel]', error)
        return createErrorResponse(
            ErrorCode.INTERNAL_ERROR,
            'Failed to fetch course funnel',
            HttpStatus.INTERNAL_SERVER_ERROR
        )
    }
}
