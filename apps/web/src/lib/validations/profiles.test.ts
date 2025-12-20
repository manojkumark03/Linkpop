import { describe, expect, it } from 'vitest';

import { createProfileSchema, updateProfileSchema } from './profiles';

describe('profile validations', () => {
  it('accepts a valid profile create payload', () => {
    const result = createProfileSchema.safeParse({
      slug: 'my-profile',
      displayName: 'My Profile',
      bio: 'Hello world',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid slugs', () => {
    const result = createProfileSchema.safeParse({
      slug: 'Invalid Slug!',
    });

    expect(result.success).toBe(false);
  });

  it('accepts partial theme settings updates', () => {
    const result = updateProfileSchema.safeParse({
      themeSettings: {
        backgroundColor: '#ffffff',
        buttonRadius: 12,
      },
    });

    expect(result.success).toBe(true);
  });
});
