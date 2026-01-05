"use client"

import { useState } from "react"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { UrlList } from "@/components/url-list"
import type { User } from "@/lib/types"

interface BitlyDashboardProps {
  user: User
}

export function BitlyDashboard({ user }: BitlyDashboardProps) {
  const [refreshUrlsTrigger, setRefreshUrlsTrigger] = useState(0)

  const handleUrlCreated = () => {
    setRefreshUrlsTrigger((prev) => prev + 1)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Short Links</h2>
        <p className="text-muted-foreground mt-2">Create short, trackable links</p>
      </div>

      <UrlShortenerForm onUrlCreated={handleUrlCreated} />
      <UrlList refreshTrigger={refreshUrlsTrigger} />
    </div>
  )
}
