import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { parseUserAgent, extractGeolocation, parseReferrer, extractUTMParams } from "@/lib/analytics-tracking"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetUrl, customDomain } = body

    if (!userId || !targetUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userAgentString = request.headers.get("user-agent")
    const referrerString = request.headers.get("referer")

    const userAgentData = parseUserAgent(userAgentString)
    const geoData = extractGeolocation(request)
    const referrerData = parseReferrer(referrerString)
    const utmData = extractUTMParams(request.url)

    const analyticsData = {
      ...userAgentData,
      ...geoData,
      ...referrerData,
      ...utmData,
    }

    await sql`
      INSERT INTO analytics_events (
        user_id, event_type, target_url,
        user_agent, browser, browser_version, os, os_version,
        device_type, device_brand, device_model,
        ip_address, country, country_code, city, region, latitude, longitude,
        referrer, referrer_platform,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      )
      VALUES (
        ${userId}, 'redirect', ${targetUrl},
        ${analyticsData.userAgent}, ${analyticsData.browser}, ${analyticsData.browserVersion},
        ${analyticsData.os}, ${analyticsData.osVersion},
        ${analyticsData.deviceType}, ${analyticsData.deviceBrand}, ${analyticsData.deviceModel},
        ${analyticsData.ipAddress}, ${analyticsData.country}, ${analyticsData.countryCode},
        ${analyticsData.city}, ${analyticsData.region}, ${analyticsData.latitude}, ${analyticsData.longitude},
        ${analyticsData.referrer}, ${analyticsData.referrerPlatform},
        ${analyticsData.utmSource}, ${analyticsData.utmMedium}, ${analyticsData.utmCampaign},
        ${analyticsData.utmTerm}, ${analyticsData.utmContent}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Redirect tracking error:", error)
    return NextResponse.json({ error: "Failed to track redirect" }, { status: 500 })
  }
}
