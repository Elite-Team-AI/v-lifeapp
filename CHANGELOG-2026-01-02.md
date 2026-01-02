# vLife Alpha Testing Fixes - Changelog
**Date:** January 2, 2026  
**Version:** Alpha 1.1.0

---

## Summary

This release addresses 14 fixes across Critical Blockers, UI Clarity, System Improvements, and Fitness/Onboarding categories identified during alpha testing.

---

## Critical Blockers

### 1. Weekly Reflection Prompt Logic
**Issue:** Modal appeared on every login instead of weekly.

**Changes:**
- Updated `lib/actions/app-data-internal.ts`:
  - Now only prompts on Sunday (day 0) or Monday (day 1)
  - Checks for existing reflection for current week
  - Checks `weekly_reflection_dismissed_at` column to prevent re-prompting after dismissal
- Added `dismissWeeklyReflection()` server action in `lib/actions/weekly-reflections.ts`
- Updated `app/weekly-reflection-modal.tsx`:
  - "Skip for now" button now calls dismiss action
  - Shows toast confirming skip with message about next week

**Database Migration:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_reflection_dismissed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_reflection_dismissed 
ON profiles(weekly_reflection_dismissed_at) WHERE weekly_reflection_dismissed_at IS NOT NULL;
```

---

### 2. Community User Identity Bug
**Issue:** Posts showed "Unknown User" with random AI-generated avatars.

**Changes:**
- Updated `lib/stock-images.ts`:
  - Changed `DEFAULT_AVATAR` from Unsplash URL to `/logo.png` (vLife logo)
- Updated `lib/actions/community.ts`:
  - Modified `getUserAvatar()` to use profile's `avatar_url` or fallback to vLife logo
  - Updated `getPosts()`, `getComments()`, and `getLeaderboard()` queries to fetch `avatar_url`
  - Changed fallback name from "Unknown User" to "vLife User"
- Updated `app/community/page.tsx`:
  - Current user now uses `appData?.profile?.avatar_url` for their avatar

---

### 3. Challenges Page Scroll
**Issue:** Dialog content was frozen, users couldn't scroll or exit.

**Changes:**
- Updated `app/community/page.tsx`:
  - Added `max-h-[85vh]` and `flex flex-col` to DialogContent
  - Added `overflow-y-auto flex-1 pr-1` to scrollable content container

---

### 4. AI Food Logger Voice Transcription
**Issue:** Voice input didn't transcribe on deployed builds.

**Changes:**
- Updated `components/food-logging/FoodLoggerInput.tsx`:
  - Added detailed console logging for debugging
  - Improved error messages with specific guidance based on error type
  - Better handling of "not configured" and "Unauthorized" errors
- Updated `app/api/vbot-stt/route.ts`:
  - Added logging for audio file details (type, size, name)
  - Added auth error logging
  - Added success logging with transcript preview

---

## UI Clarity & Explanations

### 5. Daily Missions Explanation
**Issue:** Users didn't understand what Daily Missions were or how XP worked.

**Changes:**
- Updated `components/gamification/DailyMissions.tsx`:
  - Added Info icon (ℹ️) next to "Daily Missions" title
  - Added modal explaining:
    - Personalized goals (AI-generated tasks)
    - XP earning system
    - Streak building
    - All-complete bonus (+50 XP)

---

### 6. VBot Purpose Explanation
**Issue:** Users confused about what VBot is for.

**Changes:**
- Updated `app/vbot/page.tsx`:
  - Added "How to use VBot" section in the empty state view
  - Explains three use cases:
    - Situational coaching (traveling, sick, limited equipment)
    - Personalized advice (uses profile and progress data)
    - On-demand Q&A (fitness, nutrition, recovery)

---

### 7. VBot Voice Chat Button Size
**Issue:** Button dominated the screen, too intrusive.

**Changes:**
- Updated `app/vbot/page.tsx`:
  - Reduced inner icon container from `h-16 w-16` to `h-9 w-9`
  - Reduced outer button padding from `px-8 py-4` to `px-5 py-2.5`
  - Reduced icon size from `h-7 w-7` to `h-4 w-4`
  - Reduced text size from `text-base` to `text-sm`
  - Reduced shadow intensity

---

### 8. AI Video Fitness Coach Exit Flow
**Issue:** Users got stuck in iframe, back button broken.

**Changes:**
- Updated `app/ai-coach/page.tsx`:
  - Added floating "Return to vLife" button (top-left)
    - Shows ArrowLeft icon with text
    - Fixed positioning with z-50
    - Dark background with blur for visibility
  - Added close button (top-right)
    - X icon button
    - Hover state changes to red
  - Both buttons navigate to `/fitness`

---

### 9. AI Fitness Coach Description
**Issue:** "Access AI Fitness Coach" button had no explanation.

**Changes:**
- Updated `app/fitness/FitnessClient.tsx`:
  - Added descriptive text below the CTA button:
    > "Camera-based movement tracking for at-home workouts. Beginner-friendly, mobility-friendly, and great for all ages."

---

## System Improvements

### 10. Meal Plan Accuracy & Structure
**Issue:** Multi-day view was confusing with inconsistent data.

**Changes:**
- Updated `app/nutrition/NutritionClient.tsx`:
  - Removed entire "Tomorrow's Plan" section
  - Simplified to single-day view for clarity

---

### 11. Snack Logging Options
**Issue:** Only breakfast/lunch/dinner available, no snack options.

**Changes:**
- Updated `components/food-logging/FoodLoggerInput.tsx`:
  - Expanded `MEAL_TYPES` array from 4 to 6 options:
    - Breakfast
    - Snack (AM)
    - Lunch
    - Snack (PM)
    - Dinner
    - Late Snack

---

## Fitness Program Logic & Onboarding

### 12. Training Style Selection in Onboarding
**Issue:** AI workouts didn't reflect user preferences.

**Changes:**
- Updated `lib/types/index.ts`:
  - Added `trainingStyle`, `availableTimeMinutes`, `trainingDaysPerWeek` to `OnboardingData` interface
- Updated `lib/contexts/onboarding-context.tsx`:
  - Added defaults: `trainingStyle: ""`, `availableTimeMinutes: 45`, `trainingDaysPerWeek: 4`
- Updated `app/onboarding/preferences/page.tsx`:
  - Renamed page from "Allergies & Preferences" to "Training & Preferences"
  - Added Training Style selector with 5 options:
    - Bodybuilding / Aesthetic
    - Strength & Power
    - Functional Fitness
    - Cardio Focus
    - Mobility / Recovery
  - Added Available Time selector (20, 30, 45, 60+ min)
  - Added Days Per Week selector (2-6 days)
- Updated `lib/actions/workouts.ts`:
  - Extended `ProfileInfo` interface with training preferences
  - Updated `fetchProfileInfo()` to fetch new columns
  - Updated AI workout generation prompt to include:
    - Training style preference
    - Target workout duration
    - Days per week context

**Database Migration:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_time_minutes INTEGER DEFAULT 45;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT 4;
```

