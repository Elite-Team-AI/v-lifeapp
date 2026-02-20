/**
 * Shared email utilities for Supabase Edge Functions
 * Sends emails via Resend API with V-Life branded templates
 */

interface SendEmailOptions {
  to: string
  subject: string
  template: 'confirm-signup' | 'invite-user' | 'magic-link' | 'change-email' | 'reset-password' | 're-authentication'
  confirmationUrl: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set')
}

const TEMPLATES: Record<string, string> = {
  'confirm-signup': 'confirm-signup.html',
  'invite-user': 'invite-user.html',
  'magic-link': 'magic-link.html',
  'change-email': 'change-email.html',
  'reset-password': 'reset-password.html',
  're-authentication': 're-authentication.html'
}

async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = `../../../email-templates/${TEMPLATES[templateName]}`
  const decoder = new TextDecoder('utf-8')
  const data = await Deno.readFile(templatePath)
  return decoder.decode(data)
}

function replaceTemplateVariables(html: string, confirmationUrl: string): string {
  return html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, confirmationUrl)
}

export async function sendEmail({ to, subject, template, confirmationUrl }: SendEmailOptions) {
  try {
    console.log(`[Email] Sending ${template} email to ${to}`)

    // Load and process template
    const templateHtml = await loadTemplate(template)
    const html = replaceTemplateVariables(templateHtml, confirmationUrl)

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'V-Life Fitness <onboarding@v-life-fitness.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await response.json()
    console.log(`[Email] Successfully sent ${template} email:`, data)

    return { success: true, data }
  } catch (error) {
    console.error(`[Email] Failed to send ${template} email:`, error)
    throw error
  }
}

export async function sendSignupConfirmationEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Confirm Your Email - V-Life Fitness',
    template: 'confirm-signup',
    confirmationUrl
  })
}

export async function sendMagicLinkEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Your Magic Link - V-Life Fitness',
    template: 'magic-link',
    confirmationUrl
  })
}

export async function sendPasswordResetEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset Your Password - V-Life Fitness',
    template: 'reset-password',
    confirmationUrl
  })
}

export async function sendChangeEmailConfirmation(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Confirm Your Email Change - V-Life Fitness',
    template: 'change-email',
    confirmationUrl
  })
}

export async function sendInviteUserEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: "You're Invited to V-Life Fitness",
    template: 'invite-user',
    confirmationUrl
  })
}

export async function sendReAuthenticationEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Re-authentication Required - V-Life Fitness',
    template: 're-authentication',
    confirmationUrl
  })
}
