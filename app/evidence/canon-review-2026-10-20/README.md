# Reviewed canon seed, 20 October 2026

Immutable canonical JSON plus original source archives. `seed.json` was exported from the completed evidence review: 88 original-source metadata/extraction records, 40 facts, 27 user answers and five unconfirmed calendar proposals. Its SHA-256 and the original ZIP/workbook hashes are in SHA256SUMS.json.

Run npm run setup from app/ to reproduce the app database. The importer verifies checksums and imports each dataset once, using the same app schema and canonical assertion services. Calendar proposals become review questions, never an approved clock. Delegated estimates remain provisional. Original extraction checksums and original artifact checksums are independent.

The full earlier review database was delivered separately in Reunion_Repository_Files_2026-10-20.zip. It is an archival review tool, not the live app database. Runtime SQLite and backups are not committed.
