import { NextRequest } from 'next/server'
import { verify, hash } from 'argon2'
import { prisma } from '@/lib/db'
import { validateAdminRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminChangePasswordSchema } from '@/lib/validations/admin'

/**
 * POST /api/admin/auth/change-password
 * Changes the admin's password after verifying the current one.
 * Auth: Admin Session Cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await validateAdminRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Parse and validate body
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return badRequest('Invalid JSON body')
        }

        const parsed = adminChangePasswordSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { currentPassword, newPassword } = parsed.data

        // Fetch current password hash
        const admin = await prisma.admin.findUnique({
            where: { id: user.id },
            select: { passwordHash: true },
        })

        if (!admin) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin not found',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Verify current password
        const validCurrent = await verify(admin.passwordHash, currentPassword)
        if (!validCurrent) {
            return createErrorResponse(
                ErrorCode.ADMIN_INVALID_CREDENTIALS,
                'Current password is incorrect',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Hash new password with Argon2
        const newHash = await hash(newPassword)

        // Update password
        await prisma.admin.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        })

        return createSuccessResponse({
            message: 'Password changed successfully',
        })
    } catch (error) {
        console.error('[POST /api/admin/auth/change-password]', error)
        return serverError('Failed to change password')
    }
}
