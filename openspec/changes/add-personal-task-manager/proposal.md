## Why

Personal task tracking needs to stay fast enough for loose, everyday tasks while still supporting larger work grouped by project. This change introduces a simple list-based task manager where projects are optional context rather than mandatory containers.

## What Changes

- Add personal task management centered on simple task lists.
- Allow tasks to exist with or without an associated project.
- Support separate planning and deadline dates through `hacerEl` and `venceEl`.
- Provide focused views for today, inbox, upcoming work, projects, waiting tasks, and completed tasks.
- Track lightweight task status without introducing collaboration or kanban workflows.

## Capabilities

### New Capabilities

- `personal-task-management`: Covers personal tasks, optional project grouping, planning/deadline dates, task statuses, and list views.

### Modified Capabilities

- None.

## Impact

- New application data model for tasks and projects.
- New task list views and task/project editing flows.
- Filtering rules for today, upcoming tasks, waiting tasks, completed tasks, and project-scoped task lists.
- No breaking changes expected.
