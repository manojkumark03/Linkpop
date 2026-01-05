import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { trackAnalyticsEvent } from "@/lib/analytics-tracking"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const url = request.nextUrl
    const subdomain = url.searchParams.get("subdomain")
    const customDomain = url.searchParams.get("customDomain")

    console.log("[v0] Short link route handler:", { slug, subdomain, customDomain })

    // If not a username, check if it's a short code
    let shortenedUrl

    if (subdomain || customDomain) {
      // Query for short code owned by specific user
      const identifier = subdomain || customDomain
      shortenedUrl = await sql`
        SELECT su.*, u.username, u.subscription_tier
        FROM shortened_urls su
        INNER JOIN users u ON su.user_id = u.id
        WHERE su.short_code = ${slug} 
          AND su.is_active = true
          AND (u.subdomain = ${identifier} OR u.custom_domain = ${identifier})
      `
    } else {
      // Query for any short code (main domain)
      shortenedUrl = await sql`
        SELECT su.*, u.username, u.subscription_tier
        FROM shortened_urls su
        INNER JOIN users u ON su.user_id = u.id
        WHERE su.short_code = ${slug} AND su.is_active = true
      `
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

      return NextResponse.redirect(link.original_url)
    }

    console.log("[v0] Short link not found:", slug)
    return new NextResponse("Short link not found", { status: 404 })
  } catch (error) {
    console.error("[v0] Short link route error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
