import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getQuizConfig } from '@/lib/quiz'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

function extractYouTubeId(url: string | null): string | null {
    if (!url) return null
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

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

        const day1Module = await prisma.courseModule.findUnique({
            where: {
                courseId_dayNumber: {
                    courseId: course.id,
                    dayNumber: 1,
                },
            },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                contentText: true,
                notesPdfUrl: true,
                youtubeUrl: true,
                isFreePreview: true,
            },
        })

        if (!day1Module) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Day 1 module not found for this course',
                HttpStatus.NOT_FOUND
            )
        }

        // Fetch quiz questions for Day 1
        const quizQuestions = await prisma.quizQuestion.findMany({
            where: { moduleId: day1Module.id },
            select: {
                id: true,
                questionText: true,
                options: true,
                correctOptionIndex: true,
                orderIndex: true,
            },
            orderBy: { orderIndex: 'asc' },
        })

        // Get quiz config for pass percentage
        const config = await getQuizConfig()
        const passScore = Math.ceil(quizQuestions.length * (config.passPercentage / 100))

        const youtubeVideoId = extractYouTubeId(day1Module.youtubeUrl)

        return createSuccessResponse({
            day: {
                id: day1Module.id,
                dayNumber: day1Module.dayNumber,
                title: day1Module.title,
                description: day1Module.contentText,
                videoUrl: youtubeVideoId ? `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&iv_load_policy=3&fs=1` : null,
                content: day1Module.contentText,
                resources: day1Module.notesPdfUrl
                    ? [{ title: 'Day 1 Notes', url: day1Module.notesPdfUrl }]
                    : [],
                quiz: quizQuestions.length > 0
                    ? {
                        questions: quizQuestions.map((q, idx) => ({
                            id: idx + 1,
                            question: q.questionText,
                            options: q.options as string[],
                            correctOptionIndex: q.correctOptionIndex,
                        })),
                        passingScore: passScore,
                        totalQuestions: quizQuestions.length,
                    }
                    : null,
            },
        })
    } catch (error) {
        console.error('[GET /api/courses/[slug]/modules/day-1/preview]', error)
        return serverError('Failed to fetch day 1 preview')
    }
}