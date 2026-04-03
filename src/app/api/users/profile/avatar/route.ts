import { prisma } from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/auth/guards'
import { avatarUploadSchema } from '@/lib/validations/profile'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    unauthorized,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

export async function POST(request: Request) {
    try {
        const authUser = await requireAuth()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = avatarUploadSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Avatar upload not available in MVP',
            HttpStatus.NOT_IMPLEMENTED
        )
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[POST /api/users/profile/avatar]', error)
        return serverError('Failed to generate avatar upload URL')
    }
}

export async function DELETE() {
    try {
        const authUser = await requireAuth()

        await prisma.user.update({
            where: { id: authUser.id },
            data: { avatarUrl: null },
        })

        return createSuccessResponse({ message: 'Avatar removed successfully' })
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[DELETE /api/users/profile/avatar]', error)
        return serverError('Failed to remove avatar')
    }
}
