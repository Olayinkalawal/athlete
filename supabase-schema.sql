-- Athlete Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,
    preferred_discipline VARCHAR(50) DEFAULT 'football',
    weekly_sessions_goal INTEGER DEFAULT 5,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Disciplines
CREATE TABLE IF NOT EXISTS disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default disciplines
INSERT INTO disciplines (slug, name, description, icon, color) VALUES
    ('football', 'Football', 'Ball control, passing & shooting', 'Activity', 'white'),
    ('basketball', 'Basketball', 'Shooting mechanics & vertical jump', 'CircleDot', 'orange'),
    ('boxing', 'Boxing', 'Footwork, jabs & defense', 'Swords', 'red'),
    ('mma', 'MMA', 'Grappling & striking mix', 'Flame', 'yellow'),
    ('taekwondo', 'Taekwondo', 'Flexibility & high kicks', 'Footprints', 'emerald'),
    ('american-football', 'American Football', 'Routes & strength', 'Shield', 'blue')
ON CONFLICT (slug) DO NOTHING;

-- Drills
CREATE TABLE IF NOT EXISTS drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    difficulty VARCHAR(20) DEFAULT 'intermediate',
    xp_reward INTEGER DEFAULT 20,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES disciplines(id),
    title VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    calories_burned INTEGER DEFAULT 0,
    accuracy_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress (drill completions)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    drill_id UUID REFERENCES drills(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0
);

-- Session plan items (drills planned for a session)
CREATE TABLE IF NOT EXISTS session_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    checked BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_items_session_id ON session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_user_id ON session_items(user_id);

-- User stats (aggregated)
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    total_drills_completed INTEGER DEFAULT 0,
    total_calories_burned INTEGER DEFAULT 0,
    total_training_minutes INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    avg_accuracy DECIMAL(5,2) DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_drills_discipline_id ON drills(discipline_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (clerk_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (clerk_id = current_setting('app.current_user_id', true));

-- Session Items policies
DROP POLICY IF EXISTS "Users can view own session items" ON session_items;
CREATE POLICY "Users can view own session items" ON session_items
FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

DROP POLICY IF EXISTS "Users can insert own session items" ON session_items;
CREATE POLICY "Users can insert own session items" ON session_items
FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

DROP POLICY IF EXISTS "Users can update own session items" ON session_items;
CREATE POLICY "Users can update own session items" ON session_items
FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

DROP POLICY IF EXISTS "Users can delete own session items" ON session_items;
CREATE POLICY "Users can delete own session items" ON session_items
FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

-- User Videos (for uploaded analysis content)
CREATE TABLE IF NOT EXISTS user_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    size_bytes BIGINT,
    duration_seconds INTEGER,
    discipline VARCHAR(50) DEFAULT 'football',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for discipline-specific video queries
CREATE INDEX IF NOT EXISTS idx_user_videos_discipline ON user_videos(user_id, discipline);

-- RLS for Videos
ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own videos" ON user_videos;
CREATE POLICY "Users can view own videos" ON user_videos
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
    ));

DROP POLICY IF EXISTS "Users can insert own videos" ON user_videos;
CREATE POLICY "Users can insert own videos" ON user_videos
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
    ));

DROP POLICY IF EXISTS "Users can delete own videos" ON user_videos;
CREATE POLICY "Users can delete own videos" ON user_videos
    FOR DELETE USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
    ));

-- Storage Bucket & Policies (Fixes 'Upload Failed')
-- Ensure bucket exists (This usually requires doing it in UI, but this helps)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-videos', 'training-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow ANYONE to upload (since we are syncing auth separately)
-- In production, you'd want to couple this with authenticated roles
DROP POLICY IF EXISTS "Public Uploads" ON storage.objects;
CREATE POLICY "Public Uploads" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'training-videos');

DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects
FOR SELECT
USING (bucket_id = 'training-videos');

-- Video Analyses (AI-generated technique feedback)
CREATE TABLE IF NOT EXISTS video_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES user_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_text TEXT NOT NULL,
    discipline VARCHAR(50) DEFAULT 'football',
    frame_count INTEGER DEFAULT 3,
    model_used VARCHAR(50) DEFAULT 'gpt-4-vision-preview',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_analyses_video_id ON video_analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id ON video_analyses(user_id);

-- RLS for Video Analyses
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analyses" ON video_analyses;
CREATE POLICY "Users can view own analyses" ON video_analyses
FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

DROP POLICY IF EXISTS "Users can insert own analyses" ON video_analyses;
CREATE POLICY "Users can insert own analyses" ON video_analyses
FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

DROP POLICY IF EXISTS "Users can delete own analyses" ON video_analyses;
CREATE POLICY "Users can delete own analyses" ON video_analyses
FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('app.current_user_id', true)
));

-- ============================================
-- MIGRATION: Add discipline column if upgrading
-- (Safe to run on both new and existing databases)
-- ============================================

