# RNAS architecture

Updated 26 October 2026. The [verified baseline](app/docs/BASELINE_2026-10-26.md) consolidates the existing runtime without changing its boundaries; [current feature coverage](app/docs/FEATURE_RUNDOWN.md) distinguishes working and partial systems. Application source lives in `app/`. This is one Next.js application and one SQLite database; no service split or framework replacement is needed. The newest product directive is `docs/USER_RECORDS_DIRECTIVE.txt`: records and administration are primary; simulation expansion and AI-first extraction are frozen.

## Unified record entry

`record-registry.ts` defines client-safe categories, guided record types, existing-workflow destinations and contracts. `NewRecordWorkspace.tsx` orchestrates category/form/review/draft/receipt navigation; purpose-built forms live under `components/records/`. `record-drafts.ts` validates supported schemas, preserves incomplete drafts, rehearses existing commands inside a rolled-back transaction, detects stale reviews, then commits record/relations/citations/receipt/audit atomically. No generated JSON is rendered as the review interface.

Migration 008 adds durable drafts/receipts, source citations and explicit bill-sponsor, treaty-participant and timeline-entity links. Canonical targets remain in the existing domain tables. Drafts are not a second national database. `record-evidence.ts` validates citations/preserves original wording; `related-person.ts` shares person resolution. Existing reports and specialized Battles/financial operations remain available as supported registry destinations. See `app/docs/UNIFIED_RECORDS.md` for the bounded delivered scope.

## Components and boundaries

| Layer | Important files | Responsibility |
| --- | --- | --- |
| UI | `app/src/components/Console.tsx` | Navigation, loading, shared forms, remaining department displays and dialogs. Still too large; extract departments incrementally when their workflows change. |
| Specialized UI | `CabinetWorkspace.tsx`, `BattleWorkspace.tsx`, `ArchiveWorkspace.tsx`, `ReportCenter.tsx` | Task-specific views and proposal editing. Never execute SQL or infer approved historical facts. |
| HTTP | `app/src/app/api/{rnas,reports,import,backup}/route.ts` | Request guards, input transport, responses. Read SQL remains in the aggregate overview. Ordinary record mutations delegate to shared commands. |
| Record commands | `app/src/lib/record-commands.ts` | Explicit entity, sourced assertion and timeline entry; validation, transaction and audit. |
| Report orchestration | `app/src/lib/reports.ts` | Preserve exact originals, stage typed proposals, review revisions, reject/defer/partially approve, validate current state and atomically apply selected effects. |
| Domain operations | `admin.ts`, `legislation.ts`, `financial-reports.ts`, `battle-reports.ts`, `unit-hierarchy.ts` | Shared movement, appointment, vote, dated unit hierarchy, legislation, finance and battle invariants. |
| Historical canon | `canon.ts`, `dates.ts`, `administration-view.ts`, `cabinet-view.ts`, `archive-view.ts`, `chronology.ts` | Evidence authority, approval and supersession, partial dates, dated read models and narrowly authorized chronology corrections. |
| Storage | `db.ts`, `app/migrations/` | SQLite connection, prepared-query helpers, migration application, transactions and audit append. |
| Recovery | `database-validation.ts`, `app/scripts/{backup,restore,export-portable,check-integrity}.ts`, `verify-portable.py` | Consistent backups, portable evidence manifest verification, isolated restore and integrity/FK/migration validation. |
| Simulation | Scenario branch of `reports.ts`; `docs/SIMULATION_DESIGN.md` | Persist hypothetical reports separately and prohibit their application to canon. No simulation engine or AI provider is implemented. |

Paths without a directory in the table are under `app/src/lib/` unless otherwise specified. Read helpers return broad `Row` objects in many places; stronger domain DTOs remain incremental work, not an invitation to add a generic repository framework.

## Database boundaries

- Runtime selection: `RNAS_DB`, otherwise `app/data/reunion.sqlite`. SQLite persists across process restarts; Git and a deleted development environment do not preserve later runtime records automatically.
- `openDatabase()` enables foreign keys/WAL, applies pending numbered migrations and runs the existing narrowly authorized Altis correction. It is not a read-only inspection API. Recovery verification opens `DatabaseSync` with `readOnly: true` instead.
- Append migrations; never rewrite applied migrations. The audit added no migration; the subsequent unified-records slice adds migration 008. Current schema is 1–8.
- Original sources and extracted text retain their separate hashes. Sources, review decisions, report reviews and applicable evidence/history tables are protected by database triggers. Canon status and operational status are separate.
- Keep original evidence and checked JSON seeds in Git. Exclude live SQLite databases, runtime backups, staged uploads, credentials, dependencies and builds.
- The approved $255B annual/$82B defense framework is retained as canon. It is not automatically a set of legally appropriated operational accounts or realized cash transactions. Do not manufacture accounts/spending to fill the Treasury screen.

