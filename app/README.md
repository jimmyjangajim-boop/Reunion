# Reunion National Administration System

RNAS is a local-first historical archive and administration app for the fictional country Reunion. SQLite stores national records on your laptop. No AI account, subscription, cloud database, or hosted service is required.

This baseline includes guided New Record entry, preserved drafts/receipts, unified primary-register search, connected Cabinet/Parliament/military/Treasury views and reviewed Battles. General National Report Center is mothballed. See [full feature coverage and limits](docs/FEATURE_RUNDOWN.md) and [current status](docs/IMPLEMENTATION_STATUS.md).

## Install and start

Requirements: **Node.js 24 or newer**, npm, and **Python 3.10+** on PATH (`python` on Windows, `python3` elsewhere; needed for ZIP import and portable backups). An internet connection is needed to install dependencies. Normal operation after installation is offline.

Clone the Reunion repository, open a terminal in its `app` directory, then run:

```sh
npm ci
npm run setup
npm run dev
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if execution policy blocks `npm.ps1`; changing the system execution policy is not required. For an isolated test copy, set `$env:RNAS_DB="data/test.sqlite"` in that terminal before setup/start.

Open **http://localhost:3000**. A new Git checkout creates `data/reunion.sqlite` from immutable evidence and the reviewed JSON seed. Setup verifies sources, applies outstanding migrations, and imports each pack only once. It does not reset an existing database.

For production mode on the same laptop:

```sh
npm run build
npm start
```

Keep that terminal open while using RNAS. Stop with Ctrl+C. Your database survives restarts.

### Updating an existing copy

Stop the app and make a backup first. Update `app/src`, `app/migrations` and `app/scripts` together (or pull the complete repository). Keep your existing `data` and `evidence` directories and the same `RNAS_DB` selection. Run `npm run setup`, then `npm run db:check` and restart. On Windows use `npm.cmd run setup` and `npm.cmd run dev`. The baseline uses migrations 001–008 and retains the narrowly approved Altis corrections and guarded project reconciliation. Setup refuses conflicting project edits rather than silently overwriting them. Copying only `src` is insufficient.

### Laptop and phone testing

The supplied start/dev scripts bind 127.0.0.1 for laptop-only access. Another physical device cannot connect through the laptop's network IP with these defaults. Phone browser checks emulate an iPhone-sized Chromium browser; they do not certify physical iPhone/Safari behavior. Network access is a separate configuration task and is not enabled by this baseline.

## Daily use

1. Select the relevant historical date. Search/Archive and stored-record details explicitly cover all recorded dates; they do not silently change the selector.
2. Use **New Record** for explicit entries, or **Battles** for combined battle/after-action/casualty reporting. General National Report Center is mothballed; its underlying data/services remain preserved.
3. Supply the known evidence, identity links and date precision; leave unsupported details unknown. Review before final approval. Drafts are saved separately from national facts.
4. Open the saved record, connected records and preserved source lines. Source viewing keeps the current profile selected underneath.
5. Use global category/type search or the specialized Cabinet, Parliament, Armed Forces, Treasury and Archive views. Source funding, appropriations, commitments and actual spending are separate.
6. Keep portable database-plus-evidence backups independently of chats after meaningful activity.

The [full feature rundown](docs/FEATURE_RUNDOWN.md) covers every implemented area and its missing workflows. [Baseline verification](docs/BASELINE_2026-10-26.md) records the current checks and recovery limits. Known canon safeguards below remain unchanged.

## Canon safeguards

- King Zo III reigns. No heir is designated. Henry Steiner is his cousin and Inferno commander. Legacy heir assertions remain superseded, with their stable IDs preserved.
- Darius Younger overrides Jack Younger. Original wording is retained.
- Rehn died and Curro succeeded her on June 25, 1992. The election/inauguration and current-date proposals remain unconfirmed.
- The Šibenik DMZ is an explicit deployment restriction with unresolved boundaries/effective date. An undated restriction generates a precautionary warning.
- The 400-seat expansion is preserved alongside the constitutional 300-seat maximum. No amendment was fabricated.
- Recovered assistant summaries remain secondary evidence. A label inside a recovery does not grant primary-source reliability.
- Ordered, contracted, and undelivered equipment does not become operational through time advancement.
- Competing casualty reports and categories remain separate.
- The 1725 baseline and corrected 1992 Altis report are dated historical records. No subsequent outcome was filled in.

## Files and storage

```text
src/app/                 Next.js App Router and local API
src/components/          Responsive user interface
src/lib/                 SQLite repository, validation, canon and domain services
migrations/              Numbered, transactional schema migrations
scripts/                 Setup, import, backup/restore, checksum verification
 tests/                  Vitest domain tests and Playwright flows
 data/reunion.sqlite     Mutable local application database, never committed to Git
 evidence/recovery/      Complete, unmodified extracted recovery pack
 evidence/original_recovery.zip  Original uploaded ZIP
 evidence/staged/        Original future import bytes, keyed by SHA-256
 docs/                   Source inspection and data model notes
