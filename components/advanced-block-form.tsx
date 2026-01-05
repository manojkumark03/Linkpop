"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link2, FileText, ChevronDown, Copy, Share2, Crown, Minus } from "lucide-react"
import type { BlockType } from "@/lib/blocks"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

interface AdvancedBlockFormProps {
  onBlockCreated?: () => void
  isPro: boolean
}

export function AdvancedBlockForm({ onBlockCreated, isPro }: AdvancedBlockFormProps) {
  const [blockType, setBlockType] = useState<BlockType>("link")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [text, setText] = useState("")
  const [icon, setIcon] = useState("")
  const [showTitle, setShowTitle] = useState(false)

  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [textColor, setTextColor] = useState("#000000")
  const [borderRadius, setBorderRadius] = useState(8)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!isPro && blockType !== "link" && blockType !== "social" && blockType !== "divider") {
        setError("Advanced blocks require Pro subscription")
        setLoading(false)
        return
      }

      let blockData: any = {}

      switch (blockType) {
        case "page":
          blockData = { content, slug: title.toLowerCase().replace(/\s+/g, "-") }
          break
        case "accordion":
          blockData = { content }
          break
        case "copy-text":
          blockData = { text }
          break
        case "social":
          // Platform will be auto-detected
          break
        case "divider":
          blockData = { showTitle }
          break
      }

      blockData.customStyles = {
        backgroundColor,
        textColor,
        borderRadius: `${borderRadius}px`,
      }

      const response = await fetch("/api/bio-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blockType === "divider" && !showTitle ? "" : title,
          url: blockType === "link" || blockType === "social" ? url : "",
          icon,
          block_type: blockType,
          block_data: blockData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create block")
        return
      }

      setTitle("")
      setUrl("")
      setContent("")
      setText("")
      setIcon("")
      setShowTitle(false)
      setBackgroundColor("#ffffff")
      setTextColor("#000000")
      setBorderRadius(8)
      onBlockCreated?.()
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const blockTypeOptions = [
    { value: "link", label: "Link", icon: Link2, pro: false },
    { value: "social", label: "Social Link", icon: Share2, pro: false },
    { value: "divider", label: "Divider", icon: Minus, pro: false },
    { value: "page", label: "Page", icon: FileText, pro: true },
    { value: "accordion", label: "Accordion", icon: ChevronDown, pro: true },
    { value: "copy-text", label: "Copy Text", icon: Copy, pro: true },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Block</CardTitle>
        <CardDescription>Create different types of content blocks</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blockType">Block Type</Label>
                <Select value={blockType} onValueChange={(value) => setBlockType(value as BlockType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blockTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="size-4" />
                          <span>{option.label}</span>
                          {option.pro && !isPro && (
                            <Badge variant="secondary" className="ml-2 gap-1 text-xs">
                              <Crown className="size-3" />
                              Pro
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {blockType === "divider" ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTitle">Show Title</Label>
                    <Switch id="showTitle" checked={showTitle} onCheckedChange={setShowTitle} />
                  </div>

                  {showTitle && (
                    <div className="space-y-2">
                      <Label htmlFor="title">Title Text</Label>
                      <Input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Section title"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Block title"
                    required
                  />
                </div>
              )}

              {(blockType === "link" || blockType === "social") && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                  {blockType === "social" && (
                    <p className="text-xs text-muted-foreground">Platform will be auto-detected from the URL</p>
                  )}
                </div>
              )}

              {(blockType === "page" || blockType === "accordion") && (
                <div className="space-y-2">
                  <Label htmlFor="content">{blockType === "page" ? "Page Content (Markdown)" : "Hidden Content"}</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={blockType === "page" ? "# Welcome\n\nYour content here..." : "Content to expand..."}
                    rows={5}
                    required
                  />
                </div>
              )}

              {blockType === "copy-text" && (
                <div className="space-y-2">
                  <Label htmlFor="text">Text to Copy</Label>
                  <Input
                    id="text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Text that will be copied to clipboard"
                    required
                  />
                </div>
              )}

              {blockType === "link" && (
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (optional)</Label>
                  <Input
                    id="icon"
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g., Globe, Mail, Phone"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
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

              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Border Radius: {borderRadius}px</Label>
                <Slider
                  value={[borderRadius]}
                  onValueChange={(values) => setBorderRadius(values[0])}
                  min={0}
                  max={24}
                  step={1}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="p-4 text-center font-medium transition-all"
                  style={{
                    backgroundColor,
                    color: textColor,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  {title || "Block Preview"}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Block"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
