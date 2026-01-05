import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getSubscriptionLimits, type SubscriptionTier } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const offset = (page - 1) * limit

    const tier = (user.subscription_tier || "free") as SubscriptionTier
    const limits = getSubscriptionLimits(tier)
    const retentionDays = limits.analyticsRetentionDays

    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - retentionDays)

    const queryStartDate = startDate && startDate > retentionDate ? startDate : retentionDate
    const queryEndDate = endDate || new Date()

    console.log("[v0] Fetching shortlinks overview:", { userId: user.id, queryStartDate, queryEndDate })

    const shortlinks = await sql`
      SELECT 
        su.id,
        su.short_code,
        su.original_url,
        su.title,
        su.clicks as total_clicks,
        COALESCE(
          (SELECT COUNT(*) FROM analytics_events ae 
           WHERE ae.shortlink_id = su.id 
           AND ae.timestamp >= ${queryStartDate}
           AND ae.timestamp <= ${queryEndDate}
           AND ae.event_type = 'click'), 
          0
        ) as clicks_in_range,
        su.created_at
      FROM shortened_urls su
      WHERE su.user_id = ${user.id}
      ORDER BY su.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM shortened_urls WHERE user_id = ${user.id}
    `

    const totalClicksResult = await sql`
      SELECT SUM(clicks) as total FROM shortened_urls WHERE user_id = ${user.id}
    `

    const totalLinks = Number(countResult[0]?.total || 0)
    const totalClicks = Number(totalClicksResult[0]?.total || 0)
    const avgCtr = totalLinks > 0 ? ((totalClicks / totalLinks / totalLinks) * 100).toFixed(1) : 0

    const totalPages = Math.ceil(totalLinks / limit)

    console.log("[v0] Shortlinks overview:", { totalLinks, totalClicks, avgCtr })

    return NextResponse.json({
      overview: {
        totalLinks,
        totalClicks,
        avgCtr: Number(avgCtr),
      },
      topLinks: shortlinks.map((s) => ({
        id: s.id,
        short_code: s.short_code,
        destination_url: s.original_url,
        title: s.title,
        total_clicks: Number(s.total_clicks),
        clicks_in_range: Number(s.clicks_in_range),
        created_at: s.created_at,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalLinks,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error("[v0] Get shortlinks error:", error)
    return NextResponse.json({ error: "Failed to fetch shortlinks" }, { status: 500 })
  }
}
