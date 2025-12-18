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

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
    message: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
  });

export const createLinkSchema = z
  .object({
    profileId: z.string().min(1),
    title: z.string().min(1).max(120),
    url: z.string().min(1).max(500),
    linkType: z.enum(['URL', 'COPY_FIELD']).optional(),
    slug: z
      .string()
      .min(2)
      .max(64)
      .regex(slugRegex, 'Slug must be lowercase and may include hyphens')
      .optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']).optional(),
    metadata: linkMetadataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // URL validation - only require HTTP URL for URL type links
    if (data.linkType !== 'COPY_FIELD') {
      try {
        const url = new URL(data.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
            path: ['url'],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
          path: ['url'],
        });
      }
    }
  });

export const updateLinkSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    url: z.string().min(1).max(500).optional(),
    linkType: z.enum(['URL', 'COPY_FIELD']).optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']).optional(),
    position: z.number().int().min(0).optional(),
    metadata: linkMetadataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // URL validation - only require HTTP URL for URL type links
    if (data.url && data.linkType !== 'COPY_FIELD') {
      try {
        const url = new URL(data.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
            path: ['url'],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
          path: ['url'],
        });
      }
    }
  });

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
