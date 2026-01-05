"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PublicProfile } from "@/lib/profile"
import { AdvancedBlockRenderer } from "@/components/advanced-block-renderer"
import { useEffect, useState } from "react"
import { isProTier } from "@/lib/subscription"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"

interface PublicProfileViewProps {
  profile: PublicProfile
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
  const { user, links } = profile
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/profile/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        })
      } catch (error) {
        console.error("Failed to track view:", error)
      }
    }

    trackView()
  }, [user.username])

  const handleLinkClick = async (linkId: string) => {
    try {
      await fetch(`/api/bio-links/${linkId}/click`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to track click:", error)
    }
  }

  const handleShareProfile = () => {
    const profileUrl = window.location.href
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (user.custom_js && isProTier(user.subscription_tier)) {
      try {
        const script = document.createElement("script")
        script.textContent = user.custom_js
        script.async = true
        document.head.appendChild(script)

        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script)
          }
        }
      } catch (error) {
        console.error("[v0] Custom JS injection error:", error)
      }
    }
  }, [user.custom_js, user.subscription_tier])

  useEffect(() => {
    if (user.custom_html && isProTier(user.subscription_tier)) {
      try {
        const container = document.createElement("div")
        container.innerHTML = user.custom_html
        container.style.position = "fixed"
        container.style.bottom = "0"
        container.style.left = "0"
        container.style.zIndex = "9999"
        container.style.pointerEvents = "none"
        container.querySelectorAll("*").forEach((el) => {
          ;(el as HTMLElement).style.pointerEvents = "auto"
        })
        document.body.appendChild(container)

        return () => {
          if (container.parentNode) {
            container.parentNode.removeChild(container)
          }
        }
      } catch (error) {
        console.error("[v0] Custom HTML injection error:", error)
      }
    }
  }, [user.custom_html, user.subscription_tier])

  const getBackgroundStyle = () => {
    const backgroundType = (user as any).background_type || "gradient"
    const backgroundValue = (user as any).background_value

    if (backgroundType === "solid" && backgroundValue) {
      return { backgroundColor: backgroundValue }
    }

    if (backgroundType === "gradient" && backgroundValue) {
      return { background: backgroundValue }
    }

    if (backgroundType === "image" && backgroundValue) {
      return {
        backgroundImage: `url(${backgroundValue})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    }

    return user.theme === "dark"
      ? { background: "linear-gradient(135deg, rgb(17 24 39), rgb(30 41 59), rgb(17 24 39))" }
      : { background: "linear-gradient(135deg, rgb(243 232 255), rgb(219 234 254), rgb(252 231 243))" }
  }

  const fontFamily = (user as any).font_family || "Inter"
  const buttonStyle = (user as any).button_style || { borderRadius: "8px", shadow: true }

  const removeWatermark = isProTier(user.subscription_tier)

  const isDark = user.theme === "dark"
  const textColorClass = isDark ? "text-white" : "text-gray-900"
  const mutedTextClass = isDark ? "text-gray-400" : "text-gray-600"
  const bgOverlayClass = isDark ? "bg-gray-900/50" : "bg-white/50"

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`} style={{ ...getBackgroundStyle(), fontFamily }}>
      <main className="container max-w-2xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar
                className={`size-20 md:size-24 border-4 ${isDark ? "border-gray-700" : "border-white"} shadow-lg`}
              >
                <AvatarImage src={user.avatar_url || user.profile_image_url || undefined} alt={user.username} />
                <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <h1 className={`text-3xl font-bold ${textColorClass}`}>{user.display_name || user.username}</h1>
              {user.bio && <p className={`${mutedTextClass} max-w-md mx-auto`}>{user.bio}</p>}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareProfile}
              className={`${isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white/80 hover:bg-white"}`}
            >
              {copied ? (
                <>
                  <Check className="size-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="size-4 mr-2" />
                  Share Profile
                </>
              )}
            </Button>
          </div>

          <div className="w-full space-y-3 pt-4">
            {links.length === 0 ? (
              <div className={`p-8 ${mutedTextClass}`}>No links yet</div>
            ) : (
              <div style={{ "--button-radius": buttonStyle.borderRadius } as any}>
                {links.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      marginBottom: "12px",
                    }}
                  >
                    <AdvancedBlockRenderer block={link as any} onLinkClick={handleLinkClick} isDark={isDark} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {!removeWatermark && (
            <div className="pt-8">
              <a
                href="/"
                className={`text-sm ${mutedTextClass} hover:${textColorClass} transition-colors inline-flex items-center gap-2`}
              >
                <span>Create your own Linkpop</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
