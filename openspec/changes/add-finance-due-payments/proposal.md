## Why

The finance area records completed income and expenses but does not help the user remember future obligations. Adding due payments makes upcoming commitments visible before they affect an account balance.

## What Changes

- Let users create, edit, and delete payments due with an account, description, positive amount, due date, and optional category.
- Show pending payments ordered by due date with overdue, due-today, and upcoming visual states.
- Let users mark a payment as paid or return it to pending while retaining it as history.
- Keep due payments separate from finance entries so a planned payment does not affect account balances before it is actually recorded as an expense.
- Persist and normalize due payments through the existing workspace synchronization flow.

## Capabilities

### New Capabilities

- `finance-due-payments`: Track upcoming financial obligations and their pending/paid state without changing ledger balances.

### Modified Capabilities

None.

## Impact

- Extends the finance domain and `WorkspaceData` with a due-payment collection.
- Extends workspace normalization, local persistence, remote synchronization, and hydration content detection.
- Adds due-payment operations to the workspace hook and a dedicated section and form in the finance view.
- Extends finance tests with date ordering, status transitions, validation, and legacy compatibility.
