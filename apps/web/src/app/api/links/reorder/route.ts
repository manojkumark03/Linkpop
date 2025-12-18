import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';
import { reorderLinksSchema } from '@/lib/validations/links';

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const result = reorderLinksSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const profile = await prisma.profile.findFirst({
      where: { id: result.data.profileId, userId: auth.user.id, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const links = await prisma.link.findMany({
      where: {
        profileId: result.data.profileId,
        id: { in: result.data.orderedLinkIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (links.length !== result.data.orderedLinkIds.length) {
      return NextResponse.json({ error: 'Invalid link list' }, { status: 400 });
    }

    await prisma.$transaction(
      result.data.orderedLinkIds.map((id, index) =>
        prisma.link.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder links error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
