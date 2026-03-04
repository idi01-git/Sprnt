import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ templateKey: string }> }
) {
    try {
        const adminContext = await requireSuperAdmin()
        const { templateKey } = await params

        const template = await prisma.emailTemplate.findUnique({ where: { templateKey } })
        if (!template) return notFound('Email Template')

        // Fetch the admin's actual email to send to
        const adminUser = await prisma.admin.findUnique({ where: { id: adminContext.adminId } })

        // Placeholder for actually sending the email
        console.info(`[email-preview] Test email for template ${templateKey} sent to ${adminUser?.email}`)

        return createSuccessResponse({ message: 'Test email sent' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/settings/email-templates/[templateKey]/preview]', error)
        return serverError()
    }
}
