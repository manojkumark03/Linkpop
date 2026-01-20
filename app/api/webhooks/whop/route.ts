import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { WHOP_CONFIG } from "@/lib/subscription"
import crypto from "crypto"

// Verify Whop webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret)
  const digest = hmac.update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-whop-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const payload = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, WHOP_CONFIG.webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload)

    // Handle different webhook events
    switch (event.type) {
      case "payment.succeeded":
      case "subscription.created":
      case "subscription.renewed":
        await handleSubscriptionActivated(event.data)
        break

      case "subscription.cancelled":
      case "subscription.expired":
        await handleSubscriptionDeactivated(event.data)
        break

      default:
        console.log("[v0] Unhandled Whop webhook event:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Whop webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionActivated(data: any) {
  const { user_id: whopUserId, plan_id: planId, expires_at: expiresAt } = data

  // Determine tier based on plan ID
  const tier = planId === WHOP_CONFIG.proPlanId ? "pro" : "free"
  const expiryDate = expiresAt ? new Date(expiresAt * 1000).toISOString() : null

  // Update user subscription in database
  await sql`
    UPDATE users
    SET subscription_tier = ${tier},
        subscription_expires_at = ${expiryDate},
        whop_user_id = ${whopUserId},
        updated_at = NOW()
    WHERE whop_user_id = ${whopUserId}
  `

  console.log("[v0] Subscription activated for Whop user:", whopUserId)
}

async function handleSubscriptionDeactivated(data: any) {
  const { user_id: whopUserId } = data

  // Downgrade to free tier
  await sql`
    UPDATE users
    SET subscription_tier = 'free',
        subscription_expires_at = NULL,
        updated_at = NOW()
    WHERE whop_user_id = ${whopUserId}
  `

  console.log("[v0] Subscription deactivated for Whop user:", whopUserId)
}
