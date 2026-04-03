// =============================================================================
// IN-MEMORY SLIDING WINDOW RATE LIMITER
// =============================================================================
// Zero-dependency rate limiter suitable for single-instance deployments.
// For multi-instance (horizontal scaling), replace with @upstash/ratelimit + Redis.

interface RateLimitEntry {
    timestamps: number[]
}

interface RateLimitConfig {
    /** Maximum number of requests allowed within the window */
    maxRequests: number
    /** Time window in milliseconds */
    windowMs: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent memory leaks (every 60 seconds)
const CLEANUP_INTERVAL_MS = 60_000

if (typeof globalThis !== 'undefined') {
    // Avoid duplicate intervals in hot-reload
    const globalStore = globalThis as unknown as { _rateLimitCleanup?: ReturnType<typeof setInterval> }
    if (!globalStore._rateLimitCleanup) {
        globalStore._rateLimitCleanup = setInterval(() => {
            const now = Date.now()
            for (const [key, entry] of store.entries()) {
                // Remove entries with no recent activity
                if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 300_000) {
                    store.delete(key)
                }
            }
        }, CLEANUP_INTERVAL_MS)

        // Don't prevent process exit
        if (globalStore._rateLimitCleanup?.unref) {
            globalStore._rateLimitCleanup.unref()
        }
    }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key  - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 * @returns { limited, remaining, retryAfterMs }
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig,
): { limited: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now()
    const windowStart = now - config.windowMs

    let entry = store.get(key)
    if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

    if (entry.timestamps.length >= config.maxRequests) {
        // Rate limited
        const oldestInWindow = entry.timestamps[0]
        const retryAfterMs = oldestInWindow + config.windowMs - now

        return {
            limited: true,
            remaining: 0,
            retryAfterMs: Math.max(retryAfterMs, 0),
        }
    }

    // Allow request
    entry.timestamps.push(now)

    return {
        limited: false,
        remaining: config.maxRequests - entry.timestamps.length,
        retryAfterMs: 0,
    }
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/** Auth endpoints: 20 requests per 15 minutes per IP (increased for better UX) */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
}

/** General API endpoints: 100 requests per minute per IP */
export const API_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
}

/** Public search endpoints: 30 requests per minute per IP */
export const SEARCH_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
}
