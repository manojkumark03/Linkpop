-- Add domain deployment status tracking
-- Values: 'pending' | 'dns_verified' | 'deploying' | 'active' | 'failed'

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS domain_deployment_status VARCHAR(20) DEFAULT 'pending';

-- Update existing verified domains to 'active' status
UPDATE users
SET domain_deployment_status = 'active'
WHERE domain_verified = true AND custom_domain IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_domain_deployment 
ON users(domain_deployment_status) 
WHERE custom_domain IS NOT NULL;

COMMIT;
