"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GripVertical, Pencil, Trash2, Eye, EyeOff, ExternalLink, Palette } from "lucide-react"
import type { BioLink } from "@/lib/types"

interface BioLinkListProps {
  refreshTrigger?: number
  onUpdate?: () => void
}

export function BioLinkList({ refreshTrigger, onUpdate }: BioLinkListProps) {
  const [links, setLinks] = useState<BioLink[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLink, setEditingLink] = useState<BioLink | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editText, setEditText] = useState("")
  const [customHtml, setCustomHtml] = useState("")
  const [customBgColor, setCustomBgColor] = useState("")
  const [customTextColor, setCustomTextColor] = useState("")
  const [customBorderRadius, setCustomBorderRadius] = useState("")

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/bio-links")
      const data = await response.json()

      if (response.ok) {
        setLinks(data.links)
      }
    } catch (error) {
      console.error("Failed to fetch bio links:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return
    }

    try {
      const response = await fetch(`/api/bio-links/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLinks(links.filter((link) => link.id !== id))
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to delete link:", error)
    }
  }

  const handleToggleVisibility = async (link: BioLink) => {
    try {
      const response = await fetch(`/api/bio-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !link.is_visible }),
      })

      if (response.ok) {
        setLinks(links.map((l) => (l.id === link.id ? { ...l, is_visible: !l.is_visible } : l)))
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error)
    }
  }

  const handleEdit = (link: BioLink) => {
    setEditingLink(link)
    setEditTitle(link.title)
    setEditUrl(link.url)
    setEditIcon(link.icon || "")

    if (link.block_type === "page" || link.block_type === "accordion") {
      setEditContent(link.block_data?.content || "")
      setCustomHtml(link.block_data?.customHtml || "")
    }
    if (link.block_type === "copy-text") {
      setEditText(link.block_data?.text || "")
    }

    const customStyles = link.block_data?.customStyles || {}
    setCustomBgColor(customStyles.backgroundColor || "")
    setCustomTextColor(customStyles.textColor || "")
    setCustomBorderRadius(customStyles.borderRadius || "")
  }

  const handleSaveEdit = async () => {
    if (!editingLink) return

    try {
      let blockData = editingLink.block_data || {}

      if (editingLink.block_type === "page") {
        blockData = {
          content: editContent,
          slug: editTitle.toLowerCase().replace(/\s+/g, "-"),
          customHtml: customHtml || undefined,
        }
      } else if (editingLink.block_type === "accordion") {
        blockData = { content: editContent }
      } else if (editingLink.block_type === "copy-text") {
        blockData = { text: editText }
      }

      const customStyles: any = {}
      if (customBgColor) customStyles.backgroundColor = customBgColor
      if (customTextColor) customStyles.textColor = customTextColor
      if (customBorderRadius) customStyles.borderRadius = customBorderRadius

      if (Object.keys(customStyles).length > 0) {
        blockData = { ...blockData, customStyles }
      }

      const response = await fetch(`/api/bio-links/${editingLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          url: editUrl,
          icon: editIcon || undefined,
          block_data: blockData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLinks(links.map((l) => (l.id === editingLink.id ? data.link : l)))
        setEditingLink(null)
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to update link:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/html"))

    if (dragIndex === dropIndex) return

    const newLinks = [...links]
    const [draggedItem] = newLinks.splice(dragIndex, 1)
    newLinks.splice(dropIndex, 0, draggedItem)

    setLinks(newLinks)

    try {
      await fetch("/api/bio-links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkIds: newLinks.map((l) => l.id) }),
      })
      onUpdate?.()
    } catch (error) {
      console.error("Failed to reorder links:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading links...</p>
        </CardContent>
      </Card>
    )
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No bio links yet. Add your first one above!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Bio Links</CardTitle>
          <CardDescription>Drag to reorder, click to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div
                key={link.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center gap-3 rounded-lg border p-4 bg-background hover:bg-accent/50 transition-colors cursor-move"
              >
                <GripVertical className="size-5 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{link.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {link.block_type === "page"
                      ? `📄 Page: ${link.block_data?.slug || "untitled"}`
                      : link.block_type === "accordion"
                        ? "▼ Accordion"
                        : link.block_type === "copy-text"
                          ? `📋 Copy: ${link.block_data?.text || ""}`
                          : link.url}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleToggleVisibility(link)}
                    title={link.is_visible ? "Hide link" : "Show link"}
                  >
                    {link.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                  {(link.block_type === "link" || link.block_type === "social") && (
                    <Button size="icon-sm" variant="ghost" asChild title="Open link">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(link)} title="Edit link">
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(link.id)} title="Delete link">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editingLink !== null} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingLink?.block_type === "page"
                ? "Page"
                : editingLink?.block_type === "accordion"
                  ? "Accordion"
                  : editingLink?.block_type === "copy-text"
                    ? "Copy Text"
                    : editingLink?.block_type === "social"
                      ? "Social Link"
                      : "Link"}
            </DialogTitle>
            <DialogDescription>Update your block details and customize its appearance</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">
                <Palette className="size-4 mr-2" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="My Website"
                />
              </div>

              {(editingLink?.block_type === "link" || editingLink?.block_type === "social") && (
                <div className="space-y-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {editingLink?.block_type === "link" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">Icon</Label>
                  <Input
                    id="edit-icon"
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder="globe"
                  />
                </div>
              )}

              {(editingLink?.block_type === "page" || editingLink?.block_type === "accordion") && (
                <div className="space-y-2">
                  <Label htmlFor="edit-content">
                    {editingLink?.block_type === "page" ? "Page Content (Markdown)" : "Hidden Content"}
                  </Label>
                  <Textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder={
                      editingLink?.block_type === "page" ? "# Welcome\n\nYour content here..." : "Content to expand..."
                    }
                    rows={8}
                  />
                </div>
              )}

              {editingLink?.block_type === "page" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-custom-html">Custom HTML / Analytics Scripts</Label>
                  <Textarea
                    id="edit-custom-html"
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    placeholder={`<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add custom HTML scripts like Google Analytics, Facebook Pixel, or other tracking codes. These will
                    be injected into your page.
                  </p>
                </div>
              )}

              {editingLink?.block_type === "copy-text" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-text">Text to Copy</Label>
                  <Input
                    id="edit-text"
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Text that will be copied to clipboard"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="custom-bg">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customBgColor || "#ffffff"}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    id="custom-bg"
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    placeholder="#ffffff or transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Leave empty to use default theme colors</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-text">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customTextColor || "#000000"}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    id="custom-text"
                    type="text"
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Customize the text color for this block</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-radius">Border Radius</Label>
                <Input
                  id="custom-radius"
                  type="text"
                  value={customBorderRadius}
                  onChange={(e) => setCustomBorderRadius(e.target.value)}
                  placeholder="8px, 20px, 50% (pill shape)"
                />
                <p className="text-xs text-muted-foreground">Control the roundness of this block</p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div
                  className="p-4 rounded-lg text-center font-medium"
                  style={{
                    backgroundColor: customBgColor || "#ffffff",
                    color: customTextColor || "#000000",
                    borderRadius: customBorderRadius || "8px",
                  }}
                >
                  {editTitle || "Block Preview"}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setEditingLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
