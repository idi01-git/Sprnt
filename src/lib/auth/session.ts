import { cookies } from 'next/headers'
import { cache } from 'react'
import { lucia, adminLucia } from './lucia'
import { prisma } from '@/lib/db'
import type { Session, User } from 'lucia'

// ============================================================================
// STUDENT SESSION VALIDATION
// ============================================================================

export const validateRequest = cache(
    async (): Promise<
        { user: User; session: Session } | { user: null; session: null }
    > => {
        const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null

        if (!sessionId) {
            return {
                user: null,
                session: null,
            }
        }

        const result = await lucia.validateSession(sessionId)

        // Refresh session cookie if session is fresh
        try {
            if (result.session && result.session.fresh) {
                const sessionCookie = lucia.createSessionCookie(result.session.id)
                    ; (await cookies()).set(
                        sessionCookie.name,
                        sessionCookie.value,
                        sessionCookie.attributes
                    )
            }
            if (!result.session) {
                const sessionCookie = lucia.createBlankSessionCookie()
                    ; (await cookies()).set(
                        sessionCookie.name,
                        sessionCookie.value,
                        sessionCookie.attributes
                    )
            }
        } catch {
            // Next.js throws error when trying to set cookies during initial render
            // This is expected and can be safely ignored
        }

        return result
    }
)

// ============================================================================
// ADMIN SESSION VALIDATION
// ============================================================================

export const validateAdminRequest = cache(
    async (): Promise<
        { user: User; session: Session } | { user: null; session: null }
    > => {
        const sessionId =
            (await cookies()).get(adminLucia.sessionCookieName)?.value ?? null

        if (!sessionId) {
            return {
                user: null,
                session: null,
            }
        }

        const result = await adminLucia.validateSession(sessionId)

        // Refresh session cookie if session is fresh
        try {
            if (result.session && result.session.fresh) {
                const sessionCookie = adminLucia.createSessionCookie(result.session.id)
                    ; (await cookies()).set(
                        sessionCookie.name,
                        sessionCookie.value,
                        sessionCookie.attributes
                    )
            }
            if (!result.session) {
                const sessionCookie = adminLucia.createBlankSessionCookie()
                    ; (await cookies()).set(
                        sessionCookie.name,
                        sessionCookie.value,
                        sessionCookie.attributes
                    )
            }
        } catch {
            // Same as above - expected Next.js behavior
        }

        return result
    }
)

// ============================================================================
// SESSION HELPERS
// ============================================================================

/**
 * Creates a new student session
 */
export async function createSession(userId: string): Promise<Session> {
    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
        ; (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        )
    return session
}

/**
 * Creates a new admin session
 */
export async function createAdminSession(adminId: string): Promise<Session> {
    const session = await adminLucia.createSession(adminId, {})

    // Update last login timestamp (once per session, not per request)
    await prisma.admin.update({
        where: { id: adminId },
        data: { lastLogin: new Date() }
    })

    const sessionCookie = adminLucia.createSessionCookie(session.id)
        ; (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        )
    return session
}

/**
 * Invalidates student session and clears cookie
 */
export async function invalidateSession(sessionId: string): Promise<void> {
    await lucia.invalidateSession(sessionId)
    const sessionCookie = lucia.createBlankSessionCookie()
        ; (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        )
}

/**
 * Invalidates admin session and clears cookie
 */
export async function invalidateAdminSession(sessionId: string): Promise<void> {
    await adminLucia.invalidateSession(sessionId)
    const sessionCookie = adminLucia.createBlankSessionCookie()
        ; (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        )
}
