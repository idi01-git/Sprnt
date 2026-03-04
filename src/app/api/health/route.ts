import { prisma } from '@/lib/db'
import { createSuccessResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Quick DB ping
        await prisma.$queryRaw`SELECT 1`

        return createSuccessResponse({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
        })
    } catch (error) {
        console.error('[GET /api/health]', error)
        return createSuccessResponse({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
        })
    }
}
