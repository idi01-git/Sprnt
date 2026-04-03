import { randomBytes, createHash } from 'crypto'
import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { registerSchema } from '@/lib/validations/auth'
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    conflict,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/register
 * Register new student with email/password
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { email, password, name, phone, dob, studyLevel, referralCode } = result.data

        // 2. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })

        if (existingUser) {
            return conflict('An account with this email already exists')
        }

        // 3. Validate referral code if provided
        let referredByUserId: string | undefined
        if (referralCode) {
            console.info('[POST /api/auth/register] Referral code received:', referralCode);
            const referrer = await prisma.user.findUnique({
                where: { referralCode },
                select: { id: true, email: true, referralCode: true },
            })

            console.info('[POST /api/auth/register] Referrer lookup result:', referrer);

            if (!referrer) {
                return createErrorResponse(
                    ErrorCode.VALIDATION_ERROR,
                    'Invalid or inactive referral code',
                    HttpStatus.BAD_REQUEST
                )
            }

            referredByUserId = referrer.id
            console.info('[POST /api/auth/register] Setting referredBy:', { referrerId: referrer.id, referrerEmail: referrer.email });
        }

        // 4. Hash password with Argon2
        const hashedPassword = await hash(password)

        // 5. Create user in database
        const user = await prisma.user.create({
            data: {
                email,
                hashedPassword,
                name,
                phone: phone || null,
                dob: dob || null,
                studyLevel: studyLevel || null,
                referredBy: referredByUserId || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        })

        // Fire-and-forget: send welcome email
        sendWelcomeEmail(user.email, user.name).catch((err) => console.error('[register] Failed to send welcome email:', err))

        // 7. Create session (sets HttpOnly cookie)
        await createSession(user.id)

        // 8. Return created user
        return createSuccessResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            },
            HttpStatus.CREATED
        )
    } catch (error) {
        console.error('[POST /api/auth/register]', error)
        return serverError('Failed to create account')
    }
}

