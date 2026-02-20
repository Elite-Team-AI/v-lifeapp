import { sendSignupConfirmationEmail } from '../_shared/email.ts'

/**
 * Supabase Auth Hook: Send Signup Confirmation Email
 *
 * Triggered when a user signs up and needs email confirmation.
 * Sends V-Life branded email with confirmation link.
 */
Deno.serve(async (req: Request) => {
  try {
    const { user, email_data } = await req.json()

    console.log('[Auth Hook] Sending signup confirmation email to:', user.email)

    await sendSignupConfirmationEmail(
      user.email,
      email_data.confirmation_url
    )

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auth Hook] Error sending signup email:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
