import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ logId: string }> }
) {
    try {
        await requireSuperAdmin()
        const { logId } = await params

        const log = await prisma.webhookLog.findUnique({
            where: { id: logId }
        })

        if (!log) {
            return notFound('Webhook Log')
        }

        return createSuccessResponse(log)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/webhook-logs/[logId]]', error)
        return serverError()
    }
}
