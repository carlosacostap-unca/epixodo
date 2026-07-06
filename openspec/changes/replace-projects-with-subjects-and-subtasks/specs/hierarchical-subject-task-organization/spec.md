## ADDED Requirements

### Requirement: Subjects replace projects
The system SHALL replace user-facing project management with subjects and sub-subjects.

#### Scenario: Existing projects become subjects
- **WHEN** the app loads legacy local workspace data containing projects
- **THEN** each valid project is available as a root subject with no horizon

#### Scenario: Project wording is removed from the task manager
- **WHEN** the user views the task manager
- **THEN** the UI refers to subjects and not projects

### Requirement: Subject hierarchy and horizon
The system SHALL allow subjects to form a parent-child hierarchy and each subject SHALL have one horizon value: short term, medium term, long term, or no horizon.

#### Scenario: Create root subject
- **WHEN** the user creates a subject without choosing a parent
- **THEN** the subject is saved as a root subject with the selected horizon

#### Scenario: Create sub-subject
- **WHEN** the user creates a subject with an existing subject as parent
- **THEN** the subject is saved as a child of that parent subject

#### Scenario: Rename or update horizon
- **WHEN** the user edits a subject name or horizon
- **THEN** the subject keeps its hierarchy position and stores the updated value

### Requirement: Tasks can have multiple subject tags
The system SHALL allow each task to be tagged with zero, one, or multiple subjects.

#### Scenario: Assign multiple subjects
- **WHEN** the user edits a task's subject tags
- **THEN** the task stores all selected subject IDs without duplicates

#### Scenario: Legacy project assignment migrates
- **WHEN** a legacy task has a `projectId`
- **THEN** the migrated task has that ID in `subjectIds`

### Requirement: Subject filtering includes descendants
The system SHALL show tasks tagged with a selected subject or any descendant subject when the user views a subject.

#### Scenario: Parent subject view includes child-tagged tasks
- **WHEN** a task is tagged with a sub-subject
- **THEN** viewing the parent subject includes that task

#### Scenario: Child subject view is narrower
- **WHEN** a task is tagged only with a parent subject
- **THEN** viewing a child subject does not include that parent-only task

### Requirement: Tasks can become subtasks
The system SHALL allow tasks to form a parent-child hierarchy through subtasks.

#### Scenario: Create or assign subtask
- **WHEN** the user assigns one task as the parent of another task
- **THEN** the child task is shown as a subtask under the parent task

#### Scenario: Prevent task hierarchy cycles
- **WHEN** the user edits a task parent
- **THEN** the system does not offer the task itself or any descendant task as a valid parent

#### Scenario: Root tasks remain supported
- **WHEN** a task has no parent task
- **THEN** it is shown as a root task in task views
