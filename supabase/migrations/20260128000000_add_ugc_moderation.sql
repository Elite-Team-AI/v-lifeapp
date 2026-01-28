-- Add User-Generated Content moderation tables for Apple App Store compliance
-- Guideline 1.2: Apps with user-generated content must have mechanisms to:
-- - Filter objectionable content
-- - Block abusive users
-- - Report objectionable content to the developer

-- User blocks table
-- Allows users to block other users, hiding their content from their feed
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Post reports table
-- Allows users to report objectionable content
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(post_id, reporter_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter ON post_reports(reporter_id);

-- Enable Row Level Security
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blocks
-- Users can view their own blocks
CREATE POLICY "Users can view own blocks" ON user_blocks
  FOR SELECT USING (blocker_id = auth.uid());

-- Users can create blocks
CREATE POLICY "Users can create blocks" ON user_blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks" ON user_blocks
  FOR DELETE USING (blocker_id = auth.uid());

-- RLS Policies for post_reports
-- Users can create reports
CREATE POLICY "Users can create reports" ON post_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON post_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Admins can view and update all reports
CREATE POLICY "Admins can view all reports" ON post_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports" ON post_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Comment on tables for documentation
COMMENT ON TABLE user_blocks IS 'Tracks which users have blocked other users. Used for content filtering.';
COMMENT ON TABLE post_reports IS 'Tracks user reports of objectionable content. Reviewed within 24 hours per Apple guidelines.';
