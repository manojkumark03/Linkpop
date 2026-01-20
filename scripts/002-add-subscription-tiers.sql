-- Add subscription tier to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'pro';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whop_user_id VARCHAR(255);

-- Add custom domain support columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;

-- Add custom JS and background customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_js TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_type VARCHAR(20) DEFAULT 'gradient';
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_value TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS button_style JSONB DEFAULT '{"borderRadius": "8px", "shadow": true}'::jsonb;

-- Create index for custom domains
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain) WHERE custom_domain IS NOT NULL;

-- Create index for Whop user ID
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id) WHERE whop_user_id IS NOT NULL;
