## ADDED Requirements

### Requirement: Due payment management
The system SHALL allow users to create and edit a due payment assigned to an existing financial account with a non-empty description, positive amount with at most two decimal places, valid due date, and optional category.

#### Scenario: Create a valid due payment
- **WHEN** the user submits valid payment details
- **THEN** the system stores the payment as pending and displays it in the finance area

#### Scenario: Reject invalid payment details
- **WHEN** the user submits an empty description, non-positive amount, invalid date, or missing account
- **THEN** the system preserves existing data and identifies the invalid input

### Requirement: Due payment urgency
The system SHALL classify each pending payment as overdue, due today, or upcoming by comparing its due date to the current local date.

#### Scenario: Payment is overdue
- **WHEN** a pending payment due date is before today
- **THEN** the system displays it as overdue

#### Scenario: Payment is due today
- **WHEN** a pending payment due date equals today
- **THEN** the system displays it as due today

#### Scenario: Payment is upcoming
- **WHEN** a pending payment due date is after today
- **THEN** the system displays it as upcoming

### Requirement: Due payment ordering
The system SHALL display pending payments before paid payments, order pending payments by due date ascending, and order paid payments by payment timestamp descending.

#### Scenario: View payment agenda
- **WHEN** payments with different dates and statuses exist
- **THEN** the nearest pending obligation appears first and paid history follows pending obligations

### Requirement: Paid status lifecycle
The system SHALL allow a user to mark a pending payment as paid and return a paid payment to pending without modifying account balances or finance entries.

#### Scenario: Mark payment paid
- **WHEN** the user marks a pending payment as paid
- **THEN** the system records a paid timestamp and moves it to paid history without changing the account balance

#### Scenario: Return payment to pending
- **WHEN** the user returns a paid payment to pending
- **THEN** the system clears its paid timestamp and restores its due-date urgency without changing the account balance

### Requirement: Due payment deletion
The system SHALL allow a user to delete a due payment after confirmation and SHALL remove payments assigned to an account when that account is deleted.

#### Scenario: Delete one payment
- **WHEN** the user confirms deletion of a due payment
- **THEN** the system removes only that payment

#### Scenario: Delete an account with payments
- **WHEN** the user confirms deletion of an account with due payments
- **THEN** the system removes the account, its entries, and its due payments in one workspace update

### Requirement: Due payment persistence compatibility
The system SHALL persist due payments through the existing workspace flow, initialize legacy workspaces with an empty due-payment collection, and discard malformed or orphaned payments without removing valid workspace data.

#### Scenario: Load legacy workspace
- **WHEN** a workspace has no due-payment collection
- **THEN** the system preserves existing content and initializes due payments as empty

#### Scenario: Load orphaned due payment
- **WHEN** a persisted due payment references a missing account
- **THEN** the system discards the payment while preserving valid finance and non-finance content
