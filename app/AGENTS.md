# Reunion data rules for future sessions

The user is the final authority over canon. Read README.md, IMPLEMENTATION_STATUS.md, BACKLOG.md, docs/DATA_MODEL.md, and the original recovery governance documents before changing imported lore or import behavior.

1. Never edit any file under evidence/recovery/ or evidence/original_recovery.zip. Verify the 14 original hashes with npm run check:sources. Preserve newly staged original bytes too.
2. Preserve source path, SHA-256, original line ranges, excerpts, evidence rank, date precision, recorded timestamp, and independent canon/operational status.
3. Explicit user decisions outrank baselines. Recovered assistant summaries remain secondary. Never promote a recovery solely because its text labels a claim confirmed.
4. The latest user decision says no heir is designated. Henry Steiner is the king’s cousin and Inferno commander. Preserve legacy heir IDs and their superseded evidence; do not revive Jakob Steiner.
5. Darius Younger is canonical VP. Keep the old Jack Younger evidence as superseded.
6. Rehn’s death and Curro’s succession are confirmed on 25 June 1992. Rehn’s appointment and the proposed election/inauguration calendar remain unconfirmed.
7. Croatian frontier lies just north of Šibenik; the Šibenik area is a DMZ. Preserve legal restrictions, practical control, and sovereignty separately. Do not invent coordinates or boundaries.
8. Preserve the 400-seat parliamentary practice and constitutional maximum 300. Never repair this discrepancy with an invented amendment. Occupied seats have not been separately established.
9. The 1992-10-03 national baseline is date-specific and subject to overrides. Do not carry it into every subsequent or preceding date.
10. Altis 1993 datelines were typos for 1992. Preserve distinct combat phases and replacement casualty categories. The ceasefire is one day before the unconfirmed current date; do not silently accept the October 18/17 proposal.
11. Plans, purchases, orders, contracts, delivery, acceptance, operational use, and completed events are separate. Time advancement does not complete unconfirmed outcomes.
12. Do not aggregate incompatible casualty categories or phases. Preserve KIA, WIA, MIA, POW, and unspecified reports separately.
13. Superseding canon requires an explicit review decision and explanation. Preserve old assertion text and source evidence. Audit and decision tables are append-only.
14. New importers stage originals and candidates; they do not overwrite or auto-confirm national facts. Import rollback retains evidence. Dedupe must be idempotent.
15. Database updates that affect several records must be atomic. Validate references, chronology, hierarchy cycles, exclusive asset assignments, seats, appropriations, and treaty restrictions.
16. Add migrations rather than rewriting applied ones. Preserve data/reunion.sqlite across upgrades. Never put the only canon copy in browser storage.
17. Run relevant Vitest tests, typecheck, source verification, production build, and critical Playwright flows after meaningful changes. Tests use temporary databases.
18. Update IMPLEMENTATION_STATUS.md honestly. A schema/table, navigation item, or generic claim form alone does not constitute a full subsystem.
19. Do not silently rewrite a broken or conflicting historical record to make tests pass. Add a review issue and preserve uncertainty.
20. Use short, plain writing. No invented lore or example records in the production seed to fill an empty screen.

21. The governing product directive is ../docs/USER_DIRECTIVE_V3.txt. Reports preserve originals, propose typed actions, and require review before transactional domain writes. Scenarios never update canon.
22. GitHub jimmyjangajim-boop/Reunion is the main project store. Commit source, migrations, docs, immutable originals and reproducible reviewed JSON seeds. Never commit live SQLite files, runtime backups, staged future uploads, credentials or dependency/build directories. Back up mutable data separately.
23. Read docs/SESSION_HANDOFF.md and docs/CANON_AUTHORITY.md before continuing. Update handoff/status each session.

24. Government renders one resolved entry per office, never all raw office/designation claims. Superseded aliases remain archive evidence. The user requested 1725 campaign data be archive-only: preserve records/sources/timeline, exclude it from active snapshots, department cards, current appointment choices and current review inbox. Use administration-view.ts rather than deleting old lore or modifying historical snapshot semantics.

25. The latest usability directive is repository docs/USER_USABILITY_DIRECTIVE.txt (Pasted text(10).txt). It refines the existing V3 project: preserve financial canon; use overview → department → evidence disclosure; finish/test bounded steps. Shared layout, Cabinet roster/profile, combined New Battle / After-Action Report and compact searchable Archive steps are implemented. Next prioritize Parliament/Treasury usability before the older budget-reallocation backlog. See docs/USABILITY_REFINEMENT.md. Supplied examples are not canon; never invent portraits, affiliations, terms or responsibilities.

26. Battle reports use the existing reviewed-report transaction. Preserve phase references, categorized counts (null is unknown; 0 is explicit), unresolved participant names, source lines and append-only phase/equipment history. Corroboration adds evidence only. Do not infer strength/readiness/cash or anonymous inventory deductions. Explicit tracked asset losses require exact dates/count 1 and chronology/assignment checks. The two authorized Altis labels are corrected by chronology.ts with audit; original sources and exact-day uncertainty remain unchanged.

27. Archive browsing/search are read-only. Keep all canon statuses and 1725 records available in Archive without restoring them to active administration. Historical window filters preserve date precision and never imply exact days or snapshot applicability. Source/record/entity links use real IDs. Preserve literal cited text, source line ranges and distinct stored-text versus original-artifact checksums. Original-text search uses validated, paginated prepared FTS queries; do not promote search results into canon.

28. Latest priority: repository `docs/USER_RECORDS_DIRECTIVE.txt` makes RNAS primarily a national records/archive/administration system. Freeze simulation and AI-first extraction expansion without deleting functioning code. New Record is the primary entry; preserve Report Center data/services; the latest instruction in rule 29 mothballs its general UI. The first typed-registry/draft/review slice is documented in `docs/UNIFIED_RECORDS.md`, with migration 008 and current validation. Do not claim every directive phase is complete. Extend connected records, then Treasury, Parliament, Cabinet and search in tested increments, preserving all established economic/canon values. Guided records use caller-transaction cores shared with legacy commands; do not nest transactions or introduce parallel record stores.

29. Latest user instruction, 26 October 2026: mothball general National Report Center until reliable intake detection exists. Remove its main UI entry points; retain report originals/APIs/services and working Battles review. Do not expand extraction or simulation. Shared RecordPicker and record-choices.ts group/filter existing identities without changing kinds; preserve selected IDs across filters/pages/drafts. Global normalized search reuses archiveRows and exact archive IDs, not inferred cross-system joins. See docs/RECORD_CONNECTIONS.md.

30. The verified consolidated baseline is documented in docs/BASELINE_2026-10-26.md and baseline-2026-10-26.json. Current status/feature guide/roadmap replace the accumulated older plans, which remain in docs/history/. Do not treat archived notes as new instructions or repeat the completed audit. Main promotion and hosted deployment are separate from preparing the baseline review.
