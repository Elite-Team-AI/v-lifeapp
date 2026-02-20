# Email Deep Linking Setup Guide

This guide explains how to complete the email deep linking setup for V-Life iOS and Android apps, allowing email authentication links to open directly in the mobile app instead of the web browser.

## Overview

The V-Life app uses Capacitor to wrap the Next.js web app for iOS and Android. Email deep linking enables:

- Email confirmation links to open the app
- Password reset links to open the app
- Magic link authentication to open the app

**Technical Implementation:**
- **iOS**: Universal Links (applinks:v-life.app)
- **Android**: App Links (https://v-life.app)
- **Fallback**: Custom URL schemes (vlife://, app.vlife.fitness://)

---

## Architecture

```
User clicks email link
  ↓
Operating system checks domain verification
  ↓
Opens app instead of browser (if verified)
  ↓
App navigates to /auth/callback route
  ↓
Callback handler exchanges token for session
  ↓
User redirected to appropriate page (dashboard, onboarding, etc.)
```

---

## Files Created

### 1. Domain Verification Files

| File | Purpose | Status |
|------|---------|--------|
| `public/.well-known/apple-app-site-association` | iOS Universal Links configuration | ⚠️ Needs Team ID |
| `public/.well-known/assetlinks.json` | Android App Links verification | ⚠️ Needs SHA-256 fingerprints |

### 2. iOS Configuration

| File | Purpose | Status |
|------|---------|--------|
| `ios/App/App/App.entitlements` | Associated Domains entitlement | ✅ Created |
| `ios/App/App/Info.plist` | Custom URL schemes | ✅ Updated |

### 3. Auth Pages

| Page | Purpose | Status |
|------|---------|--------|
| `/app/auth/callback/route.ts` | Token exchange handler | ✅ Created |
| `/app/auth/update-password/page.tsx` | Password reset page | ✅ Created |
| `/app/auth/forgot-password/page.tsx` | Password reset request | ✅ Created |
| `/app/auth/sign-up/page.tsx` | Updated redirect URL | ✅ Updated |
| `/app/auth/login/page.tsx` | Added forgot password link | ✅ Updated |

---

## Setup Steps

### Step 1: Get Apple Team ID (iOS)

1. Open [Apple Developer Account](https://developer.apple.com/account)
2. Sign in with your Apple Developer account
3. Navigate to **Membership** section
4. Copy your **Team ID** (10-character alphanumeric string)

**Update the file:**

```bash
# Edit: public/.well-known/apple-app-site-association
# Replace: YOUR_APPLE_TEAM_ID
# With: Your actual Team ID (e.g., ABC123XYZ9)
```

**Example:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABC123XYZ9.app.vlife.ios",  // ← Replace YOUR_APPLE_TEAM_ID
        "paths": ["/auth/*", "/onboarding/*", "/dashboard", "/settings"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["ABC123XYZ9.app.vlife.ios"]  // ← Replace YOUR_APPLE_TEAM_ID
  }
}
```

---

### Step 2: Get Android Signing Certificate SHA-256 Fingerprints

#### For Debug Builds (Testing)

```bash
cd android
./gradlew signingReport

# Or use keytool directly:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-256 fingerprint** (format: `AB:CD:EF:12:34:56:...`)

#### For Release Builds (Production)

```bash
# If you have your keystore file:
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-key-alias

# Or get it from Google Play Console:
# 1. Go to Google Play Console
# 2. Select your app
# 3. Navigate to Release → Setup → App Integrity
# 4. Copy SHA-256 certificate fingerprint under "App signing key certificate"
```

**Update the file:**

```bash
# Edit: public/.well-known/assetlinks.json
# Replace: REPLACE_WITH_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT
# Replace: REPLACE_WITH_YOUR_DEBUG_KEYSTORE_SHA256_FINGERPRINT
```

**Example:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.vlife.android",
      "sha256_cert_fingerprints": [
        "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56",  // ← Release key
        "12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB"   // ← Debug key
      ]
    }
  }
]
```

**Remove the colons:**
```
Original:  AB:CD:EF:12:34...
Required:  ABCDEF1234...
```

---

### Step 3: Configure Xcode Project (iOS)

The entitlements file has been created, but you need to add it to your Xcode project:

1. **Open Xcode project:**
   ```bash
   open ios/App/App.xcworkspace
   ```

2. **Add entitlements file to project:**
   - In Xcode, select the **App** target
   - Click **Build Settings** tab
   - Search for "Code Signing Entitlements"
   - Set the value to: `App/App.entitlements`

   OR

   - Drag `ios/App/App/App.entitlements` into the Xcode project navigator
   - Ensure it's added to the **App** target (check the box in "Target Membership")

3. **Verify Associated Domains:**
   - Select the **App** target
   - Go to **Signing & Capabilities** tab
   - You should see **Associated Domains** capability
   - If not, click **+ Capability** and add **Associated Domains**
   - Verify the domains are listed:
     - `applinks:v-life.app`
     - `applinks:www.v-life.app`
     - `webcredentials:v-life.app`
     - `webcredentials:www.v-life.app`

---

### Step 4: Deploy Domain Verification Files

The verification files MUST be accessible at these URLs:

- **iOS**: `https://v-life.app/.well-known/apple-app-site-association`
- **iOS**: `https://www.v-life.app/.well-known/apple-app-site-association`
- **Android**: `https://v-life.app/.well-known/assetlinks.json`
- **Android**: `https://www.v-life.app/.well-known/assetlinks.json`

