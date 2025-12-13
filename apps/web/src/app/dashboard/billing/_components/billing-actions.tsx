'use client';

import { useState } from 'react';
import { Button } from '@acme/ui';

interface BillingActionsProps {
  currentPlan: string;
  subscriptionId?: string;
}

export function BillingActions({ currentPlan, subscriptionId }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (plan === currentPlan) {
      alert('You are already on this plan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-checkout',
          plan,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const data = await response.json();
      // In a real implementation, this would redirect to Stripe
      window.open(data.checkoutUrl || '#', '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    if (!subscriptionId) {
      alert('No subscription found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-billing-portal',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      // In a real implementation, this would redirect to Stripe
      window.open(data.portalUrl || '#', '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {currentPlan !== 'FREE' && subscriptionId && (
          <Button variant="outline" onClick={handleBillingPortal} disabled={loading}>
            Manage Billing
          </Button>
        )}

        {currentPlan === 'FREE' && (
          <Button onClick={() => handleUpgrade('PRO')} disabled={loading}>
            Upgrade to PRO
          </Button>
        )}

        {currentPlan === 'PRO' && (
          <Button onClick={() => handleUpgrade('BUSINESS')} disabled={loading}>
            Upgrade to BUSINESS
          </Button>
        )}
      </div>
    </div>
  );
}
