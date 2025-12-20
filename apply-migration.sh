#!/bin/bash

# Linkforest Database Migration Script
# Safely applies the isPaid field migration to the User table

set -e  # Exit on any error

echo "🔍 Linkforest Database Migration"
echo "================================"
echo ""
echo "This script will apply the pending database migration to add the 'isPaid' field to the User table."
echo ""

# Check if .env file exists
if [ ! -f "apps/web/.env" ]; then
    echo "❌ Error: apps/web/.env file not found!"
    echo ""
    echo "Please create it from the example:"
    echo "  cp apps/web/.env.example apps/web/.env"
    echo ""
    echo "Then edit apps/web/.env and set your DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" apps/web/.env; then
    echo "❌ Error: DATABASE_URL not found in apps/web/.env"
    echo ""
    echo "Please add your DATABASE_URL to apps/web/.env"
    echo "Example: DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/linkforest?schema=public\""
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Navigate to web app directory
cd apps/web

echo "📦 Checking Prisma installation..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed!"
    echo "Please install it with: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm found"
echo ""

echo "🔄 Running database migration..."
echo ""

# Run the migration
pnpm db:migrate

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your development server if it's running"
echo "2. Try registering a new user - the error should be gone"
echo "3. Check the User table with: pnpm db:studio"
echo ""
echo "🎉 All done!"
