"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, ExternalLink } from "lucide-react"
import { CustomDomainSettings } from "@/components/custom-domain-settings"
import { CustomJsSettings } from "@/components/custom-js-settings"
import { AppearanceSettings } from "@/components/appearance-settings"

interface ProfileSettingsProps {
  user: {
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    theme: string
    custom_domain: string | null
    domain_verified: boolean
    custom_js: string | null
    background_type: string
    background_value: string | null
    font_family: string
    button_style: any
    subscription_tier: string
  }
  onUpdate?: () => void
}

export function ProfileSettings({ user: initialUser, onUpdate }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(initialUser.display_name || "")
  const [bio, setBio] = useState(initialUser.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatar_url || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${initialUser.username}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || undefined,
          bio: bio || undefined,
          avatar_url: avatarUrl || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
        return
      }

      setSuccess(true)
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(profileUrl)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your basic profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={initialUser.username} disabled />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-url">Your Profile URL</Label>
              <div className="flex gap-2">
                <Input id="profile-url" type="text" value={profileUrl} readOnly />
                <Button type="button" variant="outline" onClick={copyProfileUrl}>
                  Copy
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={`/${initialUser.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AppearanceSettings user={initialUser} />

      <CustomDomainSettings user={initialUser} />

      <CustomJsSettings user={initialUser} />
    </div>
  )
}
