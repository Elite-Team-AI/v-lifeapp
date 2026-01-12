# V-Life Fitness - App Store Publishing Guide

Complete guide for publishing V-Life Fitness to iOS App Store and Google Play Store.

## Prerequisites

### For Android Builds (Local)
```bash
# Install JDK 17+
# Windows: Download from https://adoptium.net/
# macOS: brew install openjdk@17

# Install Android Studio
# Download from https://developer.android.com/studio

# Set environment variables (Windows)
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"

# Set environment variables (macOS/Linux)
export JAVA_HOME=/usr/local/opt/openjdk@17
export ANDROID_HOME=~/Library/Android/sdk
```

### For iOS Builds
- **Option A**: macOS with Xcode 15+
- **Option B**: Codemagic cloud build (configured in `codemagic.yaml`)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Sync Native Platforms
```bash
npx cap sync
```

### 3. Generate Icons (if not already done)
```bash
node scripts/generate-app-icons.mjs
npx capacitor-assets generate --android --ios
```

---

## Android Build Instructions

### Debug Build (Testing)
```bash
# Windows
cd android
.\gradlew.bat assembleDebug

# macOS/Linux
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (Play Store)

#### Step 1: Create Release Keystore
```bash
cd android

# Generate keystore (save password securely!)
keytool -genkey -v -keystore vlife-release.keystore -alias vlife -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password
# - Key password
# - Your name, organization, etc.
```

#### Step 2: Set Environment Variables
```bash
# Windows (PowerShell)
$env:VLIFE_KEYSTORE_PATH = "C:\path\to\vlife-release.keystore"
$env:VLIFE_KEYSTORE_PASSWORD = "your-keystore-password"
$env:VLIFE_KEY_ALIAS = "vlife"
$env:VLIFE_KEY_PASSWORD = "your-key-password"

# macOS/Linux
export VLIFE_KEYSTORE_PATH=/path/to/vlife-release.keystore
export VLIFE_KEYSTORE_PASSWORD=your-keystore-password
export VLIFE_KEY_ALIAS=vlife
export VLIFE_KEY_PASSWORD=your-key-password
```

#### Step 3: Build Release AAB
```bash
# Windows
cd android
.\gradlew.bat bundleRelease

# macOS/Linux
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## iOS Build Instructions

### Option A: Local Build (macOS with Xcode)

```bash
# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select your Apple Developer Team
# 2. Update Bundle Identifier if needed
# 3. Product > Archive
# 4. Distribute App > App Store Connect
```

### Option B: Codemagic Cloud Build (Recommended)

