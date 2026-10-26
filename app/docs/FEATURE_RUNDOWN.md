# Latest changes — 26 October 2026

All nine guided saved receipts now open the exact stored record, its source lines and explicitly linked people/states/formations. This works immediately after saving and when reopening a receipt. Current stored fields are labeled across all recorded dates, separately from the historical selector and preserved approval receipt. See [Saved record details](SAVED_RECORD_DETAILS.md).

Broad categorized/searchable record choices and connected archive search are working. General National Report Center is mothballed at the user's request; its data/services and reviewed Battles workflow are preserved. Read [Record selection and connections](RECORD_CONNECTIONS.md) for the latest scope. The dated entries below retain earlier implementation history; the numbered feature guide reflects current behavior.

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

# Records-first update, 22 October 2026

New Record is now the primary creation interface: category → type → purpose-built form → readable review → explicit save. It has nine guided types with database-backed drafts, linked identities/source citations and immutable save receipts, plus access to seven existing specialized workflows. See UNIFIED_RECORDS.md for exact coverage and remaining phases, and UNIFIED_RECORDS_VALIDATION.md for the new 169-test/34-browser-check results. RNAS is now primarily records/archive/administration; simulation and AI-first extraction expansion are frozen. The earlier inventory below remains useful for preserved subsystems, but its report-first priority and schema-7 counts are superseded.

# RNAS full feature rundown

Verified against the repository and local reconstructed baseline on 22 October 2026. This is a feature inventory, not a claim that every historical statement has been normalized or every requested subsystem is finished. See `AUDIT_VALIDATION.md` for exact checks.

**Working** means a usable bounded workflow exists. **Partial** means useful functionality exists with the stated limits. **Planned** means a screen, claim register or schema must not be mistaken for the requested full system.

## Recovered state and preservation

The local app was reconstructed from Git's preserved evidence and reviewed seed. It contains 123 source records, 90 entities, 157 assertions, 47 timeline rows, 27 battles, 5 units, 4 legacy casualty rows, 29 decisions and 2 appointment rows. Assertion statuses: 83 confirmed, 60 provisional, 11 superseded, 2 disputed and 1 unknown. There are 205 stored issues; that count includes historical/resolved/deferred issues and is not a count of urgent current decisions.

The reconstructed database contains **no subsequent user reports, operational appropriation accounts or ledger entries**. Those would require a surviving later database/backup. Existing economic canon remains preserved in source-backed assertions, including the accepted $255B annual and $82B defense framework. Empty operational accounts do not mean the approved framework was removed.

All 54 tables matched the checkpoint after this audit. No invented canon, test report, financial transaction or synthetic department record was inserted into the working database. Browser tests use an isolated database.

## 1. Shared navigation, search and historical context — working

- Sixteen destinations grouped into overview, administration, security/external affairs and records/decisions. Desktop sidebar and phone navigation toggle.
- National historical-date selector, comparison against another date and concise department descriptions.
- Global search covers preserved source text, sourced facts, historical events and entity identities. Results open the exact archive detail, related records/events and line-numbered evidence. Archive matches cover all dates/statuses; they do not imply current approval. Specialized operational registers still have their own search.
- Subject/related-record selectors share broad groups, name search and short pages. Multi-record checkboxes keep selected links visible across categories and draft reloads. Long source lists are searchable too. Readable fact labels/values, expandable evidence and technical details, notices and validation errors.
- Historical precision distinguishes exact days, months, years, decades, ranges, before/after, relative and unknown dates. Recorded timestamps remain separate.
- **Limit:** some operational department lists still show all recorded history beneath the global date. OOB now consistently uses latest preceding observations; Archive explicitly covers all dates. Do not interpret every department list as a complete historical snapshot.

## 2. National Dashboard — working bounded overview

