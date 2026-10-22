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
- Global original-text search and entity matches; cited results open line-numbered sources.
- Readable fact labels/values, expandable evidence and technical details, notices and validation errors.
- Historical precision distinguishes exact days, months, years, decades, ranges, before/after, relative and unknown dates. Recorded timestamps remain separate.
- **Limit:** some operational department lists still show all recorded history beneath the global date. OOB now consistently uses latest preceding observations; Archive explicitly covers all dates. Do not interpret every department list as a complete historical snapshot.

## 2. National Dashboard — working bounded overview

- Resolved President, Vice President, monarch and heir; economic position, government/territory context, armed-forces summary and review warnings.
- Quick route to report submission and date comparison.
- Darius Younger is shown as VP; superseded Jack Younger evidence stays in Archive. No designated heir is preserved. 1725 material stays outside active national administration.
- **Limit:** the dashboard reflects available sourced records. It does not calculate an autonomous national condition, updated production, treasury cash or simulated readiness.

## 3. National Report Center — working, with bounded extraction

Main process: **write → preserve original → review proposed changes → correct details/reasons → approve selected changes**.

- Accepts long text (up to 500,000 characters), title, optional exact report date, actual-record/scenario mode and a link to an earlier report for correction context.
- Preserves exact submitted text and source identity. Lists report history, processing/review status and proposed actions.
- Supports individual/bulk selection, partial approval, rejection, deferred pending items, reasoned edits and stale-review/revision protection.
- Approval atomically writes selected department effects, source links, timeline and audit. Repeated submissions/approvals and corroborating references avoid duplicate effects.
- Supported actions: movement orders, confirmed arrivals, archive events, reported bill stages, six financial stages, and structured battle reports.
- Unsupported prose remains preserved with unresolved effects; the system does not pretend it updated every named department.
- **Extraction limits:** movement names/phrasing, explicit bill/finance patterns and bounded battle suggestions. Arbitrary cabinet/diplomatic/multi-paragraph reports are not general AI extraction. No external AI provider is configured or invoked.
- **Correction limit:** a corrective report can link to an earlier report; it does not automatically reverse already-applied domain effects.

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
2. Use National Report Center for supported reported events; use Battles for a new/existing engagement with casualties or losses.
3. Preserve what was actually reported. Leave unknown details unknown.
4. Review each proposed effect and its evidence, correct ambiguities with a reason, then approve only the supported changes.
5. Confirm the related department and Archive/history, then make a portable backup after meaningful sessions. Keep that backup independently of the chat.

For unsupported workflows, use a clearly sourced historical record or leave the proposal pending. Do not fill empty screens with invented records or assume that planned subsystems already operate.
