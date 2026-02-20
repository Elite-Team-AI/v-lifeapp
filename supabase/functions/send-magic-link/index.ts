import { sendMagicLinkEmail } from '../_shared/email.ts'

/**
 * Supabase Auth Hook: Send Magic Link Email
 *
 * Triggered when a user requests passwordless login.
 * Sends V-Life branded email with magic link.
 */
Deno.serve(async (req: Request) => {
  try {
    const { user, email_data } = await req.json()

    console.log('[Auth Hook] Sending magic link email to:', user.email)

    await sendMagicLinkEmail(
      user.email,
      email_data.confirmation_url
    )

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auth Hook] Error sending magic link email:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
