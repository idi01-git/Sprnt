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
 * GET /api/admin/dashboard/recent-submissions
 * Returns the latest 10 submissions with user, course, and review status.
 * Auth: Admin (any role)
 */
export async function GET(_request: NextRequest) {
    try {
        await requireAdmin()

        const submissions = await prisma.submission.findMany({
            orderBy: { submittedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                reviewStatus: true,
                submittedAt: true,
                reviewCompletedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                enrollment: {
                    select: {
                        course: {
                            select: {
                                id: true,
                                courseName: true,
                                courseId: true,
                            },
                        },
                    },
                },
                assignedAdmin: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        })

        return createSuccessResponse({ submissions })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/recent-submissions]', error)
        return serverError('Failed to fetch recent submissions')
    }
}
