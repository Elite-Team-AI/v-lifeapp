import { NextRequest, NextResponse } from 'next/server'
import { sendSignupConfirmationEmail, sendMagicLinkEmail, sendPasswordResetEmail } from '@/lib/email/resend'

/**
 * Test endpoint to send emails using Resend
 *
 * Usage:
 * POST /api/email/send-test
 * Body: {
 *   "to": "user@example.com",
 *   "type": "signup" | "magic-link" | "password-reset",
 *   "confirmationUrl": "https://example.com/confirm?token=abc123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, type, confirmationUrl } = body

    if (!to || !type || !confirmationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type, confirmationUrl' },
        { status: 400 }
      )
    }

    let result
    switch (type) {
      case 'signup':
        result = await sendSignupConfirmationEmail(to, confirmationUrl)
        break
      case 'magic-link':
        result = await sendMagicLinkEmail(to, confirmationUrl)
        break
      case 'password-reset':
        result = await sendPasswordResetEmail(to, confirmationUrl)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: signup, magic-link, or password-reset' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      data: result.data
    })
  } catch (error) {
    console.error('[Email Test] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
