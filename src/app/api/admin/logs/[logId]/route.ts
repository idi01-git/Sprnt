import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ logId: string }> }
) {
    try {
        await requireSuperAdmin()
        const { logId } = await params

        const log = await prisma.adminLog.findUnique({
            where: { id: logId },
        })

        if (!log) {
            return notFound('Admin Log')
        }

        // Get admin info separately
        const admin = await prisma.admin.findUnique({
            where: { id: log.adminId },
            select: { username: true, email: true, role: true }
        })

        return createSuccessResponse({
            ...log,
            admin: admin ? { username: admin.username, email: admin.email, role: admin.role } : null,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/logs/[logId]]', error)
        return serverError('Failed to fetch log')
    }
}
