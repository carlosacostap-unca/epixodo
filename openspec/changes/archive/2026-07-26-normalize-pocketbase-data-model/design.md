## Context

The live PocketBase instance is healthy and contains one application user. All live domain data is stored in the `data` JSON field of `workspaces/default`: 49 subjects, 47 tasks, 12 phases, 1 subject event, and 2 location entries; finance and nutrition buckets are currently empty. The existing `subjects` and `tasks` collections contain no records, use text/JSON references instead of PocketBase relations, and have no user ownership rules.

The application authenticates users but its server persistence uses a superuser token and always reads the global key `default`. The client and `/api/workspace` currently exchange a complete `WorkspaceData` object, so changing the client contract at the same time as the database model would make migration unnecessarily risky.

## Goals / Non-Goals

**Goals:**

- Make each independently managed domain entity a PocketBase record.
- Use relation fields for ownership and references, including a join collection for task-to-subject membership.
- Preserve all current IDs, values, timestamps, ordering, and optional relationships.
- Isolate records by authenticated user at both the server-query and PocketBase-rule layers.
- Keep the current `WorkspaceData` API contract during the first cutover.
- Make import and synchronized full-workspace writes idempotent and retry-safe.
- Verify a complete migration before changing the read source; keep legacy data available for rollback.

**Non-Goals:**

- Redesigning the visible UI or domain behavior.
- Deleting the `workspaces` collection in the same deployment.
- Exposing PocketBase directly to the browser.
- Adding cross-user sharing or collaborative workspaces.
- Replacing client-generated domain IDs with PocketBase record IDs.

## Decisions

### 1. Use typed collections with a shared ownership pattern

Every application collection has a required `owner` relation to `users`, a `client_id` text field for the existing domain ID, and PocketBase's system `created`/`updated` timestamps. Collections whose current model exposes `createdAt` and `updatedAt` also retain `client_created_at` and `client_updated_at` date fields so migration does not change ordering or user-visible history.

All collections use the following access rule shape:

```text
list/view/update/delete: @request.auth.id != "" && owner = @request.auth.id
create: @request.auth.id != "" && @request.body.owner = @request.auth.id
```

The server repository MUST additionally filter every query by the authenticated user ID because its superuser token bypasses collection rules. This defense is essential: collection rules alone do not protect requests made by the server.

Alternative considered: a single `owner` on a workspace parent with all other records related through it. Direct ownership was chosen because it produces simpler rules, faster filters, and safer server queries. The repository validates that related records share the same owner.

### 2. Use the following final collection model

Planning:

| Collection | Domain fields and relations |
|---|---|
| `subjects` | `name`, `horizon`, optional self-relation `parent` |
| `subject_phases` | relation `subject`, `name`, nullable date-only fields `planned_start`, `executed_start`, `planned_end`, `executed_end`, integer `position` |
| `subject_events` | relation `subject`, optional relation `phase`, select `kind`, `description`, date-only `event_date` |
| `tasks` | `title`, `notes`, select `status`, optional relation `phase`, optional self-relation `parent`, date-only `do_on`/`due_on`, select `priority`, optional `completed_at` |
| `task_subjects` | relation `task`, relation `subject`; unique pair per owner |

Finance:

| Collection | Domain fields and relations |
|---|---|
| `finance_accounts` | `name`, select `type`, three-letter `currency`, integer `opening_balance_minor` |
| `finance_entries` | relation `account`, select `kind`, date-only `entry_date`, `description`, integer `amount_minor`, `category` |
| `finance_due_payments` | relation `account`, `description`, integer `amount_minor`, date-only `due_date`, `category`, select `status`, optional `paid_at` |

Nutrition:

| Collection | Domain fields and relations |
|---|---|
| `nutrition_profiles` | nullable integer nutrient/water goals, JSON string arrays for preferences/allergies/intolerances; unique owner |
| `nutrition_foods` | `name`, integer reference quantity and nutrient totals, select `unit` |
| `nutrition_recipes` | `name`, integer `servings_milli` |
| `nutrition_recipe_ingredients` | relation `recipe`, relation `food`, integer `quantity_milli`, `position` |
| `nutrition_plan_items` | date-only `plan_date`, select `meal_type`, optional relation `food`, optional relation `recipe`, integer `servings_milli` |
| `nutrition_intake_entries` | date-only `intake_date`, select `meal_type`, description/quantity/unit/nutrient snapshot, optional relations `food`, `recipe`, and `plan_item` |
| `nutrition_hydration_entries` | date-only `entry_date`, integer `amount_ml` |
| `nutrition_shopping_lists` | `name`, date-only `start_date`/`end_date` |
| `nutrition_shopping_items` | relation `shopping_list`, optional relation `food`, `label`, integer `quantity_milli`, select `unit`, booleans `checked`/`manual`, `position` |

Location:

| Collection | Domain fields and relations |
|---|---|
| `location_entries` | date-only `entry_date`, `start_time`, `end_time`, `planned_location`, `actual_location`, `notes` |

Migration state:

