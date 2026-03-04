import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const templates = await prisma.emailTemplate.findMany({
            orderBy: { templateKey: 'asc' }
        })

        return createSuccessResponse(templates)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/settings/email-templates]', error)
        return serverError()
    }
}
