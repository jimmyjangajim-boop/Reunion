# Session validation, 20 October 2026

Baseline audit: 31 domain tests passed; all 14 original text hashes matched.

Current results: 46 tests passed across four files, including two direct Next.js API request tests. TypeScript and the production build passed. All 14 original text hashes matched. Read-only SQLite integrity, foreign keys and migration versions 1–3 passed. Report tests cover immutable originals, submit/review/approve, order/arrival separation, prior-order requirements, partial approval, full rollback, missing dates, duplicates, scenario isolation, stale-review rejection, treaty warnings and file-backed restart persistence. API tests cover cross-origin rejection and approved effects reaching shared national records.

A pre-change SQLite backup was made before migration 003. The portable snapshot includes the consistent application database and every evidence file, with checksums rechecked after ZIP creation.

Browser verification limitation: this managed environment has no control-browser skill. Under the managed Sites preview rules, no replacement preview server or improvised browser control was started, and Playwright UI flows were not run this session. Existing Playwright flows remain in the repository; their canon-review selector was updated for the resolved heir issue. No claim of browser or native Safari verification is made.

The existing hosted Site was inspected through Sites metadata: active, owner-accessible, version 1. These source changes were not deployed there.
