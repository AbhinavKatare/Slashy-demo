# Inbox Companion - Comprehensive Demonstration & Verification Script

This walkthrough script guides evaluators and testers through every feature of **Inbox Companion**, from local seed data onboarding to AI drafting and push notification flows.

---

## Prerequisites & Launching

1. Ensure the Flutter SDK is installed and on your path.
2. In the project root, run:
   ```bash
   flutter pub get
   flutter run --dart-define=FLAVOR=dev
   ```
3. To run all unit and integration tests:
   ```bash
   flutter test
   ```

---

## ⚡ The Scripted 90-Second "Wow Path" (Founder & QA Lead Flow)

| Time | Action | Visual & Architecture Highlights |
|:---:|---|---|
| **00:00 - 00:10** | **Cold Launch & Instant SQLite Load** | Launch app. Instant boot (< 350ms) into `InboxScreen`. Fictional threads populate from local Drift SQLite without network spinners. Notice the visible **`RESET DEMO`** badge in the AppBar. |
| **00:10 - 00:20** | **Swipe Triage & Reversible Undo** | Swipe left on "Weekly Sprint Planning". Thread vanishes instantly (*optimistic update*). Floating `AppSnackbar` appears with "Undo". Tap **Undo**; thread restores immediately. |
| **00:20 - 00:32** | **Spotlight Command Palette (Ctrl+K)** | Tap terminal icon in AppBar or press `Ctrl+K`. Spotlight search appears. Type `is:unread` or `has:attachment` to see instant query parsing. Tap shortcut `T` to toggle Dark/Light mode. |
| **00:32 - 00:45** | **Thread Detail & Privacy Shield** | Tap thread "Q3 Product Strategy & Roadmap". Point out the privacy shield banner: *"Remote images blocked (2) to protect your IP address"*. Tap "Summarize Thread" to see instant SSE bullet summary. |
| **00:45 - 01:05** | **AI Draft Reply with Tone Adjustment** | Tap "Draft Reply with AI". Notice the **`AI-generated`** badge. Watch streaming reply. Switch tone chip to **"Professional"**. Tap **"Use as Draft"**; compose opens with text pre-filled and an **`AI-Generated Draft (Editable)`** chip. |
| **01:05 - 01:15** | **Scheduled Send Preset** | In Compose, tap clock icon. Select **"Tomorrow Morning (8:00 AM)"**. Observe timezone code displayed (e.g., `IST` / `UTC`). |
| **01:15 - 01:25** | **Human-Approved Review Sheet & Explicit Send** | Tap paper airplane icon. The **ComposeReviewSheet** appears with sender, recipients, attachments, and the **Human-Approved Send Rule** notice. Tap **"Confirm & Send"**. Message dispatches to outbox. |
| **01:25 - 01:30** | **Clean Demo Reset** | Tap the **`RESET DEMO`** badge in the AppBar. Tap "Reset Clean". In 50ms, all demo threads, accounts, and outbox actions restore to their pristine initial state. |

---

## Step 1: Onboarding & Demo Mode

1. **Launch Screen**:
   - The app opens to the **Welcome Screen** if no account is signed in.
   - Observe the security guarantee badges: *Backend-initiated OAuth*, *Zero password access*, *Biometric encryption*.
2. **Explore Consent Explainer**:
   - Tap **"Learn how your data is protected"** to review the honest privacy notice explaining scopes and token handling.
3. **Enter Demo Mode**:
   - Tap **"Explore with Demo Account"**.
   - The app seeds 5 realistic threads across multiple senders and subjects into the local Drift SQLite database.
   - Note the visible **"DEMO" badge** in the AppBar, ensuring users and testers always know they are using fictional data.

---

## Step 2: Inbox Navigation, Triage & Multi-Select

1. **Streamed Thread List**:
   - Observe instant local database rendering with zero spinner latency.
   - Threads show unread indicators, avatars, participant lists, timestamps, snippets, and label chips (e.g. `Work`, `Personal`).
2. **Pull-to-Refresh**:
   - Pull down to trigger a delta sync via `SyncService`.
