# Next.js 14 + TypeScript + Tailwind + shadcn-style UI (Monorepo)

Production-ready starter with:

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with CSS variable theme tokens + dark mode
- shadcn/ui-style primitives in `packages/ui`
- Prisma (Postgres) + NextAuth (placeholder)
- ESLint + Prettier + lint-staged + Husky
- Vitest (unit) + Playwright (E2E)
- Docker Compose Postgres
- GitHub Actions CI (lint, typecheck, test, build, e2e)

## Prerequisites

- Node.js 20+
- pnpm (via Corepack recommended)
- Docker (optional, for local Postgres)

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Getting started

1. Install dependencies

```bash
pnpm install
```

2. Start Postgres (optional)

```bash
docker compose up -d
```

3. Configure environment

Copy the example env file:

```bash
cp .env.example apps/web/.env
```

4. Prisma

```bash
pnpm --filter web prisma generate
pnpm --filter web prisma migrate dev
pnpm --filter web prisma db seed
```

For production/CI (non-interactive):

```bash
pnpm --filter web prisma migrate deploy
```

5. Run the app

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

From the repo root:

- `pnpm dev` – start Next dev server
- `pnpm lint` – ESLint across workspace
- `pnpm format` – Prettier
- `pnpm typecheck` – TypeScript checks
- `pnpm test` – unit tests (Vitest)
- `pnpm test:e2e` – E2E tests (Playwright)
- `pnpm build` – production build

Package-specific scripts (examples):

```bash
pnpm --filter web lint
pnpm --filter web test
```

## UI system (design tokens + primitives)

Reusable, shadcn-style components live in `packages/ui/src/components` and are exported from `@acme/ui`.

Examples:

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Sheet,
  SheetContent,
  SheetTrigger,
  toast,
} from '@acme/ui';
```

### Theme tokens

The app uses CSS variable tokens in `apps/web/src/app/globals.css` and maps them to Tailwind in
`apps/web/tailwind.config.ts`.

Common semantic tokens:

- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--success` / `--success-foreground`
- `--warning` / `--warning-foreground`
- `--info` / `--info-foreground`
- `--border`, `--input`, `--ring`

There are also optional scale tokens (e.g. `--primary-50` … `--primary-950`) to support richer
palettes while keeping components themeable and dark-mode friendly.

Tailwind scans `packages/ui` so classes are included in the app build.

## Auth

Complete authentication system with NextAuth.js:

- Email/password credentials with bcrypt hashing and validation
- OAuth providers (GitHub, Google)
- Password reset via email tokens
- Rate limiting and CSRF protection
- Role-based access control (USER, ADMIN)
- Account suspension handling
- Middleware-based route protection

**Quick Start:**

```bash
# Generate secure secret
openssl rand -base64 32

# Add to apps/web/.env
NEXTAUTH_SECRET="your-generated-secret"

# Seed admin user (admin@acme.com / Admin123!)
pnpm --filter web prisma db seed
```

See [apps/web/AUTH_README.md](./apps/web/AUTH_README.md) for complete documentation and [apps/web/SECURITY.md](./apps/web/SECURITY.md) for security practices.

## Vercel deployment notes

- Set the project root to `apps/web`
- Add all required environment variables (see `.env.example`)
- Ensure `DATABASE_URL` points to your managed Postgres
- Build command: `pnpm --filter web build`
- Install command: `pnpm install --no-frozen-lockfile`

## Docker

A Postgres service is provided via `docker-compose.yml`.

```bash
docker compose up -d
```
