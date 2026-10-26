# Treasury display increment — 22 October 2026

The Treasury is now a dedicated workspace rather than a grid of economic assertions inside Console. This is a display-only increment under USER_RECORDS_DIRECTIVE.txt. It adds no migration, dependency, financial transaction or canon revision.

## Delivered

- Six dated headlines: annual expenditure framework, revenue estimate, derived projected deficit, reported debt stock, GDP and inflation. Missing or disputed observations show Not established.
- Revenue/expenditure bars and defense-share meter, with evidence inspection. Values derive from the selected canonical snapshot; no chart implies realized cash spending. No fabricated allocation categories or chronological series.
- Programs register: exact source amounts, separate planned/authorized/committed/paid columns, source links and paid/planned funding meters. Funding progress never claims implementation progress. Project point observations do not carry forward; month/year windows preserve their precision. Unknown/open dates appear separately without dated totals; known future lower bounds remain excluded.
- Separate appropriation, transaction and evidence registers. Transaction rows follow the selected date; exact currency amounts remain available. Manual source links and report source-line links both work. Financial stages and currencies are not summed together.
- Undated economic reference assertions remain accessible in an explicitly undated evidence disclosure. They never fill dated headlines. Original assertion text, status and provenance remain preserved.
- Existing appropriation, transaction and project forms still use their existing shared services.

## Boundaries

Appropriation base commencement dates are not established in the existing schema. The register labels that limitation, shows fiscal years and excludes future fiscal years; it does not certify legal authority at an arbitrary historical date. Per-stage zero totals mean no recorded matching entries, not zero national spending. Project snapshots are source reports, not invented ledger transactions. Operational budgets and ledger remain empty in the reconstructed production baseline.

The small read adapter recognizes the existing economic predicates and explicit USD-billion/percentage formats. Unfamiliar, conflicting, disputed or incompatible values remain evidence rather than guessed chart values. Full multi-currency accounting, a normalized economic-indicator authoring system, cash balances, procurement lifecycle accounting and additional departmental redesigns are outside this increment. No simulation expansion.

## Validation

174 domain/API tests across 14 files; typecheck; production build; all 14 original-source hashes. Browser validation covers the preserved critical flows and a new Treasury date/evidence/program-window flow on desktop and emulated iPhone (36 checks). Screenshots inspected for desktop and phone; this is not physical-device or exhaustive accessibility testing.

Before edits: Git tag checkpoint/treasury-2026-10-22 at 6c7d07064d5e8cb9059081c4461462f261feff10; branch feature/treasury-2026-10-22. Separate runtime backups: app/backups/before-treasury-2026-10-22.sqlite and .zip. Portable manifest verifies 44 database/evidence files with migrations 1–8. The database-only backup restored into app/data/treasury-restore-proof.sqlite with integrity and foreign-key checks passing. All 59 tables in live/checkpoint/restored databases match exactly; row counts and comparison results are in ignored app/backups/treasury-preservation-check.json. Runtime files are not committed.

Next bounded increment: Parliament workspace under the same directive, preserving the actual 400-seat composition, constitutional maximum 300, dated suspension and unknown occupied-seat counts. Do not treat this Treasury increment as completion of all requested phases.
