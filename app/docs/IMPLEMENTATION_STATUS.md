# Record selection and connected archive — 26 October 2026

The latest user request supersedes earlier optional National Report Center availability. General NRC is mothballed; New Record and Battles remain the working entry points. See RECORD_CONNECTIONS.md for scope and limits.

Shared selectors now offer broad browsing groups (People, Government & organizations, Military, Places & nations, Economy & projects, Other records), name search and short pages. Existing kinds and IDs are unchanged. Single choices show up to 12 matches plus any retained selection; multiple relationships show eight checkboxes per page with removable selected links. Filtering, paging and draft reloads retain explicit choices. Long source selectors and Archive entity/source filters use the same chooser.

Global search adds normalized facts and historical events using the existing Archive filters. Facts/events/entity matches open exact archive details; related records/events and source evidence remain connected. Archive results cover all dates and canon statuses, explicitly labeled. This is not complete universal operational-register search; no fuzzy name-to-domain joins or automatic cross-system effects were added.

Validation: 199 domain/API tests, 54 desktop/emulated-phone browser checks, typecheck, build and all 14 source hashes passed. The final layout correction is also browser-verified. Tests use isolated databases; no fixtures enter production. No schema, dependency, canon, budget or project changes. All 59 tables match the before-change checkpoint and isolated portable restore. Backups: app/backups/before-record-connections-2026-10-26.sqlite and .zip (46 verified files); restore proof app/data/record-connections-restore-proof.sqlite; preservation check app/backups/record-connections-preservation-check.json (ignored).

Branch feature/record-connections-2026-10-26 builds on military commit ac06ce79. Earlier draft branches remain dependencies. Hosted Site unchanged. Remaining work: complete typed-domain search/detail navigation, additional specialized guided workflows/inline prerequisites, versioned subsystem import previews, parliamentary mandates and procurement/accounting lifecycles. Keep automatic extraction and simulation expansion frozen.

# Military organization workspace — 25 October 2026

The reattached USER_RECORDS_DIRECTIVE confirms the records-first scope. This bounded military increment is documented in MILITARY_WORKSPACE.md. Armed Forces now has a searchable expandable formation hierarchy, sourced unit profiles, manpower/equipment records and a shared deployment/order register. Known ancestors remain in filtered search; missing/cyclic links are flagged, never silently repaired. Unknown parent means no established chain, not independence.

The shared unitSnapshot exposes existing state fields/provenance. Latest observations retain their dates; no national manpower sum, inferred readiness, inventory distribution or casualty deduction. Procurement uses point observation dates; explicit assignments use intervals, while the mutable asset register is labeled across all dates. Unit battle records use explicit participants/units, preserve phases/categories/unknowns and reuse Battles. No combat simulation or new write path.

The deployment register is shared by Armed Forces, unit profiles and Military Map. It retains source receipts/approval evidence, treaty warnings and arrival confirmation. Orders, arrival and cancellation uncertainty remain distinct; future arrivals and their explanations do not leak into earlier views. No guessed map geometry. Full historical record modes are explicit. Existing critical order-creation checks now inspect future records through full history, then advance the selector before offering arrival.

No schema/dependency/data/source changes. All 59 tables match the checkpoint and isolated restored copy. Validation: 197 domain/API tests, 50 desktop/emulated-phone browser checks, typecheck, production build and 14 source hashes passed. Before-edit backups app/backups/before-military-workspace-2026-10-25.sqlite and .zip (46 files); restore proof app/data/military-workspace-restore-proof.sqlite; preservation evidence app/backups/military-workspace-preservation-check.json (ignored).

Branch feature/military-workspace-2026-10-25 builds on Cabinet commit 83840b0; earlier review branches remain dependencies. Hosted Site unchanged. Next universal typed-domain search/direct detail navigation, then additional specialized guided forms and versioned subsystem exchange/import previews. Batch inventory/service history, non-movement military order types, parliamentary mandates and richer administrative histories remain unfinished. Do not restart the architecture audit or expand simulation.

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

# Current update — records-first slice, 22 October 2026

The newest USER_RECORDS_DIRECTIVE.txt reduces scope to records/archive/administration and freezes simulation/AI-first expansion. See UNIFIED_RECORDS.md and UNIFIED_RECORDS_VALIDATION.md. New Record is available on the homepage/persistent navigation with a typed registry, nine modular guided types, durable drafts, readable review and explicit transactional approval. Seven existing specialized workflows are accessible alongside them. Sponsor, appointee, treaty-state and event-entity relationships are connected and preserved.

Schema 1–8; all 53 prior data tables unchanged, five new tables empty in the working database. Source/financial/canon values preserved. 169 domain/API and 34 desktop/phone browser checks pass, plus typecheck/build/source hashes and isolated 59-table portable restore. Larger redesign/search/exchange phases remain unfinished; do not present the entire new directive as complete.

# Architecture audit update, 22 October 2026

Architecture/integrity audit supersedes the prior next-task recommendation: do not begin major expansion before the open findings in ARCHITECTURE_AUDIT.md are considered. See FEATURE_RUNDOWN.md for every current workflow and limitation, AUDIT_VALIDATION.md for fresh verification, and repository ARCHITECTURE.md for boundaries.

