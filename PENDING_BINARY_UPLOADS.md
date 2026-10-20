# Storage policy updated by V3

The earlier 14-file upload approval is recorded. The newer governing directive prohibits committing mutable production SQLite databases and runtime backups. Those uploads are therefore retired, not awaiting another approval.

Immutable original source ZIPs and workbooks are retained under app/evidence/canon-review-2026-10-20/originals and sources/uploads as applicable. Reproducible canonical JSON lives under app/evidence/canon-review-2026-10-20. Live databases are reconstructed or restored from a separate portable backup.

See app/docs/BACKUP_AND_RESTORE.md and app/docs/SESSION_HANDOFF.md. Historical upload manifests remain in Git history.
