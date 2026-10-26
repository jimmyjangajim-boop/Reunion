# Reunion National Administration System

RNAS is a local national records system, historical archive and administrative database for Reunion. The latest [records directive](docs/USER_RECORDS_DIRECTIVE.txt) makes explicit records and preserved evidence primary. **General National Report Center is mothballed**; reviewed Battles still works. Simulation/AI-first expansion remains frozen.

Start here:

- [Full feature rundown and limits](app/docs/FEATURE_RUNDOWN.md)
- [Install, run and update](app/README.md)
- [Verified consolidated baseline](app/docs/BASELINE_2026-10-26.md)
- [Current implementation status](app/docs/IMPLEMENTATION_STATUS.md)
- [Architecture and database boundaries](ARCHITECTURE.md)
- [Backup and restore](app/docs/BACKUP_AND_RESTORE.md)
- [Continuation handoff](app/docs/SESSION_HANDOFF.md)

The working baseline combines the ten incremental review branches without rewriting their history. Its combined review targets main; no hosted deployment or automatic main-branch promotion is implied. Application runtime code is unchanged from verified tip 87cd925. Consolidation adds current documentation and an upgrade-preservation regression check.

GitHub stores application source, migrations, immutable original evidence, reviewed JSON seeds and project documentation. **Live SQLite records and portable backups are separate, ignored runtime files.** A fresh checkout rebuilds the reviewed source baseline, including the approved project reconciliation; only a matching runtime backup recovers later live entries. The deleted chat's missing live database was not recovered.

From app/, use Node 24+ and Python 3.10+, install with npm ci, run npm run setup, npm run db:check, npm run build and npm start. On Windows PowerShell use npm.cmd. Open http://127.0.0.1:3000. Stop an existing server before rebuilding. Existing installations must be backed up before updates; keep their data and evidence folders.

The user remains the authority over canon. Read [canon authority](app/docs/CANON_AUTHORITY.md) and the latest reviewed sources under canon/2026-10-20/revised/. National budget, projected deficit, source project funding, actual spending and physical completion remain distinct.
