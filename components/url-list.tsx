"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Trash2, Check, Pencil, BarChart3, Search } from "lucide-react"
import type { ShortenedUrl } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UrlListProps {
  refreshTrigger?: number
}

export function UrlList({ refreshTrigger }: UrlListProps) {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [filteredUrls, setFilteredUrls] = useState<ShortenedUrl[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState(true)
  const [editingUrl, setEditingUrl] = useState<ShortenedUrl | null>(null)
  const [editForm, setEditForm] = useState({ title: "", shortCode: "", originalUrl: "" })
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username)
          setCustomDomain(data.user.custom_domain && data.user.domain_verified ? data.user.custom_domain : null)
          setUseDomainForShortlinks(data.user.custom_domain && data.user.domain_verified)
        }
      })
      .catch(console.error)

    fetchUrls()
  }, [refreshTrigger])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUrls(urls)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = urls.filter(
        (url) =>
          url.short_code.toLowerCase().includes(query) ||
          url.title?.toLowerCase().includes(query) ||
          url.original_url.toLowerCase().includes(query),
      )
      setFilteredUrls(filtered)
    }
  }, [searchQuery, urls])

  const fetchUrls = async () => {
    try {
      const response = await fetch("/api/urls")
      const data = await response.json()

      if (response.ok) {
        setUrls(data.urls)
      }
    } catch (error) {
      console.error("Failed to fetch URLs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (url: ShortenedUrl) => {
    setEditingUrl(url)
    setEditForm({
      title: url.title || "",
      shortCode: url.short_code,
      originalUrl: url.original_url,
    })
    setEditError("")
  }

  const handleSaveEdit = async () => {
    if (!editingUrl) return

    setEditError("")
    setEditLoading(true)

    try {
      const response = await fetch(`/api/urls/${editingUrl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title || undefined,
          shortCode: editForm.shortCode !== editingUrl.short_code ? editForm.shortCode : undefined,
          originalUrl: editForm.originalUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || "Failed to update URL")
        setEditLoading(false)
        return
      }

      setUrls(urls.map((url) => (url.id === editingUrl.id ? data.url : url)))
      setEditingUrl(null)
    } catch (error) {
      setEditError("Failed to connect to server")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this URL?")) {
      return
    }

    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUrls(urls.filter((url) => url.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete URL:", error)
    }
  }

  const copyToClipboard = (shortCode: string, id: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    const fullUrl = customDomain
      ? `https://${customDomain}/${shortCode}`
      : `https://${username}.${appDomain}/${shortCode}`

    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getDisplayUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    return customDomain ? `${customDomain}/${shortCode}` : `${username}.${appDomain}/${shortCode}`
  }

  const getFullUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    return customDomain ? `https://${customDomain}/${shortCode}` : `https://${username}.${appDomain}/${shortCode}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading URLs...</p>
        </CardContent>
      </Card>
    )
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No shortened URLs yet. Create your first one above!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your URLs</CardTitle>
          <CardDescription>Manage your shortened links</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by slug, title, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Original URL</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUrls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No shortlinks found matching "{searchQuery}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUrls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={getFullUrl(url.short_code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            /{url.short_code}
                          </a>
                          {url.custom_code && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{getDisplayUrl(url.short_code)}</p>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2">{url.title || "Untitled"}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline line-clamp-2 max-w-xs"
                        >
                          {url.original_url}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{url.clicks}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild title="View analytics">
                            <Link href={`/dashboard/insights?shortlink=${url.id}`}>
                              <BarChart3 className="size-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(url)} title="Edit URL">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(url.short_code, url.id)}
                            title="Copy short URL"
                          >
                            {copiedId === url.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" asChild title="Open short URL">
                            <a href={getFullUrl(url.short_code)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(url.id)} title="Delete URL">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUrls.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredUrls.length} of {urls.length} shortlink{urls.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUrl} onOpenChange={(open) => !open && setEditingUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Short Link</DialogTitle>
            <DialogDescription>Update your short link details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="My awesome link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-shortcode">Short Code</Label>
              <Input
                id="edit-shortcode"
                value={editForm.shortCode}
                onChange={(e) =>
                  setEditForm({ ...editForm, shortCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })
                }
                placeholder="my-link"
                pattern="[a-z0-9_-]+"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens, and underscores only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-original">Original URL</Label>
              <Input
                id="edit-original"
                type="url"
                value={editForm.originalUrl}
                onChange={(e) => setEditForm({ ...editForm, originalUrl: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUrl(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
