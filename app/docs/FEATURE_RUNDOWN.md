# RNAS feature rundown

Current consolidated baseline: 26 October 2026. This describes implemented behavior and its limits; a database table or menu item alone is not a finished subsystem. See [baseline verification](BASELINE_2026-10-26.md), [architecture](../../ARCHITECTURE.md) and [current status](IMPLEMENTATION_STATUS.md). Earlier notes are preserved under [history](history/before-verified-baseline-2026-10-26/README.md).

The application is a national records/archive/administration system. General National Report Center is mothballed. Simulation and AI-first extraction expansion remain frozen. No external AI account or autonomous simulation is needed for the working records workflows.

The reviewed live baseline has 123 sources, 90 identities, 157 assertions, 47 timeline entries, 27 battles, five formations, twelve procurement observations and seven projects. Empty operational registers remain empty; there are no seeded actual ledger transactions or production test drafts/reports. These counts describe this verification point, not future user activity. The missing deleted-chat runtime database was not recovered; later lost activity cannot be reconstructed from these counts.

## 1. Shared navigation, search and historical context — working

- Sixteen destinations grouped into overview, administration, security/external affairs and records/decisions. Desktop sidebar and phone navigation toggle.
- National historical-date selector, comparison against another date and concise department descriptions.
- Unified search covers fourteen primary operational register types, archive identities/facts/events, source metadata and preserved passages. Broad category/type filters and twelve-result pages lead to exact records, explicit related records and original evidence. Results cover all dates/statuses and do not imply current approval. Department-specific searches remain available; detailed history child records have the limits documented in UNIVERSAL_SEARCH.md.
- Subject/related-record selectors share broad groups, name search and short pages. Multi-record checkboxes keep selected links visible across categories and draft reloads. Long source lists are searchable too. Readable fact labels/values, expandable evidence and technical details, notices and validation errors.
- Historical precision distinguishes exact days, months, years, decades, ranges, before/after, relative and unknown dates. Recorded timestamps remain separate.
- **Limit:** some operational department lists still show all recorded history beneath the global date. OOB now consistently uses latest preceding observations; Archive explicitly covers all dates. Do not interpret every department list as a complete historical snapshot.

## 2. National Dashboard — working bounded overview

- Resolved President, Vice President, monarch and heir; economic position, government/territory context, armed-forces summary and review warnings.
- Quick route to New Record and date comparison.
- Darius Younger is shown as VP; superseded Jack Younger evidence stays in Archive. No designated heir is preserved. 1725 material stays outside active national administration.
- **Limit:** the dashboard reflects available sourced records. It does not calculate an autonomous national condition, updated production, treasury cash or simulated readiness.

## 3. New Record, drafts and saved details — working bounded workflow

Choose a broad category, choose the record type, fill its specialized form, review the proposed changes and evidence, then explicitly approve and save. Incomplete drafts are stored in SQLite and survive reload/restart/backup. Repeated final-save requests return the same result rather than duplicating effects.

| Guided type | Working behavior |
| --- | --- |
| Person | Named identity and sourced historical account; known details and explicit canon/date precision. |
| Institution | Institution identity and sourced account, without invented officeholders or legal authority. |
| Organization | Organization identity and sourced account, without inferred affiliation or membership. |
| Legislative bill | Identifier, title, introduction date and summary; select a sponsor or create the supplied person inline. Does not pass or enact the bill. |
| Government appointment | Select an office/person or supply a new person inline; existing term/arrangement/reshuffle validation applies. Unknown dates remain unknown. |
| Unit formation | Registers the named formation and supplied branch/type. No invented manpower, hierarchy or readiness. |
| Deployment/order | Existing formation and named destination, plan/order date and authority. Arrival is a separate confirmation. |
| Treaty/agreement | Reported terms/status, participating states and partial/unknown dates. A supplied missing state can be created and linked. No inferred border or financial effects. |
| Historical event | Sourced account with partial/unknown date and explicit related identities; a supplied missing identity can be created and linked. |