---

### 13. Workout Split & Rest Day Explanation
**Issue:** Users didn't understand active recovery or rest day logic.

**Changes:**
- Updated `app/fitness/FitnessClient.tsx`:
  - Added `showRestDayInfo` state
  - Added Info icon (ℹ️) next to "Today's Workout" header
  - Added modal explaining:
    - Weekly split (different muscle groups per day)
    - Rest days (essential for recovery and growth)
    - Active recovery (walking, stretching, yoga)
    - What to expect (training days vs rest days)

---

### 14. Workout Logging Bug
**Issue:** Logging sets didn't increment or save correctly.

**Changes:**
- Updated `app/workout/WorkoutSession.tsx`:
  - Fixed local state update after logging sets
  - Previously relied on `router.refresh()` which doesn't update React state
  - Now updates `workout` state directly with new `completedSets` count
  - Clears reps input after logging (keeps weight for convenience)
  - Updated toast message to show set number (e.g., "Set 2/4 logged")
- Updated `lib/actions/workouts.ts`:
  - Added comprehensive logging throughout `logExerciseSet()`
  - Logs: userId, workoutId, exerciseId, setNumber, totalSets, weight, reps
  - Logs created exercise_log ID
  - Logs updated workout_exercise data
  - Added `revalidatePath("/workout")` alongside `/fitness`

---

## Files Changed

| File | Type |
|------|------|
| `lib/actions/app-data-internal.ts` | Modified |
| `lib/actions/weekly-reflections.ts` | Modified |
| `app/weekly-reflection-modal.tsx` | Modified |
| `lib/stock-images.ts` | Modified |
| `lib/actions/community.ts` | Modified |
| `app/community/page.tsx` | Modified |
| `components/food-logging/FoodLoggerInput.tsx` | Modified |
| `app/api/vbot-stt/route.ts` | Modified |
| `components/gamification/DailyMissions.tsx` | Modified |
| `app/vbot/page.tsx` | Modified |
| `app/ai-coach/page.tsx` | Modified |
| `app/fitness/FitnessClient.tsx` | Modified |
| `app/nutrition/NutritionClient.tsx` | Modified |
| `lib/types/index.ts` | Modified |
| `lib/contexts/onboarding-context.tsx` | Modified |
| `app/onboarding/preferences/page.tsx` | Modified |
| `lib/actions/workouts.ts` | Modified |
| `app/workout/WorkoutSession.tsx` | Modified |
| `supabase/migrations/20260102124105_add_training_preferences_and_reflection_dismissed.sql` | Created |
| `scripts/add_weekly_reflection_dismissed.sql` | Created |

---

## Database Changes

Migration: `20260102124105_add_training_preferences_and_reflection_dismissed.sql`

**New Columns on `profiles` table:**
| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `weekly_reflection_dismissed_at` | TIMESTAMPTZ | NULL | Tracks when user dismissed weekly reflection prompt |
| `training_style` | TEXT | NULL | User's preferred training style |
| `available_time_minutes` | INTEGER | 45 | Preferred workout duration |
| `training_days_per_week` | INTEGER | 4 | How many days user wants to train |

**New Index:**
- `idx_profiles_weekly_reflection_dismissed` on `weekly_reflection_dismissed_at` (partial index where not null)

---

## Testing Checklist

- [ ] Weekly reflection: Login 3x same day - should only show once
- [ ] Weekly reflection: Dismiss and re-login - should not show again until next week
- [ ] Community: Create post, verify name and avatar display correctly
- [ ] Community: Users without avatar show vLife logo
- [ ] Challenges: Open dialog, scroll content, close with back button
- [ ] Voice logging: Record meal on DEPLOYED build, verify transcription
- [ ] Daily Missions: Click info icon, verify explanation modal
- [ ] VBot: Verify explanation text and smaller button size
- [ ] AI Coach: Click exit buttons, verify navigation works
- [ ] AI Coach: Verify description text on Fitness page
- [ ] Meal plan: Verify only today's meals shown (no tomorrow section)
- [ ] Snack logging: Test all 6 meal type options
- [ ] Onboarding: Complete flow with new training questions
- [ ] Workout logging: Log 3 sets, verify count increments correctly
- [ ] Rest day info: Click info icon on Fitness page, verify modal

---

*Generated by vLife Development Team*

