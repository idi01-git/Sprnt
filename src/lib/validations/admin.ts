import { z } from 'zod'

// ============================================================================
// ADMIN AUTHENTICATION VALIDATIONS
// ============================================================================

/**
 * Admin login body schema.
 */
export const adminLoginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .max(255),
    password: z
        .string()
        .min(1, 'Password is required'),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

/**
 * Admin change password body schema.
 */
export const adminChangePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters'),
})

export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>

// ============================================================================
// DASHBOARD QUERY VALIDATIONS
// ============================================================================

/**
 * Dashboard chart query schema.
 * Used by revenue and signups chart endpoints.
 */
export const dashboardChartQuerySchema = z.object({
    days: z.coerce
        .number()
        .int('Days must be a whole number')
        .min(7, 'Minimum is 7 days')
        .max(90, 'Maximum is 90 days')
        .default(30),
})

export type DashboardChartQueryInput = z.infer<typeof dashboardChartQuerySchema>

// ============================================================================
// ANALYTICS QUERY VALIDATIONS
// ============================================================================

/**
 * Analytics date range query schema.
 * Used by revenue analytics.
 */
export const analyticsDateRangeSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    period: z
        .enum(['7d', '30d', '90d', 'all'])
        .default('30d'),
})

export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>

/**
 * Analytics period-only schema (simpler variant).
 * Used by user analytics.
 */
export const analyticsPeriodSchema = z.object({
    period: z
        .enum(['7d', '30d', '90d', 'all'])
        .default('30d'),
})

export type AnalyticsPeriodInput = z.infer<typeof analyticsPeriodSchema>

/**
 * CSV export query schema.
 */
export const csvExportQuerySchema = z.object({
    type: z
        .enum(['users', 'enrollments', 'transactions', 'referrals'])
        .default('enrollments'),
    period: z
        .enum(['7d', '30d', '90d', 'all'])
        .default('30d'),
})

export type CsvExportQueryInput = z.infer<typeof csvExportQuerySchema>

// ============================================================================
// HELPER: Convert period to start date
// ============================================================================

const PERIOD_DAYS: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 3650,
}

/**
 * Converts a period string to a start date.
 * @param period - The period string (e.g., '7d', '30d', '90d', 'all')
 * @returns The calculated start date
 */
export function periodToStartDate(period: string): Date {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (PERIOD_DAYS[period] ?? 30))
    return startDate
}

// ============================================================================
// MODULE 16: ADMIN COURSE MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/courses — list query params
 */
