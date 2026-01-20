-- Add custom_html field to bio_links for page blocks
-- This allows users to embed HTML scripts like Google Analytics
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS custom_html TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bio_links.custom_html IS 'Custom HTML/scripts for page blocks (e.g. analytics, tracking pixels)';
