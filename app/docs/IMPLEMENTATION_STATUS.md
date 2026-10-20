# Current implementation status, 20 October 2026

Existing foundation: Next.js App Router, TypeScript, Tailwind, Zod, Node 24 SQLite/FTS5. Existing government, parliamentary, military, fiscal, treaty and time tools remain bounded vertical slices, documented in the root application IMPLEMENTATION_STATUS.md.

## Added this session

- Migration 003: immutable report identity, proposed actions, append-only report review history and original-artifact metadata.
- National Report Center with exact original preservation, history, partial/bulk selection, inline proposed-detail correction, reasoned approval and optimistic revision checks.
- Deterministic extraction of exact-name movement orders and arrivals. Arrival requires an existing eligible order. Other prose is offered as archive events with unresolved administrative effects, not inferred subsystem mutations.
- All selected effects and timeline/audit writes share one transaction and existing domain services. Duplicate submissions and repeat approvals cannot duplicate movements.
- Scenario reports persist separately and cannot update national records. No AI or generated simulation engine is implemented.
- Reproducible reviewed JSON import: 88 source metadata records, 82 nonempty extracted texts, 40 reviewed facts and 27 user answers. Existing rows are preserved. Eight old assertion aliases and three Altis chronology rows are explicitly superseded/corrected.
- Current local database: migrations 1–3; 123 source rows, 157 assertions, 47 timeline rows including three superseded chronology rows, and 29 decision rows. No production/test reports were inserted into national data.
- Online database backup, read-only integrity/migration-version check, and complete portable database-plus-evidence ZIP with verified hashes.

## Remaining limits

- Report extraction is a movement vertical slice. Parliamentary enactment, appointments, financial transactions, diplomacy and semantic contradiction extraction are not automated.
- Unsupported prose can be recorded honestly; it does not update ministries, budgets or forces. One deferred detail issue per report avoids flooding the inbox.
- Corrective reports link to earlier reports; automatic reversal/undo of already-applied department effects is not implemented.
- Latest procurement/funding review remains available as reviewed evidence and canonical claims. Full domain-table reconciliation and lifecycle controls are unfinished; no equipment deliveries or actual spending were invented.
- Per-message Discord import and all-prose normalization remain unfinished. Missing original attachments and maps remain missing.
- The two proposed calendars remain open. No current-clock advancement or election calendar was silently approved.
- The hosted Site exists and is active at version 1. These Next.js source changes have not been deployed to it. No framework or hosting migration was attempted.
- Cloud SQLite persists across ordinary process restarts, not guaranteed task/container recreation. Restore from a portable backup or rebuild a fresh baseline from Git evidence and JSON seed.

Validation results and restrictions are in VALIDATION.md. Git commit/push identifiers belong in the session handoff after the native operations succeed.
