import { sql } from "./db"
import type { BioLink, Block, BlockType } from "./types"

// Get all bio links for a user
export async function getUserBioLinks(userId: string): Promise<BioLink[]> {
  const result = await sql`
    SELECT * FROM bio_links 
    WHERE user_id = ${userId}
    ORDER BY position ASC
  `

  return result as BioLink[]
}

// Create a bio link
export async function createBioLink(
  userId: string,
  title: string,
  url: string,
  icon?: string,
  blockType: BlockType = "link",
  blockData: any = {},
): Promise<Block> {
  // Get the highest position
  const positionResult = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 as next_position
    FROM bio_links 
    WHERE user_id = ${userId}
  `

  const position = positionResult[0].next_position

  const result = await sql`
    INSERT INTO bio_links (user_id, title, url, icon, position, block_type, block_data)
    VALUES (${userId}, ${title}, ${url || ""}, ${icon || null}, ${position}, ${blockType}, ${JSON.stringify(blockData)})
    RETURNING *
  `

  return result[0] as Block
}

// Update a bio link
export async function updateBioLink(
  id: string,
  userId: string,
  title?: string,
  url?: string,
  icon?: string,
  isVisible?: boolean,
  blockData?: any,
): Promise<Block> {
  const result = await sql`
    UPDATE bio_links 
    SET title = COALESCE(${title}, title),
        url = COALESCE(${url}, url),
        icon = COALESCE(${icon}, icon),
        is_visible = COALESCE(${isVisible}, is_visible),
        block_data = COALESCE(${blockData ? JSON.stringify(blockData) : null}, block_data),
        updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `

  return result[0] as Block
}

// Delete a bio link
export async function deleteBioLink(id: string, userId: string): Promise<void> {
  await sql`
    DELETE FROM bio_links 
    WHERE id = ${id} AND user_id = ${userId}
  `
}

// Reorder bio links
export async function reorderBioLinks(userId: string, linkIds: string[]): Promise<void> {
  // Update positions based on the order in the array
  for (let i = 0; i < linkIds.length; i++) {
    await sql`
      UPDATE bio_links 
      SET position = ${i}, updated_at = NOW()
      WHERE id = ${linkIds[i]} AND user_id = ${userId}
    `
  }
}

// Track bio link click
export async function trackBioLinkClick(
  bioLinkId: string,
  userAgent?: string,
  referrer?: string,
  ipAddress?: string,
): Promise<void> {
  console.log("[v0] trackBioLinkClick deprecated - use trackAnalyticsEvent instead")
}
