import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { adminUpdateAdminSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        await requireSuperAdmin()
        const { adminId } = await params

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            include: {
                _count: { select: { adminSessions: true, assignedSubmissions: true } },
            }
        })

        if (!admin) return notFound('Admin')

        const { passwordHash, ...safeAdmin } = admin

        return createSuccessResponse({
            ...safeAdmin,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/admins/[adminId]]', error)
        return serverError()
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        const { adminId: currentAdminId } = await requireSuperAdmin()
        const { adminId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateAdminSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        if (currentAdminId === adminId && parsed.data.role) {
            return createSuccessResponse(
                { message: 'Cannot change your own role' },
                HttpStatus.FORBIDDEN
            )
        }

        const admin = await prisma.admin.findUnique({ where: { id: adminId } })
        if (!admin) return notFound('Admin')

        if (parsed.data.email && parsed.data.email !== admin.email) {
            const existing = await prisma.admin.findUnique({ where: { email: parsed.data.email } })
            if (existing) return conflict('Email already exists')
        }

        const updated = await prisma.admin.update({
            where: { id: adminId },
            data: parsed.data,
        })

        const { passwordHash, ...safeAdmin } = updated

        await logAdminAction(currentAdminId, 'admin_account_updated', 'admin', adminId)

        return createSuccessResponse(safeAdmin)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/admins/[adminId]]', error)
        return serverError()
    }
}
