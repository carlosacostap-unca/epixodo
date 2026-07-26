## 1. Domain and Persistence

- [x] 1.1 Add due-payment types, validation, constructors, patch/status helpers, urgency classification, and sorting to the finance domain.
- [x] 1.2 Extend `WorkspaceData`, empty state, normalization, local serialization, content detection, and hydration with due payments.
- [x] 1.3 Cascade account deletion to associated due payments while preserving ledger behavior.

## 2. Workspace Operations

- [x] 2.1 Add create, edit, delete, mark-paid, and return-to-pending due-payment operations to the workspace hook.
- [x] 2.2 Expose memoized ordered due payments and pending/overdue counts from the workspace hook.

## 3. Finance Interface

- [x] 3.1 Read the relevant local Next.js 16 client-component guidance before changing the finance interface.
- [x] 3.2 Add a due-payment form with account, description, amount, due date, category, and validation feedback.
- [x] 3.3 Add a responsive payment agenda with overdue, due-today, upcoming, and paid visual states.
- [x] 3.4 Add edit, status-toggle, and confirmed deletion actions, and include due-payment count in account deletion confirmation.

## 4. Verification

- [x] 4.1 Extend finance tests for validation, urgency, ordering, status transitions, account cascade, and legacy/orphan normalization.
- [x] 4.2 Run finance and existing regression tests, lint, TypeScript, and the production build.
- [x] 4.3 Validate the OpenSpec change and confirm all tasks are complete.
