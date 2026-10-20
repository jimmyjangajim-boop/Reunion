# Reunion evidence and canon review, 20 October 2026

Intended repository: https://github.com/jimmyjangajim-boop/Reunion

`revised/` contains the current review database, all 27 user answers, decision history, reconciled finances, procurement planning and remaining calendar questions. Start with `revised/Reunion_Reconciliation_Report.md` and `revised/Reunion_Canon_Questions.md`.

`initial_review/` preserves the original intake database, original uploads, extracted text and the original questionnaire. It predates the user's answers and is historical evidence, not the current decision set. Original source bytes are also stored inside both databases.

The campaign tracker is the latest operational source. Explicit user decisions take precedence. Estimated costs and delivery schedules are labeled as planning assumptions. The two proposed calendars remain unconfirmed. The hosted app and its database have not been modified.

Run `python3 revised/validate_revision.py` from this folder. All 35 checks pass. Reapplying the same answer set does not duplicate decisions. Each original source, workbook cell, message, passage and initial candidate was compared against the initial review and retained unchanged.

This folder is self-contained. It can be added to an existing repository without replacing application files or root-level repository instructions. Large SQLite databases are stored in compressed parts. Run the root restore script to reconstruct the exact original bytes before opening the databases.


## Current application storage

This is the earlier review package. Its archival SQLite files were delivered separately in Reunion_Repository_Files_2026-10-20.zip. The current application imports this review through the checksummed JSON seed at app/evidence/canon-review-2026-10-20/seed.json. Original ZIPs and workbook are also preserved there. Live app databases and runtime backups are excluded from Git under the newer V3 directive. Read app/docs/SESSION_HANDOFF.md for subsequent implementation work.
