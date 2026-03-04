import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

// =============================================================================
// Helper: Verify module context
// =============================================================================

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
    })
}

// =============================================================================
// GET /api/admin/courses/[courseId]/modules/[moduleId]/quiz/preview — Student view
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

        const questions = (module.quizQuestions as any[]) || []

        // Strip correct answers for preview (simulate student experience)
        // Note: The schema for quiz questions is defined in validations/admin.ts
        // Structure: { question: string, options: { text: string, isCorrect: boolean }[] }

        const preview = questions.map((q: any) => ({
            question: q.question,
            options: q.options.map((o: any) => ({
                text: o.text,
                // explicit removal of isCorrect not strictly needed if we map new object, but good for clarity
            })),
        }))

        return createSuccessResponse(preview)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[GET /api/admin/courses/[courseId]/modules/[moduleId]/quiz/preview]',
            error,
        )
        return serverError()
    }
}
