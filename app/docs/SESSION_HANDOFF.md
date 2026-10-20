# Session handoff, 20 October 2026

## Start here

The user's governing file is repository `docs/USER_DIRECTIVE_V3.txt`. Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed coherent slice

Imported reviewed evidence and explicit decisions into the existing app, preserving old assertions and provenance. Added National Report Center for reviewed military movement reports and preserved archive statements. Added migration 003, tests, a read-only integrity command and a portable backup command. Source and data remain separate.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Extend the existing report action schema and domain services to record a user-reported parliamentary legislative action, with sourced stage transitions, partial information, duplicate protection and no fabricated vote totals or enactment. Add the relevant acceptance tests and reuse the current review UI.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.
