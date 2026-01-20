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

    const tier = (user.subscription_tier || "free") as SubscriptionTier
    const limits = getSubscriptionLimits(tier)
    const retentionDays = limits.analyticsRetentionDays

    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - retentionDays)

    const queryStartDate = startDate && startDate > retentionDate ? startDate : retentionDate
    const queryEndDate = endDate || new Date()

    const totalRedirectsResult = await sql`
      SELECT COUNT(*) as total
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND event_type = 'redirect'
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
    `

    const redirectsByDay = await sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as redirects
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND event_type = 'redirect'
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `

    const topCountries = await sql`
      SELECT country, COUNT(*) as redirects
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND event_type = 'redirect'
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND country IS NOT NULL
      GROUP BY country
      ORDER BY redirects DESC
      LIMIT 10
    `

    const topReferrers = await sql`
      SELECT 
        COALESCE(referrer_platform, 'direct') as platform,
        referrer, 
        COUNT(*) as redirects
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND event_type = 'redirect'
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
      GROUP BY referrer_platform, referrer
      ORDER BY redirects DESC
      LIMIT 15
    `

    const deviceTypes = await sql`
      SELECT COALESCE(device_type, 'desktop') as device_type, COUNT(*) as redirects
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND event_type = 'redirect'
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
      GROUP BY device_type
      ORDER BY redirects DESC
    `

    const totalRedirects = Number(totalRedirectsResult[0]?.total || 0)

    return NextResponse.json({
      redirectsByDay: redirectsByDay.map((d) => ({
        date: d.date,
        redirects: Number(d.redirects),
      })),
      topCountries: topCountries.map((c) => ({
        country: c.country,
        redirects: Number(c.redirects),
      })),
      topReferrers: topReferrers.map((r) => ({
        platform: r.platform || "direct",
        referrer: r.referrer || "Direct",
        redirects: Number(r.redirects),
      })),
      deviceTypes: deviceTypes.map((d) => ({
        deviceType: d.device_type || "desktop",
        redirects: Number(d.redirects),
      })),
      summary: {
        totalRedirects,
        redirectUrl: user.root_domain_redirect_url,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get redirect analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch redirect analytics" }, { status: 500 })
  }
}
