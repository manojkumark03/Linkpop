import { sql } from "./db"
import type { BioLink } from "./types"

export interface PublicProfile {
  user: {
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    profile_image_url: string | null
    theme: string
    custom_js: string | null
    custom_html: string | null
    subscription_tier: string
    background_type?: string
    background_value?: string | null
    font_family?: string
    button_style?: any
    root_domain_mode?: "bio" | "redirect"
    root_domain_redirect_url?: string | null
  }
  links: BioLink[]
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const userResult = await sql`
    SELECT username, display_name, bio, avatar_url, profile_image_url, theme, custom_js, custom_html, subscription_tier,
           background_type, background_value, font_family, button_style, root_domain_mode, root_domain_redirect_url
    FROM users
    WHERE username = ${username}
  `

  if (userResult.length === 0) {
    return null
  }

  const user = userResult[0]

  const linksResult = await sql`
    SELECT bl.id, bl.user_id, bl.title, bl.url, bl.icon, bl.position, bl.is_visible, bl.block_type, bl.block_data, bl.created_at, bl.updated_at
    FROM bio_links bl
    INNER JOIN users u ON bl.user_id = u.id
    WHERE u.username = ${username} AND bl.is_visible = true
    ORDER BY bl.position ASC
  `

  return {
    user: {
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      profile_image_url: user.profile_image_url,
      theme: user.theme,
      custom_js: user.custom_js,
      custom_html: user.custom_html,
      subscription_tier: user.subscription_tier,
      background_type: user.background_type,
      background_value: user.background_value,
      font_family: user.font_family,
      button_style: user.button_style,
      root_domain_mode: user.root_domain_mode,
      root_domain_redirect_url: user.root_domain_redirect_url,
    },
    links: linksResult as BioLink[],
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    username?: string
    display_name?: string
    bio?: string
    avatar_url?: string
    profile_image_url?: string
    theme?: string
    custom_domain?: string
    use_domain_for_shortlinks?: boolean
    root_domain_mode?: "bio" | "redirect"
    root_domain_redirect_url?: string
    custom_js?: string
    custom_html?: string
    background_type?: string
    background_value?: string
    font_family?: string
    button_style?: any
  },
): Promise<void> {
  if (data.username) {
    await sql`
      UPDATE users
      SET 
        username = ${data.username},
        subdomain = LOWER(${data.username}),
        updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  if (data.custom_domain !== undefined) {
    if (data.custom_domain === "" || data.custom_domain === null) {
      // Domain is being removed - reset all domain-related fields
      await sql`
        UPDATE users
        SET 
          custom_domain = NULL,
          domain_verified = false,
          use_domain_for_shortlinks = true,
          root_domain_mode = 'bio',
          root_domain_redirect_url = NULL,
          updated_at = NOW()
        WHERE id = ${userId}
      `
      return
    }
    // Domain is being set/updated - reset verified status
    await sql`
      UPDATE users
      SET 
        custom_domain = ${data.custom_domain},
        domain_verified = false,
        updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  const updates: string[] = []
  const values: any[] = []

  if (data.display_name !== undefined) {
    updates.push("display_name = $" + (values.length + 1))
    values.push(data.display_name)
  }
  if (data.bio !== undefined) {
    updates.push("bio = $" + (values.length + 1))
    values.push(data.bio)
  }
  if (data.avatar_url !== undefined) {
    updates.push("avatar_url = $" + (values.length + 1))
    values.push(data.avatar_url)
  }
  if (data.profile_image_url !== undefined) {
    updates.push("profile_image_url = $" + (values.length + 1))
    values.push(data.profile_image_url)
  }
  if (data.theme !== undefined) {
    updates.push("theme = $" + (values.length + 1))
    values.push(data.theme)
  }
  if (data.custom_js !== undefined) {
    updates.push("custom_js = $" + (values.length + 1))
    values.push(data.custom_js)
  }
  if (data.custom_html !== undefined) {
    updates.push("custom_html = $" + (values.length + 1))
    values.push(data.custom_html)
  }
  if (data.background_type !== undefined) {
    updates.push("background_type = $" + (values.length + 1))
    values.push(data.background_type)
  }
  if (data.background_value !== undefined) {
    updates.push("background_value = $" + (values.length + 1))
    values.push(data.background_value)
  }
  if (data.font_family !== undefined) {
    updates.push("font_family = $" + (values.length + 1))
    values.push(data.font_family)
  }
  if (data.button_style !== undefined) {
    updates.push("button_style = $" + (values.length + 1))
    values.push(data.button_style ? JSON.stringify(data.button_style) : null)
  }
  if (data.use_domain_for_shortlinks !== undefined) {
    console.log("data.use_domain_for_shortlinks : ",data.use_domain_for_shortlinks);
    updates.push("use_domain_for_shortlinks = $" + (values.length + 1))
    values.push(data.use_domain_for_shortlinks)
  }
  if (data.root_domain_mode !== undefined) {
    console.log("data.root_domain_mode : ",data.root_domain_mode);
    updates.push("root_domain_mode = $" + (values.length + 1))
    values.push(data.root_domain_mode)
  }
  if (data.root_domain_redirect_url !== undefined) {
    console.log("data.root_domain_redirect_url : ",data.root_domain_redirect_url);
    updates.push("root_domain_redirect_url = $" + (values.length + 1))
    values.push(data.root_domain_redirect_url)
  }

  if (updates.length > 0) {
    // Always add updated_at
    updates.push("updated_at = NOW()")

    // Add userId as the last parameter
    values.push(userId)
    console.log("updates : ",updates);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
    `
    console.log("query : ",query);  
    console.log("values : ",values);

    await sql.query(query, values)
  }
}
