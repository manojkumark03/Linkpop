import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { trackAnalyticsEvent } from "@/lib/analytics-tracking"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    const userResult = await sql`
      SELECT id FROM users WHERE username = ${username}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id

    await trackAnalyticsEvent(request, {
      userId,
      eventType: "view",
      // No link_id or shortlink_id for profile views
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Track profile view error:", error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
