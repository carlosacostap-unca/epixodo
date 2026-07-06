## 1. Orientation

- [x] 1.1 Read relevant Next.js 16 client component and CSS docs before editing code.
- [x] 1.2 Confirm subjects are multi-tag labels and each subject has a horizon.

## 2. Domain Model

- [x] 2.1 Replace project types with subject types and horizon constants.
- [x] 2.2 Add `subjectIds` and `parentTaskId` to task drafts and task records.
- [x] 2.3 Add subject hierarchy helpers, descendant lookup, subject labels, and task tree helpers.
- [x] 2.4 Update selectors for inbox and subject-scoped views.

## 3. Local Storage Migration

- [x] 3.1 Accept current subject workspace data from localStorage.
- [x] 3.2 Migrate legacy projects into root subjects.
- [x] 3.3 Migrate legacy task `projectId` values into `subjectIds`.
- [x] 3.4 Save only the new subjects/subtasks workspace shape.

## 4. Workspace Actions

- [x] 4.1 Replace project actions with subject create, rename, horizon update, and parent update actions.
- [x] 4.2 Update task patching to handle `subjectIds` and `parentTaskId`.
- [x] 4.3 Prevent task parent cycles in available parent choices.

## 5. UI

- [x] 5.1 Replace project wording and navigation with subject wording.
- [x] 5.2 Update quick capture and task rows to support multiple subject tags and parent task selection.
- [x] 5.3 Render task rows with subtask indentation.
- [x] 5.4 Build subject panel controls for parent subject and horizon.
- [x] 5.5 Update search to include subject labels and horizons.

## 6. Verification

- [x] 6.1 Run lint and build checks.
- [x] 6.2 Verify legacy data migration from project-shaped local data.
- [ ] 6.3 Verify subject creation, sub-subject creation, horizon editing, multi-subject tagging, subject filtering, and subtask assignment.
