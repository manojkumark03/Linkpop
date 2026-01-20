export interface User {
  id: string
  email: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  profile_image_url: string | null
  theme: string
  subscription_tier: "free" | "pro"
  subscription_expires_at: string | null
  whop_user_id: string | null
  custom_domain: string | null
  domain_verified: boolean
  use_domain_for_shortlinks: boolean
  root_domain_mode: "bio" | "redirect"
  root_domain_redirect_url: string | null
  custom_js: string | null
  custom_html: string | null
  background_type: string
  background_value: string | null
  font_family: string
  button_style: any
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface BioLink {
  id: string
  user_id: string
  title: string
  url: string
  icon: string | null
  position: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface ShortenedUrl {
  id: string
  user_id: string
  original_url: string
  short_code: string
  custom_code: boolean
  title: string | null
  clicks: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Analytics {
  id: string
  shortened_url_id: string | null
  bio_link_id: string | null
  user_agent: string | null
  referrer: string | null
  ip_address: string | null
  country: string | null
  city: string | null
  clicked_at: string
}
