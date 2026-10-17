# Project Brief: Inbox Companion
**A Privacy-First, Offline-Reliable Productivity & Email Companion**  
*Independent Engineering Concept Prototype*

---

## 🧭 1. The Problem
Modern mobile email clients are caught between two bad extremes:
1. **Legacy Sluggishness:** Bloated native or hybrid apps that block on network spinners, drop drafts when connections fail, and crash or desync during background task switches.
2. **Reckless AI Integrations:** Novel "AI-first" clients that grant autonomous language models unconstrained write access to send emails and manipulate calendars, or transmit unredacted corporate mailboxes to third-party model providers without security boundaries or prompt injection defenses.

Knowledge workers and security-conscious executives want **instant speed, offline resilience, and intelligent assistance**—without surrendering data privacy, security boundaries, or human control.

---

## 💡 2. The Architectural Approach
**Inbox Companion** was engineered from first principles around three non-negotiable architectural tenets:

1. **Drift (SQLite) as the Absolute Source of Truth:**
   The presentation layer never waits on a network response. All threads, messages, drafts, labels, tasks, and agendas are streamed reactively from local SQLite database queries. UI transitions complete in under 16ms (60 FPS), with cold boot times under 350ms.
2. **Reliable Outbox with Optimistic State & Reversible Rollbacks:**
   Every user action (archive, trash, star, label, compose) writes optimistically to local SQLite and queues an operation in an outbox queue with a cryptographically unique `Idempotency-Key`. A 5-second floating undo window allows instant rollback before background sync occurs. If a server permanently rejects an action, the client automatically rolls back to the previous state.
3. **Hard AI Security Boundaries & Human-in-the-Loop Send:**
   The AI service operates strictly in an advisory capacity. It possesses **zero autonomous mutation privileges**: it cannot send mail, delete data, or mutate calendars. All email content analyzed by LLMs is encapsulated in `<untrusted_email_body>` XML tags to neutralize indirect prompt injection attacks. Every outgoing message requires an explicit tap on a verified review sheet.

---

## 🛠 3. What Was Built (Full Stack Implementation)

### Flutter Client (Production-Hardened Mobile/Desktop App)
- **Design System:** Original Material 3 component library (Royal Iris & Aurora Teal palette) strictly enforcing 48dp minimum touch targets and 200% text scale accessibility.
- **Offline Database:** Drift SQLite schema with tables for accounts, threads, messages, labels, outbox entries, drafts, reminders, tasks, and calendar events.
- **Network Stack:** Custom Dio pipeline with single-flight mutex token refresh, UUIDv7 idempotency injection, exponential backoff with jitter, and RFC 7807 error mapping.
- **Productivity & Search:** FTS5 full-text query parser supporting operators (`from:`, `is:unread`, `has:attachment`), spotlight command palette (`Ctrl+K`), and DST-safe reminder date math.
- **Security & Privacy:** Hardware-backed credential storage via `flutter_secure_storage`, remote image & tracking pixel blocking by default, and automated PII log scrubbing.

### Backend Monolith (NestJS / TypeScript)
- **Database & Migrations:** 21 relational tables with PostgreSQL Row-Level Security (RLS) policies enforcing multi-tenant isolation, GIN full-text search indexes, and pgvector embeddings.
- **KMS Envelope Encryption:** OAuth refresh tokens encrypted with per-record AES-256-GCM data encryption keys wrapped by KMS master keys.
- **Provider Adapters:** Normalized `MailProvider` abstraction with isolated `GmailAdapter` and `GraphAdapter` producing unified models.
- **Send Safety & ClamAV:** SHA-256 payload review hash verification, delayed cancelable send jobs (undo send), exactly-once outbox deduplication, and ClamAV antivirus file scanning.
- **Testing & Quality Gates:** 205 automated tests passing 100% (98 client + 107 server), zero ESLint warnings, and zero Flutter analyzer warnings.

---

## 🚀 4. What We Would Build Next (With a Full Engineering Team)
1. **Google CASA Tier 2 & Microsoft Partner Verification:** Complete third-party cloud security assessments to enable production OAuth client IDs for live Gmail and Microsoft 365 accounts.
2. **Multi-Region Distributed Sync Workers:** Deploy horizontally scaled BullMQ worker clusters with Redis streams to process incoming Google Pub/Sub and Microsoft Graph webhooks with sub-second push delivery.
3. **End-to-End PGP & S/MIME Signing:** Integrate client-side OpenPGP hardware key signing for zero-knowledge enterprise email encryption.
4. **On-Device SLM (Small Language Model) Inference:** Run thread summarization and tone adjustments locally using Google Mediapipe / ONNX runtime, achieving 100% on-device AI with zero cloud transmission.

---

## ⚖️ 5. Legal & Independent Prototype Disclaimer
> **DISCLAIMER:**  
> **Inbox Companion** is an independent, original research and engineering prototype created solely for technical demonstration and architecture evaluation. It is not affiliated with, endorsed by, sponsored by, or associated with Google LLC, Microsoft Corporation, Apple Inc., or any other company. All trademarks, service marks, and trade names referenced herein are the property of their respective owners.
