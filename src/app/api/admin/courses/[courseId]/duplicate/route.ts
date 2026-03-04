import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import crypto from 'crypto'

// =============================================================================
// Helpers
// =============================================================================

function generateCourseId(): string {
    return `COURSE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

function slugify(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    const suffix = crypto.randomBytes(3).toString('hex')
    return `${base}-${suffix}`
}

// =============================================================================
// POST /api/admin/courses/[courseId]/duplicate — Duplicate course
// =============================================================================

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const sourceCourse = await prisma.course.findUnique({
            where: { courseId },
            include: {
                modules: true, // Fetch all modules
            },
        })

        if (!sourceCourse) return notFound('Course')

        const newCourseId = generateCourseId()
        const newSlug = slugify(`${sourceCourse.courseName} Copy`)

        // Transaction to ensure atomicity
        const newCourse = await prisma.$transaction(async (tx) => {
            // 1. Create duplicate course
            const created = await tx.course.create({
                data: {
                    courseId: newCourseId,
                    slug: newSlug,
                    courseName: `${sourceCourse.courseName} (Copy)`,
                    affiliatedBranch: sourceCourse.affiliatedBranch,
                    coursePrice: sourceCourse.coursePrice,
                    courseThumbnail: sourceCourse.courseThumbnail, // Keep same image
                    courseDescription: sourceCourse.courseDescription,
                    problemStatementText: sourceCourse.problemStatementText,
                    // Don't copy specific files that might need re-upload context,
                    // but for now copying URLs is fine as they are in R2
                    courseTranscriptUrl: sourceCourse.courseTranscriptUrl,
                    problemStatementPdfUrl: sourceCourse.problemStatementPdfUrl,
                    tags: sourceCourse.tags ?? {},
                    isActive: false, // Default to inactive
                },
            })

            // 2. Duplicate modules
            if (sourceCourse.modules.length > 0) {
                await tx.courseModule.createMany({
                    data: sourceCourse.modules.map((m) => ({
                        courseId: created.id, // Use internal ID of new course
                        dayNumber: m.dayNumber,
                        title: m.title,
                        contentText: m.contentText,
                        notesPdfUrl: m.notesPdfUrl,
                        quizQuestions: m.quizQuestions ?? [],
                        isFreePreview: m.isFreePreview,
                    })),
                })
            }

            return created
        })

        return createSuccessResponse(newCourse, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/courses/[courseId]/duplicate]', error)
        return serverError()
    }
}