Seven other registry entries route to existing specialized workflows: battles/casualties/losses, parliamentary votes, financial transactions, appropriations, projects/programs, named locations and imports. These are not seven additional guided forms.

Long identity/source lists have broad groups, name search and short pages. Multiple relationships use checkboxes and a visible selected-link summary; filtering does not silently drop chosen IDs. Saved receipts open the exact stored record, source lines and explicit related records. Current fields across all dates remain separate from the original submitted payload/citations and the historical selector. Related financial/office/location/bill records have Back navigation; unit and archive identity links open their existing profiles.

**Partial:** there is not yet a specialized form for every proposed record type, nor inline creation of every prerequisite in every department. Saved details are not complete biographies or departmental dossiers.

## 4. National Report Center — mothballed at user request, 26 October 2026

The general center is removed from navigation and review entry points until reliable intake detection exists. Use New Record for explicit entries and Battles for reviewed after-action reports. No automatic detection, external AI or new simulation was added.

Existing report originals, proposals, audit/approval history, APIs and transactional domain services remain preserved. The working Battles workflow continues to use those services. Mothballing does not delete data or reverse earlier effects. General report review UI is intentionally unavailable; retained report data remains in full backups and the existing report API.

## 5. Government and monarchy — working read model; incomplete history

- One resolved leadership slot per office, with uncertainty and supporting evidence.
- Source-backed profiles retain earlier terms, personal facts and linked mentions without making every raw assertion a second current officeholder.
- Corrected heir/VP canon and archive-only historical royal material are preserved.
- **Partial:** complete election calendars, reign/administration histories, succession procedures, executive-order lifecycles and automated cabinet deliberation are not implemented. Unconfirmed dates stay open.

## 6. Cabinet and institutions — working roster and appointment slice

- Leadership area and compact searchable ministry roster; separate deputies, institutions and historical records.
- Proper ministry/office names replace internal classifications on ordinary pages. Institutions such as the RIA remain distinct from ministries.
- Click an officeholder for known appointment/affiliation/responsibilities, term history, personal records, legislation/event mentions and original evidence. Unknown details are marked unrecorded. No portraits were invented.
- Create an office; appoint an existing person or explicitly supply a new person inline. Related creation/appointment/audit is transactional.
- Guards against conflicting exclusive dated terms; supports acting/joint arrangements and preserved undated succession sequence.
- **Partial:** observations are not automatically converted into fully dated appointment records. The known June 25 Rehn/Curro succession does not establish every missing term start. Full institutional legal-authority and policy/project administration remain unfinished.

## 7. Parliament — working manual legislation/vote slices

- Assembly/party composition, visual seat display, 400-seat practice and the unresolved constitutional 300-seat maximum.
- Create a bill with identifier, title, sponsor, date, summary and source.
- Dated legislative stages/history use existing shared reviewed services. Those backend services remain preserved while the general Report Center UI is mothballed; no automatic enactment is inferred.
- Record yes/no/abstention/absence/vacancy totals against explicitly applicable voting capacity. Supply a sourced threshold; absent one, legal result remains undetermined.
- Suspension/authority warnings require explicit justification. A recorded vote does not silently enact legislation.
- **Partial:** committees, amendments, debates, individual-member/bloc vote management, election/district administration, coalition modeling, presidential procedure and political vote simulation are not complete. Bills, votes and legislative events have dated views and explicit all-recorded-history modes. Composition observations do not establish a complete historical chamber or named membership.

## 8. Armed Forces — working dated observations and orders

