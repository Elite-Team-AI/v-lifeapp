// Test script to see what OpenAI returns with the current prompt
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testPrompt() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fitness coach creating personalized workout plans.'
        },
        {
          role: 'user',
          content: `
Create a simple 4-week workout plan.

**OUTPUT FORMAT (JSON) - YOU MUST RETURN THE COMPLETE STRUCTURE BELOW:**

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or comments.

{
  "planName": "Test Plan",
  "planType": "full_body",
  "daysPerWeek": 3,
  "weeks": [
    {
      "weekNumber": 1,
      "workouts": [
        {
          "workoutName": "Workout A",
          "exercises": [
            {
              "exerciseId": "test-123",
              "exerciseName": "Squats",
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12
            }
          ]
        }
      ]
    },
    {
      "weekNumber": 2,
      "workouts": []
    },
    {
      "weekNumber": 3,
      "workouts": []
    },
    {
      "weekNumber": 4,
      "workouts": []
    }
  ]
}

Make weeks 2-4 similar to week 1 but with slight variations.
`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content

    console.log('=== RAW RESPONSE ===')
    console.log(response)
    console.log('\n=== RESPONSE LENGTH ===')
    console.log(response.length)
    console.log('\n=== FIRST 200 CHARACTERS ===')
    console.log(response.substring(0, 200))
    console.log('\n=== LAST 200 CHARACTERS ===')
    console.log(response.substring(response.length - 200))

    console.log('\n=== PARSING TEST ===')
    try {
      const parsed = JSON.parse(response)
      console.log('✅ Direct parse successful!')
      console.log('Weeks count:', parsed.weeks?.length)
    } catch (error) {
      console.log('❌ Direct parse failed:', error.message)

      // Try sanitization
      let sanitized = response.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      sanitized = sanitized.trim()

      console.log('\n=== AFTER SANITIZATION ===')
      console.log('Sanitized length:', sanitized.length)
      console.log('First 200:', sanitized.substring(0, 200))

      try {
        const parsed = JSON.parse(sanitized)
        console.log('✅ Sanitized parse successful!')
      } catch (error2) {
        console.log('❌ Sanitized parse also failed:', error2.message)
      }
    }

  } catch (error) {
    console.error('OpenAI API Error:', error.message)
  }
}

testPrompt()
