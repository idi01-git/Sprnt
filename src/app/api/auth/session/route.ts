import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    unauthorized,
    serverError,
} from '@/lib/api-response'

/**
 * GET /api/auth/session
 * Return current authenticated user + session metadata
 */
export async function GET() {
    try {
        const { user, session } = await validateRequest()

        if (!user || !session) {
            return unauthorized('No active session')
        }

        return createSuccessResponse({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: user.emailVerified,
            },
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
                fresh: session.fresh,
            },
        })
    } catch (error) {
        console.error('[GET /api/auth/session]', error)
        return serverError('Failed to fetch session')
    }
}
