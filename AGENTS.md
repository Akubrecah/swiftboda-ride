# Expo HAS CHANGED & Vibe Coding Project Rules

## 1. Expo Documentation Rule
Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## 2. Vibe Coding AI Operational Rules
Before modifying any files:
1. **Read Project Context**: Inspect `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `DECISIONS.md`, and `MEMORY.md`.
2. **Follow the 9-Step Professional Loop**: `READ → UNDERSTAND → PLAN → IMPLEMENT → TEST → REVIEW → FIX → COMMIT → UPDATE DOCUMENTATION`.
3. **Vertical Slices**: Deliver small, end-to-end user journeys rather than disconnected horizontal layers.
4. **Mandatory Report**: Always end implementation responses with:
   - Files Changed
   - What Was Implemented
   - Tests Executed
   - Remaining Issues / Next Step
5. **Quality & Security**:
   - Zero hardcoded secrets (check `.env.example`).
   - Server-side authorization verification.
   - UI must handle Loading, Error, Empty, and Mobile Responsive states.
   - Execute type checks, linter, and tests to verify changes before declaring victory.
