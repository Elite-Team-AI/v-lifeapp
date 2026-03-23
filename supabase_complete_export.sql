-- ============================================================================
-- SUPABASE COMPLETE DATABASE EXPORT
-- V-Life Fitness & Wellness App
-- ============================================================================
-- 
-- This file contains the complete database schema for duplicating the
-- Supabase project. It includes all tables, functions, triggers, policies,
-- indexes, and extensions from all migrations.
--
-- Generated: $(date)
-- Total Migrations: 43
-- 
-- IMPORTANT: Execute this file in a fresh Supabase project to recreate
-- the complete database structure.
--
-- ============================================================================

-- Set session parameters for safe execution
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- SCHEMA
-- ============================================================================

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- AI Food Logging System Migration
-- This table stores user-logged food entries with AI-parsed nutritional data

-- ============================================================================
-- FOOD LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Food details (AI-parsed or user-entered)
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(8,2) DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  
  -- Nutritional information
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(6,2) DEFAULT 0,
  carbs DECIMAL(6,2) DEFAULT 0,
  fat DECIMAL(6,2) DEFAULT 0,
  fiber DECIMAL(6,2) DEFAULT 0,
  sugar DECIMAL(6,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  
  -- Meal categorization
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  
  -- Date/time tracking
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI parsing metadata
  original_input TEXT,
  input_type TEXT DEFAULT 'text' CHECK (input_type IN ('text', 'voice', 'image', 'manual')),
  image_url TEXT,
  ai_confidence DECIMAL(3,2),
  ai_parsed_data JSONB,
  
  -- Edit tracking
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type ON food_logs(user_id, meal_type, logged_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_date_desc ON food_logs(logged_date DESC);

-- RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food logs" ON food_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own food logs" ON food_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs" ON food_logs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs" ON food_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_food_logs_updated_at 
  BEFORE UPDATE ON food_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Achievements for food logging
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, sort_order)
VALUES 
  ('first_food_log', 'First Bite', 'Log your first food entry', '🍽️', 'nutrition', 25, 30),
  ('food_log_streak_3', 'Consistent Logger', 'Log food for 3 days in a row', '📝', 'nutrition', 50, 31),
  ('food_log_streak_7', 'Week of Tracking', 'Log food for 7 days in a row', '🗓️', 'nutrition', 100, 32),
  ('food_log_50', 'Food Diary Pro', 'Log 50 food entries', '📚', 'nutrition', 150, 33),
  ('daily_log_complete', 'Full Day Tracker', 'Log all 4 meals in one day', '✅', 'nutrition', 75, 34)
ON CONFLICT (slug) DO NOTHING;

-- Helper function: Get daily food log totals
CREATE OR REPLACE FUNCTION get_daily_food_totals(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_calories INTEGER,
  total_protein DECIMAL,
  total_carbs DECIMAL,
  total_fat DECIMAL,
  total_fiber DECIMAL,
  meal_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(fl.calories), 0)::INTEGER as total_calories,
    COALESCE(SUM(fl.protein), 0) as total_protein,
    COALESCE(SUM(fl.carbs), 0) as total_carbs,
    COALESCE(SUM(fl.fat), 0) as total_fat,
    COALESCE(SUM(fl.fiber), 0) as total_fiber,
    COUNT(*)::INTEGER as meal_count
  FROM food_logs fl
  WHERE fl.user_id = p_user_id
    AND fl.logged_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get food log streak
CREATE OR REPLACE FUNCTION get_food_log_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_log BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM food_logs fl
      WHERE fl.user_id = p_user_id 
        AND fl.logged_date = check_date
    ) INTO has_log;
    
    IF NOT has_log THEN
      EXIT;
    END IF;
    
    streak := streak + 1;
    check_date := check_date - 1;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add is_admin column to profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false;

-- Create an index for faster admin checks
CREATE INDEX IF NOT EXISTS "idx_profiles_is_admin" ON "public"."profiles" ("is_admin")
WHERE "is_admin" = true;

