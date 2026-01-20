"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon, Copy, ExternalLink, Check } from "lucide-react"
import { CustomJsSettings } from "@/components/custom-js-settings"
import { CustomHtmlSettings } from "@/components/custom-html-settings"
import { isProTier } from "@/lib/subscription"
import type { User } from "@/lib/types"

interface LinktreeProfileSettingsProps {
  user: User
  onUpdate: () => void
}

export function LinktreeProfileSettings({ user, onUpdate }: LinktreeProfileSettingsProps) {
  const [username, setUsername] = useState(user.username)
  const [displayName, setDisplayName] = useState(user.display_name || "")
  const [bio, setBio] = useState(user.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPro = isProTier(user.subscription_tier)

  const copyProfileUrl = () => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    const profileUrl =
      user.custom_domain && user.domain_verified
        ? user.root_domain_mode === "redirect"
          ? `https://${user.custom_domain}/bio`
          : `https://${user.custom_domain}`
        : `https://${user.username}.${appDomain}`
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
        return
      }

      setSuccess(true)
      onUpdate()
    } catch (err) {
      setError("Failed to save changes")
    } finally {
      setLoading(false)
    }
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
  const profileUrl =
    user.custom_domain && user.domain_verified
      ? user.root_domain_mode === "redirect"
        ? `https://${user.custom_domain}/bio`
        : `https://${user.custom_domain}`
      : `https://${user.username}.${appDomain}`

  return (
    <div className="space-y-6">
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

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Your Linktree URL</CardTitle>
          <CardDescription>Share this link to showcase your bio links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
            <div className="flex-1 font-mono text-sm truncate">{profileUrl}</div>
            <Button size="sm" variant="ghost" onClick={copyProfileUrl} title="Copy URL">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}
              title="Open profile"
            >
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} />
              <AvatarFallback>
                <UserIcon className="size-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
              <span className="inline-flex items-center px-3 rounded-md border bg-muted text-sm text-muted-foreground whitespace-nowrap">
                .{appDomain}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your profile will be available at: {username}.{appDomain}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
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

          <Button onClick={handleSave} className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <CustomJsSettings user={user} />
      <CustomHtmlSettings user={user} />
    </div>
  )
}