3. **Multi-Select Bulk Actions**:
   - Long-press any thread tile. Selection mode activates in the AppBar.
   - Tap **"Select All"** or tap additional items.
   - Tap **"Archive Selected"** or **"Delete Selected"**.
   - Notice the threads vanish immediately from the UI (*optimistic update*) and an Outbox action is queued.
4. **Navigation Drawer**:
   - Open the hamburger menu to switch folders: **Inbox**, **Starred**, **Archive**, **Trash**, **Spam**, or filtered by **Labels**.
   - Switch to **Starred** or **Archive** to see threads instantly filtered via Drift streams.

---

## Step 3: Thread Detail & Conversation View

1. **Open a Thread**:
   - Tap any thread in the list (e.g., "Q3 Product Strategy & Roadmap").
   - Notice the clean message cards with expandable sender details, timestamps, and rich HTML body rendering.
2. **Thread Actions**:
   - Star/unstar the thread using the star icon in the AppBar.
   - Archive or delete the thread with immediate snackbar feedback.
3. **Inline Actions**:
   - Tap **Reply**, **Reply All**, or **Forward** at the bottom of any message card.
   - Notice the app opens the Compose screen with all recipient chips, subject (`Re:` / `Fwd:`), and quoting pre-filled.

---

## Step 4: Compose, Autosave, Attachments & Final Review

1. **Open Compose**:
   - Tap the floating action button (`+ Compose`) or trigger it from a thread reply.
2. **Recipient Chips & Validation**:
   - Type an invalid email like `invalid-email` and press space/enter. Notice the chip turns red with an error tooltip.
   - Type `alex@example.com` or tap a contact autocomplete suggestion. Notice the valid chip is created.
   - Tap **Cc/Bcc** to expand secondary recipient fields.
3. **Rich Text & Formatting**:
   - Use the rich text toolbar to insert bold text, bullet lists, numbered lists, or links.
4. **Attachments & Safety Limits**:
   - Tap the attachment button.
   - Try adding a forbidden file like `malware.exe` — the app blocks it immediately with a security alert.
   - Add image/PDF attachments — size is tracked against the 25 MB limit.
5. **Autosave Drafts**:
   - Start typing. Within 1.5 seconds, the draft autosaves to the local SQLite database.
   - Back out of Compose. Tapping compose again will restore the draft or allow discarding.
6. **Schedule Send**:
   - Tap the clock icon in the AppBar.
   - Choose a preset (*Tomorrow Morning*, *Tomorrow Afternoon*, *Monday Morning*) or pick a custom date/time.
   - Notice the selected timezone code (e.g., `IST` / `UTC`) is clearly displayed.
7. **Final Review Sheet**:
   - Tap **Send** (paper airplane icon).
   - A modal review sheet appears showing:
     - Sending Account
     - Primary and CC Recipients
     - Subject
     - Attachment Count
     - Scheduled Time (if scheduled)
   - Tap **"Confirm & Send"**.
8. **Undo Send Countdown**:
   - An "Undo Send" snackbar appears with a 10-second timer and an **"Undo"** action.
   - Tapping "Undo" cancels the send and re-opens the draft for editing.

---

## Step 5: Instant Search, Operators & Command Palette

1. **Search Screen**:
   - Tap the search icon in the AppBar.
   - Type `design` to see debounced (300ms) instant local SQLite FTS matching.
   - Notice search query terms highlighted with bold yellow accents in the results.
2. **Search Operators**:
   - Type `from:sarah` to filter by sender.
   - Type `has:attachment` to show threads with attachments.
   - Type `is:unread` or `is:starred` to filter by flag.
   - Combine operators: `from:sarah is:unread`.
3. **Quick Filter Chips**:
   - Tap quick filter chips: **Unread**, **Starred**, **Has Attachment** for one-tap filtering.
4. **Recent Searches**:
   - Clear the search bar to see recent search history with an option to clear recent searches.
5. **Command Palette**:
   - Tap the command palette shortcut or icon.
   - Search for actions like *"Compose"*, *"Go to Starred"*, *"View Calendar"*, *"Settings"*.
   - Tap any command to navigate instantly.

---

## Step 6: Productivity - Snooze, Calendar & Tasks

