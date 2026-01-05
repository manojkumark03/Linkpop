import { z } from "zod"

// Auth validation schemas
const RESERVED_USERNAMES = new Set([
  "s", // Short URL prefix
  "l", // Short URL prefix for new routing
  "admin",
  "dashboard",
  "api",
  "login",
  "signup",
  "logout",
  "auth",
  "profile",
  "settings",
  "_next",
  "static",
  "public",
  "favicon",
  "robots",
  "sitemap",
  "analytics",
  "linktree",
  "bitly",
  "shortlinks",
  "pages",
])

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .refine((username) => !RESERVED_USERNAMES.has(username.toLowerCase()), {
      message: "This username is reserved and unavailable",
    }),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// URL shortener validation
export const createUrlSchema = z.object({
  originalUrl: z.string().url("Invalid URL format"),
  customCode: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, "Custom code can only contain letters, numbers, hyphens, and underscores")
    .min(3, "Custom code must be at least 3 characters")
    .max(50, "Custom code must be at most 50 characters")
    .optional(),
  title: z.string().max(255, "Title must be at most 255 characters").optional(),
})

// Bio link validation
export const createBioLinkSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  url: z.string().url("Invalid URL format").or(z.literal("")), // URL optional for some block types
  icon: z.string().max(50).optional(),
  block_type: z.enum(["link", "page", "accordion", "copy-text", "social", "divider"]).default("link"),
  block_data: z.any().optional(),
})

export const updateBioLinkSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  url: z.string().url().or(z.literal("")).optional(),
  icon: z.string().max(50).optional(),
  is_visible: z.boolean().optional(),
  block_data: z.any().optional(),
})

export const reorderBioLinksSchema = z.object({
  linkIds: z.array(z.string().uuid()),
})

// Profile validation
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .refine((username) => !RESERVED_USERNAMES.has(username.toLowerCase()), {
      message: "This username is reserved and unavailable",
    })
    .optional(),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  profile_image_url: z.string().url().optional().or(z.literal("")),
  theme: z.enum(["default", "dark", "light"]).optional(),
  background_type: z.enum(["solid", "gradient", "image"]).optional(),
  background_value: z.string().max(500).optional(),
  font_family: z.string().max(100).optional(),
  button_style: z.any().optional(),
  custom_js: z.string().max(10000).optional(),
  custom_html: z.string().max(10000).optional(),
  custom_domain: z.string().max(255).optional(),
  use_domain_for_shortlinks: z.boolean().optional(),
  root_domain_mode: z.enum(["bio", "redirect"]).optional(),
  root_domain_redirect_url: z
    .string()
    .max(2000)
    .refine(
      (url) => {
        if (!url || url.trim() === "") return true // Allow empty string
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      { message: "Invalid URL format" }
    )
    .optional(),
})
