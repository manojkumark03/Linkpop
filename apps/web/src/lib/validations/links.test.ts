import { describe, expect, it } from 'vitest';

import { createLinkSchema, updateLinkSchema, reorderLinksSchema } from './links';

describe('link validations', () => {
  it('accepts a valid link create payload', () => {
    const result = createLinkSchema.safeParse({
      profileId: 'profile_1',
      title: 'My site',
      url: 'https://example.com',
      metadata: {
        icon: 'github',
        display: 'icon',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts link update payload', () => {
    const result = updateLinkSchema.safeParse({
      title: 'New title',
      status: 'HIDDEN',
      metadata: {
        schedule: {
          startsAt: new Date().toISOString(),
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts reorder payload', () => {
    const result = reorderLinksSchema.safeParse({
      profileId: 'profile_1',
      orderedLinkIds: ['a', 'b', 'c'],
    });

    expect(result.success).toBe(true);
  });
});
