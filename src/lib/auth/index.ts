// Authentication module exports
export { lucia, adminLucia } from './lucia'
export type { LuciaUser, LuciaAdmin, LuciaSession } from './lucia'

export {
    validateRequest,
    validateAdminRequest,
    createSession,
    createAdminSession,
    invalidateSession,
    invalidateAdminSession,
} from './session'

export {
    requireAuth,
    requireAdmin,
    requireRole,
    requireSuperAdmin,
    requireAdminOrAbove,
    requireReviewerOrAbove,
    hasPermission,
    requirePermission,
    type AdminRole,
    type Permission,
} from './guards'