| Collection | Domain fields and relations |
|---|---|
| `workspace_migrations` | unique owner, `legacy_key`, `legacy_sha256`, select `migration_status`, JSON `bucket_counts`, and `migrated_at` |

Date-only values remain validated `YYYY-MM-DD` text fields. Converting them to midnight timestamps was rejected because timezone conversion can change the calendar day. Instant values use PocketBase `date` fields.

PocketBase number fields used for zero-based positions are optional because a required numeric field rejects `0` as an empty value. The adapter always writes and reads the explicit integer, preserving zero-based ordering.

### 3. Keep domain IDs separate from PocketBase IDs

Relations store PocketBase record IDs, while API objects keep their current `client_id` values such as `subject-...` and `task-...`. Composite unique indexes on `(owner, client_id)` make upserts deterministic. Join/child collections use stable derived client IDs during migration, and unique indexes enforce logical pairs such as `(owner, task, subject)`.

Alternative considered: forcing existing UUID-like IDs into PocketBase's 15-character record ID. This is incompatible with the current identifiers and would leak storage constraints into the domain.

### 4. Preserve the workspace API through an adapter

`getPocketBaseWorkspace(userId)` queries the user's collections, expands or maps relations, and reconstructs `WorkspaceData`. `savePocketBaseWorkspace(userId, workspace)` normalizes the payload and performs a convergent synchronization:

1. Upsert parents by `(owner, client_id)`.
2. Resolve client IDs to PocketBase record IDs.
3. Upsert children and join records.
4. Verify all desired records and references.
5. Delete records absent from the desired workspace in child-first order.

No stale deletion occurs if an upsert or verification step fails. A retry converges on the same state. This does not provide a cross-collection database transaction, but it prevents a partial request from erasing valid records.

Alternative considered: changing the client immediately to entity-level CRUD. Keeping the compatibility adapter sharply reduces cutover risk; entity endpoints can be a later performance change.

### 5. Create the schema and migration through the existing PocketBase MCP

The MCP is the authoritative administrative path for collection and record operations. Schema creation is idempotent: inspect, create missing collections, and patch compatible collections. Because the current `subjects` and `tasks` collections are empty but structurally incompatible, implementation may recreate them only after rechecking that their record counts are still zero. No non-empty collection is deleted during migration.

The importer assigns the legacy `default` data to the sole existing application user. It MUST refuse automatic assignment if the user count is not exactly one, requiring an explicit owner ID instead.

### 6. Index for ownership, identity, and current query patterns

Every entity collection gets `(owner, client_id)` unique and `owner` lookup indexes. Additional indexes cover parent/subject/account/date/status relations and unique child pairs. Indexes use owner as the leading column where user-scoped queries dominate.

## Risks / Trade-offs

- [Full-workspace writes span multiple REST requests] → Upsert and verify before child-first deletion; retain idempotent client IDs and retry on failure.
- [The server superuser bypasses collection rules] → Require an authenticated user ID in repository APIs and include `owner` in every read, update, and delete filter.
- [Duplicated `owner` fields can disagree with parent ownership] → Validate ownership before resolving relations and constrain create/update behavior in the repository and API rules where expressible.
- [A migration could silently omit malformed legacy objects] → Compare raw bucket counts, normalized counts, imported counts, IDs, and references; abort cutover on any mismatch.
- [More collections increase request volume] → Batch queries by collection, fetch only required fields, and preserve the adapter until entity-level APIs are justified.
- [Recreating empty `subjects` and `tasks` is destructive in principle] → Recheck zero records immediately before the action and otherwise create parallel collections without deletion.
- [Keeping the legacy document temporarily duplicates data] → Treat normalized records as authoritative only after verification and mark the legacy record read-only/archived after a stabilization period.

## Migration Plan

1. Snapshot collection definitions and export `workspaces/default`; record a content hash and per-bucket counts.
2. Resolve the target owner. The current instance has exactly one `users` record, so the import can bind to that user; abort if this changes.
3. Create/patch normalized collections and indexes through the MCP. Recheck that existing `subjects` and `tasks` remain empty before any recreation.
4. Run schema validation, including field types, relation targets, rules, and required indexes.
5. Import in dependency order: subjects; phases; tasks; task-subject joins; events; finance accounts and children; nutrition parents and children; locations.
6. Perform a dry assembly from normalized records and compare every legacy client ID, scalar value, count, ordering field, and relationship.
7. Deploy the owner-aware repository with a feature flag. Initially dual-read normalized data and fall back to legacy only when no migration marker exists.
8. Enable normalized writes, run build/tests and application smoke tests, then mark the owner migration complete.
9. Retain `workspaces/default` unchanged for at least one stabilization window. Removal or archival requires a separate explicit change.

Rollback: disable normalized reads/writes and return to the untouched legacy `workspaces/default` record. Newly created normalized records can remain isolated for diagnosis; rollback does not require deleting them.

## Open Questions

- The stabilization duration before archiving legacy storage should be chosen during deployment; seven days is the default recommendation.
- Entity-level mutation endpoints could reduce write amplification, but are intentionally deferred until the normalized adapter is stable.
