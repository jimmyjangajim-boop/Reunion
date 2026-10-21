# RNAS data model

## Evidence and canon

`import_batches → sources → chunks / source_fts` preserves original documents, duplicate identity, full text, and line citations. Source rows are immutable through SQLite triggers. SHA-256 covers original bytes. Binary import bytes live in `evidence/staged/<sha256>`; their source rows contain metadata rather than decoded image content.

`entities → assertions → evidence → sources` represents normalized claims. An entity's ID is independent of its name. Royal names cannot collapse identities.

Assertions separate:

- canon: confirmed, provisional, disputed, superseded, rejected, unknown;
- operation: proposal, planned, approved, ordered, contracted, in production, delivered, accepted, operational, completed, canceled, simulated, or equipment states;
- confidence: recorded source assessment;
- evidence rank: source tier 1–6;
- date_json: retained precision, label, uncertain bounds, relative anchor;
- indexed validity: valid_from/valid_to and explicit scope;
- recorded_at: real-world database entry time;
- superseded_by: preserved replacement chain.

Date bounds used for searches are derived bounds, not claims that an event happened on January 1. The original date precision is returned and displayed. Month/year observations are conservative windows, not exact-day event dates. Undated facts do not fill dated snapshots. Open ongoing validity requires an explicit start bound. Baseline observations are point-scoped.

`snapshot()` filters valid, approved historical facts, excludes plans/simulations, then ranks evidence for each subject/predicate. Equal-ranking incompatible values return disputed alternatives. The baseline is not a timeless national state. Sparse snapshots are expected.

## Adjudication

`issues` stores curated recovered gaps and deterministic checks. The scanner compares overlapping same-subject/same-predicate assertions and finds undated claims, missing primary sources, missing unit metadata, and party-total mismatches. It is not a language model or a complete contradiction detector for arbitrary prose.

`decisions` stores before/after snapshots, action, explanation and real recording timestamp. `audit` records mutations. Both are append-only. Choosing a replacement appends a sourced assertion and marks earlier claims superseded; it does not delete their text. Different-context decisions require two explicit date descriptions and a rationale.

## Administrative slices

- Government: offices, appointments, term sequence, overlap guards, explicitly approved dated reshuffles.
- Parliament: chamber snapshots, constitutional limits, party seats, bills, manual total votes and configured thresholds. Vote passage is separate from enactment.
- Military: stable units, dated state rows, named locations, planned/ordered/completed movements, tracked assets and nonoverlapping assignments, procurement baseline batches, battles and categorized casualty reports.
- Economy: immutable imported economic observations; project snapshots; user-entered appropriations and stage-specific ledger entries. This is not full double-entry accounting. Financial stages are not added together as one expense.
- Diplomacy: treaty records and location-specific restrictions. Unknown applicability raises a precautionary warning.
- Events: deterministic parsing into a draft; explicit approval applies all supported effects in a single immediate transaction. A failed action rolls back the whole event.

Domain services validate new records with Zod and prepared statements. SQLite enforces foreign keys, uniqueness, selected checks, immutable sources/audit, and asset assignment overlap on insert. Some constraints are service-level; direct SQL writes are not a supported editing interface.

## Import and backup

Initial import validates manifest checksums and is idempotent by pack digest. Future imports stage raw text/binary originals, bound ZIP extraction, reject traversal/symlinks, and dedupe repeated batches. No semantic extraction runs automatically. Review-approved sourced claims inherit a source batch association for rollback. Rolling back marks associated assertions rejected; evidence remains.

Online backups use SQLite's backup API. Restore verifies integrity and expected schema tables and saves the former database first. Evidence bytes must be backed up separately.

## National reports and reviewed source import, migration 003

`national_reports` references an immutable original source, a content/context digest, record/scenario mode, original date context, correction link and review revision. `report_actions` contains typed movement-order, arrival or archive-entry proposals with exact source lines and applied target IDs. `report_reviews` stores append-only proposal/approval decisions. Approved domain mutations, action states, timeline entries and audit rows share one transaction. A scenario can never use domain approval.

Movement provenance follows `report_actions.target_id → movements.id`, `report_actions.report_id → national_reports.source_id → sources`. Existing department rows remain in the same database. Completed movement rows preserve location history and order date; the order is never converted into a second duplicate arrival row.

`source_artifacts` associates each imported review text with its original container/path, binary hash/byte count and extraction status. `sources.sha256` and bytes cover the extracted UTF-8 text stored in that row; the original artifact has a separate hash. Checksummed immutable JSON and source archives reproduce the reviewed baseline without committing a live database.


## Legislative report history, migration 004

`report_actions.kind=legislation` carries a proposed existing bill or explicit reported identifier, optional title, consideration/introduction/passage/enactment stage, optional known date/effective date and a server-captured bill-state baseline. Reasoned proposal edits rebase that baseline; approval rejects stale bill state. Bulk approvals check initial baselines before writing and validate the evolving sequence within the single immediate transaction.

`bills` remains Parliament’s shared register. Its stage is the furthest reported stage; explicit introduction/effective dates are materialized without fabricating missing steps. The existing NOT NULL title stores an empty string when no title was reported, displayed as “Title not reported.” This register is not a date-specific national snapshot.

Append-only `bill_events` holds stage/date/effective-date and real recording time. `bill_event_evidence` joins each event to original source lines and a unique report action. Repeated equivalent reports add evidence to an existing event. `report_actions.target_id` is the bill ID; evidence links identify its particular event. A single `bill-event-{event_id}` timeline row avoids duplicate national events. There are no implicit writes to votes, budgets or ledger.


## Financial report records, migration 005

