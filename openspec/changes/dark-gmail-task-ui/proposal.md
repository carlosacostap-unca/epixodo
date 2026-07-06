## Why

The current task manager works functionally, but its light, document-like layout does not yet feel like a focused daily workspace. A dark Gmail-inspired interface can make capture, scanning, triage, and project context feel faster and more familiar without changing the local personal-task model.

## What Changes

- Redesign the main task manager UI as a dark productivity shell with a persistent left navigation, top search/command area, central task inbox, and right-side context panels.
- Add a client-side search filter across task title, notes, project name, priority, and status labels.
- Restyle task rows into dense, scannable inbox items with compact metadata, clear status badges, and preserved inline editing controls.
- Restyle project and unplanned-task panels to match the dark shell while keeping existing project creation, selection, and rename behavior.
- Preserve all existing task data, views, local persistence, and task/project editing behavior.

## Capabilities

### New Capabilities
- `dark-task-workspace-ui`: Covers dark-mode task workspace presentation, Gmail-like navigation structure, task search/filtering, and dense task inbox scanning.

### Modified Capabilities
- None.

## Impact

- Affects `app/components/task-manager.tsx` and global visual tokens in `app/globals.css`.
- No backend, API, storage schema, or dependency changes expected.
- No breaking changes to existing local task data.
