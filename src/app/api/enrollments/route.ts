import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { enrollmentListQuerySchema } from '@/lib/validations/enrollment'
import {
    createPaginatedResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import type { Prisma } from '@/generated/prisma/client'

/**
 * GET /api/enrollments
 * List all enrollments for current user with progress summary.
 * Query: ?status=in_progress|completed|all
 * Auth: Session Cookie
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { searchParams } = new URL(request.url)
        const queryObj = Object.fromEntries(searchParams.entries())

        const result = enrollmentListQuerySchema.safeParse(queryObj)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid query parameters',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { status, page, limit } = result.data
        const skip = (page - 1) * limit

        // Build where clause
        const where: Prisma.EnrollmentWhereInput = {
            userId: user.id,
            paymentStatus: 'success',
            deletedAt: null,
        }

        if (status === 'in_progress') {
            where.completedAt = null
        } else if (status === 'completed') {
            where.completedAt = { not: null }
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                select: {
                    id: true,
                    courseId: true,
                    currentDay: true,
                    day7Completed: true,
                    certificateIssued: true,
                    certificateId: true,
                    enrolledAt: true,
                    completedAt: true,
                    course: {
                        select: {
                            courseName: true,
                            slug: true,
                            courseThumbnail: true,
                            affiliatedBranch: true,
                            _count: {
                                select: { modules: true },
                            },
                        },
                    },
                    _count: {
                        select: {
                            dailyProgress: { where: { quizPassed: true } },
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.enrollment.count({ where }),
        ])

        const formattedEnrollments = enrollments.map((e) => ({
            id: e.id,
            courseId: e.courseId,
            courseName: e.course.courseName,
            courseSlug: e.course.slug,
            courseThumbnail: e.course.courseThumbnail,
            affiliatedBranch: e.course.affiliatedBranch,
            currentDay: e.currentDay,
            day7Completed: e.day7Completed,
            certificateIssued: e.certificateIssued,
            certificateId: e.certificateId,
            daysCompleted: e._count.dailyProgress,
            totalDays: e.course._count.modules > 0 ? e.course._count.modules : 7, // Use actual module count
            enrolledAt: e.enrolledAt.toISOString(),
            completedAt: e.completedAt?.toISOString() ?? null,
            status: e.completedAt ? 'completed' : 'in_progress',
        }))

        return createPaginatedResponse(
            { enrollments: formattedEnrollments },
            { total, page, pageSize: limit }
        )
    } catch (error) {
        console.error('[GET /api/enrollments]', error)
        return serverError('Failed to fetch enrollments')
    }
}
