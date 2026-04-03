import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createErrorResponse,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

export async function POST(
    _request: Request,
    _params: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
    }

    return createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Course duplication is not available in the MVP',
        HttpStatus.NOT_IMPLEMENTED
    )
}
