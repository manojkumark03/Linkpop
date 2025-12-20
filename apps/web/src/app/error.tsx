'use client';

import * as React from 'react';

import { Button } from '@acme/ui';

function getFriendlyMessage(error: Error) {
  const message = error?.message || 'Unknown error';

  if (!process.env.NEXT_PUBLIC_VERCEL_ENV && message.includes('DATABASE_URL')) {
    return {
      title: 'Database is not configured',
      description:
        'DATABASE_URL is missing. Add a valid Neon Postgres connection string to your .env file, then restart the app.',
    };
  }

  const isPrismaInit =
    (error as any)?.name === 'PrismaClientInitializationError' ||
    message.includes('PrismaClientInitializationError') ||
    message.includes('P1001') ||
    message.includes('P1000');

  if (isPrismaInit) {
    return {
      title: 'Unable to connect to the database',
      description:
        'We could not connect to the database. Please verify your Neon DATABASE_URL in .env and ensure the database is reachable.',
    };
  }

  return {
    title: 'Something went wrong',
    description: message,
  };
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendly = React.useMemo(() => getFriendlyMessage(error), [error]);

  return (
    <html>
      <body>
        <div className="container flex min-h-screen flex-col items-center justify-center py-10">
          <div className="w-full max-w-lg space-y-3 rounded-lg border p-6">
            <h1 className="text-2xl font-semibold">{friendly.title}</h1>
            <p className="text-muted-foreground text-sm">{friendly.description}</p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => reset()}>Try again</Button>
              <Button variant="outline" asChild>
                <a href="/">Go to homepage</a>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
