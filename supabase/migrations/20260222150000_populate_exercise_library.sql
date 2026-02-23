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
