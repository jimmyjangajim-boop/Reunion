# Project finance audit and reconciliation — 22 October 2026

Compared the supplied **Reunion campaign tracker.xlsx** to the live RNAS database and the reviewed reconciliation. The supplied 58,006-byte file is byte-for-byte identical to the already archived `evidence/canon-review-2026-10-20/originals/Reunion campaign tracker(1).xlsx`, SHA-256 `3561412d6b408773a5abdd05d94f8c1c3531f7da5d8a7e41d005f0c9fe133656`. No workbook bytes were changed. Workbook text is source evidence, not development instructions.

## Findings and corrections

| Severity / type | Finding | Affected location | Correction |
|---|---|---|---|
| High — data defect | Recovery projects were never reconciled to the newer reviewed tracker. Three commitment values were stale. | `src/lib/importer.ts` legacy projection; `projects` rows spine/dalmatia/defense-infra; Projects!D2, D3, D7 | Shared, transactional `reconcileProjectTracker()` repairs only the known recovery rows. Setup invokes it after reviewed import. A changed/custom row stops the batch for review rather than being overwritten. |
| High — completeness defect | National Oil Drilling was absent from the register despite inclusion in the reviewed seven-envelope totals. | `projects`; Projects!A8:N8 | Add its $13B cost, $8.5B source-paid and $4.5B committed envelope. Preserve unknown implementation and appropriation. The project name does not establish drilling, production or oil revenue. |
| Medium — display limitation | Paid/cost appeared as the only funding meter. The tracker defines funding coverage as (paid + committed)/cost. | `TreasuryWorkspace.tsx`, now `ProjectPrograms.tsx`; Projects!H2:H8 | Show true funding coverage and unfunded gap for reconciled tracker rows, alongside separate paid and committed amounts. Do not imply physical completion. |
| Medium — workbook formula defect | Rail ETA J6 references G5/E5/K5/I5 (energy), not row 6. Its cached February 1996 ETA is unreliable for rail. | Projects!J6 | Preserve original evidence. Do not import that ETA. With the workbook's own $2.5B cost-less-paid and $0.04B/month assumption, 62.5 months rounded up to 63 implies January 1998, a projection only. |
| Medium — workbook aggregation defect | Dashboard funding coverage omits oil and uses an unweighted average. All included rows are currently 100%, masking the omission. | Dashboard!B15 references Projects!H2:H7 | App uses all seven projects and their separate values. It does not reuse this formula. |
| High — semantic conflict | The workbook's $41.6B “after fudge” total subtracts $2.9B/$4.1B/$13B funding contributions from $61.6B gross costs. That mixes financing sources with project costs. | Projects!F15:G16, N2/N3/N8 comments; reviewed capital-programs assertion | Preserve the $61.6B gross separate-envelope scope adopted by the reviewed reconciliation. Do not deduct funding contributions again or fabricate transfers in the cash ledger. |
| High — protected canon conflict | Workbook spending $250B and defense $100B predate approved $255B and $82B. Its $90B deficit therefore also differs from the retained $95B projection. | Economy!E7, B13, H7 | Preserve the newer approved $255B/$82B figures and $160B revenue estimate. Do not replay old workbook budget values. |

These are data, formula and presentation findings. No stylistic preference is classified as a financial defect. This is a focused project reconciliation, not an assertion that every economic instrument, forecast or workbook formula has been audited. The workbook's unrelated strain-score formula also points to blank H4 instead of the labeled reserve input H5; that score is not imported or changed here.

## Corrected source snapshot (USD billions, 3 October 1992)

| Project | Cost | Source paid | Committed | Unfunded gap |
|---|---:|---:|---:|---:|
| National Infrastructure Spine | 20.00 | 7.00 | **13.00** (was 10.10) | 0 |
| Dalmatian Development Program | 6.50 | 1.10 | **5.40** (was 1.30) | 0 |
| Agricultural Modernization | 0.60 | 0.32 | 0.28 | 0 |
| Energy & Industrial Expansion | 15.00 | 5.20 | 9.80 | 0 |
| Rail Modernization | 3.70 | 1.20 | 2.50 | 0 |
| Defense Infrastructure | 2.80 | 1.40 | **1.40** (was 1.20) | 0 |
| National Oil Drilling (previously missing) | 13.00 | 8.50 | 4.50 | 0 |
| **Total** | **61.60** | **24.72** | **36.88** | **0** |

Source cells: Projects!A2:D8. E2:E8 calculate the gap. These amounts match the existing provisional reviewed `capital-programs / total_authorized` reconciliation; this repair does not promote that assertion's canon status. Funding coverage is 100% for each source envelope. Paid share is about 40.13% overall; it is neither a physical progress measure nor proof that all expenses have been separately booked in RNAS. “Work left” in the sheet is a cost-less-paid planning proxy. No legal appropriation or new actual cash transaction is inferred.

## Reproducibility and safety

`evidence/project-reconciliation-2026-10-22/projects.json` maps seven stable IDs to exact workbook rows, original hash, source lines 74–80 and complete expected pre-repair rows. Its checksum is checked, and values are matched against the existing source extraction. The original workbook is checked against its preserved artifact metadata before applying anything. No new source or migration is required.

`npm run reconcile:projects` previews changes. `npm run reconcile:projects -- --apply` applies the fixed reviewed batch transactionally, retaining all old row values/source IDs in append-only audit entries. It refuses later edits, name collisions or unverified sources. An audit receipt makes retries idempotent. `npm run setup` applies it after the existing source imports on fresh or older known-baseline checkouts. Installations with later edited project records must reconcile those conflicts explicitly. The generic project creator does not silently acquire this repair's authority or funding semantics.

Pure `project-funding.ts` only derives coverage/gap where the tracker explicitly establishes paid and committed as separate amounts. Unknown inputs stay unknown. Currency groups remain separate. Project observations still obey the selected historical window. Monthly execution rates remain labeled assumptions in source details; no time advancement, forecast completion or synthetic payment is applied.

## Preservation and validation

Pre-edit checkpoint: tag `checkpoint/project-finance-2026-10-22`, commit 822d6dc987dfac34ffa08f794c3851f6713f63c9. Runtime backups: `backups/before-project-reconciliation-2026-10-22.sqlite` and `.zip`. The initial portable backup verified 44 database/evidence files.

All 59 live tables were compared with the checkpoint. **57 remain identical.** Only `projects` and `audit` changed: six existing snapshots receive tracker source provenance, three commitment values change, one oil project is added, and eight audit rows preserve before/after plus a batch receipt. All assertions, decisions, sources, national budget, debt/GDP/inflation, operational budget and ledger rows remain identical. See ignored `backups/project-reconciliation-preservation-check.json`.

Validation: 178 domain/API tests, 36 desktop/emulated-phone browser checks, typecheck, production build and all 14 original-source hashes. Reconciliation tests cover read-only preview, exact totals, all unrelated tables, idempotence, later edits, invalid artifacts, failure rollback, unknown values and separate currencies. Browser checks cover seven programs, correct source totals, full funding and date filtering. Source originals remain unmodified. The post-fix portable backup verifies 46 database/evidence files. Its database restored into a separate destination with integrity/foreign-key checks passing and all 59 tables identical to live. Details are in the session handoff.
