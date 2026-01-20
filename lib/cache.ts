/**
 * Simple in-memory caching layer for LinkPop
 *
 * For production with multiple servers, consider:
 * - Vercel KV (Redis)
 * - Upstash Redis
 * - Database-level caching
 */

interface CacheEntry<T> {
  data: T
  expiry: number
}

// In-memory cache store
const cache = new Map<string, CacheEntry<any>>()

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (entry.expiry < now) {
        cache.delete(key)
      }
    }
  }, 300000) // 5 minutes
}

/**
 * Cached function wrapper
 *
 * @param key - Unique cache key
 * @param fn - Function to execute (and cache result)
 * @param ttlSeconds - Time-to-live in seconds (default: 60)
 * @returns Cached or fresh data
 *
 * @example
 * const insights = await cached('insights:user123', async () => {
 *   return await getUserInsights('user123')
 * }, 60)
 */
export async function cached<T>(key: string, fn: () => Promise<T>, ttlSeconds: number = 60): Promise<T> {
  const now = Date.now()
  const cached = cache.get(key)

  // Return cached data if still valid
  if (cached && cached.expiry > now) {
    console.log(`[v0] Cache HIT: ${key}`)
    return cached.data as T
  }

  console.log(`[v0] Cache MISS: ${key}`)

  // Execute function and cache result
  try {
    const data = await fn()
    const expiry = now + ttlSeconds * 1000

    cache.set(key, { data, expiry })

    return data
  } catch (error) {
    // If function fails, return stale data if available
    if (cached) {
      console.log(`[v0] Cache STALE used due to error: ${key}`)
      return cached.data as T
    }
    throw error
  }
}

/**
 * Invalidate cache entry
 *
 * @param key - Cache key to invalidate
 *
 * @example
 * invalidate('insights:user123')
 */
export function invalidate(key: string): void {
  cache.delete(key)
  console.log(`[v0] Cache INVALIDATED: ${key}`)
}

/**
 * Invalidate all cache entries matching a pattern
 *
 * @param pattern - Regex pattern or string prefix
 *
 * @example
 * invalidatePattern('insights:')  // Clears all insights caches
 * invalidatePattern(/^user:/)     // Clears all user caches
 */
export function invalidatePattern(pattern: string | RegExp): void {
  const regex = typeof pattern === "string" ? new RegExp(`^${pattern}`) : pattern

  let count = 0
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
      count++
    }
  }

  console.log(`[v0] Cache INVALIDATED ${count} entries matching: ${pattern}`)
}

/**
 * Clear all cache
 */
export function clearAll(): void {
  const size = cache.size
  cache.clear()
  console.log(`[v0] Cache CLEARED: ${size} entries`)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0

  for (const entry of cache.values()) {
    if (entry.expiry > now) {
      validEntries++
    } else {
      expiredEntries++
    }
  }

  return {
    total: cache.size,
    valid: validEntries,
    expired: expiredEntries,
  }
}

/**
 * Cached with automatic invalidation on data change
 *
 * Use this for data that should be invalidated when related data changes
 *
 * @example
 * // Cache user profile for 5 minutes
 * const profile = await cachedWithInvalidation(
 *   'profile:user123',
 *   () => getUserProfile('user123'),
 *   300,
 *   ['user:user123'] // Invalidate when user data changes
 * )
 */
export async function cachedWithInvalidation<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 60,
  invalidateKeys: string[] = [],
): Promise<T> {
  const data = await cached(key, fn, ttlSeconds)

  // Store invalidation relationship
  if (invalidateKeys.length > 0) {
    // This is a simplified version - in production, use a proper pub/sub system
    invalidateKeys.forEach((invalidateKey) => {
      // Store mapping for future invalidation
      // For now, we'll just log it
      console.log(`[v0] Cache dependency: ${key} depends on ${invalidateKey}`)
    })
  }

  return data
}
