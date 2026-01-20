import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { withRateLimit } from "@/lib/middleware"

async function checkUsernameHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username parameter required" }, { status: 400 })
    }

    // Check reserved usernames
    const RESERVED_USERNAMES = new Set([
      "s",
      "admin",
      "dashboard",
      "api",
      "login",
      "signup",
      "logout",
      "auth",
      "profile",
      "settings",
      "_next",
      "static",
      "public",
      "favicon",
      "robots",
      "sitemap",
      "analytics",
      "linktree",
      "bitly",
    ])

    if (RESERVED_USERNAMES.has(username.toLowerCase())) {
      return NextResponse.json({ available: false, reason: "reserved" })
    }

    // Check if username exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ available: false, reason: "taken" })
    }

    // Check if username conflicts with short codes
    const existingShortCode = await sql`
      SELECT id FROM shortened_urls WHERE short_code = ${username}
    `

    if (existingShortCode.length > 0) {
      return NextResponse.json({ available: false, reason: "conflict" })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Username check error:", error)
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 })
  }
}

export const GET = withRateLimit(checkUsernameHandler, { max: 100 })