```

Run commands from the repository root. `RNAS_DB=/absolute/path.sqlite` selects a different database; otherwise the path is `data/reunion.sqlite`. `RNAS_STAGED` can select a different staged-evidence directory. The supplied archival search database remains unchanged under evidence; RNAS uses a new relational database.

Node's built-in SQLite adapter is used instead of Drizzle or a native add-on. It avoids native compilation and uses prepared statements, typed repository boundaries, Zod validation, foreign keys, constraints, and transactions. This is a deliberate stack adjustment. Server-side storage is authoritative; browser local storage is not used for canon.

## Backup and restore

Download a database backup from the app, or run:

```sh
npm run backup -- /absolute/path/reunion-backup.sqlite
```

The SQLite online backup API produces a consistent snapshot, including uncheckpointed WAL changes. A **database backup is not an evidence-directory backup**. Also copy the entire `evidence/` directory, especially staged binary/image/ZIP imports. Original text is additionally preserved in immutable SQLite source rows.

To restore, stop the application first:

```sh
npm run restore -- /absolute/path/reunion-backup.sqlite --confirm
npm start
```

Restore checks integrity and expected tables, then creates a `.before-restore` database copy before replacing existing records. Do not restore over a running server. For disaster recovery, restore the matching `evidence/` directory too.

### Upgrades

1. Stop the server and back up the database and evidence.
2. Replace application code while retaining your `data/` and `evidence/` directories. Do not replace your existing database with a fresh setup database.
3. Run `npm ci`, `npm run setup`, `npm run db:check`, `npm run build`, and `npm start`.
4. Never modify an already-applied migration; add a numbered migration.

Git tracks code, migrations, documentation, and supplied evidence. Runtime database changes are backed up separately.

## Validation

```sh
npm run check:sources
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

UI tests start a production server on port 3001 against a fresh temporary database, not your national records. They cover the dashboard, date changes, search/citations, review, normal entry, movement orders, staging, backups, mobile navigation, and overflow. Phone tests emulate iPhone dimensions in Chromium; they are not a substitute for native Safari testing.

If a compatible Chromium executable is already installed:

```sh
RNAS_BROWSER_PATH=/absolute/path/to/chromium npm run test:ui
```

The included `@sparticuz/chromium` dev dependency provides a Linux browser fallback for constrained test environments. It is not part of the application runtime. See `scripts/prepare-test-browser.mjs` if the normal browser download is unavailable.

## Portable backup and integrity

Run `npm run db:check` to verify SQLite integrity, foreign keys and applied migration versions without changing the database. Run `npm run backup:portable -- /absolute/path/reunion-portable.zip` for a verified online SQLite snapshot plus the complete evidence directory and a SHA-256 manifest. Store this runtime backup outside Git. Restore instructions are included in the archive and `docs/BACKUP_AND_RESTORE.md`.

## Known limits and next work

See `IMPLEMENTATION_STATUS.md` and `BACKLOG.md`. Important limits include selective normalization of the full corpus; conservative, sometimes sparse historical snapshots; predicate-level contradiction detection rather than automatic semantic understanding of every sentence; no complete parliamentary procedure/elections engine; no full procurement delivery lifecycle; no drawn boundaries or operational map markers; and no validated macroeconomic simulator.

Generic records allow evidence to be entered for unfinished subsystems. Navigation to a subsystem does not imply that every feature in the original specification is implemented.
