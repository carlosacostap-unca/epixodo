## ADDED Requirements

### Requirement: Due payment without an account
The system SHALL allow a user to create and edit a due payment with no financial account by providing a non-empty description, positive amount, valid three-letter currency, valid due date, and optional category.

#### Scenario: Create an unlinked due payment
- **WHEN** the user submits valid obligation details and selects no account
- **THEN** the system stores the payment as pending with a null account and displays its own currency

#### Scenario: Reject an incomplete unlinked due payment
- **WHEN** the user submits an unlinked payment with an empty description, non-positive amount, invalid currency, or invalid due date
- **THEN** the system preserves existing data and identifies the invalid input

### Requirement: Optional account association
The system SHALL allow a due payment to be optionally associated with an existing account and SHALL keep the payment currency equal to the selected account currency.

#### Scenario: Associate a due payment with an account
- **WHEN** the user selects an account while creating or editing a due payment
- **THEN** the system stores that account and uses its currency for the payment

#### Scenario: Remove an account association
- **WHEN** the user changes an existing due payment to no account
- **THEN** the system keeps the payment and allows its currency to be specified independently

### Requirement: Unlinked payment visibility
The system SHALL display and search due payments without accounts in the Finance area and SHALL surface due or overdue unlinked payments in Today.

#### Scenario: View an unlinked payment in Finance
- **WHEN** an unlinked payment exists
- **THEN** the finance agenda displays its description, due state, amount, currency, and a clear no-account label

#### Scenario: View an unlinked payment in Today
- **WHEN** an unlinked pending payment is due today or overdue
- **THEN** Today displays it with its amount and currency without requiring an account

#### Scenario: Create a payment before any account exists
- **WHEN** the workspace has no financial accounts
- **THEN** the user can open the due-payment form and the finance agenda remains available

### Requirement: Account deletion preserves obligations
The system SHALL preserve due payments when their associated account is deleted by clearing the association and retaining each payment's currency.

#### Scenario: Delete an account with due payments
- **WHEN** the user confirms deletion of an account that has due payments
- **THEN** the system deletes the account and its ledger entries but retains those payments without an account

### Requirement: Compatible due-payment persistence
The system SHALL persist nullable account associations and payment currency through local and normalized workspace storage while remaining compatible with legacy due payments that derive currency from an existing account.

#### Scenario: Load a legacy linked payment
- **WHEN** a stored payment references a valid account and has no currency field
- **THEN** the system derives the payment currency from the account and preserves the payment

#### Scenario: Load a valid unlinked payment
- **WHEN** a stored payment has no account and has a valid currency
- **THEN** the system preserves the payment

#### Scenario: Load a payment with a missing non-null account
- **WHEN** a stored payment references an account that does not exist
- **THEN** the system discards the malformed payment while preserving valid workspace data
