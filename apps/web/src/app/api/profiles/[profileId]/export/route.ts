import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';

export async function GET(_request: Request, { params }: { params: { profileId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const profile = await prisma.profile.findFirst({
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

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const payload = {
    profile: {
      slug: profile.slug,
      displayName: profile.displayName,
      bio: profile.bio,
      image: profile.image,
      themeSettings: profile.themeSettings,
      status: profile.status,
    },
    links: profile.links.map((l) => ({
      slug: l.slug,
      title: l.title,
      url: l.url,
      position: l.position,
      metadata: l.metadata,
      status: l.status,
    })),
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(payload, null, 2);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.slug}-export.json"`,
    },
  });
}
