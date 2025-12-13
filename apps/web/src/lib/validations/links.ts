import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const linkMetadataSchema = z
  .object({
    icon: z.string().min(1).optional(),
    display: z.enum(['button', 'icon']).optional(),
    schedule: z
      .object({
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export const createLinkSchema = z
  .object({
    profileId: z.string().min(1),
    title: z.string().min(1).max(120),
    url: z.string().url(),
    slug: z
      .string()
      .min(2)
      .max(64)
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens')
      .optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']).optional(),
    metadata: linkMetadataSchema.optional(),
  })
  .strict();

export const updateLinkSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    url: z.string().url().optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']).optional(),
    position: z.number().int().min(0).optional(),
    metadata: linkMetadataSchema.optional(),
  })
  .strict();

export const reorderLinksSchema = z
  .object({
    profileId: z.string().min(1),
    orderedLinkIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type LinkMetadataInput = z.infer<typeof linkMetadataSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type ReorderLinksInput = z.infer<typeof reorderLinksSchema>;
