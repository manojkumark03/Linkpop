import { sql } from "./db"
import type { User, Session } from "./types"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import crypto from "crypto"

const SESSION_COOKIE_NAME = "linkpop_session"
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, username: string): Promise<User> {
  const passwordHash = await hashPassword(password)
  const subdomain = username.toLowerCase()

  const result = await sql`
    INSERT INTO users (email, password_hash, username, subdomain)
    VALUES (${email}, ${passwordHash}, ${username}, ${subdomain})
    RETURNING id, email, username, display_name, bio, avatar_url, profile_image_url, theme, created_at, updated_at
  `

  return result[0] as User
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `

  if (result.length === 0) {
    return null
  }

  const user = result[0]
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_url: user.avatar_url,
    profile_image_url: user.profile_image_url,
    theme: user.theme,
    created_at: user.created_at,
    updated_at: user.updated_at,
  } as User
}

export async function createSession(userId: string): Promise<Session> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  const result = await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    RETURNING id, user_id, token, expires_at, created_at
  `

  return result[0] as Session
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const result = await sql`
    SELECT * FROM sessions 
    WHERE token = ${token} AND expires_at > NOW()
  `

  if (result.length === 0) {
    return null
  }

  return result[0] as Session
}

export async function deleteSession(token: string): Promise<void> {
  await sql`
    DELETE FROM sessions WHERE token = ${token}
  `
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await getSessionByToken(token)

  if (!session) {
    return null
  }

  const result = await sql`
    SELECT id, email, username, display_name, bio, avatar_url, profile_image_url, theme, 
           subscription_tier, subscription_expires_at, whop_user_id, 
           custom_domain, domain_verified, custom_js, 
           background_type, background_value, font_family, button_style,
           created_at, updated_at
    FROM users WHERE id = ${session.user_id}
  `

  if (result.length === 0) {
    return null
  }

  return result[0] as User
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