Fixed unsafe reviewed-import rollback, manual/report financial inconsistency, backdated future hierarchy cycles, weak restore validation, Windows Python selection, legacy battle-write bypass and route-owned ordinary record writes. Local start commands now bind loopback. OOB uses the shared latest-observation read model. No schema, approved financial value, original source or existing canon changed.

Reconstructed the checked reviewed seed after loss of the earlier chat; no prior runtime database was recovered. All 54 tables match the pre-edit backup; portable restore verified. This is not recovery of unknown later reports. Fresh verification: 156 domain/API tests, 26 desktop/phone browser flows, typecheck, production build and original-source hashes passed. Remaining major subsystems and temporal/scale risks are listed honestly in the audit/rundown.

# Current implementation status, 20 October 2026

Existing foundation: Next.js App Router, TypeScript, Tailwind, Zod, Node 24 SQLite/FTS5. Existing government, parliamentary, military, fiscal, treaty and time tools remain bounded vertical slices, documented in the root application IMPLEMENTATION_STATUS.md.

## Prior completed slice

- Migration 003: immutable report identity, proposed actions, append-only report review history and original-artifact metadata.
- National Report Center with exact original preservation, history, partial/bulk selection, inline proposed-detail correction, reasoned approval and optimistic revision checks.
- Deterministic extraction of exact-name movement orders and arrivals. Arrival requires an existing eligible order. Other prose is offered as archive events with unresolved administrative effects, not inferred subsystem mutations.
- All selected effects and timeline/audit writes share one transaction and existing domain services. Duplicate submissions and repeat approvals cannot duplicate movements.
- Scenario reports persist separately and cannot update national records. No AI or generated simulation engine is implemented.
- Reproducible reviewed JSON import: 88 source metadata records, 82 nonempty extracted texts, 40 reviewed facts and 27 user answers. Existing rows are preserved. Eight old assertion aliases and three Altis chronology rows are explicitly superseded/corrected.
- Current local database: migrations 1–7; 123 source rows, 157 assertions, 47 timeline rows including three superseded chronology rows, and 29 decision rows. No production/test reports were inserted into national data.
- Online database backup, read-only integrity/migration-version check, and complete portable database-plus-evidence ZIP with verified hashes.

## Parliamentary reports

- Migration 004 preserves existing report actions and adds append-only legislative events and source evidence.
- Bounded explicit bill syntax proposes consideration, introduction, passage or enactment. Review supports existing-bill matching, unknown titles/dates, reported effective dates and reasoned corrections.
- Approved actions update Parliament’s existing bill register and sourced timeline transactionally. Reported passage does not manufacture votes, enactment, appropriations or spending.
- Corroboration reuses an identical legislative event and timeline entry while retaining additional original evidence. Earlier stages do not regress the register; inconsistent chronology and stale bill baselines block approval.
- Bulk approval supports several stages of one bill and rolls back all department effects if any action fails.
- Parliament shows sourced legislative history. The register is the furthest reported stage, not a date-filtered reconstruction. No production legislation or fixture records were added.

## Financial reports

- Migration 005 preserves existing actions/legislative evidence and adds immutable report-linked ledger references, supporting sources and appropriation-adjustment history.
- Review supports proposed, authorized, appropriated, committed, disbursed and actual records, requiring a known budget, exact currency/whole-unit amount/date and transaction reference. Explicit additional appropriations raise limits; ordinary appropriation prose requires a reviewed interpretation.
- Financial actions reuse Treasury’s existing ledger service. Repeated references corroborate without duplicate money or limit increases. Conflicting references, stale budget state, missing funding and currency mismatch block approval.
- A selected earlier additional appropriation can fund a later selected payment in the same atomic approval. Failure anywhere rolls back every selected department change. Over-authorization requires a recorded explicit override; checks account for dated increases and backdated spending.
- Treasury shows references, source lines and limits adjusted for known dated increases. Original base-limit commencement can remain unknown. This is a bounded stage ledger, not full cash/accrual accounting or historical fiscal reconstruction.
- The six reattached source texts match the stored originals byte for byte; no duplicate sources or obsolete-canon overrides were created. No financial fixtures or synthetic spending were inserted into production data.

## Government display correction

- Government now renders one resolved President, Vice President, monarch and heir card. Superseded VP/heir claims and generic royal designations remain in the archive rather than appearing as additional officeholders.
- The heir decision is displayed as “No designated heir” with its undated status; no applicability or appointment date is invented. Dashboard heir wording uses the same register.
- The 1725 campaign is archive-only per the latest user request. Its claims, sources, timeline and identities remain preserved/searchable. Active snapshots, department record views, appointment choices and the current review inbox exclude those historical entries.
- Historical snapshot/export functions retain their records; the active overview is a separate read model. No canon text, date, identity, source or live database row was changed.

## Usability refinement: shared layout and Cabinet

