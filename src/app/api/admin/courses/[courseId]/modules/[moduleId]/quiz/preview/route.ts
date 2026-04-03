import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await prisma.courseModule.findFirst({
            where: { id: moduleId, course: { courseId } },
        })
        if (!module) return notFound('Module')

        const questions = await prisma.quizQuestion.findMany({
            where: { moduleId },
            orderBy: { orderIndex: 'asc' },
            select: {
                questionText: true,
                options: true,
            },
        })

        const preview = questions.map((q) => ({
            question: q.questionText,
            options: (q.options as string[]).map((text: string) => ({ text })),
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
