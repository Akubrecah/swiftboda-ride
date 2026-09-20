---
name: documentation-templates
description: Documentation templates and structure guidelines. README, API docs, code comments, and AI-friendly documentation.
when_to_use: "When writing README files, API documentation, code comments, or generating AI-friendly documentation."
allowed-tools: Read, Glob, Grep
version: 1.0.0
---

# Documentation Templates

> Templates and structure guidelines for common documentation types.

---

## 1. README Structure

### Essential Sections (Priority Order)

| Section | Purpose |
|---------|---------|
| **Title + One-liner** | What is this? |
| **Quick Start** | Running in <5 min |
| **Features** | What can I do? |
| **Configuration** | How to customize |
| **API Reference** | Link to detailed docs |
| **Contributing** | How to help |
| **License** | Legal |

### README Template

```markdown
# Project Name

Brief one-line description.

## Quick Start

[Minimum steps to run]

## Features

- Feature 1
- Feature 2

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |

## Documentation

- [API Reference](./docs/api.md)
- [Architecture](./docs/architecture.md)

## License

MIT
```

---

## 2. API Documentation Structure

### Per-Endpoint Template

```markdown
## GET /users/:id

Get a user by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**
- 200: User object
- 404: User not found

**Example:**
[Request and response example]
```

---

## 3. Code Comment Guidelines

### JSDoc/TSDoc Template

```typescript
/**
 * Brief description of what the function does.
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws ErrorType - When this error occurs
 * 
 * @example
 * const result = functionName(input);
 */
```

### When to Comment

| ✅ Comment | ❌ Don't Comment |
|-----------|-----------------|
| Why (business logic) | What (obvious) |
| Complex algorithms | Every line |
| Non-obvious behavior | Self-explanatory code |
| API contracts | Implementation details |

---

## 4. Changelog Template (Keep a Changelog)

```markdown
# Changelog

## [Unreleased]
### Added
- New feature

## [1.0.0] - 2025-01-01
### Added
- Initial release
### Changed
- Updated dependency
### Fixed
- Bug fix
```

---

## 5. Architecture Decision Record (ADR)

```markdown
# ADR-001: [Title]

## Status
Accepted / Deprecated / Superseded

## Context
Why are we making this decision?

## Decision
What did we decide?

## Consequences
What are the trade-offs?
```

---

## 6. AI-Friendly Documentation

### llms.txt Template

For AI crawlers and agents:

```markdown
# Project Name
> One-line objective.

## Core Files
- [src/index.ts]: Main entry
- [src/api/]: API routes
- [docs/]: Documentation

## Key Concepts
- Concept 1: Brief explanation
- Concept 2: Brief explanation
```

### MCP-Ready Documentation

For RAG indexing:
- Clear H1-H3 hierarchy
- JSON/YAML examples for data structures
- Mermaid diagrams for flows
- Self-contained sections

---

## 7. Structure Principles

| Principle | Why |
|-----------|-----|
| **Scannable** | Headers, lists, tables |
| **Examples first** | Show, don't just tell |
| **Progressive detail** | Simple → Complex |
| **Up to date** | Outdated = misleading |

---

## 8. Vibe Coding Project Context Suite (10 Standard Files)

Standard context files defined in *Vibe Coding: A Complete Beginner-to-Production Guide*:

### 1. `PRD.md` (Product Requirements Document)
```markdown
# Product Requirements Document

## Product
[Product Name]

## Problem
[Core problem user faces]

## Target Users
[Primary user personas]

## Goal
[Measurable outcome]

## Core Features
1. Feature A
2. Feature B

## MVP Scope
- In-scope item 1
- In-scope item 2

## Out of Scope
- Excluded feature 1
- Excluded feature 2

## Success Criteria
1. User can accomplish primary flow
```

### 2. `ARCHITECTURE.md`
```markdown
# Architecture

## Stack
- Frontend: [Framework + Language]
- Styling: [CSS / Tailwind / Native]
- Backend: [API / Serverless / Microservices]
- Database: [PostgreSQL / Redis / SQLite]
- Auth: [Provider]
- Deployment: [Hosting / Platform]

## Data Flow
Client UI → Gateway / API → Services → Database

## Architectural Boundaries
- UI components must never contain direct DB queries.
- Business logic resides in services.
- Server-side authorization check on every mutation.
```

### 3. `RULES.md`
```markdown
# Development Rules
- TypeScript: strict typing, no `any`.
- Keep functions small and modular.
- UI must handle: loading, error, empty, and responsive states.
- Zero secrets in code or git.
- Test every feature before completing.
```

### 4. `TASKS.md`
```markdown
# Tasks

## Phase 1: Setup & Core
- [x] TASK-001: Project initialization
- [ ] TASK-002: Vertical slice A

## Phase 2: Feature Slices
- [ ] TASK-003: Vertical slice B
```

### 5. `DECISIONS.md`
```markdown
# Architecture Decisions
## ADR-001: Choice of Database
- Decision: Use Supabase PostgreSQL.
- Reason: Managed relational schema with built-in auth and real-time triggers.
```

### 6. `MEMORY.md`
```markdown
# Project Memory
## Current Status
[Active phase or feature]
## Completed
- Item 1
## Active Task
TASK-002
## Known Issues
- Issue description
## Next Step
Implement next vertical slice.
```

### 7. `TEST_PLAN.md`
```markdown
# Test Plan
## Core Features
- [ ] Flow 1 succeeds
- [ ] Invalid input triggers error
## Viewports
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1440px)
```

### 8. `SECURITY.md`
```markdown
# Security Requirements
- Auth: Protected routes require valid JWT.
- Authorization: Object-level access control.
- Secrets: No hardcoded credentials.
- Sanitization: Validate all input parameters.
```

---

> **Remember:** Templates are starting points. Adapt to your project's needs.
