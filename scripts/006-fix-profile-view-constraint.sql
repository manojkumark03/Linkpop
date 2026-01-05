-- Fix the CHECK constraint to allow profile views (neither link_id nor shortlink_id)
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS check_event_link;

-- Add a new constraint that allows all three scenarios:
-- 1. Profile view: both NULL
-- 2. Bio link click: link_id NOT NULL, shortlink_id NULL
-- 3. Shortlink click: link_id NULL, shortlink_id NOT NULL
ALTER TABLE analytics_events
ADD CONSTRAINT check_event_link CHECK (
  (link_id IS NULL AND shortlink_id IS NULL) OR  -- Profile view
  (link_id IS NOT NULL AND shortlink_id IS NULL) OR  -- Bio link click
  (link_id IS NULL AND shortlink_id IS NOT NULL)     -- Shortlink click
);

-- Add event_subtype for better tracking
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_subtype VARCHAR(50);

-- Add index for profile views
CREATE INDEX IF NOT EXISTS idx_analytics_profile_views 
ON analytics_events(user_id, timestamp DESC) 
WHERE link_id IS NULL AND shortlink_id IS NULL;
