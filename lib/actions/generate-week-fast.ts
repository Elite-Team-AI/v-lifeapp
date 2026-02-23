import { env } from "@/lib/env"
import OpenAI from "openai"

/**
 * Fast single-week workout generation
 * Generates ONE week at a time (2-3 seconds) instead of all 4 weeks (25-30 seconds)
 *
 * This is a utility function (not a server action) that accepts data as parameters
 * to avoid auth context issues when called from other server actions.
 */
export async function generateWeekFast(
  weekNumber: number,
  exercises: Array<{ id: string; name: string; category: string; primary_muscles?: string[] }>,
  preferences: {
    trainingStyle: string
    daysPerWeek: number
    sessionDuration: number
    exercisesPerWorkout: number
  }
) {
  // Validate inputs
  if (!exercises || exercises.length < 5) {
    throw new Error('Not enough exercises provided')
  }

  const { trainingStyle, daysPerWeek, sessionDuration, exercisesPerWorkout } = preferences

  const exerciseList = exercises.map(ex =>
    `ID: ${ex.id} | ${ex.name} (${ex.category}) - ${ex.primary_muscles?.join(', ') || 'full body'}`
  ).join('\n')

  const weekType = weekNumber === 1 ? 'baseline' : weekNumber === 4 ? 'deload' : 'build'

  const prompt = `Create ${daysPerWeek} workouts for Week ${weekNumber} (${weekType}).

**Available Exercises:**
${exerciseList}

**Requirements:**
- ${daysPerWeek} workouts
- ${sessionDuration} min per workout
- ${exercisesPerWorkout}+ exercises per workout
- Use EXACT UUIDs from list above
- Week ${weekNumber} intensity: ${weekType === 'baseline' ? 'moderate' : weekType === 'deload' ? 'light' : 'high'}
- CRITICAL: Keep "notes" to 2-3 words MAX (e.g. "Chest up" or "Control tempo")

**Output JSON:**
{
  "weekNumber": ${weekNumber},
  "weekType": "${weekType}",
  "workouts": [
    {
      "dayOfWeek": 1,
      "workoutName": "Upper Body",
      "focusAreas": ["chest", "back"],
      "estimatedDuration": ${sessionDuration},
      "exercises": [
        {
          "exerciseId": "UUID-FROM-LIST",
          "exerciseName": "Exercise Name",
          "exerciseOrder": 1,
          "sets": 3,
          "repsMin": 8,
          "repsMax": 12,
          "restSeconds": 90,
          "tempo": "3-0-1-1",
          "rpe": 7,
          "notes": "brief cue"
        }
      ]
    }
  ]
}

Generate ${daysPerWeek} complete workouts. Respond with ONLY valid JSON.`

  console.log(`[generateWeekFast] Generating Week ${weekNumber}...`)

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 6000, // Increased to prevent truncation for complex workouts
    response_format: { type: 'json_object' }, // ← Force JSON mode (like Reborn Fitness)
    messages: [
      {
        role: 'system',
        content: 'You are a fitness coach. Create workout plans in ultra-compact JSON. Use 2-3 word notes ONLY (e.g. "Chest up", "Control tempo"). No verbose descriptions. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const aiResponse = completion.choices[0].message.content?.trim() || ''

  console.log('[generateWeekFast] Token usage:', {
    prompt_tokens: completion.usage?.prompt_tokens,
    completion_tokens: completion.usage?.completion_tokens,
    total_tokens: completion.usage?.total_tokens,
    finish_reason: completion.choices[0].finish_reason
  })

  // Check if response was truncated
  if (completion.choices[0].finish_reason === 'length') {
    console.error('[generateWeekFast] WARNING: Response truncated due to max_tokens limit!')
    console.error('[generateWeekFast] Response length:', aiResponse.length, 'chars')
    console.error('[generateWeekFast] Last 200 chars:', aiResponse.slice(-200))
  }

  // Log response snippet for debugging
  console.log('[generateWeekFast] Response length:', aiResponse.length, 'chars')
  console.log('[generateWeekFast] First 100 chars:', aiResponse.slice(0, 100))

  let weekData
  try {
    weekData = JSON.parse(aiResponse)
  } catch (parseError) {
    console.error('[generateWeekFast] JSON Parse Error:', parseError)
    console.error('[generateWeekFast] Attempted to parse:', aiResponse.slice(0, 500))
    console.error('[generateWeekFast] Last 500 chars:', aiResponse.slice(-500))
    throw new Error(`Failed to parse OpenAI response: ${parseError}`)
  }

  console.log(`[generateWeekFast] Week ${weekNumber} generated successfully!`)

  return weekData
}
