-- Check for profiles with NULL or empty names
SELECT 
  id,
  name,
  email,
  created_at,
  onboarding_completed
FROM public.profiles
WHERE name IS NULL 
   OR name = '' 
   OR TRIM(name) = ''
ORDER BY created_at DESC
LIMIT 10;
