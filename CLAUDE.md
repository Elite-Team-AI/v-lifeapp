# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**V-Life** is a comprehensive fitness and wellness app built with Next.js 16 (React Server Components), Supabase, and OpenAI. It helps users track workouts, nutrition, habits, progress, and community engagement with AI-powered coaching and insights.

## Quick Start Commands!!!

```bash
# Install dependencies
npm install

# Local development (hot reload on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server (Cloud Run compatible)
npm start

# Lint code
npm lint

# Deploy database schema changes to Supabase
supabase db push

# View Supabase logs
supabase functions logs daily-insight --follow

# Deploy Edge Functions to Supabase
supabase functions deploy --all
```

## Architecture Overview

### High-Level Structure

The app follows Next.js 16 App Router conventions with a **server-first architecture** using React Server Components (RSC) by default:

```
v-life/
├── app/                           # Next.js 16 App Router pages & layouts
│   ├── api/                       # REST API routes for specific operations
│   ├── auth/                      # Authentication pages (login, sign-up)
│   ├── dashboard/                 # Main user dashboard (RSC)
│   ├── fitness/                   # Workout tracking
│   ├── nutrition/                 # Meal planning & nutrition
│   ├── community/                 # Social features (posts, comments, reactions)
│   ├── settings/                  # User preferences & account management
│   ├── onboarding/                # Multi-step user onboarding flow
│   ├── layout.tsx                 # Root layout with fonts, metadata, providers
│   ├── page.tsx                   # Landing page (public)
│   └── [feature]-modal.tsx        # Client-side modals (lazy-loaded)
├── lib/                           # Core business logic & utilities
│   ├── actions/                   # Server Actions for mutations (18 files)
│   ├── contexts/                  # React Context providers
│   ├── hooks/                     # Custom React hooks
│   ├── supabase/                  # Supabase client/server integration
│   ├── types/                     # TypeScript domain models
│   ├── utils/                     # Helper utilities
│   ├── validations/               # Zod validation schemas
│   └── notifications/             # Push notification system
├── components/                    # Reusable UI components
│   ├── ui/                        # Radix UI-based component library
│   └── [features]/                # Feature-specific components
├── hooks/                         # Global React hooks
├── middleware.ts                  # Next.js auth middleware
├── tailwind.config.ts             # Tailwind CSS configuration
└── next.config.mjs                # Next.js configuration (standalone output)
```

### Data Flow Architecture

```
User Interaction (Client Component)
    ↓
Server Action (lib/actions/*.ts)
    ↓
Supabase Database (PostgreSQL + RLS)
    ↓
Cache Revalidation (Next.js unstable_cache)
    ↓
Context Refresh via API Route
    ↓
UI Update via AppData Context
```

### State Management Strategy

1. **Global Cached Data (AppDataProvider Context)**
   - Loads once at app startup via `/api/app-data` endpoint
   - Includes: profile, habits, progress, subscription, referrals, streaks, notifications
   - Automatically refreshes on tab focus, periodically (5-min interval), or manually
   - Consumed via `useAppData()` hook across all pages

2. **Local Component State**
   - `useState` and `useReducer` for component-specific state
   - Used in modals and interactive components

3. **Server Actions**
   - Direct database mutations without REST API overhead
   - Located in `lib/actions/*.ts`
   - Automatically trigger cache revalidation after mutations

4. **localStorage**
   - Browser timezone caching only

### Component Architecture: Server-First with Client Islands

- **Server Components (Default)**: Page files and layouts are RSC by default
  - Direct database access via Server Actions
  - No client-side JavaScript bundle for data-heavy pages

- **Client Components (`"use client"`)**: Interactive features only
  - Modals (add-habit, manage-habits, weekly-reflection, etc.)
  - Dashboard client (DashboardClient.tsx) for real-time updates
  - Forms and interactive user inputs
  - Lazy-loaded with `React.lazy()` and `Suspense` for code splitting

## Database & Backend

### Supabase Integration

**Clients:**
- `lib/supabase/client.ts` - Browser-side Supabase client (SSR-compatible)
- `lib/supabase/server.ts` - Server-side client for Server Actions & API routes
  - `createClient(request)` - Creates request-scoped client with auth cookies
  - `getAuthUser(request)` - Cached auth user per request
  - `createServiceClient()` - Admin client (no auth, for internal queries)
