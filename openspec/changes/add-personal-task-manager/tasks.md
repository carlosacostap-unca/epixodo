## 1. Project Orientation

- [x] 1.1 Read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before editing application code.
- [x] 1.2 Replace starter metadata and page copy with task-manager naming.
- [x] 1.3 Confirm the intended first version remains personal, list-based, and local-only.

## 2. Domain Model and Rules

- [x] 2.1 Define TypeScript types for tasks, projects, task statuses, priorities, and date-only fields.
- [x] 2.2 Add local date helpers for current `YYYY-MM-DD` values and date comparison.
- [x] 2.3 Implement pure selectors for Today, Inbox, Upcoming, Waiting, Completed, and project-scoped views.
- [x] 2.4 Implement task normalization defaults for title-only quick capture.

## 3. Local Persistence

- [x] 3.1 Create a browser storage adapter for tasks and projects.
- [x] 3.2 Add a client-side state hook that loads persisted data after mount.
- [x] 3.3 Persist task and project changes after create, edit, complete, delete, and project assignment actions.
- [x] 3.4 Handle missing or invalid stored data by falling back to an empty personal workspace.

## 4. Task and Project UI

- [x] 4.1 Build the main task manager shell with navigation for Today, Inbox, Upcoming, Projects, Waiting, and Completed.
- [x] 4.2 Build quick task capture with title-first creation and optional details.
- [x] 4.3 Build task row controls for completion, status, project, `hacerEl`, `venceEl`, priority, notes, and delete.
- [x] 4.4 Build project creation and project-scoped task filtering.
- [x] 4.5 Surface tasks with `venceEl` but no `hacerEl` as unplanned.

## 5. Verification

- [x] 5.1 Verify task creation, editing, completion, waiting status, and deletion in the browser.
- [x] 5.2 Verify `hacerEl` and `venceEl` drive Today and Upcoming views separately.
- [x] 5.3 Verify project assignment is optional and project views show assigned tasks.
- [x] 5.4 Verify tasks and projects survive page reload in the same browser.
- [x] 5.5 Run `npm.cmd run lint` and `npm.cmd run build`.
