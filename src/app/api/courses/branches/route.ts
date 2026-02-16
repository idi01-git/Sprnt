import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    serverError,
} from '@/lib/api-response'

/**
 * GET /api/courses/branches
 * Return list of available branches with course counts
 */
export async function GET() {
    try {
        const branchCounts = await prisma.course.groupBy({
            by: ['affiliatedBranch'],
            where: {
                isActive: true,
                deletedAt: null,
            },
            _count: {
                _all: true,
            },
            orderBy: {
                affiliatedBranch: 'asc',
            },
        })

        const branches = branchCounts.map((item) => ({
            branch: item.affiliatedBranch,
            courseCount: item._count._all,
        }))

        return createSuccessResponse({ branches })
    } catch (error) {
        console.error('[GET /api/courses/branches]', error)
        return serverError('Failed to fetch branches')
    }
}
