# Reunion revised canon review

All 27 user answers are recorded. This package is separate from the app. Original source bytes and the original tracker remain unchanged.

Start with `Reunion_Canon_Questions.md`: only two calendar choices need confirmation. `Reunion_Reconciliation_Report.md` explains the recorded decisions, the balanced $255B/$82B financial framework, 25 ordered procurement batches and delegated estimates.

`reunion_evidence.sqlite` contains the original evidence database plus the user’s answer source, append-only decision history, new canon records, supersession links, source annotations, restated amounts and planning tables. `candidate_claims` remains the earlier staging area. Use `canon_facts` and `active_canon` for new decisions, and the financial/program tables for reconciled calculations. No calendar proposal is silently promoted to history.

`user_answers.txt` preserves the supplied answers. `Original_Questions.md` preserves the old questionnaire. `decision_register.csv` records all 27 answers and statuses. The JSON and CSV files export each new table. `Altis_Corrected_Report.md` replaces the Turkish casualty headline while preserving original evidence.

`national_allocations` is an annual allotment framework. `defense_allocations` contains delegated spending estimates. `funding_transfers` contains reallocations, not additional revenue or cash expenditure. `project_accounts` retains multi-year authorizations and source-paid/source-committed balances. `procurement_batches` and `delivery_plans` never imply completion from elapsed time. `money_restatements` separates historical rescaling from current authorizations and actual payments.

No app file, app database, hosted record or published site was modified. Exact order dates, several actual receipts and map coordinates remain unknown. The two calendar proposals, relative delivery windows and estimated cost allocations are labeled accordingly.

Run `python3 validate_revision.py` for database, source-preservation, canon-override, accounting, schedule and backup checks. Python 3 standard library is sufficient. `reconcile_answers.py` is idempotent for this answer set and does not duplicate decisions on rerun. It reads only this review package. Do not run the old initial-ingestion/enrichment scripts over this revised database; those represent the pre-adjudication workflow.


## Current application storage

This is the earlier review package. Its archival SQLite files were delivered separately in Reunion_Repository_Files_2026-10-20.zip. The current application imports this review through the checksummed JSON seed at app/evidence/canon-review-2026-10-20/seed.json. Original ZIPs and workbook are also preserved there. Live app databases and runtime backups are excluded from Git under the newer V3 directive. Read app/docs/SESSION_HANDOFF.md for subsequent implementation work.
