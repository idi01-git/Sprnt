import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminUpdateEmailTemplateSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ templateKey: string }> }
) {
    try {
        const { adminId } = await requireSuperAdmin()
        const { templateKey } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateEmailTemplateSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const template = await prisma.emailTemplate.findUnique({ where: { templateKey } })
        if (!template) return notFound('Email Template')

        const updated = await prisma.emailTemplate.update({
            where: { templateKey },
            data: {
                ...parsed.data,
                updatedBy: adminId
            }
        })

        await logAdminAction(adminId, 'email_template_updated', 'email_template', templateKey)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/settings/email-templates/[templateKey]]', error)
        return serverError()
    }
}
