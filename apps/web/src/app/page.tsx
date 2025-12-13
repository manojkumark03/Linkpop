import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@acme/ui';

import { CardGrid } from '@/components/ui/card-grid';
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>Next.js 14 Starter</h1>
        <p>
          Tailwind theme tokens, dark mode, shared UI primitives, Prisma, NextAuth with complete
          auth flows, and a test stack (Vitest + Playwright).
        </p>
        <p className="text-sm">
          Tip: press <kbd className="bg-muted rounded-md border px-1.5 py-0.5">?</kbd> anywhere to
          view keyboard shortcuts.
        </p>
      </div>

      <CardGrid columns={2}>
        {user ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>You are signed in as {user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {user.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Role:</span> {user.role}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" asChild>
                    <a href="/api/auth/signout">Sign Out</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Try out the authentication system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild>
                  <a href="/auth/login">Sign In</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/auth/register">Sign Up</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>UI primitives</CardTitle>
            <CardDescription>Example of shared components from packages/ui</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <Input placeholder="Type here..." />
          </CardContent>
        </Card>
      </CardGrid>
    </div>
  );
}
