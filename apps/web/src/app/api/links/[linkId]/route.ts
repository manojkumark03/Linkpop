import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';
import { updateLinkSchema } from '@/lib/validations/links';

export async function PATCH(request: Request, { params }: { params: { linkId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const result = updateLinkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.link.findFirst({
      where: {
        id: params.linkId,
        deletedAt: null,
        profile: { userId: auth.user.id, deletedAt: null },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const link = await prisma.link.update({
      where: { id: params.linkId },
      data: {
        title: result.data.title,
        url: result.data.url,
        status: result.data.status,
        position: result.data.position,
        metadata: result.data.metadata,
      },
      select: {
        id: true,
        profileId: true,
        slug: true,
        title: true,
        url: true,
        position: true,
        metadata: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Update link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { linkId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const existing = await prisma.link.findFirst({
    where: {
      id: params.linkId,
      deletedAt: null,
      profile: { userId: auth.user.id, deletedAt: null },
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  await prisma.link.update({
    where: { id: params.linkId },
    data: { status: 'ARCHIVED', deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
