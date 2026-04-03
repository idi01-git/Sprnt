import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/courses/branches
 * Returns all branches (for admin filtering, includes inactive courses)
 */
export async function GET() {
    try {
        await requireAdminOrAbove()

        const branches = await prisma.course.findMany({
            where: { deletedAt: null },
            select: { affiliatedBranch: true },
            distinct: ['affiliatedBranch'],
            orderBy: { affiliatedBranch: 'asc' },
        })

        return createSuccessResponse({
            branches: branches.map(b => ({ branch: b.affiliatedBranch, courseCount: 0 }))
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/branches]', error)
        return serverError('Failed to fetch branches')
    }
}