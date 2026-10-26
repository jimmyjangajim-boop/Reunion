# Architecture audit validation — 22 October 2026

## Results

| Check | Result |
| --- | --- |
| Original pre-edit domain/API suite | 148 passed across 10 files |
| Updated full domain/API suite | 156 passed across 11 files |
| TypeScript | `npm run typecheck` passed |
| Production build | `npm run build` passed; page and all four API routes built |
| Immutable recovery sources | All 14 original SHA-256 hashes match |
| Desktop + phone browser workflows | 26 passed (13 flows per project) |
| Browser department smoke test | All 16 destinations rendered with no client page errors in both projects |
| Recovery checks | Integrity, foreign keys and migrations 1–7 pass |
| Portable backup | 44 database/evidence files independently size/hash verified |
| Data-preservation comparison | Every row of all 54 tables identical across checkpoint backup, current database, initial restored copy and portable-restored copy |
| Diff whitespace | `git diff --check` passed |

## Browser scope

Verified manual Treasury account/entry with evidence/reference and reload persistence; all department navigation; dashboard/source search; historical context; reasoned canon decision and entity creation; ordered movement versus arrival; staged text upload and database download; phone/laptop page overflow; disputed finance labels; resolved Government/archive-only 1725; Cabinet profile/evidence; combined battle/categorized casualties/approval/reload; Archive filtering/replacement evidence/original-text search.

Screenshots were generated for Dashboard, Cabinet, Treasury and Archive on desktop/phone. Desktop Cabinet and phone Archive were visually inspected. Screenshots are temporary test artifacts under ignored `test-results/`; their temporary test records do not appear in the working database. This is not exhaustive visual inspection of every screen/control or a physical-iPhone test.

Earlier browser runs exposed stale Archive selectors, an ambiguous status locator and a Treasury fixture shared between projects. Corrected the selectors/unique fixture references and ran the full suite successfully. The production app was not changed merely to satisfy outdated tests.

## Recovery artifacts

Ignored runtime files under `app/`:

- `backups/before-architecture-2026-10-22.sqlite`
- `backups/reunion-recovered-baseline-2026-10-22.zip`
- `backups/recovery-verification-2026-10-22.json`
- `backups/portable-restore-proof/` — independently verified extracted evidence/database
- `data/reunion.sqlite` — usable reconstructed reviewed baseline
- `data/restore-baseline-check.sqlite`, `data/portable-restored.sqlite` — isolated restore checks

Code checkpoint: initial commit `485a3cf62327807def3ae18e8a47aa7d4ab8a155`, local tag and GitHub branch `checkpoint/architecture-audit-2026-10-22`. A standalone pre-audit Git bundle is one directory above the checkout. Runtime backups are deliberately not in Git.

No prior live database was recovered from the checked local project/backup locations or downloaded repository ZIP. The user reported deleting the broken chat that held it. This run reconstructs the checked reviewed seed, not unknown later runtime activity. The reconstructed baseline has zero reports, operational budget accounts and ledger entries; historical economic canon remains preserved.

## Environment and limitations

Windows, Node 24.22.0, Python 3.15.0, pinned npm dependency lockfile, Playwright Chromium desktop and emulated iPhone. Vitest initially could not rename temporary transformed files inside the Windows sandbox, so successful test/build/browser runs used the approved host execution path. No dependency upgrade or schema change was needed.

The app starts locally at `http://127.0.0.1:3000`. Local-only defaults mitigate unintended network exposure; authentication is not implemented. The separate hosted Site was neither redeployed nor certified. No load benchmark, general AI extraction, full simulation engine, external sync or later deleted-chat data recovery is claimed.
