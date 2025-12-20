import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const themeSettingsSchema = z
  .object({
    backgroundColor: z.string().min(1).optional(),
    textColor: z.string().min(1).optional(),
    buttonColor: z.string().min(1).optional(),
    buttonTextColor: z.string().min(1).optional(),
    buttonRadius: z.number().min(0).max(24).optional(),
    fontFamily: z.string().min(1).optional(),
    customCss: z.string().optional(),
  })
  .partial();

export const createProfileSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(64, 'Slug must be at most 64 characters')
    .regex(slugRegex, 'Username can only contain letters, numbers, and hyphens'),
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(240).optional(),
});

export const updateProfileSchema = z
  .object({
    slug: createProfileSchema.shape.slug.optional(),
    displayName: z.string().min(1).max(80).nullable().optional(),
    bio: z.string().max(240).nullable().optional(),
    image: z.string().url().nullable().optional(),
    status: z.enum(['ACTIVE', 'DISABLED']).optional(),
    themeSettings: themeSettingsSchema.optional(),
  })
  .strict();

export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
