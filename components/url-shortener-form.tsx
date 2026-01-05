"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link2, Copy, Check } from "lucide-react"

interface UrlShortenerFormProps {
  onUrlCreated?: () => void
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [originalUrl, setOriginalUrl] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username)
          const hasVerifiedDomain = data.user.custom_domain && data.user.domain_verified
          setCustomDomain(hasVerifiedDomain ? data.user.custom_domain : null)
          setUseDomainForShortlinks(data.user.use_domain_for_shortlinks ?? true)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setShortenedUrl(null)

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl, customCode: customCode || undefined, title: title || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to shorten URL")
        return
      }

      const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
      const fullUrl =
        customDomain && useDomainForShortlinks
          ? `https://${customDomain}/${data.url.short_code}`
          : `https://${username}.${appDomain}/${data.url.short_code}`

      setShortenedUrl(fullUrl)
      setOriginalUrl("")
      setCustomCode("")
      setTitle("")

      if (onUrlCreated) {
        onUrlCreated()
      }
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          Shorten URL
        </CardTitle>
        <CardDescription>Create a short link for any URL</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {shortenedUrl && (
            <Alert>
              <AlertDescription className="flex items-center justify-between gap-2">
                <div className="flex-1 truncate">
                  <strong>Short URL:</strong> {shortenedUrl}
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={copyToClipboard}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="originalUrl">Original URL*</Label>
            <Input
              id="originalUrl"
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com/very-long-url"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome link"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customCode">Custom code (optional)</Label>
            <Input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="my-awesome-link"
              pattern="[a-z0-9_-]+"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a random code. Lowercase letters, numbers, hyphens, and underscores allowed (max 50
              chars).
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Shorten URL"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
