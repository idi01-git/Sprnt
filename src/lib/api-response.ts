import { NextResponse } from 'next/server'

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

/** Standard HTTP status codes used across all 196 endpoints */
export const HttpStatus = {
    // 2xx Success
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // 3xx Redirection
    MOVED_PERMANENTLY: 301,
    NOT_MODIFIED: 304,

    // 4xx Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    GONE: 410,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus]

// =============================================================================
// ERROR CODES — Domain-specific error identifiers
// =============================================================================

/** Structured error codes. Prefix groups: AUTH_, COURSE_, QUIZ_, PAY_, etc. */
export const ErrorCode = {
    // Generic
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

    // Auth
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
    AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
    AUTH_PHONE_EXISTS: 'AUTH_PHONE_EXISTS',
    AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
    AUTH_OTP_EXPIRED: 'AUTH_OTP_EXPIRED',
    AUTH_OTP_INVALID: 'AUTH_OTP_INVALID',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',

    // Courses
    COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
    COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
    COURSE_ALREADY_ENROLLED: 'COURSE_ALREADY_ENROLLED',
    COURSE_FETCH_FAILED: 'COURSE_FETCH_FAILED',

    // Enrollment
    ENROLLMENT_NOT_FOUND: 'ENROLLMENT_NOT_FOUND',
    ENROLLMENT_ACCESS_DENIED: 'ENROLLMENT_ACCESS_DENIED',

    // Promocode
    PROMO_INVALID: 'PROMO_INVALID',
    PROMO_EXPIRED: 'PROMO_EXPIRED',
    PROMO_USAGE_EXCEEDED: 'PROMO_USAGE_EXCEEDED',

    // Quiz
    QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',
    QUIZ_ALREADY_SUBMITTED: 'QUIZ_ALREADY_SUBMITTED',
    QUIZ_TIME_EXPIRED: 'QUIZ_TIME_EXPIRED',
    QUIZ_VERSION_CONFLICT: 'QUIZ_VERSION_CONFLICT',

    // Payments
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
    PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
    PAYMENT_IDEMPOTENCY_CONFLICT: 'PAYMENT_IDEMPOTENCY_CONFLICT',

    // Upload / R2
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
    UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',

    // Certificate
    CERTIFICATE_NOT_FOUND: 'CERTIFICATE_NOT_FOUND',
    CERTIFICATE_NOT_ELIGIBLE: 'CERTIFICATE_NOT_ELIGIBLE',

    // Wallet & Withdrawals
    WALLET_INSUFFICIENT_BALANCE: 'WALLET_INSUFFICIENT_BALANCE',
    WALLET_WITHDRAWAL_PENDING: 'WALLET_WITHDRAWAL_PENDING',
    WALLET_WITHDRAWAL_MIN_AMOUNT: 'WALLET_WITHDRAWAL_MIN_AMOUNT',
    WALLET_UPI_REQUIRED: 'WALLET_UPI_REQUIRED',

    // Notifications
    NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
    NOTIFICATION_ACCESS_DENIED: 'NOTIFICATION_ACCESS_DENIED',

    // Admin
    ADMIN_AUTH_REQUIRED: 'ADMIN_AUTH_REQUIRED',
    ADMIN_ACCOUNT_DISABLED: 'ADMIN_ACCOUNT_DISABLED',
    ADMIN_INVALID_CREDENTIALS: 'ADMIN_INVALID_CREDENTIALS',
    ADMIN_FORBIDDEN: 'ADMIN_FORBIDDEN',

    // Submissions (Admin)
    SUBMISSION_NOT_FOUND: 'SUBMISSION_NOT_FOUND',
    SUBMISSION_ALREADY_ASSIGNED: 'SUBMISSION_ALREADY_ASSIGNED',
    SUBMISSION_NOT_GRADED: 'SUBMISSION_NOT_GRADED',
    SUBMISSION_GRADE_TOO_LOW: 'SUBMISSION_GRADE_TOO_LOW',
    SUBMISSION_MAX_RESUBMISSIONS: 'SUBMISSION_MAX_RESUBMISSIONS',

    // Withdrawal (Admin)
    WITHDRAWAL_NOT_FOUND: 'WITHDRAWAL_NOT_FOUND',
    WITHDRAWAL_ALREADY_PROCESSED: 'WITHDRAWAL_ALREADY_PROCESSED',
    WITHDRAWAL_INVALID_STATE: 'WITHDRAWAL_INVALID_STATE',

    // Promocode (Admin)
    PROMOCODE_NOT_FOUND: 'PROMOCODE_NOT_FOUND',
    PROMOCODE_CODE_EXISTS: 'PROMOCODE_CODE_EXISTS',
    PROMOCODE_HAS_USAGE: 'PROMOCODE_HAS_USAGE',

    // Admin Accounts
    ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
    ADMIN_EMAIL_EXISTS: 'ADMIN_EMAIL_EXISTS',
    ADMIN_USERNAME_EXISTS: 'ADMIN_USERNAME_EXISTS',
    ADMIN_CANNOT_SELF_MODIFY: 'ADMIN_CANNOT_SELF_MODIFY',

    // Settings
    SETTING_NOT_FOUND: 'SETTING_NOT_FOUND',
    TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',

    // User (Admin mgmt)
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_SUSPENDED: 'USER_ALREADY_SUSPENDED',
    USER_NOT_SUSPENDED: 'USER_NOT_SUSPENDED',
    USER_ALREADY_ENROLLED: 'USER_ALREADY_ENROLLED',
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

// =============================================================================
// CORE TYPES — Discriminated Union (success / error)
// =============================================================================

/** Structured error payload attached to every failed response */
export interface ApiError {
    /** Machine-readable error code (e.g. AUTH_REQUIRED, COURSE_NOT_FOUND) */
    readonly code: string
    /** Human-readable message safe to show in UI */
    readonly message: string
    /** Optional structured details (validation errors, debug info, etc.) */
    readonly details?: Readonly<Record<string, unknown>>
}

/** Successful API response — data is always present, error is always null */
export interface SuccessResponse<T> {
    readonly success: true
    readonly data: T
    readonly meta?: PaginationMeta
    readonly error: null
}

/** Failed API response — data is always null, error is always present */
export interface ErrorResponse {
    readonly success: false
    readonly data: null
    readonly error: ApiError
}

/**
 * Discriminated union for every API response in the system.
 *
 * Usage:
 * ```ts
 * const res: ApiResponse<User[]> = await fetch('/api/users').then(r => r.json())
 * if (res.success) {
 *   console.log(res.data) // User[]
 * } else {
 *   console.error(res.error.code) // string
 * }
 * ```
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// =============================================================================
// PAGINATION
// =============================================================================

/** Cursor-based pagination metadata */
export interface PaginationMeta {
    readonly total: number
    readonly page: number
    readonly pageSize: number
    readonly totalPages: number
    readonly hasNext: boolean
    readonly hasPrev: boolean
}

/** Paginated data wrapper */
export interface PaginatedData<T> {
    readonly items: readonly T[]
    readonly pagination: PaginationMeta
}

/** Convenience alias for paginated API responses */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Narrows an ApiResponse to SuccessResponse — enables safe `.data` access */
export function isSuccess<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
    return response.success === true
}

/** Narrows an ApiResponse to ErrorResponse — enables safe `.error` access */
export function isError<T>(response: ApiResponse<T>): response is ErrorResponse {
    return response.success === false
}

// =============================================================================
// RESPONSE BUILDERS — Plain JSON objects (for client-side or testing)
// =============================================================================

/** Build a success envelope without wrapping in NextResponse */
export function successPayload<T>(data: T, meta?: PaginationMeta): SuccessResponse<T> {
    return meta
        ? { success: true, data, meta, error: null }
        : { success: true, data, error: null }
}

/** Build an error envelope without wrapping in NextResponse */
export function errorPayload(
    code: string,
    message: string,
    details?: Record<string, unknown>,
): ErrorResponse {
    return {
        success: false,
        data: null,
        error: details ? { code, message, details } : { code, message },
    }
}

// =============================================================================
// NextResponse BUILDERS — Used in route handlers
// =============================================================================

/**
 * Return a JSON success response.
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const courses = await prisma.course.findMany()
 *   return createSuccessResponse(courses)            // 200
 *   return createSuccessResponse(newCourse, 201)     // 201 Created
 * }
 * ```
 */
export function createSuccessResponse<T>(
    data: T,
    status: HttpStatusCode = HttpStatus.OK,
    headers?: HeadersInit,
): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(successPayload(data), { status, headers })
}

