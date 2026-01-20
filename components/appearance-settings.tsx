"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Palette, Crown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

interface AppearanceSettingsProps {
  user: {
    theme: string
    background_type: string
    background_value: string | null
    font_family: string
    button_style: any
    subscription_tier: string
  }
}

export function AppearanceSettings({ user: initialUser }: AppearanceSettingsProps) {
  const [theme, setTheme] = useState(initialUser.theme || "default")
  const [backgroundType, setBackgroundType] = useState(initialUser.background_type || "gradient")
  const [backgroundColor, setBackgroundColor] = useState(
    initialUser.background_type === "solid" ? initialUser.background_value || "#ffffff" : "#ffffff",
  )
  const [gradientStart, setGradientStart] = useState("#8b5cf6")
  const [gradientEnd, setGradientEnd] = useState("#3b82f6")
  const [backgroundImage, setBackgroundImage] = useState(
    initialUser.background_type === "image" ? initialUser.background_value || "" : "",
  )
  const [fontFamily, setFontFamily] = useState(initialUser.font_family || "Inter")
  const [borderRadius, setBorderRadius] = useState(
    initialUser.button_style?.borderRadius ? Number.parseInt(initialUser.button_style.borderRadius) : 8,
  )
  const [buttonShadow, setButtonShadow] = useState(initialUser.button_style?.shadow ?? true)
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
      let backgroundValue = ""

      switch (backgroundType) {
        case "solid":
          backgroundValue = backgroundColor
          break
        case "gradient":
          backgroundValue = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
          break
        case "image":
          backgroundValue = backgroundImage
          break
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
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const fontOptions = [
    { value: "Inter", label: "Inter (Default)" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Poppins", label: "Poppins" },
    { value: "Raleway", label: "Raleway" },
    { value: "Playfair Display", label: "Playfair Display" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="size-5" />
          <CardTitle>Appearance</CardTitle>
          {!isPro && (
            <Badge variant="secondary" className="ml-auto gap-1">
              <Crown className="size-3" />
              Some features require Pro
            </Badge>
          )}
        </div>
        <CardDescription>Customize the look and feel of your profile</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Appearance updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Background</Label>

            <div className="space-y-2">
              <Select value={backgroundType} onValueChange={setBackgroundType} disabled={!isPro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="image">Image URL</SelectItem>
                </SelectContent>
              </Select>
              {!isPro && <p className="text-xs text-muted-foreground">Custom backgrounds require Pro subscription</p>}
            </div>

            {backgroundType === "solid" && isPro && (
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            )}

            {backgroundType === "gradient" && isPro && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="gradientStart">Gradient Start</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gradientStart"
                      type="color"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradientEnd">Gradient End</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gradientEnd"
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
            )}

            {backgroundType === "image" && isPro && (
              <div className="space-y-2">
                <Label htmlFor="backgroundImage">Image URL</Label>
                <Input
                  id="backgroundImage"
                  type="url"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="https://example.com/background.jpg"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily} disabled={!isPro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isPro && <p className="text-xs text-muted-foreground">Custom fonts require Pro subscription</p>}
          </div>

          <div className="space-y-4">
            <Label>Button Style</Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="borderRadius">Border Radius: {borderRadius}px</Label>
                </div>
                <Slider
                  id="borderRadius"
                  value={[borderRadius]}
                  onValueChange={(values) => setBorderRadius(values[0])}
                  min={0}
                  max={24}
                  step={1}
                  disabled={!isPro}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="buttonShadow">Drop Shadow</Label>
                <Switch id="buttonShadow" checked={buttonShadow} onCheckedChange={setButtonShadow} disabled={!isPro} />
              </div>
            </div>

            {!isPro && <p className="text-xs text-muted-foreground">Button customization requires Pro subscription</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Appearance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
