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

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
    })
}

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Video upload not available in MVP',
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
        console.error(
            '[POST /api/admin/courses/[courseId]/modules/[moduleId]/video]',
            error,
        )
        return serverError('Failed to attach video')
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Video management not available in MVP',
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
        console.error(
            '[DELETE /api/admin/courses/[courseId]/modules/[moduleId]/video]',
            error,
        )
        return serverError('Failed to delete video')
    }
}
