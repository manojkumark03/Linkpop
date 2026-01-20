import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createBioLink, getUserBioLinks } from "@/lib/bio-links"
import { createBioLinkSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"
import { getSubscriptionLimits } from "@/lib/subscription"
import { sql } from "@/lib/db"
import { detectSocialPlatform } from "@/lib/blocks"

async function getBioLinksHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const links = await getUserBioLinks(user.id)

    return NextResponse.json({ links })
  } catch (error) {
    console.error("Get bio links error:", error)
    return NextResponse.json({ error: "Failed to fetch bio links" }, { status: 500 })
  }
}

async function createBioLinkHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const result = createBioLinkSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { title, url, icon, block_type, block_data } = result.data

    console.log("[v0] User subscription_tier:", user.subscription_tier)
    const limits = getSubscriptionLimits(user.subscription_tier)
    console.log("[v0] Subscription limits:", limits)

    // Advanced blocks require Pro
    if (!limits.advancedBlocks && block_type !== "link" && block_type !== "social") {
      return NextResponse.json(
        { error: "Advanced blocks require Pro subscription. Upgrade to unlock." },
        { status: 403 },
      )
    }

    if (limits.maxLinks !== -1) {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM bio_links WHERE user_id = ${user.id}
      `
      const currentCount = Number(countResult[0].count)

      if (currentCount >= limits.maxLinks) {
        return NextResponse.json(
          { error: `Free tier limited to ${limits.maxLinks} links. Upgrade to Pro for unlimited links.` },
          { status: 403 },
        )
      }
    }

    // Auto-detect social platform
    let finalBlockData = block_data || {}
    if (block_type === "social" && url) {
      const platform = detectSocialPlatform(url)
      if (platform) {
        finalBlockData = { ...finalBlockData, platform }
      }
    }

    const link = await createBioLink(user.id, title, url, icon, block_type, finalBlockData)

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    console.error("Create bio link error:", error)
    return NextResponse.json({ error: "Failed to create bio link" }, { status: 500 })
  }
}

export const GET = withRateLimit(getBioLinksHandler, { max: 100 })
export const POST = withRateLimit(createBioLinkHandler, { max: 50 })
