# Reunion National Administration System

RNAS is a local-first historical archive and administration app for the fictional country Reunion. SQLite stores national records on your laptop. No AI account, subscription, cloud database, or hosted service is required.

This delivery implements the Stage 1 archive and canon review workflows, plus bounded government, military, accounting, treaty, and event workflows. See `IMPLEMENTATION_STATUS.md` for exact boundaries. It is not a finished implementation of every proposed national subsystem.

## Install and start

Requirements: **Node.js 24 or newer**, npm, and **Python 3.10+** on PATH (`python3`; needed for ZIP import). An internet connection is needed to install dependencies. Normal operation after installation is offline.

Clone the Reunion repository, open a terminal in its `app` directory, then run:

```sh
npm ci
npm run setup
npm run dev
```

Open **http://localhost:3000**. A new Git checkout creates `data/reunion.sqlite` from immutable evidence and the reviewed JSON seed. Setup verifies sources, applies outstanding migrations, and imports each pack only once. It does not reset an existing database.

For production mode on the same laptop:

```sh
npm run build
npm start
```

Keep that terminal open while using RNAS. Stop with Ctrl+C. Your database survives restarts.

### iPhone on the same network

Start RNAS on your laptop. Find the laptop's local IP address in its network settings. Connect the iPhone to the same trusted Wi-Fi network and open `http://LAPTOP_IP:3000` in Safari. You may need to allow the Node process through your laptop's firewall.

The development/start scripts listen on all interfaces for this use. The app is a single-user local tool without authentication. Do not port-forward it or expose it on the public internet. Cross-origin writes are rejected; anyone with access to the local app can still read and edit it.

For access only on the laptop:

```sh
npx next dev --hostname 127.0.0.1
```

## Daily use

- **National Report Center:** preserve the exact report, review typed movement orders, arrivals, explicit legislative stages or financial stages, correct proposed details, then approve selected changes together. Other prose can be retained as archive events with unresolved administrative effects. Hypothetical reports remain scenarios; AI generation is not implemented.
- **Dashboard:** choose an in-world date. A 3 October 1992 observation does not fill an undocumented date in 1993. Date comparisons show Unknown where evidence is insufficient.
- **Historical Archive:** browse normalized claims, original sources, and filtered chronology. Global search uses SQLite FTS5 across original documents and user entries. Citations open numbered source lines.
- **Add sourced fact:** choose an entity, field, value, canon approval, operational state, and date precision. Choose original lines or write a decision preserved as a new source. Explicit ongoing intervals require an earliest validity bound.
- **Canon Review Center:** compare linked claims and excerpts. Accept A/B, merge, replace, preserve different dates, dismiss, leave unresolved, supply a gap, or postpone. Every decision requires a reason. Older text survives.
- **Cabinet:** create offices and appointments. Dated reshuffles can explicitly close a preceding dated term. Uncertain historical terms are not silently assigned departure dates.
- **Armed Forces:** add units, dated strength/hierarchy observations, major assets, assignments, battle records, and casualty reports. Each observation is separate. An ordered move requires a later explicit arrival confirmation.
- **Treasury reports:** record six separate financial stages against known budgets. Explicit additional appropriations increase limits; referenced payments/expenses remain separate and repeated reports only add evidence. No automatic FX conversion or revenue/debt changes.
- **Parliament:** preserve the actual 400 seats and constitutional maximum of 300. Create a bill and record manual vote totals. Supply occupied voting capacity and a sourced threshold; a recorded vote alone does not enact a bill. Reviewed reports can record consideration, introduction, passage or explicit enactment, with sourced legislative history and unknown details preserved.
- **Treasury:** create an actual appropriation before entering stage-specific financial entries. Warnings require an explicit explanation to overrun an appropriation. Commitments, disbursements, and actuals are not summed together as one expense.
- **Military Map:** named-location deployments work now. Interactive cartography and annotations are still planned. No coordinates were invented.
- **Events & Time:** deterministic parsing recognizes `Order [exact unit name] to [exact location name]`, for example `Order 3rd Infantry Division to Dalmatia`. It creates a draft for approval. Unsupported or ambiguous prose remains unresolved. Time advancement changes only the approved clock and lists pending orders.
- **Imports & Backups:** upload originals to staging; add sourced facts after review. Repeating an identical import is idempotent. Rollback rejects linked normalized claims but preserves evidence. Imports do not silently extract or approve lore.

The audit distinguishes real-world recording timestamps from historical validity dates. An unknown appointment date remains unknown even when a succession sequence is established.

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
2. Replace application code while retaining your `data/` and `evidence/` directories. Do not overwrite your database with the example database from a new delivery.
3. Run `npm ci`, `npm run db:migrate`, `npm run build`, and `npm start`.
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
