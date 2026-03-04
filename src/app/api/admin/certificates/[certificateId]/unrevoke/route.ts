import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { adminId } = await requireSuperAdmin()
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({ where: { certificateId } })
        if (!certificate) return notFound('Certificate')

        if (!certificate.isRevoked) {
            return conflict('Certificate is not revoked')
        }

        const updated = await prisma.certificate.update({
            where: { certificateId },
            data: {
                isRevoked: false,
                revokedAt: null,
                revokedBy: null,
                revocationReason: null,
            }
        })

        await logAdminAction(adminId, 'certificate_unrevoked', 'certificate', certificate.id)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/certificates/[certificateId]/unrevoke]', error)
        return serverError()
    }
}
