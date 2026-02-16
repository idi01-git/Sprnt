import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, AuthError } from '@/lib/auth/guards'
import {
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { csvExportQuerySchema, periodToStartDate } from '@/lib/validations/admin'
import { NextResponse } from 'next/server'

// ============================================================================
// CSV INJECTION PROTECTION
// ============================================================================

/**
 * Sanitizes a string value for safe CSV output.
 * Prevents CSV injection by escaping values starting with dangerous chars.
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */
function sanitizeCsvValue(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""')
    // If value starts with =, +, -, @, tab, or CR, prefix with single quote to prevent formula injection
    if (/^[=+\-@\t\r]/.test(escaped)) {
        return `"'${escaped}"`
    }
    // Always quote strings that contain commas, newlines, or quotes
    if (/[,"\n\r]/.test(escaped)) {
        return `"${escaped}"`
    }
    return escaped
}

/**
 * Creates a CSV row from an array of values, sanitizing each cell.
 */
function csvRow(values: (string | number | boolean | null | undefined)[]): string {
    return values.map(sanitizeCsvValue).join(',')
}

/**
 * GET /api/admin/analytics/export/csv
 * Exports analytics data as a CSV file.
 * Query params: type (users|enrollments|transactions|referrals), period
 * Auth: Admin with analytics:view permission
 */
export async function GET(request: NextRequest) {
    try {
        await requirePermission('analytics:view')

        const { searchParams } = new URL(request.url)
        const parsed = csvExportQuerySchema.safeParse({
            type: searchParams.get('type') ?? undefined,
            period: searchParams.get('period') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { issues: parsed.error.issues })
        }

        const { type, period } = parsed.data
        const startDate = periodToStartDate(period)

        let csvContent = ''
        const filename = `sprintern_${type}_export_${new Date().toISOString().split('T')[0]}.csv`

        switch (type) {
            case 'users': {
                const users = await prisma.user.findMany({
                    where: { createdAt: { gte: startDate }, deletedAt: null },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        studyLevel: true,
                        emailVerified: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10000,
                })
                csvContent = 'ID,Name,Email,Phone,Study Level,Email Verified,Created At\n'
                csvContent += users
                    .map((u) =>
                        csvRow([
                            u.id,
                            u.name,
                            u.email,
                            u.phone,
                            u.studyLevel,
                            u.emailVerified,
                            u.createdAt.toISOString(),
                        ])
                    )
                    .join('\n')
                break
            }
            case 'enrollments': {
                const enrollments = await prisma.enrollment.findMany({
                    where: { enrolledAt: { gte: startDate } },
                    include: {
                        user: { select: { name: true, email: true } },
                        course: { select: { courseName: true, courseId: true } },
                    },
                    orderBy: { enrolledAt: 'desc' },
                    take: 10000,
                })
                csvContent = 'ID,Student Name,Student Email,Course ID,Course Name,Payment Status,Amount Paid,Enrolled At\n'
                csvContent += enrollments
                    .map((e) =>
                        csvRow([
                            e.id,
                            e.user.name,
                            e.user.email,
                            e.course.courseId,
                            e.course.courseName,
                            e.paymentStatus,
                            Number(e.amountPaid),
                            e.enrolledAt.toISOString(),
                        ])
                    )
                    .join('\n')
                break
            }
            case 'transactions': {
                const transactions = await prisma.transaction.findMany({
                    where: { createdAt: { gte: startDate } },
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10000,
                })
                csvContent = 'ID,Student Name,Student Email,Type,Amount,Status,Payment Method,Gateway TX ID,Created At\n'
                csvContent += transactions
                    .map((t) =>
                        csvRow([
                            t.id,
                            t.user.name,
                            t.user.email,
                            t.transactionType,
                            Number(t.amount),
                            t.status,
                            t.paymentMethod,
                            t.gatewayTransactionId,
                            t.createdAt.toISOString(),
                        ])
                    )
                    .join('\n')
                break
            }
            case 'referrals': {
                const referrals = await prisma.referral.findMany({
                    where: { registeredAt: { gte: startDate } },
                    include: {
                        referrer: { select: { name: true, email: true } },
                        referee: { select: { name: true, email: true } },
                    },
                    orderBy: { registeredAt: 'desc' },
                    take: 10000,
                })
                csvContent = 'ID,Referrer Name,Referrer Email,Referee Name,Referee Email,Code Used,Status,Amount,Registered At\n'
                csvContent += referrals
                    .map((r) =>
                        csvRow([
                            r.id,
                            r.referrer.name,
                            r.referrer.email,
                            r.referee.name,
                            r.referee.email,
                            r.referralCodeUsed,
                            r.status,
                            Number(r.amount),
                            r.registeredAt.toISOString(),
                        ])
                    )
                    .join('\n')
                break
            }
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/analytics/export/csv]', error)
        return serverError('Failed to generate CSV export')
    }
}
