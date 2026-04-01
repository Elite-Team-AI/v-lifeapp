-- =====================================================
-- ADD BODY COMPOSITION TRACKING FIELDS
-- =====================================================
-- This migration adds body fat percentage tracking fields
-- to support more accurate progress measurement than weight alone
-- Migration created: 2026-04-01 00:00:00

-- Add current body fat percentage (3-60% range is realistic for humans)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,1)
CHECK (body_fat_percentage >= 3.0 AND body_fat_percentage <= 60.0);

-- Add goal body fat percentage
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS goal_body_fat_percentage DECIMAL(4,1)
CHECK (goal_body_fat_percentage >= 3.0 AND goal_body_fat_percentage <= 60.0);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.profiles.body_fat_percentage IS
  'Current body fat percentage (3-60%). More accurate than weight for tracking fitness progress. Optional field.';

COMMENT ON COLUMN public.profiles.goal_body_fat_percentage IS
  'Target body fat percentage (3-60%). Used for progress tracking and AI workout/nutrition planning. Optional field.';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if body_fat_percentage column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'body_fat_percentage'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: body_fat_percentage column not created';
  END IF;

  -- Check if goal_body_fat_percentage column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'goal_body_fat_percentage'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: goal_body_fat_percentage column not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully: Body composition fields added to profiles table';
END $$;
