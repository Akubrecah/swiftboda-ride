# Architecture Decision Records (ADR)
## Swift Boda Production-Grade Ride-Hailing Platform

This document captures all foundational architectural decisions, rationale, trade-offs, and consequences for the Swift Boda ecosystem.

---

### ADR-001: Monorepo Structure & Modular Monolith Transition

- **Date:** September 17, 2026
- **Status:** Accepted
- **Context:**
  The system requires coordination between multiple client applications (Rider Mobile, Driver Mobile, Admin Operations Web) and diverse domain services (Auth, Location, Matching, Trips, Pricing, Payments, Safety, Notifications). We must avoid premature microservice distribution overhead while ensuring strict domain isolation and clean service interfaces.
- **Alternatives Considered:**
  1. *Fully distributed multi-repo microservices*: High operational complexity, deployment friction, complex contract versioning at early stage.
  2. *Unstructured monolithic repo*: High risk of tight coupling, cyclic dependencies, and inability to scale individual components.
  3. *Modular Monolith with shared packages in a structured Monorepo*: High development velocity, shared types/utilities, clear domain boundaries, independently deployable when scale demands.
- **Chosen Solution:**
  Adopt a **Modular Monolith architecture within a Monorepo** (`apps/`, `services/`, `packages/`, `infra/`, `docs/`). Domain boundaries are strictly enforced via clear service contracts and interfaces.
- **Consequences:**
  - Fast iterative development and shared TypeScript types between backend and clients.
  - Zero network overhead for inter-domain queries during Phase 2–4.
  - Services can be extracted into standalone containers/microservices cleanly when specific domains experience asymmetric scaling.

---

### ADR-002: Primary Database and Spatial Engine (PostgreSQL + PostGIS)

- **Date:** September 17, 2026
- **Status:** Accepted
- **Context:**
  Ride-hailing requires ACID transactional consistency for bookings, payments, and driver state transitions, combined with high-performance geospatial queries (KNN nearest neighbor, geofencing, polygon intersections).
- **Alternatives Considered:**
  1. *MongoDB with 2dsphere indexes*: Lacks strict relational constraints, weak multi-entity transactional guarantees for double-entry financial ledgers.
  2. *MySQL Spatial*: Inferior spatial indexing and analytical query capabilities compared to PostGIS.
  3. *PostgreSQL 15+ with PostGIS 3.3*: Industry standard for geospatial platforms (Uber, Bolt), robust spatial indexing (`GIST`), full ACID compliance, row-level locking.
- **Chosen Solution:**
  Deploy **PostgreSQL 15 with the PostGIS 3.3 extension** as the authoritative source of truth.
- **Consequences:**
  - Native spatial queries via `ST_DWithin`, `ST_Distance`, and `ST_MakePoint`.
  - Strong transactional guarantees for trip completion, wallet debit/credits, and state machine transitions.
  - Requires migration management with version-controlled schema definitions.

---

### ADR-003: Real-Time Telemetry and Distributed In-Memory Cache (Redis + WebSockets)

- **Date:** September 17, 2026
- **Status:** Accepted
- **Context:**
  Driver location pings occur every 2–4 seconds per active driver. Writing high-frequency raw GPS pings directly into PostgreSQL would exhaust I/O and lock row buffers. Furthermore, dispatch concurrency requires atomic locking to prevent two riders from claiming the same driver.
- **Alternatives Considered:**
  1. *Direct database polling over HTTP REST*: High latency, high database CPU usage, sluggish mobile battery drain.
  2. *Kafka + PostGIS stream*: Overkill for initial deployments; introduces operational complexity.
  3. *Redis 7 (Geospatial GEOADD/GEORADIUS + Pub/Sub + Distributed Locks) + Socket.IO/WebSockets*: Ultra-low latency, O(log(N)) spatial queries, built-in lock primitives (`SET NX EX`).
- **Chosen Solution:**
  Use **Redis 7** for active driver coordinates, availability status, distributed locks during dispatch matching, rate limiting, and session caching. Use **WebSocket / Socket.IO** for bi-directional real-time telemetry streaming to mobile clients.
- **Consequences:**
  - High-frequency GPS updates stay in memory; periodic batched persistence flushes historical breadcrumbs to PostgreSQL.
  - Distributed locks eliminate dispatch race conditions.
  - WebSockets provide instantaneous offer delivery and live driver map tracking.

---

### ADR-004: Strict Trip State Machine & Idempotent Transitions

- **Date:** September 17, 2026
- **Status:** Accepted
- **Context:**
  Trip lifecycles are vulnerable to duplicate network requests, network drops, out-of-order packet delivery, and conflicting client actions (e.g. rider cancels while driver accepts).
- **Alternatives Considered:**
  1. *Loose status updates via REST PUT*: Prone to invalid transitions (e.g. going from `REQUESTED` directly to `COMPLETED`), non-deterministic financial states.
  2. *Strict Formal State Machine with Transition Guards and Idempotency Keys*: Explicit transition matrix, role authorization check per transition, atomic state updates wrapped in DB transactions.
- **Chosen Solution:**
  Implement a formal server-side **Trip State Machine** with mandatory idempotency key verification, role authorization validation, and transactional event publishing.
- **Consequences:**
  - Disallowed transitions fail with deterministic HTTP 400 errors.
  - Replayed network requests return the cached result without executing side effects.
  - Complete audit trail of all state changes with timestamps and actors.

---

### ADR-005: Payment Abstraction Layer & Kenya Financial Readiness (M-Pesa + Card + Wallet)

- **Date:** September 17, 2026
- **Status:** Accepted
- **Context:**
  Operating in East Africa (Kenya) requires native support for Safaricom M-Pesa (STK Push, B2C Driver Payouts), combined with international credit/debit card processing and an in-app stored value wallet.
- **Alternatives Considered:**
  1. *Tightly couple Safaricom Daraja API in trip completion handlers*: Hard to test, prevents adding card providers or alternative regional payment methods.
  2. *Pluggable PaymentProvider Interface with Adapters*: Universal interface supporting `authorize()`, `capture()`, `refund()`, `payout()`, `verifyWebhook()`, and double-entry ledger bookkeeping.
- **Chosen Solution:**
  Implement a **Pluggable Payment Provider Interface** with adapters for M-Pesa Daraja (STK Push, C2B, B2C payouts), Card tokenization, and an immutable double-entry Wallet Ledger.
- **Consequences:**
  - Clear separation between ride completion and payment capture.
  - Multi-currency support configured natively for `KES` (Kenyan Shilling) and `Africa/Nairobi` timezone.
  - Secure webhook signature verification and replay protection.
