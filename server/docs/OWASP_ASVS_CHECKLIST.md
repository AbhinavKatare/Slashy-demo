# OWASP ASVS 4.0 Level 2 Verification Checklist: Inbox Companion

This document tracks the application of the OWASP Application Security Verification Standard (ASVS 4.0) Level 2 controls implemented in **Inbox Companion**.

---

## V1: Architecture, Design and Threat Modeling
- [x] **1.1.1 Secure Architecture**: Modular monolith structure isolating authentication, cryptographic key management, email provider dispatch, and AI processing.
- [x] **1.1.2 Least Privilege**: OAuth tokens request minimum read-only scopes by default; incremental authorization required before requesting modify/send scopes.
- [x] **1.1.5 Component Boundaries**: Untrusted email data boundary (`<untrusted_email_content>`) isolates external content from AI reasoning and command prompts.
- [x] **1.2.1 Threat Modeling**: STRIDE threat model documented in [`THREAT_MODEL.md`](./THREAT_MODEL.md).

---

## V2: Authentication
- [x] **2.1.1 Passwordless Auth**: Application never touches, stores, or transmits mailbox passwords. Authenticates via OIDC / OAuth 2.0 with system browser and deep links.
- [x] **2.1.8 Token Rotation**: Refresh token rotation with family tracking detects and revokes compromised tokens upon replay.
- [x] **2.7.1 PKCE Enforcement**: Authorization Code flow strictly uses PKCE with SHA-256 (`S256`) code challenge and verifier verification.
- [x] **2.8.1 CSRF State Validation**: OAuth state parameter signed with HMAC-SHA256 and verified with nonces on callback.

---

## V3: Session Management
- [x] **3.1.1 Session Storage**: Session IDs stored in HTTP-only, Secure, SameSite=Lax cookies or Authorization Bearer header.
- [x] **3.2.1 Session Revocation**: Disconnect endpoint immediately revokes provider tokens and purges active sessions.
- [x] **3.3.1 Session Expiration**: Short-lived access tokens (15m) and bounded refresh sessions (30d max inactivity).

---

## V4: Access Control
- [x] **4.1.1 Row-Level Security (RLS)**: PostgreSQL RLS enabled across all user data tables (`threads`, `messages`, `drafts`, `tasks`, `calendar_events`).
- [x] **4.1.2 Tenant Isolation**: Database sessions set `app.current_user_id`; users cannot access foreign records even if IDs are guessed.

---

## V5: Malicious Input Handling & Injection Defense
- [x] **5.1.1 Parameterized Queries**: All SQL queries execute via parameterized placeholders `$1, $2, ...` through `pg`. Zero raw string concatenation.
- [x] **5.2.1 Output Validation**: AI output sanitized to prevent HTML/script injection in email drafts.
- [x] **5.3.1 ClamAV Antivirus**: File uploads scanned for malware signatures, PE/ELF executables, and EICAR strings.

---

## V6: Cryptography & Key Management
- [x] **6.2.1 Envelope Encryption**: Per-record 256-bit Data Encryption Keys (DEKs) wrapped by KMS Key Encryption Key (KEK).
- [x] **6.2.2 Zero Token Logging**: Cryptographic secrets and plaintext tokens zeroed from memory buffers (`buf.fill(0)`) and redacted from application logs.
- [x] **6.4.1 Secret Isolation**: OAuth client secrets and master encryption keys read strictly from environment / AWS Secrets Manager; never committed to code.

---

## V8: Data Protection & Privacy (GDPR/CCPA)
- [x] **8.1.1 Right to Erasure**: Complete cascading account purge endpoint `DELETE /v1/users/me` wipes all relational tables and vector embeddings.
- [x] **8.1.2 Data Portability**: `GET /v1/users/me/export` produces complete JSON export bundle.
- [x] **8.2.1 Zero Model Training**: AI provider configured with zero data retention headers. No customer data used for training.

---

## V10: Malicious Code Search & CI Quality Gates
- [x] **10.1.1 Secret Scanning**: GitHub Actions workflow scans for committed secrets and API keys.
- [x] **10.2.1 SAST Analysis**: ESLint security rules, strict TypeScript (`strict: true`), zero linter warnings enforced.
