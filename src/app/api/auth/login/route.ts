import { verify } from 'argon2'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validations/auth'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/auth/login
 * Authenticate student with email + password, create session
 */
export async function POST(request: Request) {
    try {
        // 1. Parse & validate body
        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = loginSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { email, password } = result.data

        // 2. Find user by email (include password hash for verification)
        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                hashedPassword: true,
                emailVerified: true,
                avatarUrl: true,
            },
        })

        // Generic error to prevent user enumeration
        if (!user || !user.hashedPassword) {
            return createErrorResponse(
                ErrorCode.AUTH_INVALID_CREDENTIALS,
                'Invalid email or password',
                HttpStatus.UNAUTHORIZED
            )
        }

        // 3. Verify password with Argon2
        const validPassword = await verify(user.hashedPassword, password)
        if (!validPassword) {
            return createErrorResponse(
                ErrorCode.AUTH_INVALID_CREDENTIALS,
                'Invalid email or password',
                HttpStatus.UNAUTHORIZED
            )
        }

        // 4. Create Lucia session (sets HttpOnly cookie)
        await createSession(user.id)

        // 5. Return user data (strip sensitive fields)
        return createSuccessResponse({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: user.emailVerified,
                avatarUrl: user.avatarUrl,
            },
        })
    } catch (error) {
        console.error('[POST /api/auth/login]', error)
        return serverError('Login failed')
    }
}
