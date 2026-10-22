# Focused architecture audit — 22 October 2026

Base: `485a3cf62327807def3ae18e8a47aa7d4ab8a156`. Scope: protect/recover data, repair structural integrity, verify current features. The attached earlier audit and usability proposal were reference material, not instructions to execute another full redesign.

## Findings

Severity: P1 = data integrity/recovery or exposure risk; P2 = material maintainability/usability risk; P3 = preference. Fixed items are source-verified and covered by checks below; open items are not presented as repaired.

| Severity / type | Finding and affected files | Correction / status |
| --- | --- | --- |
| P1 defect | `src/lib/importer.ts`: generic rollback could reject a reviewed replacement without reopening decisions or restoring dependent predecessors/projections. | **Fixed:** block user-adjudicated imports, audited reviewed imports and imports with predecessor supersessions. Regression checks assert decisions, issues, records and audits remain unchanged after refusal. Dependency-aware reversal remains future work. |
| P1 defect | `src/lib/admin.ts`, `financial-reports.ts`, `Console.tsx`: manual ledger writes bypassed report date/reference rules; unsupported transfer/return/cancel labels implied effects they did not implement. | **Fixed:** one validated finance write for manual/report operations. Require references and explicit additional-appropriation interpretation; reject unsupported stages. Preserve existing amounts. Tests cover cross-interface corroboration, conflicts, dated increases, backdated effects and atomic refusal. |
| P1 defect | `src/lib/admin.ts`: checking parent ancestry only at insertion date allowed later hierarchy cycles after backdated entry. | **Fixed:** `unit-hierarchy.ts` checks affected future observation dates until superseded by the unit's next observation. Failure leaves state/source/audit rows intact. |
| P1 defect | `scripts/restore.ts`: integrity/table checks accepted foreign-key damage and incompatible migration versions before destination replacement. | **Fixed:** shared read-only `database-validation.ts` checks integrity, foreign keys, exact migration compatibility and core tables before touching destination. `db:check` uses it too. Invalid-FK regression verifies destination bytes unchanged. Older backups require matching code and isolated migration first. |
| P1 defect | `scripts/export-portable.ts`, `api/import/route.ts`: hard-coded `python3` fails on this Windows installation's Store alias. | **Fixed:** shared platform-aware interpreter selection with `RNAS_PYTHON` override and useful process errors. Portable generation and independent manifest verification pass. |
| P1 boundary | `package.json`: development/production defaults exposed unauthenticated reads/backups on all interfaces. | **Mitigated:** defaults bind loopback. Authentication/public hosting is **not implemented**; explicit network exposure still requires access control. No claim that a previous deployment was publicly reachable. |
| P1 structural bypass | `admin.ts`, unused forms in `Console.tsx`: direct battle/casualty commands still offered a second write path beside transactional reviewed after-action reports. | **Fixed:** legacy commands refuse with workflow guidance; unused forms removed. Military and Report Center entry use the existing shared report operation. Historical battle/casualty data stays intact. |
| P2 boundary | `api/rnas/route.ts`: entity/assertion/timeline writes, validation and audits lived in the HTTP switch. | **Fixed:** moved unchanged semantics into `record-commands.ts`. Routes dispatch commands; client components contain no SQL. Read-query separation remains incomplete. |
| P2 defect / open scope | `Console.tsx`, `admin.ts`, `api/rnas/route.ts`: OOB required an exact-day observation while domain service used latest preceding observation. Other registers mix all history with selected-date context. | **OOB fixed:** use shared server snapshot and label observations honestly, including explicit zero personnel. **Remaining:** define/display temporal semantics per procurement, treaty, battle and appointment register before extending historical features. |
| P2 maintenance risk | `Console.tsx` ~3,043 lines; importer ~1,206; battle UI ~1,165; archive UI ~933. Broad `Row`/`Record<string, any>` contracts obscure changes across UI/API/domain. | **Open:** extract remaining department forms/read models and introduce typed DTOs at touched boundaries. File length alone is not a reproduced functional defect. No generic repository framework or rewrite justified. |
| P2 scale risk | `api/rnas/route.ts`, `canon.ts`: overview loads almost every domain plus per-record evidence; normalized Archive pages in memory. | **Open:** bounded department queries and batch evidence retrieval. Source FTS already pages in SQLite. No production-scale latency benchmark was performed. |
| P2 structural risk | `admin.ts` legacy event drafts and `reports.ts` have parallel movement/event approval orchestration with differing provenance. | **Open:** consolidate on typed report commands while retaining old drafts, IDs, clock behavior and audit history. Not needed to replace the working Report Center. |
| P2 test gap | Existing UI tests had not caught up with the Archive redesign; generic status/hidden-option/exact-label selectors failed. Coverage lacked manual finance/report consistency and backdated future cycles. | **Fixed for audited scope:** repaired assertions without weakening intended checks; added integrity, all-department and Treasury workflows. Broader procurement/diplomacy/simulation acceptance is still future work. |

## Separation assessment

UI versus SQL is clear: no SQL in client components. Domain services and report transactions already exist and are worth preserving. HTTP write boundaries are improved; HTTP read aggregation and the broad administration dispatcher still need gradual separation. Canon/evidence are distinct from operational state, but administrative projections are not a universal automatic consequence of reviewed canon. A full simulation engine does not exist, so there is no engine boundary to certify; scenario isolation is implemented and tested.

Cabinet, battle and Archive workflows are more specialized than the earlier attachment described. The two authorized Altis battle labels are already corrected in current code; this audit made no new canon correction. Reject-only report decisions are already supported. Neither old finding should be repeated as an unfixed current defect.

No runtime import cycle was found in a static relative-import scan. No unused-code elimination tool or performance profiler was run. The unused legacy battle forms were directly identified and removed; other possible dead code is not asserted as proven. Adding microservices, an ORM migration, dependency injection or another infrastructure layer would be a preference, not an established repair.

## Protection and verification

- Initial clean clone, tag `checkpoint/architecture-audit-2026-10-22`, working branch `audit/architecture-2026-10-22`, and separate `../reunion-before-audit.bundle` preserve the starting Git state.
- No live database was present in Git. Searches of the checked local project/backup locations and downloaded repository ZIP found no prior RNAS runtime database. The deleted chat's later runtime records cannot be claimed recovered.
- Rebuilt the checked reviewed baseline: 123 sources, 90 entities, 157 assertions, 47 timeline entries, 27 battles, 5 units, 29 decisions. It has **zero national reports, operational budgets and ledger entries**. Historical financial canon is present in assertions/evidence; operational account rows are a separate matter.
- Online database backup and portable backup created outside Git. Portable archive verifies 44 database/evidence files against SHA-256/size manifest; a fresh isolated extraction was restored and validated.
- Compared every row of all 54 tables against the pre-edit backup: working database, initial restore and portable restore are identical. Canon, economic values and original evidence remain unchanged.
- Original baseline: 148 domain/API tests passed. Updated suite: 156 tests passed. Typecheck, production build and all 14 original source hashes passed. Browser results are recorded in `AUDIT_VALIDATION.md`.

## Next corrections, before major expansion

1. Retain verified runtime backups independently of chats/Git. Do not confuse a seed reconstruction with recovery of later activity.
2. Define historical semantics for the remaining administrative registers and test their cross-screen projections.
3. Extract Parliament/Treasury presentation and request contracts while using current shared operations; avoid speculative general abstractions.
4. Consolidate legacy event drafts and bounded department reads before broadening natural-language extraction.
5. Add report domains only as complete, approved, transactional workflows with cross-system tests.
