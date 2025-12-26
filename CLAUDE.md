# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**V-Life** is a comprehensive fitness and wellness app built with Next.js 16 (React Server Components), Supabase, and OpenAI. It helps users track workouts, nutrition, habits, progress, and community engagement with AI-powered coaching and insights.

## Quick Start Commands!!

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
- `profiles` - User data, goals, preferences, timezone
- `habits` - Daily habits with categories (fitness, nutrition, wellness)
- `habit_logs` - Completion tracking
- `workouts` - Exercise sessions
- `meals` - Meal entries with macros
- `community_posts`, `post_reactions`, `comments` - Social features
- `weight_entries`, `progress_photos` - Progress tracking
- `subscriptions` - Billing/plan data
- `daily_insights` - AI-generated insights (one per user per day)
- Plus: `supplements`, `notifications_preferences`, `referral_stats`, `streaks`, etc.

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
3. Authenticates user with `requireUser()` helper
4. Mutates database via Supabase
5. Revalidates cache with `revalidateTag()` to update AppData context

Example:
```typescript
// lib/actions/habits.ts
export async function createHabit(input: CreateHabitInput) {
  const user = await requireUser()
  const validated = createHabitSchema.parse(input)

  const { data, error } = await db
    .from('habits')
    .insert({ ...validated, user_id: user.id })

  if (error) throw new Error(error.message)

  revalidateTag('user-habits')
  return data
}
```

### Timezone Handling

- Browser timezone auto-detected and synced to user profile
- `useTimezoneSync()` hook handles syncing
- `lib/utils/timezone.ts` provides utilities like `getTodayInTimezone()`
- Daily resets are timezone-aware (habits reset at midnight local time)

### Authentication & Authorization

1. **Middleware Protection** (`middleware.ts`)
   - Public routes: `/`, `/auth/*`, `/privacy-policy`, `/terms-of-service`
   - Protected routes: Everything else, redirects unauthenticated users to `/auth/login`
   - Session managed via secure HTTP-only cookies (handled by `@supabase/ssr`)

2. **User Helpers** (`lib/utils/user-helpers.ts`)
   - `requireUser()` - Throws if not authenticated, returns current user
   - `getUser()` - Returns null if not authenticated
   - `getUserTimezone()` - Gets user's timezone from profile

3. **Row-Level Security (RLS)**
   - All tables have RLS policies
   - Users can only access their own data

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
- `GET /api/app-data` - Bootstrap all user data
- `POST /api/vbot` - AI chatbot with OpenAI streaming
- `POST /api/settings/*` - Various settings mutations

## Important Features

### AI Integration

**VBot (AI Chatbot):**
- Streaming AI responses via OpenAI
- Accessible from sidebar and dedicated page
- Uses `@ai-sdk/openai` for structured streaming
- API route: `app/api/vbot/route.ts`
- Can generate meal plans, provide coaching, answer fitness questions

**Daily Insights:**
- AI-generated personalized messages on dashboard
- Generated once per day per user (timezone-aware)
- Cached in `daily_insights` table
- Powered by OpenAI (gpt-4o-mini model)
- Server Action: `lib/actions/daily-insights.ts`
- Fallback message if generation fails

### Gamification & Streaks

- **Habits** track daily completion with streak calculation
- **Streaks** are reset daily at midnight (timezone-aware)
- **Weekly Progress** calculated as percentage of habits completed
- **Milestones** tracked for major achievements
- **Referral System** with credits and rewards

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
| Database queries return empty | Verify RLS policies allow user access; check user auth state |
| Timezone confusion | Check browser timezone vs profile timezone; use `getTodayInTimezone()` |
| AI features not working | Verify `OPENAI_API_KEY` set in Supabase secrets (not .env) |
| Modals not rendering | Check browser console for lazy-load errors; verify `"use client"` directive |
| Build fails with type errors | `next.config.mjs` has `ignoreBuildErrors: true`, but fix types for correctness |

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
- **Hooks**: PascalCase with 'use' prefix (useAppData, useTimezoneSync)
- **Types**: PascalCase singular (User, Habit, Profile)
- **Constants**: UPPER_SNAKE_CASE (MAX_HABIT_LENGTH, REFRESH_INTERVAL)

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

## Recent Changes & Context

- Latest commit: "Update environment variable handling in Cloud Build and Dockerfile; add AI Fitness Coach button in FitnessClient"
- onboarding now focuses on primary goal selection (experimental body visualizer retired)
- All core features (dashboard, nutrition, workouts, community) wired to Supabase for state persistence
- AI insights (daily, coaching) integrated with OpenAI
- Push notifications fully implemented with Service Worker support
