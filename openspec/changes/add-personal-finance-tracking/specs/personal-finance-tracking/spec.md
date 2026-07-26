## ADDED Requirements

### Requirement: Finance navigation
The system SHALL provide authenticated users with a top-level Finanzas destination in the existing workspace navigation.

#### Scenario: Open finance area
- **WHEN** an authenticated user selects Finanzas
- **THEN** the system displays the finance overview without navigating away from the authenticated workspace

### Requirement: Financial account management
The system SHALL allow a user to create and edit financial accounts with a non-empty name, an account type, a three-letter currency code, and an opening balance with at most two decimal places.

#### Scenario: Create an account
- **WHEN** the user submits valid account details
- **THEN** the system creates the account and displays it in the finance overview

#### Scenario: Reject invalid account details
- **WHEN** the user submits an empty name, invalid currency code, or opening balance with more than two decimal places
- **THEN** the system does not create the account and identifies the invalid input

#### Scenario: Protect the currency of an account with movements
- **WHEN** the user attempts to change the currency of an account that has one or more entries
- **THEN** the system rejects the currency change while preserving the account and its entries

### Requirement: Income and expense entry management
The system SHALL allow a user to create and edit an income or expense entry assigned to an existing account with a valid date, non-empty description, positive amount with at most two decimal places, and optional category.

#### Scenario: Record income
- **WHEN** the user submits a valid income entry
- **THEN** the system stores the entry under the selected account and includes its amount positively in that account's balance

#### Scenario: Record expense
- **WHEN** the user submits a valid expense entry
- **THEN** the system stores the entry under the selected account and subtracts its amount from that account's balance

#### Scenario: Reject a non-positive movement
- **WHEN** the user submits an entry whose amount is zero or negative
- **THEN** the system does not create or update the entry and identifies the amount as invalid

#### Scenario: Edit a movement
- **WHEN** the user changes valid fields of an existing entry
- **THEN** the system stores the changes and recalculates all affected balances and summaries

### Requirement: Derived account balances
The system SHALL calculate each account's current balance as its opening balance plus all assigned income amounts minus all assigned expense amounts.

#### Scenario: Display a current balance
- **WHEN** an account has an opening balance and recorded income and expenses
- **THEN** the displayed current balance equals the opening balance plus income minus expenses

#### Scenario: Support a negative balance
- **WHEN** an account's calculated current balance is below zero
- **THEN** the system displays the negative amount without clamping it to zero

### Requirement: Currency-safe finance overview
The system SHALL display aggregate current balances and current-calendar-month income and expenses grouped by currency and SHALL NOT combine different currencies into one monetary total.

#### Scenario: Summarize accounts in one currency
- **WHEN** all accounts use the same currency
- **THEN** the overview displays one group containing the combined balance and current-month income and expense totals for that currency

#### Scenario: Keep unlike currencies separate
- **WHEN** accounts use more than one currency
- **THEN** the overview displays a separate total group for each currency without applying an exchange rate

### Requirement: Recent movement history
The system SHALL show finance entries in reverse chronological order with their kind, date, description, amount, currency, category when present, and account context.

#### Scenario: View recent movements
- **WHEN** the finance overview contains entries
- **THEN** the newest dated entries appear first and each entry identifies its account

### Requirement: Finance deletion behavior
The system SHALL allow a user to delete an entry after confirmation and SHALL recalculate affected balances. The system SHALL allow a user to delete an account after explicit confirmation that also identifies and removes all entries assigned to that account.

#### Scenario: Delete an entry
- **WHEN** the user confirms deletion of an existing entry
- **THEN** the system removes the entry and recalculates the account balance and overview totals

#### Scenario: Cancel account deletion
- **WHEN** the user declines the account deletion confirmation
- **THEN** the system preserves the account and all of its entries

#### Scenario: Confirm account deletion
- **WHEN** the user confirms deletion of an account with assigned entries
- **THEN** the system removes the account and all entries assigned to it in one workspace update

### Requirement: Finance workspace persistence
The system SHALL persist finance accounts and entries through the existing local and remote workspace synchronization flow for the authenticated user.

#### Scenario: Reload finance data
- **WHEN** a user reloads the application after finance data has been saved
- **THEN** the system restores the user's accounts, entries, and derived balances

#### Scenario: Continue without remote synchronization
- **WHEN** remote workspace synchronization fails after local finance data is available
- **THEN** the system retains the local finance data and displays the existing synchronization error state

### Requirement: Legacy and malformed data compatibility
The system SHALL normalize workspaces without finance collections to empty finance collections and SHALL discard malformed accounts and orphaned or malformed entries without removing valid non-finance workspace data.

#### Scenario: Load a legacy workspace
- **WHEN** the system loads a workspace created before finance support
- **THEN** it preserves existing tasks, subjects, phases, and events and initializes finance accounts and entries as empty

#### Scenario: Load an orphaned finance entry
- **WHEN** a persisted finance entry references an account that does not exist
- **THEN** the system discards that entry while preserving valid workspace content
