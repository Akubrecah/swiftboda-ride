---
name: vibe-coding
description: Production-grade Vibe Coding methodology from beginner to scale. 9-step professional loop (READ, UNDERSTAND, PLAN, IMPLEMENT, TEST, REVIEW, FIX, COMMIT, UPDATE DOCUMENTATION), vertical slices, 6-part prompt templates, 4-part completion reporting, 5-question AI debugging, and pre-deployment verification.
when_to_use: "When starting a new feature, planning an MVP, writing prompts for AI, debugging regressions, preparing for preview/production deployment, or maintaining project documentation."
allowed-tools: Read, Glob, Grep, RunCommand, Write, Edit
version: 1.0.0
---

# Vibe Coding: Beginner to Production Skill

> Complete engineering methodology for AI-assisted development, based on "Vibe Coding: A Complete Beginner-to-Production Guide".

---

## 1. The Complete Vibe Coding Workflow

Never skip directly from `IDEA → AI → DEPLOY`. Follow the full disciplined pipeline:

```
IDEA
  ↓
RESEARCH (Users, alternatives, APIs, feasibility)
  ↓
DEFINE THE USER (Personas, core problem, MVP vs Out-of-scope)
  ↓
PRD (docs/PRD.md: What & Why)
  ↓
CHOOSE TECH STACK (Language, framework, database, auth, hosting)
  ↓
ARCHITECTURE (docs/ARCHITECTURE.md: Boundaries & data flow)
  ↓
DESIGN (DESIGN.md: Tokens, colors, typography, states)
  ↓
PROJECT RULES (RULES.md: How AI must code)
  ↓
TASK BREAKDOWN (TASKS.md: Sized, phased backlog)
  ↓
SETUP (Git, environment, .env.example, tooling)
  ↓
DEVELOPMENT (Vertical slices, one feature at a time)
  ↓
TESTING (Typecheck, lint, unit, integration, E2E)
  ↓
SECURITY REVIEW (docs/SECURITY.md: Auth, secrets, input sanitization)
  ↓
CODE REVIEW (Diff inspection, hallucination check, edge cases)
  ↓
PREVIEW DEPLOYMENT (Staging/preview environment)
  ↓
QA TESTING (Live tests: auth, reload, edge cases, mobile)
  ↓
PRODUCTION DEPLOY (Versioned release)
  ↓
MONITORING (Errors, analytics, performance, uptime)
  ↓
ITERATION (Update MEMORY.md & TASKS.md)
```

---

## 2. The 9-Step Professional Feature Loop

For **every single task or feature**, execute this loop sequentially:

| Step | Action | Key Verification |
| :--- | :--- | :--- |
| **1. READ** | Read project context files | PRD, ARCHITECTURE, DESIGN, RULES, TASKS, MEMORY |
| **2. UNDERSTAND** | Understand user requirement & scope | What problem? What acceptance criteria? What constraints? |
| **3. PLAN** | Outline small, concrete steps | Vertical slice breakdown; no broad architectural deviations |
| **4. IMPLEMENT** | Write code | Clean, modular, type-safe; no unrelated file edits |
| **5. TEST** | Execute automated verification | Typecheck, lint, unit/integration tests |
| **6. REVIEW** | Inspect generated code | Review diff, check dependencies, verify security |
| **7. FIX** | Resolve any issues immediately | Follow the 5-question debugging framework |
| **8. COMMIT** | Atomic git commit | Descriptive conventional commit message |
| **9. UPDATE DOCS** | Synchronize state | Update TASKS.md checkbox, MEMORY.md current state |

---

## 3. Project Context Documentation Standards

A production repository must maintain these 10 core context files:

| File | Purpose | Stage |
| :--- | :--- | :--- |
| `docs/PRD.md` | What are we building & why? Problem, personas, MVP, out-of-scope | Planning |
| `docs/ARCHITECTURE.md` | How does the system work? Stack, boundaries, data flow diagrams | Planning |
| `DESIGN.md` | How should it look and feel? Colors, typography, radiuses, states | Planning |
| `RULES.md` | How should AI code? Project-specific rules & constraints | Planning |
| `TASKS.md` | What should we build next? Phased backlog with checkboxes | Development |
| `DECISIONS.md` | Why was an architectural decision made? Permanent ADR log | Development |
| `MEMORY.md` | What is the active state? Completed items, active task, known issues | Development |
| `TEST_PLAN.md` | How do we verify it? Acceptance checklist across 375/768/1440px | Testing |
| `SECURITY.md` | How do we protect data? Auth, RBAC, secret isolation, sanitization | Development |
| `.env.example` | What keys are required? Keys without secrets committed to Git | Setup |

