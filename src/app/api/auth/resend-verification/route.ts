import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { sendVerificationEmail } from '@/lib/email'
import {
    createSuccessResponse,
    createErrorResponse,
    unauthorized,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/resend-verification
 * Generate new email verification token and send email via Resend
 */
export async function POST() {
    return createErrorResponse(
        ErrorCode.SERVICE_UNAVAILABLE,
        'Email verification is not available in the current version',
        HttpStatus.SERVICE_UNAVAILABLE
    )
}
