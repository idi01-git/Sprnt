import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminBulkUpdateSettingsSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'
import { del, CACHE_KEYS } from '@/lib/cache'
import { Prisma } from '@/generated/prisma/client'

export async function PUT(request: Request) {
    try {
        const { adminId } = await requireSuperAdmin()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminBulkUpdateSettingsSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        await prisma.$transaction(
            parsed.data.settings.map(s =>
                prisma.systemSetting.upsert({
                    where: { settingKey: s.key },
                    update: {
                        settingValue: s.value ? (s.value as Prisma.InputJsonValue) : undefined,
                        updatedBy: adminId
                    },
                    create: {
                        settingKey: s.key,
                        settingValue: s.value ? (s.value as Prisma.InputJsonValue) : Prisma.JsonNull,
                        updatedBy: adminId
                    },
                })
            )
        )

        await logAdminAction(adminId, 'settings_bulk_updated', 'setting', 'bulk', { keys: parsed.data.settings.map(s => s.key) })

        const hasQuizSettings = parsed.data.settings.some(s => s.key.startsWith('quiz_'))
        if (hasQuizSettings) {
            del(CACHE_KEYS.QUIZ_CONFIG)
        }

        return createSuccessResponse({ message: 'Settings updated successfully' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[PUT /api/admin/settings/bulk]', error)
        return serverError('Failed to update settings')
    }
}
