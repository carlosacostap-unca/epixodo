## 1. Domain and persistence

- [x] 1.1 Define validated companion conversation and message domain types, limits, and title derivation helpers.
- [x] 1.2 Add the companion collections, relations, rules, and indexes to the normalized PocketBase schema manifest and validation coverage.
- [x] 1.3 Implement owner-scoped PocketBase operations to list, create, rename, and delete conversations and to read and append ordered messages.

## 2. AI and server API

- [x] 2.1 Implement bounded conversation context and the OpenAI companion request with `store: false`, Spanish tone guidance, and safety boundaries.
- [x] 2.2 Add authenticated Route Handlers for conversation listing/creation, message reading/sending, renaming, and deletion with stable error responses.
- [x] 2.3 Add focused tests for validation, owner isolation, message ordering, context bounds, successful replies, and provider failure behavior.

## 3. Companion interface

- [x] 3.1 Build the responsive “Compañía” view with thread list, empty prompts, chronological messages, multiline composer, pending and error states.
- [x] 3.2 Add accessible rename and confirmed-delete controls while preserving keyboard focus and mobile reachability.
- [x] 3.3 Integrate Compañía into the main navigation, headings, search behavior, and responsive application shell.

## 4. Verification

- [x] 4.1 Run schema validation, companion tests, lint, and production build; resolve all regressions in scope.
- [ ] 4.2 Render the feature in a real browser at desktop and mobile widths, verify interaction and accessibility states, and refine the visual design.
