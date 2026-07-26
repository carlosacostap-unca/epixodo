## Why

The application currently helps organize work but provides no place to record day-to-day personal finances. Adding a lightweight finance area lets each authenticated user keep income, expenses, and account balances alongside the rest of their personal workspace without introducing a separate system.

## What Changes

- Add a top-level **Finanzas** option to the authenticated workspace navigation.
- Let users create, edit, and delete financial accounts with a name, type, currency, and opening balance.
- Let users create, edit, and delete income and expense entries assigned to an account, with a date, description, amount, and optional category.
- Show each account's current balance, calculated from its opening balance and recorded entries.
- Show an overview with totals grouped by currency and a recent-movements list.
- Persist and normalize finance data through the existing local and PocketBase workspace synchronization flow.
- Preserve existing workspaces that do not yet contain finance data by normalizing missing finance collections to empty arrays.

## Capabilities

### New Capabilities

- `personal-finance-tracking`: Manage financial accounts and income/expense entries, and derive current balances and currency-grouped summaries.

### Modified Capabilities

None.

## Impact

- Extends the shared `WorkspaceData` model and its normalization, local persistence, remote synchronization, and content-detection logic.
- Adds finance domain helpers and workspace hook operations for account and entry lifecycle management.
- Adds a finance view and forms to the existing authenticated React interface and navigation.
- Requires regression coverage for finance calculations, malformed persisted data, account deletion behavior, and legacy workspace compatibility.
- Does not require a new PocketBase collection because finance data remains inside the existing per-user workspace document.