export const adminCourseListQuerySchema = z.object({
    search: z.string().optional(),
    branch: z
        .enum(['Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS_IT'])
        .optional(),
    status: z.enum(['active', 'inactive', 'all']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
        .enum(['newest', 'oldest', 'name', 'price_asc', 'price_desc'])
        .default('newest'),
})

export type AdminCourseListQueryInput = z.infer<typeof adminCourseListQuerySchema>

/**
 * POST /api/admin/courses — create course body
 */
export const adminCreateCourseSchema = z.object({
    courseName: z.string().min(1, 'Course name required').max(200),
    affiliatedBranch: z.enum([
        'Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS_IT',
    ]),
    coursePrice: z.coerce.number().min(0).default(299),
    courseThumbnail: z.string().min(1, 'Thumbnail URL required'),
    courseDescription: z.string().min(1, 'Description required'),
    problemStatementText: z.string().min(1, 'Problem statement required'),
    courseTranscriptUrl: z.string().url().optional().nullable(),
    problemStatementPdfUrl: z.string().url().optional().nullable(),
    tags: z.record(z.string(), z.boolean()).default({}),
    isActive: z.boolean().default(true),
})

export type AdminCreateCourseInput = z.infer<typeof adminCreateCourseSchema>

/**
 * PUT /api/admin/courses/{courseId} — update course body (all optional)
 */
export const adminUpdateCourseSchema = z.object({
    courseName: z.string().min(1).max(200).optional(),
    affiliatedBranch: z
        .enum(['Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS_IT'])
        .optional(),
    coursePrice: z.coerce.number().min(0).optional(),
    courseThumbnail: z.string().optional(),
    courseDescription: z.string().min(1).optional(),
    problemStatementText: z.string().min(1).optional(),
    courseTranscriptUrl: z.string().url().optional().nullable(),
    problemStatementPdfUrl: z.string().url().optional().nullable(),
    tags: z.record(z.string(), z.boolean()).optional(),
})

export type AdminUpdateCourseInput = z.infer<typeof adminUpdateCourseSchema>

/**
 * PATCH /api/admin/courses/{courseId}/status — toggle body
 */
export const adminCourseStatusSchema = z.object({
    isActive: z.boolean(),
})

export type AdminCourseStatusInput = z.infer<typeof adminCourseStatusSchema>

/**
 * PATCH /api/admin/courses/{courseId}/tags — update tags body
 */
export const adminCourseTagsSchema = z.object({
    tags: z.record(z.string(), z.boolean()),
})

export type AdminCourseTagsInput = z.infer<typeof adminCourseTagsSchema>

/**
 * POST file upload endpoints (thumbnail, transcript, problem-statement-pdf)
 * Triggers presigned URL generation for client-side upload
 */
export const adminFileUploadSchema = z.object({
    fileName: z.string().min(1, 'File name required'),
    contentType: z.string().min(1, 'Content type required'),
})

export type AdminFileUploadInput = z.infer<typeof adminFileUploadSchema>

/**
 * GET /api/admin/courses/{courseId}/enrollments — list query
 */
export const adminCourseEnrollmentsQuerySchema = z.object({
    status: z.enum(['pending', 'success', 'failed', 'refunded', 'all']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type AdminCourseEnrollmentsQueryInput = z.infer<typeof adminCourseEnrollmentsQuerySchema>

// ============================================================================
// MODULE 17: ADMIN MODULE & CONTENT MANAGEMENT
// ============================================================================

/** Single quiz option */
const quizOptionSchema = z.object({
    text: z.string().min(1, 'Option text required'),
    isCorrect: z.boolean(),
})

/** Single quiz question (4 options, exactly 1 correct) */
const quizQuestionSchema = z.object({
    question: z.string().min(1, 'Question text required'),
    options: z
        .array(quizOptionSchema)
        .min(4, { message: 'Each question must have exactly 4 options' })
        .max(4, { message: 'Each question must have exactly 4 options' })
        .refine(
            (opts) => opts.filter((o) => o.isCorrect).length === 1,
            { message: 'Exactly 1 option must be correct' },
        ),
})

/**
 * POST /api/admin/courses/{courseId}/modules — create module body
 */
export const adminCreateModuleSchema = z.object({
    dayNumber: z.number().int().min(1).max(7),
    title: z.string().min(1, 'Title required').max(200),
    contentText: z.string().min(1, 'Content required'),
    quizQuestions: z.array(quizQuestionSchema).default([]),
    isFreePreview: z.boolean().default(false),
})

export type AdminCreateModuleInput = z.infer<typeof adminCreateModuleSchema>

/**
 * PUT /api/admin/courses/{courseId}/modules/{moduleId} — update module body
 */
export const adminUpdateModuleSchema = z.object({
    dayNumber: z.number().int().min(1).max(7).optional(),
    title: z.string().min(1).max(200).optional(),
    contentText: z.string().min(1).optional(),
    isFreePreview: z.boolean().optional(),
})

export type AdminUpdateModuleInput = z.infer<typeof adminUpdateModuleSchema>

/**
 * PUT /api/admin/courses/{courseId}/modules/reorder — reorder body
 */
export const adminReorderModulesSchema = z.object({
    order: z
        .array(
            z.object({
                moduleId: z.string().min(1),
                dayNumber: z.number().int().min(1).max(7),
            }),
        )
        .min(1, 'At least one module required')
        .max(7),
})

export type AdminReorderModulesInput = z.infer<typeof adminReorderModulesSchema>

/**
 * PUT /api/admin/courses/{courseId}/modules/{moduleId}/content — update content body
 */
export const adminUpdateContentSchema = z.object({
    contentText: z.string().min(1, 'Content text required'),
})

export type AdminUpdateContentInput = z.infer<typeof adminUpdateContentSchema>

/**
 * PUT /api/admin/courses/{courseId}/modules/{moduleId}/quiz — replace quiz body
 */
export const adminReplaceQuizSchema = z.object({
    questions: z
        .array(quizQuestionSchema)
        .min(5, { message: 'Quiz must have exactly 5 questions' })
        .max(5, { message: 'Quiz must have exactly 5 questions' }),
})

export type AdminReplaceQuizInput = z.infer<typeof adminReplaceQuizSchema>

// ============================================================================
// MODULE 18: ADMIN VIDEO & ASSET MANAGEMENT
// ============================================================================

/**
 * POST /api/admin/upload/presigned-url — generate presigned upload URL
 */
export const adminPresignedUrlSchema = z.object({
    fileName: z.string().min(1, 'File name required'),
    fileType: z.string().min(1, 'File type required'),
    bucket: z.enum(['sprintern-public', 'sprintern-private']).default('sprintern-public'),
    maxSizeMB: z.coerce.number().min(1).max(500).default(100),
})

export type AdminPresignedUrlInput = z.infer<typeof adminPresignedUrlSchema>

/**
 * POST /api/admin/courses/{courseId}/modules/{moduleId}/video — attach video
 */
export const adminAttachVideoSchema = z.object({
    r2Key: z.string().min(1, 'R2 key required'),
    fileName: z.string().min(1, 'File name required'),
    fileSizeBytes: z.coerce.number().int().min(1, 'File size required'),
    durationSeconds: z.coerce.number().int().min(0).optional(),
    resolution: z.string().max(20).optional(),
})

export type AdminAttachVideoInput = z.infer<typeof adminAttachVideoSchema>

/**
 * PUT /api/admin/videos/{videoAssetId} — update video metadata
 */
export const adminUpdateVideoSchema = z.object({
    durationSeconds: z.coerce.number().int().min(0).optional(),
    resolution: z.string().max(20).optional(),
    processingStatus: z.string().max(20).optional(),
    uploadStatus: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
})

export type AdminUpdateVideoInput = z.infer<typeof adminUpdateVideoSchema>

// ============================================================================
// MODULE 19: ADMIN USER MANAGEMENT
// ============================================================================

export const adminUserListQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['active', 'suspended', 'all']).default('all'),
    studyLevel: z.string().optional(),
    sort: z.enum(['newest', 'name']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>

export const adminManualEnrollSchema = z.object({
    courseId: z.string().min(1, 'Course ID required'),
    reason: z.string().min(1, 'Reason required').max(500),
})
export type AdminManualEnrollInput = z.infer<typeof adminManualEnrollSchema>

export const adminUserSubListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.string().optional(),
})
export type AdminUserSubListQueryInput = z.infer<typeof adminUserSubListQuerySchema>

// ============================================================================
// MODULE 20: ADMIN SUBMISSION REVIEW QUEUE
// ============================================================================

export const adminSubmissionListQuerySchema = z.object({
    status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'all']).default('all'),
    search: z.string().optional(),
    courseId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['oldest', 'newest']).default('oldest'),
})
export type AdminSubmissionListQueryInput = z.infer<typeof adminSubmissionListQuerySchema>

