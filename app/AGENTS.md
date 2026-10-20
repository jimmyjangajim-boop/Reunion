# Reunion data rules for future sessions

The user is the final authority over canon. Read README.md, IMPLEMENTATION_STATUS.md, BACKLOG.md, docs/DATA_MODEL.md, and the original recovery governance documents before changing imported lore or import behavior.

1. Never edit any file under evidence/recovery/ or evidence/original_recovery.zip. Verify the 14 original hashes with npm run check:sources. Preserve newly staged original bytes too.
2. Preserve source path, SHA-256, original line ranges, excerpts, evidence rank, date precision, recorded timestamp, and independent canon/operational status.
3. Explicit user decisions outrank baselines. Recovered assistant summaries remain secondary. Never promote a recovery solely because its text labels a claim confirmed.
4. King Zo III and the heir Zo III are different entities. Do not rename or merge them without a direct user decision.
5. Darius Younger is canonical VP. Keep the old Jack Younger evidence as superseded.
6. Rehn was appointed, died in a car crash a couple days later, then Curro succeeded. Calendar dates remain unknown. Sequence is not a date.
7. Croatian frontier lies just north of Šibenik; the Šibenik area is a DMZ. Preserve legal restrictions, practical control, and sovereignty separately. Do not invent coordinates or boundaries.
8. Preserve the 400-seat parliamentary practice and constitutional maximum 300. Never repair this discrepancy with an invented amendment. Occupied seats have not been separately established.
9. The 1992-10-03 national baseline is date-specific and subject to overrides. Do not carry it into every subsequent or preceding date.
10. October 1993 Altis is later history. Preserve reported phases and unknown subsequent outcomes. Never use a real-world recording date as an in-world date.
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
