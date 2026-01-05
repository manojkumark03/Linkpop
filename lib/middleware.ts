import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitHeaders } from "./rate-limit"

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>, options?: { max?: number }) {
  return async (req: NextRequest) => {
    // Use IP address as identifier
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const identifier = `${ip}:${req.nextUrl.pathname}`

    const rateLimitResult = rateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      max: options?.max || 100,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      )
    }

    const response = await handler(req)

    // Add rate limit headers to successful responses
    const headers = getRateLimitHeaders(rateLimitResult)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
}
