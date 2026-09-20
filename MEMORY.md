# Project Memory (MEMORY.md)

> Project state tracking for Swift-Boda.
> Derived from "Vibe Coding: A Complete Beginner-to-Production Guide" Step 13 & 38.

---

## Current Status
- **Phase**: Phase 2 — Database & ORM Persistence Layer
- **Environment**: Local Development & Container Setup
- **Architecture**: Modular Monolith with Expo v54 Mobile Client, Node.js Gateway, and In-Memory Services transitioning to PostgreSQL + Redis.

---

## Completed
- [x] Comprehensive repository audit and baseline analysis (`docs/PROJECT_STATE.md`).
- [x] Product Requirements Document finalized (`docs/PRD.md`).
- [x] Architecture specifications and decision records (`docs/ARCHITECTURE.md`, `DECISIONS.md`).
- [x] Design token system established (`DESIGN.md`).
- [x] Global Vibe Coding Rules and project AI rulebook active (`RULES.md`, `AGENTS.md`).
- [x] Dedicated `vibe-coding` skill installed and registered.
- [x] Standardized `.env.example` created with all configuration keys.
- [x] Foundational domain types (`shared/types`) and geo calculations (`shared/utils/geo.ts`).
- [x] Docker Compose stack configured for PostgreSQL and Redis (`infra/docker-compose.yml`).

---

## Active Task
- **`TASK-005`**: Initialize ORM (Prisma / Drizzle) with PostgreSQL schema and PostGIS spatial extensions.

---

## Known Issues & Technical Debt
1. **In-Memory Backend**: Gateway and services currently use in-memory JavaScript `Map` structures; state is lost on process restart.
2. **Decoupled Mobile App**: React Native client (`app/(tabs)`) runs on local mock timers without live Gateway API or WebSocket integration.
3. **Missing Auth Enforcement**: Endpoints accept mock client IDs without JWT or RBAC verification.
4. **Matching Concurrency**: Driver assignment lacks distributed locking; vulnerable to duplicate dispatches under simultaneous requests.

---

## Next Steps
1. Execute `TASK-005` & `TASK-006`: Implement Prisma/PostgreSQL schema migration and database connection module.
2. Connect `location-service` to Redis for live geohash queries.
3. Add JWT authentication middleware and Zod request validation to the Unified Gateway.
4. Wire mobile app `SwiftBodaContext` to live backend endpoints.
