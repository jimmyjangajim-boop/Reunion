# Parliament workspace — 22 October 2026

This bounded records-first increment replaces the inline Parliament list with `ParliamentWorkspace.tsx`, `ParliamentComposition.tsx` and the pure `parliament-view.ts` read model. It adds no migration, dependency or database write.

## Delivered

- Semicircular chart with exactly one dot per recorded party seat. The preserved 3 October 1992 observation has RRP 118, LUP 95, RCA 82, NSF 64, Dalmatian Autonomy Bloc 18 and Independents/fringe 23, totaling 400. Party buttons show counts/percentages, highlight the chart and open a source-backed profile.
- The constitutional maximum 300 and actual practice 400 remain distinct. Occupied seats remain unknown. Colors/layout are presentational; dots do not invent names, individual mandates or ideological seating. Invalid, conflicting or incomplete compositions withhold the chart rather than fill gaps.
- The chamber/session observation applies only to its exact recorded date. The October 3 suspension wording is preserved. Other dates show unknown composition/session status; elapsed three months never proves restoration. The all-dates observation disclosure changes the main selector when inspecting a historical snapshot.
- Searchable legislation register with bill profiles, sponsor/source, introduction, reported stages and commencement dates. Default date mode excludes future/undated-only records. Explicit All recorded dates mode preserves access to the complete register and its furthest reported stage. A bill introduced after the selected date can be found there. Search covers identifier/title/sponsor/summary.
- Dated bill stage derives from sourced legislative events through the selected date, or a recorded introduction. The mutable all-time bill stage/effective date cannot leak later enactment into earlier views. Undated stages remain accessible only in the full register/history. Passage alone does not establish enactment. A recorded future commencement remains a reported date, not a simulated outcome.
- Searchable vote register, with linked bill identifier, chamber observation, all recorded count categories, result, configured rule and threshold. It preserves existing results; it does not infer party or individual ballots.
- Parliamentary historical events from explicitly linked Parliament records or parliamentary title matches. The view retains source/status/precision, excludes archive-only 1725 and rejected/superseded records, and includes bounded uncertainty only once the upper bound is on/before the selected day. Sorting uses those historical bounds, not descriptive labels. This is a bounded evidence list, not an invented sitting calendar.
- Existing New Bill (including inline missing sponsor), Record Vote and source drawer workflows remain in use. No duplicate legislative write service or parallel record store.

## Explicit limits

There is no verified individual parliamentary mandate dataset or term model in the current application. The Members tab explains this rather than treating bill sponsors, political figures or aggregate seat dots as members. A searchable member registry requires a separate sourced membership increment. No names, terms, party leaders, affiliations, biographies or portraits are invented.

Party profiles currently contain their recorded seat share, support description, observation date and evidence. They are not complete political biographies. Composition history currently has one source observation; no invented election series or interpolated composition. Multiple same-day chamber observations need explicit resolution before a chart. The event list uses explicit links/title matching, not general language extraction. Future elections, sittings and repeal/commencement modeling remain separate work.

## Preservation and verification

Checkpoint tag `checkpoint/parliament-2026-10-22` protects commit 5bb7ab0e9b85d228e0d6581312653028e930924e. Branch `feature/parliament-2026-10-22` builds on the project-finance repair branch. Canon, national budget and all seven corrected project envelopes remain untouched.

All 59 tables match `backups/before-parliament-2026-10-22.sqlite` exactly. The corresponding portable ZIP verifies 46 database/evidence files, migrations 1–8. Its database restored separately into `data/parliament-restore-proof.sqlite`; integrity/foreign-key checks pass and every table matches live. Machine-readable results: ignored `backups/parliament-preservation-check.json`. Runtime backups/databases are not committed.

Validation: 183 domain/API tests across 16 files, 38 desktop/emulated-phone browser checks, typecheck, production build and all 14 original-source hashes passed. New tests cover exact seat totals/dots, invalid or ambiguous compositions, before/after dates, unknown occupancy, no automatic session restoration, dated legislation, uncertainty windows and 1725 exclusion. Browser flows verify party profiles, chart counts, suspension, historical events, date switching, the member-data limitation and the existing bill/sponsor workflow through the explicit full-register mode. Desktop and phone screenshots were visually inspected; physical-device, exhaustive accessibility and load testing are not claimed.

Next: continue the requested incremental order with Cabinet/government and military usability or universal search, preserving current working directory/profile behavior. Individual parliamentary mandates remain a documented missing dataset/workflow, not a completed feature. No simulation expansion or hosted deployment occurred.