- Resolved President, Vice President, monarch and heir; economic position, government/territory context, armed-forces summary and review warnings.
- Quick route to New Record and date comparison.
- Darius Younger is shown as VP; superseded Jack Younger evidence stays in Archive. No designated heir is preserved. 1725 material stays outside active national administration.
- **Limit:** the dashboard reflects available sourced records. It does not calculate an autonomous national condition, updated production, treasury cash or simulated readiness.

## 3. National Report Center — mothballed at user request, 26 October 2026

The general center is removed from navigation and review entry points until reliable intake detection exists. Use New Record for explicit entries and Battles for reviewed after-action reports. No automatic detection, external AI or new simulation was added.

Existing report originals, proposals, audit/approval history, APIs and transactional domain services remain preserved. The working Battles workflow continues to use those services. Mothballing does not delete data or reverse earlier effects. General report review UI is intentionally unavailable; retained report data remains in full backups and the existing report API.

## 4. Government and monarchy — working read model; incomplete history

- One resolved leadership slot per office, with uncertainty and supporting evidence.
- Source-backed profiles retain earlier terms, personal facts and linked mentions without making every raw assertion a second current officeholder.
- Corrected heir/VP canon and archive-only historical royal material are preserved.
- **Partial:** complete election calendars, reign/administration histories, succession procedures, executive-order lifecycles and automated cabinet deliberation are not implemented. Unconfirmed dates stay open.

## 5. Cabinet and institutions — working roster and appointment slice

- Leadership area and compact searchable ministry roster; separate deputies, institutions and historical records.
- Proper ministry/office names replace internal classifications on ordinary pages. Institutions such as the RIA remain distinct from ministries.
- Click an officeholder for known appointment/affiliation/responsibilities, term history, personal records, legislation/event mentions and original evidence. Unknown details are marked unrecorded. No portraits were invented.
- Create an office; appoint an existing person or explicitly supply a new person inline. Related creation/appointment/audit is transactional.
- Guards against conflicting exclusive dated terms; supports acting/joint arrangements and preserved undated succession sequence.
- **Partial:** observations are not automatically converted into fully dated appointment records. The known June 25 Rehn/Curro succession does not establish every missing term start. Full institutional legal-authority and policy/project administration remain unfinished.

## 6. Parliament — working manual legislation/vote slices

- Assembly/party composition, visual seat display, 400-seat practice and the unresolved constitutional 300-seat maximum.
- Create a bill with identifier, title, sponsor, date, summary and source.
- Report-driven considering/introduced/passed/enacted stages, sourced legislative event history and duplicate/corroboration handling.
- Record yes/no/abstention/absence/vacancy totals against explicitly applicable voting capacity. Supply a sourced threshold; absent one, legal result remains undetermined.
- Suspension/authority warnings require explicit justification. A recorded vote does not silently enact legislation.
- **Partial:** committees, amendments, debates, individual-member/bloc vote management, election/district administration, coalition modeling, presidential procedure and political vote simulation are not complete. The legislative register shows furthest reported stage rather than a universally reconstructed historical chamber.

## 7. Armed Forces — working dated observations and orders

- Register formations; record dated hierarchy, commander, garrison, personnel bounds, authorized strength, readiness, mission, supply and operational state.
- OOB reads the shared latest-observation selector and labels the result as recorded observations. Explicit zero strength remains distinct from unknown.
- Hierarchy validation rejects same-date ambiguity, self-cycles and cycles caused at later dates by backdated changes.
- Issue a planned/ordered movement to a known place; separately confirm arrival. Arrival cannot precede order, and orders do not become completed deployments merely because time advances.
- Treaty restrictions warn at order and arrival; reasoned overrides remain recorded.
- **Partial:** full tree/attachment management, replacement flows, computed supply/readiness and automatically updated personnel strengths are not implemented. Unknown commanders and dates are not generated.

## 8. Battles and after-action reports — working reviewed workflow

