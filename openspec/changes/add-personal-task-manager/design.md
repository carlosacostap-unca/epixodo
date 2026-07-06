## Context

The project is currently a minimal Next.js 16 application using the App Router, React 19, TypeScript, and Tailwind CSS. There is no existing backend, authentication, database layer, or task-management domain model.

The first version is a personal, list-based task manager. It should prioritize fast capture, clear daily focus, and optional project context over collaboration, kanban boards, or heavy planning workflows.

## Goals / Non-Goals

**Goals:**

- Provide a personal task model with optional project assignment.
- Distinguish `hacerEl` as the date the user plans to work on a task from `venceEl` as the real deadline.
- Support simple status-based workflow: pending, in progress, waiting, and completed.
- Provide focused list views: today, inbox, upcoming, projects, waiting, and completed.
- Keep business rules testable through pure filtering and normalization helpers.
- Avoid adding external services or backend dependencies for the first version.

**Non-Goals:**

- Multi-user collaboration, sharing, comments, or permissions.
- Kanban boards or project-management workflows.
- Notifications, reminders, recurring tasks, and calendar sync.
- Attachments, file storage, or rich document management.
- Cross-device synchronization.

## Decisions

### Use local browser persistence for the MVP

Tasks and projects will be persisted locally in the browser, likely through a small storage adapter around `localStorage`. This keeps the MVP personal and avoids introducing a database before the product shape is proven.

Alternative considered: add a backend/database immediately. That would support sync earlier, but it would add authentication, deployment, schema, and migration decisions before the task workflow is validated.

### Keep dates as date-only values

`hacerEl` and `venceEl` will be stored as optional date-only strings in `YYYY-MM-DD` format. The UI can render them as local dates without converting to UTC timestamps.

Alternative considered: store full ISO timestamps. That adds unnecessary time-zone and time-of-day complexity for a personal daily task list.

### Model projects as optional task context

Every task can exist without a project. Projects provide names and grouping for larger bodies of work, but task creation must not require choosing a project.

Alternative considered: make tasks belong to projects by default. That would make project work tidy, but it would slow down quick capture and make loose tasks feel artificially structured.

### Derive views from task data instead of storing view membership

Views such as today, inbox, upcoming, waiting, completed, and project detail will be computed from task fields. The app will store tasks and projects, not duplicate list memberships.

Alternative considered: store per-view lists. That would make drag-and-drop style movement easier, but it risks inconsistent state and does not fit the requested simple-list workflow.

### Separate domain helpers from UI components

Task types, status constants, date helpers, and list-filtering selectors should live outside the page component. The page can remain a composed UI, while domain logic stays easy to unit-test or reuse if persistence changes later.

Alternative considered: keep all logic inside `app/page.tsx`. That is faster for a mockup, but it becomes brittle as views and filters grow.

## Risks / Trade-offs

- Local-only persistence means data stays in one browser -> make this explicit in the implementation and keep storage isolated behind an adapter for future migration.
- `localStorage` is client-only in a Next.js app -> isolate browser persistence in client components/hooks and keep server-rendered shell code free of browser APIs.
- Simple status values may not cover every workflow -> keep statuses intentionally small for the MVP and allow later additions only when a real use case appears.
- Date-only filtering can still be confusing around "today" -> centralize the local date helper so every view uses the same definition.
- Completed tasks can clutter storage over time -> include a completed view but defer archiving/cleanup until there is real usage pressure.
