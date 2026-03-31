-- Check for users who completed onboarding but have missing profile data
-- This identifies users who may need to re-enter their information

SELECT
  id,
  name,
  created_at,
  updated_at,
  onboarding_completed,
  -- Check which key fields are missing
  CASE WHEN age IS NULL THEN 'missing' ELSE 'present' END as age_status,
  CASE WHEN height_feet IS NULL THEN 'missing' ELSE 'present' END as height_status,
  CASE WHEN weight IS NULL THEN 'missing' ELSE 'present' END as weight_status,
  CASE WHEN goal_weight IS NULL THEN 'missing' ELSE 'present' END as goal_weight_status,
  CASE WHEN primary_goal IS NULL THEN 'missing' ELSE 'present' END as primary_goal_status,
  CASE WHEN gym_access IS NULL THEN 'missing' ELSE 'present' END as gym_access_status
FROM profiles
WHERE onboarding_completed = true
  AND (
    age IS NULL OR
    height_feet IS NULL OR
    weight IS NULL OR
    primary_goal IS NULL
  )
ORDER BY created_at DESC;

-- Summary count
SELECT
  COUNT(*) as total_users_with_onboarding_completed,
  COUNT(CASE WHEN age IS NULL THEN 1 END) as missing_age,
  COUNT(CASE WHEN height_feet IS NULL THEN 1 END) as missing_height,
  COUNT(CASE WHEN weight IS NULL THEN 1 END) as missing_weight,
  COUNT(CASE WHEN primary_goal IS NULL THEN 1 END) as missing_goal
FROM profiles
WHERE onboarding_completed = true;