**Deploy the app:**

```bash
# Build and deploy Next.js app with the new files in public/.well-known/
npm run build
# Deploy to Vercel or your hosting platform
```

**Verify deployment:**

```bash
# Test iOS file (should return JSON, NO 404)
curl https://v-life.app/.well-known/apple-app-site-association

# Test Android file (should return JSON, NO 404)
curl https://v-life.app/.well-known/assetlinks.json
```

**CRITICAL:**
- Files MUST be served with `Content-Type: application/json`
- Files MUST be accessible without authentication
- Files MUST NOT redirect (301/302)
- HTTPS is required (NOT http)

---

### Step 5: Configure Supabase Redirect URLs

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → URL Configuration**
4. Add the following **Redirect URLs**:

```
https://v-life.app/auth/callback
https://www.v-life.app/auth/callback
http://localhost:3000/auth/callback
```

5. Update **Site URL** to:
```
https://v-life.app
```

6. Save changes

---

### Step 6: Update Supabase Email Templates (Optional)

By default, Supabase auth emails now use:
- Redirect URL: `/auth/callback?next=/onboarding/profile` (or other paths)

If you've customized email templates, ensure they use `{{ .ConfirmationURL }}` which will automatically include the correct redirect URL.

**No changes needed if using default Supabase templates.**

---

### Step 7: Test Deep Linking

#### iOS Testing

1. **Build and install the app:**
   ```bash
   npx cap sync ios
   npx cap open ios
   # Build and run on a physical device (simulators don't support Universal Links)
   ```

2. **Test email confirmation:**
   - Sign up with a new email address
   - Receive confirmation email
   - Click the confirmation link from your iPhone
   - **Expected**: App opens directly to `/auth/callback`
   - **NOT Expected**: Safari opens the link

3. **Test password reset:**
   - Use "Forgot password?" link in the app
   - Receive password reset email
   - Click the reset link from your iPhone
   - **Expected**: App opens to password update page
   - **NOT Expected**: Safari opens the link

4. **Debug Universal Links:**
   ```bash
   # Check if domain verification succeeded
   # On iOS device, go to: Settings → Developer → Universal Links
   # Or use this terminal command on Mac:
   swcutil query https://v-life.app
   ```

#### Android Testing

1. **Build and install the app:**
   ```bash
   npx cap sync android
   npx cap open android
   # Build and run on a physical device
   ```

