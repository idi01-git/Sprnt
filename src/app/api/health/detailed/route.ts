import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        await requireSuperAdmin()

        const checks: Record<string, unknown> = {}

        // 1. Database latency
        const dbStart = Date.now()
        try {
            await prisma.$queryRaw`SELECT 1`
            checks.database = { status: 'connected', latencyMs: Date.now() - dbStart }
        } catch {
            checks.database = { status: 'disconnected', latencyMs: null }
        }

        // 2. R2 configuration
        checks.r2 = {
            configured: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
            bucket: process.env.R2_BUCKET_NAME ?? 'not set',
        }

        // 3. Razorpay configuration
        checks.razorpay = {
            configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
        }

        // 4. Resend (email)
        checks.email = {
            configured: !!process.env.RESEND_API_KEY,
        }

        // 5. Counts
        const [userCount, courseCount, enrollmentCount] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.enrollment.count(),
        ])
        checks.counts = { users: userCount, courses: courseCount, enrollments: enrollmentCount }

        return createSuccessResponse({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? '0.1.0',
            environment: process.env.NODE_ENV ?? 'development',
            checks,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/health/detailed]', error)
        return serverError()
    }
}
