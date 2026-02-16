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
