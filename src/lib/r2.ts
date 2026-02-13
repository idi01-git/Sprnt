import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// =============================================================================
// TYPES
// =============================================================================

/** Presigned URL response returned to the browser */
export interface PresignedUrl {
    readonly url: string
    readonly expiresAt: Date
    readonly expiresIn: number // seconds
}

/** Server-side upload result */
export interface R2UploadResponse {
    readonly key: string
    readonly url: string
    readonly bucket: string
    readonly contentType: string
    readonly uploadedAt: Date
}

/** R2 connection configuration (resolved from env) */
export interface R2Config {
    readonly accountId: string
    readonly accessKeyId: string
    readonly secretAccessKey: string
    readonly publicUrl: string
}

/** Structured error for R2 operations */
export class R2Error extends Error {
    readonly code: string
    readonly statusCode: number
    readonly bucket?: string
    readonly key?: string

    constructor(
        message: string,
        code: string = 'R2_ERROR',
        statusCode: number = 500,
        bucket?: string,
        key?: string,
    ) {
        super(message)
        this.name = 'R2Error'
        this.code = code
        this.statusCode = statusCode
        this.bucket = bucket
        this.key = key

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, R2Error)
        }
    }
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Predefined expiry durations (seconds) */
export const Expiry = {
    /** 30 minutes — for browser uploads */
    UPLOAD: 30 * 60,
    /** 1 hour — for downloads */
    DOWNLOAD: 60 * 60,
    /** 4 hours — for video streaming */
    VIDEO: 4 * 60 * 60,
} as const

/** Bucket names matching your R2 layout */
export const Bucket = {
    PUBLIC: 'sprintern-public',
    PRIVATE: 'sprintern-private',
} as const

/** Key prefixes for organized storage */
export const KeyPrefix = {
    VIDEOS: 'videos/',
    CERTIFICATES: 'certificates/',
    THUMBNAILS: 'course-thumbnails/',
    SUBMISSIONS: 'submissions/',
    IDENTITY_DOCS: 'identity-docs/',
} as const

/** Allowed MIME types by category */
const ALLOWED_CONTENT_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: ['application/pdf'],
} as const

type ContentCategory = keyof typeof ALLOWED_CONTENT_TYPES

// =============================================================================
// ENVIRONMENT
// =============================================================================

function getEnvOrThrow(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new R2Error(`Missing required environment variable: ${key}`, 'R2_CONFIG_ERROR', 500)
    }
    return value
}

function getR2Config(): R2Config {
    return {
        accountId: getEnvOrThrow('R2_ACCOUNT_ID'),
        accessKeyId: getEnvOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: getEnvOrThrow('R2_SECRET_ACCESS_KEY'),
        publicUrl: getEnvOrThrow('R2_PUBLIC_URL'),
    }
}

// =============================================================================
// 1. R2 CLIENT (Singleton)
// =============================================================================

let _client: S3Client | null = null

/**
 * Initialize (or return cached) S3Client configured for Cloudflare R2.
 *
 * Uses the S3-compatible endpoint:
 * `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
 *
 * @example
 * ```ts
 * const s3 = initR2Client()
 * ```
 */
export function initR2Client(): S3Client {
    if (_client) return _client

    const config = getR2Config()

    _client = new S3Client({
        region: 'auto', // R2 requires 'auto'
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    })

    return _client
}

// =============================================================================
// 2. PRESIGNED UPLOAD URL
// =============================================================================

/**
 * Generate a presigned PUT URL for browser-side upload.
 *
 * The browser uploads directly to R2 — no data passes through your server.
 *
 * @param bucket    - R2 bucket name (e.g. `Bucket.PUBLIC`)
 * @param key       - Object key (e.g. `videos/course_abc/intro.mp4`)
 * @param contentType - MIME type the browser will upload
 * @param expiresIn - Expiry in seconds (default: 30 min)
 * @returns Presigned URL + expiration
 *
 * @example
 * ```ts
 * const { url, expiresAt } = await generatePresignedUploadUrl(
 *   Bucket.PUBLIC,
 *   'videos/course_abc/intro.mp4',
 *   'video/mp4',
 *   Expiry.UPLOAD,
 * )
 * // Browser: fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': 'video/mp4' } })
 * ```
 */
