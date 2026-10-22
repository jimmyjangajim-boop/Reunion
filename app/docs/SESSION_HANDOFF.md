# Cabinet/Government directory refinement — 22 October 2026

Extended the existing directory after explicit user approval. See CABINET_DIRECTORY_REFINEMENT.md. Ministry and official names open connected office/person profiles. Appointment/affiliation fields remain unknown when unsupported. Government separates Presidency and Crown; navigation connects Government and Cabinet. Mobile roster entries are labeled and readable without horizontal scrolling.

Read-model corrections: office-specific term history; explicit dated leadership appointment resolution; common Cabinet projection for dashboard leadership widgets and directory; dated personal events/facts and legislation (shared billAtDate); separate undated references; all-dates history/source disclosures; no stale copied profile across date/payload changes. Exact role names only; no new canon or speculative officials. Original finance term dates remain undated and the reviewed succession fact is preserved, not silently transformed into term validity.

All 59 live tables unchanged and identical to an isolated portable restore. No migration/dependency/financial edits. Validation: 190 domain/API tests, 44 desktop/emulated-phone browser checks, typecheck, build and 14 original-source hashes. Before-edit backups: app/backups/before-cabinet-directory-2026-10-22.sqlite and .zip (46 files). Restore proof: app/data/cabinet-directory-restore-proof.sqlite. Preservation report: app/backups/cabinet-directory-preservation-check.json (ignored).

Branch feature/cabinet-directory-2026-10-22 builds on Parliament commit 0824dfcd. Prior review branches remain dependencies. Hosted Site unchanged. Next military organizational/administrative views and universal search in bounded increments. Do not restart architecture audit or expand simulation. Individual parliamentary mandate dataset and richer institutional/biographical histories remain unfinished.

# Parliament workspace — 22 October 2026

Completed a bounded Parliament overview/registry increment. Read PARLIAMENT_WORKSPACE.md for exact scope and limits. The semicircle has 400 source-assigned seat dots, six selectable party profiles, and separate constitutional cap 300/unknown occupied count. Composition and suspension apply only to the recorded observation date; no automatic restoration is inferred. Historical observation buttons change the main date selector. Bills/votes default to dated views with an explicit full-register mode. Bill profiles/history preserve sources and do not use later or undated enactment as earlier status. The bill/sponsor workflow remains shared; future bill entries are available in All recorded dates. Parliamentary events preserve canon/date precision and exclude archive-only 1725.

Individual member mandates/terms are not available. Members explains that absence; sponsors and party totals are not treated as named members. Party profiles are bounded count/support/source profiles, not invented biographies. Full member authoring, election series, sitting calendar and repeal model remain future work.

No schema, dependency, canon, national budget, corrected project or other data change. All 59 tables match the checkpoint and isolated portable restore. Validation: 183 domain/API tests, 38 desktop/emulated-phone checks, typecheck, build and 14 source hashes passed. Before-edit backup app/backups/before-parliament-2026-10-22.sqlite and .zip (46 verified files); restore proof app/data/parliament-restore-proof.sqlite; preservation evidence app/backups/parliament-preservation-check.json. Runtime files remain ignored.

Branch feature/parliament-2026-10-22 builds on project-finance commit 5bb7ab0; earlier PR branches remain dependencies. Hosted Site unchanged. Next continue Cabinet/government or military usability and universal search in separate tested increments under USER_RECORDS_DIRECTIVE.txt, retaining existing good Cabinet work. Do not restart the architecture audit or expand simulation. Individual member mandates remain explicitly unfinished.

# Project finance reconciliation — 22 October 2026

User requested project-finance comparison and fixes against Reunion campaign tracker.xlsx. See PROJECT_FINANCE_AUDIT.md for findings, exact cell references and corrected values. The supplied workbook equals the archived reviewed tracker byte-for-byte. Reconciled the stale recovery project projection: Spine committed 10.1B→13B, Dalmatia 1.3B→5.4B, Defense Infrastructure 1.2B→1.4B; added National Oil Drilling (13B cost, 8.5B paid, 4.5B committed). Seven projects total 61.6B cost, 24.72B source-paid, 36.88B remaining committed, zero funding gap. All are funded; no completion or production is inferred.

Approved national budget 255B, defense 82B and every canonical assertion remain unchanged. Old workbook 250B/100B values are not replayed. Rail ETA formula and after-fudge cost deduction are documented defects, not accepted facts. UI now distinguishes cost, paid, committed, gap and funding coverage. No migration/dependency/new ledger entries. All 59 tables compared: only projects and append-only audit changed; 57 other tables identical.

Shared project-reconciliation.ts verifies the original, source lines and checksum, refuses customized/stale rows, applies the whole repair atomically and uses an idempotent audit receipt. npm run reconcile:projects previews; add -- --apply to execute. scripts/import.ts invokes it after reviewed import during setup, so fresh reconstructions retain the fix. Project funding calculations require explicit tracker semantics and keep currencies/unknowns separate. Do not silently reapply old seed rows to a later installation.

Validation: 178 domain/API tests, 36 desktop/emulated-phone checks, typecheck, source verification and production build. Pre-change runtime backups: app/backups/before-project-reconciliation-2026-10-22.sqlite and .zip. Preservation results: app/backups/project-reconciliation-preservation-check.json (ignored). Post-fix portable backup: app/backups/projects-reconciled-2026-10-22.zip; isolated restore app/data/project-reconciliation-restore-proof.sqlite matches all 59 live tables. Schema remains 1–8. No runtime databases/backups committed.

Branch fix/project-finance-reconciliation-2026-10-22 builds on feature/treasury-2026-10-22. Earlier feature PRs remain dependencies. Hosted Site unchanged. Resume the directive's separately tested Parliament increment after this finance correction; do not restart the architecture audit.

