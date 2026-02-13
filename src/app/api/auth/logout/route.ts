import { validateRequest, invalidateSession } from '@/lib/auth/session'
import {
    createSuccessResponse,
    unauthorized,
    serverError,
} from '@/lib/api-response'

/**
 * POST /api/auth/logout
 * Destroy current session, clear cookie
 */
export async function POST() {
    try {
        const { session } = await validateRequest()

        if (!session) {
            return unauthorized('No active session')
        }

        await invalidateSession(session.id)

        return createSuccessResponse({ message: 'Logged out successfully' })
    } catch (error) {
        console.error('[POST /api/auth/logout]', error)
        return serverError('Logout failed')
    }
}
