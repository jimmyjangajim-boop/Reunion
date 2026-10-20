# Session handoff, 20 October 2026

## Start here

The user's governing file is repository `docs/USER_DIRECTIVE_V3.txt`. Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed coherent slice

Parliamentary legislation now passes through the existing National Report Center. Explicit bill syntax proposes consideration/introduction/passage/enactment. Approval shares Parliament’s bill register, preserves append-only stage/evidence history and updates the timeline atomically. Unknown details stay unknown; no votes, enactment, appropriations or spending are inferred from reported passage. Migration 004 preserves preexisting actions. See REPORT_PIPELINE.md and VALIDATION.md.

The preceding reviewed-evidence import, military reports and backup tools remain intact. The live database has migrations 1–4 and no test reports. A pre-migration 004 backup was taken and all prior table contents were checked after the upgrade. Git contains reproducible baseline evidence and JSON; runtime database backups remain separate.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Add reviewed appropriation and expenditure report actions using existing budget/ledger services. Keep authorization, appropriation, commitment, disbursement and actual expense distinct. Require a known budget/currency, explicit amounts and dates, duplicate protection and reasoned over-authorization review. Reuse the current report review and atomic approval infrastructure; do not automatically move money when a bill passes.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.

## Git checkpoint

The prior reviewed-canon/report slice is remote commit `f0e5af46f66d5892aa86e94f2f4152a229faf875`. This handoff accompanies the parliamentary-report commit following that checkpoint; use the repository history for its final SHA. Hosted publication remains separate.
