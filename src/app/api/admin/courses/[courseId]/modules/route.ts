import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminCreateModuleSchema } from '@/lib/validations/admin'

// =============================================================================
// GET /api/admin/courses/[courseId]/modules — List modules
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id },
            orderBy: { dayNumber: 'asc' },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                isFreePreview: true,
                updatedAt: true,
                // Partial content preview
                contentText: false, // Don't fetch full content in list
                videoAssets: {
                    select: { id: true, durationSeconds: true },
                },
                _count: {
                    select: { videoAssets: true },
                },
            },
        })

        // Add content preview manually if needed, or just return metadata
        const response = modules.map((m) => ({
            ...m,
            videoCount: m._count.videoAssets,
        }))

        return createSuccessResponse(response)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/modules]', error)
        return serverError()
    }
}

// =============================================================================
// POST /api/admin/courses/[courseId]/modules — Create module
// =============================================================================

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCreateModuleSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        // Check unique day number constraint
        const existing = await prisma.courseModule.findFirst({
            where: {
                courseId: course.id,
                dayNumber: data.dayNumber,
            },
        })

        if (existing) {
            return conflict(`Module for Day ${data.dayNumber} already exists`)
        }

        const module = await prisma.courseModule.create({
            data: {
                courseId: course.id,
                dayNumber: data.dayNumber,
                title: data.title,
                contentText: data.contentText,
                quizQuestions: data.quizQuestions, // Already validated schema
                isFreePreview: data.isFreePreview,
            },
        })

        return createSuccessResponse(module, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/courses/[courseId]/modules]', error)
        return serverError()
    }
}
