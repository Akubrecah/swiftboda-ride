# Architecture Decisions (DECISIONS.md)

> Permanent Architecture Decision Records (ADRs) for Swift-Boda.
> Derived from "Vibe Coding: A Complete Beginner-to-Production Guide" and `docs/ARCHITECTURE_DECISIONS.md`.

---

## ADR-001: Modular Monolith in a Structured Monorepo
- **Decision**: Adopt a Modular Monolith architecture within a Monorepo (`apps/`, `services/`, `gateway/`, `shared/`, `infra/`, `docs/`).
- **Reason**: Eliminates microservices network latency and serialization overhead at the current scale, while keeping clean domain boundaries and sharing TypeScript types seamlessly across backend and mobile.

---

## ADR-002: Primary Database and Spatial Engine (PostgreSQL + PostGIS)
- **Decision**: Deploy PostgreSQL 15+ with PostGIS 3.3 extension as the primary transactional database.
- **Reason**: Provides ACID transactional consistency for financial ledgers and trip state machines, combined with high-performance spatial indexing (`GIST`) for geofencing, polygon checks, and KNN nearest-neighbor queries.

---

## ADR-003: Real-Time Telemetry & Distributed In-Memory Cache (Redis + WebSockets)
- **Decision**: Use Redis 7 (`GEOADD`, `GEORADIUS`, Pub/Sub, distributed locks) and WebSockets for real-time driver telemetry and dispatch offers.
- **Reason**: Prevents high-frequency GPS writes (every 2-4 seconds) from exhausting database I/O, enables sub-second spatial lookups, and eliminates driver assignment race conditions via atomic locks.

---

## ADR-004: Unified API Gateway Pattern with JWT & RBAC
- **Decision**: Route all client traffic through a single Unified API Gateway (`/gateway`).
- **Reason**: Centralizes cross-cutting concerns: JWT token authentication, Argon2id password hashing, Role-Based Access Control (`RIDER`, `DRIVER`, `ADMIN`), rate limiting, request validation, and uniform error formatting.

---

## ADR-005: Financial Integrity & Multi-Channel Payments (M-Pesa + Double-Entry Ledger)
- **Decision**: Implement an append-only double-entry wallet ledger and integrate Safaricom Daraja M-Pesa STK Push with strict idempotency keys.
- **Reason**: Guarantees financial auditability, prevents double-spending or uncredited deposits, and supports automatic platform commission splits (15%) and instant driver wallet payouts.

---

## ADR-006: Expo v54 with React 19 & Expo Router v6 for Cross-Platform Mobile
- **Decision**: Use Expo v54.0.0+ with Expo Router v6 for the unified Rider & Driver mobile application.
- **Reason**: Cross-platform iOS and Android binary compilation with modern file-based routing, native gestures, smooth bottom-sheet modals, and versioned Expo SDK APIs.
