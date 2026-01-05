-- Add custom domain configuration options
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS use_domain_for_shortlinks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS root_domain_mode VARCHAR(20) DEFAULT 'bio',
ADD COLUMN IF NOT EXISTS root_domain_redirect_url TEXT;

-- Set default values for existing users with custom domains
UPDATE users 
SET use_domain_for_shortlinks = true, 
    root_domain_mode = 'bio'
WHERE custom_domain IS NOT NULL;
