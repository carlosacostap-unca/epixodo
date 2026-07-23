## ADDED Requirements

### Requirement: Each subject can contain dated milestones and deadlines
The system MUST allow every subject to own zero or more dated items classified as either a milestone or a deadline.

#### Scenario: Create a milestone
- **WHEN** the user creates a milestone with a non-empty description and a valid date for a subject
- **THEN** the system stores the milestone under that subject and displays it in the subject detail

#### Scenario: Create a deadline
- **WHEN** the user creates a deadline with a non-empty description and a valid date for a subject
- **THEN** the system stores the deadline under that subject and displays it in the subject detail

### Requirement: Description and date are mandatory
The system MUST reject subject milestones and deadlines whose trimmed description is empty or whose date is not a valid `YYYY-MM-DD` calendar date.

#### Scenario: Missing description
- **WHEN** the user attempts to save a dated item with an empty or whitespace-only description
- **THEN** the system does not create or update the item

#### Scenario: Missing or invalid date
- **WHEN** the user attempts to save a dated item without a valid calendar date
- **THEN** the system does not create or update the item

### Requirement: Dated items can be maintained
The system MUST allow users to edit the type, description, and date of an existing milestone or deadline and to delete it.

#### Scenario: Edit an item
- **WHEN** the user changes a dated item's type, description, or date with valid values
- **THEN** the system persists and displays the updated values

#### Scenario: Delete an item
- **WHEN** the user confirms deletion of a dated item
- **THEN** the system removes it from the subject and persistent workspace

### Requirement: Dated items can belong to a subject phase
The system MUST allow a milestone or deadline to optionally reference a phase owned by the same subject.

#### Scenario: Assign a phase
- **WHEN** the user selects one of the subject's phases while creating or editing a dated item
- **THEN** the system stores and displays that phase association

#### Scenario: Reject a phase from another subject
- **WHEN** an operation attempts to associate a dated item with a phase owned by another subject
- **THEN** the system rejects the association and preserves valid workspace data

#### Scenario: Delete an associated phase
- **WHEN** a phase referenced by a milestone or deadline is deleted
- **THEN** the dated item is preserved and becomes unassigned from any phase

### Requirement: Subject dates are displayed chronologically
The system MUST display a subject's milestones and deadlines ordered by ascending calendar date with a stable tie-breaker.

#### Scenario: View mixed dated items
- **WHEN** a subject contains milestones and deadlines on different dates
- **THEN** the system displays all matching items from earliest to latest while preserving their visible type

### Requirement: Subject lifecycle preserves referential integrity
The system MUST remove a subject's milestones and deadlines when the subject is deleted and MUST discard events that reference missing subjects during normalization.

#### Scenario: Delete a subject with dated items
- **WHEN** the user deletes a subject that owns milestones or deadlines
- **THEN** the system deletes all dated items associated with that subject

#### Scenario: Load an orphaned dated item
- **WHEN** stored workspace data contains a dated item that references a missing subject
- **THEN** the system discards the orphaned item while preserving valid workspace data

### Requirement: Existing workspaces remain compatible
The system MUST load workspaces created before subject milestones and deadlines existed without data loss.

#### Scenario: Load a workspace without subject events
- **WHEN** stored workspace data contains tasks, subjects, and phases but no subject events collection
- **THEN** the system loads an empty subject events collection and preserves the existing data
