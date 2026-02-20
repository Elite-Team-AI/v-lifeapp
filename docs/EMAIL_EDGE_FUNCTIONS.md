# Email Edge Functions - Deployment Guide

This guide explains how to deploy and configure Supabase Edge Functions to automatically send V-Life branded emails through Resend during authentication flows.

## Overview

We've created Supabase Edge Functions that integrate with Supabase Auth Hooks to send custom branded emails instead of the default Supabase emails. This provides:

- **Full brand control** - Use V-Life golden yellow and charcoal design
- **Custom templates** - Beautiful HTML emails with security tips
- **Resend integration** - Professional email delivery via Resend API
- **Automatic sending** - Triggered automatically by Supabase Auth events

## Architecture

```
User Action (Sign Up, Reset Password, etc.)
    ↓
Supabase Auth Event
    ↓
Auth Hook Trigger
    ↓
Edge Function Execution
    ↓
Load Email Template (from email-templates/)
    ↓
Send via Resend API
    ↓
Email Delivered to User
```

## Edge Functions

We have 5 Edge Functions for different auth events:

| Function | Hook Type | When Triggered | Template |
|----------|-----------|----------------|----------|
| `send-signup-email` | Confirm Signup | User creates account | confirm-signup.html |
| `send-magic-link` | Magic Link | User requests passwordless login | magic-link.html |
| `send-password-reset` | Recovery | User forgets password | reset-password.html |
| `send-change-email` | Email Change | User updates email | change-email.html |
| `send-invite-user` | Invite User | Admin invites new user | invite-user.html |

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project linked**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Resend API Key**
   - You have: `re_V4FSzp3Q_J354XSYGZ7cXDVB9iLWxA3N6`
   - This will be stored as a Supabase secret

## Step 1: Set Up Resend API Key Secret

Store your Resend API key as a secret in Supabase:

```bash
# Set the RESEND_API_KEY secret
supabase secrets set RESEND_API_KEY=re_V4FSzp3Q_J354XSYGZ7cXDVB9iLWxA3N6

# Verify the secret was set
supabase secrets list
```

**Expected output:**
```
NAME              VALUE
RESEND_API_KEY    re_V4FSzp3Q_J354XSYGZ7cXDVB9iLWxA3N6
```

## Step 2: Deploy Edge Functions

Deploy all email Edge Functions to Supabase:

```bash
# Deploy all functions at once
supabase functions deploy send-signup-email
supabase functions deploy send-magic-link
supabase functions deploy send-password-reset
supabase functions deploy send-change-email
supabase functions deploy send-invite-user
```

**Or deploy all at once:**
```bash
supabase functions deploy --all
```

**Expected output for each:**
```
Deploying Function (project-ref: YOUR_PROJECT_REF)
        send-signup-email (local)
Deployed function send-signup-email on project YOUR_PROJECT_REF
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-signup-email
```

## Step 3: Copy Email Templates to Edge Functions

The Edge Functions need access to the email templates. Since Edge Functions can't directly access the project filesystem, we need to make templates available:

### Option A: Upload Templates to Supabase Storage (Recommended)

1. **Create a storage bucket for templates:**
   ```bash
   # Via Supabase Dashboard → Storage → New Bucket
   # Name: email-templates
   # Public: No (private bucket)
   ```

2. **Upload all template files:**
   ```bash
   supabase storage cp email-templates/confirm-signup.html supabase://email-templates/confirm-signup.html
   supabase storage cp email-templates/magic-link.html supabase://email-templates/magic-link.html
   supabase storage cp email-templates/reset-password.html supabase://email-templates/reset-password.html
   supabase storage cp email-templates/change-email.html supabase://email-templates/change-email.html
   supabase storage cp email-templates/invite-user.html supabase://email-templates/invite-user.html
   ```

3. **Update `_shared/email.ts` to load from storage:**
   ```typescript
   async function loadTemplate(templateName: string): Promise<string> {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

     const response = await fetch(
       `${supabaseUrl}/storage/v1/object/email-templates/${TEMPLATES[templateName]}`,
       {
         headers: {
           'Authorization': `Bearer ${supabaseAnonKey}`
         }
       }
     )

     return await response.text()
   }
   ```

### Option B: Inline Templates in Code

Alternatively, you can inline the HTML templates directly in `_shared/email.ts`:

```typescript
const TEMPLATE_HTML: Record<string, string> = {
  'confirm-signup': `<!DOCTYPE html>...`, // Paste full HTML
  'magic-link': `<!DOCTYPE html>...`,
  // etc.
}

async function loadTemplate(templateName: string): Promise<string> {
  return TEMPLATE_HTML[templateName]
}
```

**Trade-offs:**
- ✅ No storage bucket needed
- ✅ Faster (no network request)
- ❌ Makes `_shared/email.ts` very large
- ❌ Harder to update templates later

## Step 4: Configure Auth Hooks in Supabase Dashboard

Now connect the Edge Functions to Supabase Auth events:

1. **Go to Supabase Dashboard** → Your Project → Authentication → Hooks

2. **Enable "Send Email" hook:**
   - Click "Enable Hook" under "Send Email"
   - Select "HTTP Request"

