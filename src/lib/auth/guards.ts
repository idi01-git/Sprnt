import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { validateAdminRequest } from './session'
import type { Admin, AdminRole } from '@/generated/prisma/client'
import type { User } from '@/generated/prisma/client'

export class AuthError extends Error {
    constructor(message = 'Authentication required') {
        super(message)
        this.name = 'AuthError'
    }
}

export type { AdminRole } from '@/generated/prisma/client'

interface AdminContext {
    adminId: string
    role: AdminRole
    admin: Admin
}

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

export async function requireAdmin(): Promise<AdminContext> {
    const { user } = await validateAdminRequest()
    if (!user) throw new AuthError('Admin authentication required')

    const admin = await prisma.admin.findUnique({ where: { id: user.id } })
    if (!admin || !admin.isActive) throw new AuthError('Admin authentication required')

    return { adminId: admin.id, role: admin.role as AdminRole, admin }
}

export async function requireRole(allowedRoles: AdminRole[]): Promise<AdminContext> {
    const ctx = await requireAdmin()
    if (!allowedRoles.includes(ctx.role)) {
        throw new Error(`Insufficient permissions: role '${ctx.role}' not in [${allowedRoles.join(', ')}]`)
    }
    return ctx
}

export async function requireSuperAdmin(): Promise<AdminContext> {
    return requireRole(['super_admin'])
}

export async function requireAdminOrAbove(): Promise<AdminContext> {
    return requireRole(['admin', 'super_admin'])
}

export async function requireReviewerOrAbove(): Promise<AdminContext> {
    return requireRole(['reviewer', 'admin', 'super_admin'])
}

export function hasPermission(role: AdminRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export async function requirePermission(permission: Permission): Promise<AdminContext> {
    const ctx = await requireAdmin()
    if (!hasPermission(ctx.role, permission)) {
        throw new Error(`Permission denied: '${ctx.role}' lacks '${permission}'`)
    }
    return ctx
}

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
    | 'referrals:view'
    | 'withdrawals:view'
    | 'withdrawals:reject'
    | 'admins:manage'

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    super_admin: [
        'submissions:view_all', 'submissions:assign', 'submissions:grade_any',
        'courses:create', 'courses:edit', 'courses:delete',
        'users:view', 'users:edit', 'users:delete',
        'settings:view', 'settings:edit',
        'promocodes:create', 'promocodes:edit',
        'withdrawals:process', 'analytics:view', 'emails:send',
        'referrals:view', 'withdrawals:view', 'withdrawals:reject', 'admins:manage',
    ],
    admin: [
        'submissions:view_all', 'submissions:assign', 'submissions:grade_any',
        'courses:create', 'courses:edit',
        'users:view', 'users:edit',
        'settings:view', 'promocodes:create', 'promocodes:edit',
        'withdrawals:process', 'analytics:view', 'emails:send',
        'referrals:view', 'withdrawals:view', 'withdrawals:reject',
    ],
    reviewer: [
        'submissions:view_assigned', 'submissions:grade_assigned', 'analytics:view',
    ],
}