-- Set mtjohnston42@gmail.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'mtjohnston42@gmail.com'
);

