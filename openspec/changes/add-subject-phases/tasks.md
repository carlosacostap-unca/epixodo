## 1. Domain model and persistence

- [x] 1.1 Add the `SubjectPhase` type, four nullable date fields, ordering metadata, `WorkspaceData.phases`, and nullable `Task.phaseId` to the task domain model and constructors.
- [x] 1.2 Add helpers for phase creation, stable subject-scoped sorting, date-range validation, task/phase compatibility, and contiguous reordering.
- [x] 1.3 Extend workspace normalization to migrate data without phases, validate phase owners, normalize order, and clear dangling or incompatible task phase references.
- [x] 1.4 Verify local and API workspace persistence round-trips the new `phases` and `phaseId` fields without losing legacy task or subject data.

## 2. Workspace state operations

- [x] 2.1 Add create, update, reorder, and delete phase actions to the workspace hook with immutable state updates.
- [x] 2.2 Update task create/edit actions so assigning a phase adds its owner subject once and removing that subject clears an incompatible phase.
- [x] 2.3 Update subject deletion so owned phases are removed and affected task phase references are cleared while tasks and their remaining subject tags survive.

## 3. Subject phase interface

- [x] 3.1 Read the relevant Next.js 16.2.10 guides in `node_modules/next/dist/docs/` before changing UI code, as required by the repository instructions.
- [x] 3.2 Add an ordered phase section to the selected subject view with clear empty state and planned/executed date summaries.
- [x] 3.3 Add create and edit phase forms containing name plus the four explicitly labelled optional date inputs and inline range validation.
- [x] 3.4 Add phase reorder controls and a deletion confirmation that reports the number of affected tasks.

## 4. Task assignment interface

- [x] 4.1 Add an optional phase selector to task creation and task detail forms, limited to phases owned by selected subjects and labelled with their owner subject.
- [x] 4.2 Make subject selection and phase selection update together so an invalid phase is cleared and selecting a phase includes its owner subject.
- [x] 4.3 Display a task's phase context in task detail and relevant subject task lists without obscuring its other subject tags.

## 5. Verification

- [x] 5.1 Add or update focused tests for migration, four-date validation, ordering, compatible assignment, and deletion fallback behavior.
- [x] 5.2 Manually verify phase CRUD, partial dates, inverted-range errors, task assignment/direct membership, and phase/subject deletion against a persisted workspace.
- [x] 5.3 Run lint and the production build, then resolve all regressions introduced by the change.
