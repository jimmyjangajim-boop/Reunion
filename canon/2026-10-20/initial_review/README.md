# Reunion review database

This is a separate evidence and reconciliation package. It has not been imported into the app. Start with Reunion_Canon_Questions.md; answer questions by ID. Unknown dates and deferred answers are supported.

The database preserves original file bytes, document paragraphs, Discord messages, exact message identifiers, posting timestamps, attachment references, all workbook cells and comments, normalized candidates, diagnostic checks and an unanswered review queue. Raw source statements remain separate from approved canon. Workbook values explicitly described as estimates remain estimates. A matching worksheet does not cause its underlying original file to be deleted.

Files:

- `reunion_evidence.sqlite`: searchable SQLite database, including original source bytes.
- `Reunion_Canon_Questions.md`: 27 questions with source locators and explicit handling while unanswered.
- `Reunion_Review_Report.md`: findings, scope and missing-media limitations.
- `normalized_candidates.json`: normalized candidate records with evidence references.
- `review_questions.json` and `.csv`: the same questions for future import and responses.
- `source_inventory.csv` and `.json`: every preserved source and its checksum/review coverage.
- `attachment_references.csv`: references to media that were not included in the exports.
- `texts/`: complete extracted source text, keyed to stable source IDs.
- `originals/`: original two ZIP uploads and standalone latest tracker. All archive-member bytes and six earlier texts are also stored in `source_blobs` and can be recovered from the database.
- `schema.sql`, `queries.sql`: database structure and example read-only queries.
- `validation_results.json`: integrity, source preservation, deduplication, provenance and backup checks.

Open the SQLite database with a SQLite reader, or ask ChatGPT to query it. No paid service is required. It is not an app replacement, and no website needs to run to retain the evidence.

The source priority is: explicit user decisions; user-designated latest tracker for its applicable snapshot; accepted dated roleplay; earlier baselines within their date/scope; other evidence and drafts. User decisions and date/scope take precedence over file export recency. The latest tracker currently contains mixed chronology, so `snapshots.effective_date` is null pending Q01. Raw date serial 33880 is October 3, 1992 in the workbook’s 1900 date system.

The `historical_event_candidates` table indexes date mentions with their source context. It is not a finalized historical timeline. Invalid dates remain written evidence with an invalid-calendar flag. Source-recorded times come from Discord snowflake IDs; these are real-world posting times, never substituted for in-world dates.

Run validation with Python 3, using only the standard library:

```bash
python3 validate_review.py
```

The validation script checks supplied upload hashes using the original conversation upload tree when present, or the packaged originals when extracted separately. A full rebuild uses `build_evidence.py` and `prepare_review.py`, requires the supplied upload/project_sources tree, and uses lxml for HTML/OOXML parsing. The extraction script never executes workbook macros. Rebuilding creates review artifacts only, not app changes.

Future answers should be recorded as explicit decisions with explanations and source links. `decision_log` is append-only. Answering a question must not delete competing evidence or automatically rewrite the database’s original blobs. No answers have been recorded yet.


## Current application storage

This is the earlier review package. Its archival SQLite files were delivered separately in Reunion_Repository_Files_2026-10-20.zip. The current application imports this review through the checksummed JSON seed at app/evidence/canon-review-2026-10-20/seed.json. Original ZIPs and workbook are also preserved there. Live app databases and runtime backups are excluded from Git under the newer V3 directive. Read app/docs/SESSION_HANDOFF.md for subsequent implementation work.
