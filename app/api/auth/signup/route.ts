import { type NextRequest, NextResponse } from "next/server"
import { createUser, createSession, setSessionCookie } from "@/lib/auth"
import { sql } from "@/lib/db"
import { signupSchema } from "@/lib/validation"
import { withRateLimit } from "@/lib/middleware"

async function signupHandler(request: NextRequest) {
  try {
    const body = await request.json()

    const result = signupSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email, password, username } = result.data

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 })
    }

    const existingShortCode = await sql`
      SELECT id FROM shortened_urls WHERE short_code = ${username}
    `

    if (existingShortCode.length > 0) {
      return NextResponse.json(
        { error: "This username is unavailable (conflicts with existing short URL)" },
        { status: 400 },
      )
    }

    // Create user
    const user = await createUser(email, password, username)

    // Create session
    const session = await createSession(user.id)

    // Set session cookie
    await setSessionCookie(session.token)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

export const POST = withRateLimit(signupHandler, { max: 20 })
