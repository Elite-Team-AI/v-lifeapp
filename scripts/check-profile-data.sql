-- Run this query in your Supabase SQL Editor to check what profile data exists
-- Replace 'YOUR_USER_ID' with your actual user ID

SELECT
  id,
  name,
  age,
  gender,
  height_feet,
  height_inches,
  weight,
  goal_weight,
  primary_goal,
  activity_level,
  gym_access,
  selected_gym,
  custom_equipment,
  allergies,
  custom_restrictions,
  training_style,
  available_time_minutes,
  training_days_per_week,
  calorie_goal,
  onboarding_completed,
  created_at,
  updated_at
FROM profiles
WHERE id = 'YOUR_USER_ID';

-- To get your user ID, you can run:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
