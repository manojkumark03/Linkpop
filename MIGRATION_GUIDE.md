# Database Migration Guide: Adding isPaid Field

## Problem

The Prisma schema has been updated to include an `isPaid` field on the `User` model, but your local database doesn't have this column yet. This causes the error:

```
The column `User.isPaid` does not exist in the current database.
```

## Solution

A migration has already been created for you: `20251214130000_single_tier_is_paid`

This migration will safely add the `isPaid` column to your User table with a default value of `false`, so existing users won't be affected.

## How to Apply the Migration

### Option 1: Apply Migration to Existing Database (Recommended)

This is the safest option - it will update your existing database without losing any data:

```bash
cd apps/web
pnpm db:migrate
```

This command will:

1. Check which migrations have been applied
2. Apply any pending migrations (including the `isPaid` field)
3. Generate the Prisma client with the updated schema

### Option 2: Reset Database (Use with Caution)

⚠️ **WARNING: This will delete all data in your database!**

Only use this if you're in development and don't need to keep your existing data:

```bash
cd apps/web
pnpm prisma migrate reset
```

This will:

1. Drop the entire database
2. Create a new database
3. Apply all migrations from scratch
4. Run the seed script (if configured)

### Option 3: Fresh Database Setup

If you want to start with a completely new database:

1. Create a new database in PostgreSQL:

   ```bash
   psql -U postgres
   CREATE DATABASE linkforest_new;
   \q
   ```

2. Update your `.env` file with the new database URL:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linkforest_new?schema=public"
   ```

3. Apply all migrations:
   ```bash
   cd apps/web
   pnpm db:migrate
   ```

## Verify Migration Success

After applying the migration, verify it worked:

1. Check Prisma Studio:

   ```bash
   cd apps/web
   pnpm db:studio
   ```

   Open the browser and check that the `User` table has an `isPaid` column.

2. Or check directly in PostgreSQL:

   ```bash
   psql -U postgres -d your_database_name
   \d "User"
   ```

   You should see `isPaid` listed as a boolean column with a default of `false`.

## What the Migration Does

The migration file (`apps/web/prisma/migrations/20251214130000_single_tier_is_paid/migration.sql`) contains:

```sql
-- Add paid flag to users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- Remove tier plan column from subscriptions (if it exists)
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "plan";

-- Clean up old enum type
DROP TYPE IF EXISTS "SubscriptionPlan";
```

This migration is safe because:

- Uses `ADD COLUMN IF NOT EXISTS` to prevent errors if run multiple times
- Sets `DEFAULT false` so all existing users get a consistent value
- Uses `DROP ... IF EXISTS` for cleanup operations

## Troubleshooting

### "Error: P1012 - Environment variable not found: DATABASE_URL"

Make sure you have a `.env` file in `apps/web/` directory. Copy from `.env.example`:

```bash
cd apps/web
cp .env.example .env
# Then edit .env and set your actual DATABASE_URL
```

### "Migration failed" or "Table already exists"

If you see errors about tables already existing, your database might be in an inconsistent state. Use Option 2 (reset) or Option 3 (fresh database).

### Still getting "User.isPaid does not exist"

After running the migration, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C)
cd apps/web
pnpm dev
```

## Next Steps

After successfully applying the migration:

1. Restart your development server
2. Try registering a new user - the error should be gone
3. All new users will have `isPaid: false` by default
4. When users subscribe, you can update this field to `true`

## Questions?

If you encounter any issues with the migration, check:

- Your DATABASE_URL is correct in `.env`
- PostgreSQL is running
- You have the correct permissions on the database
- The database exists and is accessible
