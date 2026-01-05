export type BlockType = "link" | "page" | "accordion" | "copy-text" | "social" | "divider"

export interface BaseBlock {
  id: string
  user_id: string
  block_type: BlockType
  title: string
  position: number
  is_visible: boolean
  icon: string | null
  created_at: string
  updated_at: string
}

export interface LinkBlock extends BaseBlock {
  block_type: "link"
  url: string
  block_data: {}
}

export interface PageBlock extends BaseBlock {
  block_type: "page"
  block_data: {
    content: string // Markdown content
    slug: string // URL slug for subpage
  }
}

export interface AccordionBlock extends BaseBlock {
  block_type: "accordion"
  block_data: {
    content: string // Hidden content that expands
  }
}

export interface CopyTextBlock extends BaseBlock {
  block_type: "copy-text"
  block_data: {
    text: string // Text to copy
  }
}

export interface SocialBlock extends BaseBlock {
  block_type: "social"
  url: string
  block_data: {
    platform: string // Auto-detected: twitter, instagram, github, etc.
  }
}

export interface DividerBlock extends BaseBlock {
  block_type: "divider"
  block_data: {
    showTitle: boolean // Whether to show title text
  }
}

export type Block = LinkBlock | PageBlock | AccordionBlock | CopyTextBlock | SocialBlock | DividerBlock

// Auto-detect social platform from URL
export function detectSocialPlatform(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter"
    if (hostname.includes("instagram.com")) return "instagram"
    if (hostname.includes("facebook.com")) return "facebook"
    if (hostname.includes("linkedin.com")) return "linkedin"
    if (hostname.includes("github.com")) return "github"
    if (hostname.includes("youtube.com")) return "youtube"
    if (hostname.includes("tiktok.com")) return "tiktok"
    if (hostname.includes("discord.")) return "discord"
    if (hostname.includes("twitch.tv")) return "twitch"

    return null
  } catch {
    return null
  }
}

// Get social platform icon name
export function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: "Twitter",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "Linkedin",
    github: "Github",
    youtube: "Youtube",
    tiktok: "Music",
    discord: "MessageCircle",
    twitch: "Tv",
  }

  return icons[platform] || "ExternalLink"
}
