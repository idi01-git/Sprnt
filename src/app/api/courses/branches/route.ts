import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    serverError,
} from '@/lib/api-response'
import { get, set, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

/**
 * GET /api/courses/branches
 * Return list of available branches with course counts
 */
export async function GET() {
    try {
        const cached = get<{ branches: { branch: string; courseCount: number }[] }>(CACHE_KEYS.COURSES_BRANCHES)
        if (cached) {
            return createSuccessResponse({ branches: cached.branches })
        }

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

        set(CACHE_KEYS.COURSES_BRANCHES, { branches }, CACHE_TTL.LONG)

        return createSuccessResponse({ branches })
    } catch (error) {
        console.error('[GET /api/courses/branches]', error)
        return serverError('Failed to fetch branches')
    }
}
