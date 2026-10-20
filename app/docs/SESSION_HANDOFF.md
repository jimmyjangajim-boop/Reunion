# Session handoff, 20 October 2026

## Start here

The user's governing file is repository `docs/USER_DIRECTIVE_V3.txt`. Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed correction

The user found four heir-related cards and two VP cards in Government. The screen was mapping raw claims, including superseded rows and duplicate person designations. It now uses `administration-view.ts` to return one resolved entry for each of President, Vice President, monarch and heir. The current baseline VP is Darius Younger; the heir register says “No designated heir,” explicitly undated. Sparse dated snapshots remain sparse.

The user also requested 1725 data remain records only. Preserve all original records/sources/timeline and stable identities. The active overview filters dated/relative 1725 context out of active snapshots, department cards, appointment choices and current review issues. Historical Archive/search/export retain the history; no old lore is deleted or silently retconned. The API exposes separate archive issues alongside active issues.

No schema change: migrations 1–5 remain current. Previous financial, parliamentary and movement workflows remain intact. Read VALIDATION.md for test and browser limits. The user is running a downloaded Windows copy with a separate `data/test.sqlite`; PowerShell requires `npm.cmd` on their machine. Source changes must be copied or pulled onto that PC; they do not automatically update its running server.

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

Financial reports are remote commit `4dacacfa623f0a0a95794b1473a2b05f94dd6eca`. This handoff accompanies the government/archive correction following it; use repository history for the final SHA. Hosted publication remains unchanged.
