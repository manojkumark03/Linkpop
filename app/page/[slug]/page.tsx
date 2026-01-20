import { getPublicProfile } from "@/lib/profile"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { headers } from "next/headers"
import { parseHostname } from "@/lib/constants"
import { sql } from "@/lib/db"

export default async function PageBlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ bid?: string }>
}) {
  const { slug } = await params
  const { bid } = await searchParams

  if (!bid) {
    console.log("[v0] Page block missing block ID")
    notFound()
  }

  // Get hostname to determine which domain we're on
  const headersList = await headers()
  const hostname = headersList.get("host") || ""
  const { isUserSubdomain, subdomain } = parseHostname(hostname)

  let username: string | null = null
  let rootDomainMode: string | null = null

  // Check if custom domain
  if (!isUserSubdomain && hostname && !hostname.includes("localhost") && !hostname.includes("vercel.app")) {
    const customDomainResult = await sql`
      SELECT username, root_domain_mode 
      FROM users 
      WHERE custom_domain = ${hostname} AND domain_verified = true
    `
    
    if (customDomainResult.length > 0) {
      username = customDomainResult[0].username
      rootDomainMode = customDomainResult[0].root_domain_mode
    }
  } else if (isUserSubdomain && subdomain) {
    // On subdomain
    const subdomainResult = await sql`
      SELECT username FROM users WHERE subdomain = ${subdomain}
    `
    
    if (subdomainResult.length > 0) {
      username = subdomainResult[0].username
    }
  }

  if (!username) {
    console.log("[v0] Could not determine username from hostname:", hostname)
    notFound()
  }

  const profile = await getPublicProfile(username)

  if (!profile) {
    console.log("[v0] Profile not found for username:", username)
    notFound()
  }

  const block = profile.links.find((link) => link.id === bid && link.block_type === "page")

  if (!block) {
    console.log("[v0] Page block not found:", bid)
    notFound()
  }

  const isDark = profile.user.theme === "dark"
  const backgroundStyle = isDark
    ? { background: "linear-gradient(135deg, rgb(17 24 39), rgb(30 41 59), rgb(17 24 39))" }
    : { background: "linear-gradient(135deg, rgb(243 232 255), rgb(219 234 254), rgb(252 231 243))" }

  const textColorClass = isDark ? "text-white" : "text-gray-900"
  const mutedTextClass = isDark ? "text-gray-300" : "text-gray-600"

  // Determine back URL based on root domain mode
  const backUrl = rootDomainMode === "redirect" ? "/bio" : "/"

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`} style={backgroundStyle}>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={backUrl}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Profile
          </Link>
        </Button>

        <Card className={`p-8 ${isDark ? "bg-gray-900/90 border-gray-700" : "bg-white/90"}`}>
          <h1 className={`text-3xl font-bold mb-6 ${textColorClass}`}>{block.title}</h1>
          <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none ${mutedTextClass}`}>
            <ReactMarkdown>{block.block_data.content}</ReactMarkdown>
          </div>
        </Card>
      </div>

      {block.block_data.customHtml && <div dangerouslySetInnerHTML={{ __html: block.block_data.customHtml }} />}
    </div>
  )
}