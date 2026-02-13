import { z } from 'zod'

// =============================================================================
// SHARED VALIDATION RULES
// =============================================================================

const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be under 255 characters')
    .transform((v) => v.toLowerCase().trim())

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be under 128 characters')
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )

const nameSchema = z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be under 200 characters')
    .transform((v) => v.trim())

const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)')
    .max(20, 'Phone number too long')
    .optional()
    .or(z.literal(''))

// Prisma StudyLevel enum values (mapped names for user-facing input)
const studyLevelSchema = z
    .enum([
        'NINTH', 'TENTH', 'ELEVENTH', 'TWELFTH',
        'COLLEGE_1', 'COLLEGE_2', 'COLLEGE_3', 'COLLEGE_4',
        'GRADUATED',
    ])
    .optional()

// =============================================================================
// MODULE 1: AUTHENTICATION SCHEMAS
// =============================================================================

/** POST /api/auth/register */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    phone: phoneSchema,
    dob: z
        .string()
        .refine(
            (v) => !v || !isNaN(Date.parse(v)),
            'Invalid date format (use ISO 8601)'
        )
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    studyLevel: studyLevelSchema,
    referralCode: z
        .string()
        .max(30, 'Referral code too long')
        .optional()
        .transform((v) => v?.trim() || undefined),
})

export type RegisterInput = z.infer<typeof registerSchema>

/** POST /api/auth/login */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

/** POST /api/auth/forgot-password */
export const forgotPasswordSchema = z.object({
    email: emailSchema,
})

/** POST /api/auth/reset-password */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
})

/** POST /api/auth/verify-email */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
})
