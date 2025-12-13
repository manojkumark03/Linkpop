'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@acme/ui';

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" asChild>
          <a href="/auth/login">Sign In</a>
        </Button>
        <Button asChild>
          <a href="/auth/register">Sign Up</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{session.user.name}</p>
        <p className="text-muted-foreground">{session.user.email}</p>
      </div>
      <Button variant="outline" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  );
}
