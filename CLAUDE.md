# Carramica Development Guide

## Mission

Your mission is to modernize the Carramica application by migrating the technology stack while preserving all existing business functionality.

This project is already running correctly and is considered production-ready.

The objective is to improve the architecture and user interface without changing how the application behaves.

---

# Documentation

Before making any changes, you MUST read these documents in the following order:

1. docs/01-project-overview.md
2. docs/02-current-architecture.md
3. docs/03-coding-standards.md
4. docs/04-firebase-rules.md
5. docs/05-nextjs-migration.md
6. docs/06-development-rules.md
7. docs/07-testing-checklist.md
8. docs/08-done-definition.md
9. docs/09-ui-design-system.md
<!-- 10. docs/10-ui-components.md -->

These documents define the project requirements and must be followed throughout the migration.

---

# Critical Rules

The current application is stable.

The existing business logic has already been tested.

Do NOT change:

- Business logic
- User workflow
- Firebase behavior
- Firestore schema
- Storage structure
- Authentication flow
- Validation rules
- Calculations
- Existing APIs

unless I explicitly approve the change.

---

# Primary Goals

The migration includes:

- React → Next.js (App Router)
- JavaScript → TypeScript
- Bootstrap → Tailwind CSS
- Create reusable UI components
- Modernize the UI
- Improve maintainability
- Improve performance without changing behavior

---

# Scope

You are allowed to change:

- UI
- Layout
- Styling
- Folder structure
- File organization
- Component organization
- TypeScript typing
- Project architecture

You are NOT allowed to change:

- Business logic
- User flows
- Existing features
- Firebase behavior

without approval.

---

# Refactoring Policy

If you discover code that is:

- duplicated
- inefficient
- outdated
- difficult to maintain
- poorly structured

DO NOT refactor immediately.

Instead:

1. Explain the issue.
2. Explain why it should be improved.
3. Explain the risks.
4. Suggest the solution.
5. Wait for my approval.

---

# Migration Strategy

Never migrate the whole application at once.

Always migrate one feature at a time.

Example:

Authentication
→ Verify

Dashboard
→ Verify

Categories
→ Verify

Products
→ Verify

Orders
→ Verify

Continue only after the previous feature is fully working.

---

# Verification

After each completed feature verify:

- Routing
- Authentication
- Firebase
- Firestore
- Storage
- Forms
- UI
- Responsive layout

before continuing.

---

# Communication

If you are uncertain,

STOP.

Explain the situation.

Ask for approval.

Never make assumptions.

---

# Success Criteria

The migration is complete only if:

- The application behaves exactly the same.
- All existing features work.
- Bootstrap has been completely removed.
- Tailwind CSS is used consistently.
- Next.js App Router is fully implemented.
- TypeScript compiles without errors.
- The project builds successfully.
- The UI follows the Carramica Design System.

# Working Rules

Never migrate more than one feature.

Never edit files unrelated to the current feature.

Never perform project-wide refactoring.

Never rename files unless explicitly approved.

Never replace libraries unless explicitly approved.

Always keep the application runnable.

Always commit after each completed feature.