import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { adminRevokeCertificateSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { certificateId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminRevokeCertificateSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const certificate = await prisma.certificate.findUnique({ where: { certificateId } })
        if (!certificate) return notFound('Certificate')

        if (certificate.isRevoked) {
            return conflict('Certificate is already revoked')
        }

        const updated = await prisma.certificate.update({
            where: { certificateId },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokedBy: adminId,
                revocationReason: parsed.data.reason,
            }
        })

        await logAdminAction(adminId, 'certificate_revoked', 'certificate', certificate.id, { reason: parsed.data.reason })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/certificates/[certificateId]/revoke]', error)
        return serverError()
    }
}