## Commands and transaction ownership

- `adminAction()` owns a transaction for ordinary explicit administration forms. Low-level movement/appointment/vote/unit-state helpers operate inside the caller's transaction when several effects are combined.
- `applyAdminAction()` is the same operation inside the guided-record command's transaction. `insertEntity()`/`insertTimelineEntry()` are similarly caller-owned cores of the existing transaction-owning record commands. Do not call these cores outside a transaction. Final record save, all explicitly supplied inline identities, typed relationships, source citations, receipt and audit share one transaction. Repeat final requests return the already-saved receipt; saved receipts/citations are protected against mutation.
- Manual `ledgerEntry()` delegates to `recordManualFinancial()`, which owns its transaction. `adminAction()` dispatches ledger requests before opening its generic transaction. Do not nest `transaction()`; SQLite's helper uses `BEGIN IMMEDIATE` and has no savepoint abstraction.
- Manual finance and approved reports use the same private `writeFinancial()` and `validateFinancial()`. Both enforce dated funding, future cumulative consequences, whole units, stage-specific references, explicit appropriation increases and reasoned overrun overrides. Report evidence adds the exact report-action/source lines; manual evidence is preserved through the sourced entry and audit.
- `approveReport()` owns the transaction for selected report actions, timeline, evidence and audit. `recordFinancial()`, `recordLegislation()` and `recordBattleReport()` participate in it. A failure rolls back the whole selected set.
- Battles created from the military page or National Report Center use the Battles reviewed-report workflow. Old direct `battle`/`casualty` administration commands reject with guidance. Imported legacy rows remain intact. Do not restore those direct-write alternatives.
- Reviewed canon imports cannot use generic rollback. A genuine reversal needs an explicit reviewed, dependency-aware operation, or restoration of a verified complete backup. Rejected replacements with superseded predecessors are not a valid reversal.

## Historical semantics

`dates.ts` retains exact days, months, years, ranges, relative dates and unknowns. Derived bounds assist retrieval; they do not establish invented event days.

`snapshot()` resolves applicable canonical observations. `administrationView()` separately excludes archive-only 1725 material and superseded leadership from active administration. Archive/export access must keep the preserved history available.

Cabinet uses `cabinetView()` rather than rendering all raw assertions. The OOB UI now uses the server's `unitSnapshot()`: latest preceding observations, explicitly labeled as observations. Hierarchy insertions validate every affected later change date until the unit's next observation. Do not infer new personnel/readiness from elapsed time.

Some other department registers still show complete history under a selected dashboard date. Their semantics need explicit labeling and domain selectors before adding historical calculations. Do not globally filter imprecise records by guessed exact days.

## Integrating a new feature

1. Define the smallest domain operation and its invariants, dates, missing-data behavior and explicit effects.
2. Reuse that operation from both structured forms and typed report approval. Providers may propose schema-validated actions; they must never execute generated SQL.
3. Define transaction ownership. Preserve original input and append source-linked approval/audit history. Scenarios remain outside canon.
4. Add a read model suited to the workflow. Keep database access out of client components; avoid another disconnected generic CRUD form.
5. Add cross-system tests for failure atomicity, stale proposals, corroboration/conflicts, historical backdating and restart persistence as applicable.
6. Run relevant tests, typecheck, original-source hashes, production build and critical browser flows. Update status/handoff and feature limitations.

## Known maintenance work

The aggregate overview still loads almost every domain and evidence per assertion. Prefer department-specific bounded read queries as archive volume grows. `Console.tsx`, importer and battle UI remain large; split along real workflows when editing them. The legacy event-draft path still parallels the Report Center for movement/time actions. Consolidate preserved drafts carefully rather than deleting history. No runtime dependency cycle was found in this audit's static import scan; it is not a whole-program proof.

Local commands now bind to `127.0.0.1`. Origin checks are browser protections, not authentication. Network/public deployment needs an explicit access-control design; this audit does not provide one.

See `app/docs/ARCHITECTURE_AUDIT.md`, `app/docs/FEATURE_RUNDOWN.md` and `app/docs/BACKUP_AND_RESTORE.md`.

## Treasury read boundary

