# Usability refinement, 20 October 2026

The user's exact instruction is preserved in repository `docs/USER_USABILITY_DIRECTIVE.txt`. It refines the existing application; V3's evidence, transactional approval, persistence and Git rules still apply. Economic canon and existing financial records must not change during this work.

| Step | Status | Current boundary |
| --- | --- | --- |
| 1. Shared layout | Implemented; code/SSR checks passed | Grouped navigation, section descriptions, compact spacing, responsive controls, readable claim labels/values and expandable technical evidence. Browser verification remains pending. |
| 2. Cabinet | Implemented; domain/API/SSR checks passed | Leadership, ministry roster, distinct deputies/institutions/history, searchable offices and clickable source-backed profiles. Inline creation of a supplied person and appointment is atomic. No portraits or unknown biographical details were invented. |
| 3. Battles and casualties | Next | One reviewed New Battle / After-Action workflow must create/select a battle and record participants/casualties/losses together. The current separate forms remain; this has not been implemented. |
| 4. Archive | Planned | Shared metadata disclosure improved, but a dedicated compact searchable library replacing endless claim cards remains unfinished. |
| 5. Parliament/Treasury | Planned | Existing workflows and accepted values preserved. Broader department redesign remains unfinished. |
| 6. Report-first completion | Existing bounded foundation | Movement, bill and six financial-stage reports work. General battle prose extraction and an optional AI/provider layer remain unfinished. |

## Cabinet behavior

`cabinet-view.ts` derives a read-only roster from existing ministry observations, dated snapshots, offices and appointments. Proper ministry/office titles replace internal classifications on normal pages. RIA's director is an institution role. The same profiles back the national leadership page, retaining one slot per office and the corrected Darius/no-heir canon.

Observed officeholders are not silently assigned appointment dates. An explicit dated appointment takes priority over a same-date observation; conflicting equal-rank names remain disputed. Unknown officeholders are distinguished from explicit vacancies. Undated succession order remains term history, not a current appointment calendar. Later affiliations do not appear on earlier profiles. Old officeholders, original claims, sources and economic values remain unchanged.

Profiles use supplied names and monograms, not invented appearances. They show known appointment/affiliation/responsibility fields, term history, personal records, name-matched legislation/events and expandable original evidence. Name mentions are labeled as mentions, not invented participation or sponsorship. Missing data stays unrecorded. Native dialogs provide modal focus handling and Escape/Close behavior; source navigation closes the profile and opens the existing source viewer.

Appoint Minister can select a known person or create an explicitly named person in the existing transactional appointment service. Conflicting choices/duplicate names reject; failure rolls back person/source/appointment/audit effects. Creating an office still uses Cabinet's More actions; broader inline prerequisite creation is not complete across departments.

## Altis chronology follow-up

The earlier reviewed import already superseded the 1993 Altis report assertions and timeline rows with 1992 replacements. Original superseded timeline rows T041–T043 retain their source wording. Battle table rows B026 and B027 still have provisional relative labels “October 1993.” The battle table now visibly flags their year correction to 1992. Their stored dates must be reconciled in the next battle slice with explicit before/after audit and original evidence preserved; do not invent a day or replace unrelated 1993 dates.

## Validation and delivery

See VALIDATION.md. No migration, dependency change or live-data rewrite is needed for this slice. The user's Windows copy must receive the updated `app/src` and restart; keep its data directory and RNAS_DB selection. The separate hosted Site remains unchanged.
