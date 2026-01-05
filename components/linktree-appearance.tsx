"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import { isProTier } from "@/lib/subscription"
import type { User } from "@/lib/types"

interface LinktreeAppearanceProps {
  user: User
  onUpdate: () => void
}

export function LinktreeAppearance({ user, onUpdate }: LinktreeAppearanceProps) {
  const isPro = isProTier(user.subscription_tier)

  const [theme, setTheme] = useState(user.theme || "default")
  const [backgroundType, setBackgroundType] = useState((user as any).background_type || "gradient")
  const [solidColor, setSolidColor] = useState("#ffffff")
  const [gradientStart, setGradientStart] = useState("#8b5cf6")
  const [gradientEnd, setGradientEnd] = useState("#3b82f6")
  const [imageUrl, setImageUrl] = useState("")
  const [fontFamily, setFontFamily] = useState((user as any).font_family || "Inter")
  const [borderRadius, setBorderRadius] = useState(
    (user as any).button_style?.borderRadius ? Number.parseInt((user as any).button_style.borderRadius) : 8,
  )
  const [buttonShadow, setButtonShadow] = useState((user as any).button_style?.shadow ?? true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      let backgroundValue = ""

      if (backgroundType === "solid") {
        backgroundValue = solidColor
      } else if (backgroundType === "gradient") {
        backgroundValue = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
      } else if (backgroundType === "image") {
        backgroundValue = imageUrl
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          background_type: backgroundType,
          background_value: backgroundValue,
          font_family: fontFamily,
          button_style: {
            borderRadius: `${borderRadius}px`,
            shadow: buttonShadow,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update appearance")
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

  const themes = [
    { value: "default", label: "Light", preview: "bg-white text-gray-900" },
    { value: "dark", label: "Dark", preview: "bg-gray-900 text-white" },
  ]

  const fonts = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway", "Playfair Display"]

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Appearance updated! Check the preview.</AlertDescription>
        </Alert>
      )}

      {!isPro && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Crown className="size-4" />
            <span>Advanced customization requires Pro subscription</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose your base color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === t.value ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`h-12 rounded ${t.preview} mb-2`} />
                <p className="text-sm font-medium">{t.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Background */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Background</CardTitle>
              <CardDescription>Customize your profile background</CardDescription>
            </div>
            {!isPro && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="size-3" />
                Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={backgroundType} onValueChange={setBackgroundType} disabled={!isPro}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="solid">Solid Color</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>

          {backgroundType === "solid" && isPro && (
            <div className="flex gap-2">
              <Input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} className="w-20" />
              <Input
                type="text"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          )}

          {backgroundType === "gradient" && isPro && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={gradientStart}
                  onChange={(e) => setGradientStart(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={gradientStart}
                  onChange={(e) => setGradientStart(e.target.value)}
                  placeholder="Start"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={gradientEnd}
                  onChange={(e) => setGradientEnd(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={gradientEnd}
                  onChange={(e) => setGradientEnd(e.target.value)}
                  placeholder="End"
                />
              </div>
            </div>
          )}

          {backgroundType === "image" && isPro && (
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/background.jpg"
            />
          )}
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>Choose your font style</CardDescription>
            </div>
            {!isPro && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="size-3" />
                Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Select value={fontFamily} onValueChange={setFontFamily} disabled={!isPro}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Buttons</CardTitle>
              <CardDescription>Customize button appearance</CardDescription>
            </div>
            {!isPro && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="size-3" />
                Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Roundness: {borderRadius}px</Label>
            <Slider
              value={[borderRadius]}
              onValueChange={(v) => setBorderRadius(v[0])}
              min={0}
              max={24}
              step={2}
              disabled={!isPro}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Shadow</Label>
            <Switch checked={buttonShadow} onCheckedChange={setButtonShadow} disabled={!isPro} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" size="lg" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