- Register formations; record dated hierarchy, commander, garrison, personnel bounds, authorized strength, readiness, mission, supply and operational state.
- OOB reads the shared latest-observation selector and labels the result as recorded observations. Explicit zero strength remains distinct from unknown.
- Hierarchy validation rejects same-date ambiguity, self-cycles and cycles caused at later dates by backdated changes.
- Issue a planned/ordered movement to a known place; separately confirm arrival. Arrival cannot precede order, and orders do not become completed deployments merely because time advances.
- Treaty restrictions warn at order and arrival; reasoned overrides remain recorded.
- Searchable expandable formation hierarchy, sourced unit profiles, manpower/equipment views and shared deployment registers are implemented. Missing/cyclic links are flagged without repairing history. **Partial:** complete attachment/service lifecycles, replacement flows and computed supply/readiness remain unfinished. No national manpower total or automatic strength changes are inferred.

## 9. Battles and after-action reports — working reviewed workflow

- Dedicated Battles section, searchable battle register, historical casualties and report/phase queue.
- Create a new battle or select an existing one in the same workflow. Preserve the English account, name/date precision/location/theater, participants/belligerents, outcome, casualties and equipment losses.
- Select existing formations, explicitly create a supplied formation inline, or retain unresolved participant names without inventing an OOB identity.
- Keep KIA, WIA, MIA, POW and unspecified categories separate. Blank/null means unknown; zero is an explicit report. Combat phases remain separate references.
- Suggest bounded details from English, review/correct/reject, then approve one transaction for battle/phase/participants/casualties/losses/timeline/audit.
- Matching references corroborate without duplicating casualties; conflicts and stale state require review. Report history survives restart.
- Explicit uniquely tracked asset loss/damage can change state with count 1, exact date and assignment/chronology validation. Prior states/assignments remain preserved.
- Legacy direct battle/casualty writes now refuse and direct the user to reviewed after-action entry. Existing historical rows are retained.
- **Limits:** no inferred strength/readiness/territory/cash effects or anonymous inventory deductions. English suggestions are not a general military analysis engine. Altis B026/B027 already retain relative October 1992 labels; exact phases/current-date/ceasefire calendar still require the remaining decisions.

## 10. Assets and procurement — partial

- Individually register named vessels/aircraft/assets and their status. Assign assets to formations with date history and exclusive-assignment guards.
- Undelivered/purchased-only equipment cannot silently become operational or assignable. The procurement register distinguishes ordered, delivered and operational counts at recorded observation dates. Source funding claims do not become ledger entries automatically.
- Selected reported asset losses/damage participate in battle transactions.
- **Missing:** complete batch delivery/acceptance transitions, partial deliveries, equipment-by-unit aggregate inventories, replacement/maintenance pipelines and full fleet/wing service records. A procurement table is not a complete procurement system.

## 11. Economy and Treasury — working stage ledger; partial national finance

- Source-backed historical economic observations and the preserved reviewed spending/defense framework.
- Create a supplied, sourced operational appropriation account with fiscal year/currency/limit. Seed allocations are not automatically legal appropriations.
- Record proposed, authorized, appropriated, committed, disbursed or actual entries. Stages remain separate; summing them together would double-count the same lifecycle.
- Manual entry and report approval share date-specific funding and future cumulative checks, reference deduplication/conflict detection, safe whole-unit amounts and reasoned overrun handling.
- Explicit additional appropriations increase the limit once and preserve before/after adjustment history. Restating a total is not assumed to be an increase.
- Reference/evidence history, historical limits and economic project snapshots with planned/approved/paid/committed figures and notes.
- **Missing:** balanced transfers/reallocations, returns/cancellations/reversals, full double-entry cash/accrual accounting, reconciled national debt/revenue/trade/tax and milestone automation. Unsupported accounting actions are no longer offered as if implemented. $95B is a projection, not an automatic realized deficit/debt posting.

### Preserved national framework and projects

The approved annual spending framework remains $255B, including $82B defense. The retained $160B revenue estimate gives a $95B projected gap; this is not an automatically realized cash deficit or debt posting. These are sourced dated observations, not a live accounting balance.

