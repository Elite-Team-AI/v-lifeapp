-- Create app_ratings table and RLS policies
-- This enables the /admin/ratings page and user rating submission

-- Create the table
CREATE TABLE IF NOT EXISTS app_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own ratings
CREATE POLICY "Users can create ratings" ON app_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own ratings
CREATE POLICY "Users can view their ratings" ON app_ratings
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all ratings
CREATE POLICY "Admins can view all ratings" ON app_ratings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
