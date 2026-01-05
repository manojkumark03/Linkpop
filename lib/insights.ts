import { sql } from "./db"
import { getSubscriptionLimits, type SubscriptionTier } from "./subscription"

export interface InsightsStats {
  totalClicks: number
  urlClicks: number
  bioLinkClicks: number
  clicksToday: number
  clicksThisWeek: number
  clicksThisMonth: number
  topUrls: Array<{
    id: string
    title: string
    short_code?: string
    url: string
    clicks: number
  }>
  topBioLinks: Array<{
    id: string
    title: string
    url: string
    clicks: number
  }>
  recentClicks: Array<{
    id: string
    type: "url" | "bio_link"
    title: string
    clicked_at: string
    country: string | null
    city: string | null
  }>
  clicksByDay: Array<{
    date: string
    clicks: number
    urlClicks?: number
    bioLinkClicks?: number
  }>
}

export interface DetailedAnalytics {
  geographic: Array<{
    country: string | null
    city: string | null
    clicks: number
  }>
  devices: Array<{
    device_type: string | null
    clicks: number
  }>
  browsers: Array<{
    browser: string | null
    clicks: number
  }>
  referrers: Array<{
    platform: string | null
    clicks: number
  }>
}

export async function getUserInsights(userId: string, startDate?: Date, endDate?: Date): Promise<InsightsStats> {
  const userResult = await sql`
    SELECT subscription_tier FROM users WHERE id = ${userId}
  `

  const tier = (userResult[0]?.subscription_tier || "free") as SubscriptionTier
  const limits = getSubscriptionLimits(tier)
  const retentionDays = limits.analyticsRetentionDays

  // Use provided date range or default to retention period
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() - retentionDays)

  const queryStartDate = startDate && startDate > retentionDate ? startDate : retentionDate
  const queryEndDate = endDate || new Date()

  // Total clicks from shortened URLs (all time - these are cumulative)
  const urlClicksResult = await sql`
    SELECT COALESCE(SUM(clicks), 0) as total
    FROM shortened_urls
    WHERE user_id = ${userId}
  `

  // Total analytics entries for bio links (within date range)
  const bioLinkClicksResult = await sql`
    SELECT COUNT(*) as total
    FROM analytics_events a
    INNER JOIN bio_links bl ON a.link_id = bl.id
    WHERE bl.user_id = ${userId}
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
      AND a.event_type = 'click'
  `

  // Clicks today
  const clicksTodayResult = await sql`
    SELECT COUNT(*) as total
    FROM analytics_events a
    WHERE a.user_id = ${userId}
      AND a.timestamp >= CURRENT_DATE
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
  `

  // Clicks this week
  const clicksThisWeekResult = await sql`
    SELECT COUNT(*) as total
    FROM analytics_events a
    WHERE a.user_id = ${userId}
      AND a.timestamp >= CURRENT_DATE - INTERVAL '7 days'
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
  `

  // Clicks this month
  const clicksThisMonthResult = await sql`
    SELECT COUNT(*) as total
    FROM analytics_events a
    WHERE a.user_id = ${userId}
      AND a.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
  `

  // Top shortened URLs
  const topUrls = await sql`
    SELECT id, title, short_code, original_url as url, clicks
    FROM shortened_urls
    WHERE user_id = ${userId} AND clicks > 0
    ORDER BY clicks DESC
    LIMIT 5
  `

  // Top bio links (within date range)
  const topBioLinks = await sql`
    SELECT bl.id, bl.title, bl.url, COUNT(a.id) as clicks
    FROM bio_links bl
    LEFT JOIN analytics_events a ON bl.id = a.link_id 
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
      AND a.event_type = 'click'
    WHERE bl.user_id = ${userId}
    GROUP BY bl.id, bl.title, bl.url
    HAVING COUNT(a.id) > 0
    ORDER BY clicks DESC
    LIMIT 5
  `

  // Recent clicks (within date range)
  const recentClicks = await sql`
    SELECT 
      a.id,
      CASE 
        WHEN a.shortlink_id IS NOT NULL THEN 'url'
        ELSE 'bio_link'
      END as type,
      COALESCE(su.title, bl.title) as title,
      a.timestamp as clicked_at,
      a.country,
      a.city
    FROM analytics_events a
    LEFT JOIN shortened_urls su ON a.shortlink_id = su.id
    LEFT JOIN bio_links bl ON a.link_id = bl.id
    WHERE a.user_id = ${userId}
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
      AND a.event_type = 'click'
    ORDER BY a.timestamp DESC
    LIMIT 10
  `

  // Calculate chart days based on date range
  const daysDiff = Math.ceil((queryEndDate.getTime() - queryStartDate.getTime()) / (1000 * 60 * 60 * 24))
  const chartDays = Math.min(daysDiff, 90) // Cap at 90 days for performance

  const clicksByDay = await sql`
    SELECT 
      DATE(a.timestamp) as date,
      COUNT(*) as clicks,
      COUNT(*) FILTER (WHERE a.shortlink_id IS NOT NULL) as url_clicks,
      COUNT(*) FILTER (WHERE a.link_id IS NOT NULL) as bio_link_clicks
    FROM analytics_events a
    WHERE a.user_id = ${userId}
      AND a.timestamp >= ${queryStartDate}
      AND a.timestamp <= ${queryEndDate}
      AND a.event_type = 'click'
    GROUP BY DATE(a.timestamp)
    ORDER BY date ASC
  `

  const urlClicks = Number(urlClicksResult[0].total)
  const bioLinkClicks = Number(bioLinkClicksResult[0].total)

  return {
    totalClicks: urlClicks + bioLinkClicks,
    urlClicks,
    bioLinkClicks,
    clicksToday: Number(clicksTodayResult[0].total),
    clicksThisWeek: Number(clicksThisWeekResult[0].total),
    clicksThisMonth: Number(clicksThisMonthResult[0].total),
    topUrls: topUrls.map((u) => ({
      id: u.id,
      title: u.title || "Untitled",
      short_code: u.short_code,
      url: u.url,
      clicks: Number(u.clicks),
    })),
    topBioLinks: topBioLinks.map((bl) => ({
      id: bl.id,
      title: bl.title,
      url: bl.url,
      clicks: Number(bl.clicks),
    })),
    recentClicks: recentClicks.map((rc) => ({
      id: rc.id,
      type: rc.type,
      title: rc.title || "Untitled",
      clicked_at: rc.clicked_at,
      country: rc.country,
      city: rc.city,
    })),
    clicksByDay: clicksByDay.map((cbd) => ({
      date: cbd.date,
      clicks: Number(cbd.clicks),
      urlClicks: Number(cbd.url_clicks),
      bioLinkClicks: Number(cbd.bio_link_clicks),
    })),
  }
}

