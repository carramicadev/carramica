# Development Rules

## Core Principle

This application is already running in production.

The existing business logic has been tested and is considered stable.

The purpose of this project is NOT to rewrite the application.

The purpose is ONLY to:

- migrate React to Next.js
- migrate JavaScript to TypeScript
- replace Bootstrap with Tailwind CSS
- improve project structure
- improve maintainability
- improve performance where it does not affect behavior

The application must continue to behave exactly as it does today.

---

# Golden Rules

Business logic is the highest priority.

UI is the second priority.

Code style is the third priority.

Never sacrifice business logic for cleaner code.

---

# Never Change Business Logic

Do NOT modify:

- business rules
- calculations
- validation logic
- Firebase queries
- Firestore collections
- Storage structure
- Authentication flow
- User permissions
- Order flow
- Product flow
- Category flow
- Existing APIs
- Existing database schema

Unless explicitly approved by me.

---

# Preserve Existing Behavior

Every feature must continue working exactly as before.

The user experience may improve.

The visual appearance may improve.

Performance may improve.

However, the functionality must remain identical.

---

# Allowed Changes

You may:

- migrate React to Next.js
- migrate JavaScript to TypeScript
- replace Bootstrap with Tailwind CSS
- create reusable components
- split large components
- reorganize folders
- improve naming
- improve readability
- remove duplicated code
- improve type safety
- improve performance

ONLY IF functionality remains exactly the same.

---

# Before Refactoring

If you find code that is:

- duplicated
- difficult to read
- poorly structured
- inefficient
- outdated
- inconsistent

DO NOT refactor immediately.

Instead:

1. Explain the issue.
2. Explain why it should be improved.
3. Explain the risks.
4. Suggest the new implementation.
5. Wait for my approval.

Only proceed after I approve.

---

# Before Deleting Code

Never delete code immediately.

First:

- verify it is unused
- search the entire repository
- explain why it can be removed
- wait for approval

---

# Performance Improvements

Performance improvements are welcome.

Examples:

- memoization
- lazy loading
- dynamic imports
- image optimization
- reducing unnecessary renders

However,

they must NEVER change application behavior.

---

# UI Redesign

The interface may be redesigned completely.

Bootstrap must be removed.

Tailwind CSS must be used.

Shadcn UI should be used whenever appropriate.

The redesign should follow:

docs/09-ui-design-system.md

The new UI must preserve:

- workflows
- user interactions
- navigation
- business processes

Only the visual layer should change.

---

# Migration Strategy

Migrate feature by feature.

For every feature:

1. Analyze
2. Migrate
3. Test
4. Verify behavior
5. Continue

Never migrate the whole application in one step.

---

# Communication

Whenever you are unsure:

STOP.

Ask me first.

Never assume.

---

# End of Every Phase

At the end of every phase provide:

## Completed

- files migrated
- components migrated
- pages migrated

## Verified

- routing
- Firebase
- authentication
- forms

## Potential Improvements

List any code that could be improved.

Do NOT implement these improvements.

Only recommend them.

Wait for my approval.

---

# Final Objective

When the migration is complete:

The application should look completely modern.

The technology stack should be modern.

The codebase should be easier to maintain.

But the application should behave exactly the same as before.

If an existing user uses the new application without seeing the code, they should notice only:

- a better design
- better performance

They should NOT notice any change in functionality.


# Scope Control

Never migrate more than one feature at a time.

Example:

✅ Authentication

→ Test

✅ Categories

→ Test

✅ Products

→ Test

❌ Do not migrate the entire application in a single step.

Every completed feature must be fully functional before moving to the next one.