3. **Configure each email type:**

   **For Confirm Signup:**
   - Event: `Confirm Signup`
   - HTTP Request URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-signup-email`
   - HTTP Method: `POST`
   - HTTP Headers: `{"Content-Type": "application/json"}`
   - Enable hook: ✅

   **For Magic Link:**
   - Event: `Magic Link`
   - HTTP Request URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-magic-link`
   - HTTP Method: `POST`
   - HTTP Headers: `{"Content-Type": "application/json"}`
   - Enable hook: ✅

   **For Recovery (Password Reset):**
   - Event: `Recovery`
   - HTTP Request URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-password-reset`
   - HTTP Method: `POST`
   - HTTP Headers: `{"Content-Type": "application/json"}`
   - Enable hook: ✅

   **For Email Change:**
   - Event: `Email Change`
   - HTTP Request URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-change-email`
   - HTTP Method: `POST`
   - HTTP Headers: `{"Content-Type": "application/json"}`
   - Enable hook: ✅

   **For Invite User:**
   - Event: `Invite User`
   - HTTP Request URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-user`
   - HTTP Method: `POST`
   - HTTP Headers: `{"Content-Type": "application/json"}`
   - Enable hook: ✅

4. **Save each configuration**

## Step 5: Test Email Sending

Test that emails are working correctly:

### Test Signup Email

1. Create a new test account in your app
2. Check the email inbox for the V-Life branded signup confirmation
3. Verify the "Confirm Your Email" button works

### Test Password Reset

1. Go to password reset page
2. Enter your email address
3. Check inbox for V-Life branded password reset email
4. Verify the "Reset Your Password" button works

### Test Magic Link

1. Go to magic link login page
2. Enter your email address
3. Check inbox for V-Life branded magic link email
4. Verify the "Sign In to V-Life" button works

### View Edge Function Logs

Monitor Edge Function execution and debug issues:

```bash
# View logs for specific function
supabase functions logs send-signup-email --follow

# View logs for all functions
supabase functions logs --follow
```

## Step 6: Production Checklist

Before going live:

- [ ] All 5 Edge Functions deployed successfully
- [ ] `RESEND_API_KEY` secret set in Supabase
- [ ] Email templates uploaded (storage or inlined)
- [ ] All 5 Auth Hooks configured in dashboard
- [ ] Tested all email types (signup, magic link, password reset, email change, invite)
- [ ] Verified emails arrive with correct branding
- [ ] Confirmed all links work correctly
- [ ] Checked spam folder for deliverability
- [ ] Verified sender domain in Resend dashboard
- [ ] Set up SPF and DKIM records for your domain
- [ ] Configured DMARC policy

## Monitoring & Troubleshooting

### View Function Invocations

```bash
# See recent invocations
supabase functions list
```

### Common Issues

**Problem: Emails not sending**
- Check Edge Function logs: `supabase functions logs send-signup-email`
- Verify RESEND_API_KEY secret is set correctly
- Confirm Auth Hook is enabled in dashboard
- Check Resend dashboard for sending limits

**Problem: "Template not found" error**
- Verify templates are uploaded to storage OR inlined in code
- Check template file names match exactly (case-sensitive)
- View logs to see exact error message

**Problem: "Failed to send email" error**
- Check Resend API key is valid
- Verify sender domain is verified in Resend
- Check Resend rate limits (free tier limits)
- View Resend dashboard for delivery errors

**Problem: Emails go to spam**
- Set up SPF records for your domain
- Configure DKIM signing in Resend
- Add DMARC policy
- Check email content for spam triggers
- Warm up your sending domain

### Debugging with Logs

```bash
# Watch logs in real-time
supabase functions logs send-signup-email --follow

# Filter by error level
supabase functions logs send-signup-email --level error

# View last 100 log entries
supabase functions logs send-signup-email --limit 100
```

## Updating Templates

When you need to update email templates:

### If using Storage:

```bash
# Update template in storage
supabase storage cp email-templates/confirm-signup.html supabase://email-templates/confirm-signup.html --force
```

Templates update immediately - no Edge Function redeployment needed!

### If using Inlined Templates:

1. Update the HTML in `_shared/email.ts`
2. Redeploy all functions:
   ```bash
   supabase functions deploy --all
   ```

## Alternative: Direct Resend Integration (Without Edge Functions)

If you prefer simpler setup without Edge Functions:

1. Copy HTML templates to Supabase Dashboard → Authentication → Email Templates
2. Replace default content with V-Life branded HTML
3. Supabase will send emails directly (no Resend integration)

**Trade-offs:**
- ✅ Simpler setup (no Edge Functions)
- ✅ No external dependencies
- ❌ Uses Supabase's email infrastructure (less control)
- ❌ No Resend deliverability features
- ❌ Limited customization options

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Auth Hooks Docs](https://supabase.com/docs/guides/auth/auth-hooks)
- [Resend Documentation](https://resend.com/docs)
- [Email Template Best Practices](/email-templates/README.md)
- [Email Setup Guide](/docs/EMAIL_SETUP.md)

## Support

For issues:
- **Edge Functions**: Check Supabase function logs
- **Email Delivery**: Check Resend dashboard
- **Templates**: See `/email-templates/README.md`
- **Auth Flow**: See Supabase Auth logs
