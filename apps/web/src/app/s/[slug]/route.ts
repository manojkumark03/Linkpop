import type { NextRequest } from 'next/server';

import { handleShortLinkRedirect } from '@/lib/short-link-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return handleShortLinkRedirect(request, params.slug);
}
