# Release Assets & Production Deployment Guide
**Project:** Inbox Companion  
**Version:** 1.0.0+1  

---

## 📦 1. Signed-Release Android APK Build Guide

### Step 1: Generate Release Keystore
Run the following command to generate an RSA 4096-bit upload key:

```bash
keytool -genkey -v -keystore android/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storetype JKS
```

### Step 2: Configure `android/key.properties`
Create `android/key.properties` (ensure this file is in `.gitignore`):

```properties
storePassword=YOUR_SECURE_STORE_PASSWORD
keyPassword=YOUR_SECURE_KEY_PASSWORD
keyAlias=upload
storeFile=../upload-keystore.jks
```

### Step 3: Configure Signing in `android/app/build.gradle`
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
            storeFile = keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword = keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: ProGuard / R8 Rules (`android/app/proguard-rules.pro`)
```proguard
# Drift & SQLite FFI
-keep class com.simonbingham.sqlite3.** { *; }
-keep class net.sqlcipher.** { *; }
-dontwarn net.sqlcipher.**

# Flutter Secure Storage
-keep class androidx.security.crypto.** { *; }
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# OkHttp & Retrofit (if native plugins used)
-dontwarn okhttp3.**
-dontwarn okio.**
```

### Step 5: Execute Release Build
```bash
# Build standalone release APK
flutter build apk --release -t lib/main_prod.dart

# Build production Android App Bundle (for Google Play Console)
flutter build appbundle --release -t lib/main_prod.dart
```

---

## 🎨 2. Original App Icon Specification

### Visual Concept: "The Iris Fold"
An original geometric symbol uniting **productivity** and **privacy**:
- **Structure:** An origami folded envelope constructed from isometric geometric facets.
- **Color Palette:**
  - Base Gradient: Royal Iris (`#4F46E5` to `#3730A3`) representing precision and focus.
  - Accent Wing: Aurora Teal (`#06B6D4` to `#0EA5E9`) representing modern speed.
  - Core Notch: An embedded hexagonal shield notch in bright platinum white (`#F8FAFC`), visually signaling hardware-backed encryption and zero-knowledge data boundaries.
- **Zero Company Resemblance:** Custom isometric proportions that avoid any resemblance to existing commercial email logos.

### Master Vector Asset (`assets/icon/app_icon.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="irisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#0891B2" />
    </linearGradient>
  </defs>
  <!-- App Icon Squircle Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <!-- Folded Envelope Back Facet -->
  <path d="M 96 176 L 256 288 L 416 176 L 416 352 A 24 24 0 0 1 392 376 L 120 376 A 24 24 0 0 1 96 352 Z" fill="#312E81" />
  <!-- Left Wing Origami Fold -->
  <path d="M 96 176 L 256 288 L 96 352 Z" fill="url(#irisGrad)" opacity="0.9" />
  <!-- Right Wing Origami Fold -->
  <path d="M 416 176 L 256 288 L 416 352 Z" fill="url(#irisGrad)" opacity="0.8" />
  <!-- Dynamic Teal Top Envelope Flap -->
  <path d="M 96 176 L 256 296 L 416 176 L 392 144 A 24 24 0 0 0 372 136 L 140 136 A 24 24 0 0 0 120 144 Z" fill="url(#tealGrad)" />
  <!-- Central Privacy Shield Core -->
  <path d="M 256 240 L 284 260 L 284 286 C 284 302 272 316 256 322 C 240 316 228 302 228 286 L 228 260 Z" fill="#F8FAFC" />
  <path d="M 248 274 L 254 280 L 266 268" stroke="#0891B2" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>
```

---

## 📱 3. 5 Store-Style Screenshots Storyboard

| Slide # | Headline | Subtitle | Visual Composition & Highlights |
|:---:|---|---|---|
| **#1** | **Zero-Latency Offline Inbox** | *Instant SQLite streaming. No spinners, ever.* | Inbox view showing rich message cards, unread badges, participant avatars, label chips (`Work`, `Urgent`), and the visible `DEMO MODE` badge in the AppBar. |
| **#2** | **Fluid Swipe Triage with Instant Undo** | *Archive or delete with one touch. Reversible in 5s.* | A thread being swiped with the green archive background showing, and the floating `AppSnackbar` ("Archived • Tap to Undo") at the bottom. |
| **#3** | **Spotlight Command Palette** | *Search syntax & instant actions with ⌘K.* | The dark spotlight modal overlay with search chips (`from:`, `is:unread`, `has:attachment`), keyboard shortcuts (`C`, `R`, `S`), and fast jump actions. |
| **#4** | **AI Drafting with Safety Boundaries** | *Assistance that stays within editable bounds.* | AI Draft Reply bottom sheet showing tone chips (`Formal`, `Casual`, `Concise`), streaming generated reply text, and the visible `AI-generated` security chip. |
| **#5** | **Human-Approved Send Guarantee** | *No AI or automation sends without your explicit tap.* | The verified review sheet displaying sender account, recipient chips, subject, scheduled send time, and explicit "Confirm & Send" button. |

---

## 🎬 4. 60-90 Second Demo-Video Storyboard

| Timestamp | On-Screen Action | Visual Focus | Caption / Voiceover |
|:---:|---|---|---|
| **00:00 - 00:10** | App launches instantly into `InboxScreen`. Fictional threads populate without any network spinner. | Tap drawer to show folders and accounts. Point out visible `DEMO MODE` badge. | *"Inbox Companion boots in under 350ms, streaming directly from a local Drift SQLite database. No spinners, full offline support."* |
| **00:10 - 00:25** | Swipe left on "Weekly Sprint Planning" thread. Thread vanishes immediately. Tap "Undo" on floating snackbar; thread animates back. | Smooth swipe gesture, green background icon, haptic response, immediate optimistic rollback. | *"Optimistic UI updates mean instant feedback. Swipe to archive, with a guaranteed 5-second reversible undo window."* |
| **00:25 - 00:38** | Tap Command Palette button (or press `Ctrl+K`). Type `is:unread` or `has:attachment`. | Dark frosted spotlight sheet with instant fuzzy filtering and keyboard shortcuts. | *"Press Command-K to launch the spotlight command palette. Filter by sender, attachment, or unread status in milliseconds."* |
| **00:38 - 00:52** | Open thread "Q3 Product Strategy & Roadmap". Tap "Summarize Thread". | AI summary card animates with bulleted takeaways. Point out shield banner: *"Remote images blocked to protect your IP"*. | *"Review dense threads with instant AI summaries. Tracking pixels and remote images are strictly blocked by default."* |
| **00:52 - 01:10** | Tap "Draft Reply with AI". Watch reply stream in. Tap "Professional" tone chip to regenerate with formal phrasing. Tap "Use as Draft". | Modal sheet updates dynamically. Compose screen opens with populated body and `AI-Generated Draft` badge. | *"Generate draft replies in any tone. Notice the guarantee: AI can only populate an editable draft; it can never send on its own."* |
| **01:10 - 01:25** | Edit one sentence in body. Tap "Review & Send". Review sheet opens showing recipients, account, and subject. Tap "Confirm & Send". | Modal sheet highlights verified recipient chips. Message is queued to the reliable outbox. | *"Every email requires human-in-the-loop approval. Review recipients, subject, and attachments before explicit dispatch."* |
| **01:25 - 01:30** | Tap the "RESET DEMO" badge in the AppBar. Confirm dialog pops up. Tap "Reset Clean". | Fictional inbox restores to pristine initial state in 50ms. | *"With one tap, the demo resets cleanly for the next presentation. Fast, reliable, and privacy-first."* |