- `lib/supabase/middleware.ts` - Auth middleware protecting routes

**Database Features:**
- PostgreSQL with Row-Level Security (RLS) enabled
- Real-time subscriptions available (not currently used)
- Auth handled via Supabase Auth (email/password, OAuth ready)

**Key Tables:**
- `profiles` - User data, goals, preferences, timezone, training preferences (gym_access, available_equipment, training_days_per_week)
- `habits` - Daily habits with categories (fitness, nutrition, wellness)
- `habit_logs` - Completion tracking
- `workouts` - Exercise sessions
- `workout_exercises` - Exercises in workout with sets, reps, rest periods
- `exercises` - Exercise library with muscle groups, equipment, image URLs
- `exercise_logs` - Performance history for progressive overload tracking
- `personalized_workout_plans` - AI-generated workout plans
- `workout_plan_days` - Weekly schedule for workout plans
- `workout_plan_exercises` - Exercises in workout plan days
- `meals` - Meal entries with macros
- `meal_logs` - What user ate (is_eaten, eaten_at, consumed_at)
- `community_posts`, `post_reactions`, `comments` - Social features
- `weight_entries`, `progress_photos` - Progress tracking
- `subscriptions` - Billing/plan data
- `daily_insights` - AI-generated insights (one per user per local date)
- `vitalflow_suggestions` - Daily AI habit suggestions
- `vitalflow_habits_knowledge` - Knowledge base for VitalFlow suggestions
- `achievements` - Gamification achievements
- `user_achievements` - Unlocked achievements per user
- `daily_missions` - Daily mission tracking
- `supplements` - Supplement recommendations
- `notifications_preferences` - User notification settings
- `referral_stats` - Referral program tracking
- `streaks` - Gamification streak tracking (habits, workouts)

### Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key

**Optional:**
- `OPENAI_API_KEY` - For AI features (daily insights, VBot, meal planning)
- `NEXT_PUBLIC_APP_URL` - Full app URL (Cloud Run deployments)

## Key Patterns & Conventions

### Server Actions Pattern

Located in `lib/actions/*.ts`. Each action:
1. Uses `"use server"` directive
2. Accepts user input (validated with Zod schemas)
3. Authenticates user with `getAuthUser()` or `requireUser()` helper
4. Mutates database via Supabase
5. Revalidates cache with `revalidateTag()` to update AppData context

Example:
```typescript
// lib/actions/habits.ts
export async function createHabit(input: CreateHabitInput) {
  const { user, error: authError } = await getAuthUser()
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const validated = createHabitSchema.parse(input)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('habits')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag('user-habits', 'max')
  return { success: true, habit: data, error: null }
}
```

**CRITICAL Pattern for RLS:** When fetching multiple data types in parallel (e.g., in `/api/app-data`), use a **single Supabase client instance** for all operations. Creating multiple clients breaks Row-Level Security (RLS) because `auth.uid()` requires the auth context from the same client that performed the initial authentication.

**Example:**
```typescript
// CORRECT: Single client shared across all queries
const supabase = await createClient()
const { user } = await supabase.auth.getUser()
const profile = await getProfileInternal(user.id, supabase) // Pass same client
const habits = await getUserHabitsInternal(user.id, timezone, supabase) // Pass same client

// WRONG: Creates new clients, breaks RLS
const { user } = await getAuthUser() // Creates client #1
const supabase = await createClient() // Creates client #2
// RLS fails because auth.uid() is in different client context
```

### Timezone Handling

- Browser timezone auto-detected and synced to user profile
- `useTimezoneSync()` hook handles syncing
- `lib/utils/timezone.ts` provides utilities like `getTodayInTimezone()`
- Daily resets are timezone-aware (habits reset at midnight local time)

### Authentication & Authorization

1. **Middleware Protection** (`middleware.ts`)
   - Public routes: `/`, `/auth/*`, `/privacy-policy`, `/terms-of-service`, `/download`, `/help-support`
   - Protected routes: Everything else, redirects unauthenticated users to `/auth/login`
   - Session managed via secure HTTP-only cookies (handled by `@supabase/ssr`)
   - **Performance Optimizations:**
     - Skip prefetch requests if session cookie exists (instant prefetching)
     - Trust session cookie for client-side navigations from authenticated routes (no validation call)
     - Full validation only on initial page loads
     - 3 optimization levels: prefetch skip → client navigation trust → full validation

