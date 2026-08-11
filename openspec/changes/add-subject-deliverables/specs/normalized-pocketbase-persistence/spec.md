## MODIFIED Requirements

### Requirement: Domain entities are stored in typed collections
The system SHALL persist independently managed planning, finance, nutrition, and location entities as records in typed PocketBase collections rather than embedding them in one workspace JSON document.

#### Scenario: Persisting a task
- **WHEN** an authenticated user saves a workspace containing a task
- **THEN** the system stores that task as a record in the `tasks` collection with its scalar fields and relational references preserved

#### Scenario: Persisting a deliverable
- **WHEN** an authenticated user saves a subject deliverable
- **THEN** the system stores that deliverable in `subject_deliverables` with its subject relation and preserves the optional task-to-deliverable relations

#### Scenario: Persisting nested nutrition data
- **WHEN** an authenticated user saves recipes, ingredients, shopping lists, or shopping items
- **THEN** the system stores parent and child entities in their corresponding typed collections and preserves child ordering

### Requirement: Relationships use PocketBase relations
The system SHALL represent entity references using PocketBase relation fields, using explicit child or join collections for one-to-many and many-to-many relationships.

#### Scenario: Task assigned to multiple subjects
- **WHEN** a task has two subject IDs
- **THEN** the system stores two unique `task_subjects` records that relate the task to each subject

#### Scenario: Task assigned to a deliverable
- **WHEN** a task references a deliverable belonging to one of its subjects
- **THEN** the system stores the task's optional `deliverable` relation to the corresponding `subject_deliverables` record

#### Scenario: Invalid cross-owner relationship
- **WHEN** a record references a parent or related entity owned by a different user
- **THEN** the system rejects the write before it becomes authoritative

### Requirement: Existing workspace API behavior is preserved during cutover
The system SHALL assemble normalized PocketBase records into the current `WorkspaceData` response shape and SHALL accept the normalized full-workspace payload during the compatibility period.

#### Scenario: Loading normalized records
- **WHEN** the workspace API loads a user whose normalized migration is complete
- **THEN** it returns tasks, subjects, deliverables, phases, events, finance data, nutrition data, and locations in the current `WorkspaceData` shape

#### Scenario: Loading data created before deliverables
- **WHEN** the client loads a valid workspace payload without deliverables or task deliverable references
- **THEN** it returns an empty deliverable list and tasks with null deliverable references

#### Scenario: Saving a full workspace
- **WHEN** the workspace API receives a valid full `WorkspaceData` payload
- **THEN** it synchronizes normalized records without requiring a separate endpoint for deliverables
