# normalized-pocketbase-persistence Specification

## Purpose
TBD - created by archiving change normalize-pocketbase-data-model. Update Purpose after archive.
## Requirements
### Requirement: Domain entities are stored in typed collections
The system SHALL persist independently managed planning, finance, nutrition, and location entities as records in typed PocketBase collections rather than embedding them in one workspace JSON document.

#### Scenario: Persisting a task
- **WHEN** an authenticated user saves a workspace containing a task
- **THEN** the system stores that task as a record in the `tasks` collection with its scalar fields and relational references preserved

#### Scenario: Persisting nested nutrition data
- **WHEN** an authenticated user saves recipes, ingredients, shopping lists, or shopping items
- **THEN** the system stores parent and child entities in their corresponding typed collections and preserves child ordering

### Requirement: Records are isolated by authenticated owner
Every application data record SHALL have a required owner relation to `users`, and the system MUST scope every server-side read, write, and delete operation to the authenticated user's ID.

#### Scenario: Reading a workspace
- **WHEN** an authenticated user requests their workspace
- **THEN** the assembled response contains only records whose owner is that user

#### Scenario: Attempting cross-user access
- **WHEN** a user attempts to read or mutate a record owned by another user
- **THEN** PocketBase rules and server-side ownership filters reject or exclude the operation

### Requirement: Relationships use PocketBase relations
The system SHALL represent entity references using PocketBase relation fields, using explicit child or join collections for one-to-many and many-to-many relationships.

#### Scenario: Task assigned to multiple subjects
- **WHEN** a task has two subject IDs
- **THEN** the system stores two unique `task_subjects` records that relate the task to each subject

#### Scenario: Invalid cross-owner relationship
- **WHEN** a record references a parent or related entity owned by a different user
- **THEN** the system rejects the write before it becomes authoritative

### Requirement: Existing workspace API behavior is preserved during cutover
The system SHALL assemble normalized PocketBase records into the existing `WorkspaceData` response shape and SHALL accept the existing normalized full-workspace payload during the compatibility period.

#### Scenario: Loading normalized records
- **WHEN** the workspace API loads a user whose normalized migration is complete
- **THEN** it returns tasks, subjects, phases, events, finance data, nutrition data, and locations in the current `WorkspaceData` shape

#### Scenario: Saving a full workspace
- **WHEN** the workspace API receives a valid full `WorkspaceData` payload
- **THEN** it synchronizes normalized records without requiring a client contract change

### Requirement: Full-workspace synchronization converges safely
The system MUST upsert and verify desired records before deleting stale records, MUST delete in dependency-safe order, and MUST avoid stale deletion after any failed upsert or verification.

#### Scenario: Failure during upsert
- **WHEN** one normalized record fails to upsert
- **THEN** the save operation reports an error and does not delete records that were present before the request

#### Scenario: Retrying a partial save
- **WHEN** the same workspace payload is retried after a partial failure
- **THEN** stable owner/client identity keys cause the normalized state to converge without duplicate logical records

### Requirement: Legacy data migration is lossless and idempotent
The migration SHALL preserve every valid legacy entity ID, scalar value, timestamp, ordering value, and relationship; repeated executions SHALL not create duplicate logical records.

#### Scenario: Migrating the current default workspace
- **WHEN** the importer migrates `workspaces/default` and exactly one application user exists
- **THEN** it assigns all imported records to that user and produces counts matching every normalized legacy bucket

#### Scenario: Ambiguous owner assignment
- **WHEN** automatic migration finds zero or more than one application user
- **THEN** it aborts before record creation unless an explicit target owner ID is supplied

#### Scenario: Re-running the importer
- **WHEN** the importer is run again for the same owner and legacy document
- **THEN** it updates or verifies records by stable identity without creating duplicates

### Requirement: Migration is verified before cutover
The system MUST compare the legacy source and assembled normalized workspace by collection counts, client IDs, scalar content, and references before normalized records become authoritative.

#### Scenario: Successful verification
- **WHEN** all counts, IDs, values, and references match
- **THEN** the migration can be marked complete for that owner and normalized reads can be enabled

#### Scenario: Verification mismatch
- **WHEN** any entity or relationship differs from the legacy source
- **THEN** cutover is blocked and the unchanged legacy record remains authoritative

### Requirement: Legacy rollback remains available
The migration SHALL leave the source `workspaces/default` record unchanged during the stabilization period and SHALL support switching reads and writes back to it.

#### Scenario: Rolling back after cutover
- **WHEN** normalized persistence is disabled during the stabilization period
- **THEN** the application resumes using the unchanged legacy workspace without requiring deletion of normalized records

### Requirement: Schema is administratively reproducible
The project SHALL provide an idempotent schema setup and validation path using the configured PocketBase MCP, including required fields, relation targets, ownership rules, and indexes.

#### Scenario: Applying schema setup twice
- **WHEN** schema setup is executed twice against a compatible instance
- **THEN** the second execution reports an already-satisfied schema without creating duplicate collections or indexes

#### Scenario: Detecting schema drift
- **WHEN** a required field, relation, rule, or index is missing or incompatible
- **THEN** schema validation reports the exact mismatch and blocks migration
