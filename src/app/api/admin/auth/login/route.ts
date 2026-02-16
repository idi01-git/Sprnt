import { NextRequest } from 'next/server'
import { verify } from 'argon2'
import { prisma } from '@/lib/db'
import { createAdminSession } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminLoginSchema } from '@/lib/validations/admin'

/**
 * POST /api/admin/auth/login
 * Authenticates an admin and creates a session.
 * Auth: None (public)
 */
export async function POST(request: NextRequest) {
    try {
        // Parse and validate body
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return badRequest('Invalid JSON body')
        }

        const parsed = adminLoginSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { email, password } = parsed.data

        // Find admin by email
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
                role: true,
                isActive: true,
            },
        })

        if (!admin) {
            return createErrorResponse(
                ErrorCode.ADMIN_INVALID_CREDENTIALS,
                'Invalid email or password',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Check if admin account is active
        if (!admin.isActive) {
            return createErrorResponse(
                ErrorCode.ADMIN_ACCOUNT_DISABLED,
                'Your admin account has been disabled',
                HttpStatus.FORBIDDEN
            )
        }

        // Verify password with Argon2
        const validPassword = await verify(admin.passwordHash, password)
        if (!validPassword) {
            return createErrorResponse(
                ErrorCode.ADMIN_INVALID_CREDENTIALS,
                'Invalid email or password',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Create admin session (also updates lastLogin timestamp)
        await createAdminSession(admin.id)

        return createSuccessResponse({
            admin: {
                id: admin.id,
                email: admin.email,
                username: admin.username,
                role: admin.role,
            },
            message: 'Login successful',
        })
    } catch (error) {
        console.error('[POST /api/admin/auth/login]', error)
        return serverError('Failed to authenticate')
    }
}
