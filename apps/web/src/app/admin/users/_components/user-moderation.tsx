'use client';

import { useState } from 'react';
import { Button } from '@acme/ui';
import type { UserRole, UserStatus } from '@prisma/client';

interface UserModerationProps {
  userId: string;
  currentStatus: UserStatus;
  currentRole: UserRole;
  userName: string;
}

export function UserModeration({
  userId,
  currentStatus,
  currentRole,
  userName,
}: UserModerationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleStatus = async () => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = currentStatus === 'ACTIVE' ? 'suspend' : 'activate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccess(`User ${action}d successfully`);
      // Reload page after a short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async () => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess('User role updated successfully');
      // Reload page after a short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
      <div className="flex gap-2">
        <Button
          variant={currentStatus === 'ACTIVE' ? 'destructive' : 'outline'}
          size="sm"
          onClick={toggleStatus}
          disabled={loading}
        >
          {currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </Button>
        <Button
          variant={currentRole === 'ADMIN' ? 'outline' : 'default'}
          size="sm"
          onClick={toggleRole}
          disabled={loading}
        >
          {currentRole === 'ADMIN' ? 'Demote' : 'Promote'}
        </Button>
      </div>
    </div>
  );
}
