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
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = verifyEmailSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { token } = result.data

        // 2. Hash the token to compare with DB
        const tokenHash = createHash('sha256').update(token).digest('hex')

        // 3. Find valid, unused verification token
        const authToken = await prisma.authToken.findFirst({
            where: {
                tokenHash,
                tokenType: 'email_verification',
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { id: true, userId: true },
        })

        if (!authToken) {
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_EXPIRED,
                'Invalid or expired verification token',
                HttpStatus.BAD_REQUEST
            )
        }

        // 4. Mark email as verified and token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: authToken.userId },
                data: { emailVerified: true },
            }),
            prisma.authToken.update({
                where: { id: authToken.id },
                data: { usedAt: new Date() },
            }),
        ])

        return createSuccessResponse({
            message: 'Email verified successfully',
        })
    } catch (error) {
        console.error('[POST /api/auth/verify-email]', error)
        return serverError('Failed to verify email')
    }
}
