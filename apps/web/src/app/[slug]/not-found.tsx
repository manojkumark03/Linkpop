import Link from 'next/link';

import { Button } from '@acme/ui';

export default function ProfileNotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-3xl font-bold">This profile is not published</h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        This profile is currently in draft mode. Ask the owner to publish it to make it live.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/">Go to Linkforest</Link>
        </Button>
      </div>
    </div>
  );
}
