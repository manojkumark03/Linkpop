import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateUserProfile } from "@/lib/profile"
import { updateProfileSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"
import { isProTier } from "@/lib/subscription"
import { sql } from "@/lib/db"

async function updateProfileHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const data = result.data

    if (data.username && data.username !== user.username) {
      // Check if username is taken
      const existingUser = await sql`
        SELECT id FROM users WHERE username = ${data.username} AND id != ${user.id} LIMIT 1
      `
      if (existingUser.length > 0) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
      }

      // Check if username conflicts with any short codes
      const shortCodeConflict = await sql`
        SELECT id FROM shortened_urls WHERE short_code = ${data.username} LIMIT 1
      `
      if (shortCodeConflict.length > 0) {
        return NextResponse.json({ error: "Username conflicts with an existing short link" }, { status: 400 })
      }
    }

    if (data.custom_js !== undefined && !isProTier(user.subscription_tier)) {
      return NextResponse.json({ error: "Custom JavaScript requires Pro subscription" }, { status: 403 })
    }

    if (data.custom_html !== undefined && !isProTier(user.subscription_tier)) {
      return NextResponse.json({ error: "Custom HTML requires Pro subscription" }, { status: 403 })
    }

    if (data.custom_domain !== undefined && !isProTier(user.subscription_tier)) {
      return NextResponse.json({ error: "Custom domain requires Pro subscription" }, { status: 403 })
    }

    await updateUserProfile(user.id, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export const PATCH = withRateLimit(updateProfileHandler, { max: 50 })