2. **Test email confirmation:**
   - Sign up with a new email address
   - Receive confirmation email
   - Click the confirmation link from your Android device
   - **Expected**: App opens directly to `/auth/callback`
   - **NOT Expected**: Chrome opens the link

3. **Test password reset:**
   - Use "Forgot password?" link in the app
   - Receive password reset email
   - Click the reset link from your Android device
   - **Expected**: App opens to password update page
   - **NOT Expected**: Chrome opens the link

4. **Verify App Links:**
   ```bash
   # Check if domain verification succeeded
   adb shell pm get-app-links app.vlife.android

   # Expected output should show:
   # v-life.app: verified
   # www.v-life.app: verified
   ```

---

## Troubleshooting

### iOS: Links Still Open in Safari

**Causes:**
1. Apple Team ID not updated in `apple-app-site-association`
2. Entitlements not properly configured in Xcode
3. Domain verification file not accessible or has wrong content-type
4. Testing on iOS Simulator (simulators don't support Universal Links)

**Solutions:**
1. Verify Team ID in `apple-app-site-association` matches your Apple Developer account
2. Rebuild the app after updating entitlements: `npx cap sync ios`
3. Test file accessibility: `curl -I https://v-life.app/.well-known/apple-app-site-association`
4. Use a physical iOS device for testing
5. Uninstall and reinstall the app (iOS caches domain verification)

---

### Android: Links Still Open in Chrome

**Causes:**
1. SHA-256 fingerprint doesn't match your app signing certificate
2. Domain verification failed
3. `assetlinks.json` not accessible or malformed

**Solutions:**
1. Verify SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
   ```
2. Check domain verification status:
   ```bash
   adb shell pm get-app-links app.vlife.android
   ```
3. Clear Chrome data and reinstall app
4. Wait 5-10 minutes after deploying `assetlinks.json` (Android caches verification)

---

### Verification Files Return 404

**Causes:**
1. Files not included in Next.js build
2. Hosting platform doesn't serve `.well-known` directory
3. Files not deployed to production

**Solutions:**
1. Verify files exist in `public/.well-known/`
2. Check Next.js config allows serving static files
3. Redeploy the app: `npm run build && vercel --prod`
4. Test file directly: `curl https://v-life.app/.well-known/apple-app-site-association`

---

### Email Links Work on Web but Not Mobile

**Causes:**
1. Different redirect URLs configured for web vs mobile
2. Supabase redirect URLs not updated

**Solutions:**
1. Verify Supabase redirect URLs include `/auth/callback`
2. Check Capacitor `allowNavigation` includes your domain:
   ```typescript
   // capacitor.config.ts
   server: {
     allowNavigation: [
       "v-life.app",
       "*.v-life.app",
       "www.v-life.app",
       "*.supabase.co"
     ],
   }
   ```

---

## Verification Checklist

Before testing, ensure:

- [ ] Apple Team ID updated in `apple-app-site-association`
- [ ] Android SHA-256 fingerprints added to `assetlinks.json`
- [ ] Xcode project configured with entitlements file
- [ ] Domain verification files accessible via HTTPS
- [ ] Supabase redirect URLs updated
- [ ] App rebuilt and reinstalled on device
- [ ] Testing on **physical device** (not simulator/emulator)

---

## Useful Links

- [Apple Universal Links Guide](https://developer.apple.com/ios/universal-links/)
- [Android App Links Guide](https://developer.android.com/training/app-links)
- [Capacitor Deep Linking Docs](https://capacitorjs.com/docs/guides/deep-links)
- [Supabase Auth Deep Linking](https://supabase.com/docs/guides/auth/redirect-urls)

---

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check Xcode/Android Studio logs
3. Verify domain verification status (commands above)
4. Test on multiple devices
5. Ensure files are deployed and accessible

**Common Issues:**
- iOS requires physical device (simulator doesn't work)
- Android requires app signing certificate (debug vs release keys)
- Both platforms cache domain verification (may need to wait or reinstall app)
