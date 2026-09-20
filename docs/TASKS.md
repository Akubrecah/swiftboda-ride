# Project Tasks (TASKS.md)

> Phased, vertical-slice task backlog for Swift-Boda.
> Derived from "Vibe Coding: A Complete Beginner-to-Production Guide" and `docs/PROJECT_STATE.md`.

---

## Current Status
- **Active Phase**: Phase 2 — Database & ORM Persistence
- **Current Task**: `TASK-005` (PostgreSQL / Prisma Schema Migration)

---

## Phase 1: Baseline Architecture & Tooling Setup
- [x] **TASK-001**: Audit repository and establish baseline project state (`docs/PROJECT_STATE.md`).
- [x] **TASK-002**: Standardize environment configuration template (`.env.example`).
- [x] **TASK-003**: Establish Vibe Coding Global Rules and project rulebook (`RULES.md`, `AGENTS.md`).
- [x] **TASK-004**: Author and register production `vibe-coding` skill and context documentation templates.

---

## Phase 2: Database & ORM Persistence Layer
- [ ] **TASK-005**: Initialize ORM (Prisma / Drizzle) with PostgreSQL and PostGIS spatial extensions.
- [ ] **TASK-006**: Migrate core schemas: `User`, `Driver`, `Vehicle`, `Trip`, `Wallet`, `PaymentTransaction`, `SafetyIncident`.
- [ ] **TASK-007**: Seed development database with verified Nairobi coordinates and test driver profiles.
- [ ] **TASK-008**: Write database connection pooling, retry logic, and health-check queries.

---

## Phase 3: Unified Gateway & Authentication Layer
- [ ] **TASK-009**: Implement JWT authentication middleware with Argon2id password hashing and refresh tokens.
- [ ] **TASK-010**: Implement Role-Based Access Control (`RIDER`, `DRIVER`, `ADMIN`, `DISPATCHER`).
- [ ] **TASK-011**: Add request validation schemas (Zod) and rate limiting on all auth/trip routes.
- [ ] **TASK-012**: Integrate WebSocket server (ws / Socket.io) for bi-directional rider/driver telemetry.

---

## Phase 4: Location Service & Redis Spatial Caching
- [ ] **TASK-013**: Connect `services/location-service` to Redis with `GEOADD` and `GEORADIUS`.
- [ ] **TASK-014**: Implement driver heartbeat updater and stale driver timeout detector (15s inactivity).
- [ ] **TASK-015**: Replace in-memory mock map with live Redis spatial queries.

---

## Phase 5: Matching Engine & Trip Lifecycle
- [ ] **TASK-016**: Implement distributed locking (`Redlock`) on driver assignment to prevent race conditions.
- [ ] **TASK-017**: Build trip state machine with transition guard tables (`REQUESTED → OFFERED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`).
- [ ] **TASK-018**: Enforce 4-digit Ride PIN verification before trip state changes to `IN_PROGRESS`.
- [ ] **TASK-019**: Implement cancel trip workflow with cancellation fee assessment.

---

## Phase 6: Financial Ledger, Wallets & M-Pesa
- [ ] **TASK-020**: Build double-entry wallet ledger with atomic transactions and balance constraints.
- [ ] **TASK-021**: Implement M-Pesa STK Push integration with callback verification and idempotency keys.
- [ ] **TASK-022**: Calculate automated platform commission (15%) and driver payout allocation.

---

## Phase 7: Mobile App (React Native / Expo v54) Integration
- [ ] **TASK-023**: Connect `SwiftBodaContext` in `/app` to live Gateway API via authenticated HTTP client.
- [ ] **TASK-024**: Subscribe rider client to live WebSocket trip state transitions and driver coordinates.
- [ ] **TASK-025**: Implement complete UI states: loading skeletons, network retry banners, and empty history screens.
- [ ] **TASK-026**: Test responsive layouts on 375px mobile viewports (iOS & Android).

---

## Phase 8: Operations & Admin Console (`/apps/admin-dashboard`)
- [ ] **TASK-027**: Connect Admin console to live `/api/v1/admin/telemetry` endpoint with JWT authentication.
- [ ] **TASK-028**: Add interactive geospatial map with live driver markers and active trip routes.
- [ ] **TASK-029**: Add driver document approval workflow and fleet management controls.
- [ ] **TASK-030**: Integrate live SOS Panic alert panel with audible notification and emergency dispatch.

---

## Phase 9: Testing & Pre-Deployment Verification
- [ ] **TASK-031**: Write unit tests for pricing formulas, geo distance math, and matching scores.
- [ ] **TASK-032**: Write integration tests for trip lifecycle and wallet debit/credit transactions.
- [ ] **TASK-033**: Execute pre-deployment 4-pillar verification checklist (Functionality, UI, Security, Code).

---

## Phase 10: Production Deployment & Monitoring
- [ ] **TASK-034**: Deploy Gateway and microservices to preview/staging environment.
- [ ] **TASK-035**: Execute Live QA testing protocol on preview deployment.
- [ ] **TASK-036**: Configure Sentry error tracking, Prometheus/Grafana metrics, and automated DB backups.
- [ ] **TASK-037**: Production deployment release (`eas build` for Android/iOS, containerized backend deploy).