`TreasuryWorkspace.tsx` owns the fiscal overview, register disclosure and source navigation. It has no database access or writes. `treasury-view.ts` is a pure typed read adapter over the existing API snapshot, project observations and ledger. The server remains responsible for source-tier/canon resolution and `appropriationAt()`; the adapter additionally guards headline validity, filters dated transactions/project windows and preserves unknowns. Approved manual/report financial commands remain unchanged.

Do not parse arbitrary report text into charts. The adapter explicitly supports the existing economic predicates and unambiguous USD-billion/percentage values; unsupported formats remain in evidence. New indicator schemas should integrate through validated domain operations and extend this adapter with provenance/currency/date tests. Never fill dated metrics from undated reviewed references or convert reported program payments into synthetic ledger entries. Unknown appropriation base commencement remains labeled; fiscal-year exclusion is not proof of legal validity. No cross-currency or cross-stage spending total is inferred.

## Reviewed project projection repair

`project-reconciliation.ts` is a bounded source-verified operation for the stale recovery projection, invoked explicitly or by setup after reviewed import. It checks the archived original/hash, extraction rows and complete expected prior rows, refuses customized states and applies all project updates plus audit before/after and receipt in one transaction. It never changes national financial assertions, appropriations or cash entries. The receipt makes setup/retries idempotent. Do not generalize it into an unchecked overwrite importer.

`ProjectPrograms.tsx` separates the program register from Treasury. Pure `project-funding.ts` calculates paid/remaining-committed coverage only for source rows whose accounting semantics are established; other funding gaps stay unknown. Cost-minus-paid is unpaid scope, never physical completion. Preserve per-currency totals, source precision and date windows. New financial snapshot sources must establish their accounting definitions before opting into these calculations.

## Parliament read boundary

`ParliamentWorkspace.tsx` owns register disclosure, search, source/profile navigation and historical observation selection. `ParliamentComposition.tsx` renders the exact-count hemicycle and accessible party buttons; it never assigns member identities. Pure `parliament-view.ts` selects exact-date chamber observations, validates complete party totals before drawing, computes layout and resolves dated legislative stages from source events. The all-time mutable bill stage is not an as-of query. Uncertain event windows use existing date bounds and retain original labels; 1725 remains archive-only.

All writes still use New Record/shared bill operations, the existing vote command or reviewed legislation service. No new DB boundary/migration is introduced. Do not turn the current aggregate party dataset or sponsor links into a member registry. Individual mandates need a sourced identity/term model and validated domain workflow. Composition expiry, suspension restoration, seating ideology and future legislative outcomes must never be inferred from this display.

## Cabinet directory refinement

`CabinetWorkspace.tsx` owns directory navigation/search and stable profile selection. `CabinetProfile.tsx` owns the office/person dialog and evidence disclosure. Resolve profile selection from the latest payload and selected date; do not retain a copied historical row after the date changes.

`cabinetView()` remains a pure read model. It attaches term history to the correct office, validates dated confirmed terms, separates undated references, and excludes future or inactive related events from dated sections. Existing `billAtDate()` supplies related legislative stages; the API loads shared bill events once. Exact leadership office roles integrate approved dated appointments into the directory without duplicating institutions. Dashboard leadership widgets also consume this projection. The original `government` assertion register remains available as canon evidence; the directory does not rewrite it.

Unknown observation/term/affiliation/responsibility values must remain unknown. Full term/source disclosures are labeled across all dates and preserve approval states, while the primary roster follows the selector. Writes still use existing appointment/decision/office services. No new database boundary, migration or financial operation is introduced.

## Military organization/read boundary

`MilitaryWorkspace.tsx` owns the formation, manpower, equipment and movement views; `MilitaryUnitProfile.tsx` shows sourced observations and explicit unit-related records. Shared `DeploymentWorkspace.tsx` also serves Military Map, so date/search/arrival behavior is consistent. `MilitaryTable.tsx` supplies only presentation. No client component writes SQL or creates a second military record store.

Pure `military-view.ts` composes existing typed rows: it retains ancestors for search, flags unavailable/cyclic links without mutating history, preserves zero/unknown manpower, evaluates assignment intervals and point procurement observations, and attributes after-action rows only through explicit identities. The shared server `unitSnapshot()` supplies latest recorded state and source IDs; the client does not duplicate that selection query or turn observations into a simulation.

Arrival dates and raw mutable movement status are distinct. A later-completed movement may be shown as ordered on an earlier date under the existing ordered-to-completed command invariant; no duplicate confirmation is offered. Unknown cancellation/completion dates remain uncertain. Guided receipt citations and append-only audit authority are read together; the API deduplicates identical authority explanations for display. All writes still use existing reviewed formation/deployment/battle operations and explicit asset/arrival commands. Procurement, assignments and latest asset condition have different date semantics and must not be collapsed into an inferred inventory.


