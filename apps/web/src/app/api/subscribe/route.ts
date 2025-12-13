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
    const digest = `t=${Math.floor(Date.now() / 1000)},v1=${hmac.digest('hex')}`;

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
          await prisma.subscription.upsert({
            where: { providerSubscriptionId: subscriptionId },
            create: {
              userId: user.id,
              providerCustomerId: customerId,
              providerSubscriptionId: subscriptionId,
              plan: status === 'active' ? 'PRO' : 'FREE',
              status: status.toUpperCase() as any,
              currentPeriodStart: subscription.current_period_start
                ? new Date((subscription.current_period_start as number) * 1000)
                : undefined,
              currentPeriodEnd: subscription.current_period_end
                ? new Date((subscription.current_period_end as number) * 1000)
                : undefined,
            },
            update: {
              plan: status === 'active' ? 'PRO' : 'FREE',
              status: status.toUpperCase() as any,
              currentPeriodStart: subscription.current_period_start
                ? new Date((subscription.current_period_start as number) * 1000)
                : undefined,
              currentPeriodEnd: subscription.current_period_end
                ? new Date((subscription.current_period_end as number) * 1000)
                : undefined,
            },
          });
        }
      }

      if (eventType === 'customer.subscription.deleted') {
        const eventData = event.data as any;
        const subscription = eventData?.object as Record<string, unknown>;
        const subscriptionId = subscription.id as string;

        await prisma.subscription.update({
          where: { providerSubscriptionId: subscriptionId },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });
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
      const { action, plan } = body;

      if (action === 'create-checkout') {
        // In a real implementation, create a Stripe checkout session
        // For now, return a placeholder
        return NextResponse.json({
          checkoutUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing?plan=${plan}`,
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

    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
      select: {
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!subscription) {
      // User has no subscription, return default FREE tier
      return NextResponse.json({
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        features: getFeatureFlags('FREE'),
      });
    }

    return NextResponse.json({
      ...subscription,
      features: getFeatureFlags(subscription.plan),
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getFeatureFlags(plan: string): Record<string, boolean | number> {
  const baseFeatures: Record<string, boolean | number> = {
    basicAnalytics: true,
    linkTracking: true,
    maxLinks: 10,
  };

  const proFeatures: Record<string, boolean | number> = {
    ...baseFeatures,
    customDomains: true,
    advancedAnalytics: true,
    scheduledLinks: true,
    maxLinks: 100,
    apiAccess: true,
  };

  const businessFeatures: Record<string, boolean | number> = {
    ...proFeatures,
    teamMembers: true,
    customBranding: true,
    dedicatedSupport: true,
    maxLinks: -1, // unlimited
  };

  switch (plan) {
    case 'PRO':
      return proFeatures;
    case 'BUSINESS':
      return businessFeatures;
    case 'FREE':
    default:
      return baseFeatures;
  }
}
