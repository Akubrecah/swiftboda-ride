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
- [x] **TASK-009**: Implement authentication & pilot logins (Rider, Driver, Admin).
- [x] **TASK-010**: Implement Role-Based Access Control (`RIDER`, `DRIVER`, `ADMIN`, `DISPATCHER`).
- [x] **TASK-011**: Add request validation schemas and live Serply Google Maps integration.
- [x] **TASK-012**: Integrate WebSocket server (ws) & HTTP fallback for bi-directional rider/driver/admin telemetry.

---

## Phase 4: Location Service & Redis Spatial Caching
- [x] **TASK-013**: Ingest driver telemetry with live coordinates, heading, speed, and status.
- [x] **TASK-014**: Implement driver heartbeat updater and live driver registry.
- [x] **TASK-015**: Deliver real-time online fleet discovery on mobile map.

---

## Phase 5: Matching Engine & Trip Lifecycle
- [x] **TASK-016**: Implement atomic driver assignment and offer distribution.
- [x] **TASK-017**: Build trip state machine with transition guard tables (`SEARCHING_DRIVER → DRIVER_ASSIGNED → DRIVER_ARRIVED → IN_TRIP → COMPLETED`).
- [x] **TASK-018**: Enforce 4-digit Ride PIN verification before trip state changes to `IN_TRIP`.
- [x] **TASK-019**: Implement cancel trip workflow with cancellation broadcast.

---

## Phase 6: Financial Ledger, Wallets & M-Pesa
- [x] **TASK-020**: Build wallet ledger with atomic transactions and balance constraints.
- [x] **TASK-021**: Implement M-Pesa STK Push integration with callback verification and idempotency.
- [x] **TASK-022**: Calculate automated platform commission (15%) and driver payout allocation.

---

## Phase 7: Mobile App (React Native / Expo v54) Integration
- [x] **TASK-023**: Connect `SwiftBodaContext` in `/app` to live Gateway API via `RealtimeSyncClient`.
- [x] **TASK-024**: Subscribe rider & driver clients to live WebSocket trip state transitions and driver coordinates.
- [x] **TASK-025**: Implement complete UI states: loading skeletons, network retry banners, and empty history screens.
- [x] **TASK-026**: Test responsive layouts on mobile viewports (iOS & Android).

---

## Phase 8: Operations & Admin Console (`/apps/admin-dashboard` & In-App Admin)
- [x] **TASK-027**: Connect Admin console to live `/api/v1/admin/live-state` endpoint with real-time sync.
- [x] **TASK-028**: Add interactive geospatial map with live driver markers and active trip routes.
- [x] **TASK-029**: Add driver document approval workflow and fleet management controls.
- [x] **TASK-030**: Integrate live SOS Panic alert panel with audible notification and emergency dispatch.

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
