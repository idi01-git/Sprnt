import { z } from 'zod'

// =============================================================================
// MODULE 2: USER PROFILE SCHEMAS
// =============================================================================

/** PUT /api/users/profile */
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(200, 'Name must be under 200 characters')
        .transform((v) => v.trim())
        .optional(),
    phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)')
        .max(20, 'Phone number too long')
        .optional()
        .or(z.literal('').transform(() => null))
        .nullable(),
    dob: z
        .string()
        .refine(
            (v) => !v || !isNaN(Date.parse(v)),
            'Invalid date format (use ISO 8601)'
        )
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    studyLevel: z
        .enum([
            'NINTH', 'TENTH', 'ELEVENTH', 'TWELFTH',
            'COLLEGE_1', 'COLLEGE_2', 'COLLEGE_3', 'COLLEGE_4',
            'GRADUATED',
        ])
        .optional()
        .nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/** PUT /api/users/profile/upi */
export const updateUpiSchema = z.object({
    upiId: z
        .string()
        .min(3, 'UPI ID too short')
        .max(100, 'UPI ID too long')
        .regex(
            /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/,
            'Invalid UPI ID format (e.g. user@bankcode)'
        ),
})

/** POST /api/users/profile/avatar */
export const avatarUploadSchema = z.object({
    contentType: z
        .enum(['image/jpeg', 'image/png', 'image/webp'], {
            message: 'Allowed formats: jpeg, png, webp',
        }),
})
