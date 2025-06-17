/*
  # Add Gamification System

  1. New Tables
    - `user_achievement_profiles` - Stores user progression data
    - `user_achievements` - Tracks individual achievements for users
    - `achievement_events` - Logs achievement-related events

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create user achievement profiles table
CREATE TABLE IF NOT EXISTS user_achievement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  leagues_joined TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create achievement events table
CREATE TABLE IF NOT EXISTS achievement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  achievement_id TEXT,
  league_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_achievement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievement_profiles
CREATE POLICY "Users can view their own achievement profiles"
  ON user_achievement_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement profiles"
  ON user_achievement_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement profiles"
  ON user_achievement_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for achievement_events
CREATE POLICY "Users can view their own achievement events"
  ON achievement_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement events"
  ON achievement_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update achievement_profiles on achievement unlock
CREATE OR REPLACE FUNCTION update_user_points_on_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
  achievement_points INTEGER;
BEGIN
  -- Only proceed if achievement was just unlocked
  IF NEW.unlocked = TRUE AND (OLD IS NULL OR OLD.unlocked = FALSE) THEN
    -- Determine points based on achievement_id (simplified example)
    CASE NEW.achievement_id
      WHEN 'salary_manager_1' THEN achievement_points := 50;
      WHEN 'salary_manager_2' THEN achievement_points := 100;
      WHEN 'contract_master_1' THEN achievement_points := 50;
      WHEN 'contract_master_2' THEN achievement_points := 100;
      WHEN 'league_owner' THEN achievement_points := 200;
      WHEN 'multi_league' THEN achievement_points := 150;
      WHEN 'trade_simulator' THEN achievement_points := 75;
      WHEN 'dead_cap_manager' THEN achievement_points := 100;
      WHEN 'data_exporter' THEN achievement_points := 50;
      WHEN 'perfect_cap' THEN achievement_points := 150;
      ELSE achievement_points := 25; -- Default points
    END CASE;
    
    -- Update user's points
    UPDATE user_achievement_profiles
    SET 
      points = points + achievement_points,
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Log the achievement event
    INSERT INTO achievement_events (
      user_id,
      event_type,
      points,
      achievement_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'achievement_unlocked',
      achievement_points,
      NEW.achievement_id,
      jsonb_build_object('achievement_name', NEW.achievement_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for achievement unlocks
CREATE TRIGGER on_achievement_unlock
AFTER INSERT OR UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION update_user_points_on_achievement_unlock();

-- Create function to update user level based on points
CREATE OR REPLACE FUNCTION update_user_level_based_on_points()
RETURNS TRIGGER AS $$
DECLARE
  next_level_points INTEGER;
  current_level INTEGER;
BEGIN
  current_level := NEW.level;
  
  -- Calculate points needed for next level (simplified formula)
  next_level_points := FLOOR(100 * POWER(1.5, current_level - 1));
  
  -- Check if user has enough points to level up
  WHILE NEW.points >= next_level_points LOOP
    current_level := current_level + 1;
    next_level_points := FLOOR(100 * POWER(1.5, current_level - 1));
  END LOOP;
  
  -- Update level if changed
  IF current_level > NEW.level THEN
    NEW.level := current_level;
    
    -- Log the level up event
    INSERT INTO achievement_events (
      user_id,
      event_type,
      points,
      metadata
    ) VALUES (
      NEW.user_id,
      'level_up',
      0,
      jsonb_build_object('new_level', current_level)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level ups
CREATE TRIGGER on_points_update
BEFORE UPDATE ON user_achievement_profiles
FOR EACH ROW
WHEN (NEW.points > OLD.points)
EXECUTE FUNCTION update_user_level_based_on_points();