export async function logAdminAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>,
) {
    console.info(`[AdminAction] admin=${adminId} action=${action} entity=${entityType}:${entityId}`, details ?? '')
}
