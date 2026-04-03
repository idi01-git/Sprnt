import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and send password reset email via Resend
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = forgotPasswordSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { email } = result.data

        return createErrorResponse(
            ErrorCode.SERVICE_UNAVAILABLE,
            'Password reset is not available in the current version',
            HttpStatus.SERVICE_UNAVAILABLE
        )
    } catch (error) {
        console.error('[POST /api/auth/forgot-password]', error)
        return serverError('Failed to process password reset request')
    }
}
