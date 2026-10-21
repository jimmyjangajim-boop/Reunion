# Usability refinement, 20 October 2026

The user's exact instruction is preserved in repository `docs/USER_USABILITY_DIRECTIVE.txt`. It refines the existing application; V3's evidence, transactional approval, persistence and Git rules still apply. Economic canon and existing financial records must not change during this work.

| Step | Status | Current boundary |
| --- | --- | --- |
| 1. Shared layout | Implemented; code/SSR checks passed | Grouped navigation, section descriptions, compact spacing, responsive controls, readable claim labels/values and expandable technical evidence. Browser verification remains pending. |
| 2. Cabinet | Implemented; domain/API/SSR checks passed | Leadership, ministry roster, distinct deputies/institutions/history, searchable offices and clickable source-backed profiles. Inline creation of a supplied person and appointment is atomic. No portraits or unknown biographical details were invented. |
| 3. Battles and casualties | Implemented; domain/API/SSR checks passed | Dedicated Battles workspace preserves an English account, creates/selects a battle and supplied formations, records categorized casualties/equipment losses/outcomes and approves one transaction. Bounded suggestions stay editable. Browser verification remains pending. |
| 4. Archive | Implemented; domain/API/SSR checks passed | Paginated records, timeline, sources/entities, full detail/evidence, filters and paginated original-text FTS. Historical records/statuses remain intact; browser verification remains pending. |
| 5. Parliament/Treasury | Next | Existing workflows and accepted values preserved. Broader department redesign remains unfinished. |
| 6. Report-first completion | Existing bounded foundation | Movement, bill and six financial-stage reports work. Bounded battle suggestions now exist; general prose extraction and an optional AI/provider layer remain unfinished. |

## Cabinet behavior

`cabinet-view.ts` derives a read-only roster from existing ministry observations, dated snapshots, offices and appointments. Proper ministry/office titles replace internal classifications on normal pages. RIA's director is an institution role. The same profiles back the national leadership page, retaining one slot per office and the corrected Darius/no-heir canon.

Observed officeholders are not silently assigned appointment dates. An explicit dated appointment takes priority over a same-date observation; conflicting equal-rank names remain disputed. Unknown officeholders are distinguished from explicit vacancies. Undated succession order remains term history, not a current appointment calendar. Later affiliations do not appear on earlier profiles. Old officeholders, original claims, sources and economic values remain unchanged.

Profiles use supplied names and monograms, not invented appearances. They show known appointment/affiliation/responsibility fields, term history, personal records, name-matched legislation/events and expandable original evidence. Name mentions are labeled as mentions, not invented participation or sponsorship. Missing data stays unrecorded. Native dialogs provide modal focus handling and Escape/Close behavior; source navigation closes the profile and opens the existing source viewer.

Appoint Minister can select a known person or create an explicitly named person in the existing transactional appointment service. Conflicting choices/duplicate names reject; failure rolls back person/source/appointment/audit effects. Creating an office still uses Cabinet's More actions; broader inline prerequisite creation is not complete across departments.

## Battles behavior

The dedicated workspace creates/selects a battle and enters participants, casualties, equipment losses and operational outcome in one report. A formation can remain an unresolved reported name, or the user can explicitly create it inline with supplied branch/type. No unrelated prerequisite page is needed. Existing historical casualties remain expandable and categorized.

Submission preserves the exact original and stages one typed action. Review shows human-readable facts, unknown counts and source access. Corrections require reasons; approval or rejection preserves the original. Only approval writes battle/phase/formation/casualty/loss/timeline/audit effects, in the existing report transaction. A report can be reopened from its dedicated queue or National Report Center after restart. Hypothetical scenarios cannot update canon.

Null counts remain unknown; explicit zero is stored. Categories, formations and phases never become an aggregate casualty total. A battle/reference identifies a phase. Equivalent reports add evidence, while conflicting facts under that reference remain pending. A distinct phase needs a distinct reference. Inline-created formations resolve back to the same identity for corroboration. Stale proposals need a reasoned re-review.

Only explicitly identified tracked assets can change to lost/damaged, with count 1, exact engagement day and assignment/chronology checks. Losses retain their participant even if it has no OOB ID. Lost assets close active assignments at the supplied date; previous states/assignments are preserved. No automatic strength/readiness, cash, procurement or anonymous inventory adjustment is inferred. Outcomes are reported text, not an invented territorial/state change.

The optional deterministic suggestion button recognizes bounded date/place/formation/count patterns. It creates no records and is not a general language or AI parser. Multiple formations, ambiguous counts and conditional/negative prose require manual attribution. A missing year stays unknown unless the reviewer explicitly supplied report-date context. All proposed details must be reviewed; the directive's illustration exists only in temporary tests.

## Altis chronology correction

The earlier reviewed import superseded the 1993 Altis assertions/timeline rows with 1992 replacements. Original superseded timeline rows T041–T043 still retain their source wording. B026/B027 now retain their provisional status and relative precision with labels “October 1992.” `chronology.ts` requires the confirmed reviewed authority, changes only those two known legacy labels and appends explicit before/after audits. It runs idempotently on existing database open and after fresh reviewed imports. Exact combat days and the proposed ceasefire/current-date calendar remain unresolved. No unrelated 1993 date changes.

## Validation and delivery

See VALIDATION.md. Migrations 006–007 preserve prior report actions and legislative/financial evidence while adding append-only battle report history and loss participant attribution. No dependency change was needed. The Windows copy must receive updated `app/src`, `app/migrations` and `app/scripts`, keep its data/evidence and RNAS_DB selection, run `npm.cmd run setup`, then restart. The separate hosted Site remains unchanged.


## Archive behavior, 21 October 2026

The Historical Archive now has Records, Timeline, Sources, Entities and Original text collections. Compact tables show 25 results at a time. Long titles/values are clamped in rows; a native dialog exposes the full text, status, historical precision, replacement history, source excerpts and expandable technical record. Existing Add Historical Record, Timeline entry and Entity forms remain available. Record/entity/source navigation uses actual IDs and evidence foreign keys, not invented participation or fuzzy name relationships. Closing a detail or source keeps the current collection/filter/page while the workspace remains open.

All historical statuses are available by default. Superseded/rejected records are labeled in detail; explicit replacement links show the retained earlier/replacement values. The 1725 collection stays accessible in Archive while active administration behavior is unchanged. Source evidence never becomes confirmed canon merely because it appears in a search result. The six reattached text sources still match the existing immutable originals byte for byte.

Filters cover words, category, canon, entity, cited source, 1725/other collections and historical date windows. Date filters match overlapping known bounds, with an explicit option for dates without known bounds. Unknown/relative dates do not acquire exact days. Unknown dates sort last; recording timestamps are separate. Archive covers all historical dates rather than inheriting the dashboard date selector. Metadata-only source/entity tabs ignore inapplicable date/canon filters.

Original text uses a new read-only paginated FTS endpoint with total/page counts, stable ranking/tie order, optional source selection and exact line references. It searches beyond the earlier global search's 80-result cap, which is retained for compatibility. Up to 12 literal search words are matched together; raw FTS operators are not executed. Loading/error/empty states and canceled obsolete requests are handled. Source drawer provenance distinguishes stored text checksums from original artifact checksums/container/path/extraction metadata when supplied.

This slice changes presentation and read APIs only. It adds no migration, imports or canonical records and does not change financial values. Normalized metadata still comes from the existing overview payload and is filtered/paged in memory; original-text passages are paged in SQLite. General curation proposals, inline related-entity creation inside every historical-event form and a complete semantic entity/event graph remain later report-first work.
