"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileCode, AlertTriangle, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CustomHtmlSettingsProps {
  user: {
    custom_html: string | null
    subscription_tier: string
  }
}

export function CustomHtmlSettings({ user: initialUser }: CustomHtmlSettingsProps) {
  const [customHtml, setCustomHtml] = useState(initialUser.custom_html || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isPro = initialUser.subscription_tier === "pro"

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
          custom_html: customHtml || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update custom HTML")
        return
      }

      setSuccess(true)
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="size-5" />
            <CardTitle>Custom HTML</CardTitle>
            <Badge variant="secondary" className="ml-auto gap-1">
              <Crown className="size-3" />
              Pro
            </Badge>
          </div>
          <CardDescription>Embed custom HTML into your public profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Custom HTML embedding requires a Pro subscription. Upgrade to unlock this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCode className="size-5" />
          <CardTitle>Custom HTML</CardTitle>
        </div>
        <CardDescription>Embed custom HTML into your public profile</CardDescription>
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
              <AlertDescription>Custom HTML updated successfully!</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Custom HTML will only be rendered on your public profile page. Use with
              caution and ensure your code is safe and properly tested. This feature supports embedding analytics
              pixels, tracking scripts, and other third-party HTML snippets.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="customHtml">HTML Code</Label>
            <Textarea
              id="customHtml"
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              placeholder="<!-- Your custom HTML code here -->
<div id='custom-widget'>
  <!-- Example: Analytics pixel, tracking script, etc. -->
</div>

<script>
  // Your custom JavaScript for the HTML
  console.log('Custom HTML loaded!');
</script>"
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your HTML will be rendered at the bottom of your public profile page.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Common Use Cases:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Add tracking pixels (Facebook Pixel, Google Analytics, etc.)</li>
              <li>Embed custom widgets or badges</li>
              <li>Add conversion tracking scripts</li>
              <li>Integrate third-party services with custom HTML snippets</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Custom HTML"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
