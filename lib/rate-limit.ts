// Simple in-memory rate limiter (for production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const key in store) {
      if (store[key].resetAt < now) {
        delete store[key]
      }
    }
  },
  5 * 60 * 1000,
)

export interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  max?: number // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function rateLimit(identifier: string, options: RateLimitOptions = {}): RateLimitResult {
  const windowMs = options.windowMs || 60 * 1000 // Default: 1 minute
  const max = options.max || 100 // Default: 100 requests per minute

  const now = Date.now()
  const key = identifier

  if (!store[key] || store[key].resetAt < now) {
    // Initialize or reset
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    }

    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: store[key].resetAt,
    }
  }

  // Increment count
  store[key].count++

  const remaining = Math.max(0, max - store[key].count)
  const success = store[key].count <= max

  return {
    success,
    limit: max,
    remaining,
    reset: store[key].resetAt,
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  }
}