Seven reviewed project envelopes total $61.6B source-reported cost, $24.72B source-reported paid and $36.88B remaining committed, with zero uncovered funding in that tracker snapshot. Funding coverage does not establish construction completion, equipment delivery, oil production or actual ledger spending. Source line/cell references and the narrow corrections are in [PROJECT_FINANCE_AUDIT.md](PROJECT_FINANCE_AUDIT.md).

## 12. Military Map and territory — named-place workflows; map planned

- Named location register with separately recorded sovereignty, practical control and administration. Optional coordinates must be supplied together; none are guessed.
- Movement/arrival register and completed deployment history work without map geometry.
- Territory/population displays source-backed geographic observations and Šibenik DMZ context.
- **Missing:** verified operational map assets, interactive markers, boundary drawing, annotation, historical territory layers and a geographic simulation. The map screen openly states this limitation.

## 13. Foreign Relations — partial

- Register treaties/signatories, dates, approval/operational status, notes and source. Keep proposals distinct from agreements.
- Restriction records feed movement/arrival warnings. Undated applicability remains uncertain.
- Read source-backed diplomatic claims and open exact treaty/state records and evidence through search.
- **Missing:** complete articles/obligations, compliance/expiration scheduling, foreign-government/embassy history, specialized negotiation/incident workflows and natural-language diplomatic actions. The guided treaty form already supports an explicitly supplied missing state.

## 14. Domestic Security — sourced register only

- Browse/add source-backed domestic/constitutional claims and retain their status/evidence.
- **Planned:** purpose-built incident/investigation/secrecy/intelligence-verification workflows. There is no working national intelligence simulation or access-control classification system.

## 15. Historical Archive and source viewer — working

- Compact collections for Records, Timeline, Sources, Entities and Original text; 25-row pages and full-detail dialogs.
- Word/category/canon/entity/source/1725/date-window filters, unknown-date inclusion and stable sorts. Superseded/rejected claims remain accessible.
- Source/entity/record navigation uses real linked identities; details preserve replacement chains, literal excerpts, line ranges and technical metadata.
- Original-text FTS is read-only, validated, paginated in SQLite and returns true totals. It accepts bounded literal words rather than executing arbitrary FTS operators.
- Opening a source keeps the selected Archive, Cabinet or unit profile underneath; closing the source returns to that record. Source viewer distinguishes stored text checksum from original-artifact checksum/container/path/extraction status. Original text is not silently relabeled as original binary bytes.
- Add entity, sourced fact or sourced timeline entry through shared commands; evidence viewing/search never approves canon automatically.
- **Partial:** general event authoring with inline prerequisites across all domains and a complete semantic entity/event graph remain unfinished. Normalized metadata pagination is still in memory.

## 16. Canon Review Center — working bounded review

- Contradiction, missing-information and proposed-change paths, priorities, status filters, source comparison and review history.
- Accept a source, merge compatible details, replace with an explicitly corrected fact, retain different historical periods, reject, postpone or reopen, subject to the existing schemas.
- Require explanations; retain original assertions, supersession links and append-only decisions/audits.
- Detect normalized predicate conflicts, missing dates/evidence and selected institutional/domain inconsistencies.
- **Limits:** it does not understand every semantic contradiction in raw prose. Closing a review issue does not invent an amendment or automatically synchronize every administrative projection. Reviewed imports cannot be generically rolled back.

## 17. Events, time and scenarios — partial

- Older bounded event parser/preview/approval supports explicit movement effects. Drafts and permanent audit remain available.
- Preview time advancement and approve clock-only change without inventing off-screen completed events.
- Scenario originals/proposals persist separately and cannot update canon through ordinary approval.
- **Missing:** autonomous political/economic/military simulation, model/provider calls, reproducible simulation rules/seeds, complete election/treaty/debt/project/procurement scheduler and automatic outcomes. Legacy event orchestration still needs consolidation with reports.

## 18. Imports, exports and recovery — working with stated boundaries

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
