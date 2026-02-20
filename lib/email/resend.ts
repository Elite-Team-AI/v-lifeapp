import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables')
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Read an email template from the email-templates directory
 */
function getEmailTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'email-templates', `${templateName}.html`)
  return fs.readFileSync(templatePath, 'utf-8')
}

/**
 * Replace template variables in email HTML
 */
function replaceTemplateVariables(html: string, variables: Record<string, string>): string {
  let result = html
  for (const [key, value] of Object.entries(variables)) {
    // Replace Supabase-style variables like {{ .ConfirmationURL }}
    result = result.replace(new RegExp(`{{\\s*\\.${key}\\s*}}`, 'g'), value)
  }
  return result
}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  template: 'confirm-signup' | 'invite-user' | 'magic-link' | 'change-email' | 'reset-password' | 're-authentication'
  variables: Record<string, string>
  from?: string
}

/**
 * Send an email using Resend with a template
 */
export async function sendEmail({
  to,
  subject,
  template,
  variables,
  from = 'V-Life Fitness <onboarding@v-life-fitness.com>'
}: SendEmailOptions) {
  try {
    // Get and process template
    const templateHtml = getEmailTemplate(template)
    const html = replaceTemplateVariables(templateHtml, variables)

    // Send email
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    if (error) {
      console.error('[Email] Failed to send email:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('[Email] Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    throw error
  }
}

/**
 * Send a signup confirmation email
 */
export async function sendSignupConfirmationEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Confirm Your Email - V-Life Fitness',
    template: 'confirm-signup',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}

/**
 * Send a user invitation email
 */
export async function sendInviteUserEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: "You're Invited to V-Life Fitness",
    template: 'invite-user',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}

/**
 * Send a magic link email for passwordless login
 */
export async function sendMagicLinkEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Your Magic Link - V-Life Fitness',
    template: 'magic-link',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}

/**
 * Send an email change confirmation email
 */
export async function sendChangeEmailConfirmation(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Confirm Your Email Change - V-Life Fitness',
    template: 'change-email',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset Your Password - V-Life Fitness',
    template: 'reset-password',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}

/**
 * Send a re-authentication email
 */
export async function sendReAuthenticationEmail(to: string, confirmationUrl: string) {
  return sendEmail({
    to,
    subject: 'Re-authentication Required - V-Life Fitness',
    template: 're-authentication',
    variables: {
      ConfirmationURL: confirmationUrl
    }
  })
}