- Dedicated Battles section, searchable battle register, historical casualties and report/phase queue.
- Create a new battle or select an existing one in the same workflow. Preserve the English account, name/date precision/location/theater, participants/belligerents, outcome, casualties and equipment losses.
- Select existing formations, explicitly create a supplied formation inline, or retain unresolved participant names without inventing an OOB identity.
- Keep KIA, WIA, MIA, POW and unspecified categories separate. Blank/null means unknown; zero is an explicit report. Combat phases remain separate references.
- Suggest bounded details from English, review/correct/reject, then approve one transaction for battle/phase/participants/casualties/losses/timeline/audit.
- Matching references corroborate without duplicating casualties; conflicts and stale state require review. Report history survives restart.
- Explicit uniquely tracked asset loss/damage can change state with count 1, exact date and assignment/chronology validation. Prior states/assignments remain preserved.
- Legacy direct battle/casualty writes now refuse and direct the user to reviewed after-action entry. Existing historical rows are retained.
- **Limits:** no inferred strength/readiness/territory/cash effects or anonymous inventory deductions. English suggestions are not a general military analysis engine. Altis B026/B027 already retain relative October 1992 labels; exact phases/current-date/ceasefire calendar still require the remaining decisions.

## 9. Assets and procurement — partial

- Individually register named vessels/aircraft/assets and their status. Assign assets to formations with date history and exclusive-assignment guards.
- Undelivered/purchased-only equipment cannot silently become operational or assignable. Imported procurement batches distinguish orders, quantities, paid/committed figures and operational count.
- Selected reported asset losses/damage participate in battle transactions.
- **Missing:** complete batch delivery/acceptance transitions, partial deliveries, equipment-by-unit aggregate inventories, replacement/maintenance pipelines and full fleet/wing service records. A procurement table is not a complete procurement system.

## 10. Economy and Treasury — working stage ledger; partial national finance

- Source-backed historical economic observations and the preserved reviewed spending/defense framework.
- Create a supplied, sourced operational appropriation account with fiscal year/currency/limit. Seed allocations are not automatically legal appropriations.
- Record proposed, authorized, appropriated, committed, disbursed or actual entries. Stages remain separate; summing them together would double-count the same lifecycle.
- Manual entry and report approval share date-specific funding and future cumulative checks, reference deduplication/conflict detection, safe whole-unit amounts and reasoned overrun handling.
- Explicit additional appropriations increase the limit once and preserve before/after adjustment history. Restating a total is not assumed to be an increase.
- Reference/evidence history, historical limits and economic project snapshots with planned/approved/paid/committed figures and notes.
- **Missing:** balanced transfers/reallocations, returns/cancellations/reversals, full double-entry cash/accrual accounting, reconciled national debt/revenue/trade/tax and milestone automation. Unsupported accounting actions are no longer offered as if implemented. $95B is a projection, not an automatic realized deficit/debt posting.

## 11. Military Map and territory — named-place workflows; map planned

- Named location register with separately recorded sovereignty, practical control and administration. Optional coordinates must be supplied together; none are guessed.
- Movement/arrival register and completed deployment history work without map geometry.
- Territory/population displays source-backed geographic observations and Šibenik DMZ context.
- **Missing:** verified operational map assets, interactive markers, boundary drawing, annotation, historical territory layers and a geographic simulation. The map screen openly states this limitation.

## 12. Foreign Relations — partial

- Register treaties/signatories, dates, approval/operational status, notes and source. Keep proposals distinct from agreements.
- Restriction records feed movement/arrival warnings. Undated applicability remains uncertain.
- Read source-backed diplomatic claims.
- **Missing:** complete articles/obligations, compliance/expiration scheduling, foreign-government/embassy history, negotiation workflows and natural-language diplomatic actions with inline state creation.

## 13. Domestic Security — sourced register only

- Browse/add source-backed domestic/constitutional claims and retain their status/evidence.
- **Planned:** purpose-built incident/investigation/secrecy/intelligence-verification workflows. There is no working national intelligence simulation or access-control classification system.

## 14. Historical Archive and source viewer — working

