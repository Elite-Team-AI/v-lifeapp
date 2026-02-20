# Email Setup with Resend

This document explains how to use the Resend email integration in V-Life Fitness.

## Overview

V-Life uses [Resend](https://resend.com) to send transactional emails for authentication flows:

- **Signup Confirmation** - Welcome email with email verification
- **User Invitation** - Invite new users to the platform
- **Magic Link** - Passwordless login
- **Email Change** - Confirm email address changes
- **Password Reset** - Password recovery
- **Re-authentication** - Verify identity for sensitive actions

## Setup

### 1. Environment Variables

Add your Resend API key to `.env.local`:

```bash
RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

### 2. Email Templates

All email templates are located in `/email-templates/`:

- `confirm-signup.html` - Signup confirmation
- `invite-user.html` - User invitation
- `magic-link.html` - Passwordless login
- `change-email.html` - Email change confirmation
- `reset-password.html` - Password reset
- `re-authentication.html` - Re-authentication

Templates use Supabase-style variable substitution: `{{ .ConfirmationURL }}`

### 3. Email Functions

Import and use email functions from `/lib/email/resend.ts`:

```typescript
import {
  sendSignupConfirmationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendChangeEmailConfirmation,
  sendInviteUserEmail,
  sendReAuthenticationEmail
} from '@/lib/email/resend'

// Example: Send signup confirmation
await sendSignupConfirmationEmail(
  'user@example.com',
  'https://v-life-fitness.com/auth/confirm?token=abc123'
)
```

## Testing Emails

### Using the Test Endpoint

Send a test email via API:

```bash
curl -X POST http://localhost:3000/api/email/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "signup",
    "confirmationUrl": "https://v-life-fitness.com/auth/confirm?token=test123"
  }'
```

Available types:
- `signup` - Signup confirmation email
- `magic-link` - Magic link for passwordless login
- `password-reset` - Password reset email

### Testing in Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Use curl or Postman to send test emails to the endpoint above

3. Check your email inbox for the beautifully styled V-Life email

## Integrating with Supabase Auth

To use these emails with Supabase authentication, you have two options:

### Option 1: Supabase Email Templates (Recommended)

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Copy the HTML from each template file in `/email-templates/`
3. Paste into the corresponding Supabase email template
4. Supabase will automatically populate `{{ .ConfirmationURL }}` variables

### Option 2: Custom Email Hooks (Advanced)

For more control, use Supabase Auth Hooks to intercept email sending:

1. Create Edge Functions for each email type
2. Call Resend API from Edge Functions with custom templates
3. Configure hooks in Supabase Dashboard → Authentication → Hooks

Example Edge Function structure:
```typescript
// supabase/functions/send-signup-email/index.ts
import { sendSignupConfirmationEmail } from '../_shared/email.ts'

Deno.serve(async (req) => {
  const { user, email_data } = await req.json()

  await sendSignupConfirmationEmail(
    user.email,
    email_data.confirmation_url
  )

  return new Response('OK')
})
```

## Email Design

All emails follow the V-Life brand design:

- **Colors**: Golden yellow (#FFD700), Charcoal (#0a0a0f), Orange accent (#FFA500)
- **Fonts**: DM Sans (body), Outfit (headings)
- **Layout**: Responsive, mobile-first design
- **Security**: Clear security messaging and tips
- **CTA Buttons**: Golden gradient with glow effects

### Customizing Templates

To modify email templates:

1. Edit the HTML files in `/email-templates/`
2. Maintain inline CSS for email client compatibility
3. Test across email clients (Gmail, Outlook, Apple Mail)
4. Variables format: `{{ .VariableName }}`

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set in `.env.local`
2. **Check Logs**: Look for `[Email]` prefixed logs in console
3. **Verify Domain**: Ensure your sending domain is verified in Resend dashboard
4. **Check Rate Limits**: Resend free tier has sending limits

### Template Variables Not Replacing

1. **Variable Format**: Ensure format is exactly `{{ .VariableName }}`
2. **Variable Name**: Match the variable name passed in code
3. **Case Sensitive**: Variable names are case-sensitive

### Styling Issues

1. **Inline CSS**: Email clients require inline styles, not classes
2. **Test Clients**: Test in Gmail, Outlook, and Apple Mail
3. **Avoid Modern CSS**: Stick to basic CSS properties (no Grid, Flexbox in some clients)

## Production Checklist

Before deploying to production:

- [ ] Add `RESEND_API_KEY` to production environment variables
- [ ] Verify sending domain in Resend dashboard
- [ ] Test all 6 email types
- [ ] Update "from" email addresses in `/lib/email/resend.ts`
- [ ] Set up SPF and DKIM records for your domain
- [ ] Configure DMARC policy
- [ ] Remove or protect the `/api/email/send-test` endpoint

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Email Template Best Practices](https://resend.com/docs/send-with-react)
- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/html-email-best-practices/)
