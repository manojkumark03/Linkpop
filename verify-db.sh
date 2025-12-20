#!/bin/bash
# Database Verification Script
# Run this to verify the database is in a stable state

set -e

echo "🔍 Verifying Linkforest Database State..."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running or not accessible"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q postgres; then
    echo "❌ PostgreSQL container is not running"
    echo "💡 Start it with: docker compose up -d"
    exit 1
fi

echo "✅ PostgreSQL container is running"

# Change to web directory
cd "$(dirname "$0")/apps/web"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found in apps/web/"
    echo "💡 Copy from .env.example: cp .env.example .env"
    exit 1
fi

echo "✅ .env file exists"

# Validate Prisma schema
echo ""
echo "📋 Validating Prisma schema..."
if pnpm prisma validate > /dev/null 2>&1; then
    echo "✅ Prisma schema is valid"
else
    echo "❌ Prisma schema validation failed"
    exit 1
fi

# Check migration status
echo ""
echo "🔄 Checking migration status..."
MIGRATION_OUTPUT=$(pnpm prisma migrate status 2>&1)

if echo "$MIGRATION_OUTPUT" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is up to date"
    
    # Count migrations
    MIGRATION_COUNT=$(echo "$MIGRATION_OUTPUT" | grep -oP '\d+(?= migration)' | head -1)
    echo "✅ Found $MIGRATION_COUNT migration(s)"
    
    # List migrations
    echo ""
    echo "📁 Current migrations:"
    ls -1 prisma/migrations/ | grep -E '^[0-9]' || echo "  (none)"
else
    echo "⚠️  Database schema needs attention:"
    echo "$MIGRATION_OUTPUT"
    exit 1
fi

# Test database connection
echo ""
echo "🔌 Testing database connection..."
if pnpm prisma db push --skip-generate > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All checks passed! Database is in a stable state."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Useful commands:"
echo "  - Start dev server:    pnpm dev"
echo "  - View database:       pnpm prisma studio"
echo "  - Check migrations:    pnpm prisma migrate status"
echo "  - Create migration:    pnpm prisma migrate dev --name feature_name"
echo ""
