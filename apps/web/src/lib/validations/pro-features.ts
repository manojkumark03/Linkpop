import { z } from 'zod';

const scriptSchema = z.string().max(5000, 'Script cannot exceed 5000 characters').optional();

export const updateCustomScriptsSchema = z
  .object({
    profileId: z.string().min(1),
    customHeadScript: scriptSchema,
    customBodyScript: scriptSchema,
  })
  .strict();

export const createShortLinkSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    targetUrl: z.string().url('Must be a valid URL'),
    title: z.string().min(1).max(100).optional(),
    profileId: z.string().optional(),
  })
  .strict();

export const updateShortLinkSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    targetUrl: z.string().url('Must be a valid URL').optional(),
    title: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateCustomScriptsInput = z.infer<typeof updateCustomScriptsSchema>;
export type CreateShortLinkInput = z.infer<typeof createShortLinkSchema>;
export type UpdateShortLinkInput = z.infer<typeof updateShortLinkSchema>;
