-- Add affiliate status column to profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "is_affiliate" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "affiliate_approved_at" timestamp with time zone;

-- Create an index for faster affiliate checks
CREATE INDEX IF NOT EXISTS "idx_profiles_is_affiliate" ON "public"."profiles" ("is_affiliate")
WHERE "is_affiliate" = true;

-- Add comments explaining the columns
COMMENT ON COLUMN "public"."profiles"."is_affiliate" IS 'Indicates if the user is an approved affiliate with enhanced referral benefits (2x credits per referral)';
COMMENT ON COLUMN "public"."profiles"."affiliate_approved_at" IS 'Timestamp when the user was approved as an affiliate';
