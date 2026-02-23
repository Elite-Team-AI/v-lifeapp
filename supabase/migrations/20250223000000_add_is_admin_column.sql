-- Add is_admin column to profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false;

-- Create an index for faster admin checks
CREATE INDEX IF NOT EXISTS "idx_profiles_is_admin" ON "public"."profiles" ("is_admin")
WHERE "is_admin" = true;

-- Add a comment explaining the column
COMMENT ON COLUMN "public"."profiles"."is_admin" IS 'Indicates if the user has admin privileges for accessing admin-only features';
