-- Modify bio_links table to support different block types
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS block_type VARCHAR(50) DEFAULT 'link';
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS block_data JSONB DEFAULT '{}'::jsonb;

-- block_type can be: 'link', 'page', 'accordion', 'copy-text', 'social'
-- block_data stores type-specific configuration
