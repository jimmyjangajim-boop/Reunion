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
