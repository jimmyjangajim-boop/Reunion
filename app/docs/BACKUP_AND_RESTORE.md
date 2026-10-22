# Backup and restore

SQLite is stored at `data/reunion.sqlite` or RNAS_DB. It persists through normal process restarts, as tested against a file-backed database. Cloud task/container recreation and a fresh checkout do not retain that runtime file automatically.

From app/: `npm run backup -- /absolute/database-backup.sqlite` creates a consistent online snapshot including WAL data. `npm run backup:portable -- /absolute/reunion-portable.zip` creates an online SQLite snapshot, the complete evidence directory, migration versions and a verified SHA-256 manifest. It excludes API keys, private configuration, dependencies and build caches. Store these mutable backups outside Git.

Portable restore: stop the app; run `python scripts/verify-portable.py /absolute/reunion-portable.zip` (use `python3` where appropriate); extract into a new folder; run `npm run restore -- /absolute/extracted/data/reunion.sqlite --confirm`; restore matching evidence without discarding newer originals; run `npm run setup` and `npm run db:check`; start the app. Restore checks integrity, foreign keys and exact migration compatibility **before touching the destination**, and saves the previous database as `.before-restore`. For an older schema, use its matching code to restore an isolated copy, back that copy up and apply the new migrations there first. Never test an upgrade against the only database copy.

Portable export and ZIP import use `python` on Windows and `python3` elsewhere. Set `RNAS_PYTHON` to an interpreter path if necessary. Windows Store aliases are not reliable interpreters.

The 22 October audit reconstructed the reviewed baseline from Git after the user lost the old chat. It verified both database-only and portable restore into separate destinations and compared all 54 tables. See `AUDIT_VALIDATION.md` for artifacts and recovery limits. Keep portable backups independently of chats; a Git checkout alone cannot recover later live activity. No recurring backup is currently configured.

`npm run db:check` opens the current database read-only and checks integrity, foreign keys and applied migration versions. It reports missing migrations rather than silently applying them. New migrations are appended, never rewritten.

A fresh checkout can rebuild the reviewed baseline with npm run setup. It does not reconstruct subsequent user reports that exist only in a later runtime backup. Back up before migration or environment loss. The pre-session database was backed up before migration 003, and a complete portable snapshot was hash-verified after import.
