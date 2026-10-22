# Unified records validation — 22 October 2026

Starting code: `a2fd6a94ead2a8c655a5289af240e03ca058125e`. Work branch: `feature/unified-records-2026-10-22`. No architecture re-audit or simulation expansion was undertaken.

| Check | Result |
| --- | --- |
| Full domain/API suite | 169 passed across 13 test files |
| Desktop and emulated-phone browser suite | 34 passed |
| TypeScript | Passed |
| Production build | Passed, including `/api/records` |
| Original-source verification | All 14 SHA-256 hashes match |
| Existing-data preservation | All 53 preexisting data tables unchanged; migration register alone gains version 8 |
| New tables in working database | Five, all empty; no fixtures or live draft/record examples inserted |
| Current database | Integrity/FK checks pass; migrations 1–8 |
| Portable backup | 44 files independently verified against size/SHA-256 manifest |
| Isolated portable restore | All 59 tables match the working database |
| Diff whitespace | Passed |

New tests cover incomplete drafts without canon effects, file-backed reopen/backup persistence, rolled-back review, exactly-once save retries, stale revisions/dependencies, source text preservation, explicit source-line citations, sponsor/appointee/state/event relationships, overlap refusal, historical ranges, invalid bound dates, provisional canon, orders versus arrivals, source/canon/financial preservation, and final-transaction rollback after injected receipt failure. API tests cover same-origin protection, supported-kind dispatch and saved receipt retrieval.

Browser tests cover homepage/persistent New Record access; draft save/reload/resume/review/save/receipt; bill plus inline sponsor from Parliament; historical event plus inline related entity with bidirectional Archive navigation; existing Battles/finance entry points; and the prior critical workflows. The department smoke test now covers all 17 destinations. The phone review explicitly checks page overflow.

Browser verification found a stored-but-hidden sponsor and draft-table page overflow. Parliament now exposes sponsor/source, and draft-table scrolling is contained. An earlier unit test assumed Timeline ignored entity filters; it now verifies explicit timeline links and unrelated-entity exclusion. Existing appointment source wording was preserved during command extraction. No original historical row was rewritten to make tests pass.

Desktop New Record and phone review screenshots were visually inspected. Temporary images/traces are under ignored `app/test-results/`. They contain explicitly temporary fixtures in the test database, not production records. This is browser emulation, not a physical-phone or full accessibility audit.

## Runtime artifacts (excluded from Git)

- `app/backups/before-unified-records-2026-10-22.sqlite`
- `app/backups/before-unified-records-2026-10-22.zip`
- `app/backups/unified-records-preservation-check.json`
- `app/backups/unified-records-schema8-2026-10-22.zip`
- `app/backups/unified-records-portable-proof/`
- `app/data/unified-records-restore-proof.sqlite`

The working database remains `app/data/reunion.sqlite`. It still contains the recovered approved baseline from the audit; this increment does not claim recovery of deleted-chat runtime activity. Backups should remain independent of chats.

The earlier schema-7 snapshot needs matching code or migration of an isolated copy before schema-8 restore validation accepts it. The new schema-8 portable archive restores directly with current code.

## Explicit limits

Nine guided types are implemented; existing finance/vote/project/location/source/battle forms remain specialized entry points rather than all sharing draft UI. Inline creation supports a person for bill/appointment, one missing treaty state, and one missing event entity alongside multiple existing links. It does not create every possible prerequisite inline. Treasury/Parliament/military redesign, universal domain search, subsystem exchange formats and additional record types remain future increments. Approved monetary values, original evidence, Altis chronology and open canon questions remain unchanged. The hosted Site is unchanged.
