import { Lucia } from 'lucia'
import { studentAdapter, adminAdapter } from './adapter'
import type { Session, User, Admin } from '@/generated/prisma/client'

// ============================================================================
// STUDENT AUTHENTICATION
// ============================================================================

export const lucia = new Lucia(studentAdapter, {
    sessionCookie: {
        name: 'sprintern_session',
        expires: false, // Session cookies (browser-based expiry)
        attributes: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/', // Ensure cookie is sent to all routes
        },
    },
    sessionExpiration: {
        absolute: 30 * 24 * 60 * 60 * 1000, // 30 days absolute lifetime
        idle: 24 * 60 * 60 * 1000, // 24 hours idle timeout
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            name: attributes.name,
            role: attributes.role,
            emailVerified: attributes.emailVerified,
            phone: attributes.phone,
        }
    },
})

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

export const adminLucia = new Lucia(adminAdapter, {
    sessionCookie: {
        name: 'admin_session',
        expires: false,
        attributes: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        },
    },
    sessionExpiration: {
        absolute: 30 * 24 * 60 * 60 * 1000, // 30 days absolute lifetime
        idle: 8 * 60 * 60 * 1000, // 8 hours idle timeout for admins
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            username: attributes.username,
            role: attributes.role,
            isActive: attributes.isActive,
        }
    },
})

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia
        DatabaseUserAttributes: DatabaseUserAttributes
    }
}

// Unified user attributes (Student | Admin)
// fields are optional because a user is either Student OR Admin
interface DatabaseUserAttributes {
    email: string
    role: string // UserRole | AdminRole

    // Student specific
    name?: string
    emailVerified?: boolean
    phone?: string | null

    // Admin specific
    username?: string
    isActive?: boolean
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LuciaUser = Omit<User, 'passwordHash' | 'deletedAt'>
export type LuciaAdmin = Omit<Admin, 'passwordHash'>
export type LuciaSession = Session
