import { sendPasswordResetEmail } from '../_shared/email.ts'

/**
 * Supabase Auth Hook: Send Password Reset Email
 *
 * Triggered when a user requests password reset.
 * Sends V-Life branded email with password reset link.
 */
Deno.serve(async (req: Request) => {
  try {
    const { user, email_data } = await req.json()

    console.log('[Auth Hook] Sending password reset email to:', user.email)

    await sendPasswordResetEmail(
      user.email,
      email_data.confirmation_url
    )

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auth Hook] Error sending password reset email:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
