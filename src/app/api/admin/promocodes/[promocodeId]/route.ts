import { prisma } from '@/lib/db'
import { requireAdminOrAbove, requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminUpdatePromocodeSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { promocodeId } = await params

        const promocode = await prisma.promocode.findFirst({
            where: {
                id: promocodeId,
                deletedAt: null,
            },
            include: {
                _count: { select: { usages: true } },
                creator: { select: { username: true } },
            }
        })

        if (!promocode) {
            return notFound('Promocode')
        }

        return createSuccessResponse(promocode)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/promocodes/[promocodeId]]', error)
        return serverError()
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { promocodeId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdatePromocodeSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const promocode = await prisma.promocode.findFirst({
            where: { id: promocodeId, deletedAt: null }
        })

        if (!promocode) return notFound('Promocode')

        const updated = await prisma.promocode.update({
            where: { id: promocodeId },
            data: parsed.data
        })

        await logAdminAction(adminId, 'promocode_updated', 'promocode', promocodeId)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/promocodes/[promocodeId]]', error)
        return serverError()
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { adminId } = await requireSuperAdmin()
        const { promocodeId } = await params

        const promocode = await prisma.promocode.findFirst({
            where: { id: promocodeId, deletedAt: null }
        })

        if (!promocode) return notFound('Promocode')

        const usageCount = await prisma.promocodeUsage.count({
            where: { promocodeId }
        })

        if (usageCount > 0) {
            await prisma.promocode.update({
                where: { id: promocodeId },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                }
            })
            await logAdminAction(adminId, 'promocode_soft_deleted', 'promocode', promocodeId)
            return createSuccessResponse({ message: 'Promocode was soft-deleted because it has been used' })
        } else {
            await prisma.promocode.delete({
                where: { id: promocodeId }
            })
            await logAdminAction(adminId, 'promocode_hard_deleted', 'promocode', promocodeId)
            return createSuccessResponse({ message: 'Promocode permanently deleted' })
        }
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[DELETE /api/admin/promocodes/[promocodeId]]', error)
        return serverError()
    }
}
