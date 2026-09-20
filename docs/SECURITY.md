# Security Requirements (SECURITY.md)

> Production security architecture and rules for Swift-Boda.
> Derived from "Vibe Coding: A Complete Beginner-to-Production Guide" Step 15 & 38.

---

## 1. Authentication & Token Management
- **Password Hashing**: Store passwords using Argon2id with salt. Never use raw MD5 or SHA-256.
- **JWT Architecture**:
  - Access tokens have short TTL (15 minutes).
  - Refresh tokens have 7-day TTL and are stored securely with rotation on use.
  - Revocation list managed in Redis for immediate session termination upon logout or compromise.
- **Biometric & OTP**: Mobile apps support biometrics (FaceID/Fingerprint) and SMS OTP verification via rate-limited gateways.

---

## 2. Server-Side Authorization & RBAC
- **Strict Role Boundaries**:
  - `RIDER`: Can only view and mutate their own trips, profile, and wallet.
  - `DRIVER`: Can only view assigned trips, vehicle records, and driver earnings.
  - `DISPATCHER`: Can manage active dispatches and view live vehicle telemetry.
  - `ADMIN`: Full access to user management, financial ledgers, and system configurations.
- **Object-Level Access Control**: Server must explicitly verify resource ownership (`WHERE user_id = :authenticated_user_id`) on all database queries.

---

## 3. Secrets Isolation & Environment Management
- **Zero Secrets in Code or Git**:
  - No API keys, JWT secrets, database connection strings, or M-Pesa passkeys committed to source control.
  - All required configuration variables must be declared with descriptions in `.env.example`.
  - Secret scanning must run in CI/CD before any merge.

---

## 4. Financial & Payment Integrity
- **Double-Entry Ledger**: All wallet transactions must have balancing debit and credit entries.
- **Idempotency Keys**: All payment mutations (e.g. M-Pesa STK Push, wallet payouts, trip charge) must require a unique client-generated UUID idempotency key to prevent double charges.
- **Signature Verification**: Validate webhook signatures on all external payment callbacks (e.g. Safaricom Daraja callback verification).

---

## 5. Safety Protocols & Anti-Fraud
- **4-Digit Ride PIN**: Trip cannot enter `IN_PROGRESS` without cryptographic or server-validated verification of the rider's secret 4-digit PIN.
- **Location Spoofing Prevention**: Cross-verify driver speed and coordinate plausibility (reject teleports exceeding reasonable vehicle speeds).
- **Emergency SOS Encryption**: SOS telemetry and emergency contact data encrypted in transit and at rest.

---

## 6. Input Validation & API Protection
- **Request Schemas**: All incoming request bodies, headers, and query parameters validated via strict schemas (e.g. Zod).
- **SQL Injection Prevention**: Parameterized queries via ORM / query builder. Raw string concatenation in SQL queries is strictly prohibited.
- **Rate Limiting**:
  - Auth endpoints: Maximum 5 attempts per IP / minute.
  - Telemetry endpoints: Token-bucket rate limiting per authenticated device.
  - Payment endpoints: Maximum 3 requests per user / minute.

---

## 7. File Upload Safety (Driver Documents & Vehicle Photos)
- Validate MIME type against allowlist (`image/jpeg`, `image/png`, `application/pdf`).
- Enforce strict size limits (maximum 5MB per document).
- Sanitize filenames and generate server-side random UUID storage keys.
- Store uploaded documents in private cloud storage buckets with time-limited signed URLs.
