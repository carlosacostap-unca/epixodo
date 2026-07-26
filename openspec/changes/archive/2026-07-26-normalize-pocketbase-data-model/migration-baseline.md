# Migration baseline

- Captured: 2026-07-26 (America/Buenos_Aires)
- PocketBase: `https://pocketbase-epixodo.acostaparra.com`
- Legacy record: `workspaces/6m8n1vp18wf6k0e` (`key = default`)
- Canonical legacy data SHA-256: `34de25c289f71e4a11fd84a490b405e87039670049d9bb4e9c3661647d1411be`
- Target owner: `users/xwrnjjjvxizudpq`
- Owner selection: exactly one application user existed at migration time

## Verified counts

| Collection | Count |
|---|---:|
| `subjects` | 49 |
| `subject_phases` | 12 |
| `tasks` | 47 |
| `task_subjects` | 47 |
| `subject_events` | 1 |
| `location_entries` | 2 |
| All finance collections | 0 |
| All nutrition collections | 0 |

The source document and normalized assembly matched on every client ID, scalar field, client timestamp, zero-based position, and relation. The legacy SHA-256 remained unchanged after import. The verified migration marker is `workspace_migrations/k7mcx8t3w7pwtv5`.

The original `workspaces/default` record remains unchanged and MUST NOT be deleted as part of this change.
