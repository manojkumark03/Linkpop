import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

import { sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { passwordResetRequestSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!rateLimit(`password-reset:${ip}`, { interval: 60 * 1000, maxRequests: 3 })) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const result = passwordResetRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'If a user with that email exists, a password reset link has been sent.' },
        { status: 200 },
      );
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json({ error: 'Account is suspended' }, { status: 403 });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json(
      { message: 'If a user with that email exists, a password reset link has been sent.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
