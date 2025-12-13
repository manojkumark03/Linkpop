import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@acme/ui';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>Next.js 14 Starter</h1>
        <p>
          Tailwind theme tokens, dark mode, shared UI primitives, Prisma, NextAuth placeholder, and
          a test stack (Vitest + Playwright).
        </p>
      </div>

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
    </div>
  );
}
