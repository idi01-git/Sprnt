import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminReplaceQuizSchema } from '@/lib/validations/admin'

// =============================================================================
// Helper: Verify module context
// =============================================================================

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
    })
}

// =============================================================================
// GET /api/admin/courses/[courseId]/modules/[moduleId]/quiz — Admin view
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        // Return raw quizQuestions JSON (includes correct answers)
        return createSuccessResponse(module.quizQuestions)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[GET /api/admin/courses/[courseId]/modules/[moduleId]/quiz]',
            error,
        )
        return serverError()
    }
}

// =============================================================================
// PUT /api/admin/courses/[courseId]/modules/[moduleId]/quiz — Replace quiz
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminReplaceQuizSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const updated = await prisma.courseModule.update({
            where: { id: moduleId },
            data: {
                quizQuestions: parsed.data.questions,
            },
        })

        return createSuccessResponse(updated.quizQuestions)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[PUT /api/admin/courses/[courseId]/modules/[moduleId]/quiz]',
            error,
        )
        return serverError()
    }
}
