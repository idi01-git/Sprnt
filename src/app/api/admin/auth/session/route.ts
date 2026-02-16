import { NextRequest } from 'next/server'
import { validateAdminRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/auth/session
 * Returns the current admin session + user data.
 * Auth: Admin Session Cookie
 */
export async function GET(_request: NextRequest) {
    try {
        const { user, session } = await validateAdminRequest()
        if (!user || !session) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Fetch full admin profile (Lucia attributes are limited)
        const admin = await prisma.admin.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                permissions: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
            },
        })

        if (!admin || !admin.isActive) {
            return createErrorResponse(
                ErrorCode.ADMIN_ACCOUNT_DISABLED,
                'Admin account is disabled',
                HttpStatus.FORBIDDEN
            )
        }

        return createSuccessResponse({
            admin,
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
            },
        })
    } catch (error) {
        console.error('[GET /api/admin/auth/session]', error)
        return serverError('Failed to validate admin session')
    }
}
