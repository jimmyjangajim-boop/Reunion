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
