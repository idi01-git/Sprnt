import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, conflict, serverError, HttpStatus } from '@/lib/api-response'
import { adminCreateAdminSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const rawAdmins = await prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { assignedSubmissions: true } }
            }
        })

        // Omit passwordHash
        const admins = rawAdmins.map(({ passwordHash, ...rest }) => rest)

        return createSuccessResponse(admins)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/admins]', error)
        return serverError()
    }
}

export async function POST(request: Request) {
    try {
        const { adminId } = await requireSuperAdmin()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCreateAdminSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const existingEmail = await prisma.admin.findUnique({ where: { email: parsed.data.email } })

        if (existingEmail) return conflict('Email already exists')

        const passwordHash = await hash(parsed.data.password)

        const admin = await prisma.admin.create({
            data: {
                email: parsed.data.email,
                passwordHash,
                role: parsed.data.role,
            }
        })

        const { passwordHash: _, ...safeAdmin } = admin

        await logAdminAction(adminId, 'admin_account_created', 'admin', admin.id, { email: admin.email, role: admin.role })

        return createSuccessResponse(safeAdmin, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/admins]', error)
        return serverError()
    }
}
