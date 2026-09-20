# Development Rules (RULES.md)

> Project AI rulebook for Swift-Boda ride-hailing and logistics platform.
> Based on "Vibe Coding: A Complete Beginner-to-Production Guide".

---

## 1. General Principles
- **TypeScript**: Strict TypeScript across all apps (`/app`, `/apps/admin-dashboard`) and services (`/gateway`, `/services/*`, `/shared`).
- **Expo v54**: Expo has changed. Refer to exact versioned documentation at `https://docs.expo.dev/versions/v54.0.0/`.
- **Clean Code**: Keep functions small, modular, and single-purpose. Avoid duplicated logic.
- **Component Reuse**: Reuse existing UI primitives in `components/` and utility functions in `shared/utils`.
- **Targeted Edits**: Never touch or modify unrelated files.

---

## 2. Before Writing Code (Context First)
Before making any changes:
1. Read relevant project documentation in `docs/`: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `DECISIONS.md`, `MEMORY.md`, `TEST_PLAN.md`, `SECURITY.md`.
2. Inspect existing implementations in `shared/types`, `services/`, and `app/`.
3. Check the active task in `TASKS.md` and ensure the change is broken into a small vertical slice.
4. If a task is complex or architectural, make a concrete implementation plan first.

---

## 3. UI & Experience Requirements
- **Follow `DESIGN.md`**: Respect defined colors, typography, border radiuses, and layout tokens.
- **Mandatory States**: Every interactive screen and component must provide:
  - **Loading State**: Visual spinner, skeleton loader, or disabled action state.
  - **Error State**: User-friendly feedback with retry actions.
  - **Empty State**: Clear placeholder message and prompt when data collections are empty.
- **Mobile Responsive**: Test and format for mobile viewports (375px), tablets (768px), and web/admin consoles (1440px).

---

## 4. Architecture & Data Flow
- **Separation of Concerns**:
  - React Native / web UI components must **never** contain direct database queries or raw SQL.
  - Client state communicates with the backend via the Unified Gateway (`/gateway`).
  - Business logic, pricing formulas, and ride matching belong in dedicated services (`/services/*`).
  - Shared domain interfaces, contracts, and geo math belong in `/shared`.
- **Server-Side Authorization**: Always verify JWT tokens, user identities, and role permissions server-side. Never trust client claims.

---

## 5. Security & Financial Integrity
- **Zero Secrets**: Never hardcode API keys, JWT secrets, database URIs, or credentials. Use `.env.example` to declare keys and `.env.local` for local execution.
- **4-Digit Ride PIN**: Driver cannot initiate a trip without server-side validation of the rider's 4-digit ride PIN.
- **SOS Panic Telemetry**: Emergency SOS events must immediately log coordinates, broadcast to operations, and notify emergency contacts.
- **Financial Mutations**: All wallet debits, credits, and M-Pesa transactions must enforce idempotency keys and ledger balance validation.
- **Input Validation**: Validate all request payloads, query parameters, and telemetry data.

---

## 6. Testing & Quality Gate
- After implementing any feature, execute:
  1. TypeScript verification: `npm run typecheck` (or `tsc --noEmit`)
  2. Lint checks: `npm run lint`
  3. Unit and integration tests: `npm test`
- Do not consider a task complete without verification through execution.
- If an error occurs, follow the **5-Question AI Debugging Framework**:
  1. What is failing?
  2. Why is it failing?
  3. Which file is responsible?
  4. What is the smallest fix?
  5. How will we test the fix?

---

## 7. Mandatory Implementation Completion Report
Every implementation response must conclude with:
1. **Files Changed**: List of modified/created files.
2. **What Was Implemented**: Summary of changes and vertical slice completed.
3. **Tests Executed**: Commands run and output verified.
4. **Remaining Issues / Next Step**: Unblocked next task in `TASKS.md`.

---

## 8. Git Discipline
- Keep commits small, atomic, and focused on a single feature or fix.
- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Use feature branches (`feature/...`, `fix/...`) for non-trivial tasks.
