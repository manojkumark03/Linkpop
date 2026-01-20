import { sql, queryWithTimeout } from "./db"
import type { ShortenedUrl } from "./types"
import { isReservedRoute } from "./constants"
import { ShortlinkError } from "./errors"

// Generate a random short code
export function generateShortCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Check if a short code is available
export async function isShortCodeAvailable(shortCode: string): Promise<boolean> {
  if (isReservedRoute(shortCode)) {
    return false
  }

  // Check if short code exists in shortened_urls
  const urlResult = await sql`
    SELECT id FROM shortened_urls WHERE short_code = ${shortCode}
  `

  if (urlResult.length > 0) {
    return false
  }

  // Check if short code matches any existing username to prevent conflicts
  const userResult = await sql`
    SELECT id FROM users WHERE username = ${shortCode}
  `

  return userResult.length === 0
}

// Generate alternative short code suggestion
function generateAlternativeCode(baseCode: string): string {
  const suffix = Math.floor(Math.random() * 999) + 1
  return `${baseCode}${suffix}`
}

// Create a shortened URL
export async function createShortenedUrl(
  userId: string,
  originalUrl: string,
  customCode?: string,
  title?: string,
): Promise<ShortenedUrl> {
  let shortCode = customCode

  // If custom code not provided, generate one
  if (!shortCode) {
    let attempts = 0
    do {
      shortCode = generateShortCode()
      attempts++
      if (attempts > 10) {
        throw new ShortlinkError("Unable to generate a unique code. Please try again in a moment.")
      }
    } while (!(await isShortCodeAvailable(shortCode)))
  } else {
    // Check if custom code is available
    const available = await isShortCodeAvailable(shortCode)
    if (!available) {
      // Generate alternative suggestions
      const suggestion = generateAlternativeCode(shortCode)
      if (isReservedRoute(shortCode)) {
        throw new ShortlinkError("This code is reserved. Choose a different one.", suggestion)
      }
      throw new ShortlinkError(`This code is taken. Try: ${suggestion}`, suggestion)
    }
  }

  try {
    const result = await sql`
      INSERT INTO shortened_urls (user_id, original_url, short_code, custom_code, title)
      VALUES (${userId}, ${originalUrl}, ${shortCode}, ${customCode ? true : false}, ${title || null})
      RETURNING id, user_id, original_url, short_code, custom_code, title, clicks, is_active, created_at, updated_at
    `

    return result[0] as ShortenedUrl
  } catch (error: any) {
    console.error("[v0] Database error creating shortened URL:", {
      userId,
      shortCode,
      error: error.message,
    })

    // Handle duplicate key error
    if (error.code === "23505" || error.message?.includes("duplicate")) {
      const suggestion = generateAlternativeCode(shortCode)
      throw new ShortlinkError(`This code is taken. Try: ${suggestion}`, suggestion)
    }

    throw new ShortlinkError("Unable to connect. Please try again in a moment.")
  }
}

// Get shortened URL by short code
export async function getShortenedUrlByCode(shortCode: string): Promise<ShortenedUrl | null> {
  try {
    const result = await queryWithTimeout(async () => {
      return await sql`
        SELECT * FROM shortened_urls 
        WHERE short_code = ${shortCode} AND is_active = true
      `
    })

    if (result.length === 0) {
      return null
    }

    return result[0] as ShortenedUrl
  } catch (error) {
    console.error("[v0] getShortenedUrlByCode error:", error)
    throw error
  }
}

// Get all shortened URLs for a user
export async function getUserShortenedUrls(userId: string): Promise<ShortenedUrl[]> {
  const result = await sql`
    SELECT * FROM shortened_urls 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `

  return result as ShortenedUrl[]
}

// Increment click count
export async function incrementClicks(id: string): Promise<void> {
  try {
    await queryWithTimeout(async () => {
      return await sql`
        UPDATE shortened_urls 
        SET clicks = clicks + 1, updated_at = NOW()
        WHERE id = ${id}
      `
    })
  } catch (error) {
    console.error("[v0] incrementClicks error:", error)
    // Don't throw - analytics failures shouldn't break redirects
  }
}

// Delete shortened URL
export async function deleteShortenedUrl(id: string, userId: string): Promise<void> {
  await sql`
    DELETE FROM shortened_urls 
    WHERE id = ${id} AND user_id = ${userId}
  `
}

// Track analytics (simplified wrapper - will be replaced by enterprise analytics)
export async function trackClick(
  shortenedUrlId: string,
  userAgent?: string,
  referrer?: string,
  ipAddress?: string,
): Promise<void> {
  // This is now handled in the route handler with the new analytics_events table
  console.log("[v0] trackClick called - handled in route handler")
}

export function getShortUrl(shortCode: string, username?: string, customDomain?: string, baseUrl?: string): string {
  if (customDomain) {
    return `https://${customDomain}/${shortCode}`
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"

  if (username) {
    return `https://${username}.${appDomain}/${shortCode}`
  }

  // Fallback to base domain (shouldn't be used in production)
  return `https://${appDomain}/${shortCode}`
}
