-- ============================================
-- DELETE ALL GENERIC DRILLS FROM DATABASE
-- This gives you a clean slate - only custom AI drills
-- ============================================

-- STEP 1: Add the columns (if you haven't already)
ALTER TABLE drills ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS instructions JSONB;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS metadata JSONB;

-- STEP 2: Mark existing drills
UPDATE drills SET is_custom = false WHERE is_custom IS NULL;

-- STEP 3: DELETE ALL GENERIC DRILLS PERMANENTLY
-- WARNING: This removes all pre-seeded drills!
DELETE FROM drills WHERE is_custom = false OR is_custom IS NULL;

-- STEP 4: Make column NOT NULL
ALTER TABLE drills ALTER COLUMN is_custom SET DEFAULT false;
ALTER TABLE drills ALTER COLUMN is_custom SET NOT NULL;

-- STEP 5: Indexes
CREATE INDEX IF NOT EXISTS idx_drills_is_custom ON drills(is_custom);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);

-- Verify - should show 0 drills after running
SELECT COUNT(*) as remaining_drills FROM drills;
