## 1. Domain model and persistence

- [x] 1.1 Add the subject event types, validation, creation, sorting, update, and removal helpers
- [x] 1.2 Extend workspace normalization and deletion cascades with subject events
- [x] 1.3 Extend the workspace codec and persistence defaults for backward compatibility

## 2. Workspace operations

- [x] 2.1 Expose add, edit, and delete subject event operations from the workspace hook
- [x] 2.2 Add domain and codec tests for valid, invalid, orphaned, and legacy subject events

## 3. User interface

- [x] 3.1 Add an accessible create/edit form for milestone and deadline description and date
- [x] 3.2 Add a chronological subject event section with clear type, date, empty, edit, and delete states
- [x] 3.3 Integrate subject events into the selected subject detail responsively

## 4. Verification

- [x] 4.1 Run focused tests, TypeScript, lint, and production build
- [x] 4.2 Verify milestone and deadline workflows in a real browser on desktop and mobile

## 5. Optional phase association

- [x] 5.1 Add an optional phase reference with same-subject validation and backward-compatible normalization
- [x] 5.2 Allow phase assignment in the event form and display it in subject and calendar views
- [x] 5.3 Preserve events by clearing their phase reference when a phase is deleted
- [x] 5.4 Extend focused tests for assignment, invalid references, updates, and phase deletion
