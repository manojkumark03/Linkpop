import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const explicitUrl = url.searchParams.get('url');
  const slug = url.searchParams.get('slug');

  const target = explicitUrl
    ? explicitUrl
    : slug
      ? new URL(`/${slug}`, url.origin).toString()
      : null;

  if (!target) {
    return NextResponse.json({ error: 'url or slug is required' }, { status: 400 });
  }

  const svg = await QRCode.toString(target, {
    type: 'svg',
    margin: 1,
    width: 256,
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
