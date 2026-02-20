import { sendChangeEmailConfirmation } from '../_shared/email.ts'

/**
 * Supabase Auth Hook: Send Email Change Confirmation
 *
 * Triggered when a user changes their email address.
 * Sends V-Life branded email to confirm the new email.
 */
Deno.serve(async (req: Request) => {
  try {
    const { user, email_data } = await req.json()

    console.log('[Auth Hook] Sending email change confirmation to:', user.email)

    await sendChangeEmailConfirmation(
      user.email,
      email_data.confirmation_url
    )

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auth Hook] Error sending email change confirmation:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
