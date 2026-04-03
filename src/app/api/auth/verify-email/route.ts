import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { verifyEmailSchema } from '@/lib/validations/auth'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/verify-email
 * Validate email verification token, set emailVerified = true
 */
export async function POST(request: Request) {
    return createErrorResponse(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Email verification is not available in the current version',
        HttpStatus.SERVICE_UNAVAILABLE
    )
}
