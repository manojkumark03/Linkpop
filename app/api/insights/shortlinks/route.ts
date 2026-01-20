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

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam) {
      const parsedStart = new Date(startDateParam)
      if (!isNaN(parsedStart.getTime())) {
        startDate = parsedStart
      }
    }

    if (endDateParam) {
      const parsedEnd = new Date(endDateParam)
      if (!isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd
      }
    }

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
      SELECT COUNT(*) as total 
      FROM shortened_urls 
      WHERE user_id = ${user.id}
        AND created_at >= ${queryStartDate}
        AND created_at <= ${queryEndDate}
    `

    const totalClicksResult = await sql`
      SELECT COALESCE(SUM(ae.clicks_count), 0) as total
      FROM (
        SELECT COUNT(*) as clicks_count
        FROM analytics_events ae
        INNER JOIN shortened_urls su ON ae.shortlink_id = su.id
        WHERE su.user_id = ${user.id}
          AND ae.timestamp >= ${queryStartDate}
          AND ae.timestamp <= ${queryEndDate}
          AND ae.event_type = 'click'
      ) ae
    `

    const totalLinks = Number(countResult[0]?.total || 0)
    const totalClicks = Number(totalClicksResult[0]?.total || 0)
    // Note: CTR removed from shortlinks as there's no view/impression data to calculate against

    const totalPages = Math.ceil(totalLinks / limit)

    console.log("[v0] Shortlinks overview:", { totalLinks, totalClicks })

    return NextResponse.json({
      overview: {
        totalLinks,
        totalClicks,
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
