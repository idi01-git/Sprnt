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
 * GET /api/admin/dashboard/recent-enrollments
 * Returns the latest 10 enrollments with user and course info.
 * Auth: Admin (any role)
 */
export async function GET(_request: NextRequest) {
    try {
        await requireAdmin()

        const enrollments = await prisma.enrollment.findMany({
            orderBy: { enrolledAt: 'desc' },
            take: 10,
            select: {
                id: true,
                paymentStatus: true,
                amountPaid: true,
                enrolledAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        courseName: true,
                        courseId: true,
                    },
                },
            },
        })

        return createSuccessResponse({
            enrollments: enrollments.map((e) => ({
                id: e.id,
                userName: e.user.name,
                courseName: e.course.courseName,
                amount: Number(e.amountPaid),
                createdAt: e.enrolledAt,
                userEmail: e.user.email,
            })),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/recent-enrollments]', error)
        return serverError('Failed to fetch recent enrollments')
    }
}
