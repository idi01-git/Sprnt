import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            include: {
                user: { select: { name: true, email: true } },
                course: { select: { courseName: true, courseId: true, affiliatedBranch: true } },
                revoker: { select: { username: true, email: true } },
            },
        })

        if (!certificate) {
            return notFound('Certificate')
        }

        return createSuccessResponse(certificate)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates/[certificateId]]', error)
        return serverError()
    }
}