/**
 * Return a JSON error response.
 *
 * @example
 * ```ts
 * return createErrorResponse('COURSE_NOT_FOUND', 'Course not found', 404)
 * ```
 */
export function createErrorResponse(
    code: string,
    message: string,
    status: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>,
    headers?: HeadersInit,
): NextResponse<ErrorResponse> {
    return NextResponse.json(errorPayload(code, message, details), { status, headers })
}

/**
 * Return a paginated JSON success response.
 * Per API doc envelope: `{ success, data, meta: { page, total, ... } }`
 *
 * @example
 * ```ts
 * const [courses, total] = await Promise.all([
 *   prisma.course.findMany({ skip, take }),
 *   prisma.course.count(),
 * ])
 * return createPaginatedResponse({ courses }, { total, page, pageSize: limit })
 * ```
 */
export function createPaginatedResponse<T>(
    data: T,
    pagination: { total: number; page: number; pageSize: number },
    status: HttpStatusCode = HttpStatus.OK,
): NextResponse<SuccessResponse<T>> {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize)
    const meta: PaginationMeta = {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
    }
    return NextResponse.json(successPayload(data, meta), { status })
}

// =============================================================================
// COMMON ERROR HELPERS — One-liners for the most frequent failures
// =============================================================================

/** 400 — Malformed request body, missing params, Zod validation failure */
export function badRequest(message = 'Bad request', details?: Record<string, unknown>) {
    return createErrorResponse(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details)
}

