import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Create profile with default values using upsert
  // Upsert will create or update, avoiding the RLS issue with checking existence
  const profileData = {
    id: user.id,
    name: 'User',
    age: 30,
    gender: 'male' as const,
    height_feet: 5,
    height_inches: 10,
    weight: 180,
    goal_weight: 170,
    primary_goal: 'build-muscle' as const,
    activity_level: 3,
    gym_access: 'home' as const,
    custom_equipment: 'dumbbells, barbell, bench',
    training_style: 'strength',
    available_time_minutes: 60,
    training_days_per_week: 4,
    onboarding_completed: true,
    referral_code: `VLIFE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    credits: 0,
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}
