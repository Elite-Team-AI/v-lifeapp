const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkoutData() {
  try {
    // Check user_workout_plans
    const { data: plans, error: plansError } = await supabase
      .from('user_workout_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('\n=== USER WORKOUT PLANS ===');
    if (plansError) {
      console.log('Error:', plansError);
    } else {
      console.log('Total plans fetched:', plans?.length || 0);
      if (plans && plans.length > 0) {
        plans.forEach(plan => {
          console.log(`\n- Plan: ${plan.plan_name}`);
          console.log(`  ID: ${plan.id}`);
          console.log(`  User: ${plan.user_id}`);
          console.log(`  Status: ${plan.status}`);
          console.log(`  Type: ${plan.plan_type}`);
          console.log(`  Days/Week: ${plan.days_per_week}`);
          console.log(`  Start: ${plan.start_date}`);
          console.log(`  End: ${plan.end_date}`);
        });
      } else {
        console.log('No plans found');
      }
    }

    // Check plan_workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('*')
      .limit(10);
    
    console.log('\n=== PLAN WORKOUTS ===');
    if (workoutsError) {
      console.log('Error:', workoutsError);
    } else {
      console.log('Total workouts fetched:', workouts?.length || 0);
      if (workouts && workouts.length > 0) {
        console.log('Sample workout:', {
          name: workouts[0].workout_name,
          type: workouts[0].workout_type,
          week: workouts[0].week_number,
          day: workouts[0].day_of_week
        });
      }
    }

    // Check plan_exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('plan_exercises')
      .select('*')
      .limit(10);
    
    console.log('\n=== PLAN EXERCISES ===');
    if (exercisesError) {
      console.log('Error:', exercisesError);
    } else {
      console.log('Total exercises fetched:', exercises?.length || 0);
    }

    // Check exercise_library
    const { data: library, error: libraryError } = await supabase
      .from('exercise_library')
      .select('id, name, training_modality, category')
      .limit(5);
    
    console.log('\n=== EXERCISE LIBRARY (Sample) ===');
    if (libraryError) {
      console.log('Error:', libraryError);
    } else {
      console.log('Total in library sample:', library?.length || 0);
      library?.forEach(ex => {
        console.log(`- ${ex.name} (${ex.training_modality})`);
      });
    }

    // Count total exercises by modality
    const { data: modalityCounts, error: modalityError } = await supabase
      .from('exercise_library')
      .select('training_modality')
      .order('training_modality');

    if (!modalityError && modalityCounts) {
      const counts = modalityCounts.reduce((acc, row) => {
        acc[row.training_modality] = (acc[row.training_modality] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n=== EXERCISES BY MODALITY ===');
      Object.entries(counts).forEach(([modality, count]) => {
        console.log(`${modality}: ${count} exercises`);
      });
    }

  } catch (error) {
    console.error('Error checking workout data:', error);
  }
}

checkWorkoutData();
