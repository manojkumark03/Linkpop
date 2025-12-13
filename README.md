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
pnpm --filter web prisma db push
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

## UI primitives

Reusable components live in `packages/ui/src/components` (Button/Input/Card, etc.).

Tailwind scans `packages/ui` so classes are included in the app build.

## Auth

NextAuth is wired at `apps/web/src/app/api/auth/[...nextauth]/route.ts`.

To enable OAuth providers, set `GITHUB_ID/GITHUB_SECRET` and/or `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`.

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
