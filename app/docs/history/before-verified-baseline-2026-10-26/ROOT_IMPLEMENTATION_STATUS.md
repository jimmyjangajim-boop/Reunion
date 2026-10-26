# Military organization update

See docs/MILITARY_WORKSPACE.md for searchable hierarchy, sourced unit profiles, equipment/manpower and shared deployment records, with explicit date and data limits.

# Cabinet/Government directory update

See docs/CABINET_DIRECTORY_REFINEMENT.md for connected office/person profiles, corrected historical views and preserved data.

# Parliament display update

See docs/PARLIAMENT_WORKSPACE.md for the dated chart, party profiles, legislative/vote registers and explicit missing member dataset. All existing data remains unchanged.

# Project finance correction

See docs/PROJECT_FINANCE_AUDIT.md: seven projects reconciled to the archived tracker; approved national budget unchanged.

# Treasury display update

See docs/TREASURY_REDESIGN.md for the dated dashboard, preserved data and current validation. This completes only the Treasury increment, not the remaining redesign phases.

# Current records-first increment

See [unified records](docs/UNIFIED_RECORDS.md), [validation](docs/UNIFIED_RECORDS_VALIDATION.md) and [current handoff](docs/SESSION_HANDOFF.md). New Record is primary, with nine guided types and preserved specialized tools. Schema 8 is required. Simulation expansion is frozen. Older status below is historical context.

# Architecture audit, 22 October 2026

Current status and recovery limits: [architecture audit](docs/ARCHITECTURE_AUDIT.md), [full feature rundown](docs/FEATURE_RUNDOWN.md), [validation](docs/AUDIT_VALIDATION.md), and [architecture](../ARCHITECTURE.md). The reviewed baseline is recovered and verified; no deleted-chat runtime database was found. Architecture fixes precede the previously recommended interface expansion. Older claims below are historical context.

# Current session status

See `docs/IMPLEMENTATION_STATUS.md`, `docs/SESSION_HANDOFF.md` and `docs/VALIDATION.md` for the current reviewed canon and Report Center. The combined Battles workflow, migrations 006–007 and compact searchable Archive are now implemented; Parliament/Treasury usability is next. The previous delivery status below is retained as historical implementation context; its heir, Rehn-date, source-coverage and Altis-year limitations are superseded by the current documents.

# Implementation status

Delivery: RNAS v0.1, 18 October 2026. This file distinguishes working workflows from the larger requested system. The initial import is deliberately conservative. It does not claim that every statement in the original corpus has been normalized.

## Fully working foundation workflows

- Next.js App Router, TypeScript, Tailwind, Zod, and persistent SQLite through Node 24's built-in adapter.
- Transactional numbered migrations, setup, initial import, development, production build/start, source verification, online backup and verified offline restore scripts.
- Unmodified recovery ZIP and all 14 original text files, both recovery files, structured datasets, and archival SQLite preserved.
- SHA-256 validation and idempotent initial import. Six additional supplied project attachments match the corresponding ZIP originals byte-for-byte.
- FTS5 search across original text, recovery notes, imported text, and user decisions, with line-numbered source viewing.
- Stable entity identities; independent source rank, canon approval, operational status, date precision, validity, and recording timestamp.
- Dated baseline assertions, source references, separate king/heir IDs, Darius override, undated Rehn-to-Curro succession, 400-seat/300-cap distinction, 1725 observations, and dated 1993 Altis report.
- Filterable historical chronology, sourced fact/entity/timeline forms, date-scoped dashboard reconstruction and comparison.
- Separate contradiction and missing-data inboxes. Linked issues show side-by-side excerpts. All seven requested adjudication choices, explicit missing answers, partial dates, and postponement are supported.
- Explanations required for review decisions; previous assertion text, original sources, supersession links, and before/after review history preserved. SQLite audit/decision tables are append-only.
- Deterministic checks for overlapping conflicting predicates, undated claims, secondary-only evidence, missing unit metadata, and parliamentary totals. Unrelated conflicts do not block entry.
- Staged TXT/MD/CSV/TSV/JSON/conversation-export/ZIP/image imports; bounded traversal-safe ZIP extraction; repeated-batch dedupe; rollback of batch-associated assertions while preserving originals.
- JSON, CSV and Markdown date-specific national exports, printable views, database backup download.
- Responsive navigation and forms for phone-sized browsers.

## Additional working management workflows

These are tested vertical slices, not complete versions of every subsystem:

