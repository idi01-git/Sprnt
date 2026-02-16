import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import type { User, Admin, AdminRole } from '@/generated/prisma/client'

// Custom error class for authentication failures
// API routes catch this and return 401 JSON instead of crashing
export class AuthError extends Error {
    constructor(message = 'Authentication required') {
        super(message)
        this.name = 'AuthError'
    }
}

// ============================================================================
// STUDENT GUARDS
// ============================================================================

/**
 * Requires user to be authenticated as a student
 * Redirects to /login if not authenticated
 * 
 * @returns Authenticated user object
 */
export async function requireAuth(): Promise<User> {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')

    if (!userId) {
        throw new AuthError()
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user || user.deletedAt) {
        throw new AuthError()
    }

    return user
}

// ============================================================================
// ADMIN GUARDS
// ============================================================================

// AdminRole is imported from Prisma (`super_admin | admin | reviewer`)
// Re-export for downstream consumers
export type { AdminRole } from '@/generated/prisma/client'

interface AdminContext {
    adminId: string
    role: AdminRole
    admin: Admin
}

/**
 * Requires user to be authenticated as admin
 * Redirects to /admin/login if not authenticated
 * 
 * @returns Admin context with ID and role
 */
export async function requireAdmin(): Promise<AdminContext> {
    const headersList = await headers()
    const adminId = headersList.get('x-admin-id')
    const role = headersList.get('x-admin-role') as AdminRole | null

    if (!adminId || !role) {
        throw new AuthError('Admin authentication required')
    }

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    })

    if (!admin || !admin.isActive) {
        throw new AuthError('Admin authentication required')
    }

    return { adminId, role, admin }
}

/**
 * Requires admin to have one of the specified roles
 * Throws error if insufficient permissions
 * 
 * @param allowedRoles Array of allowed admin roles
 * @returns Admin context
 */
export async function requireRole(allowedRoles: AdminRole[]): Promise<AdminContext> {
    const { adminId, role, admin } = await requireAdmin()

    if (!allowedRoles.includes(role)) {
        throw new Error(`Insufficient permissions: role '${role}' not in [${allowedRoles.join(', ')}]`)
    }

    return { adminId, role, admin }
}

/**
 * Requires SuperAdmin role
 */
export async function requireSuperAdmin(): Promise<AdminContext> {
    return requireRole(['super_admin'])
}

/**
 * Requires Admin or SuperAdmin role
 */
export async function requireAdminOrAbove(): Promise<AdminContext> {
    return requireRole(['admin', 'super_admin'])
}

/**
 * Requires Reviewer, Admin, or SuperAdmin role
 */
export async function requireReviewerOrAbove(): Promise<AdminContext> {
    return requireRole(['reviewer', 'admin', 'super_admin'])
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if admin has permission for a specific action
 * Does not redirect, just returns boolean
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role]
    return rolePermissions?.includes(permission) ?? false
}

/**
 * Require specific permission, throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<AdminContext> {
    const { adminId, role, admin } = await requireAdmin()

    if (!hasPermission(role, permission)) {
        throw new Error(`Permission denied: '${role}' lacks '${permission}'`)
    }

    return { adminId, role, admin }
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export type Permission =
    | 'submissions:view_all'
    | 'submissions:view_assigned'
    | 'submissions:assign'
    | 'submissions:grade_any'
    | 'submissions:grade_assigned'
    | 'courses:create'
    | 'courses:edit'
    | 'courses:delete'
    | 'users:view'
    | 'users:edit'
    | 'users:delete'
    | 'settings:view'
    | 'settings:edit'
    | 'promocodes:create'
    | 'promocodes:edit'
    | 'withdrawals:process'
    | 'analytics:view'
    | 'emails:send'

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    super_admin: [
        'submissions:view_all',
        'submissions:assign',
        'submissions:grade_any',
        'courses:create',
        'courses:edit',
        'courses:delete',
        'users:view',
        'users:edit',
        'users:delete',
        'settings:view',
        'settings:edit',
        'promocodes:create',
        'promocodes:edit',
        'withdrawals:process',
        'analytics:view',
        'emails:send',
    ],
    admin: [
        'submissions:view_all',
        'submissions:assign',
        'submissions:grade_any',
        'courses:create',
        'courses:edit',
        'users:view',
        'users:edit',
        'settings:view',
        'promocodes:create',
        'promocodes:edit',
        'withdrawals:process',
        'analytics:view',
        'emails:send',
    ],
    reviewer: [
        'submissions:view_assigned',
        'submissions:grade_assigned',
        'analytics:view',
    ],
}
