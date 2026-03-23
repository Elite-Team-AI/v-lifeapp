const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPlanExercises() {
  try {
    // Get first plan
    const { data: plans, error: plansError } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (plansError || !plans) {
      console.log('No active plans found');
      return;
    }

    console.log('\n=== CHECKING PLAN ===');
    console.log('Plan ID:', plans.id);
    console.log('Plan Name:', plans.plan_name);

    // Get workouts for this plan
    const { data: workouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('*')
      .eq('plan_id', plans.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true });

    console.log('\n=== PLAN WORKOUTS ===');
    console.log('Total workouts:', workouts?.length || 0);
    
    if (workouts && workouts.length > 0) {
      console.log('\nFirst 3 workouts:');
      workouts.slice(0, 3).forEach(w => {
        console.log(`- Week ${w.week_number}, Day ${w.day_of_week}: ${w.workout_name}`);
        console.log(`  Workout ID: ${w.id}`);
        console.log(`  Duration: ${w.estimated_duration_minutes} min`);
      });

      // Check exercises for first workout
      const firstWorkout = workouts[0];
      console.log('\n=== CHECKING EXERCISES FOR FIRST WORKOUT ===');
      console.log('Workout ID:', firstWorkout.id);
      
      const { data: exercises, error: exercisesError } = await supabase
        .from('plan_exercises')
        .select('*')
        .eq('workout_id', firstWorkout.id);

      if (exercisesError) {
        console.log('Error fetching exercises:', exercisesError);
      } else {
        console.log('Total exercises for this workout:', exercises?.length || 0);
        if (exercises && exercises.length > 0) {
          exercises.forEach(ex => {
            console.log(`- Exercise ID: ${ex.exercise_id}`);
            console.log(`  Sets: ${ex.target_sets}, Reps: ${ex.target_reps_min}-${ex.target_reps_max}`);
          });
        } else {
          console.log('NO EXERCISES FOUND FOR THIS WORKOUT');
        }
      }
    }

    // Check if there are ANY exercises in plan_exercises table
    const { count } = await supabase
      .from('plan_exercises')
      .select('*', { count: 'exact', head: true });

    console.log('\n=== TOTAL PLAN EXERCISES IN DATABASE ===');
    console.log('Total count:', count || 0);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlanExercises();
