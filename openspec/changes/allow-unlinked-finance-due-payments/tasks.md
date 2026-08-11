## 1. Domain and compatibility

- [x] 1.1 Make due-payment account association nullable, add payment currency, and update creation, patching, validation, and account deletion behavior.
- [x] 1.2 Extend workspace normalization to migrate linked legacy payments and preserve valid unlinked payments.

## 2. Persistence

- [x] 2.1 Read and write nullable account relations and payment currency in normalized PocketBase persistence.
- [x] 2.2 Update the normalized schema manifest and schema/persistence verification fixtures for the new contract.

## 3. Product experience

- [x] 3.1 Allow creating and editing a pending payment with optional account and explicit currency in Finance.
- [x] 3.2 Keep the due-payment agenda available without accounts and render/search unlinked payments in Finance and Today.
- [x] 3.3 Allow assisted due-payment suggestions to be applied without an account while preserving optional compatible-account selection.

## 4. Verification

- [x] 4.1 Expand finance tests for unlinked payments, legacy migration, account deletion, and UI behavior.
- [x] 4.2 Run focused tests, lint, schema checks, and the production build; fix regressions within scope.
