-- Add subdomain column for free multi-tenant support
ALTER TABLE users ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255) UNIQUE;

-- Create index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_users_subdomain ON users(subdomain) WHERE subdomain IS NOT NULL;

-- Drop old analytics table
DROP TABLE IF EXISTS analytics CASCADE;

-- Create new enterprise-level analytics table
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'view' or 'click'
  
  -- Link/Page Context
  link_id UUID REFERENCES bio_links(id) ON DELETE CASCADE,
  shortlink_id UUID REFERENCES shortened_urls(id) ON DELETE CASCADE,
  target_url TEXT,
  
  -- Time Data
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User Agent & Device
  user_agent TEXT,
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(50), -- mobile/desktop/tablet
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  
  -- Geographic Data
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Referrer Data  
  referrer TEXT,
  referrer_platform VARCHAR(100), -- parsed: instagram, twitter, direct, etc.
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  
  -- Constraints
  CONSTRAINT check_event_link CHECK (
    (link_id IS NOT NULL AND shortlink_id IS NULL) OR
    (link_id IS NULL AND shortlink_id IS NOT NULL)
  )
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_timestamp ON analytics_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_link_timestamp ON analytics_events(link_id, timestamp DESC) WHERE link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_shortlink_timestamp ON analytics_events(shortlink_id, timestamp DESC) WHERE shortlink_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_referrer_platform ON analytics_events(referrer_platform) WHERE referrer_platform IS NOT NULL;