2. **User Helpers** (`lib/utils/user-helpers.ts`)
   - `getAuthUser()` - Returns `{ user, error }` object (preferred for Server Actions)
   - `requireUser()` - Throws if not authenticated, returns current user (legacy)
   - `getUser()` - Returns null if not authenticated
   - `getUserTimezone()` - Gets user's timezone from profile
   - `getUserRole()` - Returns user role (user/chosen/super_admin)
   - `isSuperAdmin()` - Check admin status

3. **Supabase Clients** (`lib/supabase/server.ts`)
   - `createClient()` - Request-scoped client with auth cookies (NOT cached)
   - `getAuthUser()` - Memoized per-request using React's `cache()` to avoid multiple auth calls
   - `createServiceClient()` - Service client without cookies (bypasses RLS, use carefully)
   - `createAdminClient()` - Admin client with service role key (full access, use with caution)

4. **Row-Level Security (RLS)**
   - All tables have RLS policies
   - Users can only access their own data
   - Policies use `auth.uid()` to filter by authenticated user
   - **CRITICAL:** RLS context is tied to the Supabase client instance - don't mix clients!

### API Routes vs Server Actions

**Use Server Actions** for mutations (create, update, delete):
- Simpler code (no request/response handling)
- Automatic form handling
- Built-in validation with Zod
- Integrated cache invalidation

**Use API Routes** (`app/api/*.ts`) for:
- Streaming responses (VBot chatbot)
- External webhooks
- Public endpoints
- Complex request/response logic

Key API routes:
- `GET /api/app-data` - Bootstrap all user data (single auth check, parallel queries)
- `POST /api/vbot` - AI chatbot with OpenAI streaming
- `POST /api/vbot-stt` - Speech-to-text (Google Gemini)
- `POST /api/vbot-tts` - Text-to-speech (Google Gemini)
- `POST /api/settings/*` - Various settings mutations

### Internal Functions Pattern

**Location:** `lib/actions/app-data-internal.ts`

Internal functions accept `userId`, `timezone`, and `supabase` client as parameters instead of fetching auth themselves. This eliminates redundant auth checks when fetching multiple data types in parallel.

**Naming Convention:** Functions end with `Internal` suffix (e.g., `getProfileInternal`, `getUserHabitsInternal`)

**Usage:** Only use these from the `/api/app-data` route where auth is already verified with a shared Supabase client.

**Example:**
```typescript
// api/app-data/route.ts
const supabase = await createClient()
const { user } = await supabase.auth.getUser() // Single auth check

// Get profile first to extract timezone
const profile = await getProfileInternal(user.id, supabase)
const timezone = profile?.timezone || DEFAULT_TIMEZONE

// Fetch all data in parallel with shared client
const [habits, workouts, meals] = await Promise.all([
  getUserHabitsInternal(user.id, timezone, supabase),
  getWorkoutsInternal(user.id, timezone, supabase),
  getMealsInternal(user.id, timezone, supabase),
])
```

**Why This Matters:**
- Prevents 9+ redundant auth checks (was calling `getAuthUser()` in each action)
- Maintains single Supabase client context for RLS
- Significantly reduces database load and response time
- Bootstrap endpoint went from ~2-3s to ~500-800ms

## Important Features

### AI Integration

**VBot (AI Chatbot):**
- Streaming AI responses via OpenAI (gpt-4o-mini), Anthropic Claude, or Google Gemini
- Real-time access to ALL user data in system context:
  - Profile, habits, workouts, meals, weight, progress
  - Today's nutrition (calories, macros, remaining targets)
  - Weekly workout schedule
  - Exercise performance history (progressive overload tracking)
- Accessible from sidebar, dedicated page, and AI Coach page
- Uses `@ai-sdk/openai` for structured streaming
- API routes: `app/api/vbot/route.ts`, `app/api/vbot-stt/route.ts` (speech-to-text), `app/api/vbot-tts/route.ts` (text-to-speech)
- Can generate meal plans, provide coaching, answer fitness questions
- System context is 500+ lines with comprehensive user data

