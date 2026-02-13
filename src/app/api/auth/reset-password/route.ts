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

        const { token, password } = result.data

        // 2. Hash the token to compare with DB
        const tokenHash = createHash('sha256').update(token).digest('hex')

        // 3. Find valid, unused token
        const authToken = await prisma.authToken.findFirst({
            where: {
                tokenHash,
                tokenType: 'password_reset',
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { id: true, userId: true },
        })

        if (!authToken) {
            return createErrorResponse(
                ErrorCode.AUTH_TOKEN_EXPIRED,
                'Invalid or expired reset token',
                HttpStatus.BAD_REQUEST
            )
        }

        // 4. Hash new password & update user in a transaction
        const hashedPassword = await hash(password)

        await prisma.$transaction([
            // Update user password
            prisma.user.update({
                where: { id: authToken.userId },
                data: { hashedPassword },
            }),
            // Mark token as used
            prisma.authToken.update({
                where: { id: authToken.id },
                data: { usedAt: new Date() },
            }),
            // Invalidate all existing sessions (force re-login)
            prisma.session.deleteMany({
                where: { userId: authToken.userId },
            }),
        ])

        // 5. Auto-login: create a new session
        await createSession(authToken.userId)

        return createSuccessResponse({
            message: 'Password reset successfully. You are now logged in.',
        })
    } catch (error) {
        console.error('[POST /api/auth/reset-password]', error)
        return serverError('Failed to reset password')
    }
}