- Government: configurable offices, appointments, undated succession sequence, acting/joint arrangement, overlapping dated term guards, explicit dated reshuffle closure.
- Parliament: 400-seat baseline and party breakdown, occupied-seat uncertainty, constitutional cap, bill entry, manual vote totals and configurable sourced threshold. A successful vote does not auto-enact a bill.
- Military: unit registration, dated personnel/hierarchy observations, cycle prevention, named-place orders, separate arrival confirmation, history preservation, asset registration/assignment and exclusive assignment checks, battle entry and separate casualty categories/report groups.
- Procurement: imported undelivered batches with zero operational count. Individually tracked undelivered assets cannot be assigned.
- Fiscal: user-created appropriations, stage-specific ledger entries, over-authorization warning with reasoned override, historical economic observations and source-linked project snapshots.
- Geography: named locations with optional known coordinates, separate sovereignty/control/administration fields, explicit Šibenik restriction.
- Diplomacy: treaty records, proposal/approval distinction, restricted-place deployment warnings at order and arrival, explicit override rationale.
- Events: exact-name deterministic movement-order parser, preview, explicit transaction approval, rollback on any failed effect; time advancement preview and clock-only approval without off-screen outcomes.

## Partial features and limits

- Automatic contradiction detection works on normalized predicates and selected domain checks. It does not infer every semantic conflict in 8,000 lines of raw prose. Some curated issues still need competing normalized records or primary transcripts.
- Calendar reconstruction is intentionally sparse. Point observations are not carried indefinitely. Month/year/decade precision is preserved; search bounds are derived intervals, not invented event dates.
- Generic sourced records cover unfinished encyclopedia topics; there are not dedicated forms for every law, election, institution, intelligence report, or diplomatic relationship.
- Cabinet baseline portfolios are normalized as observations. Full governmental appointments and complete named presidential/election histories still require curation and dedicated interfaces.
- OOB is a table with dated state forms, not a full drag-and-drop tree. Parent history is preserved. Full fleet/wing organization, attachments, replacements, battle participation and readiness rules remain unfinished.
- Procurement lifecycle transitions, partial delivery batches, damaged/lost asset histories, and equipment-by-unit aggregate inventories remain unfinished.
- Fiscal ledger is stage-specific accounting, not full double-entry accounting or cash/accrual reconciliation. No complete debt, tax, transfers reconciliation, or national budget approval procedure.
- Importers stage text exports and images without semantic extraction, OCR, transcript message-level linking, or an automatic proposed-record diff builder. Binary originals require the evidence directory during backup.
- National snapshot exports are working. Dedicated subsystem-specific printable dossiers and PDF generation remain unfinished.
- Multi-effect event transactions have a tested foundation but the prose parser only supports movement orders. Bill appropriations and battle consequences still use structured forms.
- Time preview covers pending orders and clock advancement. Election schedules, treaty expirations, debt service calendars and project/procurement milestones are not yet a complete scheduling system.
- Source confidence is entered, not algorithmically scored. A human decision remains necessary for disputed lore.
- Single-user local/LAN app. No authentication, multiuser roles, public hosting, offline iPhone database replica, service worker, or synchronization.

## Planned

- Complete election, legislative procedure, committees, amendments, presidential action, individual/bloc voting and parliamentary sessions.
- Full office/reign validity history and institution legal-authority management.
- Equipment delivery/procurement lifecycle and fleet/aircraft service records.
- Interactive operational maps, image overlays, markers, boundary drawing and historical territory layers.
- Full fiscal/debt/trade/economic reporting, project milestone editing and bounded scenario models with assumptions.
- Treaty articles, obligations, expiration/compliance, foreign leadership and embassy histories.
- Classified domestic security dossiers with allegation/verification distinctions.
- Multi-effect battle/event editor, complete advancement schedule review, richer deterministic language parsing.
- More comprehensive import candidate extraction, corroboration and semantic duplicate review.

## Blocked by missing evidence

Exact Rehn/Curro appointment dates, heir designation interpretation, treaty boundary geometry and applicability date, numerous commanders, detailed war phases, original Discord/full conversation transcripts, and original operational maps are not supplied. These appear as unknowns or review issues; they are not silently filled in.

## Verification

The final validation result is recorded in `docs/VALIDATION.md`. Unit/domain tests run against newly created temporary databases. Browser flows run against a separate freshly seeded temporary database, preserving the shipped seed.
