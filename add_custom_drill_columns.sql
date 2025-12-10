-- ============================================
-- CRITICAL: Run this SQL in Supabase SQL Editor
-- to enable custom drill features
-- ============================================

-- Add columns for AI-generated custom drills
ALTER TABLE drills ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS instructions JSONB;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Technique';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_drills_is_custom ON drills(is_custom);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);

-- Add comments for documentation
COMMENT ON COLUMN drills.is_custom IS 'True if this drill was AI-generated for a specific user';
COMMENT ON COLUMN drills.created_by IS 'Clerk user ID who generated this custom drill';
COMMENT ON COLUMN drills.instructions IS 'Array of step-by-step instructions';
COMMENT ON COLUMN drills.metadata IS 'Additional data: {target_weakness, why_it_helps, generated_from_analysis}';
