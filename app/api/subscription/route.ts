import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getSubscriptionLimits } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limits = getSubscriptionLimits(user.subscription_tier as any)

    return NextResponse.json({
      tier: user.subscription_tier,
      expiresAt: user.subscription_expires_at,
      limits,
    })
  } catch (error) {
    console.error("[v0] Get subscription error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
