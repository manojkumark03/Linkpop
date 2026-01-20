import { type NextRequest, NextResponse } from "next/server"
import { sql, queryWithTimeout } from "@/lib/db"
import { trackAnalyticsEvent } from "@/lib/analytics-tracking"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const url = request.nextUrl
    const subdomain = url.searchParams.get("subdomain")
    const customDomain = url.searchParams.get("customDomain")

    console.log("[v0] Short link route handler:", { slug, subdomain, customDomain })

    let shortenedUrl

    if (subdomain || customDomain) {
      // Query for short code owned by specific user
      const identifier = subdomain || customDomain
      shortenedUrl = await queryWithTimeout(async () => {
        return await sql`
          SELECT su.*, u.username, u.subscription_tier
          FROM shortened_urls su
          INNER JOIN users u ON su.user_id = u.id
          WHERE su.short_code = ${slug} 
            AND su.is_active = true
            AND (u.subdomain = ${identifier} OR u.custom_domain = ${identifier})
        `
      })
    } else {
      // Query for any short code (main domain)
      shortenedUrl = await queryWithTimeout(async () => {
        return await sql`
          SELECT su.*, u.username, u.subscription_tier
          FROM shortened_urls su
          INNER JOIN users u ON su.user_id = u.id
          WHERE su.short_code = ${slug} AND su.is_active = true
        `
      })
    }

    if (shortenedUrl.length > 0) {
      const link = shortenedUrl[0]

      console.log("[v0] Found short link:", link.original_url)

      // Track analytics asynchronously
      trackAnalyticsEvent(request, {
        userId: link.user_id,
        eventType: "click",
        shortlinkId: link.id,
        targetUrl: link.original_url,
      }).catch((err) => console.error("[v0] Analytics tracking error:", err))

      // Update click count asynchronously
      sql`
        UPDATE shortened_urls 
        SET clicks = clicks + 1, updated_at = NOW()
        WHERE id = ${link.id}
      `.catch((err) => console.error("[v0] Click count update error:", err))

      return NextResponse.redirect(link.original_url, {
        status: 302,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    console.log("[v0] Short link not found:", slug)
    return new NextResponse("Short link not found", { status: 404 })
  } catch (error) {
    console.error("[v0] Short link route error:", error)

    const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
    return new NextResponse(
      JSON.stringify({
        error: "Failed to process short link",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    )
  }
}

// Use Edge runtime for maximum speed (10-100x faster than Node.js)
export const runtime = "edge"
export const dynamic = "force-dynamic"
export const revalidate = 0
