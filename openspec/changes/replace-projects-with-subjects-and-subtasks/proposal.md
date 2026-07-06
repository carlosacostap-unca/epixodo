## Why

Projects are too rigid for the way Epixodo is evolving: they act like containers, while the user needs a thematic system that can classify tasks from multiple angles. Replacing projects with hierarchical subjects lets tasks and subtasks keep execution structure while subjects and sub-subjects provide tag-like context with planning horizons.

## What Changes

- Remove the project concept from the user-facing task manager.
- Add hierarchical subjects and sub-subjects with a horizon value: short term, medium term, long term, or no horizon.
- Allow each task to be tagged with multiple subjects/sub-subjects.
- Add task hierarchy through parent tasks and subtasks.
- Update list filtering so subject views include tasks tagged with the selected subject or any descendant subject.
- Migrate existing local project data into root subjects and existing `projectId` assignments into `subjectIds`.

## Capabilities

### New Capabilities
- `hierarchical-subject-task-organization`: Covers subject/sub-subject hierarchy, subject horizons, multi-subject task tagging, task/subtask hierarchy, and migration from projects.

### Modified Capabilities
- None.

## Impact

- Affects task domain types, selectors, local storage parsing/migration, workspace hook actions, and task manager UI.
- No backend, routing, or external dependency changes expected.
- Existing local project records are migrated into root subjects on load.
