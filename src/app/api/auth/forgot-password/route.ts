import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validations/auth'
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
 * Generate password reset token and (TODO) send email
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

        // Always return success to prevent user enumeration
        // Even if the email doesn't exist, we respond identically
        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
            select: { id: true },
        })

        if (user) {
            // Generate a secure random token
            const rawToken = randomBytes(32).toString('hex')
            // console.log('>>> DEBUG: RAW RESET TOKEN:', rawToken)
            const tokenHash = createHash('sha256').update(rawToken).digest('hex')

            // Invalidate any prior reset tokens for this user
            await prisma.authToken.updateMany({
                where: {
                    userId: user.id,
                    tokenType: 'password_reset',
                    usedAt: null,
                },
                data: { usedAt: new Date() },
            })

            // Create a new reset token (expires in 1 hour)
            await prisma.authToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    tokenType: 'password_reset',
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                },
            })

            // TODO: Send email with reset link containing rawToken
            // await sendPasswordResetEmail(email, rawToken)
            console.info(`[forgot-password] Reset token generated for ${email}`)
        }

        return createSuccessResponse({
            message: 'If the email exists, a password reset link has been sent.',
        })
    } catch (error) {
        console.error('[POST /api/auth/forgot-password]', error)
        return serverError('Failed to process password reset request')
    }
}
