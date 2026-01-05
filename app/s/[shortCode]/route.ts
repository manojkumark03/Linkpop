import { type NextRequest, NextResponse } from "next/server"
import { getShortenedUrlByCode, incrementClicks, trackClick } from "@/lib/url-shortener"

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortCode: string }> }) {
  try {
    const { shortCode } = await params

    const shortenedUrl = await getShortenedUrlByCode(shortCode)

    if (!shortenedUrl) {
      return NextResponse.redirect(new URL("/404", request.url))
    }

    // Track analytics
    const userAgent = request.headers.get("user-agent") || undefined
    const referrer = request.headers.get("referer") || undefined
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || undefined

    await Promise.all([incrementClicks(shortenedUrl.id), trackClick(shortenedUrl.id, userAgent, referrer, ipAddress)])

    // Redirect to new format without /s/ prefix
    return NextResponse.redirect(new URL(`/${shortCode}`, request.url), 301)
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.redirect(new URL("/404", request.url))
  }
}