export const adminAssignSubmissionSchema = z.object({
    adminId: z.string().min(1, 'Admin ID required'),
})
export type AdminAssignSubmissionInput = z.infer<typeof adminAssignSubmissionSchema>

export const adminGradeSubmissionSchema = z.object({
    metric1: z.coerce.number().min(0).max(5),
    metric2: z.coerce.number().min(0).max(5),
    metric3: z.coerce.number().min(0).max(5),
    metric4: z.coerce.number().min(0).max(5),
    metric5: z.coerce.number().min(0).max(5),
    adminNotes: z.string().optional(),
})
export type AdminGradeSubmissionInput = z.infer<typeof adminGradeSubmissionSchema>

export const adminRejectSubmissionSchema = z.object({
    adminNotes: z.string().min(1, 'Rejection reason is required').max(2000),
})
export type AdminRejectSubmissionInput = z.infer<typeof adminRejectSubmissionSchema>

// ============================================================================
// MODULE 21: ADMIN CERTIFICATE MANAGEMENT
// ============================================================================

export const adminCertificateListQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['valid', 'revoked', 'all']).default('all'),
    courseId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
})
export type AdminCertificateListQueryInput = z.infer<typeof adminCertificateListQuerySchema>

export const adminRevokeCertificateSchema = z.object({
    reason: z.string().min(1, 'Revocation reason required').max(1000),
})
export type AdminRevokeCertificateInput = z.infer<typeof adminRevokeCertificateSchema>

// ============================================================================
// MODULE 22: ADMIN REFERRAL MANAGEMENT
// ============================================================================

export const adminReferralListQuerySchema = z.object({
    status: z.enum(['pending', 'completed', 'all']).default('all'),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminReferralListQueryInput = z.infer<typeof adminReferralListQuerySchema>

// ============================================================================
// MODULE 23: ADMIN WITHDRAWAL MANAGEMENT
// ============================================================================

export const adminWithdrawalListQuerySchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'rejected', 'all']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['newest', 'oldest']).default('newest'),
})
export type AdminWithdrawalListQueryInput = z.infer<typeof adminWithdrawalListQuerySchema>

export const adminCompleteWithdrawalSchema = z.object({
    transactionId: z.string().min(1, 'Transaction ID required'),
    confirmCheckbox: z.literal(true, {
        message: 'You must confirm the transfer',
    }),
})
export type AdminCompleteWithdrawalInput = z.infer<typeof adminCompleteWithdrawalSchema>