## Record selection, connected search and mothballed intake

`RecordPicker.tsx` is shared presentation for legacy sourced-fact/reference fields, guided record choices and Archive entity/source filters. Pure `record-choices.ts` groups existing kinds into browsing categories; it never changes entity kinds. Single selections use short native-select pages; multiple selections use paged checkboxes and explicit removable relationships. Search/category/page changes preserve selected IDs. The existing draft/command validation remains authoritative, with no new SQL, schema, store or domain mutation path.

`GlobalSearchWorkspace.tsx` owns category/type/page filters, retry and selected results. Server `record-search.ts` combines fourteen operational registers, archive identities/facts/events and preserved source metadata/passages. It reuses `archiveRows()` and the safe `searchArchiveText()` helper, including page boundaries between normalized results and source passages. Exact Archive IDs open existing details. `LinkedSearchRecords.tsx` was replaced rather than leaving a second search presentation. Search is across all recorded dates/statuses, never an as-of national snapshot. Full history child records and some departmental dossiers remain separate. See app/docs/UNIVERSAL_SEARCH.md.

The user's 26 October instruction supersedes the earlier optional Report Center priority: general National Report Center is mothballed. Keep its component and report APIs/domain services for preserved reports and the working Battles workflow. Do not remove or disable report transactions globally, delete report originals/history, or build automatic extraction to fill this gap. Main navigation/review routes use New Record; Imports & Backups explains the mothballed state.


## Saved receipt to domain record

`/api/records?view=target&id=<receipt ID>` calls server-only `savedRecordDetails()`. The receipt selects an exact supported kind/target_id and delegates to shared server-only `domainRecordDetails()` in domain-records.ts. It restores that receipt's own citation ranges and approval metadata separately from current fields. The shared reader performs SELECTs from fixed whitelisted table/join definitions and follows explicit typed relationships; callers cannot request arbitrary SQL/table names. It never replays save, infers links by name, or uses a client-side SQL boundary. It is a read projection of canonical tables, not another record store or general workflow engine.

Client-safe `SavedRecordDetails` data lives in record-registry.ts. `SavedRecordDetails.tsx` is a small receipt wrapper over shared `RecordDetails.tsx`, also used by search. The shared component owns abortable loading/error handling, paged related links and Back history between connected domain records; entity/unit links still use the existing Archive and military profiles. The existing modular creation/review/transaction services remain unchanged. Missing targets leave their receipts intact and fail visibly.

Stored domain fields can change after an approval. Their display is explicitly across all dates, not an as-of government/legislative/military projection. Preserve the immutable submitted payload/citations and separately show current fields; do not relabel a mutable stage, movement status, entity description or later dates as the original approved snapshot. Full departmental history remains in specialized workspaces. Extend the explicit typed field/link mappings when adding a guided type, with tests for identity, provenance, dates and read-only behavior.


## Unified search and read API

`record-catalog.ts` holds only client-safe kinds, category labels and transport types. `domain-records.ts` owns fixed SQL read definitions, typed field formatting and explicit foreign-key links. `record-search.ts` owns search validation, literal terms, category/type filtering and stable paging. GET-only `/api/search` transports query results or an exact typed record; responses are uncached. No new shadow index, migration, SQL in components or write service is introduced. Queries use at most twelve searchable words, with longer phrases rejected explicitly rather than silently truncating matching terms.

Source search uses the existing validated FTS helper. Counts represent hits (source metadata and text passages can be separate hits), not a count of distinct documents or approved claims. Each visible result has a real kind/ID; source hits retain source ID and known line bounds. Only fixed catalog kinds can select record queries, and supplied IDs/FTS expressions use prepared parameters. Operational matching includes explicit office/person, unit/location, bill/sponsor and budget/reference joins; it never resolves identities by name.

Transaction-to-appropriation, office-to-appointment, vote-to-bill and movement-to-location links use exact keys. The reader also surfaces guided, financial, legislative and battle evidence where an explicit typed citation exists. Whole-source links retain unknown line ranges instead of inventing line 1. Money separators are presentation only; raw amounts and financial semantics remain unchanged.

`SourceLayer.tsx` supplies the native top layer for preserved source viewing. Archive, Cabinet and unit profiles now remain selected underneath; source dismissal returns to the same profile. Form/battle/arrival navigation still closes profiles where appropriate. Do not confuse keeping a profile open with assigning a new relationship or approval.