- Implemented the first two steps of the new usability directive, preserved verbatim in repository docs/USER_USABILITY_DIRECTIVE.txt. See USABILITY_REFINEMENT.md for the phased status.
- Grouped navigation into overview/administration/security/records; added useful section descriptions, compact spacing and responsive roster controls. Shared claim metadata/raw values move into expandable evidence/history, with readable labels and values in normal content.
- Replaced Government/Cabinet claim grids with leadership tiles and a compact ministry roster. Separate deputy/institution/history tabs and a local search replace the unrelated political-card feed.
- Source-backed officeholder profiles expose term history, supplied personal records and evidence on demand. Unknown affiliations/dates/responsibilities remain unknown; no portraits were invented. RIA director stays separate from ministries, and Rehn is historical rather than a second current Finance Minister.
- Appoint Minister can create a supplied person inline within the existing appointment transaction. Validation failure rolls back all related creation.
- Steps 1–2 preserved all 48 live tables. The subsequent battle slice below narrowly audits two legacy Altis year labels; accepted financial canon remains unchanged.
- Browser interaction/visual QA remains pending under the managed-preview restriction. Broader Archive/Parliament/Treasury redesign remains unfinished.

## Battles and after-action reports

- Migrations 006–007 preserve report action IDs/status/targets and both prior evidence tables, adding append-only battle phase/participant/casualty/loss/evidence/asset-effect history and explicit loss participant attribution.
- Dedicated Battles navigation and one New Battle / After-Action Report workflow create/select a battle, preserve an English original, enter participants, categorized known casualties, equipment losses and outcome, then review/correct/approve or reject. Supplied formations can be created inline; unresolved names need not become OOB units.
- Approval uses the same report transaction for battle, formations, casualties, losses, selected asset state/assignment changes, timeline and audit. Scenarios cannot update canon. Null casualty counts remain unknown; explicit zero is preserved. Existing casualty groups remain accessible without aggregation.
- A battle/reference identifies a combat phase. Equivalent facts add source evidence without duplicate casualties/losses/timeline; conflicting phase facts remain pending. Concurrent state changes require reasoned re-review. Source lines and review history survive restart.
- Explicit tracked asset loss/damage requires count 1, exact date, eligible state and chronology/assignment checks. Prior asset states/assignments are preserved. No personnel/readiness, anonymous inventory, territory, procurement or financial effects are inferred.
- Bounded read-only English suggestions propose limited date/place/formation/count fields. Review supplies name/reference, outcome, loss attribution and any missing details. This is not general language extraction or an AI provider.
- B026/B027 now read relative “October 1992” with two before/after audits under reviewed user authority; original wording, provisional status and unknown exact days remain intact. All other preexisting data is unchanged except migration rows. No production reports or test fixtures were inserted.
- The compact searchable Archive is implemented below. Browser interaction/visual QA remains pending; the separate hosted Site is unchanged.

## Current completed slice: compact searchable Archive

- Replaced the endless archive claim-card feed with paginated collections for Records, Timeline, Sources, Entities and Original text. Compact results open native detail dialogs with full values, source excerpts, exact replacement links and expandable historical/technical metadata.
- Added word/category/canon/entity/source/1725-collection/date-window filters, stable ordering, bounded pages and explicit unknown-date inclusion. Historical precision is preserved; source/entity metadata is not misleadingly date-filtered. All statuses remain available, while 1725 stays outside active administration.
- Original-text search uses a read-only validated FTS endpoint with true totals and pagination beyond the existing global search's 80-result cap. Source passages open the immutable line viewer. Original-artifact metadata is available separately from stored-text hashes. No search result is promoted to canon.
- Existing creation forms remain accessible; this is not a new curation or general linked-event authoring service. Normalized lists reuse the overview payload and page in memory; FTS passages page in SQLite. Browser interaction/visual verification is pending.
- All 54 live table contents remain unchanged, schema stays 1–7, and there are no production report/test fixtures. The six attached source files match their archived originals. Next is Parliament/Treasury usability with existing financial canon preserved.

## Remaining limits

- Report extraction supports movement orders/arrivals, explicit bill stages, six financial stages and bounded battle suggestions. Appointments, balanced reallocations, reversals, diplomacy and semantic contradiction extraction remain unfinished.
- Unsupported prose can be recorded honestly; it does not update ministries, budgets or forces. One deferred detail issue per report avoids flooding the inbox.
- Corrective reports link to earlier reports; automatic reversal/undo of already-applied department effects is not implemented.
- Latest procurement/funding review remains available as reviewed evidence and canonical claims. Full domain-table reconciliation and lifecycle controls are unfinished; no equipment deliveries or actual spending were invented.
- Per-message Discord import and all-prose normalization remain unfinished. Missing original attachments and maps remain missing.
- The two proposed calendars remain open. No current-clock advancement or election calendar was silently approved.
- The hosted Site exists and is active at version 1. These Next.js source changes have not been deployed to it. No framework or hosting migration was attempted.
- Cloud SQLite persists across ordinary process restarts, not guaranteed task/container recreation. Restore from a portable backup or rebuild a fresh baseline from Git evidence and JSON seed.

Validation results and restrictions are in VALIDATION.md. Git commit/push identifiers belong in the session handoff after the native operations succeed.
