import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';

function getCopySlug(baseSlug: string, attempt: number) {
  if (attempt === 0) return `${baseSlug}-copy`;
  return `${baseSlug}-copy-${attempt + 1}`;
}

export async function POST(_request: Request, { params }: { params: { profileId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const source = await prisma.profile.findFirst({
    where: {
      id: params.profileId,
      userId: auth.user.id,
      deletedAt: null,
    },
    include: {
      links: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = getCopySlug(source.slug, attempt);
    const existing = await prisma.profile.findUnique({ where: { slug: candidate } });
    if (!existing) {
      const created = await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: {
            userId: auth.user.id,
            slug: candidate,
            displayName: source.displayName ? `${source.displayName} (copy)` : null,
            bio: source.bio,
            image: source.image,
            themeSettings: source.themeSettings,
            status: source.status,
          },
        });

        if (source.links.length > 0) {
          await tx.link.createMany({
            data: source.links.map((l) => ({
              profileId: profile.id,
              slug: l.slug,
              title: l.title,
              url: l.url,
              position: l.position,
              metadata: l.metadata as any,
              status: l.status,
            })),
          });
        }

        return profile;
      });

      return NextResponse.json({ profile: created }, { status: 201 });
    }
    attempt += 1;
    if (attempt > 20) {
      return NextResponse.json({ error: 'Unable to duplicate profile' }, { status: 500 });
    }
  }
}
