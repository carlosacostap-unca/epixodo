## Context

Epixodo stores a complete local workspace composed of `tasks` and hierarchical `subjects`. Tasks can carry multiple subject tags and can form a parent-child task tree. Persistence is normalized at the storage boundary before the workspace reaches React state. The requested phase concept adds a subject-owned, ordered planning layer with four independent date-only fields and an optional task relationship.

The feature crosses domain types, legacy-tolerant parsing, workspace mutations, filtering, and the subject/task detail UI. It must preserve existing local and PocketBase-backed workspace JSON without a separate database migration.

## Goals / Non-Goals

**Goals:**

- Add ordered phases scoped to a single subject.
- Record planned versus executed start and completion dates independently.
- Let a task belong to one optional phase while retaining multiple subject tags.
- Keep phase, subject, and task references consistent across edits and deletions.
- Normalize pre-phase workspace data without loss.
- Expose phase management in the selected subject view and phase assignment in task forms.

**Non-Goals:**

- Calculate phase status automatically from its dates or task completion.
- Add dependencies between phases, Gantt charts, duration calculations, or reminders.
- Allow one phase to span multiple subjects or one task to belong to multiple phases.
- Replace task dates with phase dates.
- Add server collections or external packages.

## Decisions

### Store phases as a top-level normalized collection

`WorkspaceData` will add `phases: SubjectPhase[]`. A phase stores `id`, `subjectId`, `name`, the four nullable `DateOnly` values, `order`, `createdAt`, and `updatedAt`. Tasks add `phaseId: string | null`.

This matches the existing normalized parent-link model and makes phase lookup, deletion, reassignment, and workspace serialization direct. Nesting phases inside each subject was considered, but it would make cross-record validation and immutable updates more complex.

### Retain subject tags as the source of thematic membership

A phase is owned by exactly one subject, while a task may have one optional `phaseId`. Assigning a phase automatically adds its owner to `subjectIds`. Clearing a phase does not remove any subject tags. If the owning subject is removed from the task, its incompatible `phaseId` is cleared.

Replacing `subjectIds` with a single subject/phase container was considered, but it would break the established multi-tag behavior. Storing both an independent phase and unrelated subject set without validation was also rejected because it permits contradictory records.

### Validate date pairs independently

All four dates remain optional. Planned completion must not precede planned start when both exist; executed completion must not precede executed start when both exist. There is no required relationship between planned and executed dates, and actual dates are not limited to today, supporting delayed data entry and future corrections.

Automatically deriving executed dates from user actions was considered, but explicit values better match the requested tracking semantics and avoid hidden state changes.

### Use integer order within each subject

New phases receive the next order value for their subject. Reordering rewrites the affected subject's phase orders into a contiguous sequence. Reads use `order`, then `createdAt`, as a deterministic fallback.

Ordering only by planned start was considered, but unscheduled phases and deliberate workflow order require a separate stable field.

### Enforce referential integrity during normalization and mutations

The parser accepts missing `phases` and `phaseId` fields. It keeps only well-formed phases whose `subjectId` exists, normalizes their order per subject, and retains a task phase only if the phase exists and its subject is among the task's valid `subjectIds`.

Deleting a phase clears matching task `phaseId` values. Deleting a subject removes its phases and clears matching phase IDs; existing subject deletion behavior remains responsible for subject tags and descendants. Phase deletion deliberately keeps the subject tag so affected tasks fall back to direct membership.

### Add phase controls to existing subject and task surfaces

The selected subject view will show an ordered phase section with create, edit, reorder, and delete controls plus compact planned/executed date summaries. Task creation and detail forms will include an optional phase selector grouped or filtered by selected subjects. Changing subject selections updates phase choices immediately and clears an invalid current selection.

A global phase administration screen was considered, but phases are meaningful in a subject context and the existing selected-subject surface is the least disruptive entry point.

## Risks / Trade-offs

- [Tasks with multiple subject tags make phase ownership less obvious] -> Display the owning subject with each phase option and keep only one selected phase.
- [Deleting a phase could appear to lose task organization] -> Require confirmation with the number of affected tasks and retain the owner subject tag.
- [Malformed persisted order values could create unstable rendering] -> Normalize each subject's phases to contiguous order values on load and after reorder.
- [Four dates can make forms dense] -> Present them in planned/executed pairs with explicit labels and allow all fields to remain empty.
- [Existing in-progress subject work may evolve concurrently] -> Build on the current `Subject`, `Task`, and workspace contracts and avoid altering unrelated hierarchy behavior.

## Migration Plan

1. Extend domain types and constructors with `SubjectPhase`, `WorkspaceData.phases`, and nullable `Task.phaseId`.
2. Update normalization to default missing phase data and reject dangling or incompatible references.
3. Add state actions and UI only after round-trip persistence tests pass.
4. Existing workspaces migrate lazily when loaded and are saved in the new shape on the next mutation.
5. Rollback is code-only: older clients ignore the new top-level field, while task records must remain readable by treating the added `phaseId` as an extra JSON property.

## Open Questions

- A later change can decide whether phase progress should be derived from tasks or dates.
- A later change can add phase-based list filters, visualization, dependencies, or schedule rollups.
