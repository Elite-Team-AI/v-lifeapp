import { sendInviteUserEmail } from '../_shared/email.ts'

/**
 * Supabase Auth Hook: Send User Invitation Email
 *
 * Triggered when a user is invited to join V-Life.
 * Sends V-Life branded email with invitation link.
 */
Deno.serve(async (req: Request) => {
  try {
    const { user, email_data } = await req.json()

    console.log('[Auth Hook] Sending invitation email to:', user.email)

    await sendInviteUserEmail(
      user.email,
      email_data.confirmation_url
    )

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auth Hook] Error sending invitation email:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
