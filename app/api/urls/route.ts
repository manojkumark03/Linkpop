import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createShortenedUrl, getUserShortenedUrls } from "@/lib/url-shortener"
import { createUrlSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"
import { getSubscriptionLimits } from "@/lib/subscription"
import { sql } from "@/lib/db"

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
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { originalUrl, customCode, title } = result.data

    console.log("[v0] User subscription_tier:", user.subscription_tier)
    const limits = getSubscriptionLimits(user.subscription_tier)
    console.log("[v0] Subscription limits:", limits)

    if (limits.maxUrls !== -1) {
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
    }

    const shortenedUrl = await createShortenedUrl(user.id, originalUrl, customCode, title)

    return NextResponse.json({ url: shortenedUrl }, { status: 201 })
  } catch (error: any) {
    console.error("Create URL error:", error)

    if (error.message === "Short code already in use") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create shortened URL" }, { status: 500 })
  }
}

export const GET = withRateLimit(getUrlsHandler, { max: 100 })
export const POST = withRateLimit(createUrlHandler, { max: 50 })
