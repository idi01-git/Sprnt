import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/users/sessions
 * List all active sessions for the current user
 */
export async function GET() {
    try {
        const authUser = await requireAuth()

        const sessions = await prisma.session.findMany({
            where: {
                userId: authUser.id,
                expiresAt: { gt: new Date() },
            },
            select: {
                id: true,
                expiresAt: true,
            },
            orderBy: { expiresAt: 'desc' },
        })

        return createSuccessResponse({ sessions })
    } catch (error) {
        if ((error as { digest?: string }).digest === 'NEXT_REDIRECT') throw error
        console.error('[GET /api/users/sessions]', error)
        return serverError('Failed to fetch sessions')
    }
}
