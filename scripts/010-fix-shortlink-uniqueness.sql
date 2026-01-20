-- Drop the old unique constraint on short_code
ALTER TABLE shortened_urls DROP CONSTRAINT IF EXISTS shortened_urls_short_code_key;

-- Add a composite unique constraint: user_id + short_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortened_urls_user_code 
ON shortened_urls(user_id, short_code);

-- Add index for fast lookups by short_code only (for routing)
CREATE INDEX IF NOT EXISTS idx_shortened_urls_code 
ON shortened_urls(short_code);