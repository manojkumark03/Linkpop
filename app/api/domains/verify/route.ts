import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import {
  verifyDomainDNS,
  updateDomainVerification,
  updateDomainDeploymentStatus,
  checkDomainActive,
} from "@/lib/domains"
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

    // Update status to dns_verified
    await updateDomainVerification(user.id, true)

    try {
      await updateDomainDeploymentStatus(user.id, "deploying")
      await addDomainToVercel(user.custom_domain)
      console.log("[v0] Domain successfully added to Vercel:", user.custom_domain)

      // Start background check for domain activation (don't wait for it)
      checkDomainActivation(user.id, user.custom_domain).catch((err) => {
        console.error("[v0] Background domain check error:", err)
      })
    } catch (vercelError) {
      if (vercelError instanceof VercelAPIError) {
        console.error("[v0] Vercel API error:", vercelError.message, vercelError.code)

        // If domain is already added, that's okay - continue
        if (vercelError.code === "domain_already_in_use") {
          console.log("[v0] Domain already in Vercel, checking activation...")
          // Start background check
          checkDomainActivation(user.id, user.custom_domain).catch((err) => {
            console.error("[v0] Background domain check error:", err)
          })
        } else {
          // For other Vercel errors, return them to the user
          await updateDomainDeploymentStatus(user.id, "failed")
          return NextResponse.json(
            {
              verification,
              success: false,
              error: `Vercel integration failed: ${vercelError.message}`,
              vercelError: {
                code: vercelError.code,
                message: vercelError.message,
              },
              deploymentStatus: "failed",
            },
            { status: 500 },
          )
        }
      } else {
        // Unknown error
        await updateDomainDeploymentStatus(user.id, "failed")
        throw vercelError
      }
    }

    console.log("[v0] Domain verification complete:", user.custom_domain)

    return NextResponse.json({
      verification,
      success: true,
      message:
        "Domain verified! Deployment in progress. This may take 10-40 minutes (occasionally up to 48 hours) to fully activate.",
      deploymentStatus: "deploying",
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

// Background function to check domain activation
async function checkDomainActivation(userId: string, domain: string): Promise<void> {
  console.log("[v0] Starting background domain activation check for:", domain)

  // Check every 30 seconds for up to 10 minutes
  const maxAttempts = 20 // 20 * 30s = 10 minutes
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts++
    await new Promise((resolve) => setTimeout(resolve, 30000)) // Wait 30 seconds

    try {
      const isActive = await checkDomainActive(domain)

      if (isActive) {
        console.log("[v0] Domain is now active:", domain)
        await updateDomainDeploymentStatus(userId, "active")
        return
      }

      console.log(`[v0] Domain not active yet (attempt ${attempts}/${maxAttempts}):`, domain)
    } catch (error) {
      console.error("[v0] Error checking domain activation:", error)
    }
  }

  console.log("[v0] Domain activation check timed out after 10 minutes:", domain)
  // Keep status as 'deploying' - it may still activate later
}

export const POST = withRateLimit(verifyDomainHandler, { max: 20 })
