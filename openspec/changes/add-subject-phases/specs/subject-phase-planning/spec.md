## ADDED Requirements

### Requirement: Subjects can contain ordered phases
The system SHALL allow each subject to contain zero or more phases, and each phase SHALL have a name and a stable order within its subject.

#### Scenario: Create a phase
- **WHEN** the user creates a phase with a non-empty name inside an existing subject
- **THEN** the system stores the phase under that subject and places it at the end of the subject's phase order

#### Scenario: Edit a phase
- **WHEN** the user changes the name or dates of an existing phase
- **THEN** the system persists the updated values without changing the phase's subject or task assignments

#### Scenario: Reorder phases
- **WHEN** the user changes the order of phases within one subject
- **THEN** the system persists and displays the new order for that subject

### Requirement: Phases track planned and executed dates
Each phase SHALL store nullable date-only values for planned start, executed start, planned completion, and executed completion.

#### Scenario: Save partial scheduling information
- **WHEN** the user supplies any subset of the four phase dates
- **THEN** the system stores the supplied dates and leaves the remaining dates empty

#### Scenario: Reject an inverted planned range
- **WHEN** both planned dates are present and planned completion is earlier than planned start
- **THEN** the system prevents saving the phase and identifies the invalid planned range

#### Scenario: Reject an inverted executed range
- **WHEN** both executed dates are present and executed completion is earlier than executed start
- **THEN** the system prevents saving the phase and identifies the invalid executed range

### Requirement: Tasks can belong to a phase or directly to subjects
The system SHALL allow a task to reference at most one phase through an optional phase assignment. A task without a phase SHALL remain directly associated with its zero, one, or multiple subject tags.

#### Scenario: Assign a task to a phase
- **WHEN** the user assigns a task to a phase belonging to subject A
- **THEN** the task stores that phase ID and includes subject A among its subject tags without duplicate IDs

#### Scenario: Keep a task directly in its subjects
- **WHEN** the user creates or edits a task without selecting a phase
- **THEN** the task stores no phase ID and retains its selected subject tags

#### Scenario: Limit available phases
- **WHEN** the user opens the phase selector for a task
- **THEN** the system offers only phases belonging to the task's selected subjects

#### Scenario: Remove the phase's subject from a task
- **WHEN** the user removes the subject that owns the task's selected phase
- **THEN** the system clears the phase assignment and keeps all remaining subject tags

### Requirement: Phase deletion preserves tasks
Deleting a phase SHALL NOT delete its assigned tasks.

#### Scenario: Delete a phase with assigned tasks
- **WHEN** the user confirms deletion of a phase that has assigned tasks
- **THEN** the system removes the phase, clears that phase ID from affected tasks, and keeps those tasks directly associated with the phase's subject

#### Scenario: Delete a subject with phases
- **WHEN** the existing subject deletion workflow removes a subject
- **THEN** the system also removes phases owned by that subject and clears their IDs from affected tasks

### Requirement: Existing workspace data remains valid
The system MUST normalize workspaces created before phase support without data loss.

#### Scenario: Load a workspace without phases
- **WHEN** stored workspace data contains tasks and subjects but no phases collection or task phase IDs
- **THEN** the system loads an empty phase collection and assigns no phase to existing tasks

#### Scenario: Load invalid phase references
- **WHEN** a stored task references a missing phase or a phase outside its subject tags
- **THEN** the system clears the invalid phase reference while preserving the task and its valid subject tags
