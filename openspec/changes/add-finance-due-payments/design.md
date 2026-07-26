## Context

The finance workspace currently stores accounts and completed ledger entries. Balances are derived only from those entries. Future obligations need their own lifecycle so they can be visible before payment without prematurely changing an account balance.

## Goals / Non-Goals

**Goals:**

- Track a payment description, account/currency context, positive amount, due date, optional category, and pending/paid state.
- Surface urgency through deterministic overdue, due-today, and upcoming states.
- Preserve legacy workspaces and discard malformed or orphaned payments safely.
- Keep the finance overview responsive and consistent with its ledger visual language.

**Non-Goals:**

- Recurrence, notifications, partial payments, installments, automatic bank debits, or automatic expense creation.
- Changing account balances when a payment is merely planned or marked paid.

## Decisions

### Store due payments separately from ledger entries

`WorkspaceData` gains `financeDuePayments: FinanceDuePayment[]`. A payment references an account and stores `description`, `amountMinor`, `dueDate`, `category`, `status`, `paidAt`, and timestamps. Reusing finance entries was rejected because future expenses would incorrectly reduce current balances.

### Keep paid history

Marking a payment paid changes status and records `paidAt`; marking it pending clears `paidAt`. The payment remains visible in a collapsed/secondary paid group and may be edited or deleted. Automatic expense creation is deferred to avoid hidden balance changes and double counting.

### Derive urgency from local date-only values

Pending payments compare `dueDate` with the workspace `today`: earlier is overdue, equal is due today, and later is upcoming. Pending items sort by due date ascending; paid items follow, most recently paid first.

### Extend existing account lifecycle and compatibility boundary

Deleting an account also removes its due payments in the same atomic update. Workspace normalization defaults missing collections to an empty array, validates dates, amounts, status and timestamps, and rejects payments referencing missing accounts.

## Risks / Trade-offs

- **[Marked paid does not create an expense]** → Label the action and explanatory copy clearly so users know balances only change through ledger entries.
- **[Deleting an account removes scheduled payments]** → Existing account deletion confirmation already reports affected financial data and will include scheduled-payment count.
- **[No reminders outside the app]** → Keep overdue and due-today items visually prominent; notifications remain future work.

## Migration Plan

Deploy normalization before or with UI support. Existing workspaces receive an empty `financeDuePayments` collection. Rollback leaves an ignored JSON field that a later redeploy can restore.

## Open Questions

None for this initial release.
