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

## Financial report slice

81 tests passed across six files, including four direct Next.js API tests. TypeScript and the production build passed. All 14 original source hashes matched. The six reattached source files also matched their archived originals byte for byte. Migration 005 passed read-only integrity and foreign-key checks; all 44 preexisting tables retained identical logical contents compared with the schema-4 backup. No report/financial fixtures were inserted into production data.

Financial tests cover submission without financial effects, source-linked disbursement, separate proposed/authorized/committed/disbursed/actual stages, explicit additional appropriation and base-limit history, ambiguous-total review, atomic appropriation plus dependent payment, rejection when required funding is deselected or later-dated, duplicate references as corroboration, conflicting date/amount rejection, distinct equal payments, missing details/currency mismatch/ambiguous budget selection, stale ledger state and reasoned rebase, cumulative authorization override, mixed military/financial rollback, simulations and unsupported prose, exact whole-unit limits, backdated cumulative spending, immutable financial evidence, file-backed restart persistence, and preservation of approved legislative evidence/pending action IDs through migration 005.

The API test confirms the same Treasury overview returns the approved payment, transaction reference and original source evidence, and distinguishes the limit before/after a dated additional appropriation. The first run hit a hook timeout while repeatedly importing the full archive; the financial unit fixtures were reduced to the needed budget/unit/location records, and the complete suite then passed. Full reviewed-canon integration remains covered by the API fixtures.

No browser or hosted deployment verification was performed for this slice. The managed-preview limitation remains in effect; hosted Site version 1 is unchanged. Transfers, returns/cancellations, automatic reversals, fractional currency and complete fiscal reconstruction remain outside this slice.


## Government/archive display correction

89 tests passed across seven files, including five direct API tests. TypeScript and the production build passed. All 14 original source hashes matched; read-only database integrity and foreign keys passed with migrations 1–5. There is no new migration or data rewrite in this correction.

Regression tests verify exactly one government slot per office, Darius as the single baseline VP, one undated “No designated heir” entry, preservation of old Jack/royal aliases and source evidence, 1725 archive availability without active-snapshot leakage, omission of obsolete/historical-only people from current appointment choices, no dated officeholder carry-forward, date-context classification rather than matching arbitrary prose, and separate preserved historical review issues. The API test checks the same projection returned to Government and the archive.

A Playwright regression flow was added for the four cards and historical archive lookup. It was not executed: the managed-preview browser restriction remains unchanged. No browser QA or hosted deployment success is claimed. The user’s Windows copy must receive the updated `app/src` and restart/reload; its data folder does not need replacement.


## Usability steps 1–2: shared layout and Cabinet

103 tests passed across eight files, including six direct API tests and a server-rendered Cabinet markup check. TypeScript passed. The production build passed; all 14 original source hashes and schema-5 integrity/foreign keys passed. Logical SHA-256 fingerprints of every row in all 48 live tables matched before/after, including accepted economic assertions, budgets, ledger, sources, votes and chronology. No migration, seed or dependency change was made.

New coverage checks proper ministry/office titles, a separate RIA director, corrected President/VP/heir register, one Finance entry with Rehn preserved in term history, no invented appointment dates/affiliations/portraits, no point-observation carry-forward or fabricated vacancy, explicit dated appointment precedence, equal-rank disputed holders, separate deputies/vacancies, source-backed profile data, no future affiliation on an earlier profile, readable server-rendered roster without exposed technical headings/tiers, and unchanged financial values. Appointment tests verify atomic inline person creation with source evidence and rollback on invalid appointment. The API test checks the same Cabinet data returned to the workspace.

The latest Playwright flow covers Cabinet search, native profile opening/closing and expandable evidence; the earlier four-office regression was updated to the roster layout. These browser flows were not executed under the managed-preview restriction, so interactive/visual and phone QA remain pending. No hosted deployment was performed. The shared navigation and CSS were compiled and typechecked, not visually inspected in a browser.

Scope remains steps 1–2. The combined battle/casualty workflow, dedicated library redesign, broader Parliament/Treasury refinement and general plain-language battle extraction remain unfinished. B026/B027's provisional 1993 Altis labels now carry a visible year-correction notice; persisting their narrow audited correction remains part of the next battle slice. Superseded source/timeline wording was not rewritten.


## Usability step 3: combined Battles workflow

132 tests passed across nine files, including seven direct API tests and server-rendered Battle summary/workspace checks. The added battle file has 28 tests covering immutable originals, proposal isolation, atomic domain approval/rollback, supplied inline formations, unresolved names, null versus zero, distinct phase groups, explicit tracked losses/damage and assignment closure, backdated/wrong-unit conflicts, duplicate/corroborating/reordered reports, stale review/rebase, reasoned rejection, scenario isolation, bounded English suggestions, safe counts, restart persistence, migration preservation and authorized Altis corrections. Grouped/decimal suggestion cases and unresolved loss attribution were checked after final review. TypeScript, production build and all 14 original source hashes passed.

A consistent pre-change SQLite backup was made before applying migration 006. The upgraded live database passes integrity/foreign keys with migrations 1–7 and still has zero national report/test fixtures. All 48 prior tables were compared with that backup: only migrations, the two battle date labels B026/B027 and two appended before/after audits differ. Existing economic assertions, budgets, ledger, sources, other battles/casualties and prior audit rows are identical. The corrected dates retain relative precision, no exact combat day and provisional status. Sources and superseded chronology wording remain intact. Migration tests preserve applied/pending/rejected report actions and both approved legislative/financial evidence tables, with foreign keys and append-only triggers intact.

The new Playwright combined-battle review/reload flow is retained for desktop/phone runs, but browser interaction/visual QA was not run under the managed preview restriction described above. SSR and API checks do not replace that verification. The separate hosted Site remains version 1 and unchanged. Steps 1–3 are implemented within these boundaries; compact Archive and Parliament/Treasury redesign remain next.
