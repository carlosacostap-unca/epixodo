## ADDED Requirements

### Requirement: Task creation and editing
The system SHALL allow the user to create and edit personal tasks with a title, optional notes, status, optional project, optional `hacerEl`, optional `venceEl`, and optional priority.

#### Scenario: Create a basic task without project or dates
- **WHEN** the user creates a task with only a title
- **THEN** the system stores the task as pending with no project, no `hacerEl`, and no `venceEl`

#### Scenario: Edit task details
- **WHEN** the user updates a task title, notes, status, project, `hacerEl`, `venceEl`, or priority
- **THEN** the system persists the updated task values

### Requirement: Optional project grouping
The system SHALL allow tasks to exist without a project and SHALL allow tasks to be grouped under a project when a project is selected.

#### Scenario: Task remains unassigned
- **WHEN** the user creates or edits a task without selecting a project
- **THEN** the system keeps the task available in general task views without requiring project assignment

#### Scenario: Task appears in project view
- **WHEN** a task is assigned to a project
- **THEN** the system includes the task in that project's task list

### Requirement: Separate planned and deadline dates
The system SHALL treat `hacerEl` as the date the user plans to work on a task and `venceEl` as the date by which the task must be completed.

#### Scenario: Planned task appears today
- **WHEN** an active task has `hacerEl` equal to the current local date
- **THEN** the system includes the task in the Today view

#### Scenario: Deadline task is highlighted today
- **WHEN** an active task has `venceEl` equal to the current local date
- **THEN** the system highlights the task as due today in the Today view or another visible due section

#### Scenario: Deadline task without plan is unplanned
- **WHEN** an active task has a future `venceEl` and no `hacerEl`
- **THEN** the system marks or groups the task as not planned

### Requirement: Task status workflow
The system SHALL support task statuses for pending, in progress, waiting, and completed tasks.

#### Scenario: Complete a task
- **WHEN** the user marks an active task as completed
- **THEN** the system removes the task from active views and includes it in the Completed view

#### Scenario: Waiting task appears in waiting view
- **WHEN** a task status is waiting
- **THEN** the system includes the task in the Waiting view

### Requirement: Focused list views
The system SHALL provide list views for Today, Inbox, Upcoming, Projects, Waiting, and Completed tasks derived from task and project data.

#### Scenario: Inbox shows uncategorized capture
- **WHEN** an active task has no `hacerEl`, no `venceEl`, and no project
- **THEN** the system includes the task in the Inbox view

#### Scenario: Upcoming shows future planned or due tasks
- **WHEN** an active task has a future `hacerEl` or future `venceEl`
- **THEN** the system includes the task in the Upcoming view

#### Scenario: Completed view excludes active tasks
- **WHEN** the user opens the Completed view
- **THEN** the system shows completed tasks and excludes pending, in-progress, and waiting tasks

### Requirement: Local persistence
The system SHALL persist personal tasks and projects locally so the user's data remains available after a page reload in the same browser.

#### Scenario: Reload preserves tasks
- **WHEN** the user creates or edits tasks and reloads the application in the same browser
- **THEN** the system restores the saved tasks with their statuses, projects, dates, notes, and priorities

#### Scenario: Reload preserves projects
- **WHEN** the user creates or edits projects and reloads the application in the same browser
- **THEN** the system restores the saved projects and their task associations
