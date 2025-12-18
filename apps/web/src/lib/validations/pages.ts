import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createPageSchema = z
  .object({
    profileId: z.string().min(1),
    title: z.string().min(1).max(100),
    slug: z
      .string()
      .min(1)
      .max(64)
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens'),
    content: z.string().min(1),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

export const updatePageSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    slug: z
      .string()
      .min(1)
      .max(64)
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens')
      .optional(),
    content: z.string().min(1).optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