- Compact collections for Records, Timeline, Sources, Entities and Original text; 25-row pages and full-detail dialogs.
- Word/category/canon/entity/source/1725/date-window filters, unknown-date inclusion and stable sorts. Superseded/rejected claims remain accessible.
- Source/entity/record navigation uses real linked identities; details preserve replacement chains, literal excerpts, line ranges and technical metadata.
- Original-text FTS is read-only, validated, paginated in SQLite and returns true totals. It accepts bounded literal words rather than executing arbitrary FTS operators.
- Source viewer distinguishes stored text checksum from original-artifact checksum/container/path/extraction status. Original text is not silently relabeled as original binary bytes.
- Add entity, sourced fact or sourced timeline entry through shared commands; evidence viewing/search never approves canon automatically.
- **Partial:** general event authoring with inline prerequisites across all domains and a complete semantic entity/event graph remain unfinished. Normalized metadata pagination is still in memory.

## 15. Canon Review Center — working bounded review

- Contradiction, missing-information and proposed-change paths, priorities, status filters, source comparison and review history.
- Accept a source, merge compatible details, replace with an explicitly corrected fact, retain different historical periods, reject, postpone or reopen, subject to the existing schemas.
- Require explanations; retain original assertions, supersession links and append-only decisions/audits.
- Detect normalized predicate conflicts, missing dates/evidence and selected institutional/domain inconsistencies.
- **Limits:** it does not understand every semantic contradiction in raw prose. Closing a review issue does not invent an amendment or automatically synchronize every administrative projection. Reviewed imports cannot be generically rolled back.

## 16. Events, time and scenarios — partial

- Older bounded event parser/preview/approval supports explicit movement effects. Drafts and permanent audit remain available.
- Preview time advancement and approve clock-only change without inventing off-screen completed events.
- Scenario originals/proposals persist separately and cannot update canon through ordinary approval.
- **Missing:** autonomous political/economic/military simulation, model/provider calls, reproducible simulation rules/seeds, complete election/treaty/debt/project/procurement scheduler and automatic outcomes. Legacy event orchestration still needs consolidation with reports.

## 17. Imports, exports and recovery — working with stated boundaries

- Preserve/check immutable original recovery sources and reviewed seed checksums; idempotent imports retain source provenance and superseded evidence.
- Stage supported text/Markdown/CSV/TSV/JSON/JSONL/conversation-export/ZIP/image files, bounded file counts/size, safe ZIP extraction and duplicate detection. Staging text or images is not complete semantic extraction or OCR.
- Generic normalized rollback retains evidence for eligible unreviewed batches; initial recovery and reviewed/dependency-bearing batches are protected.
- Date-specific JSON, CSV and Markdown national snapshot exports and print styling. These exports are not full database backups or complete specialized dossiers.
- Database download/online backup; portable database-plus-evidence ZIP with hashes, sizes and migration manifest. Platform-aware Python fixes Windows portable generation/ZIP processing.
- Independent portable manifest verifier; read-only integrity/FK/migration verification before offline restore; previous destination saved before replacement. A separate isolated portable restore passed and matched every table.
- **Limits:** no automatic recurring backup, off-machine replication, multiuser authentication, offline phone database, service worker or synchronization. Local start commands bind loopback. The separate hosted Site has not been redeployed or certified by this audit.

## Practical starting workflow

1. Open the local app and select the relevant historical context.
2. Use New Record, choose a broad category and record type, then complete and review the explicit entry. Use Battles for a new/existing engagement with casualties or losses.
3. Preserve what was actually reported. Leave unknown details unknown.
4. Review each proposed effect and its evidence, correct ambiguities with a reason, then approve only the supported changes.
5. Confirm the related department and Archive/history, then make a portable backup after meaningful sessions. Keep that backup independently of the chat.

For unsupported workflows, use a clearly sourced historical record or leave the proposal pending. Do not fill empty screens with invented records or assume that planned subsystems already operate.
