## Context

Epixodo is a Next.js 16 client-heavy personal workspace. The authenticated page renders one task manager shell, while `useTaskWorkspace` owns the complete workspace state and debounces writes to both local storage and a PocketBase-backed `/api/workspace` endpoint. PocketBase stores that state as JSON in one workspace record, and `normalizeWorkspaceData` is the compatibility boundary for older or malformed data.

The finance capability crosses the domain model, codec, persistence lifecycle, hook operations, navigation, and UI. It must preserve existing users' task data and avoid presenting misleading totals when accounts use different currencies.

## Goals / Non-Goals

**Goals:**

- Add a clear top-level finance destination without disrupting the existing task views.
- Model accounts and income/expense entries with deterministic balance calculations.
- Support negative opening and current balances while requiring movement amounts to be positive.
- Keep finance data in the existing local-first, remotely synchronized workspace.
- Normalize absent or malformed finance data safely.
- Present account balances and aggregate totals in the user's Spanish-language interface.

**Non-Goals:**

- Bank connections, automatic imports, statement reconciliation, recurring movements, budgets, transfers, attachments, or shared accounts.
- Exchange rates or conversion into a single base currency.
- Accounting-grade ledgers, tax reporting, or immutable audit history.
- Per-category analytics beyond recording and displaying an optional category.

## Decisions

### Store monetary values as integer minor units

`FinanceAccount.openingBalanceMinor` and `FinanceEntry.amountMinor` will be safe integers. UI parsing accepts at most two decimal places and converts values to minor units; formatting uses the account's currency and the `es-AR` locale. Entry amounts are always greater than zero, while opening balances may be negative.

This avoids floating-point drift in balance calculations and JSON serialization issues associated with `bigint`. Decimal strings were considered, but they would require parsing at every calculation boundary and make validation less direct. The initial two-decimal constraint is appropriate for the expected ARS/USD-style personal use; supporting currencies with other minor-unit scales remains future work.

### Keep accounts and entries as separate workspace collections

`WorkspaceData` will gain:

- `financeAccounts: FinanceAccount[]`
- `financeEntries: FinanceEntry[]`

An account contains `id`, `name`, `type`, `currency`, `openingBalanceMinor`, and timestamps. An entry contains `id`, `accountId`, `kind` (`income` or `expense`), `date`, `description`, `amountMinor`, optional `category`, and timestamps.

Separating entries from accounts keeps the ledger append/edit operations simple and lets normalization reject orphaned entries. Embedding entries inside accounts was considered, but it complicates updates, sorting across accounts, and migration.

### Calculate balances instead of persisting derived totals

Current account balance is:

`openingBalanceMinor + incomeMinor - expenseMinor`

Overview totals are produced by summing account balances and period income/expenses separately for each currency. No derived balance is persisted, preventing stale or contradictory state after an entry is edited or deleted.

### Make destructive and currency-changing operations explicit

Deleting an account requires confirmation and removes its associated entries in the same state update. Changing an account's currency is rejected while that account has entries, because silently reinterpreting their amounts would corrupt meaning. Other account fields, including opening balance, remain editable.

Blocking account deletion entirely was considered, but a confirmed cascade matches the application's current subject-deletion behavior and allows users to remove test or obsolete data.

### Extend the existing compatibility boundary

`normalizeWorkspaceData` will normalize missing `financeAccounts` and `financeEntries` to empty arrays, validate supported account types, ISO-like three-letter uppercase currency codes, safe-integer amounts, valid dates, and non-empty descriptions/names, then remove entries whose account no longer exists. Local persistence, remote requests, hydration content detection, and `emptyWorkspace` will include both collections.

No PocketBase schema change is required because the collection already stores arbitrary workspace JSON in its `data` field.

### Isolate finance UI and domain logic

Finance types, constructors, validators, sorting, and calculation helpers will live in a dedicated finance domain module rather than expanding the task domain module. A dedicated finance view component will receive data and actions from the workspace hook. The existing shell will add `finances` to its view key, navigation label, icon, header copy, and conditional content.

The overview will include:

- Balance cards for each account.
- Currency-grouped totals that never combine unlike currencies.
- Income and expense totals for the current calendar month, grouped by currency.
- A reverse-chronological recent-movements list with account context.
- Forms/modals for accounts and entries, including edit and delete actions.

## Risks / Trade-offs

- **[Two-decimal monetary scale excludes some currencies]** → Validate the constraint in the UI and domain layer, document it through tests, and leave the data model open to a future explicit scale migration.
- **[A confirmed account deletion cascades to entries]** → Show the number of affected movements in the confirmation and perform one atomic React state update.
- **[One large workspace document grows with every movement]** → This first release targets lightweight personal tracking; keep helpers linear and revisit dedicated PocketBase collections and pagination if data volume becomes material.
- **[Last-write-wins synchronization can overwrite concurrent edits]** → Preserve the current application sync semantics; multi-device conflict resolution is outside this change.
- **[Editing an opening balance rewrites historical meaning]** → Label the field clearly and keep it available for correction; immutable ledger adjustments are outside the MVP.

## Migration Plan

1. Deploy codec and domain changes that accept both legacy workspaces without finance fields and new finance-enabled workspaces.
2. Extend local/remote serialization and hydration checks.
3. Enable hook actions and the finance interface.
4. Verify that loading and saving a legacy workspace preserves all existing task data and adds empty finance collections.

Rollback can remove the finance interface and hook actions while leaving the additional JSON fields in persisted workspaces. Older code ignores those fields; a later redeploy can recover them.

## Open Questions

None for the initial implementation. Transfers, recurring entries, account archiving, category management, and broader currency-scale support are intentionally deferred.
