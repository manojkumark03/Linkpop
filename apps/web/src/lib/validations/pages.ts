import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Schema for creating a new page
 * Note: profileId is NOT included - it comes from URL params, not request body
 */
export const createPageSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(64, 'Slug must be 64 characters or less')
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens'),
    content: z.string().min(1, 'Content is required'),
    icon: z.string().max(100, 'Icon must be 100 characters or less').nullish(),
    isPublished: z.boolean().default(true),
    order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
  })
  .strict();

/**
 * Schema for updating an existing page
 * All fields are optional for partial updates
 */
export const updatePageSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less').optional(),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(64, 'Slug must be 64 characters or less')
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens')
      .optional(),
    content: z.string().min(1, 'Content is required').optional(),
    icon: z.string().max(100, 'Icon must be 100 characters or less').nullish(),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
  })
  .strict();

/**
 * TypeScript types derived from Zod schemas for type safety
 */
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
