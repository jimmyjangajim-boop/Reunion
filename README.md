# Reunion National Administration System

GitHub is the main store for application source, original evidence, canonical JSON seeds, migrations and project documentation. Live SQLite data and runtime backups are stored separately.

Start with [session handoff](app/docs/SESSION_HANDOFF.md), [implementation status](app/docs/IMPLEMENTATION_STATUS.md) and the [governing V3 directive](docs/USER_DIRECTIVE_V3.txt). The latest user canon review is under canon/2026-10-20/revised/.

From app/: install Node 24+, Python 3.10+ and dependencies with npm ci, then run npm run setup, npm run db:check, and npm run dev. Open localhost:3000. Setup recreates the reviewed baseline from immutable evidence and JSON; restore a portable backup to recover later live reports.

The National Report Center supports original report preservation, reviewed movement orders/arrivals, archive entries, partial approval, duplicates and scenarios kept outside canon. Further report domains remain planned. The hosted Site is a separate existing publication and has not been updated by this source commit.

The older pending SQLite upload plan is retired under the newer V3 storage rule. No live database is committed. See app/docs/BACKUP_AND_RESTORE.md.
