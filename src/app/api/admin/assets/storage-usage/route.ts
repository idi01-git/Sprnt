import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

// =============================================================================
// GET /api/admin/assets/storage-usage — Storage usage stats
// =============================================================================

export async function GET() {
    try {
        await requireSuperAdmin()

        // Group by bucket to show usage per bucket
        const usage = await prisma.videoAsset.groupBy({
            by: ['r2Bucket'],
            _sum: {
                fileSizeBytes: true,
            },
            _count: {
                id: true,
            },
        })

        // Map BigInt to string/number for JSON
        const formatted = usage.map((bucket) => ({
            bucket: bucket.r2Bucket,
            totalBytes: bucket._sum.fileSizeBytes?.toString() || '0',
            fileCount: bucket._count.id,
        }))

        // Calculate grand total
        const totalBytes = usage.reduce(
            (acc, curr) => acc + (curr._sum.fileSizeBytes || BigInt(0)),
            BigInt(0),
        )

        return createSuccessResponse({
            buckets: formatted,
            totalBytes: totalBytes.toString(),
            totalFiles: usage.reduce((acc, curr) => acc + curr._count.id, 0),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/assets/storage-usage]', error)
        return serverError()
    }
}
