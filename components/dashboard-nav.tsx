"use client"

import { Button } from "@/components/ui/button"
import { Link2, Settings } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  user: User
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    { href: "/dashboard/bitly", label: "Shortlinks" },
    { href: "/dashboard/linktree", label: "Pages" },
    { href: "/dashboard/domains", label: "Domain" },
    { href: "/dashboard/insights", label: "Analytics" },
  ]

  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
  const profileUrl =
    user.custom_domain && user.domain_verified
      ? `https://${user.custom_domain}`
      : `https://${user.username}.${appDomain}`

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Link2 className="size-6 text-primary" />
              <h1 className="text-xl font-bold">Linkpop</h1>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname?.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                View Profile
              </a>
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/dashboard/linktree?tab=settings">
                <Settings className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
