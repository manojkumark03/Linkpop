-- Add custom_html field to users table for embedding custom HTML snippets
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_html TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.custom_html IS 'Custom HTML for public profile (e.g. analytics pixels, tracking scripts)';