/** 401 — No session / expired session */
export function unauthorized(message = 'Authentication required') {
    return createErrorResponse(ErrorCode.AUTH_REQUIRED, message, HttpStatus.UNAUTHORIZED)
}

/** 403 — Authenticated but lacks permission */
export function forbidden(message = 'You do not have permission to access this resource') {
    return createErrorResponse(ErrorCode.AUTH_FORBIDDEN, message, HttpStatus.FORBIDDEN)
}

/** 404 — Resource does not exist */
export function notFound(resource = 'Resource') {
    return createErrorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, HttpStatus.NOT_FOUND)
}

/** 405 — HTTP method not supported on this route */
export function methodNotAllowed(allowed: string[]) {
    return createErrorResponse(
        ErrorCode.METHOD_NOT_ALLOWED,
        `Method not allowed. Use: ${allowed.join(', ')}`,
        HttpStatus.METHOD_NOT_ALLOWED,
    )
}

/** 409 — Conflicting state (duplicate entry, version conflict, etc.) */
export function conflict(message = 'Resource conflict', details?: Record<string, unknown>) {
    return createErrorResponse(ErrorCode.VALIDATION_ERROR, message, HttpStatus.CONFLICT, details)
}

/** 422 — Semantic validation failure (valid JSON, bad business logic) */
export function unprocessable(message = 'Unprocessable entity', details?: Record<string, unknown>) {
    return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        message,
        HttpStatus.UNPROCESSABLE_ENTITY,
        details,
    )
}

/** 429 — Rate limit exceeded */
export function rateLimited(retryAfterSeconds?: number) {
    return createErrorResponse(
        ErrorCode.RATE_LIMITED,
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
        retryAfterSeconds ? { retryAfter: retryAfterSeconds } : undefined,
    )
}

/** 500 — Catch-all server error (logs original error, returns safe message) */
export function serverError(message = 'Internal server error', details?: Record<string, unknown>) {
    return createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
        details,
    )
}

// =============================================================================
// SAFE HANDLER WRAPPER — try/catch with consistent error shaping
// =============================================================================

/**
 * Wraps an async route handler in try/catch and returns a consistent response.
 * Eliminates boilerplate try/catch from every route handler.
 *
 * @example
 * ```ts
 * export const GET = withApiHandler(async (request) => {
 *   const courses = await prisma.course.findMany()
 *   return createSuccessResponse(courses)
 * })
 * ```
 */
export function withApiHandler<T>(
    handler: (request: Request) => Promise<NextResponse<ApiResponse<T>>>,
): (request: Request) => Promise<NextResponse<ApiResponse<T>>> {
    return async (request: Request) => {
        try {
            return await handler(request)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unexpected error occurred'

            // Log full error server-side; return safe message to client
            console.error('[API Error]', {
                url: request.url,
                method: request.method,
                error: error instanceof Error ? error.stack : error,
            })

            return serverError(
                process.env.NODE_ENV === 'development' ? message : 'Internal server error',
            ) as NextResponse<ApiResponse<T>>
        }
    }
}