---

## 4. Vertical Slices & Sizing Rules

### The Golden Slicing Rule
- **Bad**: Building all UI mockups first, or building the entire database layer first.
- **Good**: Building complete vertical slices one at a time.

```
Vertical Slice Example:
[UI Trigger / Form] 
       ↓ 
[Client Action / Hook] 
       ↓ 
[Gateway / API Route] 
       ↓ 
[Service / Business Logic] 
       ↓ 
[Database Mutation] 
       ↓ 
[State Feedback & UI Update]
```

### Task Sizing
- **Bad**: "Build the ride matching and payment system."
- **Better**: "Implement ride request dispatch."
- **Best**: "Create the ride request confirmation dialog with loading, error, and timeout states. Connect to existing dispatch mutation. Do not modify payment service."

---

## 5. The 6-Part Structured Prompt Template

When giving instructions to AI or delegating to subagents, format prompts with:

```markdown
CONTEXT:
[Briefly describe project state and relevant documentation to read]

TASK:
[Single, specific vertical slice to implement]

FILES:
[Relevant file paths to inspect and modify]

CONSTRAINTS:
- Follow existing architecture in ARCHITECTURE.md
- Reuse existing components in components/
- Do not modify unrelated files
- Strict TypeScript only

ACCEPTANCE CRITERIA:
- User can trigger action
- Loading state is displayed during async operations
- Errors display user-friendly message
- Database records updated accurately

TESTING:
- Add tests for edge cases
- Run typecheck, lint, and relevant unit tests
```

---

## 6. Mandatory 4-Part Completion Report

Every implementation response must conclude with:

```markdown
### 1. Files Changed
- `path/to/file1.ts` (Modified: added validation)
- `path/to/file2.tsx` (New: loading skeleton)

### 2. What Was Implemented
- Concise summary of feature vertical slice and state handling.

### 3. Tests Executed
- `npm run typecheck` (PASSED)
- `npm run lint` (PASSED)
- `npm test -- services/matching.test.ts` (3 tests passed)

### 4. Remaining Issues / Next Step
- Next unblocked item in TASKS.md: TASK-005.
```

---

## 7. Systematic AI Debugging (5 Questions)

When debugging any error or test failure, answer:
1. **What is failing?** (Exact error message, stack trace, or unexpected behavior)
2. **Why is it failing?** (Underlying root cause mechanism)
3. **Which file is responsible?** (Exact file and line number range)
4. **What is the smallest fix?** (Minimal surgical change without side effects)
5. **How will we test the fix?** (Specific test case or command to prove resolution)

---

## 8. Pre-Deployment Verification Checklist

Before shipping to preview or production, verify all 4 pillars:

### 1. Functionality
- [ ] Authentication flows (signup, login, logout, password recovery)
- [ ] Core business workflows end-to-end
- [ ] Form submission, validation, and error feedback
- [ ] Loading states (spinners/skeletons) on all async triggers
- [ ] Empty states on all collections/tables

### 2. UI & Responsiveness
- [ ] Mobile viewport verified (375px)
- [ ] Tablet viewport verified (768px)
- [ ] Desktop viewport verified (1440px)
- [ ] Accessibility: keyboard navigation and touch target sizes (≥ 44px)

### 3. Security
- [ ] Zero secrets in source code or Git history
- [ ] All required secrets declared in `.env.example`
- [ ] Server-side authentication and role-based access control (RBAC) enforced
- [ ] User input, API payloads, and file uploads validated

### 4. Code & Build
- [ ] TypeScript check passes with zero errors
- [ ] Linter passes with zero warnings/errors
- [ ] Test suite passes
- [ ] Production build completes successfully (`npm run build` or `eas build`)

---

## 9. Live QA Testing Protocol (Post-Deploy)

Never assume localhost is identical to production. Test the live preview/production URL:
- **Refresh**: Refresh pages in the middle of active states and verify recovery.
- **Direct URLs**: Navigate directly to nested URLs while logged in and logged out.
- **Logged-out Access**: Verify protected routes properly redirect.
- **Invalid Inputs**: Submit malformed payloads and verify safe error presentation.
- **Slow Network**: Throttle network to 3G and verify loaders don't freeze.
- **Empty Database**: Verify UI displays clean empty states, not blank crashes.
