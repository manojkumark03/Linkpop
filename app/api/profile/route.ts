import type { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateUserProfile } from "@/lib/profile"
import { updateProfileSchema } from "@/lib/validation"
import { withApiHandler, successResponse } from "@/lib/api-wrapper"
import { AuthenticationError, ValidationError, DatabaseError } from "@/lib/errors"
import { queryWithTimeout } from "@/lib/db"
import { isProTier } from "@/lib/subscription"
import { sql } from "@/lib/db"

async function updateProfileHandler(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthenticationError("You must be signed in to update your profile")
  }

  const body = await request.json()
  const result = updateProfileSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message, result.error.errors)
  }

  const data = result.data

  if (data.username && data.username !== user.username) {
    // Check if username is taken
    const existingUser = await queryWithTimeout(async () => {
      return await sql`
        SELECT id FROM users WHERE username = ${data.username} AND id != ${user.id} LIMIT 1
      `
    })

    if (existingUser.length > 0) {
      throw new ValidationError("Username is already taken")
    }

    // Check if username conflicts with any short codes
    const shortCodeConflict = await queryWithTimeout(async () => {
      return await sql`
        SELECT id FROM shortened_urls WHERE short_code = ${data.username} LIMIT 1
      `
    })

    if (shortCodeConflict.length > 0) {
      throw new ValidationError("Username conflicts with an existing short link")
    }
  }

  if (data.custom_js !== undefined && !isProTier(user.subscription_tier)) {
    throw new ValidationError("Custom JavaScript requires Pro subscription")
  }

  if (data.custom_html !== undefined && !isProTier(user.subscription_tier)) {
    throw new ValidationError("Custom HTML requires Pro subscription")
  }

  if (data.custom_domain !== undefined && !isProTier(user.subscription_tier)) {
    throw new ValidationError("Custom domain requires Pro subscription")
  }

  // Validate redirect mode configuration
  if (data.root_domain_mode === "redirect") {
    console.log("came in");
    if (!data.root_domain_redirect_url || !data.root_domain_redirect_url.trim()) {
      console.log("executing here");
      const userResult = await queryWithTimeout(async () => {
        return await sql`SELECT root_domain_redirect_url FROM users WHERE id = ${user.id}`
      })
      console.log("user result : ",userResult)
      if (!userResult[0]?.root_domain_redirect_url) {
        throw new ValidationError("Redirect URL is required when using redirect mode")
      }
    } else {
      try {
        console.log("data ",data)
        new URL(data.root_domain_redirect_url)
      } catch {
        throw new ValidationError("Invalid redirect URL format")
      }
    }
  }

  try {
    const res = await updateUserProfile(user.id, data);
    console.log("res : ",res)
  } catch (error) {
    throw new DatabaseError("Failed to update profile. Please try again.")
  }

  return successResponse({ success: true })
}

export const PATCH = withApiHandler(updateProfileHandler, {
  timeout: 5000,
  retries: 2,
  rateLimit: { max: 50 },
})
