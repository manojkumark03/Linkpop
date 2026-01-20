"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Settings, Palette, Link2, Plus, ExternalLink } from "lucide-react"
import { BioLinkList } from "@/components/bio-link-list"
import { AdvancedBlockForm } from "@/components/advanced-block-form"
import { LinktreePreview } from "@/components/linktree-preview"
import { LinktreeAppearance } from "@/components/linktree-appearance"
import { LinktreeProfileSettings } from "@/components/linktree-profile-settings"
import type { User } from "@/lib/types"
import { isProTier } from "@/lib/subscription"

interface LinktreeEditorProps {
  user: User
}

export function LinktreeEditor({ user: initialUser }: LinktreeEditorProps) {
  const [user, setUser] = useState(initialUser)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [activeTab, setActiveTab] = useState("links")
  const isPro = isProTier(user.subscription_tier)

  const handleUpdate = () => {
    setRefreshTrigger((prev) => prev + 1)
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
  const hasVerifiedCustomDomain = user.custom_domain && user.domain_verified
  const profileUrl = hasVerifiedCustomDomain
    ? user.root_domain_mode === "redirect"
      ? `https://${user.custom_domain}/bio`
      : `https://${user.custom_domain}`
    : `https://${user.username}.${appDomain}`

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">My Linktree</h1>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Your URL:</span>
              <code className="px-2 py-1 bg-muted rounded text-xs">{profileUrl}</code>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}
              title="Open profile"
            >
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="border-r bg-background overflow-y-auto">
            <div className="container max-w-2xl mx-auto p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="links" className="gap-2">
                    <Link2 className="size-4" />
                    Links
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="gap-2">
                    <Palette className="size-4" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="size-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="links" className="space-y-4">
                  {!showAddBlock ? (
                    <Button onClick={() => setShowAddBlock(true)} className="w-full" size="lg">
                      <Plus className="size-4 mr-2" />
                      Add Block
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Add New Block</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddBlock(false)}>
                          Cancel
                        </Button>
                      </div>
                      <AdvancedBlockForm
                        onBlockCreated={() => {
                          handleUpdate()
                          setShowAddBlock(false)
                        }}
                        isPro={isPro}
                      />
                    </div>
                  )}

                  <div className="pt-4">
                    <BioLinkList refreshTrigger={refreshTrigger} onUpdate={handleUpdate} />
                  </div>
                </TabsContent>

                <TabsContent value="appearance">
                  <LinktreeAppearance user={user} onUpdate={handleUpdate} />
                </TabsContent>

                <TabsContent value="settings">
                  <LinktreeProfileSettings user={user} onUpdate={handleUpdate} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="hidden lg:block bg-muted/30 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center gap-2">
              <Eye className="size-4" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            <div className="p-8 flex items-center justify-center min-h-[calc(100vh-57px)]">
              <div className="w-full max-w-md">
                <LinktreePreview username={user.username} refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
