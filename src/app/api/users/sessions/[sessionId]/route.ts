import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { validateRequest, invalidateSession } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    forbidden,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * DELETE /api/users/sessions/{sessionId}
 * Revoke a specific session (not the current one)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const authUser = await requireAuth()
        const { session: currentSession } = await validateRequest()
        const { sessionId } = await params

        if (!sessionId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Session ID is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // Verify this session belongs to the user
        const targetSession = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { userId: true },
        })

        if (!targetSession || targetSession.userId !== authUser.id) {
            return forbidden('You can only revoke your own sessions')
        }

        // Prevent revoking the current session (use /logout instead)
        if (currentSession && sessionId === currentSession.id) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Cannot revoke the current session. Use /api/auth/logout instead.',
                HttpStatus.BAD_REQUEST
            )
        }

        await invalidateSession(sessionId)

        return createSuccessResponse({ message: 'Session revoked successfully' })
    } catch (error) {
        if ((error as { digest?: string }).digest === 'NEXT_REDIRECT') throw error
        console.error('[DELETE /api/users/sessions]', error)
        return serverError('Failed to revoke session')
    }
}