# Treasury update — 22 October 2026

The dated Treasury display increment is complete. See [TREASURY_REDESIGN.md](TREASURY_REDESIGN.md) for exact coverage, validation and limitations. Six economic headlines, comparison bars, defense share, program funding and separate appropriation/transaction/evidence registers now replace the generic economic card grid. No data, approved financial amounts, schema or dependencies changed. All 59 tables match the checkpoint and isolated restored copy. Undated economic references never substitute into historical charts. Appropriation base commencement remains unknown and explicitly labeled.

Validation: 174 domain/API tests, 36 desktop/emulated-phone browser checks, typecheck, build and 14 source hashes passed. Runtime recovery evidence is in app/backups/treasury-preservation-check.json (ignored). Checkpoint tag checkpoint/treasury-2026-10-22 protects unified-records commit 6c7d070. Branch feature/treasury-2026-10-22 builds on feature/unified-records-2026-10-22; prior review branches remain dependencies. Hosted Site unchanged. Next: a separately tested Parliament increment. All later directive phases remain pending.

# Session handoff — unified records, 22 October 2026

Latest user directive: repository docs/USER_RECORDS_DIRECTIVE.txt. RNAS is primarily a national records/archive/administration system. The architecture audit is complete; do not restart it. Freeze autonomous simulation, automatic national decisions and AI-first extraction expansion while preserving functioning code. This supersedes the earlier report-first/simulation priorities below.

Read UNIFIED_RECORDS.md, UNIFIED_RECORDS_VALIDATION.md and repository ARCHITECTURE.md. First tested increment: prominent New Record entry; five categories; typed registry with nine guided forms and seven existing specialized workflow destinations. Guided forms save incomplete drafts, review human-readable effects/links/unknowns, then require explicit approval/reason. Drafts persist in SQLite and backups; final saves are transactional/idempotent, and changed dependencies require re-review.

Native forms cover sourced people/institutions/organizations, bill+linked existing/new sponsor, appointment+existing/new person, formation, deployment order, treaty+participating states/one missing state, and historical event+multiple existing entities/one missing entity. Natural department actions reuse them. Timeline entity links are visible in Archive; Parliament shows sponsor/source. Existing Battles, vote, finance, project, location and source tools remain accessible; their interfaces are not all converted to guided drafts.

Migration 008 adds five draft/citation/link tables. Backups made before migration; all 53 prior data tables remain identical, only migrations gain version 8. Five new tables remain empty in production. No new canon, economic values or fixtures were inserted. All 59 tables match an isolated schema-8 portable restore. Latest working DB remains app/data/reunion.sqlite; use the schema-8 portable backup documented in UNIFIED_RECORDS_VALIDATION.md.

Validation: 169 domain/API tests, 34 desktop/phone browser tests, typecheck, production build, 14 source hashes and recovery checks passed. Branch feature/unified-records-2026-10-22 builds on audit commit a2fd6a94ead2a8c655a5289af240e03ca058125e. Work is a bounded first slice, not all six phases. Hosted Site unchanged.

Next: follow the requested incremental order. Close missing connected-record cases as needed; then build a dated Treasury display from existing verified economic records without changing approved amounts or inventing charts. Parliament, Cabinet/military directories and full universal search follow separately. Versioned subsystem exchange/bulk import previews remain future work; no separate campaign simulator or live integration now.

# Session handoff, 22 October 2026 — architecture and recovery

User priority: audit/repair architecture before any additional major RNAS features, preserve canon and approved budget, then provide every-feature rundown. Attachments were references, not a new six-step redesign instruction. Read repository ARCHITECTURE.md, this folder ARCHITECTURE_AUDIT.md, FEATURE_RUNDOWN.md and AUDIT_VALIDATION.md first. These supersede the earlier next-task priority below.

Checkout: local `Reunion/rnas`, application in `app/`, work branch `audit/architecture-2026-10-22`. Starting commit 485a3cf62327807def3ae18e8a47aa7d4ab8a155 is protected by local checkpoint tag, GitHub checkpoint branch and separate Git bundle. Never commit runtime databases/backups.

The old chat was deleted and no earlier live RNAS database was recovered in the checked locations. Rebuilt reviewed baseline has 123 sources, 90 entities, 157 assertions, 47 timeline rows, 27 battles, 5 units and zero later reports/operational budgets/ledger entries. Approved historical financial assertions remain intact. Do not infer that the empty operational ledger is lost canon or populate it automatically.

Database-only and portable restore succeeded into separate destinations; all 54 tables match the pre-edit backup exactly. Working database is `app/data/reunion.sqlite`. Portable backup is `app/backups/reunion-recovered-baseline-2026-10-22.zip`; keep independently of chats. Details and verification JSON paths are in AUDIT_VALIDATION.md.

Repairs: reviewed-import rollback guards; shared financial validation/write for manual/report paths; future hierarchy checks; shared restore/FK/migration validator; platform-aware Python for portable/ZIP; ordinary record commands outside HTTP; removal of legacy battle/casualty bypass; loopback defaults and shared OOB snapshot. No migrations or canonical/financial row edits. Direct battle/casualty admin commands now reject; use reviewed Battles/Report Center.

Fresh checks: 156 domain/API tests, 26 desktop/phone browser flows, typecheck, production build and all 14 source hashes passed. Prior browser-pending statements below are historical. The hosted Site remains unchanged. No general simulation/AI extraction, full accounting/procurement or complete historical department semantics is claimed.

Next: retain backups; resolve per-register historical semantics and administrative projection tests; extract remaining department contracts/UI and bounded overview reads; consolidate legacy event drafts. Add new major domains only through shared reviewed operations. Preserve the open calendar questions and approved $255B/$82B framework.

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
