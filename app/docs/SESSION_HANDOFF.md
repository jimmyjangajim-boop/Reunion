# Session handoff, 20 October 2026

## Start here

The base governing file is repository `docs/USER_DIRECTIVE_V3.txt`; the latest usability refinement is `docs/USER_USABILITY_DIRECTIVE.txt` (Pasted text(10).txt). Ignore earlier pasted continuation directives. GitHub `jimmyjangajim-boop/Reunion` is the main project store. Main application source is `app/` in Git and `rnas/` in the current cloud workspace. Do not restart or replace it.

Latest user canon decisions are in `canon/2026-10-20/revised/` and the checksummed `app/evidence/canon-review-2026-10-20/seed.json`. The newer 27 answers supersede conflicting recovery instructions. Read CANON_AUTHORITY.md.

## Completed usability slice

Implemented steps 1–2 of the latest usability directive without rebuilding the application. Shared navigation is grouped; section descriptions and compact spacing improve hierarchy; claim metadata/raw JSON move into expandable evidence. Cabinet/Government now use the read-only `cabinet-view.ts` projection and `CabinetWorkspace.tsx`: national leadership, compact searchable ministries, separate deputies/institutions/history and clickable source-backed profiles. No unknown appearance, affiliation, responsibilities or term dates were invented.

Appoint Minister can select a person or create a supplied new person in the same existing transaction. Invalid appointments roll back person/source/audit creation. No financial values or live records were changed: all 48 table contents matched the pre-change fingerprints. Migrations remain 1–5. The user's Windows copy needs updated app/src, while its data/test.sqlite and RNAS_DB selection must be retained.

Two provisional battle rows B026/B027 still use relative “October 1993” labels. They are visibly flagged for correction to 1992; the next battle slice must persist that narrow, audited correction without inventing days. Already superseded timeline/original source wording remains intact. Read USABILITY_REFINEMENT.md and VALIDATION.md for precise completion/QA boundaries.

## Operate

From `app/`: `npm ci`, `npm run setup`, `npm run db:check`, `npm run dev`. A new checkout reconstructs the baseline from source/JSON. To retain later user activity, restore its portable backup instead. The default local data path is `app/data/reunion.sqlite`; never commit it.

The hosted Site is `https://reunion-national-administration.superfig3.chatgpt.site`, project `appgprj_6ad50c60a5e08191b2218966a3d8eda3`, active version 1. It is a distinct publication; this session did not deploy the modified Next.js application there. Preserve it.

## Next task

Step 3: build a complete New Battle / After-Action Report workflow directly in Battles. Create or select a battle and formation, preserve an ordinary-language report, stage participants and known categorized casualties/equipment losses/outcomes, review and approve one transaction. Unknown fields must remain unknown; KIA/WIA/MIA/POW/unspecified remain separate. Fix B026/B027's legacy Altis year labels with source/audit preservation. Do not insert the directive's example report as canon.

Then continue the searchable Archive redesign and Parliament/Treasury usability steps. The earlier balanced budget-reallocation backlog remains deferred behind this user-selected order. Existing Report Center and domain services should be extended, not replaced.

## Open canon decisions

Confirm the proposed current date October 18, 1992, dissolution/Altis ceasefire October 17. Confirm the proposed June 21 election / June 23 inauguration and Rehn appointment sequence. June 25 death/Curro succession is already confirmed. Neither open calendar blocks unrelated report use.

## Repository storage

The old request to upload runtime SQLite files was superseded by V3's instruction not to commit live databases. Its earlier approval is retained in the conversation; no need to ask again about the approved immutable original ZIP/workbook sources. Store code, original evidence, canonical JSON seeds, migrations and documentation in Git. Store live database backups separately. Temporary dependencies, builds, credentials, staged future uploads and test databases are excluded.

## Git checkpoint

Government/archive cleanup was remote commit `5242b6e46a191e61c58781af17ddf7682332d335`. This handoff accompanies the usability steps 1–2 commit following it; use repository history for the final SHA. The separate hosted publication is unchanged.
