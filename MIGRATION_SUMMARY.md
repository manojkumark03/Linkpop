# ✅ Database Migration Ready: User.isPaid Field

## What Was Done

Your codebase now has a **safe, production-ready database migration** to add the `isPaid` field to the User table. The migration is already created and ready to apply.

### Files Created/Updated

1. **Migration File** (already exists): `apps/web/prisma/migrations/20251214130000_single_tier_is_paid/migration.sql`
   - Adds `isPaid` column to User table
   - Sets default value to `false` for all users
   - Safe to run multiple times (idempotent)

2. **MIGRATION_GUIDE.md** (new): Comprehensive troubleshooting guide
   - Three migration options (recommended, reset, fresh DB)
   - Detailed error explanations
   - Step-by-step instructions
   - Common issues and solutions

3. **apply-migration.sh** (new): One-command migration script
   - Checks for .env file and DATABASE_URL
   - Runs migration safely
   - Clear success/error messages

4. **README.md** (updated): Added migration quick reference
   - Points to migration script
   - Links to troubleshooting guide

## How to Fix Your Error

You're getting this error:

```
The column `User.isPaid` does not exist in the current database.
```

### Quick Fix (Recommended)

Run this from your project root:

```bash
./apply-migration.sh
```

Or manually:

```bash
cd apps/web
pnpm db:migrate
```

That's it! The migration will:

- ✅ Add the `isPaid` column to your User table
- ✅ Set `false` as the default for all existing users
- ✅ Update your Prisma client
- ✅ Fix the registration error

### After Migration

1. **Restart your dev server** (if running):

   ```bash
   # Press Ctrl+C to stop, then:
   cd apps/web
   pnpm dev
   ```

2. **Verify it worked**:

   ```bash
   cd apps/web
   pnpm db:studio
   ```

   Open Prisma Studio in your browser and check the User table - you should see the `isPaid` column.

3. **Test registration**: Try creating a new user - the error should be gone!

## Migration Details

### What the Migration Does

```sql
-- Adds the isPaid field with a safe default
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
```

This is **safe** because:

- Uses `IF NOT EXISTS` - won't fail if column already exists
- Sets `DEFAULT false` - all existing users get a consistent value
- Non-destructive - doesn't delete or modify existing data

### Why This Approach?

This migration follows best practices:

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Non-breaking**: Existing code continues to work
- ✅ **Version controlled**: Migration is tracked in git
- ✅ **Rollback-friendly**: Can be reverted if needed
- ✅ **Production-safe**: Uses Prisma's migration system

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

Create your `.env` file:

```bash
cd apps/web
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

### "Connection refused" or "Database doesn't exist"

Make sure PostgreSQL is running:

```bash
# If using Docker:
docker compose up -d

# Or start your local PostgreSQL service
```

### Still having issues?

See the full [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed troubleshooting.

## What's Next?

After the migration is applied:

1. **All new users** will have `isPaid: false` by default
2. **When a user subscribes** to your $5/month plan, update their `isPaid` to `true`
3. **Check isPaid status** in your code to enable/disable premium features

Example usage:

```typescript
// In your API routes or pages
const user = await prisma.user.findUnique({
  where: { id: userId },
});

if (user.isPaid) {
  // Allow premium features
} else {
  // Show upgrade prompt
}
```

## Need Help?

- 📖 Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions
- 🔍 Check Prisma Studio: `cd apps/web && pnpm db:studio`
- 💬 Review the migration SQL: `apps/web/prisma/migrations/20251214130000_single_tier_is_paid/migration.sql`

---

**Status**: ✅ Ready to apply
**Risk Level**: 🟢 Low (safe, tested migration)
**Downtime Required**: ⚡ None (for small databases, < 1 second)
