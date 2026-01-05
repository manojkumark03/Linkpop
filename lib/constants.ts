// Reserved routes that cannot be used as usernames or short codes
export const RESERVED_ROUTES = [
  // System routes
  "api",
  "auth",
  "admin",
  "dashboard",
  "settings",

  // Public routes
  "login",
  "signup",
  "register",
  "logout",
  "home",
  "about",
  "contact",
  "help",
  "support",
  "terms",
  "privacy",
  "pricing",

  // Analytics routes (renamed to insights to avoid ad blockers)
  "insights",
  "analytics",

  // Technical routes
  "_next",
  "static",
  "public",
  "assets",
  "favicon",
  "robots",
  "sitemap",
  "manifest",

  // Protected keywords
  "profile",
  "account",
  "user",
  "users",
  "page",
  "pages",
  "post",
  "posts",
  "blog",
  "link",
  "links",
  "url",
  "urls",
  "s", // Removed /s/ prefix

  // Common usernames to protect
  "admin",
  "root",
  "system",
  "linkpop",
  "linkpop-app",
  "support",
  "help",
  "info",
  "contact",
  "test",
  "demo",

  // HTTP methods
  "get",
  "post",
  "put",
  "patch",
  "delete",
] as const

export type ReservedRoute = (typeof RESERVED_ROUTES)[number]

export function isReservedRoute(route: string): boolean {
  return RESERVED_ROUTES.includes(route.toLowerCase() as ReservedRoute)
}

// Get subdomain from username
export function generateSubdomain(username: string): string {
  return username.toLowerCase()
}

// Parse domain to extract subdomain and check if it's a user subdomain
export function parseHostname(hostname: string): {
  isMainDomain: boolean
  isUserSubdomain: boolean
  subdomain: string | null
  baseDomain: string
} {
  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"

  console.log("[v0] Parsing hostname:", hostname, "with appDomain:", appDomain)

  // Handle localhost
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return {
      isMainDomain: true,
      isUserSubdomain: false,
      subdomain: null,
      baseDomain: hostname,
    }
  }

  // Handle Vercel preview deployments
  if (hostname.includes("vercel.app")) {
    return {
      isMainDomain: true,
      isUserSubdomain: false,
      subdomain: null,
      baseDomain: hostname,
    }
  }

  // Remove port if present (for localhost testing)
  const hostnameWithoutPort = hostname.split(":")[0]

  // Check if it's the main domain
  if (hostnameWithoutPort === appDomain) {
    return {
      isMainDomain: true,
      isUserSubdomain: false,
      subdomain: null,
      baseDomain: appDomain,
    }
  }

  // Check if it's a subdomain of the main domain
  if (hostnameWithoutPort.endsWith(`.${appDomain}`)) {
    const subdomain = hostnameWithoutPort.replace(`.${appDomain}`, "")
    return {
      isMainDomain: false,
      isUserSubdomain: true,
      subdomain,
      baseDomain: appDomain,
    }
  }

  // It's a custom domain
  return {
    isMainDomain: false,
    isUserSubdomain: false,
    subdomain: null,
    baseDomain: hostnameWithoutPort,
  }
}