export async function generatePresignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number = Expiry.UPLOAD,
): Promise<PresignedUrl> {
    validateKey(key)
    validateContentType(contentType, true) // Strict: only allow whitelisted MIME types

    const client = initR2Client()

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    })

    const url = await getSignedUrl(client, command, { expiresIn })

    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    console.info('[R2] Presigned upload URL generated:', { bucket, key, expiresIn })

    return { url, expiresAt, expiresIn }
}

// =============================================================================
// 3. PRESIGNED DOWNLOAD URL
// =============================================================================

/**
 * Generate a presigned GET URL for file download / streaming.
 *
 * @param bucket    - R2 bucket name
 * @param key       - Object key
 * @param expiresIn - Expiry in seconds (default: 1 hour; use `Expiry.VIDEO` for 4h)
 * @returns Presigned URL + expiration
 *
 * @example
 * ```ts
 * // Download a certificate PDF (1hr)
 * const { url } = await generatePresignedDownloadUrl(
 *   Bucket.PUBLIC,
 *   'certificates/cert_abc.pdf',
 * )
 *
 * // Stream a video (4hr)
 * const { url } = await generatePresignedDownloadUrl(
 *   Bucket.PUBLIC,
 *   'videos/course_abc/day1.mp4',
 *   Expiry.VIDEO,
 * )
 * ```
 */
export async function generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    expiresIn: number = Expiry.DOWNLOAD,
): Promise<PresignedUrl> {
    validateKey(key)

    const client = initR2Client()

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    })

    const url = await getSignedUrl(client, command, { expiresIn })

    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    console.info('[R2] Presigned download URL generated:', { bucket, key, expiresIn })

    return { url, expiresAt, expiresIn }
}

// =============================================================================
// 4. SERVER-SIDE UPLOAD
// =============================================================================

/**
 * Upload a file from the server (e.g. generated certificate PDFs).
 *
 * @param bucket      - R2 bucket name
 * @param key         - Object key
 * @param body        - File content as Buffer
 * @param contentType - MIME type
 * @returns Upload response with URL
 *
 * @example
 * ```ts
 * const pdfBuffer = await generateCertificatePdf(enrollmentId)
 * const result = await uploadFile(
 *   Bucket.PUBLIC,
 *   `certificates/${enrollmentId}.pdf`,
 *   pdfBuffer,
 *   'application/pdf',
 * )
 * // result.url → https://your-r2-public-url.com/certificates/abc.pdf
 * ```
 */
export async function uploadFile(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
): Promise<R2UploadResponse> {
    validateKey(key)
    validateContentType(contentType)

    const client = initR2Client()
    const config = getR2Config()

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    })

    await client.send(command)

    const url = `${config.publicUrl.replace(/\/$/, '')}/${key}`

    console.info('[R2] File uploaded:', { bucket, key, contentType, size: body.length })

    return {
        key,
        url,
        bucket,
        contentType,
        uploadedAt: new Date(),
    }
}

// =============================================================================
// 5. DELETE FILE
// =============================================================================

/**
 * Delete a file from R2. Handles "not found" gracefully (no-op).
 *
 * @param bucket - R2 bucket name
 * @param key    - Object key
 *
 * @example
 * ```ts
 * await deleteFile(Bucket.PRIVATE, 'submissions/sub_abc.pdf')
 * ```
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
    validateKey(key)

    const client = initR2Client()

    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    })

    try {
        await client.send(command)
        console.info('[R2] File deleted:', { bucket, key })
    } catch (error: unknown) {
        // S3/R2 DeleteObject succeeds even if object doesn't exist,
        // but handle unexpected errors
        const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } }

        if (s3Error.name === 'NoSuchKey' || s3Error.$metadata?.httpStatusCode === 404) {
            console.info('[R2] File already absent (no-op):', { bucket, key })
            return
        }

        throw new R2Error(
            `Failed to delete file: ${key}`,
            'R2_DELETE_FAILED',
            s3Error.$metadata?.httpStatusCode ?? 500,
            bucket,
            key,
        )
    }
}

// =============================================================================
// 6. FILE EXISTS
// =============================================================================

/**
 * Check whether a file exists in R2.
 *
 * Uses HeadObject — fast, no data transfer.
 *
 * @param bucket - R2 bucket name
 * @param key    - Object key
 * @returns `true` if the file exists, `false` otherwise
 *
 * @example
 * ```ts
 * const exists = await fileExists(Bucket.PUBLIC, 'certificates/cert_abc.pdf')
 * if (!exists) return notFound('Certificate')
 * ```
 */
