# Session handoff, 21 October 2026

## Start here

The base governing file is repository `docs/USER_DIRECTIVE_V3.txt`; the latest usability refinement is `docs/USER_USABILITY_DIRECTIVE.txt` (Pasted text(10).txt). Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed usability slices

Steps 1–4 are implemented without rebuilding RNAS: grouped shared UI, a source-backed Cabinet roster/profile and the dedicated combined Battles workspace. Step 3 extends the existing report/review services. It preserves English originals and stages one typed battle action; only explicit approval creates/selects a battle, creates supplied formations, records phase participants/categorized casualties/equipment losses and timeline/audit effects atomically. Report history and sources persist across restart. Scenarios remain outside canon.

Unknown counts remain null; zero is explicit. Existing battle rows and historical casualty groups remain accessible. A stable battle/phase reference distinguishes corroboration from a new combat phase. Equivalent reports add evidence only; conflicting or stale proposals require review. Losses retain participant attribution even without an OOB identity. Explicit tracked-asset losses require count 1/exact day/valid state and chronology/assignment checks, preserving previous asset state and assignment history. No strength/readiness, territory, anonymous inventory or financial changes are inferred. Bounded suggestions are editable and not a general English/AI parser.

Current schema is migrations 1–7. All 48 prior live tables were compared with the pre-change backup: only migration rows, B026/B027's relative labels and two before/after audit entries changed. Financial rows, immutable originals and other canon remain identical. There are still no production report/test fixtures. B026/B027 now read “October 1992,” preserving provisional status/unknown days. Original source and superseded timeline wording remain intact. Read USABILITY_REFINEMENT.md, REPORT_PIPELINE.md and VALIDATION.md for boundaries.

The Windows copy must update app/src, app/migrations and app/scripts together, keep its data/test.sqlite (or other selected database) and RNAS_DB selection, run npm.cmd run setup and npm.cmd run db:check, then restart. Source-only copying no longer suffices. Back up mutable data before upgrading.

## Current Archive slice

Historical Archive now uses compact 25-row pages across Records, Timeline, Sources, Entities and Original text. Native detail dialogs preserve full values, exact supersession links, evidence excerpts, entity/source links and expandable technical records. Filters cover words/category/status/entity/source/1725/date windows with explicit unknown-date inclusion. The Archive spans all dates independently of the dashboard selector. Historical precision, original wording, superseded aliases and active 1725 exclusion are preserved.

Original-text search is read-only, validated and paginated in SQLite with total counts and exact source line ranges; it is not limited to the global search's existing 80-result preview. Source drawer provenance separates stored text from original binary artifact metadata. Existing record/event/entity creation forms remain; inline entity creation inside every event form and semantic curation remain later work. Normalized metadata still reuses the overview payload and pages in memory.

All 54 live tables matched the pre-change contents. Schema remains 1–7, accepted financial canon is unchanged, all originals are intact and the six reattached sources match archived bytes. No migration or new dependency is needed for this Archive slice. An existing schema-7 installation needs updated app/src and a restart/rebuild; keep its data/evidence and RNAS_DB selection. For a checkout missing earlier battle work, apply all outstanding migrations with setup as described above. Browser interaction QA remains pending; no hosted publication was changed.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Step 5: refine Parliament and Treasury into purpose-built department workspaces using the existing vote/bill/report/ledger services. Preserve accepted financial canon, parliamentary 400-seat practice versus the constitutional cap, original evidence, transactional approval and partial-date uncertainty. Then continue broader report-first prerequisite creation. Budget reallocations remain deferred behind the user-selected usability order.

Browser interaction/visual QA remains pending in this managed environment. Playwright flows for Archive, Cabinet and Battles are retained for a suitable environment; do not report them as run here. The hosted Site remains unchanged.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.

## Git checkpoint

The prior combined Battles checkpoint is remote commit `8458686782ecb529dff2c76f1d9deabc75ae8b3c`. This handoff accompanies the subsequent Archive usability commit; use repository history for its final SHA. The separate hosted publication is unchanged.
