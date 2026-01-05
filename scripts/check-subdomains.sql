-- Check if subdomain column exists and is populated
-- Run this to diagnose subdomain issues

-- Check if subdomain column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'subdomain';

-- Count users with missing subdomains
SELECT 
  COUNT(*) as total_users,
  COUNT(subdomain) as users_with_subdomain,
  COUNT(*) - COUNT(subdomain) as missing_subdomains
FROM users;

-- Show users with missing subdomains
SELECT id, username, email, subdomain, created_at
FROM users
WHERE subdomain IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Show sample of users with subdomains
SELECT id, username, subdomain
FROM users
WHERE subdomain IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Fix: Populate missing subdomains
UPDATE users 
SET subdomain = LOWER(username) 
WHERE subdomain IS NULL;

-- Verify fix
SELECT 
  CASE 
    WHEN COUNT(*) FILTER (WHERE subdomain IS NULL) = 0 THEN 'All subdomains populated ✓'
    ELSE 'Still missing subdomains: ' || COUNT(*) FILTER (WHERE subdomain IS NULL)
  END as status
FROM users;
