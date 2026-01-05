-- Set the first user as admin (for initial setup)
-- This makes the earliest-created user an admin
UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