1. **Snooze a Thread**:
   - Long press or tap snooze from a thread.
   - Select a snooze preset: *Later Today (6:00 PM)*, *Tomorrow (8:00 AM)*, *This Weekend*, or *Follow-up if no reply*.
   - The thread is archived and an exact local alarm notification is scheduled via the platform scheduler.
2. **Agenda Calendar**:
   - Open Drawer -> **Agenda Calendar**.
   - Switch between **Day View** and **Week View**.
   - Tap on an event (e.g., "Weekly Engineering Sync") to see meeting details, attendees, and one-tap **"Join Meeting"** link.
3. **Action Items & Tasks**:
   - Open Drawer -> **Tasks & Action Items**.
   - View tasks derived from email threads (e.g., "Review API pull request").
   - Toggle completion status or tap to jump directly to the originating email thread.

---

## Step 7: AI Features (Safe & Transparent Boundary)

1. **Privacy Consent Modal**:
   - Navigate to **Settings** -> **AI Assistance (Experimental)** or tap the AI icon in a thread.
   - Review the privacy notice: *Data sent is strictly limited to the current thread*, *No autonomous writes allowed*.
   - Explicitly tap **"Enable AI Features"**.
2. **Thread Summary Card**:
   - Open a thread. Tap **"AI Summary"**.
   - Watch the animated SSE-streaming summary appear with key takeaways.
3. **Draft Reply with Tones**:
   - Tap **"AI Draft Reply"**.
   - Select a tone: **Friendly**, **Shorter / Direct**, or **Formal**.
   - Tap **"Generate Draft"**.
   - Inspect the editable preview clearly labeled **"AI-Generated Draft"**.
   - Tap **"Insert into Compose"** — it opens Compose with the text pre-filled.
   - **Hard Invariant Test**: AI never sends, archives, deletes, or modifies calendar items.

---

## Step 8: Push Notifications, Settings & Data Safety

1. **Settings Screen**:
   - Navigate to Drawer -> **Settings**.
   - Review configurable swipe actions (*Swipe Left: Archive*, *Swipe Right: Trash*).
   - Configure **Default Email Signature**.
   - Toggle **Quiet Hours** (10:00 PM to 7:00 AM) to suppress non-urgent notifications.
   - Toggle **Block Remote Images** for tracking-pixel protection.
2. **Account Disconnect & Data Deletion**:
   - In Settings, scroll to the bottom and tap **"Disconnect & Delete All Local Data"**.
   - A confirmation dialog appears. Confirming wipes all local Drift SQLite tables, credentials in Secure Storage, and returns to the Welcome Screen.

---

## Verification Summary Table

| Feature Area | Live Implementation | Mocked / Simulated | What Remains for Production Backend |
|---|---|---|---|
| **Local Database (Drift)** | Fully live in-memory & SQLite disk storage with streams | None | Production schema migrations on app upgrades |
| **Sync Engine & Outbox** | Live queue with optimistic writes, retry backoff, and idempotency keys | Shelf-based mock REST API server | Real Gmail/Outlook IMAP/Graph REST backend endpoints |
| **Authentication & Tokens** | Live `FlutterSecureStorage` AES token encryption & Biometric lock | OAuth browser redirect in Demo mode | Registered Google/Microsoft Client IDs & Redirect URI App Links |
| **Compose & Drafts** | Fully live Drift autosave, validation, chips, schedule send, undo send, and review sheet | Send queue submits to local mock API | Outbound SMTP / Graph send endpoint |
| **Search & Commands** | Live Drift SQLite filtering, operator query parser, debouncer, command palette | Remote search endpoint merges dummy remote hits | Server-side Elasticsearch / Graph FTS endpoint |
| **Productivity** | Live snooze date math, agenda calendar, task list linked to threads | System notification alarms (exact alarm permissions scaffolded) | Platform native alarm notification callback registration |
| **AI Features** | Live consent state, tone prompt engine, SSE stream parsing, dictation abstraction | Simulated SSE chunk stream and mock dictation | Production Gemini / OpenAI API streaming key |
| **Release & ProGuard** | R8 rules, `build.gradle.kts`, `AndroidManifest.xml` permissions, TalkBack labels | Keystore file (generated per developer environment) | CI release upload pipeline |
