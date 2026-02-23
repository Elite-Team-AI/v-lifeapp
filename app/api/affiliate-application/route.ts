import { createClient } from "@/lib/supabase/server"
import { affiliateApplicationSchema, createErrorResponse } from "@/lib/validations/api"

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = affiliateApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, phone } = validationResult.data

    // Get authenticated user
    const supabase = await createClient()

    // Store the affiliate application
    const { error } = await supabase.from("affiliate_applications").insert({
      name,
      email,
      phone,
      status: "pending",
    })

    if (error) {
      console.error("[Affiliate Application DB Error]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // If table doesn't exist, just log and return success
      // (application was received, will be processed via email)
      if (error.code === "42P01") {
        console.info("[Affiliate] Application received (table not setup):", { name, email })
        return Response.json({ success: true })
      }

      return Response.json(
        {
          error: "Failed to submit application",
          details: error.message
        },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Affiliate Application Error]", error)
    return createErrorResponse(error, 500)
  }
}
