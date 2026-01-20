import { type NextRequest, NextResponse } from "next/server"
import { getShortenedUrlByCode, incrementClicks, trackClick } from "@/lib/url-shortener"

// Now directly handles the redirect here instead of redirecting to /l/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ shortCode: string }> }) {
  try {
    const { shortCode } = await params

    const shortenedUrl = await getShortenedUrlByCode(shortCode)

    if (!shortenedUrl) {
      return new NextResponse("Short link not found", { status: 404 })
    }

    // Track analytics
    const userAgent = request.headers.get("user-agent") || undefined
    const referrer = request.headers.get("referer") || undefined
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || undefined

    Promise.all([incrementClicks(shortenedUrl.id), trackClick(shortenedUrl.id, userAgent, referrer, ipAddress)]).catch(
      (err) => console.error("[v0] Analytics error:", err),
    )

    return NextResponse.redirect(shortenedUrl.original_url, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[v0] Redirect error:", error)

    const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
    return new NextResponse(
      JSON.stringify({
        error: "Failed to process redirect",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