**Daily Insights:**
- AI-generated personalized messages on dashboard
- Generated once per day per user (timezone-aware)
- Cached in `daily_insights` table
- Powered by OpenAI (gpt-4o-mini model)
- Server Action: `lib/actions/daily-insights.ts`
- Called from Supabase Edge Function for background generation
- Fallback message if generation fails

**AI Workout Plan Generator:**
- Generates personalized workout plans based on:
  - User goals (muscle gain, weight loss, maintenance, endurance)
  - Gym access (yes/no)
  - Available equipment
  - Training days per week (2-7 days)
- Creates structured weekly schedule with exercises, sets, reps, rest periods
- Progressive overload tracking
- Location: `lib/actions/personalized-workouts.ts`
- Modal: `workout-plan-generator-modal.tsx`

**VitalFlow AI Habits:**
- AI-powered daily habit suggestions (3-5 per day)
- Based on user profile, goals, and historical data
- Categories: movement, nutrition, sleep, mindset, recovery, hydration
- Tracks energy delta (kcal) and time commitment
- User can accept, skip, or complete suggestions
- Location: `lib/actions/vitalflow-habits.ts`

### Gamification & Streaks

**Features:**
- XP system with levels and titles (Beginner → Legendary)
- Achievements system with unlock conditions
- Daily missions (complete 3 habits, log meal, complete workout)
- Streak tracking (habits, workouts) with best streak records
- Weekly progress percentage
- Referral system with credits and rewards

**Implementation:**
- XP awarded for: habit completion, workout completion, meal logging, weight tracking
- Levels calculated from total XP (exponential curve)
- Achievements unlock based on streaks, total actions, milestones
- Server Actions: `lib/actions/gamification.ts`
- Tables: `achievements`, `user_achievements`, `daily_missions`, `streaks`

**Example Achievements:**
- First Habit (complete first habit)
- Week Warrior (7-day habit streak)
- Consistency King (30-day habit streak)
- Gym Rat (log 10 workouts)
- Century Club (log 100 workouts)

### Community Features

- **Posts** with text and images
- **Comments** on posts
- **Reactions** (heart, celebrate, support, fire)
- **User Following** system
- Server Actions: `lib/actions/community.ts`

### Push Notifications

- Web Push API integration via Service Worker
- User can enable/disable by notification type
- API routes for subscription management
- Stored in `notifications_preferences` table

### Performance Optimizations

1. **Code Splitting**
   - Modals lazy-loaded with `React.lazy()` and `Suspense`
   - Reduces initial page bundle

2. **Caching Strategy**
   - Server Actions use `unstable_cache()` with cache tags
   - 30-second default revalidation for habits
   - `revalidateTag('user-habits')` for selective invalidation
   - Global context prevents redundant database queries

3. **Image Optimization**
   - `unoptimized: true` in `next.config.mjs` for Cloud Run
   - Images cached by CDN in production

4. **Build Output**
   - `output: "standalone"` for lean Docker images
   - Next.js compiles dependencies into build output
   - Smaller image size, faster container startup

5. **Debouncing**
   - 5-second minimum interval between context refreshes
   - Prevents excessive API calls

6. **Middleware Request Optimization**
   - **Level 1:** Skip prefetch requests if session cookie exists (instant prefetching)
   - **Level 2:** Trust session cookie for client-side navigations from protected routes (no auth call)
   - **Level 3:** Full auth validation only on initial page loads
   - Reduces middleware overhead by ~80% for authenticated users

7. **Bootstrap API Optimization**
   - Single auth check (was 9+ before)
   - Parallel database queries with Promise.all()
   - Shared Supabase client for all queries
   - Response time reduced from ~2-3s to ~500-800ms

## Testing & Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- habits.test.ts

# Run tests for a specific pattern
npm test -- --testPathPattern=actions
```

Test files located in `__tests__/` directory with `.test.ts(x)` extension.

### Local Development Tips

1. **Start dev server**
   ```bash
   npm run dev
   ```
   App available at `http://localhost:3000`

2. **Test Server Actions locally**
   - Server Actions work in development just like in production
   - Check browser console for errors
   - Check network tab for response payloads

3. **Database changes**
   - Make changes to Supabase schema via dashboard or migrations
   - Pull schema: `supabase db pull`
   - Push changes: `supabase db push`
   - Always commit schema changes to git

