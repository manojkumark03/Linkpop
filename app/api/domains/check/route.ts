import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { isDomainAvailable } from "@/lib/domains"
import { withRateLimit } from "@/lib/middleware"

async function checkDomainHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Allows domains with or without subdomains, and with various TLD formats
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    const available = await isDomainAvailable(domain)

    return NextResponse.json({ available })
  } catch (error) {
    console.error("[v0] Domain check error:", error)
    return NextResponse.json({ error: "Failed to check domain" }, { status: 500 })
  }
}

export const POST = withRateLimit(checkDomainHandler, { max: 20 })
