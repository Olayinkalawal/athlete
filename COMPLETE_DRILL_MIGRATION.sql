-- ============================================
-- COMPLETE SQL MIGRATION FOR CUSTOM DRILLS
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Step 1: Add new columns to drills table
ALTER TABLE drills ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS instructions JSONB;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Step 2: CRITICAL - Set all existing drills to is_custom = false
-- This ensures old generic drills are marked as NOT custom
UPDATE drills SET is_custom = false WHERE is_custom IS NULL;

-- Step 3: Make is_custom NOT NULL going forward
ALTER TABLE drills ALTER COLUMN is_custom SET DEFAULT false;
ALTER TABLE drills ALTER COLUMN is_custom SET NOT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drills_is_custom ON drills(is_custom);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);

-- Step 5: Add helpful comments
COMMENT ON COLUMN drills.is_custom IS 'True if AI-generated custom drill, false for generic drills';
COMMENT ON COLUMN drills.created_by IS 'Clerk user ID who generated this custom drill (NULL for generic)';
COMMENT ON COLUMN drills.instructions IS 'Array of step-by-step instructions for custom drills';
COMMENT ON COLUMN drills.metadata IS 'Additional data: {target_weakness, why_it_helps, generated_from_analysis}';

-- Verification query - run this to check it worked
SELECT 
    COUNT(*) as total_drills,
    COUNT(*) FILTER (WHERE is_custom = true) as custom_drills,
    COUNT(*) FILTER (WHERE is_custom = false) as generic_drills
FROM drills;
