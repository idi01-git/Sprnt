import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { headers } from 'next/headers'

export async function logAdminAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>,
) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')
        ?? headersList.get('x-real-ip')
        ?? 'unknown'

    await prisma.adminLog.create({
        data: {
            adminId,
            action,
            entityType,
            entityId,
            details: details ? (details as Prisma.InputJsonValue) : undefined,
            ipAddress: ip.split(',')[0].trim(),
        },
    }).catch((e) => {
        console.error('[AdminLogger] Failed to log action:', e)
    })
}
