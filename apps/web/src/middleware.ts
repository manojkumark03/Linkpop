import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/auth/error',
  '/api/auth',
];

const adminPaths = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (token.status === 'DISABLED') {
      return NextResponse.redirect(new URL('/auth/suspended', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