-- Add a comment explaining the column
COMMENT ON COLUMN "public"."profiles"."is_admin" IS 'Indicates if the user has admin privileges for accessing admin-only features';
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



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert minimal profile data - only columns that exist
  INSERT INTO public.profiles (
    id,
    referral_code,
    credits,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'VLIFE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    0,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_comments_count"("post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$;


ALTER FUNCTION "public"."increment_comments_count"("post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_referral_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."affiliate_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "affiliate_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."affiliate_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "progress" integer DEFAULT 0,
    "completed" boolean DEFAULT false,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challenge_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "challenge_type" "text",
    "target_value" integer,
    "duration_days" integer,
    "start_date" "date",
    "end_date" "date",
    "participants_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenges_challenge_type_check" CHECK (("challenge_type" = ANY (ARRAY['workout'::"text", 'nutrition'::"text", 'habit'::"text", 'steps'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "likes_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" integer NOT NULL,
    "transaction_type" "text",
    "description" "text",
    "referral_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['earned'::"text", 'redeemed'::"text", 'bonus'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workout_id" "uuid",
    "exercise_id" "uuid",
    "set_number" integer,
    "reps" integer,
    "weight" numeric(6,2),
    "duration_seconds" integer,
    "distance" numeric(6,2),
    "notes" "text",
    "logged_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exercise_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "muscle_group" "text",
    "equipment" "text",
    "description" "text",
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exercises_category_check" CHECK (("category" = ANY (ARRAY['strength'::"text", 'cardio'::"text"])))
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid",
    "following_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grocery_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "item_name" "text" NOT NULL,
    "category" "text",
    "quantity" "text",
    "checked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grocery_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "habit_id" "uuid",
    "user_id" "uuid",
    "completed" boolean DEFAULT true,
    "logged_at" "date" DEFAULT CURRENT_DATE,
    "notes" "text"
);


ALTER TABLE "public"."habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text",
    "frequency" "text",
    "current_streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "habits_category_check" CHECK (("category" = ANY (ARRAY['fitness'::"text", 'nutrition'::"text", 'wellness'::"text", 'other'::"text"]))),
    CONSTRAINT "habits_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "meal_id" "uuid",
    "meal_type" "text",
    "consumed_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."meal_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "meal_type" "text",
    "name" "text" NOT NULL,
    "description" "text",
    "calories" integer,
    "protein" numeric(5,2),
    "carbs" numeric(5,2),
    "fat" numeric(5,2),
    "image_url" "text",
    "recipe" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meals_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['Breakfast'::"text", 'Lunch'::"text", 'Dinner'::"text", 'Snack'::"text"])))
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "read" boolean DEFAULT false,
    "clicked" boolean DEFAULT false
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "reaction_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "post_reactions_reaction_type_check" CHECK (("reaction_type" = ANY (ARRAY['heart'::"text", 'celebrate'::"text", 'support'::"text", 'fire'::"text"])))
);


ALTER TABLE "public"."post_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "image_url" "text",
    "category" "text",
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "posts_category_check" CHECK (("category" = ANY (ARRAY['achievement'::"text", 'workout'::"text", 'nutrition'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "gender" "text",
    "height_feet" integer,
    "height_inches" integer,
    "weight" numeric(5,2),
    "goal_weight" numeric(5,2),
    "primary_goal" "text",
    "activity_level" integer,
    "gym_access" "text",
    "selected_gym" "text",
    "custom_equipment" "text",
    "allergies" "text"[],
    "custom_restrictions" "text"[],
    "referral_code" "text" NOT NULL,
    "credits" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_completed" boolean DEFAULT false,
    "notifications_enabled" boolean DEFAULT true,
    "workout_reminders" boolean DEFAULT true,
    "workout_reminder_time" time without time zone DEFAULT '08:00:00'::time without time zone,
    "meal_reminders" boolean DEFAULT true,
    "breakfast_reminder_time" time without time zone DEFAULT '08:00:00'::time without time zone,
    "lunch_reminder_time" time without time zone DEFAULT '12:00:00'::time without time zone,
    "dinner_reminder_time" time without time zone DEFAULT '18:00:00'::time without time zone,
    "progress_updates" boolean DEFAULT true,
    "streak_warnings" boolean DEFAULT true,
    "achievement_notifications" boolean DEFAULT true,
    "habit_reminders" boolean DEFAULT true,
    "push_subscription" "jsonb",
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "last_habit_reset" "date" DEFAULT CURRENT_DATE,
    CONSTRAINT "profiles_activity_level_check" CHECK ((("activity_level" >= 1) AND ("activity_level" <= 5))),
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"]))),
    CONSTRAINT "profiles_gym_access_check" CHECK (("gym_access" = ANY (ARRAY['home'::"text", 'hotel'::"text", 'commercial'::"text", 'none'::"text", 'gym'::"text", 'custom'::"text"]))),
    CONSTRAINT "profiles_primary_goal_check" CHECK (("primary_goal" = ANY (ARRAY['lose-weight'::"text", 'tone-up'::"text", 'build-muscle'::"text", 'lifestyle'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progress_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "image_url" "text" NOT NULL,
    "photo_type" "text",
    "weight" numeric(5,2),
    "note" "text",
    "taken_at" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "progress_photos_photo_type_check" CHECK (("photo_type" = ANY (ARRAY['front'::"text", 'side'::"text", 'back'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."progress_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid",
    "referred_user_id" "uuid",
    "referral_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "credits_earned" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'credited'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "streak_type" "text" NOT NULL,
    "current_streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "last_activity_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplement_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "supplement_id" "uuid",
    "taken" boolean DEFAULT true,
    "logged_at" "date" DEFAULT CURRENT_DATE,
    "notes" "text"
);


ALTER TABLE "public"."supplement_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "benefits" "text"[],
    "recommended_dosage" "text",
    "recommended_time" "text",
    "featured" boolean DEFAULT false,
    "product_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weight_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "weight" numeric(5,2) NOT NULL,
    "change" numeric(5,2),
    "note" "text",
    "logged_at" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weight_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_id" "uuid",
    "exercise_id" "uuid",
    "order_index" integer NOT NULL,
    "sets" integer,
    "reps" "text",
    "weight" numeric(6,2),
    "rest_seconds" integer,
    "duration_seconds" integer,
    "distance" numeric(6,2),
    "pace" "text",
    "calories" integer,
    "completed" boolean DEFAULT false,
    "completed_sets" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "workout_type" "text" DEFAULT 'strength'::"text",
    "duration_minutes" integer,
    "mode" "text" DEFAULT 'sets'::"text",
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workouts_mode_check" CHECK (("mode" = ANY (ARRAY['sets'::"text", 'rounds'::"text"]))),
    CONSTRAINT "workouts_workout_type_check" CHECK (("workout_type" = ANY (ARRAY['strength'::"text", 'cardio'::"text", 'mixed'::"text"])))
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."affiliate_applications"
    ADD CONSTRAINT "affiliate_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_challenge_id_user_id_key" UNIQUE ("challenge_id", "user_id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_logs"
    ADD CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grocery_lists"
    ADD CONSTRAINT "grocery_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_logged_at_key" UNIQUE ("habit_id", "logged_at");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."progress_photos"
    ADD CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_key" UNIQUE ("referred_user_id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplement_logs"
    ADD CONSTRAINT "supplement_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplement_logs"
    ADD CONSTRAINT "supplement_logs_user_id_supplement_id_logged_at_key" UNIQUE ("user_id", "supplement_id", "logged_at");



ALTER TABLE ONLY "public"."supplements"
    ADD CONSTRAINT "supplements_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."supplements"
    ADD CONSTRAINT "supplements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weight_entries"
    ADD CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_workout_id_exercise_id_order_index_key" UNIQUE ("workout_id", "exercise_id", "order_index");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_exercise_logs_user_id" ON "public"."exercise_logs" USING "btree" ("user_id");



CREATE INDEX "idx_exercise_logs_workout_id" ON "public"."exercise_logs" USING "btree" ("workout_id");



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_habit_logs_date" ON "public"."habit_logs" USING "btree" ("logged_at");



CREATE INDEX "idx_habit_logs_habit_id" ON "public"."habit_logs" USING "btree" ("habit_id");



CREATE INDEX "idx_habits_user_id" ON "public"."habits" USING "btree" ("user_id");



CREATE INDEX "idx_meal_logs_user_id" ON "public"."meal_logs" USING "btree" ("user_id");



CREATE INDEX "idx_meals_user_id" ON "public"."meals" USING "btree" ("user_id");



CREATE INDEX "idx_notification_logs_sent_at" ON "public"."notification_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_notification_logs_user_id" ON "public"."notification_logs" USING "btree" ("user_id");



CREATE INDEX "idx_post_reactions_post_id" ON "public"."post_reactions" USING "btree" ("post_id");



CREATE INDEX "idx_posts_category" ON "public"."posts" USING "btree" ("category");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_onboarding_completed" ON "public"."profiles" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_profiles_timezone" ON "public"."profiles" USING "btree" ("timezone");



CREATE INDEX "idx_progress_photos_user_id" ON "public"."progress_photos" USING "btree" ("user_id");



CREATE INDEX "idx_referrals_code" ON "public"."referrals" USING "btree" ("referral_code");



CREATE INDEX "idx_referrals_referrer_id" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_weight_entries_date" ON "public"."weight_entries" USING "btree" ("logged_at" DESC);



CREATE INDEX "idx_weight_entries_user_id" ON "public"."weight_entries" USING "btree" ("user_id");



CREATE INDEX "idx_workout_exercises_workout_id" ON "public"."workout_exercises" USING "btree" ("workout_id");



CREATE INDEX "idx_workouts_completed" ON "public"."workouts" USING "btree" ("completed", "user_id");



CREATE INDEX "idx_workouts_user_id" ON "public"."workouts" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_profile_referral_code" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_referral_code"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_streaks_updated_at" BEFORE UPDATE ON "public"."streaks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workouts_updated_at" BEFORE UPDATE ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_logs"
    ADD CONSTRAINT "exercise_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_logs"
    ADD CONSTRAINT "exercise_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_logs"
    ADD CONSTRAINT "exercise_logs_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grocery_lists"
    ADD CONSTRAINT "grocery_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_photos"
    ADD CONSTRAINT "progress_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplement_logs"
    ADD CONSTRAINT "supplement_logs_supplement_id_fkey" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplement_logs"
    ADD CONSTRAINT "supplement_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weight_entries"
    ADD CONSTRAINT "weight_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view challenges" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view exercises" ON "public"."exercises" FOR SELECT USING (true);



CREATE POLICY "Anyone can view follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Anyone can view participants" ON "public"."challenge_participants" FOR SELECT USING (true);



CREATE POLICY "Anyone can view posts" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reactions" ON "public"."post_reactions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view supplements" ON "public"."supplements" FOR SELECT USING (true);



CREATE POLICY "Service role can insert profiles" ON "public"."profiles" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create follows" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can create own exercise logs" ON "public"."exercise_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own grocery items" ON "public"."grocery_lists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own habit logs" ON "public"."habit_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own habits" ON "public"."habits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own meal logs" ON "public"."meal_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own meals" ON "public"."meals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own progress photos" ON "public"."progress_photos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own streaks" ON "public"."streaks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own supplement logs" ON "public"."supplement_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own weight entries" ON "public"."weight_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own workout exercises" ON "public"."workout_exercises" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workouts"
  WHERE (("workouts"."id" = "workout_exercises"."workout_id") AND ("workouts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own workouts" ON "public"."workouts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create posts" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reactions" ON "public"."post_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create referrals" ON "public"."referrals" FOR INSERT WITH CHECK (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can delete own grocery items" ON "public"."grocery_lists" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own habits" ON "public"."habits" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own meals" ON "public"."meals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own progress photos" ON "public"."progress_photos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own reactions" ON "public"."post_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own workout exercises" ON "public"."workout_exercises" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."workouts"
  WHERE (("workouts"."id" = "workout_exercises"."workout_id") AND ("workouts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own workouts" ON "public"."workouts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can join challenges" ON "public"."challenge_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own grocery items" ON "public"."grocery_lists" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own habit logs" ON "public"."habit_logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own habits" ON "public"."habits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own meals" ON "public"."meals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own participation" ON "public"."challenge_participants" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own reactions" ON "public"."post_reactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own streaks" ON "public"."streaks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own supplement logs" ON "public"."supplement_logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own workout exercises" ON "public"."workout_exercises" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workouts"
  WHERE (("workouts"."id" = "workout_exercises"."workout_id") AND ("workouts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own workouts" ON "public"."workouts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own exercise logs" ON "public"."exercise_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own grocery lists" ON "public"."grocery_lists" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own habit logs" ON "public"."habit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own habits" ON "public"."habits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own meal logs" ON "public"."meal_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own meals" ON "public"."meals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own progress photos" ON "public"."progress_photos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referred_user_id")));



CREATE POLICY "Users can view own streaks" ON "public"."streaks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own supplement logs" ON "public"."supplement_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own weight entries" ON "public"."weight_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own workout exercises" ON "public"."workout_exercises" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workouts"
  WHERE (("workouts"."id" = "workout_exercises"."workout_id") AND ("workouts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own workouts" ON "public"."workouts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."challenge_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grocery_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."progress_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplement_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weight_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_comments_count"("post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_comments_count"("post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_comments_count"("post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."affiliate_applications" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_applications" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_participants" TO "anon";
GRANT ALL ON TABLE "public"."challenge_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_participants" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_logs" TO "anon";
GRANT ALL ON TABLE "public"."exercise_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_logs" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."grocery_lists" TO "anon";
GRANT ALL ON TABLE "public"."grocery_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."grocery_lists" TO "service_role";



GRANT ALL ON TABLE "public"."habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."meal_logs" TO "anon";
GRANT ALL ON TABLE "public"."meal_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_logs" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."post_reactions" TO "anon";
GRANT ALL ON TABLE "public"."post_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."progress_photos" TO "anon";
GRANT ALL ON TABLE "public"."progress_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."progress_photos" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."streaks" TO "anon";
GRANT ALL ON TABLE "public"."streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."streaks" TO "service_role";



GRANT ALL ON TABLE "public"."supplement_logs" TO "anon";
GRANT ALL ON TABLE "public"."supplement_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."supplement_logs" TO "service_role";



GRANT ALL ON TABLE "public"."supplements" TO "anon";
GRANT ALL ON TABLE "public"."supplements" TO "authenticated";
GRANT ALL ON TABLE "public"."supplements" TO "service_role";



GRANT ALL ON TABLE "public"."weight_entries" TO "anon";
GRANT ALL ON TABLE "public"."weight_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."weight_entries" TO "service_role";



GRANT ALL ON TABLE "public"."workout_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Authenticated users can upload exercise images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'exercise-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can upload meal images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'meal-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Exercise images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'exercise-images'::text));



  create policy "Public Access for Meal Images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'meal-images'::text));


CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


-- Enable pgvector extension for embeddings
-- Note: pgvector must be enabled in Supabase Dashboard > Database > Extensions first
-- Or run: create extension if not exists vector;
create extension if not exists vector;

-- Chat conversations table
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New Conversation',
  summary text,
  message_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages with embeddings
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  token_count int default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_chat_conversations_user_id 
  on public.chat_conversations(user_id);

create index if not exists idx_chat_conversations_updated_at 
  on public.chat_conversations(user_id, updated_at desc);

create index if not exists idx_chat_messages_conversation_id 
  on public.chat_messages(conversation_id);

create index if not exists idx_chat_messages_user_id 
  on public.chat_messages(user_id);

create index if not exists idx_chat_messages_created_at 
  on public.chat_messages(conversation_id, created_at desc);

-- Create HNSW index for fast vector similarity search (better than ivfflat for < 1M rows)
create index if not exists idx_chat_messages_embedding 
  on public.chat_messages using hnsw (embedding vector_cosine_ops);

-- Enable RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- RLS policies for conversations
create policy "Users can view own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

-- RLS policies for messages
create policy "Users can view own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can create own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Function to match chat messages by embedding similarity
create or replace function public.match_chat_messages(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float default 0.7,
  match_count int default 5,
  exclude_conversation_id uuid default null
)
returns table (
  id uuid,
  conversation_id uuid,
  content text,
  role text,
  similarity float,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    cm.id,
    cm.conversation_id,
    cm.content,
    cm.role,
    1 - (cm.embedding <=> query_embedding) as similarity,
    cm.created_at
  from public.chat_messages cm
  where cm.user_id = match_user_id
    and cm.embedding is not null
    and (exclude_conversation_id is null or cm.conversation_id != exclude_conversation_id)
    and 1 - (cm.embedding <=> query_embedding) > match_threshold
  order by cm.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Function to get recent messages from a conversation
create or replace function public.get_recent_messages(
  p_conversation_id uuid,
  p_limit int default 10
)
returns table (
  id uuid,
  role text,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    cm.id,
    cm.role,
    cm.content,
    cm.created_at
  from public.chat_messages cm
  where cm.conversation_id = p_conversation_id
  order by cm.created_at desc
  limit p_limit;
end;
$$;

-- Function to update conversation metadata after new message
create or replace function public.update_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set 
    message_count = message_count + 1,
    updated_at = now(),
    -- Auto-generate title from first user message if still default
    title = case 
      when title = 'New Conversation' and NEW.role = 'user' 
      then left(NEW.content, 50) || case when length(NEW.content) > 50 then '...' else '' end
      else title
    end
  where id = NEW.conversation_id;
  
  return NEW;
end;
$$;

-- Create trigger for auto-updating conversation
drop trigger if exists on_chat_message_insert on public.chat_messages;
create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row
  execute function public.update_conversation_on_message();

-- Function to create a new conversation and return it
create or replace function public.create_conversation(
  p_user_id uuid,
  p_title text default 'New Conversation'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  insert into public.chat_conversations (user_id, title)
  values (p_user_id, p_title)
  returning id into v_conversation_id;
  
  return v_conversation_id;
end;
$$;

-- Grant execute permissions
grant execute on function public.match_chat_messages to authenticated;
grant execute on function public.get_recent_messages to authenticated;
grant execute on function public.create_conversation to authenticated;

-- Add comment for documentation
comment on table public.chat_conversations is 'Stores chat conversation metadata for VBot RAG system';
comment on table public.chat_messages is 'Stores chat messages with embeddings for semantic search';
comment on function public.match_chat_messages is 'Finds similar messages using vector similarity search';

-- Fix the handle_new_user trigger to allow NULL name
-- The profiles table has name as NOT NULL, but the trigger wasn't providing a name

-- First, make name column nullable so existing users without profiles can still work
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;

-- Update the trigger function to handle profile creation properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert minimal profile data with NULL name (will be set during onboarding)
  INSERT INTO public.profiles (
    id,
    name,
    referral_code,
    credits,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NULL,  -- Name will be set during onboarding
    'VLIFE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    0,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the match_chat_messages function to accept text input
-- This allows the Supabase client to pass embedding as a string which is then cast to vector

-- Drop existing function first (need to match exact signature)
drop function if exists public.match_chat_messages(vector(1536), uuid, float, int, uuid);

-- Recreate with text parameter that gets cast to vector
create or replace function public.match_chat_messages(
  query_embedding text,  -- Accept as text, cast to vector internally
  match_user_id uuid,
  match_threshold float default 0.4,  -- Lower default threshold for better recall
  match_count int default 8,
  exclude_conversation_id uuid default null
)
returns table (
  id uuid,
  conversation_id uuid,
  content text,
  role text,
  similarity float,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  query_vec vector(1536);
begin
  -- Cast the text input to vector
  query_vec := query_embedding::vector(1536);
  
  return query
  select
    cm.id,
    cm.conversation_id,
    cm.content,
    cm.role,
    1 - (cm.embedding <=> query_vec) as similarity,
    cm.created_at
  from public.chat_messages cm
  where cm.user_id = match_user_id
    and cm.embedding is not null
    and (exclude_conversation_id is null or cm.conversation_id != exclude_conversation_id)
    and 1 - (cm.embedding <=> query_vec) > match_threshold
  order by cm.embedding <=> query_vec
  limit match_count;
end;
$$;

-- Grant execute permissions
grant execute on function public.match_chat_messages(text, uuid, float, int, uuid) to authenticated;

-- Add comment for documentation
comment on function public.match_chat_messages is 'Finds similar messages using vector similarity search. Accepts embedding as text for easier client usage.';

-- Add scheduled_date column to workouts table for better daily workout tracking
-- This allows us to associate workouts with specific dates for programming

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_date 
ON workouts(user_id, scheduled_date);

-- Add comment for documentation
COMMENT ON COLUMN workouts.scheduled_date IS 'The date this workout is scheduled for (YYYY-MM-DD format)';

-- Allow authenticated users to insert exercises into the shared catalog
-- This enables AI workout generation to create new exercises as needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercises' 
    AND policyname = 'Authenticated users can create exercises'
  ) THEN
    CREATE POLICY "Authenticated users can create exercises" 
    ON exercises FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Add ingredients column to meals table for grocery list generation
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS ingredients TEXT[];

-- Add a comment explaining the column
COMMENT ON COLUMN meals.ingredients IS 'Array of ingredient strings with quantities for grocery list generation';

-- Add source column to grocery_lists to track where items came from
ALTER TABLE grocery_lists
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'meal', 'forecast'));

-- Add meal_id reference to link grocery items to specific meals
ALTER TABLE grocery_lists
ADD COLUMN IF NOT EXISTS meal_id UUID REFERENCES meals(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grocery_lists_source ON grocery_lists(source);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_meal_id ON grocery_lists(meal_id);

-- Create daily_insights table for AI-generated daily motivational insights
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  timezone TEXT NOT NULL,
  insight TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one insight per user per day
  CONSTRAINT unique_user_date UNIQUE (user_id, local_date)
);

-- Add index for faster lookups
CREATE INDEX idx_daily_insights_user_date ON public.daily_insights(user_id, local_date DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own daily insights"
  ON public.daily_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily insights"
  ON public.daily_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow updates (in case we want to regenerate)
CREATE POLICY "Users can update their own daily insights"
  ON public.daily_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VitalFlow Daily Habits System
-- ============================================================================
-- This migration creates the schema for AI-powered daily habit suggestions
-- that adapt to user data and context without constantly recalculating the
-- base metabolic/calorie plan.

-- Enable pgvector extension for RAG (if not already enabled)
create extension if not exists vector;

-- ============================================================================
-- VITALFLOW HABITS KNOWLEDGE BASE (for RAG)
-- ============================================================================
-- This table stores the knowledge base of habit templates and coaching wisdom
-- that the AI uses to generate contextually appropriate suggestions.

create table if not exists public.vitalflow_habits_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('movement', 'nutrition', 'sleep', 'mindset', 'recovery', 'hydration')),
  tags text[] default '{}',
  goal_segments text[] default '{}', -- e.g., ['fat_loss', 'muscle_gain', 'strength', 'endurance', 'stress_reduction']
  contraindications text[] default '{}', -- e.g., ['injury', 'poor_sleep', 'overtraining']
  default_energy_delta_kcal integer default 0, -- typical calorie impact
  default_time_minutes integer default 10,
  difficulty_level text check (difficulty_level in ('easy', 'moderate', 'hard')),
  embedding vector(1536), -- OpenAI text-embedding-3-small
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vitalflow_habits_knowledge_category 
  on public.vitalflow_habits_knowledge(category);

create index if not exists idx_vitalflow_habits_knowledge_goal_segments 
  on public.vitalflow_habits_knowledge using gin(goal_segments);

create index if not exists idx_vitalflow_habits_knowledge_tags 
  on public.vitalflow_habits_knowledge using gin(tags);

-- HNSW index for fast vector similarity search
create index if not exists idx_vitalflow_habits_knowledge_embedding 
  on public.vitalflow_habits_knowledge using hnsw (embedding vector_cosine_ops);

comment on table public.vitalflow_habits_knowledge is 
  'Knowledge base of habit templates for VitalFlow AI suggestions with RAG';

-- ============================================================================
-- VITALFLOW HABIT TEMPLATES (User-specific or Global)
-- ============================================================================
-- Extends the existing habits table concept with templates that can be
-- user-specific or global (user_id = null for global templates).
-- This table can be used to create reusable habit patterns.

create table if not exists public.vitalflow_habit_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = global template
  title text not null,
  description text,
  category text not null check (category in ('movement', 'nutrition', 'sleep', 'mindset', 'recovery', 'hydration')),
  default_energy_delta_kcal integer default 0,
  default_time_minutes integer default 10,
  tags text[] default '{}',
  is_template boolean default true, -- true = template, false = user-created habit
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vitalflow_habit_templates_user_id 
  on public.vitalflow_habit_templates(user_id);

create index if not exists idx_vitalflow_habit_templates_category 
  on public.vitalflow_habit_templates(category);

create index if not exists idx_vitalflow_habit_templates_is_template 
  on public.vitalflow_habit_templates(is_template);

comment on table public.vitalflow_habit_templates is 
  'Reusable habit templates for VitalFlow suggestions';

-- ============================================================================
-- DAILY HABIT SUGGESTIONS
-- ============================================================================
-- AI-generated habit suggestions for each user, per day.
-- These are the actual suggestions shown to the user.

create table if not exists public.daily_habit_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  habit_template_id uuid references public.vitalflow_habit_templates(id) on delete set null, -- nullable for brand-new AI suggestions
  knowledge_id uuid references public.vitalflow_habits_knowledge(id) on delete set null, -- link to source knowledge
  title text not null,
  reason text, -- AI-generated explanation for why this habit was suggested
  category text not null check (category in ('movement', 'nutrition', 'sleep', 'mindset', 'recovery', 'hydration')),
  source text not null check (source in ('ai', 'template', 'manual')) default 'ai',
  energy_delta_kcal integer default 0, -- estimated calorie impact for this specific suggestion
  time_minutes integer default 10,
  tags text[] default '{}',
  rank integer default 0, -- priority ranking (1 = highest)
  status text not null check (status in ('suggested', 'accepted', 'skipped', 'completed', 'failed')) default 'suggested',
  skip_reason text, -- if skipped, why? (e.g., "Too busy", "Injury", "Already did it")
  completion_ratio numeric(3,2) default 0, -- 0.0 to 1.0 for partial completions
  completed_at timestamptz,
  metadata jsonb default '{}', -- flexible storage for AI context, user notes, etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint daily_habit_suggestions_user_date_rank_unique unique (user_id, date, rank)
);

create index if not exists idx_daily_habit_suggestions_user_date 
  on public.daily_habit_suggestions(user_id, date desc);

create index if not exists idx_daily_habit_suggestions_status 
  on public.daily_habit_suggestions(user_id, status);

create index if not exists idx_daily_habit_suggestions_category 
  on public.daily_habit_suggestions(category);

create index if not exists idx_daily_habit_suggestions_date 
  on public.daily_habit_suggestions(date desc);

comment on table public.daily_habit_suggestions is 
  'AI-generated daily habit suggestions for users in the VitalFlow system';

-- ============================================================================
-- HABIT EVENTS (Completion & Learning Log)
-- ============================================================================
-- Detailed log of habit completions, failures, and partial completions.
-- Used to personalize future suggestions and track long-term behavior.

create table if not exists public.habit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  suggestion_id uuid references public.daily_habit_suggestions(id) on delete cascade, -- nullable if logging a non-suggested habit
  habit_template_id uuid references public.vitalflow_habit_templates(id) on delete set null,
  date date not null default current_date,
  status text not null check (status in ('completed', 'partial', 'failed', 'skipped')),
  completion_ratio numeric(3,2) default 1.0, -- 0.0 to 1.0
  actual_time_minutes integer,
  actual_energy_delta_kcal integer,
  context_json jsonb default '{}', -- store contextual info like sleep quality, stress level, etc.
  notes text,
  logged_at timestamptz default now()
);

create index if not exists idx_habit_events_user_date 
  on public.habit_events(user_id, date desc);

create index if not exists idx_habit_events_suggestion_id 
  on public.habit_events(suggestion_id);

create index if not exists idx_habit_events_status 
  on public.habit_events(status);

comment on table public.habit_events is 
  'Detailed log of habit completions for learning and personalization';

-- ============================================================================
-- WEEKLY REFLECTIONS (User Check-ins)
-- ============================================================================
-- Lightweight weekly check-ins to capture user sentiment and adjust AI suggestions.

create table if not exists public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date not null,
  fatigue_level integer check (fatigue_level between 1 and 10), -- 1 = very low, 10 = extremely high
  enjoyment_level integer check (enjoyment_level between 1 and 10), -- 1 = not enjoying, 10 = loving it
  difficulty_level integer check (difficulty_level between 1 and 10), -- 1 = too easy, 10 = too hard
  notes text,
  created_at timestamptz default now(),
  constraint weekly_reflections_user_week_unique unique (user_id, week_start_date)
);

create index if not exists idx_weekly_reflections_user_week 
  on public.weekly_reflections(user_id, week_start_date desc);

comment on table public.weekly_reflections is 
  'Weekly user reflections to tune VitalFlow suggestions';

-- ============================================================================
-- AI LOGS (Auditing & Debugging)
-- ============================================================================
-- Log AI function calls, prompts, and responses for monitoring and debugging.

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  function_name text not null, -- e.g., 'vitalflow-daily-habits'
  prompt_hash text, -- hash of the prompt for deduplication
  input_data jsonb, -- sanitized input
  output_data jsonb, -- sanitized output
  model text, -- e.g., 'gpt-4o-mini'
  tokens_used integer,
  duration_ms integer,
  error text,
  created_at timestamptz default now()
);

create index if not exists idx_ai_logs_user_function 
  on public.ai_logs(user_id, function_name, created_at desc);

create index if not exists idx_ai_logs_created_at 
  on public.ai_logs(created_at desc);

comment on table public.ai_logs is 
  'Audit log for AI function calls in VitalFlow system';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- vitalflow_habits_knowledge: read-only for all authenticated users (global knowledge)
alter table public.vitalflow_habits_knowledge enable row level security;

create policy "Anyone can view active knowledge"
  on public.vitalflow_habits_knowledge for select
  using (is_active = true);

-- vitalflow_habit_templates: users can view global templates + their own
alter table public.vitalflow_habit_templates enable row level security;

create policy "Users can view global templates and own templates"
  on public.vitalflow_habit_templates for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create own templates"
  on public.vitalflow_habit_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own templates"
  on public.vitalflow_habit_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete own templates"
  on public.vitalflow_habit_templates for delete
  using (auth.uid() = user_id);

-- daily_habit_suggestions: users can only access their own
alter table public.daily_habit_suggestions enable row level security;

create policy "Users can view own suggestions"
  on public.daily_habit_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can create own suggestions"
  on public.daily_habit_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own suggestions"
  on public.daily_habit_suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete own suggestions"
  on public.daily_habit_suggestions for delete
  using (auth.uid() = user_id);

-- habit_events: users can only access their own
alter table public.habit_events enable row level security;

create policy "Users can view own events"
  on public.habit_events for select
  using (auth.uid() = user_id);

create policy "Users can create own events"
  on public.habit_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on public.habit_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own events"
  on public.habit_events for delete
  using (auth.uid() = user_id);

-- weekly_reflections: users can only access their own
alter table public.weekly_reflections enable row level security;

create policy "Users can view own reflections"
  on public.weekly_reflections for select
  using (auth.uid() = user_id);

create policy "Users can create own reflections"
  on public.weekly_reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on public.weekly_reflections for update
  using (auth.uid() = user_id);

create policy "Users can delete own reflections"
  on public.weekly_reflections for delete
  using (auth.uid() = user_id);

-- ai_logs: users can only view their own logs
alter table public.ai_logs enable row level security;

create policy "Users can view own AI logs"
  on public.ai_logs for select
  using (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to match habits knowledge by embedding similarity (RAG)
create or replace function public.match_vitalflow_habits_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10,
  filter_categories text[] default null,
  filter_goal_segments text[] default null
)
returns table (
  id uuid,
  title text,
  body text,
  category text,
  tags text[],
  goal_segments text[],
  default_energy_delta_kcal integer,
  default_time_minutes integer,
  difficulty_level text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    hk.id,
    hk.title,
    hk.body,
    hk.category,
    hk.tags,
    hk.goal_segments,
    hk.default_energy_delta_kcal,
    hk.default_time_minutes,
    hk.difficulty_level,
    1 - (hk.embedding <=> query_embedding) as similarity
  from public.vitalflow_habits_knowledge hk
  where hk.is_active = true
    and hk.embedding is not null
    and (filter_categories is null or hk.category = any(filter_categories))
    and (filter_goal_segments is null or hk.goal_segments && filter_goal_segments)
    and 1 - (hk.embedding <=> query_embedding) > match_threshold
  order by hk.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function public.match_vitalflow_habits_knowledge to authenticated;

comment on function public.match_vitalflow_habits_knowledge is 
  'Find similar habit knowledge using vector similarity search (RAG)';

-- Function to get user habit adherence summary (for AI personalization)
create or replace function public.get_user_habit_adherence_summary(
  p_user_id uuid,
  p_days int default 30
)
returns table (
  total_suggestions integer,
  accepted_count integer,
  completed_count integer,
  skipped_count integer,
  acceptance_rate numeric,
  completion_rate numeric,
  avg_completion_ratio numeric,
  most_accepted_category text,
  most_skipped_category text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_accepted integer;
  v_completed integer;
  v_skipped integer;
  v_most_accepted text;
  v_most_skipped text;
begin
  -- Get counts
  select 
    count(*),
    count(*) filter (where status = 'accepted' or status = 'completed'),
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'skipped')
  into v_total, v_accepted, v_completed, v_skipped
  from public.daily_habit_suggestions
  where user_id = p_user_id
    and date >= current_date - p_days;

  -- Most accepted category
  select category into v_most_accepted
  from public.daily_habit_suggestions
  where user_id = p_user_id
    and date >= current_date - p_days
    and (status = 'accepted' or status = 'completed')
  group by category
  order by count(*) desc
  limit 1;

  -- Most skipped category
  select category into v_most_skipped
  from public.daily_habit_suggestions
  where user_id = p_user_id
    and date >= current_date - p_days
    and status = 'skipped'
  group by category
  order by count(*) desc
  limit 1;

  return query
  select 
    v_total,
    v_accepted,
    v_completed,
    v_skipped,
    case when v_total > 0 then round(v_accepted::numeric / v_total, 2) else 0 end,
    case when v_accepted > 0 then round(v_completed::numeric / v_accepted, 2) else 0 end,
    (select avg(completion_ratio) from public.habit_events where user_id = p_user_id and date >= current_date - p_days),
    v_most_accepted,
    v_most_skipped;
end;
$$;

grant execute on function public.get_user_habit_adherence_summary to authenticated;

comment on function public.get_user_habit_adherence_summary is 
  'Get user habit adherence statistics for AI personalization';

-- Function to calculate today's expected energy burn from accepted habits
create or replace function public.get_todays_habit_energy_delta(
  p_user_id uuid,
  p_date date default current_date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_delta integer;
begin
  select coalesce(sum(energy_delta_kcal), 0)
  into v_total_delta
  from public.daily_habit_suggestions
  where user_id = p_user_id
    and date = p_date
    and (status = 'accepted' or status = 'completed');
  
  return v_total_delta;
end;
$$;

grant execute on function public.get_todays_habit_energy_delta to authenticated;

comment on function public.get_todays_habit_energy_delta is 
  'Calculate total energy delta from accepted habits for a given day';

-- Trigger to auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_vitalflow_habits_knowledge_updated_at
  before update on public.vitalflow_habits_knowledge
  for each row
  execute function public.update_updated_at_column();

create trigger update_vitalflow_habit_templates_updated_at
  before update on public.vitalflow_habit_templates
  for each row
  execute function public.update_updated_at_column();

create trigger update_daily_habit_suggestions_updated_at
  before update on public.daily_habit_suggestions
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- VitalFlow Habits Knowledge Base - Initial Seed Data
-- ============================================================================
-- High-quality habit templates and coaching wisdom for the RAG system.
-- Embeddings will be generated by the Edge Function on first use or via
-- a separate batch job.

-- Movement habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  '10-Minute Morning Walk',
  'A gentle 10-minute walk outdoors or on a treadmill to wake up your metabolism and set a positive tone for the day. This low-intensity activity helps with circulation, mental clarity, and doesn''t require gym access. Perfect for recovery days or when energy is low.',
  'movement',
  array['walking', 'cardio', 'low-intensity', 'morning', 'outdoor'],
  array['fat_loss', 'stress_reduction', 'general_wellness'],
  array['severe_injury'],
  40,
  10,
  'easy'
),
(
  'Bodyweight Movement Snack (5 min)',
  'A quick 5-minute movement break with simple bodyweight exercises: 10 squats, 10 push-ups (or wall push-ups), 10 lunges per leg. Great for breaking up sedentary time and maintaining muscle engagement throughout the day.',
  'movement',
  array['bodyweight', 'strength', 'quick', 'no-equipment'],
  array['muscle_gain', 'strength', 'fat_loss'],
  array['injury', 'overtraining'],
  25,
  5,
  'easy'
),
(
  'Evening Mobility Flow (15 min)',
  'A 15-minute gentle mobility routine focusing on hips, shoulders, and spine. Includes cat-cow stretches, hip circles, shoulder rolls, and deep breathing. Excellent for recovery, sleep quality, and reducing muscle tightness from the day.',
  'movement',
  array['mobility', 'stretching', 'recovery', 'evening', 'flexibility'],
  array['recovery', 'stress_reduction', 'injury_prevention'],
  array[]::text[],
  15,
  15,
  'easy'
),
(
  'Stair Climbing Sprint (3 rounds)',
  'Three rounds of stair climbing or step-ups for 1-2 minutes each, with 1-minute rest between rounds. Excellent for cardio conditioning, leg strength, and time efficiency. Can be done at home, office, or gym.',
  'movement',
  array['cardio', 'stairs', 'hiit', 'legs', 'quick'],
  array['fat_loss', 'endurance', 'strength'],
  array['knee_injury', 'poor_sleep', 'overtraining'],
  80,
  10,
  'moderate'
),
(
  'Active Recovery Walk (20 min)',
  'A 20-minute easy-paced walk, ideally outdoors. Focus on breathing and relaxation rather than speed. Helps with recovery between intense workouts, reduces muscle soreness, and supports mental well-being.',
  'movement',
  array['walking', 'recovery', 'outdoor', 'low-intensity'],
  array['recovery', 'stress_reduction', 'fat_loss'],
  array[]::text[],
  60,
  20,
  'easy'
);

-- Nutrition habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  'Protein-First Breakfast',
  'Start your day with a protein-rich breakfast containing at least 30g of protein. Examples: Greek yogurt with nuts, eggs with turkey, protein smoothie. This stabilizes blood sugar, reduces cravings, and supports muscle recovery.',
  'nutrition',
  array['protein', 'breakfast', 'meal-timing', 'satiety'],
  array['muscle_gain', 'fat_loss', 'strength'],
  array[]::text[],
  0,
  5,
  'easy'
),
(
  'Pre-Workout Snack (30 min before)',
  'Consume a small snack with 15-20g of carbs and 5-10g of protein about 30 minutes before your workout. Examples: banana with peanut butter, apple with string cheese, small protein bar. Provides energy without feeling heavy.',
  'nutrition',
  array['pre-workout', 'timing', 'energy', 'performance'],
  array['strength', 'muscle_gain', 'endurance'],
  array[]::text[],
  0,
  5,
  'easy'
),
(
  'Veggie-First Dinner Plate',
  'Build your dinner plate by filling half with vegetables first, then adding protein and carbs. This strategy increases fiber intake, improves satiety, and naturally controls portion sizes without feeling restrictive.',
  'nutrition',
  array['vegetables', 'portion-control', 'fiber', 'dinner'],
  array['fat_loss', 'general_wellness'],
  array[]::text[],
  0,
  2,
  'easy'
),
(
  'Post-Workout Protein Window (30 min)',
  'Consume 20-40g of protein within 30 minutes after strength training. This supports muscle protein synthesis and recovery. Examples: protein shake, Greek yogurt, chicken breast, or lean beef.',
  'nutrition',
  array['post-workout', 'protein', 'recovery', 'muscle-building'],
  array['muscle_gain', 'strength', 'recovery'],
  array[]::text[],
  0,
  5,
  'easy'
),
(
  'Meal Prep Sunday (2 hours)',
  'Dedicate 2 hours on Sunday to prepare 3-5 meals for the week ahead. Cook proteins in bulk, chop vegetables, and portion into containers. This habit dramatically improves adherence and reduces decision fatigue during busy weekdays.',
  'nutrition',
  array['meal-prep', 'planning', 'batch-cooking', 'weekend'],
  array['fat_loss', 'muscle_gain', 'general_wellness'],
  array[]::text[],
  0,
  120,
  'moderate'
);

-- Hydration habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  'Morning Hydration Ritual (16 oz)',
  'Drink 16 oz (500ml) of water within 30 minutes of waking up, before coffee or breakfast. This rehydrates your body after sleep, jumpstarts metabolism, and supports cognitive function throughout the morning.',
  'hydration',
  array['water', 'morning', 'hydration', 'metabolism'],
  array['fat_loss', 'general_wellness', 'energy'],
  array[]::text[],
  0,
  2,
  'easy'
),
(
  'Water Bottle Refill Reminder',
  'Set a timer to refill and drink from your water bottle every 90 minutes during the day. Aim for at least 64-80 oz total. Consistent hydration improves energy, reduces hunger confusion, and supports recovery.',
  'hydration',
  array['water', 'reminder', 'consistency', 'energy'],
  array['fat_loss', 'endurance', 'general_wellness'],
  array[]::text[],
  0,
  1,
  'easy'
),
(
  'Electrolyte Boost (Workout Days)',
  'Add electrolytes (sodium, potassium, magnesium) to your water on intense workout days or when sweating heavily. This prevents cramping, supports hydration, and aids recovery. Use sugar-free electrolyte powder or add a pinch of salt.',
  'hydration',
  array['electrolytes', 'workout', 'recovery', 'performance'],
  array['endurance', 'strength', 'recovery'],
  array[]::text[],
  0,
  2,
  'easy'
);

-- Sleep habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  'Screen-Free Wind-Down (30 min)',
  'Turn off all screens (phone, TV, computer) 30 minutes before your target bedtime. Replace with reading, journaling, stretching, or meditation. This improves sleep onset and quality by reducing blue light exposure.',
  'sleep',
  array['sleep-hygiene', 'wind-down', 'screen-time', 'evening'],
  array['recovery', 'stress_reduction', 'general_wellness'],
  array[]::text[],
  0,
  30,
  'moderate'
),
(
  'Consistent Bedtime Routine',
  'Go to bed at the same time every night, aiming for 7-9 hours of sleep. Consistent sleep-wake cycles optimize recovery, hormone production, and next-day performance. Set a bedtime alarm as a reminder.',
  'sleep',
  array['sleep-schedule', 'consistency', 'recovery', 'routine'],
  array['muscle_gain', 'fat_loss', 'recovery', 'stress_reduction'],
  array[]::text[],
  0,
  5,
  'moderate'
),
(
  'Cool Room Optimization',
  'Set your bedroom temperature to 65-68°F (18-20°C) for optimal sleep quality. A cooler room supports deeper sleep and better recovery. Also ensure the room is dark and quiet.',
  'sleep',
  array['sleep-environment', 'temperature', 'recovery'],
  array['recovery', 'general_wellness'],
  array[]::text[],
  0,
  2,
  'easy'
),
(
  'Magnesium Before Bed',
  'Take 200-400mg of magnesium glycinate 30-60 minutes before bed. Magnesium supports muscle relaxation, reduces cramping, and improves sleep quality. Consult a healthcare provider if you have kidney issues.',
  'sleep',
  array['supplements', 'magnesium', 'recovery', 'sleep-quality'],
  array['recovery', 'stress_reduction', 'muscle_gain'],
  array[]::text[],
  0,
  2,
  'easy'
);

-- Mindset & Recovery habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  'Morning Gratitude Practice (3 min)',
  'Write down or mentally note three things you''re grateful for each morning. This simple practice shifts your mindset to a positive state, reduces stress, and improves overall well-being and motivation.',
  'mindset',
  array['gratitude', 'journaling', 'morning', 'mental-health'],
  array['stress_reduction', 'general_wellness'],
  array[]::text[],
  0,
  3,
  'easy'
),
(
  'Box Breathing Reset (5 min)',
  'Practice box breathing when stressed: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat for 5 minutes. This activates the parasympathetic nervous system, reduces cortisol, and improves focus.',
  'mindset',
  array['breathing', 'stress', 'meditation', 'quick'],
  array['stress_reduction', 'recovery'],
  array[]::text[],
  0,
  5,
  'easy'
),
(
  'Progress Photo Check-In',
  'Take progress photos every 2-4 weeks in consistent lighting and poses. This provides objective feedback when scale weight doesn''t tell the full story and keeps you motivated through visual progress.',
  'mindset',
  array['tracking', 'progress', 'motivation', 'accountability'],
  array['fat_loss', 'muscle_gain'],
  array[]::text[],
  0,
  5,
  'easy'
),
(
  'Weekly Reflection & Planning',
  'Spend 15 minutes each Sunday reviewing last week''s wins and challenges, then plan your top 3 priorities for the upcoming week. This habit improves self-awareness and keeps you aligned with your goals.',
  'mindset',
  array['planning', 'reflection', 'weekly', 'goal-setting'],
  array['general_wellness', 'fat_loss', 'muscle_gain', 'strength'],
  array[]::text[],
  0,
  15,
  'moderate'
),
(
  'Cold Shower Finish (30-60 sec)',
  'End your shower with 30-60 seconds of cold water. This boosts circulation, reduces muscle soreness, improves mental resilience, and may enhance recovery. Start with 15 seconds and gradually increase.',
  'recovery',
  array['cold-therapy', 'recovery', 'circulation', 'resilience'],
  array['recovery', 'stress_reduction', 'endurance'],
  array[]::text[],
  0,
  1,
  'moderate'
),
(
  'Foam Rolling Session (10 min)',
  'Spend 10 minutes foam rolling major muscle groups: quads, hamstrings, glutes, back, and calves. Focus on tender spots for 30-60 seconds. This aids recovery, reduces soreness, and improves mobility.',
  'recovery',
  array['foam-rolling', 'myofascial-release', 'recovery', 'mobility'],
  array['recovery', 'injury_prevention', 'strength'],
  array['acute_injury'],
  15,
  10,
  'easy'
),
(
  'Meditation or Mindfulness (10 min)',
  'Practice 10 minutes of guided meditation or mindfulness. Use an app like Calm, Headspace, or simply focus on your breath. This reduces stress, improves focus, and supports overall mental health.',
  'mindset',
  array['meditation', 'mindfulness', 'stress', 'mental-health'],
  array['stress_reduction', 'general_wellness', 'recovery'],
  array[]::text[],
  0,
  10,
  'easy'
);

-- Add some more advanced/specific habits
insert into public.vitalflow_habits_knowledge (
  title, 
  body, 
  category, 
  tags, 
  goal_segments, 
  contraindications,
  default_energy_delta_kcal,
  default_time_minutes,
  difficulty_level
) values
(
  'Fasted Morning Cardio (20 min)',
  'Perform 20 minutes of low-intensity cardio (walk, bike, elliptical) before breakfast. This can enhance fat oxidation when done strategically 1-2x per week. Not suitable if you feel dizzy or weak when fasted.',
  'movement',
  array['fasted-cardio', 'fat-loss', 'morning', 'low-intensity'],
  array['fat_loss'],
  array['low_blood_sugar', 'overtraining', 'poor_sleep'],
  100,
  20,
  'moderate'
),
(
  'Calorie & Macro Tracking Check',
  'Log your food intake in your tracking app at the end of each meal. Consistent tracking improves awareness, ensures you hit protein targets, and reveals patterns that help or hurt progress.',
  'nutrition',
  array['tracking', 'accountability', 'macros', 'awareness'],
  array['fat_loss', 'muscle_gain'],
  array[]::text[],
  0,
  5,
  'moderate'
),
(
  'Caffeine Cutoff (2 PM)',
  'Stop consuming caffeine after 2 PM to protect sleep quality. Caffeine has a half-life of 5-6 hours, so late consumption can interfere with deep sleep and recovery.',
  'sleep',
  array['caffeine', 'sleep-hygiene', 'timing'],
  array['recovery', 'sleep_quality'],
  array[]::text[],
  0,
  1,
  'easy'
),
(
  'Sunrise Light Exposure (10 min)',
  'Get 10 minutes of natural sunlight exposure within 30-60 minutes of waking. This resets your circadian rhythm, improves mood, and enhances sleep quality later that night.',
  'mindset',
  array['sunlight', 'circadian', 'morning', 'vitamin-d'],
  array['general_wellness', 'recovery', 'stress_reduction'],
  array[]::text[],
  0,
  10,
  'easy'
),
(
  'Resistance Band Activation (5 min)',
  'Perform 5 minutes of resistance band exercises to activate glutes, shoulders, or core before your main workout. This improves muscle activation, reduces injury risk, and enhances performance.',
  'movement',
  array['warm-up', 'activation', 'resistance-band', 'injury-prevention'],
  array['strength', 'injury_prevention'],
  array['acute_injury'],
  10,
  5,
  'easy'
);

-- Add comment
comment on column public.vitalflow_habits_knowledge.embedding is 
  'Will be populated by Edge Function or batch job using OpenAI embeddings';

-- Add meal eaten tracking flags to meal_logs
BEGIN;

ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS is_eaten boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eaten_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_consumed ON public.meal_logs (user_id, consumed_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meal_logs'
      AND policyname = 'Users can update own meal logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own meal logs" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

COMMIT;

-- Seed baseline supplements including Vital Flow so the Nutrition and Tools pages can render recommendations.
BEGIN;

INSERT INTO public.supplements (
  name,
  category,
  description,
  benefits,
  recommended_dosage,
  recommended_time,
  featured,
  product_url
)
VALUES
  (
    'VitalFlow',
    'Testosterone Support',
    'World''s First TRT Dissolvable - Natural Testosterone Support Drink Mix. Lemonade-flavored packets formulated with clinically-studied ingredients including L-Arginine, D-Aspartic Acid, Ashwagandha, Vitamin D3, Zinc, and Magnesium to support optimal hormone levels and male vitality.',
    ARRAY[
      'Improve Sex Life - Better libido and performance',
      'Boost Your Mood - Feel confident and positive',
      'Increase Energy - Wake up refreshed, stay energized all day',
      'Boost Focus - Enhanced clarity and decision-making',
      'Recover Faster - Support muscle growth and recovery',
      'Vitality Benefits - Feel in your prime again'
    ],
    '1 packet mixed with water',
    'Daily',
    true,
    'https://vitalflowofficial.com/products/vitalflow-natural-testosterone-support-drink-mix'
  ),
  (
    'Protein Powder',
    'Muscle Building',
    'High-quality whey protein to fuel muscle growth and recovery after intense workouts',
    ARRAY[
      'Supports muscle growth',
      'Aids recovery',
      'Convenient protein source'
    ],
    '1 scoop',
    'Post-workout',
    false,
    '#'
  ),
  (
    'Creatine',
    'Performance',
    'Proven supplement for increasing strength, power output, and lean muscle mass',
    ARRAY[
      'Increase power output',
      'Improve strength',
      'Support lean mass'
    ],
    '5g',
    'Pre- or post-workout',
    false,
    '#'
  ),
  (
    'Fish Oil',
    'Recovery',
    'Omega-3 rich fish oil to support heart health and reduce inflammation from training',
    ARRAY[
      'Support heart health',
      'Reduce inflammation',
      'Aid recovery'
    ],
    '2 softgels',
    'With meals',
    false,
    '#'
  )
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  recommended_dosage = EXCLUDED.recommended_dosage,
  recommended_time = EXCLUDED.recommended_time,
  featured = EXCLUDED.featured,
  product_url = EXCLUDED.product_url;

COMMIT;

-- Add voice preferences to profiles table for VBot voice chat feature
-- Stores user's preferred voice for Gemini TTS and voice interaction settings

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voice_preferences JSONB DEFAULT '{
  "selectedVoice": "Kore",
  "voiceEnabled": true,
  "autoPlayResponses": false
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.voice_preferences IS 'User voice preferences for VBot: selectedVoice (Gemini TTS voice name), voiceEnabled (master toggle), autoPlayResponses (auto-play AI responses)';
-- ============================================
-- Gamification System: XP, Levels, and Achievements
-- ============================================

-- Add XP and level columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp_last_calculated_at TIMESTAMPTZ DEFAULT NOW();

-- Create XP events table to track how XP was earned
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'mission_complete', 'workout_complete', 'macro_goal', 'weight_log', 'streak_bonus', 'reflection'
  xp_amount INTEGER NOT NULL,
  source_id UUID, -- Optional reference to the source (habit_id, workout_id, etc.)
  source_type TEXT, -- 'vitalflow_suggestion', 'workout', 'meal', 'habit', 'weight_entry'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'first_workout', 'week_streak', 'level_10', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL, -- emoji or icon name
  category TEXT NOT NULL, -- 'streak', 'workout', 'nutrition', 'level', 'special'
  xp_reward INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_event_type ON xp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable RLS
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_events
CREATE POLICY "Users can view own XP events"
  ON xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP events"
  ON xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (readable by all authenticated users)
CREATE POLICY "Authenticated users can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Seed initial achievements
-- ============================================
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, sort_order) VALUES
  -- Streak achievements
  ('streak_3', '3-Day Streak', 'Maintain a 3-day activity streak', '🔥', 'streak', 50, 1),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day activity streak', '⚡', 'streak', 100, 2),
  ('streak_14', 'Fortnight Fighter', 'Maintain a 14-day activity streak', '💪', 'streak', 200, 3),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day activity streak', '🏆', 'streak', 500, 4),
  ('streak_100', 'Century Champion', 'Maintain a 100-day activity streak', '👑', 'streak', 1000, 5),
  
  -- Workout achievements
  ('first_workout', 'First Rep', 'Complete your first workout', '🎯', 'workout', 50, 10),
  ('workout_10', 'Getting Stronger', 'Complete 10 workouts', '💪', 'workout', 100, 11),
  ('workout_50', 'Gym Regular', 'Complete 50 workouts', '🏋️', 'workout', 250, 12),
  ('workout_100', 'Iron Dedication', 'Complete 100 workouts', '⭐', 'workout', 500, 13),
  
  -- Nutrition achievements
  ('first_meal_log', 'Fuel Up', 'Log your first meal', '🥗', 'nutrition', 25, 20),
  ('macro_streak_7', 'Macro Master', 'Hit macro goals 7 days in a row', '📊', 'nutrition', 150, 21),
  ('meals_logged_100', 'Nutrition Ninja', 'Log 100 meals', '🍽️', 'nutrition', 300, 22),
  
  -- Level achievements
  ('level_5', 'Rising Star', 'Reach Level 5', '⭐', 'level', 0, 30),
  ('level_10', 'Champion', 'Reach Level 10', '🌟', 'level', 0, 31),
  ('level_25', 'Elite', 'Reach Level 25', '💎', 'level', 0, 32),
  ('level_50', 'Legend', 'Reach Level 50', '👑', 'level', 0, 33),
  
  -- Mission achievements
  ('first_mission', 'Mission Accepted', 'Complete your first daily mission', '✅', 'special', 25, 40),
  ('missions_10', 'Mission Specialist', 'Complete 10 daily missions', '🎖️', 'special', 75, 41),
  ('missions_50', 'Mission Commander', 'Complete 50 daily missions', '🎗️', 'special', 200, 42),
  ('perfect_day', 'Perfect Day', 'Complete all daily missions in one day', '🌈', 'special', 100, 43),
  
  -- Special achievements
  ('early_bird', 'Early Bird', 'Complete a mission before 7 AM', '🌅', 'special', 50, 50),
  ('night_owl', 'Night Owl', 'Complete a workout after 9 PM', '🦉', 'special', 50, 51),
  ('weekend_warrior', 'Weekend Warrior', 'Work out on both Saturday and Sunday', '🗓️', 'special', 75, 52)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Function to add XP and update level
-- ============================================
CREATE OR REPLACE FUNCTION add_xp(
  p_user_id UUID,
  p_event_type TEXT,
  p_xp_amount INTEGER,
  p_source_id UUID DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(new_xp_total INTEGER, new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
BEGIN
  -- Get current level
  SELECT current_level, xp_total INTO v_old_level, v_new_xp
  FROM profiles
  WHERE id = p_user_id;
  
  -- Add XP
  v_new_xp := COALESCE(v_new_xp, 0) + p_xp_amount;
  
  -- Calculate new level (simple formula: level = floor(sqrt(xp / 100)) + 1)
  -- This gives: Level 1 = 0-99 XP, Level 2 = 100-399 XP, Level 3 = 400-899 XP, etc.
  v_new_level := FLOOR(SQRT(v_new_xp::float / 100)) + 1;
  
  -- Update profile
  UPDATE profiles
  SET xp_total = v_new_xp,
      current_level = v_new_level,
      xp_last_calculated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the XP event
  INSERT INTO xp_events (user_id, event_type, xp_amount, source_id, source_type, metadata)
  VALUES (p_user_id, p_event_type, p_xp_amount, p_source_id, p_source_type, p_metadata);
  
  -- Return results
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > COALESCE(v_old_level, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_xp TO authenticated;
-- Add weekly reflection dismissed tracking to profiles
-- This allows users to dismiss the weekly reflection prompt and not be asked again until next week

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_reflection_dismissed_at TIMESTAMPTZ;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_reflection_dismissed 
ON profiles(weekly_reflection_dismissed_at) 
WHERE weekly_reflection_dismissed_at IS NOT NULL;

-- Add training preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_time_minutes INTEGER DEFAULT 45;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT 4;

-- Fix posts category CHECK constraint to include 'motivation'
-- This was causing posts to silently fail when users selected "Motivation" category

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Add the updated constraint with 'motivation' included
ALTER TABLE posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('achievement', 'workout', 'nutrition', 'motivation', 'general'));
-- Add avatar_url column to profiles table for user profile photos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add is_admin column to profiles table for admin access control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile photo stored in Supabase Storage';
COMMENT ON COLUMN public.profiles.is_admin IS 'Whether user has admin privileges';

-- RPC function to increment challenge participants count
CREATE OR REPLACE FUNCTION increment_challenge_participants(challenge_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges 
  SET participants_count = COALESCE(participants_count, 0) + 1 
  WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to decrement challenge participants count
CREATE OR REPLACE FUNCTION decrement_challenge_participants(challenge_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges 
  SET participants_count = GREATEST(0, COALESCE(participants_count, 0) - 1) 
  WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS policy for avatars - users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policy for avatars - public read access
CREATE POLICY "Public avatar read access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- RLS policy for avatars - users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policy for avatars - users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set the first user as admin (for initial setup)
-- This makes the earliest-created user an admin
UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Set mtjohnston42@gmail.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'mtjohnston42@gmail.com'
);

-- Add calorie_goal column to profiles table
-- NULL means use calculated value based on goal_weight and primary_goal
-- Non-NULL means user override

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calorie_goal INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.calorie_goal IS
  'User-defined daily calorie goal override. NULL = use calculated value based on goal_weight and primary_goal';

-- Add reasonable constraints (800-10000 kcal range)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calorie_goal_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_calorie_goal_check
    CHECK (calorie_goal IS NULL OR (calorie_goal >= 800 AND calorie_goal <= 10000));
  END IF;
END $$;
-- Scheduled Notification Delivery Setup
--
-- This migration documents the setup for scheduled notifications.
-- pg_cron is only available on Supabase Pro plans and above.
--
-- OPTION 1: pg_cron (Supabase Pro+)
-- Run this manually via Supabase SQL Editor after deploying:
--
-- SELECT cron.schedule(
--   'send-scheduled-notifications',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- OPTION 2: External Scheduler (Any Supabase plan)
-- Use GitHub Actions, Google Cloud Scheduler, or similar to POST every minute:
-- URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications
-- Headers: Authorization: Bearer YOUR_SERVICE_ROLE_KEY
-- Body: {}

-- This is a placeholder migration - no automatic changes are made.
-- Choose Option 1 or 2 above based on your Supabase plan.
SELECT 1;
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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_ratings' AND policyname = 'Users can create ratings'
  ) THEN
    CREATE POLICY "Users can create ratings" ON app_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can view their own ratings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_ratings' AND policyname = 'Users can view their ratings'
  ) THEN
    CREATE POLICY "Users can view their ratings" ON app_ratings
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Admins can view all ratings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_ratings' AND policyname = 'Admins can view all ratings'
  ) THEN
    CREATE POLICY "Admins can view all ratings" ON app_ratings
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  END IF;
END $$;
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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_blocks' AND policyname = 'Users can view own blocks'
  ) THEN
    CREATE POLICY "Users can view own blocks" ON user_blocks
      FOR SELECT USING (blocker_id = auth.uid());
  END IF;
END $$;

-- Users can create blocks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_blocks' AND policyname = 'Users can create blocks'
  ) THEN
    CREATE POLICY "Users can create blocks" ON user_blocks
      FOR INSERT WITH CHECK (blocker_id = auth.uid());
  END IF;
END $$;

-- Users can delete their own blocks (unblock)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_blocks' AND policyname = 'Users can delete own blocks'
  ) THEN
    CREATE POLICY "Users can delete own blocks" ON user_blocks
      FOR DELETE USING (blocker_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for post_reports
-- Users can create reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reports' AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON post_reports
      FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

-- Users can view their own reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reports' AND policyname = 'Users can view own reports'
  ) THEN
    CREATE POLICY "Users can view own reports" ON post_reports
      FOR SELECT USING (reporter_id = auth.uid());
  END IF;
END $$;

-- Admins can view and update all reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reports' AND policyname = 'Admins can view all reports'
  ) THEN
    CREATE POLICY "Admins can view all reports" ON post_reports
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_reports' AND policyname = 'Admins can update reports'
  ) THEN
    CREATE POLICY "Admins can update reports" ON post_reports
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- Comment on tables for documentation
COMMENT ON TABLE user_blocks IS 'Tracks which users have blocked other users. Used for content filtering.';
COMMENT ON TABLE post_reports IS 'Tracks user reports of objectionable content. Reviewed within 24 hours per Apple guidelines.';
-- =====================================================
-- PERSONALIZED WORKOUT SYSTEM FOR V-LIFE
-- =====================================================
-- This migration creates the complete AI-powered personalized workout system
-- including exercise library, plan generation, comprehensive logging,
-- and performance tracking for adaptive regeneration.
--
-- Tables created:
-- 1. exercise_library - 300+ exercises with modality-specific configurations
-- 2. user_workout_plans - 4-week mesocycle plans
-- 3. plan_workouts - Individual workout days within plans
-- 4. plan_exercises - Exercises assigned to each workout
-- 5. workout_logs - Comprehensive workout completion tracking
-- 6. exercise_logs - Detailed exercise logging (all types)
-- 7. performance_metrics - Aggregated performance analysis
-- 8. exercise_pr_history - Personal records tracking
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (clean slate)
-- =====================================================
DROP TABLE IF EXISTS exercise_pr_history CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS exercise_logs CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS plan_exercises CASCADE;
DROP TABLE IF EXISTS plan_workouts CASCADE;
DROP TABLE IF EXISTS user_workout_plans CASCADE;
DROP TABLE IF EXISTS exercise_library CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS calculate_estimated_1rm(NUMERIC, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_workout_log_aggregates() CASCADE;
DROP FUNCTION IF EXISTS check_and_record_prs() CASCADE;

-- =====================================================
-- 1. EXERCISE LIBRARY (Modality-Based Exercise Database)
-- =====================================================
CREATE TABLE public.exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  training_modality TEXT CHECK (training_modality IN (
    'strength',      -- Heavy weights, low reps (3-6 reps, 85-95% 1RM)
    'hypertrophy',   -- Muscle growth, moderate weight (8-12 reps, 70-80% 1RM)
    'endurance',     -- Muscular endurance, light weight (15-20 reps, 50-65% 1RM)
    'power',         -- Explosive movements (3-5 reps, 75-90% 1RM)
    'HIIT',          -- High-intensity interval training
    'mobility',      -- Flexibility and range of motion
    'functional',    -- Functional movement patterns
    'mind_body',     -- Yoga, tai chi, meditation
    'mixed'          -- General/mixed modalities
  )) NOT NULL,

  category TEXT CHECK (category IN (
    'strength', 'cardio', 'flexibility', 'sports', 'plyometric'
  )) NOT NULL,

  exercise_type TEXT CHECK (exercise_type IN (
    'compound', 'isolation', 'cardio', 'flexibility',
    'bodyweight', 'plyometric', 'swimming', 'sports'
  )) NOT NULL,

  -- Muscle targeting
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[],
  target_muscles TEXT[],

  -- Equipment
  equipment TEXT[],

  -- Difficulty & Safety
  difficulty TEXT CHECK (difficulty IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )) NOT NULL,
  risk_level TEXT CHECK (risk_level IN (
    'low', 'moderate', 'high'
  )) DEFAULT 'moderate',

  -- Modality-Specific Prescription Ranges
  -- These are the recommended ranges for THIS modality
  recommended_sets_min INTEGER,
  recommended_sets_max INTEGER,
  recommended_reps_min INTEGER,
  recommended_reps_max INTEGER,
  recommended_rest_seconds_min INTEGER,
  recommended_rest_seconds_max INTEGER,
  intensity_percentage_min INTEGER, -- % of 1RM
  intensity_percentage_max INTEGER,
  tempo TEXT, -- e.g., "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top
  recommended_rpe_min NUMERIC(3,1), -- Rate of Perceived Exertion 1-10
  recommended_rpe_max NUMERIC(3,1),

  -- Instructions & Form
  instructions TEXT,
  form_cues TEXT[],
  common_mistakes TEXT[],

  -- Media
  video_url TEXT,
  image_url TEXT,

  -- Progressions & Variations
  variations TEXT[],
  alternative_exercises UUID[], -- Array of other exercise IDs
  progression_exercises UUID[], -- Harder versions
  regression_exercises UUID[], -- Easier versions

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_unilateral BOOLEAN DEFAULT false, -- One side at a time
  requires_spotter BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique exercise per modality
  UNIQUE(name, training_modality)
);

-- Indexes for exercise_library
CREATE INDEX idx_exercise_library_modality ON exercise_library(training_modality);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_difficulty ON exercise_library(difficulty);
CREATE INDEX idx_exercise_library_muscles ON exercise_library USING GIN(target_muscles);
CREATE INDEX idx_exercise_library_equipment ON exercise_library USING GIN(equipment);
CREATE INDEX idx_exercise_library_active ON exercise_library(is_active) WHERE is_active = true;
CREATE INDEX idx_exercise_library_name_search ON exercise_library USING GIN(to_tsvector('english', name));

-- RLS for exercise_library (public read access)
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exercises"
  ON exercise_library FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage exercises"
  ON exercise_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- 2. USER WORKOUT PLANS (4-week mesocycles)
-- =====================================================
CREATE TABLE public.user_workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Plan details
  plan_name TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN (
    'push_pull_legs',
    'upper_lower',
    'full_body',
    'bro_split',
    'custom'
  )) NOT NULL,

  -- Duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weeks_duration INTEGER DEFAULT 4,

  -- Configuration
  days_per_week INTEGER CHECK (days_per_week BETWEEN 3 AND 7) NOT NULL,
  workout_duration_minutes INTEGER CHECK (workout_duration_minutes BETWEEN 20 AND 120),

  -- Split pattern (e.g., "3-1-2-1" for 3 on, 1 off, 2 on, 1 off)
  split_pattern TEXT,

  -- User preferences at time of generation
  preferred_exercises JSONB, -- Exercise IDs they enjoy
  avoided_exercises JSONB, -- Exercise IDs to avoid
  available_equipment TEXT[],
  workout_location TEXT,

  -- Performance baseline
  baseline_metrics JSONB, -- Starting strength/cardio levels

  -- Status
  status TEXT CHECK (status IN (
    'active',
    'completed',
    'paused',
    'archived'
  )) DEFAULT 'active',

  -- AI generation metadata
  ai_model_version TEXT,
  generation_prompt TEXT,
  generation_parameters JSONB,

  -- Mesocycle structure
  mesocycle_week INTEGER CHECK (mesocycle_week BETWEEN 1 AND 4), -- Which week in the cycle
  is_deload_week BOOLEAN DEFAULT false,

  -- Previous plan reference (for progression tracking)
  previous_plan_id UUID REFERENCES user_workout_plans(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_workout_plans
CREATE INDEX idx_user_workout_plans_user ON user_workout_plans(user_id);
CREATE INDEX idx_user_workout_plans_dates ON user_workout_plans(user_id, start_date DESC, end_date DESC);
CREATE INDEX idx_user_workout_plans_status ON user_workout_plans(user_id, status);
CREATE INDEX idx_user_workout_plans_active ON user_workout_plans(user_id, status) WHERE status = 'active';

-- RLS for user_workout_plans
ALTER TABLE user_workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout plans"
  ON user_workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans"
  ON user_workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON user_workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON user_workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. PLAN WORKOUTS (Individual workout sessions)
-- =====================================================
CREATE TABLE public.plan_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_workout_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Workout details
  workout_name TEXT NOT NULL, -- "Push Day A", "Leg Day", etc.
  workout_type TEXT CHECK (workout_type IN (
    'push',
    'pull',
    'legs',
    'upper',
    'lower',
    'full_body',
    'cardio',
    'mixed'
  )) NOT NULL,

  -- Scheduling
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 4) NOT NULL,
  scheduled_date DATE,

  -- Workout parameters
  estimated_duration_minutes INTEGER,
  target_volume_sets INTEGER, -- Total sets planned
  intensity_level TEXT CHECK (intensity_level IN ('light', 'moderate', 'heavy', 'very_heavy')),

  -- Focus areas
  muscle_groups TEXT[], -- ["chest", "shoulders", "triceps"]
  workout_goals TEXT[], -- ["strength", "hypertrophy", "endurance"]

  -- Status
  is_rest_day BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),

  -- Notes
  workout_description TEXT,
  coach_notes TEXT, -- AI-generated tips for this workout

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for plan_workouts
CREATE INDEX idx_plan_workouts_plan ON plan_workouts(plan_id);
CREATE INDEX idx_plan_workouts_user ON plan_workouts(user_id);
CREATE INDEX idx_plan_workouts_schedule ON plan_workouts(user_id, scheduled_date);
CREATE INDEX idx_plan_workouts_week ON plan_workouts(plan_id, week_number);

-- RLS for plan_workouts
ALTER TABLE plan_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan workouts"
  ON plan_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan workouts"
  ON plan_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan workouts"
  ON plan_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan workouts"
  ON plan_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. PLAN EXERCISES (Exercises within workouts)
-- =====================================================
CREATE TABLE public.plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES plan_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Exercise ordering
  exercise_order INTEGER NOT NULL, -- 1, 2, 3, etc.
  superset_group INTEGER, -- Group exercises into supersets (1, 2, etc.)

  -- Prescription for STRENGTH exercises
  target_sets INTEGER,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight_lbs NUMERIC(6,2),
  rest_seconds INTEGER,
  tempo TEXT, -- "3-1-1-0" format
  target_rpe INTEGER CHECK (target_rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion

  -- Prescription for CARDIO exercises
  target_duration_minutes INTEGER,
  target_distance_miles NUMERIC(6,2),
  target_pace_per_mile_seconds INTEGER,
  target_heart_rate_zone TEXT CHECK (target_heart_rate_zone IN ('zone1', 'zone2', 'zone3', 'zone4', 'zone5')),

  -- Prescription for SWIMMING
  target_laps INTEGER,
  target_swim_stroke TEXT CHECK (target_swim_stroke IN ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed')),

  -- Prescription for FLEXIBILITY/YOGA
  target_hold_duration_seconds INTEGER,
  target_holds_per_position INTEGER,

  -- Progressive overload tracking
  previous_week_weight NUMERIC(6,2),
  previous_week_reps INTEGER,
  progression_type TEXT CHECK (progression_type IN (
    'weight',      -- Increase weight
    'reps',        -- Increase reps
    'sets',        -- Increase sets
    'tempo',       -- Slower tempo
    'rest',        -- Shorter rest
    'maintain'     -- Keep same (deload week)
  )),

  -- Alternative exercises
  alternative_exercise_ids UUID[], -- Backup options if primary not available

  -- Instructions
  exercise_notes TEXT, -- Specific cues for this workout
  form_focus TEXT, -- "Focus on full ROM", "Squeeze at top"

  -- Status
  is_optional BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for plan_exercises
CREATE INDEX idx_plan_exercises_workout ON plan_exercises(workout_id, exercise_order);
CREATE INDEX idx_plan_exercises_exercise ON plan_exercises(exercise_id);
CREATE INDEX idx_plan_exercises_user ON plan_exercises(user_id);

-- RLS for plan_exercises
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan exercises"
  ON plan_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan exercises"
  ON plan_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan exercises"
  ON plan_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan exercises"
  ON plan_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. WORKOUT LOGS (Comprehensive session tracking)
-- =====================================================
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES user_workout_plans(id) ON DELETE SET NULL,
  workout_id UUID REFERENCES plan_workouts(id) ON DELETE SET NULL,

  -- Completion details
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,

  -- Performance tracking
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  enjoyment_rating INTEGER CHECK (enjoyment_rating BETWEEN 1 AND 5),

  -- Completion metrics
  exercises_planned INTEGER,
  exercises_completed INTEGER,
  exercises_skipped INTEGER,
  exercises_modified INTEGER,

  -- Volume tracking (for strength workouts)
  total_volume_lbs NUMERIC(10,2), -- Total weight lifted (sets × reps × weight)
  total_reps INTEGER,
  total_sets INTEGER,

  -- Cardio tracking
  total_distance_miles NUMERIC(6,2),
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  calories_burned INTEGER,

  -- Status
  completion_status TEXT CHECK (completion_status IN (
    'completed',
    'partially_completed',
    'skipped',
    'in_progress'
  )) DEFAULT 'in_progress',

  -- User feedback
  notes TEXT,
  felt_good BOOLEAN,
  want_more_like_this BOOLEAN,

  -- Environmental factors
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_today INTEGER CHECK (stress_today BETWEEN 1 AND 10),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workout_logs
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, workout_date DESC);
CREATE INDEX idx_workout_logs_plan ON workout_logs(plan_id);
CREATE INDEX idx_workout_logs_status ON workout_logs(user_id, completion_status);
CREATE INDEX idx_workout_logs_date_range ON workout_logs(user_id, workout_date DESC, completion_status);

-- RLS for workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. EXERCISE LOGS (Detailed exercise-level tracking)
-- =====================================================
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,

  -- Exercise type
  exercise_type TEXT CHECK (exercise_type IN (
    'strength',           -- Weight training
    'cardio',            -- Running, cycling, etc.
    'flexibility',       -- Stretching, yoga
    'bodyweight',        -- Calisthenics
    'plyometric',        -- Jump training
    'swimming',          -- Swimming specific
    'sports'             -- General sports activity
  )) NOT NULL,

  -- ===== STRENGTH TRAINING DATA =====
  sets_planned INTEGER,
  sets_completed INTEGER,
  reps_per_set INTEGER[], -- [12, 10, 10, 8] - actual reps per set
  weight_per_set NUMERIC(6,2)[], -- [135, 135, 145, 145] - weight used per set
  rpe_per_set INTEGER[], -- [7, 8, 9, 9] - Rate of Perceived Exertion 1-10
  rest_seconds_actual INTEGER[],

  -- Tempo tracking (optional)
  tempo TEXT, -- "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top

  -- ===== CARDIO DATA =====
  duration_seconds INTEGER,
  distance_miles NUMERIC(6,2),
  distance_meters NUMERIC(8,2),
  pace_per_mile_seconds INTEGER, -- For running (seconds per mile)
  pace_per_100m_seconds INTEGER, -- For swimming (seconds per 100m)
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_feet INTEGER,

  -- Intervals (for HIIT cardio)
  intervals_completed INTEGER,
  work_interval_seconds INTEGER,
  rest_interval_seconds INTEGER,

  -- ===== SWIMMING SPECIFIC =====
  swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  )),
  laps_completed INTEGER,
  pool_length_meters INTEGER,

  -- ===== FLEXIBILITY/YOGA =====
  holds_per_position INTEGER[], -- How many holds per stretch
  hold_duration_seconds INTEGER[], -- Duration of each hold

  -- ===== UNIVERSAL METRICS =====
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5),
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100,

  -- Modifications & Notes
  modifications_made TEXT[], -- ["Used resistance band", "Reduced weight"]
  difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'too_easy', 'just_right', 'too_hard', 'way_too_hard'
  )),
  pain_or_discomfort BOOLEAN DEFAULT false,
  pain_location TEXT, -- "lower back", "left shoulder"

  -- Media
  notes TEXT,
  video_url TEXT, -- Form check video

  -- Metadata
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  substituted_exercise_id UUID REFERENCES exercise_library(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exercise_logs
CREATE INDEX idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX idx_exercise_logs_created ON exercise_logs(created_at DESC);

-- RLS for exercise_logs
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise logs"
  ON exercise_logs FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can create their own exercise logs"
  ON exercise_logs FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can update their own exercise logs"
  ON exercise_logs FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can delete their own exercise logs"
  ON exercise_logs FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

-- =====================================================
-- 7. PERFORMANCE METRICS (Aggregated tracking)
-- =====================================================
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Time period
  metric_period TEXT CHECK (metric_period IN ('week', 'month', 'mesocycle')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Adherence metrics
  workouts_planned INTEGER NOT NULL,
  workouts_completed INTEGER NOT NULL,
  adherence_rate NUMERIC(5,2), -- Percentage

  -- Volume metrics
  total_volume_lbs NUMERIC(12,2),
  avg_volume_per_workout NUMERIC(10,2),
  volume_increase_vs_previous NUMERIC(6,2), -- Percentage

  -- Strength metrics
  one_rep_max_estimates JSONB, -- {"bench_press": 225, "squat": 315}
  strength_increase_vs_previous NUMERIC(6,2),

  -- Cardio metrics
  total_distance_miles NUMERIC(8,2),
  avg_pace_seconds NUMERIC(6,2),
  cardio_improvement_vs_previous NUMERIC(6,2),

  -- Consistency metrics
  workouts_per_week NUMERIC(3,1),
  longest_streak_days INTEGER,

  -- Subjective metrics
  avg_energy_level NUMERIC(3,1),
  avg_enjoyment NUMERIC(3,1),
  avg_perceived_difficulty NUMERIC(3,1),

  -- Recovery metrics
  avg_sleep_quality NUMERIC(3,1),
  avg_stress_level NUMERIC(3,1),

  -- Recommendations for next period
  recommended_volume_adjustment NUMERIC(6,2), -- +10%, -5%, etc.
  recommended_intensity_adjustment TEXT,
  needs_deload BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance_metrics
CREATE INDEX idx_performance_metrics_user_period ON performance_metrics(user_id, period_start DESC);
CREATE UNIQUE INDEX idx_performance_metrics_unique ON performance_metrics(user_id, metric_period, period_start);

-- RLS for performance_metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance metrics"
  ON performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance metrics"
  ON performance_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance metrics"
  ON performance_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. EXERCISE PR HISTORY (Personal Records)
-- =====================================================
CREATE TABLE public.exercise_pr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  exercise_log_id UUID REFERENCES exercise_logs(id) ON DELETE SET NULL,

  -- PR Type
  pr_type TEXT CHECK (pr_type IN (
    'max_weight',        -- Heaviest weight for any rep count
    '1rm_estimated',     -- Estimated 1 rep max
    'max_reps',          -- Most reps at bodyweight or specific weight
    'max_distance',      -- Longest distance
    'fastest_time',      -- Fastest time for distance
    'longest_hold'       -- Longest static hold
  )) NOT NULL,

  -- PR Data
  weight_lbs NUMERIC(6,2),
  reps INTEGER,
  distance_miles NUMERIC(6,2),
  time_seconds INTEGER,

  -- Context
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  -- Previous PR (for comparison)
  previous_pr_value NUMERIC(10,2),
  improvement_percentage NUMERIC(6,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exercise_pr_history
CREATE INDEX idx_exercise_pr_user_exercise ON exercise_pr_history(user_id, exercise_id, pr_type);
CREATE INDEX idx_exercise_pr_date ON exercise_pr_history(user_id, achieved_at DESC);

-- RLS for exercise_pr_history
ALTER TABLE exercise_pr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PR history"
  ON exercise_pr_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PR history"
  ON exercise_pr_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PR history"
  ON exercise_pr_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PR history"
  ON exercise_pr_history FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate estimated 1RM using Epley formula
CREATE OR REPLACE FUNCTION calculate_estimated_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF reps = 1 THEN
    RETURN weight;
  ELSIF reps > 1 AND reps <= 10 THEN
    RETURN ROUND(weight * (1 + reps / 30.0), 2);
  ELSE
    RETURN NULL; -- Formula not accurate for >10 reps
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update workout_logs aggregates when exercise_logs are inserted
CREATE OR REPLACE FUNCTION update_workout_log_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workout_logs
  SET
    total_volume_lbs = (
      SELECT COALESCE(SUM(
        CASE
          WHEN e.exercise_type = 'strength' THEN
            (SELECT SUM(w * r)
             FROM unnest(e.weight_per_set) WITH ORDINALITY AS w(w, i)
             JOIN unnest(e.reps_per_set) WITH ORDINALITY AS r(r, i) ON w.i = r.i)
          ELSE 0
        END
      ), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
    ),
    total_reps = (
      SELECT COALESCE(SUM(
        CASE
          WHEN e.exercise_type = 'strength' THEN
            (SELECT SUM(r) FROM unnest(e.reps_per_set) AS r)
          ELSE 0
        END
      ), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
    ),
    total_sets = (
      SELECT COALESCE(SUM(e.sets_completed), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
      AND e.exercise_type = 'strength'
    ),
    total_distance_miles = (
      SELECT COALESCE(SUM(e.distance_miles), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
      AND e.exercise_type IN ('cardio', 'swimming')
    ),
    updated_at = NOW()
  WHERE id = NEW.workout_log_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workout_logs when exercise_logs are inserted/updated
CREATE TRIGGER trigger_update_workout_log_aggregates
  AFTER INSERT OR UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_log_aggregates();

-- Function to automatically detect and record new PRs
CREATE OR REPLACE FUNCTION check_and_record_prs()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_max_weight NUMERIC;
  v_estimated_1rm NUMERIC;
  v_max_distance NUMERIC;
  v_fastest_time INTEGER;
  v_previous_pr NUMERIC;
BEGIN
  -- Get user_id from workout_log
  SELECT user_id INTO v_user_id
  FROM workout_logs
  WHERE id = NEW.workout_log_id;

  -- Check for strength PRs
  IF NEW.exercise_type = 'strength' AND NEW.weight_per_set IS NOT NULL AND array_length(NEW.weight_per_set, 1) > 0 THEN
    -- Max weight PR
    v_max_weight := (SELECT MAX(w) FROM unnest(NEW.weight_per_set) AS w);

    SELECT weight_lbs INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_weight'
    ORDER BY weight_lbs DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR v_max_weight > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        weight_lbs, reps, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_weight',
        v_max_weight,
        (SELECT reps_per_set[array_position(weight_per_set, v_max_weight)]),
        v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((v_max_weight - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  -- Check for cardio distance PRs
  IF NEW.exercise_type IN ('cardio', 'swimming') AND NEW.distance_miles IS NOT NULL THEN
    SELECT distance_miles INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_distance'
    ORDER BY distance_miles DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR NEW.distance_miles > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        distance_miles, time_seconds, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_distance',
        NEW.distance_miles, NEW.duration_seconds, v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((NEW.distance_miles - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check for PRs
CREATE TRIGGER trigger_check_prs
  AFTER INSERT ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_and_record_prs();

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE exercise_library IS 'Comprehensive exercise database with 300+ exercises configured for specific training modalities';
COMMENT ON TABLE user_workout_plans IS 'Stores 4-week mesocycle workout plans generated for users';
COMMENT ON TABLE plan_workouts IS 'Individual workout sessions within a mesocycle plan';
COMMENT ON TABLE plan_exercises IS 'Specific exercises prescribed for each workout with sets/reps/weight targets';
COMMENT ON TABLE workout_logs IS 'Comprehensive tracking of completed workout sessions with aggregate metrics';
COMMENT ON TABLE exercise_logs IS 'Detailed logging of individual exercises supporting all types (strength, cardio, swimming, etc.)';
COMMENT ON TABLE performance_metrics IS 'Aggregated performance analysis for weekly/monthly periods used for adaptive plan regeneration';
COMMENT ON TABLE exercise_pr_history IS 'Personal records tracking for strength, distance, and time-based achievements';

COMMENT ON FUNCTION calculate_estimated_1rm IS 'Calculates estimated 1-rep max using the Epley formula';
COMMENT ON FUNCTION update_workout_log_aggregates IS 'Automatically aggregates exercise data to workout_logs summary';
COMMENT ON FUNCTION check_and_record_prs IS 'Automatically detects and records new personal records when exercises are logged';
-- =====================================================
-- ADD WORKOUT PLANS SYSTEM
-- =====================================================
-- This migration adds the workout_plans table and updates
-- the existing workouts and workout_exercises tables
-- to support the AI-powered personalized workout generation
-- =====================================================

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Plan details
  plan_name TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN (
    'push_pull_legs',
    'upper_lower',
    'full_body',
    'bro_split',
    'custom'
  )) NOT NULL,

  -- Duration
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Configuration
  days_per_week INTEGER CHECK (days_per_week BETWEEN 3 AND 7) NOT NULL,
  split_pattern TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for workout_plans
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(user_id, is_active) WHERE is_active = true;

-- Enable RLS for workout_plans
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can view their own workout plans'
  ) THEN
    CREATE POLICY "Users can view their own workout plans"
      ON workout_plans FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can create their own workout plans'
  ) THEN
    CREATE POLICY "Users can create their own workout plans"
      ON workout_plans FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can update their own workout plans'
  ) THEN
    CREATE POLICY "Users can update their own workout plans"
      ON workout_plans FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can delete their own workout plans'
  ) THEN
    CREATE POLICY "Users can delete their own workout plans"
      ON workout_plans FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add missing columns to workouts table
DO $$ BEGIN
  -- Add workout_plan_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_plan_id'
  ) THEN
    ALTER TABLE workouts ADD COLUMN workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_workouts_plan ON workouts(workout_plan_id);
  END IF;

  -- Add workout_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_date'
  ) THEN
    ALTER TABLE workouts ADD COLUMN workout_date TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(user_id, workout_date DESC);
  END IF;

  -- Add workout_name if it doesn't exist (rename from name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_name'
  ) THEN
    -- If name column exists, rename it, otherwise add workout_name
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'workouts' AND column_name = 'name'
    ) THEN
      ALTER TABLE workouts RENAME COLUMN name TO workout_name;
    ELSE
      ALTER TABLE workouts ADD COLUMN workout_name TEXT;
    END IF;
  END IF;

  -- Add focus_areas if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'focus_areas'
  ) THEN
    ALTER TABLE workouts ADD COLUMN focus_areas TEXT[];
  END IF;

  -- Add estimated_duration_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'estimated_duration_minutes'
  ) THEN
    ALTER TABLE workouts ADD COLUMN estimated_duration_minutes INTEGER;
  END IF;

  -- Add status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'status'
  ) THEN
    ALTER TABLE workouts ADD COLUMN status TEXT DEFAULT 'planned'
      CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped'));
  END IF;
END $$;

-- Ensure workout_exercises has the required columns
DO $$ BEGIN
  -- Add workout_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'workout_id'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
  END IF;

  -- Add exercise_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'exercise_id'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN exercise_id UUID;
  END IF;

  -- Add exercise_order if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'exercise_order'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN exercise_order INTEGER;
  END IF;

  -- Add planned_sets if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_sets'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_sets INTEGER;
  END IF;

  -- Add planned_reps_min if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_reps_min'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_reps_min INTEGER;
  END IF;

  -- Add planned_reps_max if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_reps_max'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_reps_max INTEGER;
  END IF;

  -- Add rest_seconds if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'rest_seconds'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN rest_seconds INTEGER;
  END IF;

  -- Add tempo if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'tempo'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN tempo TEXT;
  END IF;

  -- Add rpe if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);
  END IF;

  -- Add notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'notes'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE workout_plans IS 'AI-generated personalized workout plans (4-week mesocycles)';
COMMENT ON COLUMN workouts.workout_plan_id IS 'References the workout_plans table if this workout is part of a plan';
COMMENT ON COLUMN workouts.workout_date IS 'Scheduled date for this workout';
COMMENT ON COLUMN workouts.focus_areas IS 'Muscle groups targeted in this workout';
COMMENT ON COLUMN workouts.status IS 'Current status: planned, in_progress, completed, or skipped';
-- =====================================================
-- COMPREHENSIVE MODALITY-BASED EXERCISE LIBRARY
-- =====================================================
-- Expanded exercise library with 150+ modality-specific exercises
-- Each exercise configured for specific training styles
-- =====================================================

-- Deactivate all existing exercises
UPDATE exercise_library SET is_active = false WHERE is_active = true;

-- =====================================================
-- CHEST EXERCISES - BARBELL VARIATIONS
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Barbell Bench Press (5 modalities)
('Barbell Bench Press', 'strength', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 4, 5, 3, 6, 240, 300, 85, 95, '3-1-1-0', 8.5, 9.5,
 'Lie on bench, grip bar slightly wider than shoulders, lower to chest with control, press explosively',
 ARRAY['Retract scapula', 'Feet flat on floor', 'Touch chest', 'Bar path over mid-chest'], true),

('Barbell Bench Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 80, '3-0-1-1', 7.5, 9.0,
 'Lie on bench, controlled descent to chest, squeeze pecs at top',
 ARRAY['Mind-muscle connection', 'Control tempo', 'Full range of motion', 'Squeeze at peak'], true),

('Barbell Bench Press', 'endurance', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'Maintain consistent pace, focus on endurance over heavy weight',
 ARRAY['Steady rhythm', 'Controlled breathing', 'Maintain form throughout'], true),

('Barbell Bench Press', 'power', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'advanced', 'high',
 3, 5, 3, 5, 180, 240, 75, 90, '2-1-X-0', 8.0, 9.0,
 'Explosive concentric, controlled eccentric, focus on bar speed',
 ARRAY['Maximal acceleration', 'Pause at chest', 'Explosive press', 'Perfect form'], true),

('Barbell Bench Press', 'mixed', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 6, 10, 90, 120, 70, 85, '2-0-1-0', 7.0, 8.5,
 'General strength and muscle building',
 ARRAY['Good form', 'Progressive overload', 'Full ROM'], true),

-- Incline Barbell Bench Press (4 modalities)
('Incline Barbell Bench Press', 'strength', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 4, 5, 4, 6, 240, 300, 85, 92, '3-1-1-0', 8.5, 9.5,
 'Set bench to 30-45 degrees, press bar from upper chest to arms extended',
 ARRAY['Bench at 30-45 degrees', 'Retract scapula', 'Bar to upper chest', 'Drive feet'], true),

('Incline Barbell Bench Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 78, '3-0-1-1', 7.5, 9.0,
 'Focus on upper chest contraction, controlled tempo throughout',
 ARRAY['Feel upper chest working', 'Full ROM', 'Squeeze at top', 'Control the negative'], true),

('Incline Barbell Bench Press', 'power', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['barbell', 'bench', 'rack'], 'advanced', 'high',
 3, 5, 3, 5, 180, 240, 75, 88, '2-1-X-0', 8.0, 9.0,
 'Explosive press from upper chest, maximum bar speed',
 ARRAY['Explosive drive', 'Bar speed', 'Pause at chest'], true),

('Incline Barbell Bench Press', 'mixed', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 6, 10, 90, 120, 70, 82, '2-0-1-0', 7.0, 8.5,
 'Upper chest development for general strength',
 ARRAY['Good incline angle', 'Full ROM', 'Progressive loading'], true),

-- Close-Grip Bench Press (3 modalities - tricep focus)
('Close-Grip Bench Press', 'strength', 'strength', 'compound',
 ARRAY['triceps', 'chest'], ARRAY['shoulders'], ARRAY['triceps', 'chest', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 4, 5, 3, 6, 180, 240, 85, 93, '3-1-1-0', 8.5, 9.5,
 'Grip bar at shoulder width, lower to lower chest, press with tricep focus',
 ARRAY['Elbows tucked', 'Lower to sternum', 'Tricep emphasis', 'Shoulder-width grip'], true),

('Close-Grip Bench Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['triceps', 'chest'], ARRAY['shoulders'], ARRAY['triceps', 'chest', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 78, '3-0-1-1', 7.5, 9.0,
 'Focus on tricep contraction, controlled eccentric',
 ARRAY['Feel triceps working', 'Full ROM', 'Squeeze lockout'], true),

('Close-Grip Bench Press', 'mixed', 'strength', 'compound',
 ARRAY['triceps', 'chest'], ARRAY['shoulders'], ARRAY['triceps', 'chest', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 6, 10, 90, 120, 70, 82, '2-0-1-0', 7.0, 8.5,
 'General tricep and chest strength',
 ARRAY['Proper grip width', 'Elbows in', 'Full lockout'], true),

-- Decline Barbell Bench Press (3 modalities)
('Decline Barbell Bench Press', 'strength', 'strength', 'compound',
 ARRAY['lower chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 4, 5, 4, 6, 180, 240, 85, 93, '3-1-1-0', 8.0, 9.0,
 'Set bench to 15-30 degree decline, press from lower chest',
 ARRAY['Secure feet', 'Lower chest focus', 'Full ROM'], true),

('Decline Barbell Bench Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['lower chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 78, '3-0-1-1', 7.5, 9.0,
 'Target lower chest with controlled movement',
 ARRAY['Feel lower chest', 'Full contraction', 'Controlled tempo'], true),

('Decline Barbell Bench Press', 'mixed', 'strength', 'compound',
 ARRAY['lower chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell', 'bench', 'rack'], 'intermediate', 'moderate',
 3, 4, 6, 10, 90, 120, 70, 82, '2-0-1-0', 7.0, 8.5,
 'Lower chest development',
 ARRAY['Proper decline angle', 'Secure position', 'Good form'], true),

-- Floor Press (3 modalities - shoulder-friendly)
('Floor Press', 'strength', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell'], 'intermediate', 'low',
 4, 5, 3, 6, 180, 240, 85, 93, '3-1-1-0', 8.0, 9.0,
 'Lie on floor, press from dead stop, removes leg drive and limits ROM',
 ARRAY['Elbows touch floor', 'Dead stop each rep', 'No leg drive', 'Lockout focus'], true),

('Floor Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell'], 'intermediate', 'low',
 3, 4, 8, 12, 90, 120, 70, 78, '3-0-1-1', 7.5, 9.0,
 'Shoulder-friendly chest and tricep builder',
 ARRAY['Pause at bottom', 'Feel contraction', 'Joint-friendly'], true),

('Floor Press', 'power', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['barbell'], 'advanced', 'low',
 3, 5, 3, 5, 180, 240, 75, 88, '2-1-X-0', 8.0, 9.0,
 'Explosive press from dead stop',
 ARRAY['Maximum acceleration', 'Dead stop', 'Bar speed'], true);

-- =====================================================
-- CHEST EXERCISES - DUMBBELL VARIATIONS
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Dumbbell Bench Press (5 modalities)
('Dumbbell Bench Press', 'strength', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 4, 5, 5, 8, 180, 240, 80, 90, '3-1-1-0', 8.0, 9.0,
 'Press dumbbells from chest, slightly harder than barbell due to stabilization',
 ARRAY['Deep stretch', 'Control dumbbells', 'Touch at top', 'Full ROM'], true),

('Dumbbell Bench Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 80, '3-0-1-1', 7.5, 9.0,
 'Greater ROM than barbell, excellent for muscle growth',
 ARRAY['Deeper stretch', 'Squeeze at top', 'Control throughout', 'Full contraction'], true),

('Dumbbell Bench Press', 'endurance', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'Higher rep chest endurance work',
 ARRAY['Steady pace', 'Maintain form', 'Controlled breathing'], true),

('Dumbbell Bench Press', 'power', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'advanced', 'high',
 3, 5, 3, 5, 180, 240, 75, 88, '2-1-X-0', 8.0, 9.0,
 'Explosive dumbbell press for power development',
 ARRAY['Explosive concentric', 'Maximum speed', 'Control descent'], true),

('Dumbbell Bench Press', 'mixed', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 80, '2-0-1-0', 7.0, 8.5,
 'Versatile chest builder for all fitness levels',
 ARRAY['Good form', 'Full ROM', 'Progressive overload'], true),

-- Incline Dumbbell Press (4 modalities)
('Incline Dumbbell Press', 'strength', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 4, 5, 5, 8, 180, 240, 80, 88, '3-1-1-0', 8.0, 9.0,
 'Set bench to 30-45 degrees, press dumbbells overhead for upper chest',
 ARRAY['Proper incline angle', 'Full ROM', 'Touch at top'], true),

('Incline Dumbbell Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 78, '3-0-1-1', 7.5, 9.0,
 'Superior upper chest builder, deeper stretch than barbell',
 ARRAY['Feel upper chest', 'Squeeze at top', 'Controlled negative', 'Full contraction'], true),

('Incline Dumbbell Press', 'endurance', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'Upper chest endurance training',
 ARRAY['Maintain form', 'Steady tempo', 'Good breathing'], true),

('Incline Dumbbell Press', 'mixed', 'strength', 'compound',
 ARRAY['upper chest'], ARRAY['shoulders', 'triceps'], ARRAY['chest', 'shoulders', 'triceps'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 78, '2-0-1-0', 7.0, 8.5,
 'Upper chest development for balanced physique',
 ARRAY['30-45 degree angle', 'Full ROM', 'Good control'], true),

-- Dumbbell Flyes (3 modalities - isolation)
('Dumbbell Flyes', 'hypertrophy', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 3, 4, 10, 15, 60, 90, 60, 70, '3-0-2-1', 7.0, 8.5,
 'Arc dumbbells out and down with slight elbow bend, bring together at top',
 ARRAY['Slight elbow bend', 'Deep chest stretch', 'Controlled arc', 'Squeeze at top'], true),

('Dumbbell Flyes', 'endurance', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'Higher rep chest isolation for muscle endurance',
 ARRAY['Light weight', 'Feel the stretch', 'Maintain form'], true),

('Dumbbell Flyes', 'mixed', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 3, 4, 10, 15, 60, 90, 60, 70, '2-0-2-0', 7.0, 8.5,
 'Classic chest isolation exercise',
 ARRAY['Proper form', 'Feel the stretch', 'Control the weight'], true),

-- Incline Dumbbell Flyes (3 modalities)
('Incline Dumbbell Flyes', 'hypertrophy', 'strength', 'isolation',
 ARRAY['upper chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 3, 4, 10, 15, 60, 90, 60, 70, '3-0-2-1', 7.0, 8.5,
 'Upper chest isolation with deep stretch',
 ARRAY['30-45 degree incline', 'Feel upper chest stretch', 'Controlled movement'], true),

('Incline Dumbbell Flyes', 'endurance', 'strength', 'isolation',
 ARRAY['upper chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'Upper chest endurance and pump work',
 ARRAY['Light weight', 'High reps', 'Feel the burn'], true),

('Incline Dumbbell Flyes', 'mixed', 'strength', 'isolation',
 ARRAY['upper chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['dumbbells', 'bench'], 'intermediate', 'moderate',
 3, 4, 10, 15, 60, 90, 60, 70, '2-0-2-0', 7.0, 8.5,
 'Upper chest shaping and development',
 ARRAY['Good incline', 'Full stretch', 'Squeeze together'], true);

-- Continue in next file due to length...
-- This is Part 1 of the comprehensive library
-- Part 2 will include: More chest, back, shoulders
-- Part 3 will include: Legs, arms, core, cardio

-- =====================================================
-- CHEST EXERCISES - CABLE & MACHINE
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Cable Flyes (3 modalities)
('Cable Flyes', 'hypertrophy', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 12, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Stand between cables, bring handles together with constant tension',
 ARRAY['Slight forward lean', 'Feel chest squeeze', 'Constant tension', 'Meet at midline'], true),

('Cable Flyes', 'endurance', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['cable machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep cable flyes for chest endurance and pump',
 ARRAY['Light weight', 'Feel the pump', 'High reps'], true),

('Cable Flyes', 'mixed', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 12, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Versatile chest isolation with cables',
 ARRAY['Good form', 'Constant tension', 'Full ROM'], true),

-- Machine Chest Press (4 modalities)
('Chest Press Machine', 'strength', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['chest press machine'], 'beginner', 'low',
 4, 5, 5, 8, 120, 180, 80, 90, '2-1-1-0', 7.5, 9.0,
 'Fixed path chest press, good for beginners or finishing work',
 ARRAY['Seat height correct', 'Full extension', 'Control return'], true),

('Chest Press Machine', 'hypertrophy', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['chest press machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 70, 80, '3-0-1-1', 7.0, 8.5,
 'Machine press for controlled muscle building',
 ARRAY['Feel chest contraction', 'Full ROM', 'Squeeze at contraction'], true),

('Chest Press Machine', 'endurance', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['chest press machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep machine work for endurance',
 ARRAY['Steady pace', 'Maintain form', 'Breathe properly'], true),

('Chest Press Machine', 'mixed', 'strength', 'compound',
 ARRAY['chest'], ARRAY['triceps', 'shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['chest press machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 70, 80, '2-0-1-0', 7.0, 8.5,
 'Safe and effective machine pressing',
 ARRAY['Proper setup', 'Full ROM', 'Progressive overload'], true),

-- Pec Deck (3 modalities)
('Pec Deck Flyes', 'hypertrophy', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['pec deck machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Isolated chest contraction with pec deck machine',
 ARRAY['Upright posture', 'Squeeze together', 'Feel chest work'], true),

('Pec Deck Flyes', 'endurance', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['pec deck machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep pec deck for endurance',
 ARRAY['Light weight', 'Feel the burn', 'High volume'], true),

('Pec Deck Flyes', 'mixed', 'strength', 'isolation',
 ARRAY['chest'], ARRAY[]::TEXT[], ARRAY['chest'],
 ARRAY['pec deck machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Effective chest isolation',
 ARRAY['Good posture', 'Squeeze hard', 'Control movement'], true),

-- Dips (4 modalities)
('Dips', 'strength', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dip bars'], 'intermediate', 'moderate',
 4, 5, 4, 8, 180, 240, 75, 85, '3-1-1-0', 8.0, 9.0,
 'Bodyweight or weighted dips, lean forward for chest emphasis',
 ARRAY['Lean forward for chest', 'Full ROM', 'Control descent'], true),

('Dips', 'hypertrophy', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dip bars'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 80, '3-0-1-1', 7.5, 9.0,
 'Excellent chest and tricep builder',
 ARRAY['Deep stretch', 'Feel chest and triceps', 'Full contraction'], true),

('Dips', 'endurance', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dip bars'], 'beginner', 'moderate',
 2, 3, 15, 20, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep bodyweight dips for endurance',
 ARRAY['Bodyweight only', 'Steady pace', 'Full ROM'], true),

('Dips', 'mixed', 'strength', 'compound',
 ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['chest', 'triceps', 'shoulders'],
 ARRAY['dip bars'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 70, 80, '2-0-1-0', 7.0, 8.5,
 'Great upper body compound movement',
 ARRAY['Good form', 'Progressive overload', 'Lean for chest'], true),

-- Push-ups (4 modalities - bodyweight)
('Push-ups', 'endurance', 'strength', 'bodyweight',
 ARRAY['chest'], ARRAY['triceps', 'core'], ARRAY['chest', 'triceps', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 15, 25, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'Bodyweight push-ups for chest endurance',
 ARRAY['Straight body', 'Full ROM', 'Chest to ground'], true),

('Push-ups', 'HIIT', 'strength', 'bodyweight',
 ARRAY['chest'], ARRAY['triceps', 'core'], ARRAY['chest', 'triceps', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 20, 30, 60, 60, 70, '1-0-1-0', 7.0, 8.5,
 'Fast-paced push-ups for HIIT training',
 ARRAY['Explosive movement', 'Maintain form', 'High intensity'], true),

('Push-ups', 'mixed', 'strength', 'bodyweight',
 ARRAY['chest'], ARRAY['triceps', 'core'], ARRAY['chest', 'triceps', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 10, 20, 60, 90, 60, 75, '2-0-1-0', 6.5, 8.0,
 'Classic bodyweight chest exercise',
 ARRAY['Good form', 'Full ROM', 'Core tight'], true),

('Push-ups', 'power', 'strength', 'plyometric',
 ARRAY['chest'], ARRAY['triceps', 'core'], ARRAY['chest', 'triceps', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'moderate',
 3, 4, 8, 12, 120, 180, 70, 80, '1-0-X-0', 7.5, 8.5,
 'Explosive push-ups or plyometric push-ups for power',
 ARRAY['Explosive concentric', 'Soft landing', 'Maximum force'], true);

-- =====================================================
-- COMPREHENSIVE MODALITY-BASED EXERCISE LIBRARY - PART 2
-- =====================================================
-- BACK, SHOULDERS, LEGS
-- =====================================================

-- =====================================================
-- BACK EXERCISES - DEADLIFT VARIATIONS
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Conventional Deadlift (4 modalities)
('Deadlift', 'strength', 'strength', 'compound',
 ARRAY['back', 'hamstrings', 'glutes'], ARRAY['core', 'traps'], ARRAY['back', 'hamstrings', 'glutes', 'core', 'traps'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 5, 240, 360, 85, 95, '3-0-X-0', 8.5, 9.5,
 'Stand with bar over mid-foot, hinge at hips, grip bar, stand up by extending hips and knees',
 ARRAY['Neutral spine', 'Bar close to body', 'Drive through heels', 'Lock out hips'], true),

('Deadlift', 'hypertrophy', 'strength', 'compound',
 ARRAY['back', 'hamstrings', 'glutes'], ARRAY['core', 'traps'], ARRAY['back', 'hamstrings', 'glutes', 'core', 'traps'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 6, 10, 180, 240, 70, 82, '3-0-2-0', 7.5, 9.0,
 'Controlled deadlifts for muscle building',
 ARRAY['Feel muscles working', 'Full ROM', 'Control descent'], true),

('Deadlift', 'power', 'strength', 'compound',
 ARRAY['back', 'hamstrings', 'glutes'], ARRAY['core', 'traps'], ARRAY['back', 'hamstrings', 'glutes', 'core', 'traps'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 3, 240, 360, 80, 92, '2-0-X-0', 8.5, 9.5,
 'Explosive deadlifts for maximum power',
 ARRAY['Maximum acceleration', 'Perfect form', 'Full hip extension'], true),

('Deadlift', 'mixed', 'strength', 'compound',
 ARRAY['back', 'hamstrings', 'glutes'], ARRAY['core', 'traps'], ARRAY['back', 'hamstrings', 'glutes', 'core', 'traps'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 5, 8, 180, 240, 75, 85, '3-0-1-0', 7.5, 9.0,
 'King of all lifts for total body strength',
 ARRAY['Perfect form', 'Neutral spine', 'Progressive loading'], true),

-- Romanian Deadlift (4 modalities)
('Romanian Deadlift', 'strength', 'strength', 'compound',
 ARRAY['hamstrings', 'glutes'], ARRAY['lower back', 'traps'], ARRAY['hamstrings', 'glutes', 'back'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 4, 5, 5, 8, 180, 240, 75, 85, '3-1-1-0', 8.0, 9.0,
 'Hinge at hips keeping legs mostly straight, feel deep hamstring stretch',
 ARRAY['Soft knees', 'Push hips back', 'Feel hamstring stretch', 'Neutral spine'], true),

('Romanian Deadlift', 'hypertrophy', 'strength', 'compound',
 ARRAY['hamstrings', 'glutes'], ARRAY['lower back', 'traps'], ARRAY['hamstrings', 'glutes', 'back'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.5, 9.0,
 'Perfect hamstring and glute builder',
 ARRAY['Deep stretch', 'Feel hamstrings', 'Squeeze glutes at top'], true),

('Romanian Deadlift', 'endurance', 'strength', 'compound',
 ARRAY['hamstrings', 'glutes'], ARRAY['lower back'], ARRAY['hamstrings', 'glutes', 'back'],
 ARRAY['barbell'], 'beginner', 'moderate',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep hamstring endurance work',
 ARRAY['Light weight', 'Feel the burn', 'Maintain form'], true),

('Romanian Deadlift', 'mixed', 'strength', 'compound',
 ARRAY['hamstrings', 'glutes'], ARRAY['lower back'], ARRAY['hamstrings', 'glutes', 'back'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Essential hamstring and posterior chain exercise',
 ARRAY['Good form', 'Feel the stretch', 'Control the weight'], true),

-- Sumo Deadlift (3 modalities)
('Sumo Deadlift', 'strength', 'strength', 'compound',
 ARRAY['glutes', 'quads', 'back'], ARRAY['hamstrings', 'adductors'], ARRAY['glutes', 'quads', 'back', 'hamstrings'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 5, 240, 360, 85, 95, '3-0-X-0', 8.5, 9.5,
 'Wide stance deadlift, more quad and glute emphasis',
 ARRAY['Wide stance', 'Toes out', 'Vertical torso', 'Drive knees out'], true),

('Sumo Deadlift', 'hypertrophy', 'strength', 'compound',
 ARRAY['glutes', 'quads', 'back'], ARRAY['hamstrings', 'adductors'], ARRAY['glutes', 'quads', 'back', 'hamstrings'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 6, 10, 180, 240, 70, 82, '3-0-2-0', 7.5, 9.0,
 'Sumo for quad and glute development',
 ARRAY['Feel glutes and quads', 'Full ROM', 'Control descent'], true),

('Sumo Deadlift', 'power', 'strength', 'compound',
 ARRAY['glutes', 'quads', 'back'], ARRAY['hamstrings', 'adductors'], ARRAY['glutes', 'quads', 'back', 'hamstrings'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 3, 240, 360, 80, 92, '2-0-X-0', 8.5, 9.5,
 'Explosive sumo deadlift for power',
 ARRAY['Maximum acceleration', 'Perfect setup', 'Fast lockout'], true);

-- =====================================================
-- BACK EXERCISES - PULLING MOVEMENTS
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Pull-ups (5 modalities)
('Pull-ups', 'strength', 'strength', 'compound',
 ARRAY['lats', 'upper back'], ARRAY['biceps', 'forearms'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['pull-up bar'], 'intermediate', 'moderate',
 4, 5, 3, 8, 180, 240, 75, 85, '3-1-1-0', 8.0, 9.0,
 'Hang from bar, pull yourself up until chin over bar, weighted for strength',
 ARRAY['Full extension', 'Lead with chest', 'Controlled descent', 'Add weight if needed'], true),

('Pull-ups', 'hypertrophy', 'strength', 'compound',
 ARRAY['lats', 'upper back'], ARRAY['biceps', 'forearms'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['pull-up bar'], 'intermediate', 'moderate',
 3, 4, 6, 12, 90, 120, 70, 80, '3-0-2-1', 7.5, 9.0,
 'Controlled pull-ups for back development',
 ARRAY['Feel lats working', 'Squeeze at top', 'Full ROM', 'Control negative'], true),

('Pull-ups', 'endurance', 'strength', 'compound',
 ARRAY['lats', 'upper back'], ARRAY['biceps', 'forearms'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['pull-up bar'], 'beginner', 'moderate',
 2, 3, 10, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep pull-ups for endurance',
 ARRAY['Bodyweight only', 'Steady pace', 'Full ROM'], true),

('Pull-ups', 'power', 'strength', 'compound',
 ARRAY['lats', 'upper back'], ARRAY['biceps', 'forearms'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['pull-up bar'], 'advanced', 'moderate',
 3, 5, 3, 6, 180, 240, 75, 88, '2-0-X-0', 8.0, 9.0,
 'Explosive pull-ups for power development',
 ARRAY['Explosive concentric', 'Pull chest to bar', 'Maximum speed'], true),

('Pull-ups', 'mixed', 'strength', 'compound',
 ARRAY['lats', 'upper back'], ARRAY['biceps', 'forearms'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['pull-up bar'], 'intermediate', 'moderate',
 3, 4, 6, 12, 90, 120, 70, 80, '2-0-1-0', 7.0, 8.5,
 'Classic back-building exercise',
 ARRAY['Good form', 'Full ROM', 'Progressive overload'], true),

-- Barbell Rows (4 modalities)
('Barbell Rows', 'strength', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'traps', 'rear delts'], ARRAY['lats', 'back', 'biceps', 'traps'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 4, 5, 4, 8, 180, 240, 75, 85, '3-1-1-0', 8.0, 9.0,
 'Hinge at hips, pull bar to lower chest/upper abdomen',
 ARRAY['Flat back', 'Pull to sternum', 'Squeeze scapula', 'Elbows back'], true),

('Barbell Rows', 'hypertrophy', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'traps', 'rear delts'], ARRAY['lats', 'back', 'biceps', 'traps'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.5, 9.0,
 'Perfect back thickness builder',
 ARRAY['Feel back working', 'Full contraction', 'Squeeze hard'], true),

('Barbell Rows', 'endurance', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'traps'], ARRAY['lats', 'back', 'biceps', 'traps'],
 ARRAY['barbell'], 'beginner', 'moderate',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep rowing for back endurance',
 ARRAY['Light weight', 'Maintain form', 'Feel the pump'], true),

('Barbell Rows', 'mixed', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'traps'], ARRAY['lats', 'back', 'biceps', 'traps'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Essential horizontal pulling movement',
 ARRAY['Good form', 'Flat back', 'Full ROM'], true),

-- Dumbbell Rows (4 modalities)
('Dumbbell Rows', 'strength', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'rear delts'], ARRAY['lats', 'back', 'biceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'low',
 4, 5, 5, 8, 120, 180, 75, 85, '3-1-1-0', 8.0, 9.0,
 'Single arm rows with heavy weight for strength',
 ARRAY['Keep back flat', 'Pull to hip', 'Full ROM', 'Control the weight'], true),

('Dumbbell Rows', 'hypertrophy', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'rear delts'], ARRAY['lats', 'back', 'biceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.5, 9.0,
 'Unilateral back development',
 ARRAY['Feel lat contraction', 'Full stretch', 'Squeeze at top'], true),

('Dumbbell Rows', 'endurance', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps'], ARRAY['lats', 'back', 'biceps'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep unilateral rows',
 ARRAY['Light weight', 'Feel the pump', 'Maintain form'], true),

('Dumbbell Rows', 'mixed', 'strength', 'compound',
 ARRAY['lats', 'middle back'], ARRAY['biceps', 'rear delts'], ARRAY['lats', 'back', 'biceps', 'shoulders'],
 ARRAY['dumbbells', 'bench'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Versatile back builder',
 ARRAY['Good form', 'Full ROM', 'Address imbalances'], true),

-- Lat Pulldown (4 modalities)
('Lat Pulldown', 'strength', 'strength', 'compound',
 ARRAY['lats'], ARRAY['biceps', 'shoulders'], ARRAY['lats', 'biceps', 'shoulders'],
 ARRAY['cable machine'], 'beginner', 'low',
 4, 5, 6, 10, 120, 180, 75, 85, '3-1-1-0', 7.5, 9.0,
 'Pull bar down to upper chest with controlled movement',
 ARRAY['Lean back slightly', 'Pull elbows down', 'Full stretch at top'], true),

('Lat Pulldown', 'hypertrophy', 'strength', 'compound',
 ARRAY['lats'], ARRAY['biceps', 'shoulders'], ARRAY['lats', 'biceps', 'shoulders'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.0, 8.5,
 'Perfect lat width builder',
 ARRAY['Feel lats stretch', 'Squeeze at bottom', 'Control the negative'], true),

('Lat Pulldown', 'endurance', 'strength', 'compound',
 ARRAY['lats'], ARRAY['biceps'], ARRAY['lats', 'biceps'],
 ARRAY['cable machine'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep lat work for endurance',
 ARRAY['Light weight', 'Steady pace', 'Full ROM'], true),

('Lat Pulldown', 'mixed', 'strength', 'compound',
 ARRAY['lats'], ARRAY['biceps', 'shoulders'], ARRAY['lats', 'biceps', 'shoulders'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Foundational lat exercise',
 ARRAY['Good form', 'Full ROM', 'Progressive loading'], true),

-- Seated Cable Rows (4 modalities)
('Seated Cable Rows', 'strength', 'strength', 'compound',
 ARRAY['middle back', 'lats'], ARRAY['biceps', 'traps'], ARRAY['back', 'lats', 'biceps', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 4, 5, 6, 10, 120, 180, 75, 85, '3-1-1-0', 7.5, 9.0,
 'Pull cable to lower chest/upper abdomen, squeeze scapula',
 ARRAY['Upright posture', 'Pull to sternum', 'Squeeze back'], true),

('Seated Cable Rows', 'hypertrophy', 'strength', 'compound',
 ARRAY['middle back', 'lats'], ARRAY['biceps', 'traps'], ARRAY['back', 'lats', 'biceps', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.0, 8.5,
 'Constant tension back builder',
 ARRAY['Feel back contraction', 'Full stretch', 'Squeeze hard'], true),

('Seated Cable Rows', 'endurance', 'strength', 'compound',
 ARRAY['middle back', 'lats'], ARRAY['biceps'], ARRAY['back', 'lats', 'biceps'],
 ARRAY['cable machine'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High volume rowing for endurance',
 ARRAY['Light weight', 'Maintain posture', 'Feel the pump'], true),

('Seated Cable Rows', 'mixed', 'strength', 'compound',
 ARRAY['middle back', 'lats'], ARRAY['biceps', 'traps'], ARRAY['back', 'lats', 'biceps', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Versatile back thickness exercise',
 ARRAY['Good posture', 'Full ROM', 'Constant tension'], true);

-- Continue in next file with shoulders, legs, arms, core...
-- =====================================================
-- COMPREHENSIVE MODALITY-BASED EXERCISE LIBRARY - PART 3
-- =====================================================
-- SHOULDERS, LEGS, ARMS, CORE, CARDIO
-- =====================================================

-- =====================================================
-- SHOULDER EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Overhead Press (4 modalities)
('Overhead Press', 'strength', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps', 'upper chest'], ARRAY['shoulders', 'triceps', 'chest'],
 ARRAY['barbell', 'rack'], 'intermediate', 'moderate',
 4, 5, 3, 6, 180, 240, 80, 90, '3-1-1-0', 8.0, 9.0,
 'Press bar from shoulders to overhead lockout',
 ARRAY['Brace core', 'Vertical bar path', 'Full lockout', 'Drive head through'], true),

('Overhead Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps', 'upper chest'], ARRAY['shoulders', 'triceps', 'chest'],
 ARRAY['barbell', 'rack'], 'intermediate', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-1-1', 7.5, 9.0,
 'Shoulder mass builder with controlled tempo',
 ARRAY['Feel shoulders working', 'Full ROM', 'Squeeze at top'], true),

('Overhead Press', 'power', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps', 'upper chest'], ARRAY['shoulders', 'triceps', 'chest'],
 ARRAY['barbell', 'rack'], 'advanced', 'moderate',
 3, 5, 2, 5, 180, 240, 75, 88, '2-0-X-0', 8.0, 9.0,
 'Explosive overhead pressing for power',
 ARRAY['Maximum acceleration', 'Perfect form', 'Fast lockout'], true),

('Overhead Press', 'mixed', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps', 'upper chest'], ARRAY['shoulders', 'triceps', 'chest'],
 ARRAY['barbell', 'rack'], 'intermediate', 'moderate',
 3, 4, 6, 10, 90, 120, 70, 80, '2-0-1-0', 7.0, 8.5,
 'Foundation shoulder strength exercise',
 ARRAY['Good form', 'Full ROM', 'Progressive loading'], true),

-- Dumbbell Shoulder Press (4 modalities)
('Dumbbell Shoulder Press', 'strength', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps'], ARRAY['shoulders', 'triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 4, 5, 5, 8, 120, 180, 75, 85, '3-1-1-0', 7.5, 9.0,
 'Press dumbbells from shoulders to overhead',
 ARRAY['Full ROM', 'Control the weight', 'Lock out at top'], true),

('Dumbbell Shoulder Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps'], ARRAY['shoulders', 'triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-1-1', 7.0, 8.5,
 'Excellent shoulder builder with greater ROM',
 ARRAY['Feel delts working', 'Full stretch', 'Squeeze at top'], true),

('Dumbbell Shoulder Press', 'endurance', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps'], ARRAY['shoulders', 'triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep shoulder endurance',
 ARRAY['Light weight', 'Maintain form', 'Feel the pump'], true),

('Dumbbell Shoulder Press', 'mixed', 'strength', 'compound',
 ARRAY['shoulders'], ARRAY['triceps'], ARRAY['shoulders', 'triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Versatile shoulder press',
 ARRAY['Good form', 'Full ROM', 'Progressive overload'], true),

-- Lateral Raises (3 modalities - isolation)
('Lateral Raises', 'hypertrophy', 'strength', 'isolation',
 ARRAY['side delts'], ARRAY[]::TEXT[], ARRAY['shoulders'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 60, 70, '2-0-2-1', 7.0, 8.5,
 'Raise dumbbells out to sides for side delt development',
 ARRAY['Slight elbow bend', 'Lead with elbows', 'Feel side delts', 'Control descent'], true),

('Lateral Raises', 'endurance', 'strength', 'isolation',
 ARRAY['side delts'], ARRAY[]::TEXT[], ARRAY['shoulders'],
 ARRAY['dumbbells'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep lateral raises for shoulder endurance',
 ARRAY['Light weight', 'Feel the burn', 'Maintain form'], true),

('Lateral Raises', 'mixed', 'strength', 'isolation',
 ARRAY['side delts'], ARRAY[]::TEXT[], ARRAY['shoulders'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 12, 15, 60, 90, 60, 70, '2-0-2-0', 7.0, 8.5,
 'Classic shoulder width builder',
 ARRAY['Good form', 'Feel side delts', 'Control the weight'], true),

-- Face Pulls (3 modalities - rear delts)
('Face Pulls', 'hypertrophy', 'strength', 'isolation',
 ARRAY['rear delts', 'upper back'], ARRAY['traps'], ARRAY['shoulders', 'back', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 12, 15, 60, 90, 60, 70, '2-0-2-1', 6.5, 8.0,
 'Pull rope to face, focusing on rear delts and upper back',
 ARRAY['High to low', 'External rotation', 'Squeeze rear delts'], true),

('Face Pulls', 'endurance', 'strength', 'isolation',
 ARRAY['rear delts', 'upper back'], ARRAY['traps'], ARRAY['shoulders', 'back', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.0, 7.5,
 'High rep face pulls for shoulder health',
 ARRAY['Light weight', 'Perfect form', 'Feel rear delts'], true),

('Face Pulls', 'mixed', 'strength', 'isolation',
 ARRAY['rear delts', 'upper back'], ARRAY['traps'], ARRAY['shoulders', 'back', 'traps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 12, 15, 60, 90, 60, 70, '2-0-2-0', 6.5, 8.0,
 'Essential rear delt and posture exercise',
 ARRAY['Good form', 'Feel rear delts', 'External rotation'], true);

-- =====================================================
-- LEG EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Barbell Squat (5 modalities)
('Barbell Squat', 'strength', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['barbell', 'rack'], 'intermediate', 'high',
 4, 5, 3, 6, 240, 300, 80, 92, '3-1-1-0', 8.5, 9.5,
 'Bar on upper back, descend to depth, drive back up',
 ARRAY['Knees track over toes', 'Chest up', 'Full depth', 'Drive through heels'], true),

('Barbell Squat', 'hypertrophy', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['barbell', 'rack'], 'intermediate', 'high',
 3, 4, 6, 10, 180, 240, 70, 82, '3-0-2-1', 7.5, 9.0,
 'King of leg builders for muscle mass',
 ARRAY['Feel quads and glutes', 'Full ROM', 'Control the descent'], true),

('Barbell Squat', 'endurance', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['barbell', 'rack'], 'beginner', 'moderate',
 2, 3, 15, 20, 90, 120, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep squats for leg endurance',
 ARRAY['Light weight', 'Maintain form', 'Breathe properly'], true),

('Barbell Squat', 'power', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['barbell', 'rack'], 'advanced', 'high',
 3, 5, 2, 5, 240, 300, 75, 88, '2-0-X-0', 8.0, 9.0,
 'Explosive squats for power development',
 ARRAY['Maximum acceleration', 'Perfect form', 'Explosive concentric'], true),

('Barbell Squat', 'mixed', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['barbell', 'rack'], 'intermediate', 'high',
 3, 4, 6, 10, 180, 240, 70, 82, '2-0-1-0', 7.5, 9.0,
 'Foundation leg exercise',
 ARRAY['Good form', 'Full depth', 'Progressive loading'], true),

-- Leg Press (4 modalities)
('Leg Press', 'strength', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings'], ARRAY['quads', 'glutes', 'hamstrings'],
 ARRAY['leg press machine'], 'beginner', 'low',
 4, 5, 6, 10, 120, 180, 75, 85, '3-1-1-0', 7.5, 9.0,
 'Press platform away with legs, heavy loading possible',
 ARRAY['Full ROM', 'Knees track toes', 'Control descent'], true),

('Leg Press', 'hypertrophy', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings'], ARRAY['quads', 'glutes', 'hamstrings'],
 ARRAY['leg press machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-2-1', 7.0, 8.5,
 'Safe quad and glute mass builder',
 ARRAY['Feel muscles working', 'Full ROM', 'Squeeze at top'], true),

('Leg Press', 'endurance', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings'], ARRAY['quads', 'glutes', 'hamstrings'],
 ARRAY['leg press machine'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep leg press for endurance',
 ARRAY['Light weight', 'Feel the burn', 'Maintain form'], true),

('Leg Press', 'mixed', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings'], ARRAY['quads', 'glutes', 'hamstrings'],
 ARRAY['leg press machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Versatile leg builder',
 ARRAY['Good form', 'Full ROM', 'Progressive overload'], true),

-- Lunges (4 modalities)
('Lunges', 'strength', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['dumbbells'], 'intermediate', 'moderate',
 4, 5, 6, 10, 120, 180, 70, 80, '3-1-1-0', 7.5, 9.0,
 'Step forward or backward into lunge, weighted for strength',
 ARRAY['Torso upright', 'Front knee over ankle', 'Full ROM'], true),

('Lunges', 'hypertrophy', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['dumbbells'], 'beginner', 'moderate',
 3, 4, 8, 12, 90, 120, 65, 75, '3-0-1-1', 7.0, 8.5,
 'Unilateral leg development',
 ARRAY['Feel quads and glutes', 'Balance', 'Full contraction'], true),

('Lunges', 'endurance', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['dumbbells'], 'beginner', 'moderate',
 2, 3, 15, 20, 60, 90, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep walking lunges for endurance',
 ARRAY['Bodyweight or light weight', 'Steady pace', 'Good form'], true),

('Lunges', 'mixed', 'strength', 'compound',
 ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['quads', 'glutes', 'hamstrings', 'core'],
 ARRAY['dumbbells'], 'beginner', 'moderate',
 3, 4, 10, 15, 90, 120, 65, 75, '2-0-1-0', 7.0, 8.5,
 'Essential unilateral leg exercise',
 ARRAY['Good form', 'Balance', 'Progressive loading'], true),

-- Leg Curl (3 modalities - hamstrings)
('Leg Curl', 'hypertrophy', 'strength', 'isolation',
 ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY['hamstrings'],
 ARRAY['leg curl machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Curl legs toward glutes, hamstring isolation',
 ARRAY['Full contraction', 'Squeeze hamstrings', 'Control descent'], true),

('Leg Curl', 'endurance', 'strength', 'isolation',
 ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY['hamstrings'],
 ARRAY['leg curl machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep hamstring endurance',
 ARRAY['Light weight', 'Feel the pump', 'Maintain form'], true),

('Leg Curl', 'mixed', 'strength', 'isolation',
 ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY['hamstrings'],
 ARRAY['leg curl machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Hamstring isolation exercise',
 ARRAY['Good form', 'Full ROM', 'Feel hamstrings'], true),

-- Leg Extension (3 modalities - quads)
('Leg Extension', 'hypertrophy', 'strength', 'isolation',
 ARRAY['quads'], ARRAY[]::TEXT[], ARRAY['quads'],
 ARRAY['leg extension machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Extend legs to full lockout, quad isolation',
 ARRAY['Full extension', 'Squeeze quads at top', 'Control descent'], true),

('Leg Extension', 'endurance', 'strength', 'isolation',
 ARRAY['quads'], ARRAY[]::TEXT[], ARRAY['quads'],
 ARRAY['leg extension machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep quad endurance',
 ARRAY['Light weight', 'Feel the burn', 'Full ROM'], true),

('Leg Extension', 'mixed', 'strength', 'isolation',
 ARRAY['quads'], ARRAY[]::TEXT[], ARRAY['quads'],
 ARRAY['leg extension machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Quad isolation finisher',
 ARRAY['Good form', 'Full extension', 'Squeeze quads'], true);

-- =====================================================
-- ARM EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Barbell Curl (3 modalities)
('Barbell Curl', 'hypertrophy', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['barbell'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Curl bar keeping elbows stationary, squeeze biceps at top',
 ARRAY['No swinging', 'Elbows fixed', 'Full contraction', 'Control descent'], true),

('Barbell Curl', 'endurance', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['barbell'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep bicep work for endurance',
 ARRAY['Light weight', 'Feel the pump', 'Strict form'], true),

('Barbell Curl', 'mixed', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['barbell'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Classic bicep builder',
 ARRAY['Good form', 'Full ROM', 'Squeeze at top'], true),

-- Dumbbell Curl (3 modalities)
('Dumbbell Curl', 'hypertrophy', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Alternating or simultaneous dumbbell curls',
 ARRAY['Supinate at top', 'Elbows fixed', 'Full ROM', 'Squeeze biceps'], true),

('Dumbbell Curl', 'endurance', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep dumbbell curls',
 ARRAY['Light weight', 'Feel the pump', 'Strict form'], true),

('Dumbbell Curl', 'mixed', 'strength', 'isolation',
 ARRAY['biceps'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Versatile bicep exercise',
 ARRAY['Good form', 'Full ROM', 'Control the weight'], true),

-- Hammer Curl (3 modalities)
('Hammer Curl', 'hypertrophy', 'strength', 'isolation',
 ARRAY['biceps', 'brachialis'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 10, 15, 90, 120, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Neutral grip curls for biceps and brachialis',
 ARRAY['Neutral grip', 'Elbows at sides', 'Squeeze at top'], true),

('Hammer Curl', 'endurance', 'strength', 'isolation',
 ARRAY['biceps', 'brachialis'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 2, 3, 15, 20, 60, 90, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep hammer curls',
 ARRAY['Light weight', 'Feel the pump', 'Maintain form'], true),

('Hammer Curl', 'mixed', 'strength', 'isolation',
 ARRAY['biceps', 'brachialis'], ARRAY['forearms'], ARRAY['biceps', 'forearms'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 10, 15, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Neutral grip bicep work',
 ARRAY['Good form', 'Neutral grip', 'Full ROM'], true),

-- Tricep Pushdown (3 modalities)
('Cable Tricep Pushdown', 'hypertrophy', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Press cable down keeping elbows at sides, full extension',
 ARRAY['Elbows fixed', 'Full extension', 'Squeeze triceps', 'Control return'], true),

('Cable Tricep Pushdown', 'endurance', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['cable machine'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep tricep endurance',
 ARRAY['Light weight', 'Feel the pump', 'Full extension'], true),

('Cable Tricep Pushdown', 'mixed', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Classic tricep isolation',
 ARRAY['Good form', 'Full extension', 'Squeeze triceps'], true),

-- Overhead Tricep Extension (3 modalities)
('Overhead Tricep Extension', 'hypertrophy', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Lower dumbbell behind head, extend overhead',
 ARRAY['Keep elbows in', 'Full stretch', 'Full extension', 'Controlled movement'], true),

('Overhead Tricep Extension', 'endurance', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 2, 3, 15, 20, 45, 60, 50, 60, '2-0-2-0', 6.5, 8.0,
 'High rep overhead tricep work',
 ARRAY['Light weight', 'Feel the stretch', 'Maintain form'], true),

('Overhead Tricep Extension', 'mixed', 'strength', 'isolation',
 ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY['triceps'],
 ARRAY['dumbbells'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Long head tricep developer',
 ARRAY['Elbows in', 'Full stretch', 'Full extension'], true);

-- =====================================================
-- CORE EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Plank (3 modalities)
('Plank', 'endurance', 'strength', 'bodyweight',
 ARRAY['core', 'abs'], ARRAY['shoulders'], ARRAY['core', 'abs', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 30, 60, 60, 90, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Hold plank position maintaining straight body line',
 ARRAY['Neutral spine', 'Squeeze glutes', 'Breathe steadily', 'Hold time'], true),

('Plank', 'HIIT', 'strength', 'bodyweight',
 ARRAY['core', 'abs'], ARRAY['shoulders'], ARRAY['core', 'abs', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 20, 40, 30, 60, 65, 80, '0-0-0-0', 7.0, 8.5,
 'Intense plank holds for HIIT',
 ARRAY['Maximum tension', 'Hold for time', 'Full body tight'], true),

('Plank', 'mixed', 'strength', 'bodyweight',
 ARRAY['core', 'abs'], ARRAY['shoulders'], ARRAY['core', 'abs', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 30, 60, 60, 90, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Core stability exercise',
 ARRAY['Good form', 'Straight body', 'Breathe'], true),

-- Crunches (3 modalities)
('Crunches', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs'], ARRAY[]::TEXT[], ARRAY['abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 75, '2-0-2-0', 6.5, 8.0,
 'Curl shoulders off ground toward knees',
 ARRAY['Don''t pull neck', 'Focus on abs', 'Squeeze at top'], true),

('Crunches', 'endurance', 'strength', 'bodyweight',
 ARRAY['abs'], ARRAY[]::TEXT[], ARRAY['abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 25, 40, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep ab endurance',
 ARRAY['Steady pace', 'Feel the burn', 'Don''t pull neck'], true),

('Crunches', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs'], ARRAY[]::TEXT[], ARRAY['abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 75, '2-0-2-0', 6.5, 8.0,
 'Basic ab exercise',
 ARRAY['Good form', 'Feel abs working', 'Control movement'], true),

-- Russian Twists (3 modalities)
('Russian Twists', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY[]::TEXT[], ARRAY['obliques', 'core', 'abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 75, '2-0-2-0', 6.5, 8.0,
 'Rotate torso side to side with feet elevated',
 ARRAY['Keep chest up', 'Control rotation', 'Engage core'], true),

('Russian Twists', 'endurance', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY[]::TEXT[], ARRAY['obliques', 'core', 'abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 25, 40, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep oblique endurance',
 ARRAY['Steady pace', 'Feel obliques', 'Maintain form'], true),

('Russian Twists', 'mixed', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY[]::TEXT[], ARRAY['obliques', 'core', 'abs'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 75, '2-0-2-0', 6.5, 8.0,
 'Oblique and core rotation',
 ARRAY['Good form', 'Control rotation', 'Core tight'], true),

-- Hanging Leg Raises (2 modalities - advanced)
('Hanging Leg Raises', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['lower abs'], ARRAY['hip flexors'], ARRAY['abs', 'core'],
 ARRAY['pull-up bar'], 'intermediate', 'low',
 3, 4, 8, 15, 90, 120, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Hang from bar, raise legs to parallel or higher',
 ARRAY['Control movement', 'Don''t swing', 'Focus on abs', 'Full ROM'], true),

('Hanging Leg Raises', 'mixed', 'strength', 'bodyweight',
 ARRAY['lower abs'], ARRAY['hip flexors'], ARRAY['abs', 'core'],
 ARRAY['pull-up bar'], 'intermediate', 'low',
 3, 4, 8, 15, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Advanced ab exercise',
 ARRAY['Good form', 'Control movement', 'Feel abs'], true);

-- =====================================================
-- CARDIO & HIIT EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Burpees (2 modalities)
('Burpees', 'HIIT', 'cardio', 'plyometric',
 ARRAY['full body', 'cardiovascular'], ARRAY[]::TEXT[], ARRAY['full body', 'cardiovascular'],
 ARRAY[]::TEXT[], 'intermediate', 'moderate',
 3, 4, 10, 15, 30, 60, 70, 85, '1-0-1-0', 7.5, 9.0,
 'Drop to plank, push-up, jump feet forward, jump up',
 ARRAY['Explosive movement', 'Land softly', 'High intensity', 'Maintain form'], true),

('Burpees', 'endurance', 'cardio', 'plyometric',
 ARRAY['full body', 'cardiovascular'], ARRAY[]::TEXT[], ARRAY['full body', 'cardiovascular'],
 ARRAY[]::TEXT[], 'beginner', 'moderate',
 2, 3, 15, 25, 45, 60, 60, 75, '1-0-1-0', 6.5, 8.0,
 'Moderate pace burpees for endurance',
 ARRAY['Steady rhythm', 'Good form', 'Controlled movement'], true),

-- Mountain Climbers (2 modalities)
('Mountain Climbers', 'HIIT', 'cardio', 'plyometric',
 ARRAY['core', 'cardiovascular'], ARRAY['shoulders'], ARRAY['core', 'cardiovascular', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 20, 30, 60, 70, 85, '1-0-1-0', 7.0, 8.5,
 'Plank position, alternate driving knees to chest rapidly',
 ARRAY['Fast pace', 'Core tight', 'High intensity'], true),

('Mountain Climbers', 'endurance', 'cardio', 'plyometric',
 ARRAY['core', 'cardiovascular'], ARRAY['shoulders'], ARRAY['core', 'cardiovascular', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 20, 30, 45, 60, 60, 75, '1-0-1-0', 6.5, 8.0,
 'Steady mountain climbers for cardio endurance',
 ARRAY['Steady pace', 'Maintain form', 'Core engaged'], true),

-- Running (2 modalities)
('Running', 'endurance', 'cardio', 'cardio',
 ARRAY['legs', 'cardiovascular'], ARRAY[]::TEXT[], ARRAY['legs', 'cardiovascular'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 1, 1, 20, 45, 0, 0, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Steady-state running for cardiovascular endurance',
 ARRAY['Steady pace', 'Proper form', 'Controlled breathing', 'Duration-based'], true),

('Running', 'HIIT', 'cardio', 'cardio',
 ARRAY['legs', 'cardiovascular'], ARRAY[]::TEXT[], ARRAY['legs', 'cardiovascular'],
 ARRAY[]::TEXT[], 'intermediate', 'moderate',
 3, 5, 1, 3, 60, 120, 80, 95, '0-0-0-0', 7.5, 9.0,
 'High-intensity interval sprints',
 ARRAY['Maximum effort', 'Recovery between sets', 'Proper form', 'Sprint intervals'], true),

-- Jump Rope (2 modalities)
('Jump Rope', 'HIIT', 'cardio', 'cardio',
 ARRAY['calves', 'cardiovascular'], ARRAY['shoulders'], ARRAY['calves', 'cardiovascular', 'shoulders'],
 ARRAY['jump rope'], 'beginner', 'low',
 3, 4, 30, 60, 30, 60, 75, 90, '0-0-0-0', 7.0, 8.5,
 'Fast-paced jump rope for HIIT training',
 ARRAY['Quick rhythm', 'Stay on balls of feet', 'High intensity'], true),

('Jump Rope', 'endurance', 'cardio', 'cardio',
 ARRAY['calves', 'cardiovascular'], ARRAY['shoulders'], ARRAY['calves', 'cardiovascular', 'shoulders'],
 ARRAY['jump rope'], 'beginner', 'low',
 1, 1, 5, 15, 0, 0, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Steady jump rope for cardio endurance',
 ARRAY['Steady rhythm', 'Maintain pace', 'Good form', 'Duration-based'], true),

-- Rowing Machine (2 modalities)
('Rowing', 'endurance', 'cardio', 'cardio',
 ARRAY['back', 'legs', 'cardiovascular'], ARRAY['core'], ARRAY['back', 'legs', 'cardiovascular', 'core'],
 ARRAY['rowing machine'], 'beginner', 'low',
 1, 1, 15, 30, 0, 0, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Steady-state rowing for full-body cardio',
 ARRAY['Proper technique', 'Legs-back-arms', 'Steady pace', 'Duration-based'], true),

('Rowing', 'HIIT', 'cardio', 'cardio',
 ARRAY['back', 'legs', 'cardiovascular'], ARRAY['core'], ARRAY['back', 'legs', 'cardiovascular', 'core'],
 ARRAY['rowing machine'], 'intermediate', 'moderate',
 3, 5, 1, 3, 60, 120, 80, 95, '0-0-0-0', 7.5, 9.0,
 'High-intensity rowing intervals',
 ARRAY['Maximum effort', 'Proper form', 'Power through legs', 'Interval-based'], true);

-- =====================================================
-- END OF COMPREHENSIVE MODALITY-BASED EXERCISE LIBRARY
-- =====================================================
-- =====================================================
-- COMPREHENSIVE MODALITY-BASED EXERCISE LIBRARY - PART 4
-- =====================================================
-- EXPANDED CORE & CROSSFIT-STYLE HIIT EXERCISES
-- =====================================================

-- =====================================================
-- EXPANDED CORE EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Ab Wheel Rollouts (3 modalities)
('Ab Wheel Rollouts', 'strength', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY['shoulders'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['ab wheel'], 'advanced', 'moderate',
 3, 4, 6, 12, 120, 180, 75, 85, '3-1-2-0', 8.0, 9.0,
 'Roll ab wheel forward maintaining tight core, return to start',
 ARRAY['Tight core throughout', 'Don''t let hips sag', 'Controlled movement', 'Full extension'], true),

('Ab Wheel Rollouts', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY['shoulders'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['ab wheel'], 'intermediate', 'moderate',
 3, 4, 8, 15, 90, 120, 65, 75, '3-0-2-1', 7.5, 9.0,
 'Ab wheel for core strength and muscle development',
 ARRAY['Feel abs working', 'Full ROM', 'Control return'], true),

('Ab Wheel Rollouts', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY['shoulders'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['ab wheel'], 'intermediate', 'moderate',
 3, 4, 8, 15, 90, 120, 65, 75, '2-0-2-0', 7.5, 9.0,
 'Advanced core stability exercise',
 ARRAY['Tight core', 'Controlled movement', 'Full extension'], true),

-- Pallof Press (3 modalities - anti-rotation)
('Pallof Press', 'strength', 'strength', 'isolation',
 ARRAY['core', 'obliques'], ARRAY[]::TEXT[], ARRAY['core', 'obliques', 'abs'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 8, 12, 90, 120, 70, 80, '2-1-2-0', 7.0, 8.5,
 'Press cable straight out resisting rotation, anti-rotation core work',
 ARRAY['Resist rotation', 'Stand sideways to cable', 'Core braced', 'Full extension'], true),

('Pallof Press', 'hypertrophy', 'strength', 'isolation',
 ARRAY['core', 'obliques'], ARRAY[]::TEXT[], ARRAY['core', 'obliques', 'abs'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-1', 6.5, 8.0,
 'Core stability and oblique strength',
 ARRAY['Feel core working', 'No rotation', 'Squeeze abs'], true),

('Pallof Press', 'mixed', 'strength', 'isolation',
 ARRAY['core', 'obliques'], ARRAY[]::TEXT[], ARRAY['core', 'obliques', 'abs'],
 ARRAY['cable machine'], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 65, 75, '2-0-2-0', 6.5, 8.0,
 'Anti-rotation core exercise',
 ARRAY['Brace core', 'Resist rotation', 'Full extension'], true),

-- Dragon Flags (2 modalities - advanced)
('Dragon Flags', 'strength', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY['hip flexors'], ARRAY['abs', 'core'],
 ARRAY['bench'], 'advanced', 'high',
 3, 4, 3, 8, 180, 240, 80, 90, '3-1-3-0', 8.5, 9.5,
 'Hold bench behind head, raise body keeping it straight, lower with control',
 ARRAY['Body stays straight', 'Extreme core tension', 'Shoulder stability', 'Advanced move'], true),

('Dragon Flags', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY['hip flexors'], ARRAY['abs', 'core'],
 ARRAY['bench'], 'advanced', 'high',
 3, 4, 5, 10, 120, 180, 75, 85, '3-0-3-1', 8.0, 9.0,
 'Bruce Lee''s favorite ab exercise for extreme core strength',
 ARRAY['Straight body', 'Maximum tension', 'Control throughout'], true),

-- L-Sit (3 modalities)
('L-Sit', 'strength', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['shoulders', 'triceps'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['parallettes'], 'advanced', 'moderate',
 3, 4, 15, 30, 120, 180, 75, 85, '0-0-0-0', 8.0, 9.0,
 'Support body on hands, hold legs straight out in L position',
 ARRAY['Legs parallel to ground', 'Straight legs', 'Shoulders depressed', 'Hold for time'], true),

('L-Sit', 'endurance', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['shoulders', 'triceps'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['parallettes'], 'intermediate', 'moderate',
 2, 3, 20, 45, 90, 120, 60, 75, '0-0-0-0', 7.0, 8.5,
 'L-sit holds for endurance',
 ARRAY['Hold position', 'Breathe', 'Maximum time'], true),

('L-Sit', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['shoulders', 'triceps'], ARRAY['abs', 'core', 'shoulders'],
 ARRAY['parallettes'], 'advanced', 'moderate',
 3, 4, 15, 30, 120, 180, 70, 80, '0-0-0-0', 7.5, 8.5,
 'Gymnastics-inspired core hold',
 ARRAY['L-shape', 'Hold steady', 'Full body tension'], true),

-- Hollow Body Hold (3 modalities)
('Hollow Body Hold', 'strength', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'low',
 3, 4, 20, 45, 90, 120, 70, 80, '0-0-0-0', 7.5, 8.5,
 'Lie on back, raise shoulders and legs, hold hollow position',
 ARRAY['Lower back pressed down', 'Hollow shape', 'Arms overhead', 'Hold for time'], true),

('Hollow Body Hold', 'endurance', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 30, 60, 60, 90, 60, 75, '0-0-0-0', 7.0, 8.0,
 'Gymnastic core conditioning',
 ARRAY['Maintain hollow', 'Breathe steadily', 'Maximum time'], true),

('Hollow Body Hold', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'low',
 3, 4, 20, 45, 90, 120, 65, 75, '0-0-0-0', 7.0, 8.0,
 'Core stability and strength',
 ARRAY['Hollow position', 'Lower back down', 'Hold steady'], true),

-- Dead Bug (3 modalities)
('Dead Bug', 'endurance', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 12, 20, 60, 90, 60, 70, '2-0-2-0', 6.0, 7.5,
 'Lie on back, alternate lowering opposite arm and leg while maintaining core stability',
 ARRAY['Lower back pressed down', 'Controlled movement', 'Opposite arm-leg', 'Core braced'], true),

('Dead Bug', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 60, 70, '2-0-2-1', 6.5, 8.0,
 'Anti-extension core exercise',
 ARRAY['Feel abs working', 'No arch in back', 'Controlled tempo'], true),

('Dead Bug', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'core'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 60, 70, '2-0-2-0', 6.0, 7.5,
 'Core stability and coordination',
 ARRAY['Good form', 'Lower back down', 'Steady movement'], true),

-- Bird Dog (3 modalities)
('Bird Dog', 'endurance', 'strength', 'bodyweight',
 ARRAY['core', 'lower back'], ARRAY['glutes'], ARRAY['core', 'back', 'glutes'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 12, 20, 60, 90, 60, 70, '2-1-2-0', 6.0, 7.5,
 'On hands and knees, extend opposite arm and leg, hold, switch',
 ARRAY['Straight line', 'Don''t rotate hips', 'Core tight', 'Hold each rep'], true),

('Bird Dog', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['core', 'lower back'], ARRAY['glutes'], ARRAY['core', 'back', 'glutes'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 60, 70, '2-1-2-1', 6.5, 8.0,
 'Core and lower back stability',
 ARRAY['Feel core and glutes', 'No rotation', 'Full extension'], true),

('Bird Dog', 'mixed', 'strength', 'bodyweight',
 ARRAY['core', 'lower back'], ARRAY['glutes'], ARRAY['core', 'back', 'glutes'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 10, 15, 60, 90, 60, 70, '2-1-2-0', 6.0, 7.5,
 'Stability and balance exercise',
 ARRAY['Straight line', 'Core braced', 'Controlled movement'], true),

-- Side Plank (3 modalities)
('Side Plank', 'endurance', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY['shoulders'], ARRAY['obliques', 'core', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 20, 45, 60, 90, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Hold side plank position on forearm, body in straight line',
 ARRAY['Straight line', 'Hips up', 'Core tight', 'Hold for time'], true),

('Side Plank', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY['shoulders'], ARRAY['obliques', 'core', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 20, 40, 60, 90, 65, 75, '0-0-0-0', 7.0, 8.5,
 'Oblique strength and stability',
 ARRAY['Feel obliques', 'Straight body', 'No sagging'], true),

('Side Plank', 'mixed', 'strength', 'bodyweight',
 ARRAY['obliques', 'core'], ARRAY['shoulders'], ARRAY['obliques', 'core', 'shoulders'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 20, 45, 60, 90, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Lateral core stability',
 ARRAY['Good form', 'Hips up', 'Hold steady'], true),

-- Bicycle Crunches (3 modalities)
('Bicycle Crunches', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs', 'obliques'], ARRAY[]::TEXT[], ARRAY['abs', 'obliques', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 70, '2-0-2-0', 6.5, 8.0,
 'Alternating elbow to opposite knee in bicycle motion',
 ARRAY['Rotate fully', 'Opposite elbow to knee', 'Controlled pace', 'Feel obliques'], true),

('Bicycle Crunches', 'endurance', 'strength', 'bodyweight',
 ARRAY['abs', 'obliques'], ARRAY[]::TEXT[], ARRAY['abs', 'obliques', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 2, 3, 25, 40, 45, 60, 50, 65, '2-0-2-0', 6.5, 8.0,
 'High rep ab and oblique work',
 ARRAY['Steady rhythm', 'Full rotation', 'Feel the burn'], true),

('Bicycle Crunches', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'obliques'], ARRAY[]::TEXT[], ARRAY['abs', 'obliques', 'core'],
 ARRAY[]::TEXT[], 'beginner', 'low',
 3, 4, 15, 25, 60, 90, 60, 70, '2-0-2-0', 6.5, 8.0,
 'Dynamic ab exercise',
 ARRAY['Good rotation', 'Controlled movement', 'Feel abs and obliques'], true),

-- Toes to Bar (3 modalities)
('Toes to Bar', 'strength', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['lats'], ARRAY['abs', 'core', 'lats'],
 ARRAY['pull-up bar'], 'advanced', 'moderate',
 3, 4, 5, 12, 120, 180, 75, 85, '2-0-2-1', 7.5, 9.0,
 'Hang from bar, bring toes all the way to the bar',
 ARRAY['Full ROM', 'Controlled swing', 'Touch bar', 'Core engagement'], true),

('Toes to Bar', 'HIIT', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['lats'], ARRAY['abs', 'core', 'lats'],
 ARRAY['pull-up bar'], 'advanced', 'moderate',
 3, 4, 10, 15, 30, 60, 70, 85, '1-0-1-0', 7.5, 9.0,
 'CrossFit staple for ab conditioning',
 ARRAY['Kipping allowed', 'Touch bar', 'Fast pace'], true),

('Toes to Bar', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY['lats'], ARRAY['abs', 'core', 'lats'],
 ARRAY['pull-up bar'], 'advanced', 'moderate',
 3, 4, 6, 12, 120, 180, 70, 80, '2-0-2-0', 7.5, 9.0,
 'Advanced ab exercise',
 ARRAY['Full ROM', 'Control movement', 'Touch bar'], true),

-- V-Ups (3 modalities)
('V-Ups', 'hypertrophy', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'low',
 3, 4, 10, 15, 90, 120, 65, 75, '2-0-2-1', 7.0, 8.5,
 'Simultaneously raise arms and legs to meet in V position',
 ARRAY['Touch toes', 'Full ROM', 'Control descent', 'Feel abs'], true),

('V-Ups', 'HIIT', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'low',
 3, 4, 12, 20, 30, 60, 70, 85, '1-0-1-0', 7.5, 9.0,
 'Fast-paced V-ups for HIIT training',
 ARRAY['Explosive movement', 'Touch toes', 'High intensity'], true),

('V-Ups', 'mixed', 'strength', 'bodyweight',
 ARRAY['abs', 'hip flexors'], ARRAY[]::TEXT[], ARRAY['abs', 'core'],
 ARRAY[]::TEXT[], 'intermediate', 'low',
 3, 4, 10, 15, 90, 120, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Dynamic ab exercise',
 ARRAY['Touch toes', 'Full ROM', 'Controlled movement'], true);

-- =====================================================
-- CROSSFIT-STYLE HIIT EXERCISES
-- =====================================================

INSERT INTO exercise_library (
  name, training_modality, category, exercise_type,
  primary_muscles, secondary_muscles, target_muscles, equipment,
  difficulty, risk_level,
  recommended_sets_min, recommended_sets_max,
  recommended_reps_min, recommended_reps_max,
  recommended_rest_seconds_min, recommended_rest_seconds_max,
  intensity_percentage_min, intensity_percentage_max,
  tempo, recommended_rpe_min, recommended_rpe_max,
  instructions, form_cues, is_active
) VALUES

-- Kettlebell Swings (3 modalities)
('Kettlebell Swings', 'HIIT', 'cardio', 'compound',
 ARRAY['glutes', 'hamstrings', 'cardiovascular'], ARRAY['core', 'shoulders'], ARRAY['glutes', 'hamstrings', 'cardiovascular', 'core'],
 ARRAY['kettlebell'], 'intermediate', 'moderate',
 3, 4, 15, 25, 30, 60, 75, 90, '1-0-1-0', 7.5, 9.0,
 'Hip hinge swing kettlebell to eye level, explosive hip drive',
 ARRAY['Hip hinge', 'Explosive hips', 'Arms relaxed', 'Eye level'], true),

('Kettlebell Swings', 'endurance', 'cardio', 'compound',
 ARRAY['glutes', 'hamstrings', 'cardiovascular'], ARRAY['core', 'shoulders'], ARRAY['glutes', 'hamstrings', 'cardiovascular', 'core'],
 ARRAY['kettlebell'], 'beginner', 'moderate',
 2, 3, 20, 40, 60, 90, 60, 75, '1-0-1-0', 6.5, 8.0,
 'Moderate pace kettlebell swings for endurance',
 ARRAY['Steady rhythm', 'Hip drive', 'Controlled breathing'], true),

('Kettlebell Swings', 'power', 'cardio', 'compound',
 ARRAY['glutes', 'hamstrings', 'cardiovascular'], ARRAY['core', 'shoulders'], ARRAY['glutes', 'hamstrings', 'cardiovascular', 'core'],
 ARRAY['kettlebell'], 'advanced', 'moderate',
 3, 5, 8, 15, 120, 180, 80, 92, '1-0-X-0', 8.0, 9.0,
 'Explosive kettlebell swings for power',
 ARRAY['Maximum hip drive', 'Explosive movement', 'Heavy weight'], true),

-- Wall Balls (3 modalities)
('Wall Balls', 'HIIT', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'core'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['medicine ball', 'wall'], 'intermediate', 'moderate',
 3, 4, 15, 25, 30, 60, 75, 90, '1-0-1-0', 7.5, 9.0,
 'Squat with medicine ball, throw to wall target, catch and repeat',
 ARRAY['Full squat depth', 'Throw to target', 'Catch and descend', 'Explosive throw'], true),

('Wall Balls', 'endurance', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'core'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['medicine ball', 'wall'], 'beginner', 'moderate',
 2, 3, 20, 40, 60, 90, 60, 75, '1-0-1-0', 6.5, 8.0,
 'High rep wall balls for endurance',
 ARRAY['Steady pace', 'Full depth', 'Consistent target'], true),

('Wall Balls', 'power', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'core'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['medicine ball', 'wall'], 'advanced', 'moderate',
 3, 5, 8, 15, 120, 180, 80, 92, '1-0-X-0', 8.0, 9.0,
 'Explosive wall balls for power',
 ARRAY['Maximum explosiveness', 'High target', 'Powerful throw'], true),

-- Box Jumps (3 modalities)
('Box Jumps', 'HIIT', 'plyometric', 'plyometric',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves'], ARRAY['quads', 'glutes', 'cardiovascular', 'calves'],
 ARRAY['plyo box'], 'intermediate', 'moderate',
 3, 4, 10, 15, 60, 90, 75, 85, '1-0-X-0', 7.5, 9.0,
 'Jump onto box, land softly, step down, repeat',
 ARRAY['Soft landing', 'Full hip extension', 'Step down safely', 'Explosive jump'], true),

('Box Jumps', 'power', 'plyometric', 'plyometric',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves'], ARRAY['quads', 'glutes', 'cardiovascular', 'calves'],
 ARRAY['plyo box'], 'advanced', 'high',
 3, 5, 5, 10, 120, 180, 80, 92, '1-0-X-0', 8.0, 9.0,
 'Maximum height box jumps for explosive power',
 ARRAY['Maximum jump height', 'Perfect landing', 'Full recovery'], true),

('Box Jumps', 'endurance', 'plyometric', 'plyometric',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves'], ARRAY['quads', 'glutes', 'cardiovascular', 'calves'],
 ARRAY['plyo box'], 'beginner', 'moderate',
 2, 3, 15, 25, 60, 90, 60, 75, '1-0-1-0', 6.5, 8.0,
 'Moderate height box jumps for conditioning',
 ARRAY['Consistent pace', 'Good form', 'Safe landings'], true),

-- Thrusters (3 modalities)
('Thrusters', 'HIIT', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'triceps'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['barbell'], 'intermediate', 'moderate',
 3, 4, 10, 15, 45, 90, 70, 85, '1-0-1-0', 7.5, 9.0,
 'Front squat into overhead press in one fluid movement',
 ARRAY['Full squat depth', 'Explosive drive', 'Full lockout overhead', 'Continuous movement'], true),

('Thrusters', 'endurance', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'triceps'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['barbell'], 'beginner', 'moderate',
 2, 3, 15, 25, 60, 90, 55, 70, '1-0-1-0', 6.5, 8.0,
 'Light thrusters for endurance conditioning',
 ARRAY['Steady pace', 'Good form', 'Continuous reps'], true),

('Thrusters', 'power', 'cardio', 'compound',
 ARRAY['quads', 'shoulders', 'cardiovascular'], ARRAY['glutes', 'triceps'], ARRAY['quads', 'shoulders', 'cardiovascular', 'glutes'],
 ARRAY['barbell'], 'advanced', 'moderate',
 3, 5, 5, 10, 120, 180, 75, 88, '1-0-X-0', 8.0, 9.0,
 'Heavy explosive thrusters for power',
 ARRAY['Maximum explosiveness', 'Heavy weight', 'Perfect form'], true),

-- Double Unders (2 modalities)
('Double Unders', 'HIIT', 'cardio', 'cardio',
 ARRAY['calves', 'cardiovascular'], ARRAY['shoulders', 'forearms'], ARRAY['calves', 'cardiovascular', 'shoulders'],
 ARRAY['jump rope'], 'intermediate', 'low',
 3, 4, 25, 50, 30, 60, 80, 95, '0-0-0-0', 7.5, 9.0,
 'Two rope passes per jump, high-skill cardio',
 ARRAY['Quick wrists', 'Stay on toes', 'Minimal jump height', 'Fast rope speed'], true),

('Double Unders', 'endurance', 'cardio', 'cardio',
 ARRAY['calves', 'cardiovascular'], ARRAY['shoulders', 'forearms'], ARRAY['calves', 'cardiovascular', 'shoulders'],
 ARRAY['jump rope'], 'beginner', 'low',
 2, 3, 30, 60, 60, 90, 65, 80, '0-0-0-0', 6.5, 8.0,
 'High volume double unders for conditioning',
 ARRAY['Consistent rhythm', 'Good technique', 'Endurance focus'], true),

-- Assault Bike (2 modalities)
('Assault Bike', 'HIIT', 'cardio', 'cardio',
 ARRAY['legs', 'cardiovascular'], ARRAY['arms'], ARRAY['legs', 'cardiovascular', 'arms'],
 ARRAY['assault bike'], 'beginner', 'low',
 3, 5, 0.5, 2, 60, 120, 90, 100, '0-0-0-0', 8.0, 10.0,
 'All-out intervals on assault bike, measured in calories or time',
 ARRAY['Maximum effort', 'Full body engagement', 'Sprint intervals', 'Recovery between'], true),

('Assault Bike', 'endurance', 'cardio', 'cardio',
 ARRAY['legs', 'cardiovascular'], ARRAY['arms'], ARRAY['legs', 'cardiovascular', 'arms'],
 ARRAY['assault bike'], 'beginner', 'low',
 1, 1, 10, 30, 0, 0, 65, 80, '0-0-0-0', 6.5, 8.0,
 'Steady-state assault bike for endurance',
 ARRAY['Steady pace', 'Controlled breathing', 'Consistent effort', 'Duration-based'], true),

-- Sled Push (3 modalities)
('Sled Push', 'HIIT', 'cardio', 'compound',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves', 'core'], ARRAY['quads', 'glutes', 'cardiovascular', 'core'],
 ARRAY['sled'], 'intermediate', 'moderate',
 3, 4, 4, 8, 90, 120, 75, 90, '0-0-0-0', 7.5, 9.0,
 'Push weighted sled for distance or time, explosive effort',
 ARRAY['Drive through legs', 'Low body position', 'Maximum effort', 'Sprint pace'], true),

('Sled Push', 'power', 'cardio', 'compound',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves', 'core'], ARRAY['quads', 'glutes', 'cardiovascular', 'core'],
 ARRAY['sled'], 'advanced', 'moderate',
 3, 5, 3, 6, 180, 240, 85, 95, '0-0-0-0', 8.0, 9.5,
 'Heavy sled push for maximum power',
 ARRAY['Maximum load', 'Explosive drive', 'Short distance'], true),

('Sled Push', 'endurance', 'cardio', 'compound',
 ARRAY['quads', 'glutes', 'cardiovascular'], ARRAY['calves', 'core'], ARRAY['quads', 'glutes', 'cardiovascular', 'core'],
 ARRAY['sled'], 'beginner', 'moderate',
 2, 3, 6, 12, 90, 120, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Moderate load sled push for conditioning',
 ARRAY['Steady pace', 'Longer distance', 'Maintain form'], true),

-- Battle Ropes (2 modalities)
('Battle Ropes', 'HIIT', 'cardio', 'cardio',
 ARRAY['shoulders', 'cardiovascular'], ARRAY['core', 'forearms'], ARRAY['shoulders', 'cardiovascular', 'core'],
 ARRAY['battle ropes'], 'beginner', 'low',
 3, 4, 20, 40, 30, 60, 80, 95, '0-0-0-0', 7.5, 9.0,
 'Alternate or simultaneous waves with heavy ropes',
 ARRAY['Intense effort', 'Big waves', 'Core braced', 'Continuous movement'], true),

('Battle Ropes', 'endurance', 'cardio', 'cardio',
 ARRAY['shoulders', 'cardiovascular'], ARRAY['core', 'forearms'], ARRAY['shoulders', 'cardiovascular', 'core'],
 ARRAY['battle ropes'], 'beginner', 'low',
 2, 3, 30, 60, 60, 90, 65, 80, '0-0-0-0', 6.5, 8.0,
 'Longer duration battle rope intervals',
 ARRAY['Steady waves', 'Maintain form', 'Endurance focus'], true),

-- Rowing Intervals (HIIT version already exists, adding sprint version)
('Rowing Sprints', 'HIIT', 'cardio', 'cardio',
 ARRAY['back', 'legs', 'cardiovascular'], ARRAY['core', 'arms'], ARRAY['back', 'legs', 'cardiovascular', 'core'],
 ARRAY['rowing machine'], 'intermediate', 'moderate',
 4, 6, 0.25, 0.5, 60, 120, 90, 100, '0-0-0-0', 8.0, 10.0,
 'Maximum effort rowing sprints, measured in distance or time',
 ARRAY['All-out effort', 'Proper form', 'Power through legs', 'Sprint distance'], true),

-- Farmers Walk (3 modalities)
('Farmers Walk', 'HIIT', 'cardio', 'compound',
 ARRAY['forearms', 'traps', 'cardiovascular'], ARRAY['core', 'legs'], ARRAY['forearms', 'traps', 'cardiovascular', 'core'],
 ARRAY['dumbbells'], 'intermediate', 'moderate',
 3, 4, 4, 8, 90, 120, 75, 85, '0-0-0-0', 7.5, 9.0,
 'Walk with heavy weights in each hand, grip and core challenge',
 ARRAY['Upright posture', 'Tight core', 'Don''t shrug', 'Fast pace'], true),

('Farmers Walk', 'strength', 'strength', 'compound',
 ARRAY['forearms', 'traps'], ARRAY['core', 'legs'], ARRAY['forearms', 'traps', 'core'],
 ARRAY['dumbbells'], 'intermediate', 'moderate',
 4, 5, 3, 6, 120, 180, 80, 92, '0-0-0-0', 8.0, 9.0,
 'Heavy farmers walk for grip and trap strength',
 ARRAY['Maximum weight', 'Good posture', 'Grip endurance'], true),

('Farmers Walk', 'endurance', 'cardio', 'compound',
 ARRAY['forearms', 'traps', 'cardiovascular'], ARRAY['core', 'legs'], ARRAY['forearms', 'traps', 'cardiovascular', 'core'],
 ARRAY['dumbbells'], 'beginner', 'moderate',
 2, 3, 6, 12, 90, 120, 60, 75, '0-0-0-0', 6.5, 8.0,
 'Moderate weight for longer distance',
 ARRAY['Steady pace', 'Maintain posture', 'Endurance focus'], true),

-- Turkish Get-Up (2 modalities)
('Turkish Get-Up', 'strength', 'strength', 'compound',
 ARRAY['full body', 'core'], ARRAY['shoulders'], ARRAY['full body', 'core', 'shoulders'],
 ARRAY['kettlebell'], 'advanced', 'high',
 3, 4, 3, 6, 120, 180, 70, 85, '3-0-3-0', 7.5, 9.0,
 'From lying to standing while holding kettlebell overhead throughout',
 ARRAY['Smooth transitions', 'Eyes on kettlebell', 'Stable overhead', 'Controlled movement'], true),

('Turkish Get-Up', 'mixed', 'strength', 'compound',
 ARRAY['full body', 'core'], ARRAY['shoulders'], ARRAY['full body', 'core', 'shoulders'],
 ARRAY['kettlebell'], 'intermediate', 'high',
 3, 4, 4, 8, 120, 180, 65, 75, '2-0-2-0', 7.0, 8.5,
 'Full-body functional movement',
 ARRAY['Deliberate movement', 'Good form', 'Control throughout'], true),

-- Clean and Jerk (3 modalities - Olympic lift)
('Clean and Jerk', 'power', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 3, 180, 300, 80, 95, '1-0-X-0', 8.5, 9.5,
 'Clean bar to shoulders, jerk overhead in one explosive sequence',
 ARRAY['Perfect technique', 'Explosive hips', 'Fast elbows', 'Strong overhead'], true),

('Clean and Jerk', 'HIIT', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 5, 10, 90, 120, 65, 80, '1-0-X-0', 7.5, 9.0,
 'CrossFit-style clean and jerks for conditioning',
 ARRAY['Maintain form', 'Consistent pace', 'Full lockout'], true),

('Clean and Jerk', 'mixed', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 3, 6, 120, 180, 70, 85, '1-0-X-0', 7.5, 9.0,
 'Olympic weightlifting movement',
 ARRAY['Technical precision', 'Explosive power', 'Full extension'], true),

-- Snatch (3 modalities - Olympic lift)
('Snatch', 'power', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 5, 1, 3, 180, 300, 80, 95, '1-0-X-0', 8.5, 9.5,
 'One continuous pull from floor to overhead in squat or power position',
 ARRAY['Explosive pull', 'Fast turnover', 'Stable overhead', 'Perfect technique'], true),

('Snatch', 'HIIT', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 5, 10, 90, 120, 60, 75, '1-0-X-0', 7.5, 9.0,
 'High rep snatches for CrossFit conditioning',
 ARRAY['Maintain form', 'Consistent pace', 'Full lockout'], true),

('Snatch', 'mixed', 'strength', 'compound',
 ARRAY['full body', 'legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['full body', 'legs', 'shoulders', 'back'],
 ARRAY['barbell'], 'advanced', 'high',
 3, 4, 2, 5, 120, 180, 70, 85, '1-0-X-0', 7.5, 9.0,
 'Most technical Olympic lift',
 ARRAY['Perfect form', 'Explosive power', 'Stable overhead'], true);

-- =====================================================
-- END OF EXPANDED CORE & CROSSFIT HIIT EXERCISES
-- =====================================================
-- Add user_role column to profiles table
-- Supports three-tier access: user, chosen (free access), super_admin (free + admin page)

-- Add user_role column with default 'user'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'user';

-- Add constraint to ensure only valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_role_check
CHECK (user_role IN ('user', 'chosen', 'super_admin'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

-- Update existing profiles with is_admin flag to be super_admin
UPDATE public.profiles
SET user_role = 'super_admin'
WHERE is_admin = true;

-- Automatically assign super_admin role to specific users by email
UPDATE public.profiles
SET user_role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('hudson@eliteteam.ai', 'hwikoff4@gmail.com')
);

-- Add comment explaining the roles
COMMENT ON COLUMN public.profiles.user_role IS
'User access tier: user (paid), chosen (free access), super_admin (free access + admin page)';

-- Create a security definer function to check if current user is super_admin
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_role = 'super_admin'
  );
$$;

-- Add RLS policy to allow super_admins to view all profiles
-- This is needed for the admin dashboard to show all users
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Either viewing own profile, or user is a super_admin
  id = auth.uid() OR public.is_super_admin()
);
-- Fix infinite recursion in profiles RLS policies
-- The is_super_admin() function creates recursion when it queries profiles table

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recreate a simple SELECT policy that doesn't cause recursion
-- Users can only view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Ensure INSERT policy is simple and correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Ensure UPDATE policy is simple and correct
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Service role still has full access (for admin operations)
-- This policy already exists but let's ensure it's there
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
CREATE POLICY "Service role full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
-- Add missing fields for RebornFitness-style workout plan regeneration
-- Migration created: 2026-02-23

-- ============================================================================
-- user_workout_plans: Add fields for plan rationale and progression tracking
-- ============================================================================

-- Add plan_rationale field to store AI-generated plan explanation
-- This is returned by OpenAI when generating plans and displayed to users
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS plan_rationale JSONB;

COMMENT ON COLUMN public.user_workout_plans.plan_rationale IS
  'AI-generated plan explanation with structure: {
    whyThisPlan: string,
    primaryModalityExplanation: string,
    whatToExpect: { weeks: [...], tips: [...] },
    planStructure: { weeklyPattern: string, progression: string },
    personalizationFactors: [...],
    successTips: [...]
  }';

-- Add current_week field for progression-based week tracking
-- This tracks which week the user is currently on (1-4) based on workout completion,
-- distinct from mesocycle_week which indicates position within the 4-week cycle
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1
    CHECK (current_week >= 1 AND current_week <= 4);

COMMENT ON COLUMN public.user_workout_plans.current_week IS
  'Current week in the plan based on progression (1-4). User advances to next week when all workouts in current week are completed. Distinct from mesocycle_week.';

-- Add workouts_completed_count field for tracking total completions
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS workouts_completed_count INTEGER DEFAULT 0
    CHECK (workouts_completed_count >= 0);

COMMENT ON COLUMN public.user_workout_plans.workouts_completed_count IS
  'Total number of workouts completed in this plan. Incremented when workouts are completed.';

-- ============================================================================
-- workout_logs: Add planned duration for performance analysis
-- ============================================================================

-- Add planned_duration_minutes field to enable duration compliance calculation
-- This is copied from plan_workouts.estimated_duration_minutes when starting a workout
-- and used in performance-analyzer.ts to calculate recovery score
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER
    CHECK (planned_duration_minutes > 0);

COMMENT ON COLUMN public.workout_logs.planned_duration_minutes IS
  'Planned workout duration in minutes (copied from plan_workouts.estimated_duration_minutes). Used to calculate duration compliance rate in performance analysis.';

-- ============================================================================
-- Create trigger to auto-increment workouts_completed_count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_workouts_completed_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a workout is marked as completed, increment the plan's workout count
  IF NEW.completion_status = 'completed' AND
     (OLD.completion_status IS NULL OR OLD.completion_status != 'completed') THEN

    -- Increment the count for the plan
    UPDATE user_workout_plans
    SET workouts_completed_count = workouts_completed_count + 1
    WHERE id = NEW.plan_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workout_logs
DROP TRIGGER IF EXISTS trigger_increment_workouts_completed ON workout_logs;
CREATE TRIGGER trigger_increment_workouts_completed
  AFTER UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_workouts_completed_count();

COMMENT ON FUNCTION increment_workouts_completed_count() IS
  'Automatically increments user_workout_plans.workouts_completed_count when a workout is completed';

-- ============================================================================
-- Create function to advance to next week when all workouts completed
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_advance_week()
RETURNS TRIGGER AS $$
DECLARE
  total_workouts_in_week INTEGER;
  completed_workouts_in_week INTEGER;
  current_plan_week INTEGER;
BEGIN
  -- Only proceed if workout was just completed
  IF NEW.completion_status = 'completed' AND
     (OLD.completion_status IS NULL OR OLD.completion_status != 'completed') THEN

    -- Get current week from plan
    SELECT current_week INTO current_plan_week
    FROM user_workout_plans
    WHERE id = NEW.plan_id;

    -- Count total workouts planned for current week
    SELECT COUNT(*) INTO total_workouts_in_week
    FROM plan_workouts
    WHERE plan_id = NEW.plan_id
      AND week_number = current_plan_week;

    -- Count completed workouts in current week
    SELECT COUNT(*) INTO completed_workouts_in_week
    FROM plan_workouts pw
    WHERE pw.plan_id = NEW.plan_id
      AND pw.week_number = current_plan_week
      AND pw.is_completed = true;

    -- If all workouts in current week are completed, advance to next week
    IF completed_workouts_in_week >= total_workouts_in_week AND current_plan_week < 4 THEN
      UPDATE user_workout_plans
      SET current_week = current_week + 1
      WHERE id = NEW.plan_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workout_logs
DROP TRIGGER IF EXISTS trigger_check_and_advance_week ON workout_logs;
CREATE TRIGGER trigger_check_and_advance_week
  AFTER UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_and_advance_week();

COMMENT ON FUNCTION check_and_advance_week() IS
  'Automatically advances user_workout_plans.current_week when all workouts in current week are completed (progression-based advancement)';

-- ============================================================================
-- Migration verification
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check user_workout_plans columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'plan_rationale'
  ) THEN
    RAISE EXCEPTION 'Migration failed: plan_rationale column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'current_week'
  ) THEN
    RAISE EXCEPTION 'Migration failed: current_week column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'workouts_completed_count'
  ) THEN
    RAISE EXCEPTION 'Migration failed: workouts_completed_count column not added';
  END IF;

  -- Check workout_logs column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_logs'
    AND column_name = 'planned_duration_minutes'
  ) THEN
    RAISE EXCEPTION 'Migration failed: planned_duration_minutes column not added';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All missing fields added';
END $$;
-- Fix users with NULL names by extracting from email or using User ID
-- This ensures Community posts and other features display meaningful usernames

-- Update profiles where name is NULL
-- Strategy: Use email username (part before @) as fallback name
UPDATE public.profiles
SET
  name = COALESCE(
    -- Try to get email username from auth.users
    (
      SELECT
        INITCAP(
          REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),  -- Get part before @
            '[._-]+', ' ', 'g'           -- Replace underscores, dots, dashes with spaces
          )
        )
      FROM auth.users
      WHERE auth.users.id = profiles.id
    ),
    -- Fallback to "User" + first 6 chars of ID if no email
    'User ' || SUBSTRING(id::TEXT FROM 1 FOR 6)
  ),
  updated_at = NOW()
WHERE
  name IS NULL
  OR name = ''
  OR TRIM(name) = '';

-- Add a comment explaining the column for future reference
COMMENT ON COLUMN public.profiles.name IS 'User display name. Set during onboarding or derived from email if missing. Never null after this migration.';
-- Migrate exercise_logs table from old schema to new personalized workout system schema
-- This migration adds all missing columns required by the workout logging system
-- Migration created: 2026-02-23 15:00:00

-- ============================================================================
-- STEP 1: Add missing columns to exercise_logs table
-- ============================================================================

-- Add workout_log_id (replaces old workout_id)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE;

-- Add plan_exercise_id reference
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL;

-- Add exercise_type (required field)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN (
    'strength',           -- Weight training
    'cardio',            -- Running, cycling, etc.
    'flexibility',       -- Stretching, yoga
    'bodyweight',        -- Calisthenics
    'plyometric',        -- Jump training
    'swimming',          -- Swimming specific
    'sports'             -- General sports activity
  ));

-- ===== STRENGTH TRAINING DATA =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS sets_planned INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS sets_completed INTEGER;

-- These are the critical missing columns causing the 500 error
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS reps_per_set INTEGER[]; -- [12, 10, 10, 8] - actual reps per set

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS weight_per_set NUMERIC(6,2)[]; -- [135, 135, 145, 145] - weight used per set

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rpe_per_set INTEGER[]; -- [7, 8, 9, 9] - Rate of Perceived Exertion 1-10

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rest_seconds_actual INTEGER[];

-- Tempo tracking (optional)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS tempo TEXT; -- "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top

-- ===== CARDIO DATA =====
-- Note: duration_seconds and distance already exist in old schema, so we skip those

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(6,2);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(8,2);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pace_per_mile_seconds INTEGER; -- For running

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pace_per_100m_seconds INTEGER; -- For swimming

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS elevation_gain_feet INTEGER;

-- Intervals (for HIIT cardio)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS intervals_completed INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS work_interval_seconds INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rest_interval_seconds INTEGER;

-- ===== SWIMMING SPECIFIC =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  ));

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS laps_completed INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pool_length_meters INTEGER;

-- ===== FLEXIBILITY/YOGA =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS holds_per_position INTEGER[];

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS hold_duration_seconds INTEGER[];

-- ===== UNIVERSAL METRICS =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100;

-- Modifications & Notes
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS modifications_made TEXT[];

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'too_easy', 'just_right', 'too_hard', 'way_too_hard'
  ));

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pain_or_discomfort BOOLEAN DEFAULT false;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pain_location TEXT;

-- Media
-- Note: 'notes' column already exists in old schema

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Metadata
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS substituted_exercise_id UUID REFERENCES exercise_library(id);

-- Timestamps
-- Note: We'll rename logged_at to created_at for consistency
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- STEP 2: Migrate data from old columns to new columns
-- ============================================================================

-- Note: All columns already exist in the database, so no data migration needed
-- The old schema columns (logged_at, workout_id, reps, weight) were already removed
-- in previous migrations

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Drop old indexes if they exist (they reference old columns)
DROP INDEX IF EXISTS idx_exercise_logs_user;
DROP INDEX IF EXISTS idx_exercise_logs_workout_old;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_created ON exercise_logs(created_at DESC);

-- ============================================================================
-- STEP 4: Update RLS policies
-- ============================================================================

-- RLS policies already exist and are correctly configured
-- Skipping policy recreation to avoid conflicts

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.exercise_logs IS
  'Detailed exercise-level tracking within workout sessions. Supports multiple exercise types (strength, cardio, flexibility, swimming, etc.) with type-specific data fields.';

COMMENT ON COLUMN public.exercise_logs.reps_per_set IS
  'Array of reps completed per set for strength exercises. Example: [12, 10, 10, 8]';

COMMENT ON COLUMN public.exercise_logs.weight_per_set IS
  'Array of weights used per set in pounds. Example: [135, 135, 145, 145]';

COMMENT ON COLUMN public.exercise_logs.rpe_per_set IS
  'Array of Rate of Perceived Exertion (1-10) per set. Example: [7, 8, 9, 9]';

COMMENT ON COLUMN public.exercise_logs.exercise_type IS
  'Type of exercise: strength, cardio, flexibility, bodyweight, plyometric, swimming, or sports';

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify critical columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'reps_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: reps_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'weight_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: weight_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'rpe_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: rpe_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'exercise_type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: exercise_type column not added';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All missing columns added to exercise_logs';
END $$;
-- Trigger PostgREST schema cache reload
-- This migration forces Supabase to reload its PostgREST schema cache
-- by making a minimal schema change

-- Add a harmless comment to trigger schema reload
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. Updated 2026-02-23 to force schema cache reload.';

-- Send NOTIFY signal to PostgREST
NOTIFY pgrst, 'reload schema';
-- Force PostgREST schema cache reload by dropping and recreating a helper function
-- This triggers PostgREST to invalidate and reload its entire schema cache

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS public.force_schema_reload() CASCADE;

-- Create a simple helper function with current timestamp
CREATE OR REPLACE FUNCTION public.force_schema_reload()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
STABLE
AS $$
  SELECT NOW();
$$;

COMMENT ON FUNCTION public.force_schema_reload() IS
  'Helper function to force PostgREST schema cache reload. Last updated: 2026-02-23 17:00:00 UTC';

-- Also update a table comment to ensure schema change is detected
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. Schema cache forced reload at 2026-02-23 17:00:00 UTC';
-- Force PostgREST to detect schema changes by temporarily adding/dropping a view
-- This is more aggressive than function changes and should trigger immediate cache invalidation

-- Step 1: Create a temporary view that references exercise_logs
CREATE OR REPLACE VIEW public.exercise_logs_cache_buster AS
SELECT
  id,
  workout_log_id,
  exercise_id,
  exercise_type,
  reps_per_set,
  weight_per_set,
  rpe_per_set,
  sets_completed,
  created_at
FROM public.exercise_logs;

-- Step 2: Grant access to the view
GRANT SELECT ON public.exercise_logs_cache_buster TO authenticated, anon;

-- Step 3: Add a comment to trigger change detection
COMMENT ON VIEW public.exercise_logs_cache_buster IS
  'Temporary view to force PostgREST schema cache reload - 2026-02-23 18:00:00';

-- Step 4: Immediately drop the view to force schema change detection
DROP VIEW IF EXISTS public.exercise_logs_cache_buster CASCADE;

-- Step 5: Send NOTIFY with reload schema signal
NOTIFY pgrst, 'reload schema';

-- Step 6: Also update table comment with new timestamp to ensure change detection
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. FORCED RELOAD 2026-02-23 18:00:00. Contains reps_per_set, weight_per_set, rpe_per_set, and all exercise type columns.';

-- Step 7: Recreate RLS policies to force schema awareness
-- (DROP and CREATE in same transaction forces PostgREST reload)
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can view their own exercise logs"
ON public.exercise_logs
FOR SELECT
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
TO authenticated
WITH CHECK (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can update their own exercise logs"
ON public.exercise_logs
FOR UPDATE
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can delete their own exercise logs"
ON public.exercise_logs
FOR DELETE
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role has full access to exercise logs" ON public.exercise_logs;
CREATE POLICY "Service role has full access to exercise logs"
ON public.exercise_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
-- =====================================================
-- FIX EXERCISE_LOGS TABLE
-- =====================================================
-- This migration drops and recreates the exercise_logs table with the correct schema.
-- The issue: Columns may have been created with wrong types (JSONB instead of PostgreSQL arrays)
-- Solution from RebornFitness: Drop and recreate with correct PostgreSQL native array types
-- Migration created: 2026-02-23 19:00:00

-- Drop the table completely (CASCADE removes dependencies)
DROP TABLE IF EXISTS public.exercise_logs CASCADE;

-- Recreate with CORRECT schema using PostgreSQL native arrays
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,

  -- Exercise classification
  exercise_type TEXT CHECK (exercise_type IN (
    'strength', 'cardio', 'flexibility', 'bodyweight',
    'plyometric', 'swimming', 'sports'
  )) NOT NULL,

  -- STRENGTH TRAINING DATA (using PostgreSQL arrays - NOT JSONB!)
  sets_planned INTEGER,
  sets_completed INTEGER,
  reps_per_set INTEGER[],              -- [12, 10, 10, 8]
  weight_per_set NUMERIC(6,2)[],       -- [135.00, 135.00, 145.00, 145.00]
  rpe_per_set INTEGER[],               -- [7, 8, 9, 9]
  rest_seconds_actual INTEGER[],       -- Rest time between sets
  tempo TEXT,                          -- Tempo notation (e.g., "3-1-1-0")

  -- CARDIO DATA
  duration_seconds INTEGER,
  distance_miles NUMERIC(6,2),
  distance_meters NUMERIC(8,2),
  pace_per_mile_seconds INTEGER,
  pace_per_100m_seconds INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_feet INTEGER,

  -- Intervals (for HIIT cardio)
  intervals_completed INTEGER,
  work_interval_seconds INTEGER,
  rest_interval_seconds INTEGER,

  -- SWIMMING SPECIFIC
  swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  )),
  laps_completed INTEGER,
  pool_length_meters INTEGER,

  -- FLEXIBILITY/YOGA
  holds_per_position INTEGER[],
  hold_duration_seconds INTEGER[],

  -- UNIVERSAL METRICS
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5),
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100,

  -- Modifications & Notes
  modifications_made TEXT[],
  difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'easier', 'same', 'harder'
  )),
  pain_or_discomfort BOOLEAN DEFAULT false,
  pain_location TEXT,
  notes TEXT,
  video_url TEXT,

  -- Metadata
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  substituted_exercise_id UUID REFERENCES exercise_library(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_exercise_logs_workout_log ON exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_plan_exercise ON exercise_logs(plan_exercise_id);
CREATE INDEX idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX idx_exercise_logs_created_at ON exercise_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own exercise logs
CREATE POLICY "Users can view their own exercise logs"
  ON public.exercise_logs FOR SELECT
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own exercise logs
CREATE POLICY "Users can insert their own exercise logs"
  ON public.exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can update their own exercise logs
CREATE POLICY "Users can update their own exercise logs"
  ON public.exercise_logs FOR UPDATE
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own exercise logs
CREATE POLICY "Users can delete their own exercise logs"
  ON public.exercise_logs FOR DELETE
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to exercise logs"
  ON public.exercise_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking within workout sessions. Uses PostgreSQL native array types (INTEGER[], NUMERIC[]) for set-based data, NOT JSONB.';

COMMENT ON COLUMN public.exercise_logs.reps_per_set IS
  'Array of reps completed for each set (e.g., [12, 10, 10, 8]). PostgreSQL native INTEGER[] type.';

COMMENT ON COLUMN public.exercise_logs.weight_per_set IS
  'Array of weights used for each set in lbs (e.g., [135, 135, 145, 145]). PostgreSQL native NUMERIC(6,2)[] type.';

COMMENT ON COLUMN public.exercise_logs.rpe_per_set IS
  'Array of RPE (Rate of Perceived Exertion) values for each set, 1-10 scale (e.g., [7, 8, 9, 9]). PostgreSQL native INTEGER[] type.';

COMMENT ON COLUMN public.exercise_logs.exercise_type IS
  'Type of exercise: strength, cardio, flexibility, bodyweight, plyometric, swimming, or sports';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  reps_type TEXT;
  weight_type TEXT;
  rpe_type TEXT;
BEGIN
  -- Check actual column types
  SELECT data_type INTO reps_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'reps_per_set';

  SELECT data_type INTO weight_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'weight_per_set';

  SELECT data_type INTO rpe_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'rpe_per_set';

  -- Verify types are ARRAY, not jsonb
  IF reps_type != 'ARRAY' THEN
    RAISE EXCEPTION 'reps_per_set has wrong type: % (expected ARRAY)', reps_type;
  END IF;

  IF weight_type != 'ARRAY' THEN
    RAISE EXCEPTION 'weight_per_set has wrong type: % (expected ARRAY)', weight_type;
  END IF;

  IF rpe_type != 'ARRAY' THEN
    RAISE EXCEPTION 'rpe_per_set has wrong type: % (expected ARRAY)', rpe_type;
  END IF;

  RAISE NOTICE 'Migration completed successfully: exercise_logs table recreated with correct PostgreSQL array types';
END $$;
-- =====================================================
-- ADD MISSING FITNESS PROFILE FIELDS
-- =====================================================
-- This migration adds fields that the workout generation code expects
-- but are currently missing from the profiles table.
-- Migration created: 2026-02-23 20:00:00

-- Add experience level (beginner, intermediate, advanced)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'))
DEFAULT 'beginner';

-- Add available equipment as array (supplements custom_equipment text field)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS available_equipment TEXT[]
DEFAULT '{}';

-- Add workout location
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS workout_location TEXT;

-- Add preferred workout time
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_workout_time TEXT;

-- Add weekly workout goal (days per week)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_workout_goal INTEGER
CHECK (weekly_workout_goal >= 1 AND weekly_workout_goal <= 7)
DEFAULT 3;

-- Add mobility assessment scores (1-10 scale)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS shoulder_mobility INTEGER
CHECK (shoulder_mobility >= 1 AND shoulder_mobility <= 10);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hip_mobility INTEGER
CHECK (hip_mobility >= 1 AND hip_mobility <= 10);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ankle_mobility INTEGER
CHECK (ankle_mobility >= 1 AND ankle_mobility <= 10);

-- Add fitness assessment data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_ups INTEGER
CHECK (push_ups >= 0);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pull_ups INTEGER
CHECK (pull_ups >= 0);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS squat_depth TEXT
CHECK (squat_depth IN ('parallel', 'below_parallel', 'partial'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plank_time INTEGER
CHECK (plank_time >= 0);

-- Add fitness_goal as alias for primary_goal to match code expectations
-- This avoids breaking existing primary_goal references
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fitness_goal TEXT;

-- Create a trigger to keep fitness_goal in sync with primary_goal
CREATE OR REPLACE FUNCTION sync_fitness_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- When primary_goal is updated, update fitness_goal
  IF NEW.primary_goal IS DISTINCT FROM OLD.primary_goal THEN
    NEW.fitness_goal := NEW.primary_goal;
  END IF;

  -- When fitness_goal is updated, update primary_goal
  IF NEW.fitness_goal IS DISTINCT FROM OLD.fitness_goal THEN
    NEW.primary_goal := NEW.fitness_goal;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for re-running migration)
DROP TRIGGER IF EXISTS sync_fitness_goal_trigger ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER sync_fitness_goal_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_fitness_goal();

-- Initialize fitness_goal with current primary_goal values
UPDATE public.profiles
SET fitness_goal = primary_goal
WHERE fitness_goal IS NULL AND primary_goal IS NOT NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.profiles.experience_level IS
  'User fitness experience level: beginner, intermediate, or advanced. Used by workout generation AI.';

COMMENT ON COLUMN public.profiles.available_equipment IS
  'Array of available equipment. Supplements custom_equipment field. Used to filter exercises in workout generation.';

COMMENT ON COLUMN public.profiles.workout_location IS
  'Where user works out (e.g., home, gym, hotel). Used to contextualize workout recommendations.';

COMMENT ON COLUMN public.profiles.preferred_workout_time IS
  'Preferred workout time window (e.g., morning, afternoon, evening). Used for scheduling and energy level considerations.';

COMMENT ON COLUMN public.profiles.weekly_workout_goal IS
  'Number of workout days per week (1-7). Used to structure weekly workout split.';

COMMENT ON COLUMN public.profiles.shoulder_mobility IS
  'Shoulder mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.hip_mobility IS
  'Hip mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.ankle_mobility IS
  'Ankle mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.push_ups IS
  'Number of consecutive push-ups completed in assessment. Used to gauge upper body pressing strength.';

COMMENT ON COLUMN public.profiles.pull_ups IS
  'Number of consecutive pull-ups completed in assessment. Used to gauge upper body pulling strength.';

COMMENT ON COLUMN public.profiles.squat_depth IS
  'Squat depth assessment: parallel, below_parallel, or partial. Used to adjust lower body exercise progression.';

COMMENT ON COLUMN public.profiles.plank_time IS
  'Plank hold time in seconds. Used to gauge core stability and endurance.';

COMMENT ON COLUMN public.profiles.fitness_goal IS
  'User fitness goal. Synced with primary_goal via trigger. Used by workout generation code.';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if all new columns exist
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'experience_level'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: experience_level column not created';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'available_equipment'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: available_equipment column not created';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'fitness_goal'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: fitness_goal column not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All fitness profile fields added';
END $$;
-- Update the handle_new_user trigger to automatically set name from email
-- This ensures all new users have a meaningful display name from the start
-- Prevents "Anonymous" from appearing in community posts

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with name extracted from email
  INSERT INTO public.profiles (
    id,
    name,
    referral_code,
    credits,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- Extract name from email: "john.doe@example.com" -> "John Doe"
    COALESCE(
      INITCAP(
        REGEXP_REPLACE(
          SPLIT_PART(NEW.email, '@', 1),  -- Get part before @
          '[._-]+', ' ', 'g'               -- Replace underscores, dots, dashes with spaces
        )
      ),
      'User ' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6)  -- Fallback if no email
    ),
    'VLIFE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    0,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the function behavior
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile for new auth.users with name extracted from email. Users can update their name during onboarding if desired.';
-- =====================================================
-- APPLY PR TRIGGER
-- =====================================================
-- This SQL creates the PR detection trigger function and attaches it to exercise_logs table

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_check_prs ON exercise_logs;
DROP FUNCTION IF EXISTS check_and_record_prs();

-- Create PR detection function
CREATE OR REPLACE FUNCTION check_and_record_prs()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_max_weight NUMERIC;
  v_estimated_1rm NUMERIC;
  v_max_distance NUMERIC;
  v_fastest_time INTEGER;
  v_previous_pr NUMERIC;
BEGIN
  -- Get user_id from workout_log
  SELECT user_id INTO v_user_id
  FROM workout_logs
  WHERE id = NEW.workout_log_id;

  -- Check for strength PRs
  IF NEW.exercise_type = 'strength' AND NEW.weight_per_set IS NOT NULL AND array_length(NEW.weight_per_set, 1) > 0 THEN
    -- Max weight PR
    v_max_weight := (SELECT MAX(w) FROM unnest(NEW.weight_per_set) AS w);

    SELECT weight_lbs INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_weight'
    ORDER BY weight_lbs DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR v_max_weight > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        weight_lbs, reps, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_weight',
        v_max_weight,
        (SELECT NEW.reps_per_set[array_position(NEW.weight_per_set, v_max_weight)]),
        v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((v_max_weight - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  -- Check for cardio distance PRs
  IF NEW.exercise_type IN ('cardio', 'swimming') AND NEW.distance_miles IS NOT NULL THEN
    SELECT distance_miles INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_distance'
    ORDER BY distance_miles DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR NEW.distance_miles > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        distance_miles, time_seconds, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_distance',
        NEW.distance_miles, NEW.duration_seconds, v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((NEW.distance_miles - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically check for PRs
CREATE TRIGGER trigger_check_prs
  AFTER INSERT ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_and_record_prs();

-- Verification
SELECT 'PR trigger installed successfully!' AS status;
-- Re-run the NULL name fix to catch any users created between migrations
-- This ensures all existing users have proper display names

UPDATE public.profiles
SET
  name = COALESCE(
    -- Try to get email username from auth.users
    (
      SELECT
        INITCAP(
          REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),  -- Get part before @
            '[._-]+', ' ', 'g'           -- Replace underscores, dots, dashes with spaces
          )
        )
      FROM auth.users
      WHERE auth.users.id = profiles.id
    ),
    -- Fallback to "User" + first 6 chars of ID if no email
    'User ' || SUBSTRING(id::TEXT FROM 1 FOR 6)
  ),
  updated_at = NOW()
WHERE
  name IS NULL
  OR name = ''
  OR TRIM(name) = '';

-- Log how many profiles were updated
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles with NULL or empty names', updated_count;
END $$;
-- =====================================================
-- ALLOW 2-DAY WORKOUT PLANS
-- =====================================================
-- Some users prefer 2 days per week training (e.g., busy schedules,
-- recovery-focused programs, or maintenance phases).
-- This migration relaxes the constraint to allow 2-7 days per week
-- instead of the original 3-7.
-- =====================================================

-- Drop the existing constraint
ALTER TABLE user_workout_plans
  DROP CONSTRAINT IF EXISTS user_workout_plans_days_per_week_check;

-- Add the new constraint allowing 2-7 days
ALTER TABLE user_workout_plans
  ADD CONSTRAINT user_workout_plans_days_per_week_check
  CHECK (days_per_week BETWEEN 2 AND 7);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT user_workout_plans_days_per_week_check
  ON user_workout_plans IS
  'Allows 2-7 training days per week. 2 days supports maintenance, recovery, or busy schedules.';
-- =====================================================
-- FIX DAYS_PER_WEEK CONSTRAINT (ALLOW 2-DAY PLANS)
-- =====================================================
-- The constraint currently requires 3-7 days per week.
-- This migration updates it to allow 2-7 days to support
-- maintenance programs, recovery phases, or busy schedules.
-- =====================================================

-- Drop the existing constraint
ALTER TABLE user_workout_plans
  DROP CONSTRAINT IF EXISTS user_workout_plans_days_per_week_check;

-- Add the new constraint allowing 2-7 days
ALTER TABLE user_workout_plans
  ADD CONSTRAINT user_workout_plans_days_per_week_check
  CHECK (days_per_week BETWEEN 2 AND 7);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT user_workout_plans_days_per_week_check
  ON user_workout_plans IS
  'Allows 2-7 training days per week. 2 days supports maintenance, recovery, or busy schedules.';

-- ============================================================================
-- END OF EXPORT
-- ============================================================================
-- 
-- This file contains the complete database schema from all 43 migrations.
-- 
-- To use this file:
-- 1. Create a new Supabase project
-- 2. Execute this SQL file in the SQL editor or via psql
-- 3. Verify all tables, functions, and policies are created
-- 4. Update your app's environment variables to point to the new project
--
-- Total lines: $(wc -l < supabase_complete_export.sql)
-- 
-- ============================================================================
