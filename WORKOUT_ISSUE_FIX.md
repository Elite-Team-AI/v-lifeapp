# Workout Movements Not Displaying - Root Cause & Fix

## Issue Summary

When starting a workout, no movements/exercises are displayed even though the workout starts successfully.

## Root Cause Analysis

Investigated the data flow from database → API → components and discovered:

1. **Exercise Library is Empty**
   - The `exercise_library` table exists but has 0 rows
   - Migration file `supabase/migrations/20260222150000_populate_exercise_library.sql` exists but was never applied
   - Contains ~150+ exercises across all training modalities (strength, hypertrophy, endurance, power, mixed)

2. **User Profile Missing Training Style**
   - Profile has `training_style: null`
   - Should be set during onboarding or in settings

3. **Plan Generation Succeeded with 0 Exercises**
   - Workout plan was created with metadata (name, schedule, etc.)
   - But the exercise insertion loop had 0 exercises to insert
   - API filtered exercises by `training_modality = null` → returned 0 results
   - Error handling logs failures but doesn't prevent plan creation

4. **Data Flow Breakdown**
   ```
   User clicks "Start Workout"
   → Fetches workout from /api/workouts/current-plan
   → Workout has plan_exercises: Array(0) ← PROBLEM HERE
   → WorkoutSession component extracts exercises from workout.plan_exercises
   → exercises.length = 0
   → No movements render
   ```

## Diagnostic Evidence

```javascript
// Console output showed:
plan_exercises: Array(0)
length: 0

// Database query confirmed:
❌ NO EXERCISES FOUND FOR THIS WORKOUT
Total exercises in entire plan: 0

// Exercise library check:
📚 Exercise Library: Total active exercises: 0
📊 Exercises by Training Modality: (empty)
```

## Solution

### Step 1: Populate Exercise Library (REQUIRED)

**Option A: Supabase Dashboard (Recommended - Easiest)**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire contents of:
   `supabase/migrations/20260222150000_populate_exercise_library.sql`
5. Click "Run" to execute
6. Verify: ~150+ exercises should be inserted

**Option B: Supabase CLI**
```bash
# Install Supabase CLI globally
npm install -g supabase

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

**Option C: Direct PostgreSQL Connection**
1. Get database password from Supabase Dashboard → Settings → Database
2. Add to `.env.local`: `SUPABASE_DB_PASSWORD=your_password`
3. Install pg: `npm install pg`
4. Run: `node apply-exercise-migration.js`

### Step 2: Set Training Style (OPTIONAL - App Should Handle This)

The app should prompt users to set their training style during onboarding. If not set:

1. Go to Settings → Fitness Profile
2. Select a training style:
   - **Strength**: Focus on max force production (3-6 reps, heavy weight)
   - **Hypertrophy**: Focus on muscle growth (8-12 reps, moderate weight)
   - **Endurance**: Focus on stamina (15-20 reps, lighter weight)
   - **Power**: Focus on explosive movements (3-5 reps, fast tempo)
   - **Mixed**: Balanced approach across all styles

### Step 3: Regenerate Workout Plan

After populating exercises:

1. Navigate to Fitness page
2. Delete the current plan (or let it expire)
3. Click "Generate New Plan"
4. The plan will now include 7-9 exercises per workout

### Verification

Run these scripts to verify the fix:

```bash
# Check exercise library is populated
node check-exercises.js
# Should show: Total active exercises: 150+

# Check table structure
node check-table-structure.js
# Should show: Total rows in exercise_library: 150+
```

## Technical Details

### Why This Happened

1. **Migration Not Auto-Applied**: Supabase migrations in `supabase/migrations/` are not automatically applied to the database. They need to be pushed via:
   - Supabase Dashboard SQL Editor
   - Supabase CLI: `supabase db push`
   - Direct PostgreSQL connection

2. **No Validation in Plan Generation**: The plan generation API (`/api/workouts/generate-plan/route.ts`) has validation at line 190 that checks if `filteredExercises.length === 0`, but this validation may have been bypassed or the error wasn't surfaced properly.

3. **Silent Failure in Exercise Insertion**: The `savePlanToDatabase` function (lines 1035-1045) logs exercise insertion errors but continues execution. This allows plans to be created with 0 exercises.

### Files Investigated

- `components/workout-session.tsx:64` - Extracts exercises from `workout.plan_exercises`
- `app/api/workouts/current-plan/route.ts:70-85` - Joins plan_exercises with exercise_library
- `app/api/workouts/generate-plan/route.ts` - Plan generation logic
  - Lines 117-122: Fetches exercises filtered by training_modality
  - Lines 174-180: Filters exercises by available equipment
  - Lines 190-206: Validates filtered exercises (should have caught this)
  - Lines 1015-1046: Inserts exercises into plan_exercises table

### Database Schema

```sql
-- Relevant tables
exercise_library (
  id uuid PRIMARY KEY,
  name text,
  training_modality text, -- 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'mixed'
  category text,
  equipment text[],
  is_active boolean
)

plan_exercises (
  id uuid PRIMARY KEY,
  workout_id uuid REFERENCES plan_workouts(id),
  exercise_id uuid REFERENCES exercise_library(id),
  exercise_order int,
  target_sets int,
  target_reps_min int,
  target_reps_max int
)
```

## Prevention

To prevent this in the future:

1. **Add Seed Data to Onboarding**: Run exercise library migration as part of initial setup
2. **Better Error Messages**: If exercise library is empty, show clear error: "Exercise library not initialized"
3. **Fail Fast**: Don't create plans with 0 exercises - throw error instead
4. **Migration Tracking**: Implement proper migration tracking table to know what's been applied
5. **Required Profile Fields**: Make training_style required during onboarding

## Quick Test

After applying the fix, test that it works:

1. Apply exercise library migration
2. Go to Fitness page
3. Click "Generate New Plan"
4. Click "Start Workout"
5. **Expected**: You should see 7-9 exercises with sets/reps/rest periods
6. **Actual before fix**: No exercises displayed

## Files Created for Diagnostics

- `check-exercises.js` - Verifies exercise library and user profile
- `check-migrations.js` - Checks applied migrations
- `check-table-structure.js` - Verifies table exists and row count
- `apply-exercise-migration.js` - Helps apply the exercise library migration
- `verify-column.js` - (From previous issue) Verifies workout_logs columns
- `force-apply-migration.js` - (From previous issue) Direct PostgreSQL migration

## Summary

**Problem**: Exercise library table is empty, causing all generated workout plans to have 0 exercises.

**Solution**: Apply the exercise library migration to populate ~150+ exercises.

**Quickest Fix**: Copy/paste SQL from `supabase/migrations/20260222150000_populate_exercise_library.sql` into Supabase Dashboard SQL Editor and run it.
