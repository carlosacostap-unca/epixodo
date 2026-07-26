## Why

Epixodo currently persists the complete application state in one `workspaces.data` JSON document. This prevents PocketBase from enforcing relationships, indexing domain data, isolating records by user, or updating one entity without rewriting the whole workspace, while the existing `subjects` and `tasks` collections remain empty and disconnected from the live application.

## What Changes

- Replace the monolithic workspace document with typed PocketBase collections grouped by planning, finance, nutrition, and location domains.
- Represent ownership and entity links with PocketBase relation fields, including self-relations and explicit join collections where the domain is many-to-many.
- Add per-user API rules and require every persisted domain record to belong to an authenticated `users` record.
- Keep the current `/api/workspace` response contract during the transition by assembling and validating `WorkspaceData` from normalized records.
- Add an idempotent migration that copies the current `default` workspace into normalized collections, verifies counts and references, and leaves the source record untouched for rollback.
- Introduce a compatibility period with reads from the normalized model and a controlled fallback to the legacy document until migration verification succeeds.
- **BREAKING**: after cutover, `workspaces.data` is no longer the authoritative persistence model and application writes target normalized collections.

## Capabilities

### New Capabilities

- `normalized-pocketbase-persistence`: Typed, user-owned PocketBase persistence, relational integrity, compatibility assembly, and safe migration away from the monolithic workspace document.

### Modified Capabilities

None.

## Impact

- PocketBase: new or revised collections, relation fields, indexes, ownership rules, and migrated records.
- Server persistence: `app/lib/pocketbase-server.ts` changes from one-document reads and writes to collection-oriented repositories and workspace assembly.
- Workspace API: `app/api/workspace/route.ts` retains its external shape initially but changes its persistence behavior and error handling.
- Client synchronization: `app/hooks/use-task-workspace.ts` continues to consume `WorkspaceData`; a later change may replace full-workspace `PUT` calls with entity-level endpoints.
- Validation and operations: migration, schema validation, referential-integrity checks, rollback instructions, and regression tests are required before deleting or archiving legacy storage.
