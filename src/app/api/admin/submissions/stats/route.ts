import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireReviewerOrAbove()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [pending, underReview, approvedToday, rejectedToday] = await Promise.all([
            prisma.submission.count({ where: { reviewStatus: 'pending' } }),
            prisma.submission.count({ where: { reviewStatus: 'under_review' } }),
            prisma.submission.count({ where: { reviewStatus: 'approved', reviewCompletedAt: { gte: today } } }),
            prisma.submission.count({ where: { reviewStatus: 'rejected', reviewCompletedAt: { gte: today } } }),
        ])

        return createSuccessResponse({
            pending,
            underReview,
            approvedToday,
            rejectedToday,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/stats]', error)
        return serverError()
    }
}
