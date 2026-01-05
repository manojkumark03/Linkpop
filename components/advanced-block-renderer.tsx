"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, Copy, Check, ExternalLink, FileText } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { Block } from "@/lib/blocks"
import { getSocialIcon } from "@/lib/blocks"
import { useRouter } from "next/navigation"

interface AdvancedBlockRendererProps {
  block: Block
  onLinkClick: (blockId: string) => void
  isDark?: boolean
}

export function AdvancedBlockRenderer({ block, onLinkClick, isDark = false }: AdvancedBlockRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const getIcon = (iconName: string | null) => {
    if (!iconName) return <ExternalLink className="size-5" />

    const IconComponent = (LucideIcons as any)[
      iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
    ]

    if (IconComponent) {
      return <IconComponent className="size-5" />
    }

    return <ExternalLink className="size-5" />
  }

  const handleCopyText = async () => {
    if (block.block_type === "copy-text" && block.block_data.text) {
      await navigator.clipboard.writeText(block.block_data.text)
      setCopied(true)
      onLinkClick(block.id)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const customStyles = block.block_data?.customStyles || {}
  const blockStyles = {
    backgroundColor: customStyles.backgroundColor || (isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)"),
    color: customStyles.textColor || (isDark ? "rgb(255, 255, 255)" : "rgb(17, 24, 39)"),
    borderRadius: customStyles.borderRadius || "8px",
  }

  // Regular link block
  if (block.block_type === "link") {
    return (
      <a
        href={(block as any).url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onLinkClick(block.id)}
        className="block"
      >
        <Card
          className="p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm border-0"
          style={blockStyles}
        >
          <div className="flex items-center justify-center gap-3">
            {getIcon(block.icon)}
            <span className="font-medium text-lg">{block.title}</span>
          </div>
        </Card>
      </a>
    )
  }

  // Social link block
  if (block.block_type === "social") {
    const platform = block.block_data.platform
    const iconName = getSocialIcon(platform)

    return (
      <a
        href={(block as any).url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onLinkClick(block.id)}
        className="block"
      >
        <Card
          className="p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm border-0"
          style={blockStyles}
        >
          <div className="flex items-center justify-center gap-3">
            {getIcon(iconName)}
            <span className="font-medium text-lg">{block.title}</span>
          </div>
        </Card>
      </a>
    )
  }

  // Accordion block
  if (block.block_type === "accordion") {
    return (
      <Card className="overflow-hidden backdrop-blur-sm border-0" style={blockStyles}>
        <button
          onClick={() => {
            setIsExpanded(!isExpanded)
            if (!isExpanded) onLinkClick(block.id)
          }}
          className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <span className="font-medium text-lg">{block.title}</span>
          <ChevronDown className={`size-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 text-sm opacity-80 whitespace-pre-wrap">{block.block_data.content}</div>
        )}
      </Card>
    )
  }

  // Copy text block
  if (block.block_type === "copy-text") {
    return (
      <Card
        className="p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm border-0"
        style={blockStyles}
        onClick={handleCopyText}
      >
        <div className="flex items-center justify-center gap-3">
          {copied ? <Check className="size-5 text-green-600" /> : <Copy className="size-5" />}
          <span className="font-medium text-lg">{block.title}</span>
        </div>
      </Card>
    )
  }

  if (block.block_type === "page") {
    const username =
      typeof window !== "undefined"
        ? (() => {
            const hostname = window.location.hostname
            const subdomain = hostname.split(".")[0]

            // If on subdomain (e.g., john.linkpop.space), use subdomain
            if (subdomain && subdomain !== "linkpop" && hostname.includes("linkpop.space")) {
              return subdomain
            }

            // Otherwise extract from path (e.g., linkpop.space/john)
            const pathUsername = window.location.pathname.split("/")[1]
            return pathUsername || ""
          })()
        : ""

    return (
      <button
        onClick={() => {
          onLinkClick(block.id)
          router.push(`/page/${block.block_data.slug}?bid=${block.id}&u=${username}`)
        }}
        className="block w-full"
      >
        <Card
          className="p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm border-0"
          style={blockStyles}
        >
          <div className="flex items-center justify-center gap-3">
            <FileText className="size-5" />
            <span className="font-medium text-lg">{block.title}</span>
          </div>
        </Card>
      </button>
    )
  }

  // Divider block
  if (block.block_type === "divider") {
    const showTitle = block.block_data?.showTitle || false

    if (showTitle && block.title) {
      return (
        <div className="flex items-center gap-4 my-6">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
          />
          <span className="text-sm font-medium opacity-70" style={{ color: blockStyles.color }}>
            {block.title}
          </span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
          />
        </div>
      )
    }

    return (
      <div className="my-6">
        <div className="h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
      </div>
    )
  }

  return null
}