1. **Sign up** at [codemagic.io](https://codemagic.io)
2. **Connect** your GitHub repository
3. **Configure credentials** in Codemagic dashboard:
   - Add App Store Connect API key
   - Configure automatic code signing
4. **Push to main branch** to trigger build
5. **IPA automatically uploads** to TestFlight

---

## RevenueCat Setup

### 1. Create RevenueCat Account
Go to [app.revenuecat.com](https://app.revenuecat.com) and create a project.

### 2. Add Apps
- Add iOS app with bundle ID: `app.vlife.fitness`
- Add Android app with package name: `app.vlife.fitness`

### 3. Create Entitlements
In RevenueCat dashboard:
- Create entitlement: `pro`
- Create entitlement: `elite`

### 4. Get API Keys
Copy your API keys and update `lib/services/revenuecat.ts`:
```typescript
const REVENUECAT_IOS_KEY = "appl_YOUR_ACTUAL_KEY";
const REVENUECAT_ANDROID_KEY = "goog_YOUR_ACTUAL_KEY";
```

### 5. Configure Webhook
In RevenueCat dashboard, add webhook URL:
```
https://v-life.app/api/webhooks/revenuecat
```

Set authorization header and add to environment:
```
REVENUECAT_WEBHOOK_AUTH=Bearer your-webhook-secret
```

---

## Google Play Store Submission

### Create Developer Account
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete identity verification

### Create In-App Products
1. Go to Monetization > Products > Subscriptions
2. Create subscriptions:

| Product ID | Name | Price |
|------------|------|-------|
| `vlife_pro_monthly` | V-Life Pro | $29.99/month |
| `vlife_elite_monthly` | V-Life Elite | $49.99/month |

### Store Listing (Copy-Paste Ready)

**App Name:**
```
V-Life Fitness
```

**Short Description (80 chars):**
```
AI-powered fitness coaching. Track workouts, nutrition, and habits in one app.
```

**Full Description:**
```
V-Life Fitness is your complete AI-powered fitness companion that helps you achieve your health and wellness goals.

KEY FEATURES:

🏋️ SMART WORKOUT TRACKING
• Log your exercises with intelligent suggestions
• Track sets, reps, and weights
• View workout history and progress charts
• Get personalized workout recommendations

🥗 NUTRITION PLANNING
• AI-generated meal plans based on your goals
• Track calories and macros effortlessly
• Discover healthy recipes
• Log meals quickly with smart suggestions

📊 PROGRESS TRACKING
• Visual progress charts and analytics
• Weight tracking with trend analysis
• Body measurements and progress photos
• Streak tracking to keep you motivated

🤖 AI FITNESS COACH
• Chat with VBot, your personal AI coach
• Get instant answers to fitness questions
• Receive personalized tips and motivation
• Daily AI-generated insights

👥 COMMUNITY
• Connect with other fitness enthusiasts
• Share your achievements
• Get motivated by others' progress
• Support and celebrate together

✅ HABIT BUILDING
• Create custom daily habits
• Track completion with visual streaks
• Build lasting healthy routines

Your lifestyle. Your plan. Powered by AI.

Download V-Life Fitness today and start your transformation!
```

**Category:** Health & Fitness
**Content Rating:** Everyone
**Privacy Policy URL:** `https://v-life.app/privacy-policy`

### Required Assets

| Asset | Size | Notes |
|-------|------|-------|
| App Icon | 512x512 PNG | Generated in `android/app/src/main/res/` |
| Feature Graphic | 1024x500 PNG | Create with V-Life branding |
| Screenshots | 1080x1920 | Min 2, max 8 per device |

### Upload AAB
1. Create > Production > Create new release
2. Upload `app-release.aab`
3. Complete store listing
4. Submit for review

---

## Apple App Store Submission

### Create Developer Account
1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Wait for approval (1-2 days)

### Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps > + > New App
3. Bundle ID: `app.vlife.fitness`

### Create In-App Purchases
1. Go to Features > In-App Purchases
2. Create auto-renewable subscriptions:

| Reference Name | Product ID | Price |
|---------------|------------|-------|
| V-Life Pro Monthly | `vlife_pro_monthly` | $29.99 |
| V-Life Elite Monthly | `vlife_elite_monthly` | $49.99 |

### Store Listing (Copy-Paste Ready)

**App Name:**
```
V-Life Fitness
```

**Subtitle (30 chars):**
```
AI Fitness & Nutrition Coach
```

**Promotional Text (170 chars):**
```
Transform your fitness journey with AI-powered coaching! Track workouts, plan meals, build habits, and connect with a supportive community.
```

**Description:**
```
V-Life Fitness is your complete AI-powered fitness companion that helps you achieve your health and wellness goals.

KEY FEATURES:

SMART WORKOUT TRACKING
• Log your exercises with intelligent suggestions
• Track sets, reps, and weights
• View workout history and progress charts
• Get personalized workout recommendations

NUTRITION PLANNING
• AI-generated meal plans based on your goals
• Track calories and macros effortlessly
• Discover healthy recipes
• Log meals quickly with smart suggestions

PROGRESS TRACKING
• Visual progress charts and analytics
• Weight tracking with trend analysis
• Body measurements and progress photos
• Streak tracking to keep you motivated

AI FITNESS COACH
• Chat with VBot, your personal AI coach
• Get instant answers to fitness questions
• Receive personalized tips and motivation
• Daily AI-generated insights

COMMUNITY
• Connect with other fitness enthusiasts
• Share your achievements
• Get motivated by others' progress
• Support and celebrate together

HABIT BUILDING
• Create custom daily habits
• Track completion with visual streaks
• Build lasting healthy routines

Your lifestyle. Your plan. Powered by AI.
```

**Keywords (100 chars):**
```
fitness,workout,nutrition,meal plan,AI coach,habit tracker,weight loss,exercise,health,gym
```

**Support URL:** `https://v-life.app/help-support`
**Marketing URL:** `https://v-life.app`
**Privacy Policy URL:** `https://v-life.app/privacy-policy`

**Category:** Health & Fitness
**Secondary Category:** Lifestyle
**Age Rating:** 4+

### Required Screenshots

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" | 1290x2796 | Yes |
| iPhone 6.5" | 1284x2778 | Yes |
| iPhone 5.5" | 1242x2208 | Optional |
| iPad Pro 12.9" | 2048x2732 | If iPad supported |

### Upload IPA
1. Use Xcode Organizer or Transporter app
2. Or use Codemagic (auto-uploads to TestFlight)
3. Add build to release
4. Submit for review

---

## Deep Links Setup

### Android App Links
Host this file at `https://v-life.app/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.vlife.fitness",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

Get your SHA256 fingerprint:
```bash
keytool -list -v -keystore vlife-release.keystore -alias vlife
```

### iOS Universal Links
Host this file at `https://v-life.app/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.app.vlife.fitness",
        "paths": ["*"]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

---

## Troubleshooting

### Android Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### iOS Build Fails
```bash
# Update CocoaPods
cd ios/App
pod install --repo-update
```

### Capacitor Sync Issues
```bash
# Full resync
npx cap sync --force
```

---

## Security Checklist

- [ ] Never commit keystore files to git
- [ ] Store keystore passwords in secure vault
- [ ] Use environment variables for sensitive data
- [ ] Backup keystores (you can't regenerate them!)
- [ ] Enable App Signing by Google Play for extra safety
