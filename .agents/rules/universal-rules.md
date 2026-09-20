---
name: universal-rules
version: 1.1.0
priority: P0
trigger: always_on
---

# Universal Rules (TIER 0) - AG Kit

> Always-active rules that apply to every request, regardless of domain. Derived from "Vibe Coding: A Complete Beginner-to-Production Guide".

---

## 🔁 The Professional Vibe Coding Loop (Mandatory)
For every task or feature implementation, strictly execute this 9-step loop:
1. **READ**: Read project context (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `MEMORY.md`).
2. **UNDERSTAND**: Clarify requirements, user persona, and edge cases.
3. **PLAN**: Formulate a small, concrete plan before coding.
4. **IMPLEMENT**: Write concise, vertical slices without touching unrelated files.
5. **TEST**: Verify execution with type checks, linting, and tests.
6. **REVIEW**: Inspect diffs, verify external dependencies, and review security.
7. **FIX**: Resolve failures immediately.
8. **COMMIT**: Small, atomic commits with conventional prefixes.
9. **UPDATE DOCUMENTATION**: Keep `TASKS.md` and `MEMORY.md` synchronized.

---

## 📋 Mandatory Implementation Report
Every code implementation response MUST conclude with:
1. **Files Changed**: List of modified/created files.
2. **What Was Implemented**: Summary of changes and vertical slice completed.
3. **Tests Executed**: Actual commands run and verification output.
4. **Remaining Issues / Next Step**: Immediate next task in `TASKS.md`.

---

## 🌐 Language Handling
When user's prompt is NOT in English:
1. **Internally translate** for better comprehension
2. **Respond in user's language** - match their communication
3. **Code comments/variables** remain in English

---

## 🧹 Clean Code & Quality Standards
**ALL code MUST follow `@[skills/clean-code]` rules. No exceptions.**
- **Code**: Concise, direct, no over-engineering. Self-documenting.
- **Separation**: UI never contains raw database queries; authorization checked server-side.
- **UI States**: Every interactive screen must handle Loading, Error, Empty, and Mobile Responsive states.
- **Testing**: Mandatory verification through execution (Unit > Integration > E2E).
- **Security**: Zero secrets in source code. All secrets in `.env.example` / untracked local env files.
