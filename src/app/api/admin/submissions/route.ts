import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminSubmissionListQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireReviewerOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminSubmissionListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { status, search, courseId, page, limit, sort } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.SubmissionWhereInput = {}

        if (status !== 'all') {
            where.reviewStatus = status
        }

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            }
        }

        if (courseId) {
            where.enrollment = {
                course: {
                    courseId
                }
            }
        }

        const orderBy = sort === 'oldest' ? { submittedAt: 'asc' as const } : { submittedAt: 'desc' as const }

        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    user: { select: { name: true, email: true, avatarUrl: true } },
                    enrollment: {
                        include: {
                            course: { select: { courseName: true, courseId: true } }
                        }
                    },
                    assignedAdmin: { select: { email: true } },
                }
            }),
            prisma.submission.count({ where }),
        ])

        const items = submissions.map(s => ({
            id: s.id,
            userName: s.user.name,
            userEmail: s.user.email,
            courseName: s.enrollment.course.courseName,
            status: s.reviewStatus,
            assignedAdminEmail: s.assignedAdmin?.email || null,
            submittedAt: s.submittedAt.toISOString(),
        }))

        const totalPages = Math.ceil(total / limit)
        const meta = { total, page, pageSize: limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }

        return NextResponse.json({ success: true, data: { submissions: items }, meta }, { status: HttpStatus.OK })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions]', error)
        return serverError()
    }
}
