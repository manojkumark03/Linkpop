"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, AlertTriangle, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CustomJsSettingsProps {
  user: {
    custom_js: string | null
    subscription_tier: string
  }
}

export function CustomJsSettings({ user: initialUser }: CustomJsSettingsProps) {
  const [customJs, setCustomJs] = useState(initialUser.custom_js || "")
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
          custom_js: customJs || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update custom JavaScript")
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
            <Code className="size-5" />
            <CardTitle>Custom JavaScript</CardTitle>
            <Badge variant="secondary" className="ml-auto gap-1">
              <Crown className="size-3" />
              Pro
            </Badge>
          </div>
          <CardDescription>Inject custom JavaScript into your public profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Custom JavaScript injection requires a Pro subscription. Upgrade to unlock this feature.
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
          <Code className="size-5" />
          <CardTitle>Custom JavaScript</CardTitle>
        </div>
        <CardDescription>Inject custom JavaScript into your public profile</CardDescription>
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
              <AlertDescription>Custom JavaScript updated successfully!</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Custom JavaScript will only run on your public profile page. Use with
              caution and ensure your code is safe and properly tested.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="customJs">JavaScript Code</Label>
            <Textarea
              id="customJs"
              value={customJs}
              onChange={(e) => setCustomJs(e.target.value)}
              placeholder="// Your custom JavaScript code here
console.log('Hello from Linkpop!');

// Example: Add analytics tracking
// window.gtag('config', 'GA_MEASUREMENT_ID');"
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your code will be wrapped in a script tag and executed on your public profile page only.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Common Use Cases:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Add Google Analytics or other tracking scripts</li>
              <li>Integrate live chat widgets (Intercom, Drift, etc.)</li>
              <li>Add custom animations or effects</li>
              <li>Integrate third-party services</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Custom JavaScript"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