export async function fileExists(bucket: string, key: string): Promise<boolean> {
    validateKey(key)

    const client = initR2Client()

    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
    })

    try {
        await client.send(command)
        return true
    } catch (error: unknown) {
        const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } }

        if (s3Error.name === 'NotFound' || s3Error.$metadata?.httpStatusCode === 404) {
            return false
        }

        throw new R2Error(
            `Failed to check file existence: ${key}`,
            'R2_HEAD_FAILED',
            s3Error.$metadata?.httpStatusCode ?? 500,
            bucket,
            key,
        )
    }
}

// =============================================================================
// CONTENT-TYPE HELPERS
// =============================================================================

/** Map of file extensions to MIME types */
const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',

    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',

    // Documents
    '.pdf': 'application/pdf',
}

/**
 * Detect MIME type from a file name / key.
 *
 * @param filename - File name or object key
 * @returns MIME type string, or `'application/octet-stream'` as fallback
 *
 * @example
 * ```ts
 * detectContentType('intro.mp4')   // 'video/mp4'
 * detectContentType('cert.pdf')    // 'application/pdf'
 * detectContentType('photo.webp')  // 'image/webp'
 * detectContentType('unknown.xyz') // 'application/octet-stream'
 * ```
 */
export function detectContentType(filename: string): string {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
    return EXTENSION_TO_MIME[ext] ?? 'application/octet-stream'
}

/**
 * Check if a MIME type belongs to a specific category.
 *
 * @example
 * ```ts
 * isContentType('image/png', 'image')  // true
 * isContentType('video/mp4', 'video')  // true
 * isContentType('video/mp4', 'image')  // false
 * ```
 */
export function isContentType(mimeType: string, category: ContentCategory): boolean {
    return (ALLOWED_CONTENT_TYPES[category] as readonly string[]).includes(mimeType)
}

/**
 * Get the recommended expiry for a given MIME type.
 *
 * @example
 * ```ts
 * getExpiryForType('video/mp4')       // 14400 (4 hours)
 * getExpiryForType('application/pdf') // 3600  (1 hour)
 * getExpiryForType('image/png')       // 3600  (1 hour)
 * ```
 */
export function getExpiryForType(mimeType: string): number {
    if (isContentType(mimeType, 'video')) return Expiry.VIDEO
    return Expiry.DOWNLOAD
}

// =============================================================================
// KEY BUILDER HELPERS
// =============================================================================

/**
 * Build a storage key with proper prefix for organized storage.
 *
 * @example
 * ```ts
 * buildKey(KeyPrefix.VIDEOS, 'course_abc', 'intro.mp4')
 * // → 'videos/course_abc/intro.mp4'
 *
 * buildKey(KeyPrefix.CERTIFICATES, 'cert_abc.pdf')
 * // → 'certificates/cert_abc.pdf'
 * ```
 */
export function buildKey(prefix: string, ...parts: string[]): string {
    const sanitized = parts.map((p) => p.replace(/[^a-zA-Z0-9._-]/g, '_'))
    return `${prefix}${sanitized.join('/')}`
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateKey(key: string): void {
    if (!key || key.length === 0) {
        throw new R2Error('Object key cannot be empty', 'R2_INVALID_KEY', 400)
    }

    if (key.length > 1024) {
        throw new R2Error('Object key exceeds 1024 characters', 'R2_INVALID_KEY', 400)
    }

    // Prevent path traversal
    if (key.includes('..') || key.startsWith('/')) {
        throw new R2Error('Object key contains invalid path segments', 'R2_INVALID_KEY', 400)
    }
}

function validateContentType(contentType: string, strictMode: boolean = false): void {
    if (!contentType || !contentType.includes('/')) {
        throw new R2Error(
            `Invalid Content-Type: "${contentType}"`,
            'R2_INVALID_CONTENT_TYPE',
            400,
        )
    }

    // In strict mode, only allow whitelisted content types
    if (strictMode) {
        const allAllowed = [
            ...ALLOWED_CONTENT_TYPES.image,
            ...ALLOWED_CONTENT_TYPES.video,
            ...ALLOWED_CONTENT_TYPES.document,
        ] as readonly string[]

        if (!allAllowed.includes(contentType)) {
            throw new R2Error(
                `Content-Type "${contentType}" is not in the allowed list. Allowed: ${allAllowed.join(', ')}`,
                'R2_DISALLOWED_CONTENT_TYPE',
                400,
            )
        }
    }
}
