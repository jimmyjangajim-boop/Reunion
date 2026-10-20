# Session validation, 20 October 2026

Baseline audit: 31 domain tests passed; all 14 original text hashes matched.

Previous slice: 46 tests passed across four files, including two direct Next.js API request tests. TypeScript and the production build passed. All 14 original text hashes matched. Read-only SQLite integrity, foreign keys and migration versions 1–3 passed. Report tests cover immutable originals, submit/review/approve, order/arrival separation, prior-order requirements, partial approval, full rollback, missing dates, duplicates, scenario isolation, stale-review rejection, treaty warnings and file-backed restart persistence. API tests cover cross-origin rejection and approved effects reaching shared national records.

A pre-change SQLite backup was made before migration 003. The portable snapshot includes the consistent application database and every evidence file, with checksums rechecked after ZIP creation.

Browser verification limitation: this managed environment has no control-browser skill. Under the managed Sites preview rules, no replacement preview server or improvised browser control was started, and Playwright UI flows were not run this session. Existing Playwright flows remain in the repository; their canon-review selector was updated for the resolved heir issue. No claim of browser or native Safari verification is made.

The existing hosted Site was inspected through Sites metadata: active, owner-accessible, version 1. These source changes were not deployed there.


## Parliamentary report slice

59 tests passed across five files, including three direct Next.js API tests. TypeScript and the production build passed. All 14 original source hashes matched. SQLite integrity/foreign keys and applied migrations 1–4 passed. A consistent SQLite backup was taken before migration 004; all 44 preexisting tables retained byte-equivalent field values/logical contents after the upgrade. The production database still contains no report or bill-event fixtures.

New tests cover proposal isolation, sourced passage, unknown title/date, explicit enactment and independent effective date, rejection of commencement attached to passage, several stages in one approval, preserving earlier-stage history, exact-report dedupe, event corroboration without duplicate timeline entries, stale bill baselines and reasoned rebase, atomic rollback of movement plus conflicting legislation, simulation isolation, monetary titles without spending, unsupported/negative syntax, legacy bill dates/titles, and migration preservation of prior action IDs/status/targets. API approval is checked against the same bills and evidence returned to Parliament.

Browser verification remains unavailable under the managed preview restrictions described above. No browser-flow or deployment success is claimed. Existing hosted Site version 1 is unchanged.
