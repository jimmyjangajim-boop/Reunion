# Session handoff, 20 October 2026

## Start here

The user's governing file is repository `docs/USER_DIRECTIVE_V3.txt`. Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed coherent slice

Reviewed financial reports now use the National Report Center and existing Treasury ledger. Supported stages are proposed/authorized/appropriated/committed/disbursed/actual. Reports require a known budget, explicit currency/whole-unit amount/date and transaction reference. Only an explicit additional appropriation raises a limit. Repeated references add evidence, not money; conflicts/stale state block approval. Earlier selected additional appropriations can fund selected payments in one atomic approval. Read REPORT_PIPELINE.md and VALIDATION.md for boundaries.

Migration 005 preserves preexisting actions and legislative evidence, and adds report-linked financial references/evidence and appropriation adjustments. A pre-migration backup was taken. The live database has migrations 1–5, no synthetic report/financial fixtures, and unchanged prior national data. The six reattached source texts match the stored originals exactly; no duplicates were imported.

The preceding reviewed-canon import, military reports, parliamentary reports and backup tools remain intact. Git stores reproducible sources and JSON; runtime database backups remain separate.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Add reviewed balanced budget reallocations through the Report Center. Require explicit source/destination accounts, currency, amount/date/reference and authority. Reduce the source limit and raise the destination atomically, check committed/spent amounts and dated availability, preserve both sides and provenance, and do not classify the transfer as new revenue or spending. Extend known-date limit reconstruction to signed adjustment deltas. Keep the current six stage ledger compatible. Returns/cancellations and corrections remain separate future work.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.

## Git checkpoint

Parliamentary reports were saved in remote commit `3db6b7c960862a334908256e7aae8de323b49a0e`. This handoff accompanies the financial-report commit following it; use repository history for its final SHA. Hosted publication remains separate and unchanged.
