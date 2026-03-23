# Mobile Deep Linking Setup Guide

This guide explains how to set up universal links (iOS) and app links (Android) for V-Life mobile app authentication.

## 🎯 What This Does

When users click authentication links in emails:
- **iOS**: Opens V-Life app directly (not Safari)
- **Android**: Opens V-Life app directly (not Chrome)
- **Fallback**: Works in web browser if app isn't installed

---

## ✅ Web Setup (DONE)

The following has already been configured on the web side:

1. **Auth Callback Page**: `/app/auth/callback/page.tsx`
   - Detects mobile devices
   - Tries to open app with deep link
   - Falls back to web auth if app doesn't open

2. **Universal Links Config**: `/public/.well-known/apple-app-site-association`
   - iOS will recognize `https://v-life.app/auth/*` as app links

3. **App Links Config**: `/public/.well-known/assetlinks.json`
   - Android will recognize `https://v-life.app/auth/*` as app links

4. **Next.js Headers**: Configured to serve `.well-known` files with correct content-type

---

## 📱 Mobile App Setup (YOUR TURN)

### Prerequisites

You need to know:
- **iOS Team ID**: Find this in Apple Developer Account
- **Android Package Name**: e.g., `com.vlife.app`
- **Android SHA256 Fingerprint**: From your app signing keystore

---

## iOS Setup (React Native / Expo)

### Step 1: Update iOS Entitlements

Add to your `ios/YourApp/YourApp.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:v-life.app</string>
        <string>applinks:www.v-life.app</string>
    </array>
</dict>
</plist>
```

### Step 2: Update Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Select your App ID
3. Enable "Associated Domains" capability
4. Add domains: `v-life.app` and `www.v-life.app`

### Step 3: Update `apple-app-site-association` File

Replace `TEAM_ID` in `/public/.well-known/apple-app-site-association` with your actual Apple Team ID:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.vlife.app",
        "paths": [
          "/auth/callback",
          "/auth/callback/*",
          "/auth/*"
        ]
      }
    ]
  }
}
```

### Step 4: Handle Deep Links in React Native

Add to your `App.tsx` or main component:

```typescript
import { useEffect } from 'react'
import { Linking } from 'react-native'
import { useRouter } from 'expo-router' // or your router

export default function App() {
  const router = useRouter()

  useEffect(() => {
    // Handle initial URL (app was closed and opened with link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    return () => subscription.remove()
  }, [])

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url)

    // Parse URL
    const { hostname, pathname, searchParams, hash } = new URL(url)

    // Handle auth callback
    if (pathname.includes('/auth/callback')) {
      // Extract tokens from hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Store session using Supabase
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        // Navigate to appropriate screen
        router.push('/dashboard')
      }
    }
  }

  return <YourApp />
}
```

---

## Android Setup (React Native / Expo)

### Step 1: Update AndroidManifest.xml

Add intent filter to your `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask">

    <!-- Existing intent filters -->

    <!-- Add this for App Links -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data
            android:scheme="https"
            android:host="v-life.app"
            android:pathPrefix="/auth" />
    </intent-filter>

    <!-- Custom URL Scheme (fallback) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data android:scheme="vlife" />
    </intent-filter>
</activity>
```

### Step 2: Get Your SHA256 Fingerprint

Run this command to get your app's SHA256 fingerprint:

```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore
keytool -list -v -keystore /path/to/your/release.keystore -alias your-alias
```

Copy the SHA256 fingerprint (looks like `AA:BB:CC:DD:...`)

### Step 3: Update `assetlinks.json`

Replace placeholders in `/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vlife.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

---

## 🔧 Supabase Configuration

In your Supabase Dashboard, set:

1. **Site URL**: `https://v-life.app`

2. **Redirect URLs** (add all of these):
   ```
   https://v-life.app/auth/callback
   vlife://auth/callback
   ```

---

## 🧪 Testing

### Test iOS Universal Links

1. Send yourself an email with link: `https://v-life.app/auth/callback?test=true`
2. Open email on iPhone
3. Tap link
4. **Expected**: App opens (not Safari)

### Test Android App Links

1. Run: `adb shell am start -a android.intent.action.VIEW -d "https://v-life.app/auth/callback?test=true"`
2. **Expected**: App opens (not Chrome)

### Test Custom URL Scheme (Fallback)

```bash
# iOS
xcrun simctl openurl booted "vlife://auth/callback?test=true"

# Android
adb shell am start -a android.intent.action.VIEW -d "vlife://auth/callback?test=true"
```

---

## 🐛 Troubleshooting

### iOS Universal Links Not Working

1. **Clear iOS Universal Links cache**:
   ```
   Settings > Safari > Advanced > Website Data > Remove All
   ```

2. **Verify AASA file is accessible**:
   - Visit: `https://v-life.app/.well-known/apple-app-site-association`
   - Should return JSON (not HTML)
   - Content-Type should be `application/json`

3. **Test with Apple's validator**:
   - https://search.developer.apple.com/appsearch-validation-tool/

### Android App Links Not Working

1. **Verify assetlinks.json is accessible**:
   - Visit: `https://v-life.app/.well-known/assetlinks.json`
   - Should return JSON array

2. **Test with Google's validator**:
   - https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://v-life.app&relation=delegate_permission/common.handle_all_urls

---

## 📝 Implementation Checklist

### Web Side (DONE ✅)
- [x] Created `/app/auth/callback/page.tsx`
- [x] Created `/.well-known/apple-app-site-association`
- [x] Created `/.well-known/assetlinks.json`
- [x] Updated `next.config.mjs` with headers
- [x] Deployed to production

### iOS Side (TODO)
- [ ] Get Apple Team ID
- [ ] Update `apple-app-site-association` with Team ID
- [ ] Add Associated Domains entitlement
- [ ] Enable in Apple Developer Portal
- [ ] Implement deep link handler in app
- [ ] Test universal links

### Android Side (TODO)
- [ ] Get SHA256 fingerprint
- [ ] Update `assetlinks.json` with fingerprint
- [ ] Add intent filter to AndroidManifest.xml
- [ ] Implement deep link handler in app
- [ ] Test app links

### Supabase (TODO)
- [ ] Set Site URL to `https://v-life.app`
- [ ] Add redirect URLs for both web and app

---

## 🚀 After Setup

Once everything is configured:

1. User receives email with link: `https://v-life.app/auth/callback?code=...`
2. User taps link on mobile
3. **iOS/Android**: App opens directly
4. **Web (fallback)**: Browser opens, tries to launch app
5. App parses tokens and logs user in
6. User lands on dashboard - **seamless experience**

---

## 💡 Advanced: Branch.io Integration

For even better UX, consider Branch.io which handles:
- App not installed → redirect to App Store
- Resume auth flow after install
- Cross-platform deep linking
- Analytics and attribution

---

## 📞 Need Help?

If you run into issues:
1. Check browser console for deep link logs
2. Check mobile app logs for URL handling
3. Verify `.well-known` files are accessible
4. Test with validators (links above)

---

**Note**: Remember to redeploy your web app after updating the `.well-known` files!
