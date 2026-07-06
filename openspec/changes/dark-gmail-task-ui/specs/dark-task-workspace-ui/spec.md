## ADDED Requirements

### Requirement: Dark workspace shell
The system SHALL present the task manager as a dark workspace with persistent navigation, top search/actions, a central task list, and contextual project panels.

#### Scenario: Workspace loads in dark shell
- **WHEN** the user opens the task manager
- **THEN** the page shows a dark background, a left navigation rail with task view counts, a top search area, a central task list, and a right-side project/context area on large screens

#### Scenario: Navigation remains view-based
- **WHEN** the user selects Today, Inbox, Upcoming, Waiting, Completed, or Projects
- **THEN** the system keeps using the existing task view rules while updating the active navigation state

### Requirement: Search current task view
The system SHALL allow users to filter the currently selected task view with a client-side search query.

#### Scenario: Matching tasks remain visible
- **WHEN** the user enters a query that matches a task title, note, project name, priority label, or status label
- **THEN** only matching tasks from the currently selected view are shown

#### Scenario: Search has no matches
- **WHEN** the user enters a query with no matches in the current view
- **THEN** the task list shows an empty state that explains there are no matches

#### Scenario: Clearing search restores current view
- **WHEN** the user clears the search query
- **THEN** all tasks from the currently selected view are shown again

### Requirement: Inbox-style task rows
The system SHALL render task rows as dense, scannable inbox items while preserving all current editing controls.

#### Scenario: Task row preserves controls
- **WHEN** a task is rendered in the list
- **THEN** the user can still complete it, edit title and notes, change status, project, `hacerEl`, `venceEl`, priority, and delete it

#### Scenario: Task row surfaces urgency
- **WHEN** a task is overdue, due today, or has a deadline without a plan date
- **THEN** the row shows a visually distinct badge for that condition

### Requirement: Dark project context panels
The system SHALL restyle project and unplanned-task panels to match the dark workspace while preserving existing behavior.

#### Scenario: Project management still works
- **WHEN** the user creates, selects, or renames a project
- **THEN** the project workflow behaves as before and uses the dark panel styling

#### Scenario: Unplanned tasks remain visible
- **WHEN** there are tasks with `venceEl` and no `hacerEl`
- **THEN** the right-side context panel lists up to five unplanned tasks using dark alert styling
