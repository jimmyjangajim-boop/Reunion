# Session handoff, 20 October 2026

## Start here

The base governing file is repository `docs/USER_DIRECTIVE_V3.txt`; the latest usability refinement is `docs/USER_USABILITY_DIRECTIVE.txt` (Pasted text(10).txt). Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed usability slices

Steps 1–3 are implemented without rebuilding RNAS: grouped shared UI, a source-backed Cabinet roster/profile and the dedicated combined Battles workspace. Step 3 extends the existing report/review services. It preserves English originals and stages one typed battle action; only explicit approval creates/selects a battle, creates supplied formations, records phase participants/categorized casualties/equipment losses and timeline/audit effects atomically. Report history and sources persist across restart. Scenarios remain outside canon.

Unknown counts remain null; zero is explicit. Existing battle rows and historical casualty groups remain accessible. A stable battle/phase reference distinguishes corroboration from a new combat phase. Equivalent reports add evidence only; conflicting or stale proposals require review. Losses retain participant attribution even without an OOB identity. Explicit tracked-asset losses require count 1/exact day/valid state and chronology/assignment checks, preserving previous asset state and assignment history. No strength/readiness, territory, anonymous inventory or financial changes are inferred. Bounded suggestions are editable and not a general English/AI parser.

Current schema is migrations 1–7. All 48 prior live tables were compared with the pre-change backup: only migration rows, B026/B027's relative labels and two before/after audit entries changed. Financial rows, immutable originals and other canon remain identical. There are still no production report/test fixtures. B026/B027 now read “October 1992,” preserving provisional status/unknown days. Original source and superseded timeline wording remain intact. Read USABILITY_REFINEMENT.md, REPORT_PIPELINE.md and VALIDATION.md for boundaries.

The Windows copy must update app/src, app/migrations and app/scripts together, keep its data/test.sqlite (or other selected database) and RNAS_DB selection, run npm.cmd run setup and npm.cmd run db:check, then restart. Source-only copying no longer suffices. Back up mutable data before upgrading.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Step 4: turn Historical Archive into a compact searchable library with details/evidence on demand. Preserve raw records, source search and 1725 archive-only behavior. Then refine Parliament/Treasury and broader report-first interactions. Do not change financial canon. The older balanced budget-reallocation backlog remains deferred behind this user-selected order. Extend existing services rather than replace them.

Browser interaction/visual QA remains pending in this managed environment. The new Playwright battle flow is retained for a suitable browser environment; do not report it as run here. The hosted Site remains version 1 and unchanged.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.

## Git checkpoint

The prior shared layout/Cabinet checkpoint is remote commit `c073c20d437e726888d79dfc6bb83e2b32cb5a03`. This handoff accompanies the subsequent combined battle workflow commit; use repository history for its final SHA. The separate hosted publication is unchanged.
