import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminReplaceQuizSchema } from '@/lib/validations/admin'

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
        })

        return createSuccessResponse(questions)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[GET /api/admin/courses/[courseId]/modules/[moduleId]/quiz]',
            error,
        )
        return serverError()
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await prisma.courseModule.findFirst({
            where: { id: moduleId, course: { courseId } },
        })
        if (!module) return notFound('Module')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminReplaceQuizSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        await prisma.$transaction([
            prisma.quizQuestion.deleteMany({ where: { moduleId } }),
            prisma.quizQuestion.createMany({
                data: parsed.data.questions.map((q, idx) => {
                    const correctIdx = q.options.findIndex((o: { isCorrect: boolean }) => o.isCorrect)
                    return {
                        moduleId,
                        questionText: q.question,
                        options: q.options.map((o: { text: string }) => o.text) as unknown as object,
                        correctOptionIndex: correctIdx,
                        orderIndex: idx,
                    }
                }),
            }),
        ])

        const updated = await prisma.quizQuestion.findMany({
            where: { moduleId },
            orderBy: { orderIndex: 'asc' },
        })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[PUT /api/admin/courses/[courseId]/modules/[moduleId]/quiz]',
            error,
        )
        return serverError()
    }
}
