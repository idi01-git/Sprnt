import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    notFound,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/analytics/courses/{courseId}/funnel
 * Returns module-by-module drop-off analysis for a specific course.
 * Auth: Admin with analytics:view permission
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        await requirePermission('analytics:view')

        const { courseId } = await params

        // Verify course exists
        const course = await prisma.course.findUnique({
            where: { courseId: courseId },
            select: { id: true, courseName: true, courseId: true },
        })

        if (!course) {
            return notFound('Course')
        }

        // Get total enrollments and all modules in parallel
        const [totalEnrollments, modules] = await Promise.all([
            prisma.enrollment.count({
                where: { courseId: course.id },
            }),
            prisma.courseModule.findMany({
                where: { courseId: course.id },
                orderBy: { dayNumber: 'asc' },
                select: {
                    id: true,
                    dayNumber: true,
                    title: true,
                },
            }),
        ])

        // Batch-fetch viewer counts for ALL modules in a single query
        // instead of N+1 individual queries
        const moduleIds = modules.map((m) => m.id)
        const viewCounts = await prisma.videoView.groupBy({
            by: ['videoAssetId'],
            where: {
                videoAsset: { courseModuleId: { in: moduleIds } },
            },
            _count: { id: true },
        })

        // Map video views back to modules via videoAsset → courseModule
        const videoAssetIds = viewCounts
            .map((vc) => vc.videoAssetId)
            .filter((id): id is string => id !== null)
        const videoAssets = await prisma.videoAsset.findMany({
            where: { id: { in: videoAssetIds } },
            select: { id: true, courseModuleId: true },
        })
        const videoAssetToModule = new Map<string, string>()
        for (const va of videoAssets) {
            if (va.courseModuleId) {
                videoAssetToModule.set(va.id, va.courseModuleId)
            }
        }

        // Aggregate view counts by module
        const moduleViewCounts = new Map<string, number>()
        for (const vc of viewCounts) {
            if (!vc.videoAssetId) continue
            const moduleId = videoAssetToModule.get(vc.videoAssetId)
            if (moduleId) {
                moduleViewCounts.set(
                    moduleId,
                    (moduleViewCounts.get(moduleId) ?? 0) + vc._count.id
                )
            }
        }

        const funnel = modules.map((mod) => {
            const viewersCount = moduleViewCounts.get(mod.id) ?? 0
            return {
                moduleId: mod.id,
                dayNumber: mod.dayNumber,
                title: mod.title,
                viewersCount,
                dropOffRate:
                    totalEnrollments > 0
                        ? Math.round(
                            (1 - viewersCount / totalEnrollments) * 100 * 100
                        ) / 100
                        : 0,
            }
        })

        return createSuccessResponse({
            course: {
                id: course.id,
                courseId: course.courseId,
                courseName: course.courseName,
            },
            totalEnrollments,
            funnel,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/courses/:id/funnel]', error)
        return serverError('Failed to fetch course funnel')
    }
}