4. **Environment variables**
   - Create `.env.local` with required variables
   - Never commit `.env.local` (already in `.gitignore`)

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main
4. Vercel handles Next.js optimization

### Google Cloud Run

**Prerequisites:**
- gcloud CLI authenticated: `gcloud auth login && gcloud config set project PROJECT_ID`
- Artifact Registry repo: `gcloud artifacts repositories create v-life --repository-format=docker`

**Quick Deploy:**
```bash
# Build and push Docker image
./scripts/build-cloud-run.sh us-central1 "https://your-app.run.app"

# Deploy to Cloud Run
gcloud run deploy v-life \
  --image us-central1-docker.pkg.dev/PROJECT_ID/v-life/v-life:COMMIT_SHA \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

**Notes:**
- Supabase values baked into Docker image
- Standalone Next.js build (no Node.js required)
- Auto-scales with traffic, scales to 0 when idle
- See `docs/DEPLOYMENT_CLOUD_RUN.md` for detailed steps

### Local Docker Testing

```bash
docker build -t v-life:local \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:8080" \
  .

docker run --rm -p 8080:8080 v-life:local
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Auth not working locally | Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Database queries return empty despite auth | **RLS context issue!** Ensure using single Supabase client. Check if mixing `getAuthUser()` with new `createClient()` call |
| 401 errors in /api/app-data | RLS failure from multiple client instances. Use shared client pattern (see "Internal Functions Pattern") |
| Timezone confusion | Check browser timezone vs profile timezone; use `getTodayInTimezone()` |
| AI features not working | Verify `OPENAI_API_KEY` set in environment variables; check Supabase Edge Function secrets for daily insights |
| Modals not rendering | Check browser console for lazy-load errors; verify `"use client"` directive |
| Build fails with type errors | `next.config.mjs` has `ignoreBuildErrors: true`, but fix types for correctness |
| Middleware redirecting authenticated users | Check session cookie exists; verify middleware optimizations aren't skipping validation incorrectly |
| Daily insights not generating | Check Supabase Edge Function logs: `supabase functions logs daily-insight --follow` |
| Habits not resetting daily | Verify user timezone is set correctly in profile; check `last_habit_reset` field |

### Critical RLS Debugging Pattern

If you see "No rows returned" or empty arrays despite being authenticated:

1. **Check the client context:**
   ```typescript
   // Log auth state in the same client used for query
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Auth user:', user?.id)

   // Use SAME client for query
   const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id)
   console.log('Query result:', data, error)
   ```

2. **Never create a new client after auth check:**
   ```typescript
   // ❌ WRONG - breaks RLS
   const { user } = await getAuthUser()  // Creates client A
   const supabase = await createClient()  // Creates client B (no auth context!)

   // ✅ CORRECT - single client
   const supabase = await createClient()
   const { user } = await supabase.auth.getUser()
   ```

3. **Pass client to internal functions:**
   ```typescript
   // ✅ CORRECT - shared client maintains RLS context
   const profile = await getProfileInternal(user.id, supabase)
   ```

### Debug Utilities

**Logger** (`lib/utils/logger.ts`):
```typescript
import { logger } from '@/lib/utils/logger'

logger.debug('This only appears in development')
logger.error('This appears in all environments')
```

**Retry Logic** (`lib/utils/retry.ts`):
```typescript
const result = await withRetry(() => someAsyncOperation(), {
  maxAttempts: 3,
  delay: 1000
})
```

## Dependencies Overview

### Core Framework
- **Next.js 16** - React framework with RSC, App Router
- **React 19** - UI library with latest features
- **Supabase** - Backend (auth, database, storage)
- **TypeScript** - Type safety

### UI & Styling
- **Radix UI** - Unstyled accessible components
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **next-themes** - Dark mode (dark-only currently)

### Data & Validation
- **Zod** - Runtime schema validation
- **Recharts** - Data visualization

### AI & Streaming
- **@ai-sdk/openai** - OpenAI integration
- **@ai-sdk/react** - useChat hook for streaming
- **ai** - Unified AI SDK

### Other
- **react-markdown** - Render markdown (for AI responses)
- **clsx** - Class name utilities
- **tailwind-merge** - Merge Tailwind classes

## File & Naming Conventions

