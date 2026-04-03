import { createHash } from 'crypto'
import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { resetPasswordSchema } from '@/lib/validations/auth'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/reset-password
 * Validate reset token, hash new password, auto-login
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = resetPasswordSchema.safeParse(body)
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
            'Password reset is not available in the current version',
            HttpStatus.SERVICE_UNAVAILABLE
        )
    } catch (error) {
        console.error('[POST /api/auth/reset-password]', error)
        return serverError('Failed to reset password')
    }
}
