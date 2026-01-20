import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth"
import { loginSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"

async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json()

    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email, password } = result.data

    // Authenticate user
    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const session = await createSession(user.id)

    // Set session cookie
    await setSessionCookie(session.token)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 })
  }
}

export const POST = withRateLimit(loginHandler, { max: 30 })