- **Components**: PascalCase (Button.tsx, DashboardCard.tsx)
- **Files/Folders**: kebab-case (add-habit-modal.tsx, user-helpers.ts)
- **Server Actions**: camelCase in lib/actions/ (createHabit, updateProfile)
- **Internal Functions**: camelCase + "Internal" suffix (getProfileInternal, getUserHabitsInternal)
- **Hooks**: PascalCase with 'use' prefix (useAppData, useTimezoneSync)
- **Types**: PascalCase singular (User, Habit, Profile)
- **Constants**: UPPER_SNAKE_CASE (MAX_HABIT_LENGTH, REFRESH_INTERVAL)

## Mobile Architecture (Capacitor)

**Configuration:** `capacitor.config.ts`
- App ID: `app.vlife.android`
- Strategy: Remote web app (hosted on Vercel/Cloud Run)
- Capacitor wraps in native container
- No local build directory needed in the app
- Updates instantly without app store approval

**Key Features:**
- Universal links (iOS) and App links (Android) for deep linking
- Authentication callback handling for OAuth flows
- Native capabilities: SplashScreen, StatusBar, App lifecycle
- In-app purchases via RevenueCat

**Deep Linking:**
- Custom URL scheme: `vlife://`
- Auth callback: `vlife://auth/callback`
- Handled in `app/auth/callback/page.tsx`

## Documentation Files

All documentation files are located in the `docs/` folder:

- **docs/QUICK_START.md** - 5-minute setup for daily insights feature
- **docs/DEPLOYMENT_CLOUD_RUN.md** - Google Cloud Run deployment guide
- **docs/DEPLOYMENT_CHECKLIST.md** - Pre-launch verification steps
- **docs/DAILY_INSIGHTS_IMPLEMENTATION.md** - AI insights technical details
- **docs/IMPLEMENTATION_SUMMARY.md** - Feature implementation overview
- **docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md** - Performance metrics and optimizations
- **docs/CLOUD_BUILD_SETUP.md** - Google Cloud Build setup
- **docs/VITALFLOW_DEPLOYMENT.md** - VitalFlow deployment guide
- **docs/VITALFLOW_IMPLEMENTATION_SUMMARY.md** - VitalFlow feature overview
- **docs/VITALFLOW_QUICKSTART.md** - VitalFlow quick start guide
- **docs/SCHEMA_COMPARISON.md** - Database schema comparison
- **docs/SCHEMA_DIFFERENCES.md** - Database schema differences

## Key Architectural Decisions

### 1. Server-First with Client Islands
- Default to Server Components for better performance
- Client Components only where interactivity needed
- Results in smaller bundles and faster loads

### 2. Global Context Over Per-Page Fetches
- Single bootstrap fetch prevents waterfall requests
- Data available immediately across all pages
- Background refresh keeps data fresh without blocking UI

### 3. Server Actions Over API Routes
- Simpler code (no request/response handling)
- Built-in form handling
- Automatic validation with Zod
- Use API routes only for streaming (VBot) or webhooks

### 4. Timezone-Aware Everything
- User timezone stored in profile
- All date operations use user's local time
- Habits/insights/streaks reset at local midnight

### 5. Single Supabase Client Per Request
- Prevents RLS auth context issues
- Pass same client instance to internal functions
- Critical for proper authentication

### 6. Lazy-Loaded Modals
- 20+ modals in app root
- Loaded on demand with React.lazy()
- Significantly reduces initial bundle

### 7. Mobile-First Progressive Web App
- Capacitor wrapper for native features
- Remote web app (no local build)
- Instant updates without app store

## Recent Changes & Context

- Latest commit: "Fix: Force dynamic rendering for fitness page to resolve SSG build error"
- Fitness page now uses dynamic rendering with `export const dynamic = 'force-dynamic'`
- Middleware optimizations: Skip prefetch requests, trust session cookies for client navigations
- Single Supabase client pattern implemented in `/api/app-data` to fix RLS issues
- Onboarding now focuses on primary goal selection (experimental body visualizer retired)
- All core features (dashboard, nutrition, workouts, community) wired to Supabase for state persistence
- AI insights (daily, coaching) integrated with OpenAI, Anthropic, and Google Gemini
- Push notifications fully implemented with Service Worker support
- Personalized workout plans with progressive overload tracking
- VitalFlow AI daily habit suggestions
