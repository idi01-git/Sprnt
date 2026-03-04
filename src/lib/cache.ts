interface CacheEntry<T> {
    data: T
    expiresAt: number
}

interface CacheStats {
    hits: number
    misses: number
    size: number
}

const store = new Map<string, CacheEntry<unknown>>()

let stats: CacheStats = { hits: 0, misses: 0, size: 0 }

const CLEANUP_INTERVAL_MS = 60_000

if (typeof globalThis !== 'undefined') {
    const globalStore = globalThis as unknown as { _cacheCleanup?: ReturnType<typeof setInterval> }
    if (!globalStore._cacheCleanup) {
        globalStore._cacheCleanup = setInterval(() => {
            const now = Date.now()
            for (const [key, entry] of store.entries()) {
                if (entry.expiresAt < now) {
                    store.delete(key)
                }
            }
            stats.size = store.size
        }, CLEANUP_INTERVAL_MS)

        if (globalStore._cacheCleanup?.unref) {
            globalStore._cacheCleanup.unref()
        }
    }
}

export function get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
        stats.misses++
        return null
    }
    
    if (entry.expiresAt < Date.now()) {
        store.delete(key)
        stats.misses++
        return null
    }
    
    stats.hits++
    return entry.data
}

export function set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    store.set(key, { data, expiresAt })
    stats.size = store.size
}

export function del(key: string): void {
    store.delete(key)
    stats.size = store.size
}

export function delPattern(pattern: string): number {
    let deleted = 0
    for (const key of store.keys()) {
        if (key.startsWith(pattern)) {
            store.delete(key)
            deleted++
        }
    }
    stats.size = store.size
    return deleted
}

export function getStats(): CacheStats {
    return { ...stats }
}

export function clear(): void {
    store.clear()
    stats = { hits: 0, misses: 0, size: 0 }
}

export const CACHE_KEYS = {
    COURSES_LIST: 'courses:list',
    COURSES_BRANCHES: 'courses:branches',
    QUIZ_CONFIG: 'quiz:config',
    SYSTEM_SETTINGS: 'system:settings',
} as const

export const CACHE_TTL = {
    SHORT: 30,
    MEDIUM: 60,
    LONG: 300,
    VERY_LONG: 600,
} as const
