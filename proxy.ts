import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { parseHostname, isReservedRoute } from "@/lib/constants"

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname } = request.nextUrl

  console.log("[v0] Middleware - hostname:", hostname, "pathname:", pathname)

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot|map)$/)
  ) {
    return NextResponse.next()
  }

  const { isMainDomain, isUserSubdomain, subdomain } = parseHostname(hostname)

  console.log("[v0] Parsed hostname:", { isMainDomain, isUserSubdomain, subdomain })

  const pathSegments = pathname.split("/").filter(Boolean)
  const firstSegment = pathSegments[0] || ""

  // ===========================================
  // ===========================================
  if (isUserSubdomain && subdomain) {
    console.log("[v0] Subdomain routing for:", subdomain, "pathname:", pathname)

    try {
      const userResult = await sql`
        SELECT id, username FROM users WHERE subdomain = ${subdomain}
      `

      if (userResult.length === 0) {
        console.log("[v0] Subdomain not found in database:", subdomain)
        return new NextResponse("Profile not found", { status: 404 })
      }

      const username = userResult[0].username
      console.log("[v0] Found user for subdomain:", { subdomain, username })

      if (pathname.startsWith("/page/") && pathSegments.length === 2) {
        console.log("[v0] Page block route on subdomain, allowing through")
        return NextResponse.next()
      }

      if (pathname === "/") {
        console.log("[v0] Rewriting subdomain root to profile:", username)
        const newUrl = new URL(`/${username}`, request.url)
        return NextResponse.rewrite(newUrl)
      }

      if (pathname === "/bio") {
        const newUrl = new URL(`/${username}`, request.url)
        return NextResponse.rewrite(newUrl)
      }

      if (pathSegments.length === 1 && !isReservedRoute(firstSegment)) {
        const slug = pathSegments[0]
        console.log("[v0] Short code on subdomain, rewriting to /l/", slug)
        const newUrl = new URL(`/l/${slug}`, request.url)
        newUrl.searchParams.set("subdomain", subdomain)
        return NextResponse.rewrite(newUrl)
      }

      // Let Next.js handle other paths
      return NextResponse.next()
    } catch (error) {
      console.error("[v0] Database error in subdomain routing:", error)
      return new NextResponse("Internal Server Error", { status: 500 })
    }
  }

  // ===========================================
  // ===========================================
  if (isMainDomain) {
    console.log("[v0] Main domain routing for:", pathname)

    // Homepage and reserved routes
    if (pathname === "/" || isReservedRoute(firstSegment)) {
      console.log("[v0] Homepage or reserved route, passing through")
      return NextResponse.next()
    }

    // Shortlinks should use username.linkpop.space/slug format
    if (pathSegments.length === 1) {
      const usernameOrSlug = pathSegments[0]
      console.log("[v0] Main domain single segment, treating as username profile:", usernameOrSlug)
      // Let Next.js handle it as a profile route
      return NextResponse.next()
    }

    // Multi-segment paths - let Next.js handle them
    return NextResponse.next()
  }

  // ===========================================
  // ===========================================
  console.log("[v0] Checking for custom domain:", hostname)
  try {
    const domainResult = await sql`
      SELECT u.id, u.username, u.root_domain_mode, u.root_domain_redirect_url
      FROM users u
      WHERE u.custom_domain = ${hostname} AND u.domain_verified = true
    `

    if (domainResult.length > 0) {
      const { username, root_domain_mode, root_domain_redirect_url } = domainResult[0]
      console.log("[v0] Custom domain routing for:", hostname, "user:", username)

      if (pathname.startsWith("/page/") && pathSegments.length === 2) {
        console.log("[v0] Page block route on custom domain, allowing through")
        return NextResponse.next()
      }

      if (pathname === "/") {
        if (root_domain_mode === "redirect" && root_domain_redirect_url) {
          console.log("[v0] Redirecting custom domain root to:", root_domain_redirect_url)
          return NextResponse.redirect(root_domain_redirect_url)
        }
        // Default to bio page
        const newUrl = new URL(`/${username}`, request.url)
        newUrl.searchParams.set("customDomain", hostname)
        return NextResponse.rewrite(newUrl)
      }

      if (pathname === "/bio") {
        const newUrl = new URL(`/${username}`, request.url)
        newUrl.searchParams.set("customDomain", hostname)
        return NextResponse.rewrite(newUrl)
      }

      if (pathSegments.length === 1 && !isReservedRoute(firstSegment)) {
        const slug = pathSegments[0]
        const newUrl = new URL(`/l/${slug}`, request.url)
        newUrl.searchParams.set("customDomain", hostname)
        return NextResponse.rewrite(newUrl)
      }

      return NextResponse.next()
    }
  } catch (error) {
    console.error("[v0] Database error in custom domain routing:", error)
  }

  // Unknown domain - 404
  console.log("[v0] Unknown domain or path, returning 404:", hostname, pathname)
  return new NextResponse("Not Found", { status: 404 })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)"],
}
