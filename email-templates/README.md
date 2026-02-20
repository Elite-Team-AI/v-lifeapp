# Email Templates

Beautiful, on-brand email templates for V-Life Fitness authentication flows.

## Templates

All templates follow the V-Life brand design with golden yellow (#FFD700) and charcoal (#0a0a0f) colors:

### 1. `confirm-signup.html`
**Purpose**: Welcome new users and confirm their email address
**Subject**: "Confirm Your Email - V-Life Fitness"
**Use Case**: Sent when users sign up for a new account
**Expiration**: 24 hours

### 2. `invite-user.html`
**Purpose**: Invite users to join V-Life Fitness
**Subject**: "You're Invited to V-Life Fitness"
**Use Case**: Sent when admins invite new users
**Expiration**: 7 days

### 3. `magic-link.html`
**Purpose**: Passwordless login via email link
**Subject**: "Your Magic Link - V-Life Fitness"
**Use Case**: Sent when users request passwordless sign-in
**Expiration**: 1 hour

### 4. `change-email.html`
**Purpose**: Confirm email address changes
**Subject**: "Confirm Your Email Change - V-Life Fitness"
**Use Case**: Sent when users update their email address
**Expiration**: 1 hour

### 5. `reset-password.html`
**Purpose**: Password recovery
**Subject**: "Reset Your Password - V-Life Fitness"
**Use Case**: Sent when users forget their password
**Expiration**: 1 hour

### 6. `re-authentication.html`
**Purpose**: Verify identity for sensitive actions
**Subject**: "Re-authentication Required - V-Life Fitness"
**Use Case**: Sent before modifying sensitive account settings
**Expiration**: Varies by action

## Template Variables

All templates use Supabase-style variable substitution:

- `{{ .ConfirmationURL }}` - The confirmation/action link

## Usage

### With Resend (Programmatic)

```typescript
import { sendSignupConfirmationEmail } from '@/lib/email/resend'

await sendSignupConfirmationEmail(
  'user@example.com',
  'https://v-life-fitness.com/auth/confirm?token=abc123'
)
```

### With Supabase Email Templates

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Navigate to Authentication → Email Templates
3. Select the template type (Confirm signup, Magic Link, etc.)
4. Copy the HTML content from the corresponding `.html` file
5. Paste into the Supabase template editor
6. Save changes

Supabase will automatically:
- Populate the `{{ .ConfirmationURL }}` variable
- Send emails at the appropriate times in the auth flow
- Handle rate limiting and delivery

## Design Specifications

### Colors
- **Primary**: `#FFD700` (Vital Yellow/Gold)
- **Background**: `#0a0a0f` (Charcoal)
- **Accent**: `#FFA500` (Orange)
- **Text**: `#ffffff` (White), `#d0d0d0` (Light Gray), `#a0a0a0` (Medium Gray)

### Typography
- **Headings**: Outfit, 700 weight
- **Body**: DM Sans, 400 weight
- **Buttons**: Outfit, 700 weight

### Layout
- **Max Width**: 600px
- **Padding**: 40px
- **Border Radius**: 12-16px for cards, 8-12px for buttons
- **Box Shadow**: Golden glow effects

### Components
- **Logo Circle**: 80px diameter with golden gradient
- **CTA Button**: Golden gradient with 15px shadow blur
- **Info Callouts**: Golden left border with subtle background
- **Feature Boxes**: Gradient background with golden border

## Email Client Compatibility

All templates use:
- ✅ Inline CSS (no external stylesheets)
- ✅ Table-based layouts (email client standard)
- ✅ Web-safe fonts with fallbacks
- ✅ Absolute color values (no CSS variables)
- ✅ Basic CSS properties only (no Grid/Flexbox)

Tested on:
- Gmail (Web, iOS, Android)
- Outlook (Windows, Mac, Web)
- Apple Mail (iOS, macOS)
- Yahoo Mail
- ProtonMail

## Customization

To modify templates:

1. **Edit HTML files directly** - All styling is inline
2. **Maintain table structure** - Required for email clients
3. **Test across clients** - Use [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com)
4. **Keep inline styles** - External CSS won't work in most email clients

### Common Customizations

**Change CTA Button Color:**
```html
<!-- Find this style in the button link -->
background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR_DARK 100%);
```

**Update Logo:**
```html
<!-- Replace the V text with an image -->
<img src="https://your-cdn.com/logo.png" alt="V-Life" style="width: 60px; height: 60px;" />
```

**Add Footer Links:**
```html
<p style="margin: 0; font-size: 12px; color: #808080; text-align: center;">
  <a href="https://v-life-fitness.com/privacy" style="color: #FFD700;">Privacy</a> |
  <a href="https://v-life-fitness.com/terms" style="color: #FFD700;">Terms</a>
</p>
```

## Testing

### Local Testing

Use the test endpoint to send emails:

```bash
curl -X POST http://localhost:3000/api/email/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "signup",
    "confirmationUrl": "https://example.com/confirm?token=test"
  }'
```

### Preview in Browser

Open any `.html` file directly in your browser to preview the design. Note: Variables like `{{ .ConfirmationURL }}` will appear as-is until processed.

## Security Considerations

All emails include:
- ✅ Clear security messaging
- ✅ Expiration time warnings
- ✅ "If you didn't request this" disclaimers
- ✅ Support contact information
- ✅ Security tips and best practices

## Support

For issues or questions:
- **Email Integration**: See `/docs/EMAIL_SETUP.md`
- **Template Bugs**: Check browser developer console
- **Supabase Integration**: See [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
