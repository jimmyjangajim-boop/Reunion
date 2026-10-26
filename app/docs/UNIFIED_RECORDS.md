# Unified records: first tested increment

Latest addition, 26 October 2026: all nine saved guided types can open their exact target, original saved source lines and explicit related identities/formations. See SAVED_RECORD_DETAILS.md. The dated first-increment description and phase table below retain the earlier scope; current status is in IMPLEMENTATION_STATUS.md.

22 October 2026. Governing request: `../../docs/USER_RECORDS_DIRECTIVE.txt`. RNAS is primarily a national records system, archive and administrative database. Simulation and AI-first extraction expansion are frozen; functioning report/scenario code is preserved.

## Delivered

New Record is prominent on the homepage and in persistent navigation. A typed registry defines five categories and sixteen entries. Nine have modular guided forms; seven open existing specialized workflows explicitly labeled as such.

The guided sequence is **category → record type → form → review → save**. Incomplete drafts save to SQLite without becoming national facts. They can be resumed after reload/restart or backup/restore. Final save requires validation, a current review and a reason. A saved draft becomes an immutable receipt, and retrying its final request returns the same result.

| Guided type | Behavior |
| --- | --- |
| Person, institution, organization | Sourced identity and historical record; explicit canon choice, known description, partial/unknown date. No invented biography, office or affiliation. |
| Legislative bill | Existing bill operation plus selected/new sponsor. Creates the bill and supplied person/link atomically. Does not record passage or enactment. Parliament now displays sponsor and original source. |
| Government appointment | Select a person or supply one inline; uses existing office/term validation and explicit reshuffle handling. Unknown dates remain unknown. |
| Unit formation | Creates the supplied formation identity. Does not infer formation date, personnel, readiness or hierarchy. |
| Deployment or military order | Existing formation and named location; explicit planned/ordered status, exact order date, mission and treaty override checks. No arrival inferred. |
| Treaty/agreement | Partial date, reported terms, explicit operational status, selected participating states and one supplied missing state inline. No restriction, territory or fiscal effects inferred. |
| Historical event | Sourced timeline entry, historical precision, canon choice, multiple existing entity links and one supplied missing entity inline. No inferred departmental effects. |

Other entries route to existing Battles/after-action reporting (including casualties/losses), parliamentary vote, financial transaction, appropriation, project/program, geographic location and original-source import. Those retain their existing forms and approval behavior; they have **not** all been converted to the new draft/review UI.

Identity and event forms offer compact entry. Known dates, unknowns, source references and approval remain visible during review. Source evidence can be preserved exactly as entered or cite an existing immutable source with validated line ranges. No raw generated JSON is displayed in review.

Natural departmental entry points now route to the same guided forms for bills, appointments, formations, deployments, treaties and Archive timeline entry. Explicit historical entity links are visible from event details, entity-linked event lists and Timeline entity filters. No fuzzy relationships are manufactured from names.

## Implementation boundaries

- `record-registry.ts`: client-safe typed categories, entries and contracts; `components/records/`: separate purpose-built form modules.
- `record-drafts.ts`: draft revision checks, readable review, shared operation rehearsal, dependency fingerprint, final transaction and saved receipt. Preview exercises the actual domain operation in a transaction that is fully rolled back; it persists no source/entity/domain/audit effects.
- `applyAdminAction()` is the caller-transaction counterpart of `adminAction()`. Both use the same administration operations. `insertEntity()` and `insertTimelineEntry()` similarly participate in a caller-owned transaction; the prior public record commands retain their transaction-owning wrappers. Do not nest `transaction()`.
- `related-person.ts` shares sponsor/appointee resolution. `record-evidence.ts` preserves original text and validates existing citations.
- `/api/records` validates actual request size and same origin for mutation. Schemas only permit supported guided types; it cannot dispatch arbitrary administrative actions. This is still a local single-user app, not a new authentication system.
- Migration 008 adds five tables: draft/receipt records, their source citations, bill sponsors, treaty participants and timeline entity links. Domain targets remain in the existing canonical tables. Drafts are not a parallel national database.
- Reviews conservatively fingerprint existing identity/office/legislative/military/location/treaty/timeline/link state. A dependency change requires re-review. Draft/audit-only updates do not invalidate another draft's review. Narrower invalidation and larger data-volume optimization remain future maintenance work.

## Preservation and verification

Before migration: Git checkpoint `checkpoint/new-record-2026-10-22` at audit commit `a2fd6a94ead2a8c655a5289af240e03ca058125e`, database snapshot and portable evidence backup.

After migration, all **53 preexisting data tables** match the pre-change backup exactly; only the migrations register gains version 8. All five new tables are empty in the working database. No synthetic record, draft or fixture was added to production data. Approved economic/defense/GDP and other canon values are unchanged. Altis corrections and unresolved chronology remain intact.

The schema-8 portable backup independently verifies all 44 files. Isolated restore passes integrity, foreign keys and migrations 1–8, with identical contents across all 59 tables. Temporary tests verify saved drafts survive database reopen/backup and that final failure rolls back new people, sources, domain writes and receipt changes.

Fresh checks and results are in `UNIFIED_RECORDS_VALIDATION.md`.

## Next increments

| Directive phase | Status after this increment |
| --- | --- |
| 1. Freeze simulation expansion | Applied as development scope. Existing code preserved. |
| 2. Unified record creation | First usable slice complete: nine guided types plus existing workflow access. Additional specialized types still need their own schemas/forms. |
| 3. Connected workflows | Sponsor, appointee, treaty state and historical entity links implemented. Full inline creation of every prerequisite across every department remains incomplete. |
| 4. Visual redesign | New Record uses existing institutional palette and responsive review/forms. Larger Treasury, Parliament, Cabinet and military redesigns remain separate work. |
| 5. Search/navigation | Creation access is unified. Existing global/Archive search preserved; full universal domain search and direct detail routes remain unfinished. |
| 6. Import/export | Existing portable recovery verified with schema 8. Versioned subsystem exchange formats, bulk record import previews and future simulator exchange are not implemented here. |

Next follow the requested order: extend missing connected record workflows as needed, then the Treasury read model/dashboard using only verified dated records. Do not fabricate allocation charts, debt, inflation, GDP or time series to populate the interface. Parliament and later directories/search follow in their own tested increments. No simulation or automatic decision-making work is authorized by this priority change.
