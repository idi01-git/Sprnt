import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({ where: { certificateId } })
        if (!certificate) return notFound('Certificate')

        await logAdminAction(adminId, 'certificate_regeneration_queued', 'certificate', certificate.id)

        // Actual PDF generation placeholder
        return createSuccessResponse({
            message: 'Certificate regeneration queued',
            certificateId
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/certificates/[certificateId]/regenerate]', error)
        return serverError()
    }
}
