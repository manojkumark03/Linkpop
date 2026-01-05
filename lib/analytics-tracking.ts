import { sql } from "./db"
import type { NextRequest } from "next/server"
import { UAParser } from "ua-parser-js"

export interface TrackingData {
  userId: string
  eventType: "view" | "click"
  linkId?: string
  shortlinkId?: string
  targetUrl?: string
}

export interface ParsedAnalytics {
  // User Agent Data
  userAgent: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  deviceType: string | null
  deviceBrand: string | null
  deviceModel: string | null
  // Geographic Data
  ipAddress: string | null
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  latitude: string | null
  longitude: string | null
  // Referrer Data
  referrer: string | null
  referrerPlatform: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
}

// Parse user agent string to extract device, browser, and OS information
export function parseUserAgent(userAgent: string | null): Partial<ParsedAnalytics> {
  if (!userAgent) {
    return {
      userAgent: null,
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      deviceType: null,
      deviceBrand: null,
      deviceModel: null,
    }
  }

  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      userAgent,
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      osVersion: result.os.version || null,
      deviceType: result.device.type || "desktop",
      deviceBrand: result.device.vendor || null,
      deviceModel: result.device.model || null,
    }
  } catch (error) {
    console.error("[v0] User agent parsing error:", error)
    return {
      userAgent,
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      deviceType: null,
      deviceBrand: null,
      deviceModel: null,
    }
  }
}

// Extract geographic data from Vercel headers (free, built-in)
export function extractGeolocation(request: NextRequest): Partial<ParsedAnalytics> {
  return {
    country: request.headers.get("x-vercel-ip-country") || null,
    countryCode: request.headers.get("x-vercel-ip-country") || null,
    city: request.headers.get("x-vercel-ip-city") || null,
    region: request.headers.get("x-vercel-ip-country-region") || null,
    latitude: request.headers.get("x-vercel-ip-latitude") || null,
    longitude: request.headers.get("x-vercel-ip-longitude") || null,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null,
  }
}

// Identify referrer platform from URL
export function parseReferrer(referrer: string | null): Partial<ParsedAnalytics> {
  if (!referrer) {
    return {
      referrer: null,
      referrerPlatform: "direct",
    }
  }

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    let platform = "other"

    // Social media platforms
    if (hostname.includes("instagram.com")) platform = "instagram"
    else if (hostname.includes("facebook.com") || hostname.includes("fb.com")) platform = "facebook"
    else if (hostname.includes("twitter.com") || hostname.includes("x.com")) platform = "twitter"
    else if (hostname.includes("linkedin.com")) platform = "linkedin"
    else if (hostname.includes("tiktok.com")) platform = "tiktok"
    else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) platform = "youtube"
    else if (hostname.includes("reddit.com")) platform = "reddit"
    else if (hostname.includes("pinterest.com")) platform = "pinterest"
    else if (hostname.includes("snapchat.com")) platform = "snapchat"
    else if (hostname.includes("whatsapp.com")) platform = "whatsapp"
    else if (hostname.includes("telegram.org") || hostname.includes("t.me")) platform = "telegram"
    // Search engines
    else if (hostname.includes("google.com")) platform = "google"
    else if (hostname.includes("bing.com")) platform = "bing"
    else if (hostname.includes("yahoo.com")) platform = "yahoo"
    else if (hostname.includes("duckduckgo.com")) platform = "duckduckgo"
    // Other
    else if (hostname.includes("github.com")) platform = "github"
    else if (hostname.includes("slack.com")) platform = "slack"
    else if (hostname.includes("discord.com")) platform = "discord"

    return {
      referrer,
      referrerPlatform: platform,
    }
  } catch (error) {
    return {
      referrer,
      referrerPlatform: "other",
    }
  }
}

// Extract UTM parameters from URL
export function extractUTMParams(url: string): Partial<ParsedAnalytics> {
  try {
    const urlObj = new URL(url)
    return {
      utmSource: urlObj.searchParams.get("utm_source") || null,
      utmMedium: urlObj.searchParams.get("utm_medium") || null,
      utmCampaign: urlObj.searchParams.get("utm_campaign") || null,
      utmTerm: urlObj.searchParams.get("utm_term") || null,
      utmContent: urlObj.searchParams.get("utm_content") || null,
    }
  } catch (error) {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    }
  }
}

// Main tracking function
export async function trackAnalyticsEvent(request: NextRequest, data: TrackingData): Promise<void> {
  try {
    const userAgentString = request.headers.get("user-agent")
    const referrerString = request.headers.get("referer")

    // Parse all tracking data
    const userAgentData = parseUserAgent(userAgentString)
    const geoData = extractGeolocation(request)
    const referrerData = parseReferrer(referrerString)
    const utmData = extractUTMParams(request.url)

    // Combine all data
    const analyticsData: ParsedAnalytics = {
      ...userAgentData,
      ...geoData,
      ...referrerData,
      ...utmData,
    } as ParsedAnalytics

    // Insert into database
    await sql`
      INSERT INTO analytics_events (
        user_id, event_type, link_id, shortlink_id, target_url,
        user_agent, browser, browser_version, os, os_version,
        device_type, device_brand, device_model,
        ip_address, country, country_code, city, region, latitude, longitude,
        referrer, referrer_platform,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      )
      VALUES (
        ${data.userId}, ${data.eventType}, ${data.linkId || null}, ${data.shortlinkId || null}, ${data.targetUrl || null},
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
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    // Don't throw - analytics failures shouldn't break the user experience
  }
}
