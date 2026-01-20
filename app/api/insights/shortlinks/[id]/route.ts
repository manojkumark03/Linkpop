import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getSubscriptionLimits, type SubscriptionTier } from "@/lib/subscription"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id || id === "undefined") {
      console.error("[v0] Invalid shortlink ID:", id)
      return NextResponse.json({ error: "Invalid shortlink ID" }, { status: 400 })
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

    console.log("[v0] Fetching shortlink analytics:", { id, userId: user.id, queryStartDate, queryEndDate })

    const shortlinkResult = await sql`
      SELECT * FROM shortened_urls WHERE id = ${id} AND user_id = ${user.id}
    `

    if (shortlinkResult.length === 0) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 })
    }

    const shortlink = shortlinkResult[0]

    const totalClicksResult = await sql`
      SELECT COUNT(*) as total
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
    `

    const clicksByDay = await sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `

    const topCountries = await sql`
      SELECT country, COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
        AND country IS NOT NULL
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT 10
    `

    const topCities = await sql`
      SELECT city, country, COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
        AND city IS NOT NULL
      GROUP BY city, country
      ORDER BY clicks DESC
      LIMIT 10
    `

    const topBrowsers = await sql`
      SELECT browser, browser_version, COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
        AND browser IS NOT NULL
      GROUP BY browser, browser_version
      ORDER BY clicks DESC
      LIMIT 10
    `

    const topOS = await sql`
      SELECT os, os_version, COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
        AND os IS NOT NULL
      GROUP BY os, os_version
      ORDER BY clicks DESC
      LIMIT 10
    `

    const topReferrers = await sql`
      SELECT 
        COALESCE(referrer_platform, 'direct') as platform,
        referrer, 
        COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
      GROUP BY referrer_platform, referrer
      ORDER BY clicks DESC
      LIMIT 15
    `

    const deviceTypes = await sql`
      SELECT COALESCE(device_type, 'desktop') as device_type, COUNT(*) as clicks
      FROM analytics_events
      WHERE shortlink_id = ${id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'click'
      GROUP BY device_type
      ORDER BY clicks DESC
    `

    const totalClicks = Number(totalClicksResult[0]?.total || 0)

    console.log("[v0] Shortlink analytics:", {
      shortCode: shortlink.short_code,
      totalClicks,
      countriesCount: topCountries.length,
      citiesCount: topCities.length,
    })

    return NextResponse.json({
      link: {
        id: shortlink.id,
        short_code: shortlink.short_code,
        destination_url: shortlink.original_url,
        title: shortlink.title,
        total_clicks: shortlink.clicks,
        created_at: shortlink.created_at,
      },
      clicksByDay: clicksByDay.map((d) => ({
        date: d.date,
        clicks: Number(d.clicks),
      })),
      topCountries: topCountries.map((c) => ({
        country: c.country,
        clicks: Number(c.clicks),
      })),
      topCities: topCities.map((c) => ({
        city: c.city,
        country: c.country,
        clicks: Number(c.clicks),
      })),
      topBrowsers: topBrowsers.map((b) => ({
        browser: b.browser,
        version: b.browser_version,
        clicks: Number(b.clicks),
      })),
      topOS: topOS.map((o) => ({
        os: o.os,
        version: o.os_version,
        clicks: Number(o.clicks),
      })),
      topReferrers: topReferrers.map((r) => ({
        platform: r.platform || "direct",
        referrer: r.referrer || "Direct",
        clicks: Number(r.clicks),
      })),
      deviceTypes: deviceTypes.map((d) => ({
        deviceType: d.device_type || "desktop",
        clicks: Number(d.clicks),
      })),
      summary: {
        totalClicks,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get shortlink analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch shortlink analytics" }, { status: 500 })
  }
}
