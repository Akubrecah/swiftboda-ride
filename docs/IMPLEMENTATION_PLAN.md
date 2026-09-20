# Swift Boda - Comprehensive Master Implementation Plan

> **Plan Scope:** End-to-End Execution Roadmap for a Production-Grade Ride-Hailing Platform  
> **Standard:** Complete Lifecycle — Architecture, Persistence, Realtime, Dispatch, Payments, Safety, Admin & Operations

---

## Phase Breakdown & Milestones

### Phase 1: Discovery & Architecture Assessment (Completed)
- [x] Audit existing mobile app, admin dashboard, backend gateway, and mock services.
- [x] Document project state, gaps, and technical debt in `docs/PROJECT_STATE.md`.
- [x] Record foundational architectural decisions in `docs/ARCHITECTURE_DECISIONS.md`.
- [x] Formulate master execution plan in `docs/IMPLEMENTATION_PLAN.md`.

---

### Phase 2: Foundational Infrastructure, Database & Security
- [ ] **Database & Migrations Engine:**
  - Configure PostgreSQL 15 + PostGIS 3.3 migrations (Prisma / Drizzle or typed SQL migration suite).
  - Implement full schema for Users, Drivers, Vehicles, Trips, Fares, Payments, Wallets, Ratings, Incidents, Audit Logs.
  - Setup spatial GIST indexes and foreign key cascades.
- [ ] **Redis In-Memory Layer:**
  - Setup Redis connection pooling with reconnection resiliency.
  - Implement geospatial index (`GEOADD`, `GEORADIUSBYMEMBER`) for live driver tracking.
  - Setup distributed lock helper (`acquireLock`, `releaseLock`) for atomic dispatch.
- [ ] **Authentication & RBAC:**
  - Argon2id password hashing + phone OTP verification service.
  - Short-lived JWT access tokens + rotating refresh tokens.
  - Role-Based Access Control middleware (`RIDER`, `DRIVER`, `ADMIN`, `OPERATIONS_MANAGER`, `SUPPORT_AGENT`).
  - Rate limiting middleware backed by Redis sliding window.

---

### Phase 3: Core Ride Lifecycle & Dispatch Engine
- [ ] **Real-Time WebSocket Gateway:**
  - Implement WebSocket / Socket.IO server on API Gateway with JWT handshake authentication.
  - Channel subscription architecture (`user:{id}`, `trip:{id}`, `driver:telemetry`).
- [ ] **Driver Telemetry & Heartbeat:**
  - High-frequency GPS ping ingestion endpoint (`lat`, `lon`, `heading`, `speed`, `accuracy`).
  - Redis geospatial index update + driver heartbeat expiration handling (mark offline if >15s without ping).
- [ ] **Production Dispatch Engine:**
  - Implement multi-candidate ranking algorithm (Distance 50%, Rating 30%, Acceptance Rate 20%).
  - Distributed lock on candidate driver to prevent double-matching.
  - Timed driver offer lifecycle with 15-second countdown and automatic escalation.
- [ ] **Formal Trip State Machine:**
  - Implement explicit transition matrix: `REQUESTED` → `SEARCHING_DRIVER` → `DRIVER_ASSIGNED` → `DRIVER_ARRIVED` → `IN_TRIP` → `COMPLETED` / `CANCELLED`.
  - Server-side 4-digit Ride PIN verification guard before transitioning to `IN_TRIP`.
  - Transactional audit log recording for every status transition.

---

### Phase 4: Dynamic Pricing, Geocoding & Kenya Currency Localization
- [ ] **Pricing Engine:**
  - Configurable fare formula: `Base Fare + (Distance * perKm) + (Duration * perMin) + Booking Fee + Surge - Promo`.
  - Native currency configuration for KES (Kenyan Shilling) with localized formatting.
  - Dynamic surge pricing based on real-time neighborhood demand/supply ratios.
- [ ] **Map & Routing Provider Abstraction:**
  - Pluggable `MapsProvider` interface (`geocode`, `reverseGeocode`, `route`, `matrix`).
  - Integration with real routing providers (OSRM / Mapbox / Google Maps) with fallback caching.

---

### Phase 5: Payment Processing & Financial Accounting
- [ ] **Payment Provider Abstraction Layer:**
  - Universal `PaymentProvider` interface (`authorize`, `capture`, `refund`, `payout`, `verifyWebhook`).
  - Kenya M-Pesa Daraja API adapter (STK Push for riders, B2C payouts for drivers).
  - Card payment adapter with tokenization (Stripe / Flutterwave / Paystack).
- [ ] **Double-Entry Wallet & Driver Earnings:**
  - Immutable wallet ledger with debit/credit entries for trip fares, platform commissions (15%), and driver payouts.
  - Idempotency key tracking on all financial mutations to prevent duplicate debits.

---

### Phase 6: Safety Center, Ratings & Communications
- [ ] **Emergency SOS System:**
  - Instant panic alert button publishing high-priority events to operations console.
  - Emergency contact notification integration (SMS via Africa's Talking / Twilio).
- [ ] **Two-Way Ratings & Reviews:**
  - Post-trip rating submission (1-5 stars + feedback tags) with weighted rolling average updates.
- [ ] **In-App Messaging & Notifications:**
  - Trip-scoped real-time chat between rider and driver over WebSockets.
  - Asynchronous notification queue for push and SMS alerts.

---

### Phase 7: Real Applications Integration (Mobile & Admin)
- [ ] **Rider & Driver Mobile App (`/app`):**
  - Connect `SwiftBodaContext` to real backend APIs and WebSocket streams.
  - Replace mock timers with live server events (`trip:status_change`, `driver:location_update`).
  - Implement real device GPS location tracking and Expo permissions.
- [ ] **Operations & Admin Console (`/apps/admin-dashboard`):**
  - Live operations map rendering active drivers and trips on Leaflet / MapLibre.
  - Real-time driver approval, document inspection, and manual trip intervention.
  - Financial reporting and analytics charts fed by real database aggregations.

---

### Phase 8: Verification, Automated Testing & Containerization
- [ ] Comprehensive unit tests for pricing, matching, state transitions, and ledger.
- [ ] End-to-end integration tests validating the full ride lifecycle.
- [ ] Docker Compose environment verification (`postgres + postgis`, `redis`, `gateway`, `admin`).
