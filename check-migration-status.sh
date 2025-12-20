#!/bin/bash

# Linkforest Migration Status Check
# Verifies if the isPaid migration has been applied

set -e

echo "🔍 Linkforest Migration Status Check"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f "apps/web/.env" ]; then
    echo "❌ apps/web/.env file not found!"
    echo ""
    echo "⚠️  You need to create it first:"
    echo "   cp apps/web/.env.example apps/web/.env"
    echo "   # Then edit and set your DATABASE_URL"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" apps/web/.env; then
    echo "❌ DATABASE_URL not found in apps/web/.env"
    echo ""
    echo "⚠️  Please add your DATABASE_URL to apps/web/.env"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Navigate to web app
cd apps/web

echo "📊 Checking migration status..."
echo ""

# Run Prisma migrate status (read-only check)
if pnpm prisma migrate status 2>&1 | grep -q "No pending migrations"; then
    echo "✅ All migrations are applied!"
    echo ""
    echo "The User.isPaid field should be in your database."
    echo ""
    echo "To verify, run: pnpm db:studio"
else
    echo "⚠️  You have pending migrations!"
    echo ""
    echo "The User.isPaid field is NOT in your database yet."
    echo ""
    echo "To apply migrations, run:"
    echo "   ./apply-migration.sh"
    echo ""
    echo "Or from apps/web directory:"
    echo "   cd apps/web"
    echo "   pnpm db:migrate"
fi

echo ""
echo "Migration history:"
echo "------------------"
pnpm prisma migrate status 2>/dev/null || echo "Could not check migration status. Make sure your database is accessible."

echo ""
echo "For more help, see: MIGRATION_GUIDE.md"
