import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { trackAnalyticsEvent } from "@/lib/analytics-tracking"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const linkResult = await sql`
      SELECT user_id, url, title FROM bio_links WHERE id = ${id}
    `

    if (linkResult.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    const link = linkResult[0]

    await trackAnalyticsEvent(request, {
      userId: link.user_id,
      eventType: "click",
      linkId: id,
      targetUrl: link.url,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track bio link click error:", error)
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
  }
}
