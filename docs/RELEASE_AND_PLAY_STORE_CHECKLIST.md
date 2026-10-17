# Inbox Companion: Release Build Instructions & Play Store Checklist

## 1. Signed Release Build Instructions

### A. Keystore Generation
Generate a dedicated release upload key using Java `keytool`:
```bash
keytool -genkey -v -keystore android/app/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS
```

### B. Configure `key.properties`
Create `android/key.properties` (this file is excluded from Git in `.gitignore`):
```properties
storePassword=<YOUR_STORE_PASSWORD>
keyPassword=<YOUR_KEY_PASSWORD>
keyAlias=upload
storeFile=upload-keystore.jks
```

### C. Build Signed App Bundle (AAB)
Build the production flavor bundle with Dart defines:
```bash
flutter build appbundle --release \
  --dart-define=FLAVOR=prod \
  --dart-define=BASE_URL=https://api.inboxcompanion.app \
  --dart-define=APP_ID=com.inboxcompanion.inbox_companion \
  --obfuscate \
  --split-debug-info=build/app/outputs/symbols
```

Output:
`build/app/outputs/bundle/release/app-release.aab`

---

## 2. Google Play Store Data Safety Form

### Data Collection & Purpose
| Data Type | Collected | Shared with 3rd Parties? | Purpose | Ephemeral? |
|---|---|---|---|---|
| **Emails & Messages** | Yes (stored locally on device in Drift SQLite) | **No** | Core App Functionality (Email viewing, compose, offline cache) | No (retained until user disconnects/deletes) |
| **Contacts & Recipients** | Yes (local autocomplete) | **No** | Recipient suggestions during Compose | No |
| **User Identifiers (Email, Name)** | Yes | **No** | Account authentication & profile identification | No |
| **Diagnostics & Errors** | Yes (Anonymized, Redacted) | **No** | Crash reporting & performance monitoring (zero PII) | Retained 30 days |
| **Voice / Audio Data** | Yes (transient) | **No** | Speech dictation in Compose (processed via system SpeechRecognizer, never recorded to disk) | Yes |

### Security Practices
- **Encryption in Transit**: All data transmitted to servers uses TLS 1.3 / HTTPS. Cleartext HTTP traffic is disabled at the OS level (`usesCleartextTraffic="false"`).
- **Encryption at Rest**: Auth session tokens and sensitive configurations are encrypted via Android Keystore / `flutter_secure_storage`. SQLite database supports SQLCipher encryption.
- **Account & Data Deletion Mechanism**: Users can tap **"Disconnect & Delete All Local Data"** under Settings or the Account dialog to wipe all local databases, drafts, tokens, and cached credentials immediately.

---

## 3. Permissions Justification Audit

| Permission | Android Level | User-Facing Justification |
|---|---|---|
| `POST_NOTIFICATIONS` | Runtime (API 33+) | Notifying the user of high-importance emails, snooze reminder triggers, and upcoming calendar meetings. |
| `SCHEDULE_EXACT_ALARM` | Platform / Alarm | Triggering snooze alarms, follow-up alerts, and task deadlines at the exact minute requested by the user. |
| `RECORD_AUDIO` | Runtime | Optional speech-to-text voice dictation in the Compose draft editor. Only requested upon tapping the microphone button. |
| `USE_BIOMETRIC` | Normal | Providing biometric app lock (fingerprint / face unlock) to protect email confidentiality on device resume. |
| `INTERNET` | Normal | Syncing emails, folders, contacts, and outbox actions with the remote mail server. |
| `ACCESS_NETWORK_STATE` | Normal | Detecting offline/online status to schedule sync retries with exponential backoff. |

---

## 4. Privacy Policy Placeholder
A privacy policy compliant with Google Play policy must be published at a public HTTPS URL prior to store submission:
- **URL**: `https://inboxcompanion.app/privacy-policy`
- **Summary**:
  - We do not sell your personal data or email contents.
  - Emails are synced directly to your device and cached in an encrypted SQLite database.
  - AI features are opt-in only. When enabled, only the explicitly opened thread is transmitted to the AI endpoint for summary or draft reply generation. AI never has permission to execute write actions.
  - Analytics and telemetry are privacy-friendly, anonymized, and redact all email addresses, tokens, and personal names.

---

## 5. Pre-Submission Quality Checklist
- [x] R8 minification enabled with `proguard-rules.pro` keeping native SQLite, Biometrics, and Coroutines.
- [x] Cleartext HTTP traffic blocked (`android:usesCleartextTraffic="false"`).
- [x] Strict Dart analyzer clean with `--fatal-infos --fatal-warnings`.
- [x] Comprehensive automated test suite passing (87+ unit/integration tests).
- [x] TalkBack / Screen reader semantic labels on all icon buttons and interactive controls.
- [x] Demo mode toggle clearly watermarked and distinct from live production accounts.
