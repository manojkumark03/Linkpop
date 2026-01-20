import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    console.log(user)
    return NextResponse.json({
      user: {
        ...user,
        root_domain_mode: user.root_domain_mode || "bio",
        root_domain_redirect_url: user.root_domain_redirect_url || null,
        use_domain_for_shortlinks: user.use_domain_for_shortlinks ?? true,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
