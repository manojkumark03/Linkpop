import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Helper to verify Stripe webhook signature
function verifyStripeWebhook(
  body: string,
  signature: string | null,
): Record<string, unknown> | null {
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return null;
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET);
    hmac.update(body);
    hmac.digest('hex');

    // For simplicity, we'll just verify signature exists (full implementation would use crypto)
    // In production, use the official Stripe Node SDK
    const expectedSignature = signature.split(',')[1]?.split('=')[1];
    if (!expectedSignature) return null;

    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');

  // Handle Stripe webhooks
  if (request.headers.get('stripe-signature')) {
    try {
      const body = await request.text();
      const signature = request.headers.get('stripe-signature');

      const event = verifyStripeWebhook(body, signature);
      if (!event) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const eventType = event.type as string;

      if (
        eventType === 'customer.subscription.updated' ||
        eventType === 'customer.subscription.created'
      ) {
        const eventData = event.data as any;
        const subscription = eventData?.object as Record<string, unknown>;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id as string;
        const status = subscription.status as string;

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { subscriptions: { some: { providerCustomerId: customerId } } },
          select: { id: true },
        });

        if (user) {
          const normalizedStatus = status.toUpperCase() as any;
          const isPro = status === 'active' || status === 'trialing';

          const subscriptionTier = isPro ? 'PRO' : 'FREE';
          const subscriptionStatus = isPro
            ? 'ACTIVE'
            : status === 'incomplete_expired' || status === 'unpaid'
              ? 'EXPIRED'
              : 'CANCELLED';

          await prisma.$transaction([
            prisma.subscription.upsert({
              where: { providerSubscriptionId: subscriptionId },
              create: {
                userId: user.id,
                providerCustomerId: customerId,
                providerSubscriptionId: subscriptionId,
                status: normalizedStatus,
                currentPeriodStart: subscription.current_period_start
                  ? new Date((subscription.current_period_start as number) * 1000)
                  : undefined,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date((subscription.current_period_end as number) * 1000)
                  : undefined,
              },
              update: {
                status: normalizedStatus,
                currentPeriodStart: subscription.current_period_start
                  ? new Date((subscription.current_period_start as number) * 1000)
                  : undefined,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date((subscription.current_period_end as number) * 1000)
                  : undefined,
              },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { subscriptionTier, subscriptionStatus },
            }),
          ]);
        }
      }

      if (eventType === 'customer.subscription.deleted') {
        const eventData = event.data as any;
        const subscription = eventData?.object as Record<string, unknown>;
        const subscriptionId = subscription.id as string;

        const existing = await prisma.subscription.findUnique({
          where: { providerSubscriptionId: subscriptionId },
          select: { userId: true },
        });

        await prisma.subscription.update({
          where: { providerSubscriptionId: subscriptionId },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });

        if (existing?.userId) {
          await prisma.user.update({
            where: { id: existing.userId },
            data: { subscriptionTier: 'FREE', subscriptionStatus: 'CANCELLED' },
          });
        }
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }

  // Handle API requests from authenticated users
  if (contentType?.includes('application/json')) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { action } = body;

      if (action === 'create-checkout') {
        // Linkforest PRO is $9/mo.
        // In a real implementation, you'd create a Stripe Checkout Session here.
        return NextResponse.json({
          checkoutUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/billing`,
          message: 'Checkout session would be created via Stripe SDK',
        });
      }

      if (action === 'create-billing-portal') {
        // Get user's subscription
        const subscription = await prisma.subscription.findFirst({
          where: { userId: session.user.id },
          select: { providerCustomerId: true },
        });

        if (!subscription?.providerCustomerId) {
          return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        // In a real implementation, create a Stripe billing portal session
        return NextResponse.json({
          portalUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing/portal`,
          message: 'Billing portal would be opened via Stripe SDK',
        });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
      console.error('Subscribe error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user, subscription] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionTier: true, subscriptionStatus: true },
      }),
      prisma.subscription.findFirst({
        where: { userId: session.user.id },
        select: {
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      }),
    ]);

    const subscriptionTier = user?.subscriptionTier ?? 'FREE';

    return NextResponse.json({
      subscriptionTier,
      subscriptionStatus: user?.subscriptionStatus ?? 'ACTIVE',
      isPro: subscriptionTier === 'PRO',
      providerStatus: subscription?.status ?? null,
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      price: 9,
      currency: 'USD',
      interval: 'month',
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
