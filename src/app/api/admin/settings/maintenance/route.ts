import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminMaintenanceModeSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(request: Request) {
    try {
        const { adminId } = await requireSuperAdmin()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminMaintenanceModeSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const valueObj = {
            enabled: parsed.data.enabled,
            message: parsed.data.message ?? ''
        }

        const updated = await prisma.systemSetting.upsert({
            where: { settingKey: 'maintenance_mode' },
            update: {
                settingValue: valueObj,
                updatedBy: adminId
            },
            create: {
                settingKey: 'maintenance_mode',
                settingValue: valueObj,
                updatedBy: adminId
            },
        })

        await logAdminAction(adminId, 'maintenance_mode_toggled', 'setting', 'maintenance_mode', valueObj)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/settings/maintenance]', error)
        return serverError()
    }
}
