import { type NextRequest, NextResponse } from "next/server"
import { formatErrorResponse, logError, getUserFriendlyMessage, AppError, TimeoutError } from "./errors"
import { rateLimit, getRateLimitHeaders } from "./rate-limit"

export interface ApiHandlerOptions {
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number
  /** Number of retry attempts (default: 0) */
  retries?: number
  /** Rate limit configuration */
  rateLimit?: {
    windowMs?: number
    max: number
  }
  /** Whether to include detailed error messages (default: false in production) */
  includeDetails?: boolean
}

/**
 * Wraps an API handler with error handling, timeout, retries, and rate limiting
 */
export function withApiHandler(
  handler: (req: NextRequest, context?: unknown) => Promise<NextResponse>,
  options: ApiHandlerOptions = {},
) {
  return async (req: NextRequest, context?: unknown) => {
    const startTime = Date.now()
    const {
      timeout = 5000,
      retries = 0,
      rateLimit: rateLimitConfig,
      includeDetails = process.env.NODE_ENV === "development",
    } = options

    // Apply rate limiting if configured
    if (rateLimitConfig) {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
      const identifier = `${ip}:${req.nextUrl.pathname}`

      const rateLimitResult = rateLimit(identifier, {
        windowMs: rateLimitConfig.windowMs || 60 * 1000,
        max: rateLimitConfig.max,
      })

      if (!rateLimitResult.success) {
        const userMessage = getUserFriendlyMessage(new AppError("Rate limit exceeded", 429))
        return NextResponse.json(
          {
            error: userMessage,
            timestamp: new Date().toISOString(),
            code: "RATE_LIMIT_EXCEEDED",
          },
          {
            status: 429,
            headers: {
              ...getRateLimitHeaders(rateLimitResult),
              "Cache-Control": "no-store",
            },
          },
        )
      }
    }

    let lastError: unknown = null

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new TimeoutError("Request timeout")), timeout)
        })

        // Race between handler and timeout
        const response = await Promise.race([handler(req, context), timeoutPromise])

        // Add performance headers
        const duration = Date.now() - startTime
        response.headers.set("X-Response-Time", `${duration}ms`)

        return response
      } catch (error) {
        lastError = error

        // Log error with context
        logError(error, {
          path: req.nextUrl.pathname,
          method: req.method,
          attempt: attempt + 1,
          maxAttempts: retries + 1,
        })

        // Don't retry on client errors (4xx) or last attempt
        if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
          break
        }

        if (attempt < retries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const backoffMs = 100 * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
          continue
        }
      }
    }

    // All retries failed, return error response
    const errorResponse = formatErrorResponse(lastError)
    const userMessage = getUserFriendlyMessage(lastError)
    const statusCode = lastError instanceof AppError ? lastError.statusCode : 500

    return NextResponse.json(
      {
        error: userMessage,
        ...(includeDetails && { details: errorResponse }),
        timestamp: errorResponse.timestamp,
        code: errorResponse.code,
      },
      {
        status: statusCode,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      },
    )
  }
}

/**
 * Standardized success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

/**
 * Standardized error response
 */
export function errorResponse(error: unknown, status?: number): NextResponse {
  const errorData = formatErrorResponse(error)
  const userMessage = getUserFriendlyMessage(error)
  const statusCode = status || (error instanceof AppError ? error.statusCode : 500)

  return NextResponse.json(
    {
      error: userMessage,
      timestamp: errorData.timestamp,
      code: errorData.code,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    },
  )
}
