import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ withdrawalId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { withdrawalId } = await params

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
            include: { user: { select: { name: true, email: true } } }
        })

        if (!withdrawal) {
            return notFound('Withdrawal')
        }

        // Destructure and omit upiId to keep it safe from general viewing read ops
        const { upiId, ...safeData } = withdrawal

        return createSuccessResponse(safeData)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/withdrawals/[withdrawalId]]', error)
        return serverError()
    }
}
