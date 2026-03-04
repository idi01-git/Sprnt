import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminUpdateSettingSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'
import { del, CACHE_KEYS } from '@/lib/cache'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ settingKey: string }> }
) {
    try {
        await requireSuperAdmin()
        const { settingKey } = await params

        const setting = await prisma.systemSetting.findUnique({
            where: { settingKey }
        })

        if (!setting) {
            return notFound('Setting')
        }

        return createSuccessResponse(setting)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/settings/[settingKey]]', error)
        return serverError()
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ settingKey: string }> }
) {
    try {
        const { adminId } = await requireSuperAdmin()
        const { settingKey } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateSettingSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const setting = await prisma.systemSetting.findUnique({ where: { settingKey } })
        if (!setting) return notFound('Setting')

        const updated = await prisma.systemSetting.update({
            where: { settingKey },
            data: {
                settingValue: parsed.data.value ? (parsed.data.value as Prisma.InputJsonValue) : undefined,
                updatedBy: adminId
            }
        })

        await logAdminAction(adminId, 'setting_updated', 'setting', settingKey)

        if (settingKey.startsWith('quiz_')) {
            del(CACHE_KEYS.QUIZ_CONFIG)
        }

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/settings/[settingKey]]', error)
        return serverError()
    }
}
