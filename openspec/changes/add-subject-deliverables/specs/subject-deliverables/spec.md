## ADDED Requirements

### Requirement: Subjects own deliverables
The system SHALL allow a user to create, edit, and delete deliverables within a subject, and every deliverable MUST have a non-empty name and description.

#### Scenario: Creating a deliverable
- **WHEN** a user enters a name and description in the deliverable form for a subject
- **THEN** the system creates a deliverable owned by that subject and displays it in the subject detail

#### Scenario: Rejecting incomplete content
- **WHEN** a user tries to save a deliverable with an empty name or description
- **THEN** the system does not create or update the deliverable

### Requirement: Deliverables group compatible tasks
The system SHALL expose the tasks assigned to each deliverable, and a task MUST reference at most one deliverable whose subject is among the task's assigned subjects.

#### Scenario: Assigning a task to a deliverable
- **WHEN** a user assigns a task to a deliverable belonging to one of the task's subjects
- **THEN** the task appears in that deliverable's task list and contributes to its progress

#### Scenario: Preventing an incompatible assignment
- **WHEN** a requested deliverable belongs to no subject assigned to the task
- **THEN** the system leaves the task without that incompatible deliverable reference

### Requirement: Deliverable progress is derived from tasks
The system SHALL display each deliverable's total and completed task counts derived from its currently assigned tasks.

#### Scenario: Completing an assigned task
- **WHEN** a task assigned to a deliverable changes to completed
- **THEN** the deliverable progress immediately reflects the additional completed task

#### Scenario: Deliverable without tasks
- **WHEN** a deliverable has no assigned tasks
- **THEN** the system displays an empty task list with guidance to add or assign a task

### Requirement: Removing structures preserves tasks
The system MUST preserve tasks when a deliverable or its subject is deleted and SHALL clear any deliverable reference that is no longer valid.

#### Scenario: Deleting a deliverable
- **WHEN** a user deletes a deliverable that has assigned tasks
- **THEN** the system deletes the deliverable and leaves those tasks intact without a deliverable assignment

#### Scenario: Removing the compatible subject from a task
- **WHEN** a task no longer belongs to the subject that owns its selected deliverable
- **THEN** the system clears the task's deliverable assignment

