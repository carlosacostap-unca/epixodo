## 1. Baseline and safeguards

- [x] 1.1 Read the installed Next.js server route and runtime documentation relevant to the persistence changes
- [x] 1.2 Snapshot all application collection definitions through the PocketBase MCP
- [x] 1.3 Export `workspaces/default`, compute a stable content hash, and record raw and normalized bucket counts
- [x] 1.4 Recheck the application-user count and require an explicit owner ID unless it is exactly one
- [x] 1.5 Add feature flags for normalized reads, normalized writes, and legacy fallback with safe legacy defaults

## 2. PocketBase schema

- [x] 2.1 Define reusable owner, client identity, client timestamp, access-rule, and index schema fragments
- [x] 2.2 Create or safely recreate the planning collections and their indexes through the PocketBase MCP
- [x] 2.3 Create the finance collections and their indexes through the PocketBase MCP
- [x] 2.4 Create the nutrition collections and their indexes through the PocketBase MCP
- [x] 2.5 Create the location collection and its indexes through the PocketBase MCP
- [x] 2.6 Add schema inspection that validates every field type, relation target, rule, required constraint, and index
- [x] 2.7 Run schema setup twice and verify the second execution is idempotent

## 3. Normalized persistence adapter

- [x] 3.1 Introduce typed PocketBase record DTOs and mappings between snake_case records and domain objects
- [x] 3.2 Implement an owner-scoped PocketBase request layer that cannot issue unscoped record reads, updates, or deletes
- [x] 3.3 Implement planning collection reads and relation assembly into subjects, phases, events, and tasks
- [x] 3.4 Implement finance collection reads and relation assembly
- [x] 3.5 Implement nutrition collection reads and ordered child assembly
- [x] 3.6 Implement location collection reads and assembly
- [x] 3.7 Implement parent-first idempotent upserts using composite owner/client identity
- [x] 3.8 Implement relation resolution and child/join upserts after parent records exist
- [x] 3.9 Implement post-upsert verification and child-first stale deletion that is skipped after any earlier failure
- [x] 3.10 Update workspace persistence entry points to require the authenticated user ID

## 4. Migration

- [x] 4.1 Implement a dry-run importer that validates legacy entities and produces the proposed owner, count, and relationship report
- [x] 4.2 Implement dependency-ordered import while preserving client IDs, scalar values, timestamps, and ordering
- [x] 4.3 Add stable derived identities for join and child records so repeated imports do not duplicate data
- [x] 4.4 Implement source-versus-normalized comparison for IDs, counts, scalar values, ordering, and references
- [x] 4.5 Run the importer against the live `default` workspace through the MCP and verify all 49 subjects, 47 tasks, 12 phases, 1 event, and 2 locations
- [x] 4.6 Record migration completion only after the full comparison passes and confirm the legacy record hash is unchanged

## 5. API compatibility and cutover

- [x] 5.1 Update `GET /api/workspace` to pass the authenticated user ID and assemble normalized `WorkspaceData` behind the read flag
- [x] 5.2 Update `PUT /api/workspace` to pass the authenticated user ID and synchronize normalized records behind the write flag
- [x] 5.3 Implement legacy fallback only for owners without a completed normalized migration
- [x] 5.4 Ensure partial normalized failures return errors without silently replacing valid client state
- [x] 5.5 Enable normalized reads, compare production responses with the legacy document, and then enable normalized writes

## 6. Verification and rollback readiness

- [x] 6.1 Add unit tests for all record/domain mappings, date-only preservation, relation resolution, and owner filters
- [x] 6.2 Add migration tests covering idempotency, ambiguous ownership, malformed references, mismatched counts, and retry after partial failure
- [x] 6.3 Add repository integration tests for multi-collection assembly and safe synchronization order
- [x] 6.4 Run lint, type checking, the production build, and all relevant existing domain test scripts
- [x] 6.5 Smoke-test login, workspace load, task/subject/phase/event mutations, and location mutations against normalized persistence
- [x] 6.6 Document the feature-flag rollback procedure and verify that disabling normalized persistence returns to the unchanged legacy workspace
- [x] 6.7 Keep `workspaces/default` intact for the stabilization window and defer archival or deletion to a separate approved change