export const adminRejectWithdrawalSchema = z.object({
    reason: z.string().min(1, 'Rejection reason required').max(1000),
})
export type AdminRejectWithdrawalInput = z.infer<typeof adminRejectWithdrawalSchema>

// ============================================================================
// MODULE 24: ADMIN PROMOCODE MANAGEMENT
// ============================================================================

export const adminPromocodeListQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['active', 'inactive', 'expired', 'all']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminPromocodeListQueryInput = z.infer<typeof adminPromocodeListQuerySchema>

export const adminCreatePromocodeSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
    description: z.string().max(500).optional(),
    discountType: z.enum(['fixed', 'percentage']),
    discountValue: z.coerce.number().min(0.01),
    maxDiscount: z.coerce.number().min(0).optional().nullable(),
    usageLimit: z.coerce.number().int().min(1).optional().nullable(),
    perUserLimit: z.coerce.number().int().min(1).default(1),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    isActive: z.boolean().default(true),
})
export type AdminCreatePromocodeInput = z.infer<typeof adminCreatePromocodeSchema>

export const adminUpdatePromocodeSchema = z.object({
    description: z.string().max(500).optional(),
    discountType: z.enum(['fixed', 'percentage']).optional(),
    discountValue: z.coerce.number().min(0.01).optional(),
    maxDiscount: z.coerce.number().min(0).optional().nullable(),
    usageLimit: z.coerce.number().int().min(1).optional().nullable(),
    perUserLimit: z.coerce.number().int().min(1).optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
})
export type AdminUpdatePromocodeInput = z.infer<typeof adminUpdatePromocodeSchema>

export const adminPromocodeStatusSchema = z.object({
    isActive: z.boolean(),
})
export type AdminPromocodeStatusInput = z.infer<typeof adminPromocodeStatusSchema>

export const adminPromocodeUsageQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminPromocodeUsageQueryInput = z.infer<typeof adminPromocodeUsageQuerySchema>

// ============================================================================
// MODULE 25: ADMIN ACCOUNT MANAGEMENT
// ============================================================================

export const adminCreateAdminSchema = z.object({
    username: z.string().min(3).max(100),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    role: z.enum(['super_admin', 'admin', 'reviewer']),
    permissions: z.record(z.string(), z.boolean()).optional(),
})
export type AdminCreateAdminInput = z.infer<typeof adminCreateAdminSchema>

export const adminUpdateAdminSchema = z.object({
    role: z.enum(['super_admin', 'admin', 'reviewer']).optional(),
    permissions: z.record(z.string(), z.boolean()).optional(),
    email: z.string().email().max(255).optional(),
})
export type AdminUpdateAdminInput = z.infer<typeof adminUpdateAdminSchema>

export const adminActivityQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminActivityQueryInput = z.infer<typeof adminActivityQuerySchema>

// ============================================================================
// MODULE 26: ADMIN SYSTEM SETTINGS
// ============================================================================

export const adminUpdateSettingSchema = z.object({
    value: z.unknown(),
})
export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>

export const adminBulkUpdateSettingsSchema = z.object({
    settings: z.array(z.object({
        key: z.string().min(1),
        value: z.unknown(),
    })).min(1),
})
export type AdminBulkUpdateSettingsInput = z.infer<typeof adminBulkUpdateSettingsSchema>

export const adminMaintenanceModeSchema = z.object({
    enabled: z.boolean(),
    message: z.string().max(500).optional(),
})
export type AdminMaintenanceModeInput = z.infer<typeof adminMaintenanceModeSchema>

export const adminUpdateEmailTemplateSchema = z.object({
    subject: z.string().min(1).max(500).optional(),
    bodyHtml: z.string().min(1).optional(),
    bodyText: z.string().optional(),
    variables: z.array(z.string()).optional(),
})
export type AdminUpdateEmailTemplateInput = z.infer<typeof adminUpdateEmailTemplateSchema>

// ============================================================================
// MODULE 27: ADMIN LOGS & AUDIT TRAIL
// ============================================================================

export const adminLogsQuerySchema = z.object({
    adminId: z.string().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminLogsQueryInput = z.infer<typeof adminLogsQuerySchema>

export const adminWebhookLogsQuerySchema = z.object({
    type: z.string().optional(),
    status: z.enum(['success', 'failed', 'ignored', 'all']).default('all'),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type AdminWebhookLogsQueryInput = z.infer<typeof adminWebhookLogsQuerySchema>
