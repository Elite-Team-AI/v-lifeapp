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
