-- Add body fat percentage columns to profiles table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,1) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
ADD COLUMN IF NOT EXISTS goal_body_fat_percentage DECIMAL(4,1) CHECK (goal_body_fat_percentage >= 0 AND goal_body_fat_percentage <= 100);

COMMENT ON COLUMN profiles.body_fat_percentage IS 'User''s current body fat percentage (optional, more important than weight for fitness/nutrition planning)';
COMMENT ON COLUMN profiles.goal_body_fat_percentage IS 'User''s target body fat percentage (optional, prioritized over goal_weight for AI planning)';
