"use client"

import { useState, useEffect } from "react"
import { PublicProfileView } from "@/components/public-profile-view"
import type { PublicProfile } from "@/lib/profile"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface LinktreePreviewProps {
  username: string
  refreshTrigger?: number
}

export function LinktreePreview({ username, refreshTrigger }: LinktreePreviewProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualRefreshKey, setManualRefreshKey] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${username}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username, refreshTrigger, manualRefreshKey])

  const handleManualRefresh = () => {
    setLoading(true)
    setManualRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>Failed to load preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualRefresh}
        disabled={loading}
        className="w-full bg-transparent"
      >
        <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh Preview
      </Button>

      <div className="bg-background rounded-xl shadow-2xl overflow-hidden border-8 border-gray-900 aspect-[9/16] relative">
        <div className="absolute inset-0 overflow-y-auto">
          <PublicProfileView profile={profile} />
        </div>
      </div>
    </div>
  )
}
