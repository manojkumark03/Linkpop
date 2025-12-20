'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, toast } from '@acme/ui';

interface BillingActionsProps {
  isPro: boolean;
  subscriptionId?: string;
}

export function BillingActions({ isPro, subscriptionId }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-checkout' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start checkout');
      }

      const data = await response.json();
      toast({
        title: 'Opening checkout…',
        description: 'You’ll be redirected to complete payment.',
      });
      window.open(data.checkoutUrl || '#', '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({ title: 'Checkout failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    if (!subscriptionId) {
      toast({
        title: 'No subscription found',
        description: 'There is no active subscription to manage.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-billing-portal' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      window.open(data.portalUrl || '#', '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({ title: 'Billing portal failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {isPro && subscriptionId ? (
          <Button variant="outline" onClick={handleBillingPortal} disabled={loading}>
            {loading ? 'Opening…' : 'Manage Billing'}
          </Button>
        ) : (
          <>
            <Button onClick={handleSubscribe} disabled={loading}>
              {loading ? 'Starting checkout…' : 'Upgrade to PRO - $9/mo'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">See plan details</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
