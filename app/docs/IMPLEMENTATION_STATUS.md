# Current RNAS implementation status

Verified consolidated baseline, 26 October 2026. Runtime code equals tested revision 87cd925; consolidation adds documentation and a schema-upgrade regression check. Source/review branch: release/verified-baseline-2026-10-26, targeting main. This is a review baseline, not a hosted deployment or a claim that every original specification is complete.

Read [full feature rundown](FEATURE_RUNDOWN.md), [baseline verification](BASELINE_2026-10-26.md), [architecture](../../ARCHITECTURE.md) and [next work](ROADMAP.md). Older dated status notes remain in [history](history/before-verified-baseline-2026-10-26/IMPLEMENTATION_STATUS.md).

## Working scope and boundaries

| Area | Implemented | Still limited or missing |
| --- | --- | --- |
| New Record | Five categories, nine guided types, seven routes to existing specialized workflows; drafts, review, explicit approval, receipts and related-record/source navigation | Not every proposed type or inline prerequisite is supported |
| Search and Archive | Fourteen primary operational types plus identities/facts/events/source metadata/passages; broad filters, paging, exact details, full Archive/source provenance | Not every child-history row or native departmental dossier; search/stored details cover all recorded dates |
| Dashboard, Government and Cabinet | Dated leadership, separate Presidency/Crown, searchable directory, office/person profiles and explicit appointment operations | Sparse source dates/affiliations/responsibilities remain unknown; full election/reign/institutional histories incomplete |
| Parliament | Source-assigned 400-seat chart/party profiles, separate constitutional cap 300, dated composition and legislative/vote registers, sourced manual bill/vote operations | Occupied seats and named member mandates not established; no inferred amendment, restored session or enactment |
| Armed Forces and deployments | Searchable hierarchy, latest sourced observations, profiles, personnel/equipment views and shared order/arrival register | No inferred national strength/readiness, complete procurement/service/attachment lifecycles or operational map geometry |
| Battles | Combined reviewed engagement/phase/casualty/equipment workflow, explicit identities, unknown versus zero, provenance and transactional approval | No anonymous inventory deduction, incompatible casualty aggregation, automatic strengths or combat simulation |
| Economy and projects | Dated source observations; six separate ledger stages and dated funding/reference validation; seven tracker-reconciled envelopes | No invented ledger entries, complete cash/accrual/debt/revenue accounting, balanced transfers/reversals or automatic project completion |
| Territory and diplomacy | Named locations with separate sovereignty/control/administration, treaties/states, restrictions and explicit deployment warnings | No guessed map/borders, complete treaty article/compliance/negotiation workflows or automatic diplomatic effects |
| Domestic Security | Sourced domestic/constitutional claims | Specialized investigations/incidents/secrecy/intelligence workflows remain planned |
| Canon review and time | Source comparisons, reasoned preserved decisions, bounded legacy event previews and explicit clock changes | No semantic understanding of all prose or automatic national outcomes |
| Import/export/recovery | Original staging, reviewed/idempotent seed imports, bounded rollback protections, dated snapshot exports, database and portable backups with verification | Staging is not OCR/canon extraction; subsystem exchange previews/sync/recurring off-machine backups are not implemented |
| National Report Center | Mothballed at user request; existing originals/APIs/services retained for evidence and working Battles | General report intake/review UI unavailable; no reliable automatic detection added |

## Verification and data

219 domain/API tests, 66 desktop/emulated-phone browser checks, typecheck, production build, source verification and read-only integrity/FK checks passed for this baseline. The new regression covers schema-7 reconstruction → schema-8 upgrade without changing existing data/history. Browser tests use a temporary database; phone tests use Chromium emulation, not physical Safari.

All 59 live tables equal the checkpoint and isolated portable restore. A fresh setup independently reproduces 25 core tables when recording timestamps are excluded; a second setup leaves all 59 fresh tables unchanged. Portable backup verifies 46 files; all 14 protected original text hashes match. No production fixtures or canonical/economic-budget changes in this consolidation.

The live baseline contains 123 sources, 90 identities, 157 assertions, 47 timeline records, 27 battles, five formations, twelve procurement observations and seven projects. Operational appropriations, ledger entries, movements, tracked assets and guided drafts/reports are empty in the reviewed baseline; empty pages must not be filled with invented records. These counts describe verification time only.

The missing deleted-chat database was not recovered. Git reconstructs the reviewed source baseline and approved project reconciliation; a runtime backup is required to recover later user activity. Source material, superseded claims, uncertainty, current canon and approved financial values remain preserved. General National Report Center is mothballed, and simulation/AI-first expansion remains frozen.