-- Add discipline column to user_videos (ignore error if exists)
ALTER TABLE user_videos ADD COLUMN IF NOT EXISTS discipline VARCHAR(50) DEFAULT 'football';

-- Set existing videos to football discipline  
UPDATE user_videos SET discipline = 'football' WHERE discipline IS NULL;

-- ============================================
-- MIGRATION: Add drill columns if upgrading
-- ============================================

ALTER TABLE drills ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Technique';

-- ============================================
-- SEED: Drill data for all disciplines
-- ============================================

-- Clear existing drills first (for clean re-seed)
-- DELETE FROM drills; -- Uncomment to reset

-- Football drills
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('Free Kick Precision', 'Master curve and power on set pieces', 'Technique', 15, 'intermediate', 25, 'https://images.unsplash.com/photo-1628779238951-be2c9f2a0758?w=800'),
    ('Agility Ladder', 'Quick feet drills for speed improvement', 'Speed', 10, 'beginner', 15, 'https://images.unsplash.com/photo-1543326727-2b7e6718d052?w=800'),
    ('Wall Passes', 'One-touch passing against wall', 'Technique', 12, 'beginner', 20, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'),
    ('Shuttle Runs', 'Sprint intervals for endurance', 'Cardio', 20, 'advanced', 30, 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'football'
ON CONFLICT DO NOTHING;

-- Basketball drills  
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('Free Throw Practice', 'Consistent shooting form from the line', 'Shooting', 15, 'beginner', 20, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'),
    ('Vertical Jump Training', 'Plyometric exercises for explosion', 'Strength', 20, 'intermediate', 30, 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800'),
    ('Ball Handling Drills', 'Crossovers, behind-back, through legs', 'Technique', 15, 'intermediate', 25, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800'),
    ('Defensive Slides', 'Lateral movement and stance work', 'Defense', 12, 'beginner', 20, 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'basketball'
ON CONFLICT DO NOTHING;

-- Boxing drills
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('Shadow Boxing', 'Technique practice without bag', 'Technique', 15, 'beginner', 20, 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800'),
    ('Heavy Bag Combos', 'Power punching combinations', 'Power', 20, 'intermediate', 30, 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=800'),
    ('Footwork Drills', 'Lateral movement and pivots', 'Footwork', 12, 'beginner', 15, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'),
    ('Speed Bag Rhythm', 'Hand-eye coordination and timing', 'Speed', 10, 'intermediate', 25, 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'boxing'
ON CONFLICT DO NOTHING;

-- MMA drills
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('Ground & Pound', 'Top position striking practice', 'Striking', 15, 'intermediate', 25, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'),
    ('Takedown Defense', 'Sprawl and counter techniques', 'Wrestling', 20, 'advanced', 35, 'https://images.unsplash.com/photo-1564415637254-92c6e4b0c1b1?w=800'),
    ('Clinch Work', 'Close range control and strikes', 'Technique', 15, 'intermediate', 25, 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=800'),
    ('Conditioning Circuit', 'MMA-specific cardio training', 'Cardio', 25, 'advanced', 40, 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'mma'
ON CONFLICT DO NOTHING;

-- Taekwondo drills
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('High Kick Flexibility', 'Stretching for head-height kicks', 'Flexibility', 20, 'intermediate', 25, 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800'),
    ('Roundhouse Kick Combo', 'Speed and power kick sequences', 'Technique', 15, 'intermediate', 30, 'https://images.unsplash.com/photo-1591258370467-9d3c2e1c3c8a?w=800'),
    ('Poomsae Practice', 'Form and pattern training', 'Forms', 20, 'beginner', 20, 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800'),
    ('Sparring Drills', 'Point fighting techniques', 'Sparring', 25, 'advanced', 35, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'taekwondo'
ON CONFLICT DO NOTHING;

-- American Football drills
INSERT INTO drills (discipline_id, title, description, category, duration_minutes, difficulty, xp_reward, image_url)
SELECT d.id, drill.title, drill.description, drill.category, drill.duration, drill.difficulty, drill.xp, drill.image
FROM disciplines d,
(VALUES
    ('Route Running', 'Precise cuts and timing patterns', 'Technique', 20, 'intermediate', 30, 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'),
    ('Blocking Fundamentals', 'Stance, footwork, and leverage', 'Strength', 15, 'beginner', 20, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'),
    ('Cone Drills', 'Change of direction speed work', 'Speed', 12, 'beginner', 15, 'https://images.unsplash.com/photo-1543326727-2b7e6718d052?w=800'),
    ('Catching Under Pressure', 'Contested catch practice', 'Receiving', 15, 'intermediate', 25, 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800')
) AS drill(title, description, category, duration, difficulty, xp, image)
WHERE d.slug = 'american-football'
ON CONFLICT DO NOTHING;
