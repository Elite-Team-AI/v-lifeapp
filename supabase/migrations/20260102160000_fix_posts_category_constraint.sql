-- Fix posts category CHECK constraint to include 'motivation'
-- This was causing posts to silently fail when users selected "Motivation" category

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Add the updated constraint with 'motivation' included
ALTER TABLE posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('achievement', 'workout', 'nutrition', 'motivation', 'general'));
