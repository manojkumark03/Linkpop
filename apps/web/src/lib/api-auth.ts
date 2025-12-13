import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

export type ApiUser = Session['user'];

export async function requireApiUser(): Promise<{ user: ApiUser } | { response: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (session.user.status === 'DISABLED') {
    return { response: NextResponse.json({ error: 'Account is suspended' }, { status: 403 }) };
  }

  return { user: session.user };
}
