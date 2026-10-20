# Current implementation status, 20 October 2026

Existing foundation: Next.js App Router, TypeScript, Tailwind, Zod, Node 24 SQLite/FTS5. Existing government, parliamentary, military, fiscal, treaty and time tools remain bounded vertical slices, documented in the root application IMPLEMENTATION_STATUS.md.

## Prior completed slice

- Migration 003: immutable report identity, proposed actions, append-only report review history and original-artifact metadata.
- National Report Center with exact original preservation, history, partial/bulk selection, inline proposed-detail correction, reasoned approval and optimistic revision checks.
- Deterministic extraction of exact-name movement orders and arrivals. Arrival requires an existing eligible order. Other prose is offered as archive events with unresolved administrative effects, not inferred subsystem mutations.
- All selected effects and timeline/audit writes share one transaction and existing domain services. Duplicate submissions and repeat approvals cannot duplicate movements.
- Scenario reports persist separately and cannot update national records. No AI or generated simulation engine is implemented.
- Reproducible reviewed JSON import: 88 source metadata records, 82 nonempty extracted texts, 40 reviewed facts and 27 user answers. Existing rows are preserved. Eight old assertion aliases and three Altis chronology rows are explicitly superseded/corrected.
- Current local database: migrations 1–5; 123 source rows, 157 assertions, 47 timeline rows including three superseded chronology rows, and 29 decision rows. No production/test reports were inserted into national data.
- Online database backup, read-only integrity/migration-version check, and complete portable database-plus-evidence ZIP with verified hashes.

## Parliamentary reports

- Migration 004 preserves existing report actions and adds append-only legislative events and source evidence.
- Bounded explicit bill syntax proposes consideration, introduction, passage or enactment. Review supports existing-bill matching, unknown titles/dates, reported effective dates and reasoned corrections.
- Approved actions update Parliament’s existing bill register and sourced timeline transactionally. Reported passage does not manufacture votes, enactment, appropriations or spending.
- Corroboration reuses an identical legislative event and timeline entry while retaining additional original evidence. Earlier stages do not regress the register; inconsistent chronology and stale bill baselines block approval.
- Bulk approval supports several stages of one bill and rolls back all department effects if any action fails.
- Parliament shows sourced legislative history. The register is the furthest reported stage, not a date-filtered reconstruction. No production legislation or fixture records were added.

## Current completed slice: financial reports

- Migration 005 preserves existing actions/legislative evidence and adds immutable report-linked ledger references, supporting sources and appropriation-adjustment history.
- Review supports proposed, authorized, appropriated, committed, disbursed and actual records, requiring a known budget, exact currency/whole-unit amount/date and transaction reference. Explicit additional appropriations raise limits; ordinary appropriation prose requires a reviewed interpretation.
- Financial actions reuse Treasury’s existing ledger service. Repeated references corroborate without duplicate money or limit increases. Conflicting references, stale budget state, missing funding and currency mismatch block approval.
- A selected earlier additional appropriation can fund a later selected payment in the same atomic approval. Failure anywhere rolls back every selected department change. Over-authorization requires a recorded explicit override; checks account for dated increases and backdated spending.
- Treasury shows references, source lines and limits adjusted for known dated increases. Original base-limit commencement can remain unknown. This is a bounded stage ledger, not full cash/accrual accounting or historical fiscal reconstruction.
- The six reattached source texts match the stored originals byte for byte; no duplicate sources or obsolete-canon overrides were created. No financial fixtures or synthetic spending were inserted into production data.

## Remaining limits

- Report extraction supports movement orders/arrivals, explicit bill stages and six financial stages. Appointments, balanced reallocations, reversals, diplomacy and semantic contradiction extraction remain unfinished.
- Unsupported prose can be recorded honestly; it does not update ministries, budgets or forces. One deferred detail issue per report avoids flooding the inbox.
- Corrective reports link to earlier reports; automatic reversal/undo of already-applied department effects is not implemented.
- Latest procurement/funding review remains available as reviewed evidence and canonical claims. Full domain-table reconciliation and lifecycle controls are unfinished; no equipment deliveries or actual spending were invented.
- Per-message Discord import and all-prose normalization remain unfinished. Missing original attachments and maps remain missing.
- The two proposed calendars remain open. No current-clock advancement or election calendar was silently approved.
- The hosted Site exists and is active at version 1. These Next.js source changes have not been deployed to it. No framework or hosting migration was attempted.
- Cloud SQLite persists across ordinary process restarts, not guaranteed task/container recreation. Restore from a portable backup or rebuild a fresh baseline from Git evidence and JSON seed.

Validation results and restrictions are in VALIDATION.md. Git commit/push identifiers belong in the session handoff after the native operations succeed.
