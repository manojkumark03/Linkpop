# 🚀 Quick Start: Fix "User.isPaid does not exist" Error

## The Problem

You're seeing this error when trying to register a user:

```
The column `User.isPaid` does not exist in the current database.
```

## The Solution (2 minutes)

### Step 1: Check Your Setup

```bash
./check-migration-status.sh
```

This will tell you if the migration needs to be applied.

### Step 2: Apply the Migration

```bash
./apply-migration.sh
```

That's it! The migration will add the `isPaid` column to your database.

### Step 3: Restart Your Server

```bash
# Stop your dev server (Ctrl+C), then:
cd apps/web
pnpm dev
```

### Step 4: Test It

Try registering a new user at `http://localhost:3000/auth/register` - the error should be gone!

---

## Alternative: Manual Migration

If you prefer to run the migration manually:

```bash
cd apps/web
pnpm db:migrate
```

When prompted, press Enter to apply the migration.

---

## What Just Happened?

The migration added a new column to your User table:

- **Column name**: `isPaid`
- **Type**: Boolean
- **Default**: `false`
- **Purpose**: Track if user has paid for $5/month Pro plan

All existing users (if any) automatically get `isPaid: false`.

---

## Verify It Worked

Option 1 - Prisma Studio:

```bash
cd apps/web
pnpm db:studio
```

Look at the User table - you should see the `isPaid` column.

Option 2 - PostgreSQL directly:

```bash
psql -U postgres -d your_database_name
\d "User"
```

You should see `isPaid | boolean | not null | false` in the output.

---

## Troubleshooting

### "DATABASE_URL not found"

Create your `.env` file:

```bash
cd apps/web
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` (see line 4 in the file).

### "Connection refused"

Start PostgreSQL:

```bash
# If using Docker:
docker compose up -d

# Or start your local PostgreSQL:
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### "Permission denied"

```bash
chmod +x *.sh
```

### Still stuck?

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed troubleshooting.

---

## Files Created for You

- ✅ **MIGRATION_GUIDE.md** - Comprehensive troubleshooting guide
- ✅ **MIGRATION_SUMMARY.md** - What changed and why
- ✅ **apply-migration.sh** - One-command migration script
- ✅ **check-migration-status.sh** - Check if migration is applied
- ✅ **This file** - Quick start guide

All scripts are ready to run and include helpful error messages.

---

## Next Steps After Migration

1. **Update subscription logic** to set `isPaid: true` when users subscribe
2. **Check isPaid status** in your code to enable/disable premium features
3. **Create admin panel** to manually manage user subscriptions

Example:

```typescript
// Check if user is paid
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { isPaid: true },
});

if (user.isPaid) {
  // Enable premium features
}
```

---

**Need Help?** Check the detailed guides:

- 📖 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Full troubleshooting
- 📋 [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Technical details
- 📚 [README.md](./README.md#prisma) - General Prisma setup

---

**Status**: ✅ Ready to apply
**Time Required**: ⚡ ~30 seconds
**Risk**: 🟢 Very Low (safe, tested migration)
