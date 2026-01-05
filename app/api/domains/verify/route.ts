import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { verifyDomainDNS, updateDomainVerification } from "@/lib/domains"
import { addDomainToVercel, VercelAPIError } from "@/lib/vercel"
import { withRateLimit } from "@/lib/middleware"
import { isProTier } from "@/lib/subscription"

async function verifyDomainHandler(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isProTier(user.subscription_tier)) {
      return NextResponse.json({ error: "Custom domain requires Pro subscription" }, { status: 403 })
    }

    if (!user.custom_domain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 400 })
    }

    console.log("[v0] Starting domain verification for:", user.custom_domain)

    // Step 1: Verify DNS is pointing correctly
    const verification = await verifyDomainDNS(user.custom_domain)

    if (!verification.verified) {
      console.log("[v0] DNS verification failed for:", user.custom_domain)
      return NextResponse.json({
        verification,
        success: false,
      })
    }

    console.log("[v0] DNS verification successful, adding to Vercel...")

    try {
      await addDomainToVercel(user.custom_domain)
      console.log("[v0] Domain successfully added to Vercel:", user.custom_domain)
    } catch (vercelError) {
      if (vercelError instanceof VercelAPIError) {
        console.error("[v0] Vercel API error:", vercelError.message, vercelError.code)

        // If domain is already added, that's okay - continue
        if (vercelError.code === "domain_already_in_use") {
          console.log("[v0] Domain already in Vercel, proceeding...")
        } else {
          // For other Vercel errors, return them to the user
          return NextResponse.json(
            {
              verification,
              success: false,
              error: `Vercel integration failed: ${vercelError.message}`,
              vercelError: {
                code: vercelError.code,
                message: vercelError.message,
              },
            },
            { status: 500 },
          )
        }
      } else {
        // Unknown error
        throw vercelError
      }
    }

    await updateDomainVerification(user.id, true)
    console.log("[v0] Domain verification complete:", user.custom_domain)

    return NextResponse.json({
      verification,
      success: true,
      message: "Domain verified and added to deployment successfully",
    })
  } catch (error) {
    console.error("[v0] Domain verification error:", error)
    return NextResponse.json(
      {
        error: "Failed to verify domain",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

export const POST = withRateLimit(verifyDomainHandler, { max: 20 })
