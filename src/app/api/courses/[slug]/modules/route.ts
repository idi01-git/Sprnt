import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/courses/{slug}/modules
 * Get module overview list: day numbers, titles, locked status.
 * If authenticated and enrolled, includes user's unlock state.
 * Public endpoint — enhanced when authenticated.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // findFirst — slug is unique but we also filter by isActive/deletedAt
        const course = await prisma.course.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            select: { id: true },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                `Course '${slug}' not found`,
                HttpStatus.NOT_FOUND
            )
        }

        // Get all modules for this course
        const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                isFreePreview: true,
            },
            orderBy: { dayNumber: 'asc' },
        })

        // Optionally check auth — safe to fail silently for unauthenticated users
        let enrollment: {
            currentDay: number
            paymentStatus: string
            dailyProgress: { dayNumber: number; isLocked: boolean; quizPassed: boolean }[]
        } | null = null

        const { user } = await validateRequest()
        if (user) {
            enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: course.id,
                    },
                },
                select: {
                    currentDay: true,
                    paymentStatus: true,
                    dailyProgress: {
                        select: {
                            dayNumber: true,
                            isLocked: true,
                            quizPassed: true,
                        },
                    },
                },
            })
        }

        // Build enriched module list
        const enrichedModules = modules.map((mod) => {
            const progress = enrollment?.dailyProgress.find(
                (dp) => dp.dayNumber === mod.dayNumber
            )

            return {
                id: mod.id,
                dayNumber: mod.dayNumber,
                title: mod.title,
                isFreePreview: mod.isFreePreview,
                isLocked: progress ? progress.isLocked : !mod.isFreePreview,
                quizPassed: progress?.quizPassed ?? null,
                isEnrolled: enrollment?.paymentStatus === 'success',
            }
        })

        return createSuccessResponse({ modules: enrichedModules })
    } catch (error) {
        console.error('[GET /api/courses/[slug]/modules]', error)
        return serverError('Failed to fetch modules')
    }
}
