# Reunion

Reunion National Administration System source, canon review, decisions and extracted source texts.

**Upload status:** app source and text review files are present. Database files, original ZIP archives and Excel workbooks are blocked pending specific upload approval. See `PENDING_BINARY_UPLOADS.md` for exact filenames and checksums.

- `app/`: the existing RNAS application source and recovery archive. Its database remains separate from the revised canon review.
- `canon/2026-10-20/revised/`: latest review database, all 27 user answers, reconciled financial planning, procurement assumptions, validation and two remaining calendar questions.
- `canon/2026-10-20/initial_review/`: historical intake database, source extraction and original questionnaire. It predates the user's answers.
- `sources/`: supplied exports, campaign trackers and original project source texts.
- `backups/`: original delivery seed database.

## Restore databases

After the pending binary files are uploaded, run `python3 restore_binary_files.py` from this repository. It verifies the compressed parts and restored SHA-256 hashes before writing the exact original database files. Then run `python3 canon/2026-10-20/revised/validate_revision.py`; all 35 checks pass.

The latest campaign tracker and explicit user answers take precedence over older sources. Estimates and unconfirmed calendar proposals remain labeled. The app source has not been changed to import this revised canon. The hosted app has not been updated.

Generated ZIP delivery packages are represented by their extracted contents here. Runtime dependencies, build caches and temporary QA images are omitted.
