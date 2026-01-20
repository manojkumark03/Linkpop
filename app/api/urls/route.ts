import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createShortenedUrl, getUserShortenedUrls } from "@/lib/url-shortener"
import { createUrlSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"
import { getSubscriptionLimits } from "@/lib/subscription"
import { sql } from "@/lib/db"
import { ShortlinkError, DatabaseError } from "@/lib/errors"

async function getUrlsHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const urls = await getUserShortenedUrls(user.id)

    return NextResponse.json({ urls })
  } catch (error) {
    console.error("Get URLs error:", error)
    return NextResponse.json({ error: "Failed to fetch URLs" }, { status: 500 })
  }
}

async function createUrlHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const result = createUrlSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      if (firstError.path[0] === "originalUrl") {
        return NextResponse.json(
          { error: "Please enter a valid URL (must start with http:// or https://)" },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { originalUrl, customCode, title } = result.data

    console.log("[v0] Creating shortlink:", { userId: user.id, customCode: customCode || "auto", title })
    const limits = getSubscriptionLimits(user.subscription_tier)

    if (limits.maxUrls !== -1) {
      try {
        const countResult = await sql`
          SELECT COUNT(*) as count FROM shortened_urls WHERE user_id = ${user.id}
        `
        const currentCount = Number(countResult[0].count)

        if (currentCount >= limits.maxUrls) {
          return NextResponse.json(
            { error: `Free tier limited to ${limits.maxUrls} URLs. Upgrade to Pro for unlimited URLs.` },
            { status: 403 },
          )
        }
      } catch (dbError) {
        console.error("[v0] Database error checking URL count:", dbError)
        return NextResponse.json(
          { error: "Unable to connect. Please try again in a moment." },
          { status: 503 },
        )
      }
    }

    const shortenedUrl = await createShortenedUrl(user.id, originalUrl, customCode, title)

    console.log("[v0] Shortlink created successfully:", shortenedUrl.short_code)
    return NextResponse.json({ url: shortenedUrl }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create URL error:", {
      message: error.message,
      code: error.code,
      name: error.name,
    })

    // Handle ShortlinkError with suggestions
    if (error instanceof ShortlinkError) {
      return NextResponse.json(
        {
          error: error.message,
          suggestedCode: error.suggestedCode,
        },
        { status: 400 },
      )
    }

    // Handle database errors
    if (error instanceof DatabaseError || error.message?.includes("database") || error.message?.includes("query")) {
      return NextResponse.json({ error: "Unable to connect. Please try again in a moment." }, { status: 503 })
    }

    // Generic error
    return NextResponse.json(
      { error: "Failed to create shortened URL. Please try again." },
      { status: 500 },
    )
  }
}

export const GET = withRateLimit(getUrlsHandler, { max: 100 })
export const POST = withRateLimit(createUrlHandler, { max: 50 })
