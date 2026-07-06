## Context

Epixodo currently stores local personal workspace data with `tasks` and `projects`. Tasks have a single optional `projectId`; projects are flat. The user now wants two separate hierarchies:

- Tasks and subtasks: execution structure.
- Subjects and sub-subjects: thematic labels for tasks, with each subject carrying a horizon.

Subjects behave as tags, so a task can belong to several subjects at once. This makes them different from projects, which behaved like a single container.

## Goals / Non-Goals

**Goals:**

- Replace user-facing project language and behavior with subjects.
- Support hierarchical subjects through `parentSubjectId`.
- Support subject horizon values: `short`, `medium`, `long`, `none`.
- Support multiple subject tags per task through `subjectIds`.
- Support subtasks through `parentTaskId`.
- Preserve existing local data by migrating projects into root subjects.
- Keep the app local-only and dependency-free.

**Non-Goals:**

- Add backend persistence or sync.
- Add drag-and-drop tree editing.
- Add due dates to subjects themselves.
- Add recurring tasks, reminders, or calendar logic.
- Delete old local data before migration safety is proven.

## Decisions

### Replace project fields instead of running dual systems

Domain types will use `Subject`, `subjects`, and `subjectIds`. Old `Project`, `projects`, and `projectId` data will only be accepted by the storage parser as legacy input and normalized into the new shape.

Alternative considered: keep both projects and subjects. That would preserve compatibility more literally, but it would create two overlapping concepts immediately after the user asked to remove projects.

### Model subjects as a parent-linked tree

Each subject stores `parentSubjectId: string | null`. This keeps storage simple and makes it easy to migrate old projects into root subjects.

Alternative considered: nested children arrays. That is convenient for rendering, but parent links are easier to patch, validate, and store in localStorage.

### Model tasks as a parent-linked tree

Each task stores `parentTaskId: string | null`. A root task has no parent; subtasks point to another task. UI selectors must avoid assigning a task as its own parent or under one of its descendants.

Alternative considered: add a separate `Subtask` type. That would split behavior unnecessarily; subtasks still need status, dates, priority, notes, and subject tags.

### Treat subjects as multi-select labels

Tasks store `subjectIds: string[]`. A task can have zero, one, or many subjects. Subject filters match tasks tagged with the selected subject or any descendant subject.

Alternative considered: allow only one subject. That would be simpler, but it would behave like renamed projects and miss the user's explicit label-like intent.

### Store horizons on subjects only

The horizon belongs to the subject, not the task assignment. Horizon values are descriptive planning context: short term, medium term, long term, or no horizon.

Alternative considered: horizon per task-subject assignment. That would allow richer nuance but complicates the first local-only model and UI.

## Risks / Trade-offs

- Multiple subject tags can make row controls denser -> use a multi-select control and compact chips.
- Parent-linked trees can accidentally form cycles -> exclude self and descendants from parent selectors.
- Migrating local data can silently drop malformed records -> parser should tolerate legacy and current shapes, preserving valid records.
- Subject filtering could surprise users if child subjects are omitted -> include descendant subjects by default.

## Migration Plan

- On load, if the stored workspace has `projects`, convert each project to a root subject with `horizon: "none"`.
- On load, convert task `projectId` into `subjectIds: [projectId]` when present.
- On load, default missing `subjectIds` to `[]` and missing `parentTaskId` to `null`.
- On save, write only the new `tasks` and `subjects` shape.

## Open Questions

- Later work can decide whether subject horizon should influence Today/Upcoming views.
- Later work can add richer tree controls such as collapse/expand or drag-and-drop.
