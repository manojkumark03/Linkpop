-- Populate subdomain field for existing users
-- This ensures all users have a subdomain matching their username

UPDATE users 
SET subdomain = LOWER(username) 
WHERE subdomain IS NULL;

-- Verify all users have subdomains
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM users WHERE subdomain IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION '% users still missing subdomains', missing_count;
  ELSE
    RAISE NOTICE 'All users have subdomains populated successfully';
  END IF;
END $$;
