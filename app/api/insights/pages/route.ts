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

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const tier = (user.subscription_tier || "free") as SubscriptionTier
    const limits = getSubscriptionLimits(tier)
    const retentionDays = limits.analyticsRetentionDays

    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - retentionDays)

    const queryStartDate = startDate && startDate > retentionDate ? startDate : retentionDate
    const queryEndDate = endDate || new Date()

    console.log("[v0] Fetching pages analytics:", { userId: user.id, queryStartDate, queryEndDate })

    const profileViewsResult = await sql`
      SELECT COUNT(*) as total
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
    `

    const linkClicksResult = await sql`
      SELECT COUNT(*) as total
      FROM analytics_events ae
      INNER JOIN bio_links bl ON ae.link_id = bl.id
      WHERE bl.user_id = ${user.id}
        AND ae.timestamp >= ${queryStartDate}
        AND ae.timestamp <= ${queryEndDate}
        AND ae.event_type = 'click'
    `

    const profileViews = Number(profileViewsResult[0]?.total || 0)
    const linkClicks = Number(linkClicksResult[0]?.total || 0)
    const ctr = profileViews > 0 ? (linkClicks / profileViews) * 100 : 0

    console.log("[v0] Profile views:", profileViews, "Link clicks:", linkClicks)

    const viewsByDay = await sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `

    const topLinks = await sql`
      SELECT 
        bl.id,
        bl.title,
        bl.url,
        COUNT(ae.id) as clicks,
        ROUND((COUNT(ae.id)::NUMERIC / NULLIF(${profileViews}, 0)) * 100, 2) as ctr
      FROM bio_links bl
      LEFT JOIN analytics_events ae ON bl.id = ae.link_id 
        AND ae.timestamp >= ${queryStartDate}
        AND ae.timestamp <= ${queryEndDate}
        AND ae.event_type = 'click'
      WHERE bl.user_id = ${user.id}
      GROUP BY bl.id, bl.title, bl.url
      HAVING COUNT(ae.id) > 0
      ORDER BY clicks DESC
      LIMIT 10
    `

    const topCountries = await sql`
      SELECT country, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
        AND country IS NOT NULL
      GROUP BY country
      ORDER BY views DESC
      LIMIT 10
    `

    const topCities = await sql`
      SELECT city, country, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
        AND city IS NOT NULL
      GROUP BY city, country
      ORDER BY views DESC
      LIMIT 10
    `

    const deviceTypes = await sql`
      SELECT device_type, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY views DESC
    `

    const topBrowsers = await sql`
      SELECT browser, browser_version, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
        AND browser IS NOT NULL
      GROUP BY browser, browser_version
      ORDER BY views DESC
      LIMIT 10
    `

    const topOS = await sql`
      SELECT os, os_version, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
        AND os IS NOT NULL
      GROUP BY os, os_version
      ORDER BY views DESC
      LIMIT 10
    `

    const trafficSources = await sql`
      SELECT referrer_platform as platform, COUNT(*) as views
      FROM analytics_events
      WHERE user_id = ${user.id}
        AND timestamp >= ${queryStartDate}
        AND timestamp <= ${queryEndDate}
        AND event_type = 'view'
        AND link_id IS NULL
        AND shortlink_id IS NULL
      GROUP BY referrer_platform
      ORDER BY views DESC
      LIMIT 10
    `

    return NextResponse.json({
      overview: {
        profileViews,
        linkClicks,
        ctr: Number.parseFloat(ctr.toFixed(2)),
      },
      viewsByDay: viewsByDay.map((v) => ({
        date: v.date,
        views: Number(v.views),
      })),
      topLinks: topLinks.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        clicks: Number(l.clicks),
        ctr: Number(l.ctr || 0),
      })),
      topCountries: topCountries.map((c) => ({
        country: c.country,
        views: Number(c.views),
      })),
      topCities: topCities.map((c) => ({
        city: c.city,
        country: c.country,
        views: Number(c.views),
      })),
      deviceTypes: deviceTypes.map((d) => ({
        deviceType: d.device_type || "unknown",
        views: Number(d.views),
      })),
      topBrowsers: topBrowsers.map((b) => ({
        browser: b.browser,
        version: b.browser_version,
        views: Number(b.views),
      })),
      topOS: topOS.map((o) => ({
        os: o.os,
        version: o.os_version,
        views: Number(o.views),
      })),
      trafficSources: trafficSources.map((t) => ({
        platform: t.platform || "direct",
        views: Number(t.views),
      })),
    })
  } catch (error) {
    console.error("[v0] Get pages analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch pages analytics" }, { status: 500 })
  }
}