`report_actions.kind=financial` carries a selected/reported known budget, financial stage, exact whole-unit amount/currency/date, transaction reference, optional memo, explicit additional-appropriation interpretation and a server-captured budget/ledger state hash. The report pipeline uses existing `ledgerEntry()` with its recorded source ID; no second ledger is created.

`ledger_report_records` gives each report-created ledger entry a stable budget/stage/reference key and currency. `ledger_report_evidence` joins every supporting original source/line range and unique report action to that transaction. `report_actions.target_id` is the ledger ID. `ledger-event-{ledger_id}` is its single national timeline event. Identical references at different financial stages remain distinct records; amounts from those stages are not combined.

`budget_adjustments` stores previous/new limits for explicit additional appropriations, linked to the same immutable ledger transaction and report evidence. Known future increases can be subtracted from the current limit for historical authorization checks/display. Base-limit commencement remains unknown unless sourced separately; fiscal year is not silently converted into an exact enactment date. The existing budget’s original source is preserved.

Migration 005 rebuilds report actions and dependent legislative evidence together, preserving original IDs, states, targets and FK links. Reference/evidence/adjustment records are append-only; report-linked ledger entries cannot be edited or deleted. Manual legacy entries remain compatible and are not automatically deduplicated or reinterpreted.


## Administration display projection

`administration-view.ts` derives the active overview without changing stored canon. `records` keeps all claims with an `archive_only` display flag for explicit 1725 date context. `administrationRecords` excludes that campaign and superseded/rejected claims; active `snapshot` excludes the campaign while the underlying historical `snapshot()`/exports remain unchanged. Historical-only/obsolete identities are omitted from `currentEntities` appointment choices but remain in the full entity register. `archiveIssues` retains historical review rows outside the active issue list.

`government` contains one slot per President, VP, monarch and heir. A resolved dated claim is preferred. Confirmed undated canon is labeled `undated_canon`, not assigned a date or used as a dated office term. Equal-rank contradictory register values stay disputed. When no dated or undated knowledge exists, one unknown placeholder represents that office. Generic person designations and superseded aliases do not become extra office slots.


## Cabinet presentation and inline appointment creation

`cabinet-view.ts` projects ministry observations, dated snapshots, offices/appointments and evidence into one ministry/office roster with leadership, deputies, institutions and term history. It adds no canonical rows. Office titles are presentation labels; observation dates do not become appointment dates, and sparse dated coverage remains sparse. Source identities/evidence and prior officeholders remain available in profiles. Only applicable dated confirmed affiliations appear as current profile facts.

An explicit `new_person_name` on the existing appointment action creates a person inside `adminAction`'s transaction. The appointment's source records the supplied name; duplicate names or simultaneous existing-person selection reject. Appointment validation still checks office/person type, dates, overlaps and arrangement. Failure rolls back the new person and related source/audit rows together.


## Battle report history, migrations 006–007

`report_actions.kind=battle` carries a typed proposal, historical date precision, stable phase reference, participants with optional OOB identities/explicit creation, separate null-or-integer casualty categories and loss attribution. A server-captured hash covers the selected battle/phase/casualties, formations/name collisions and explicitly selected assets/assignments/prior battle effects. Reasoned edits rebase that hash. Approval validates the original baseline, then writes all effects in the existing immediate transaction.

`battles` and `casualties` remain the shared military registers. Follow-up reports preserve an existing battle's base row and create a new phase instead of overwriting its date/outcome. `battle_report_records` stores battle/reference, canonical structured-fact signature, historical date JSON/location/belligerents/outcome and real recording timestamp. The unique battle/reference prevents duplicate phases. Equivalent signatures add evidence; conflicts do not overwrite history. Participants and loss attribution are canonicalized so reordered corroborating reports do not duplicate a phase.

`battle_report_participants` preserves reported names/sides and nullable unit identity. `battle_report_casualties` links each existing category row to its phase/participant. Null counts produce no row; explicit zero does. Each phase/participant has a distinct report group. `battle_report_losses` preserves equipment/count/state, optional tracked asset, OOB identity and participant ID (migration 007), retaining attribution for unresolved formations too.

`battle_report_evidence` joins every supporting original source/line range to its unique report action. One `battle-report-{record_id}` timeline entry represents the phase. `battle_asset_effects` records explicit tracked-loss before/after state, exact day and serialized original assignments. Lost assets close eligible active assignments through that date; damaged assets retain assignments. No anonymous stock/strength/readiness/fiscal calculation is inferred. All battle history tables are append-only; approved corrections/reversals are not automatic undo.

Migration 006 rebuilds report actions and both dependent evidence tables together with foreign keys enabled, retaining existing IDs/status/targets. Migration 007 adds participant attribution without rewriting the applied migration. `chronology.ts` separately performs the idempotent, reviewed B026/B027 year correction with two before/after audits, preserving source/precision/status.


## Archive read model and source search

`archive-view.ts` is a pure read model for compact archive lists: readable normalized values, category/status/entity/source/collection/text filters, overlap against retained historical bounds, unknown-date handling, stable sorts and bounded in-memory pages. It does not modify archive rows or active `administrationView`/snapshot behavior. Record replacement links use `superseded_by`; entity and source relationships use existing IDs and evidence links. Timeline sources use their explicit source ID, without inventing participants.

`archive-search.ts` queries the existing `source_fts` index with validated query/source/page/size, literal sanitized terms, total counts and deterministic ranked pagination. `GET /api/rnas?view=archive_search&q=...&page=...` returns source passages with original line ranges; it creates no evidence or canon records. The existing global search remains compatible. `view=source` additionally returns nullable `source_artifacts` metadata so original-container bytes/checksums/extraction status remain distinct from extracted text metadata. No schema or import change is required.
