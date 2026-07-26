## 1. Finance Domain Model

- [x] 1.1 Add finance account, account type, entry, entry kind, and draft types in a dedicated finance domain module.
- [x] 1.2 Implement minor-unit amount parsing and `es-AR` currency formatting with validation for safe integers and at most two decimal places.
- [x] 1.3 Implement account and entry constructors, validators, patch helpers, reverse-chronological sorting, and account-deletion cascade behavior.
- [x] 1.4 Implement derived account balances and current-calendar-month summaries grouped by currency.

## 2. Workspace Persistence and Compatibility

- [x] 2.1 Extend `WorkspaceData` and `emptyWorkspace` with `financeAccounts` and `financeEntries`.
- [x] 2.2 Extend workspace normalization to validate finance records, reject orphaned entries, and default legacy workspaces to empty finance collections.
- [x] 2.3 Include finance collections in local serialization, remote request payloads, workspace content detection, and hydration source selection.
- [x] 2.4 Add automated codec tests covering legacy workspaces, valid finance round trips, malformed records, orphaned entries, and preservation of non-finance data.

## 3. Workspace Finance Operations

- [x] 3.1 Add hook operations to create and edit accounts while preventing currency changes on accounts that contain entries.
- [x] 3.2 Add a confirmed account deletion operation that removes the account and all assigned entries in one state update.
- [x] 3.3 Add hook operations to create, edit, and delete validated income and expense entries.
- [x] 3.4 Expose memoized balances, currency summaries, and sorted recent entries from the workspace hook.

## 4. Finance Interface

- [x] 4.1 Read the relevant local Next.js 16 guides before changing the application shell or client components.
- [x] 4.2 Add a top-level Finanzas navigation item, icon, heading copy, and finance-specific primary actions to the authenticated workspace shell.
- [x] 4.3 Build the finance overview with currency-separated monthly summary cards, account balance cards, empty states, and a recent-movements list.
- [x] 4.4 Build accessible create/edit account forms with validation, account type and currency fields, opening balance input, and protected currency editing.
- [x] 4.5 Build accessible create/edit movement forms with account, kind, date, description, positive amount, and optional category fields.
- [x] 4.6 Add entry deletion and account cascade-deletion confirmations that communicate the affected data before applying the action.
- [x] 4.7 Ensure the finance view adapts to mobile and desktop layouts while retaining the application's existing dark visual language.

## 5. Verification

- [x] 5.1 Add domain tests for amount parsing, negative opening balances, income/expense balance math, month boundaries, sorting, and multi-currency grouping.
- [x] 5.2 Add interaction coverage for account and movement CRUD, validation feedback, protected currency changes, deletion confirmations, and recalculated totals.
- [x] 5.3 Run lint, the production build, finance tests, and the existing regression test suites; resolve any failures introduced by the change.
- [x] 5.4 Manually verify local persistence, PocketBase synchronization error behavior, and legacy workspace loading in the running application.
