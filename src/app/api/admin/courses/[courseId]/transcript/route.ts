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

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Transcript not available in MVP',
            HttpStatus.NOT_IMPLEMENTED
        )
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/courses/[courseId]/transcript]', error)
        return serverError('Failed to generate transcript upload URL')
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Transcript not available in MVP',
            HttpStatus.NOT_IMPLEMENTED
        )
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[DELETE /api/admin/courses/[courseId]/transcript]', error)
        return serverError('Failed to remove transcript')
    }
}