export async function getUserDetailedAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<DetailedAnalytics> {
  const userResult = await sql`
    SELECT subscription_tier FROM users WHERE id = ${userId}
  `

  const tier = (userResult[0]?.subscription_tier || "free") as SubscriptionTier
  const limits = getSubscriptionLimits(tier)
  const retentionDays = limits.analyticsRetentionDays

  // Use provided date range or default to retention period
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() - retentionDays)

  const queryStartDate = startDate && startDate > retentionDate ? startDate : retentionDate
  const queryEndDate = endDate || new Date()

  // Geographic distribution
  const geographic = await sql`
    SELECT country, city, COUNT(*) as clicks
    FROM analytics_events
    WHERE user_id = ${userId}
      AND timestamp >= ${queryStartDate}
      AND timestamp <= ${queryEndDate}
      AND event_type = 'click'
      AND country IS NOT NULL
    GROUP BY country, city
    ORDER BY clicks DESC
    LIMIT 20
  `

  // Device types
  const devices = await sql`
    SELECT device_type, COUNT(*) as clicks
    FROM analytics_events
    WHERE user_id = ${userId}
      AND timestamp >= ${queryStartDate}
      AND timestamp <= ${queryEndDate}
      AND event_type = 'click'
    GROUP BY device_type
    ORDER BY clicks DESC
  `

  // Browsers
  const browsers = await sql`
    SELECT browser, COUNT(*) as clicks
    FROM analytics_events
    WHERE user_id = ${userId}
      AND timestamp >= ${queryStartDate}
      AND timestamp <= ${queryEndDate}
      AND event_type = 'click'
      AND browser IS NOT NULL
    GROUP BY browser
    ORDER BY clicks DESC
    LIMIT 10
  `

  // Referrer platforms
  const referrers = await sql`
    SELECT referrer_platform as platform, COUNT(*) as clicks
    FROM analytics_events
    WHERE user_id = ${userId}
      AND timestamp >= ${queryStartDate}
      AND timestamp <= ${queryEndDate}
      AND event_type = 'click'
    GROUP BY referrer_platform
    ORDER BY clicks DESC
    LIMIT 15
  `

  return {
    geographic: geographic.map((g) => ({
      country: g.country,
      city: g.city,
      clicks: Number(g.clicks),
    })),
    devices: devices.map((d) => ({
      device_type: d.device_type,
      clicks: Number(d.clicks),
    })),
    browsers: browsers.map((b) => ({
      browser: b.browser,
      clicks: Number(b.clicks),
    })),
    referrers: referrers.map((r) => ({
      platform: r.platform,
      clicks: Number(r.clicks),
    })),
  }
}
