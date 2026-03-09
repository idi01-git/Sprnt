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
    try {
        // 1. Require authenticated session
        const { user } = await validateRequest()
        if (!user) return unauthorized()

        // 2. Check if already verified
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerified: true, email: true, name: true },
        })

        if (!dbUser) return unauthorized('User not found')

        if (dbUser.emailVerified) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Email is already verified',
                HttpStatus.BAD_REQUEST
            )
        }

        // 3. Rate limit: check if a token was created recently (within 2 minutes)
        const recentToken = await prisma.authToken.findFirst({
            where: {
                userId: user.id,
                tokenType: 'email_verification',
                usedAt: null,
                createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
            },
            select: { id: true },
        })

        if (recentToken) {
            return createErrorResponse(
                ErrorCode.RATE_LIMITED,
                'Please wait 2 minutes before requesting another verification email',
                HttpStatus.TOO_MANY_REQUESTS
            )
        }

        // 4. Invalidate prior verification tokens
        await prisma.authToken.updateMany({
            where: {
                userId: user.id,
                tokenType: 'email_verification',
                usedAt: null,
            },
            data: { usedAt: new Date() },
        })

        // 5. Generate new verification token (24-hour expiry)
        const rawToken = randomBytes(32).toString('hex')
        const tokenHash = createHash('sha256').update(rawToken).digest('hex')

        await prisma.authToken.create({
            data: {
                userId: user.id,
                tokenHash,
                tokenType: 'email_verification',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        })

        // 6. Send verification email (fire-and-forget)
        sendVerificationEmail(dbUser.email, dbUser.name, rawToken).catch((err) =>
            console.error('[resend-verification] Failed to send verification email:', err)
        )

        return createSuccessResponse({
            message: 'Verification email sent. Please check your inbox.',
        })
    } catch (error) {
        console.error('[POST /api/auth/resend-verification]', error)
        return serverError('Failed to resend verification email')
    }
}
