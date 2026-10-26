# Record selection and connections

26 October 2026. This increment continues the existing application. No database migration, new dependency, canon revision or financial change.

## Findings and corrections

| Finding | Severity and basis | Files | Correction |
| --- | --- | --- | --- |
| Sourced-fact Subject combines all identity kinds in one long list. Long source/related-record lists require scrolling. | Medium usability defect, visible in the supplied screenshot and source. | Console.tsx; records/Fields.tsx; ArchiveWorkspace.tsx | Shared RecordPicker with broad browsing categories, name search and short pages. All options remain reachable; IDs/kinds stay unchanged. |
| Multiple related records use a native multi-select requiring desktop modifier keys. Filtering could otherwise lose hidden selections. | Medium accessibility/workflow defect. | records/Fields.tsx; RecordPicker.tsx | Paged checkboxes, selected relationship summary/removal, state retained across category/query/page changes and database draft reloads. |
| Global entity matches are inert display cards; normalized fact/event results are absent. | Medium disconnected navigation defect. | Console.tsx; LinkedSearchRecords.tsx; ArchiveWorkspace.tsx | Exact archive-detail destinations, then linked facts/events and source evidence. Normalized search reuses archiveRows rather than duplicating filtering rules. |
| General NRC depends on bounded manual/pattern-based intake and cannot reliably detect arbitrary report effects. | Product capability limitation; mothballing is the user's explicit scope decision. | Console.tsx; ReportCenter.tsx retained; report APIs/services retained | Remove NRC navigation/review entry points. New Record handles explicit records; Battles keeps the shared reviewed-report service. Imports & Backups explains the state. No report data is deleted. |

Category names are browsing labels, not canon or domain changes. Person, institution, party, organization, law, unit, battle, place, territory, nation and project kinds remain distinct underneath. Unknown future kinds remain reachable under Other records. Changing a filter keeps a selected record visible until explicitly changed; it does not change the subject. Single-choice pages contain at most 12 matches plus a retained selected option. Multi-choice pages contain eight records, with all selected links separately visible and removable.

## Connection boundaries

Search covers original source text, entity identities, sourced assertions and historical events. Normalized matches use the same Archive filtering/paging model, across all recorded dates/statuses. Exact archive IDs open the existing source/record/event/entity detail workflow. Historical/superseded evidence stays available without becoming current approved administration.

This does not automatically join an archive battle/unit/project identity to a similarly named operational row. Operational registers continue to use their own typed identifiers, validations and explicit links. Universal search across every operational register and receipt-to-profile navigation remain future work. Broad categories do not replace specialized workflows or bypass review, financial authority or canon approval.

## Mothballed NRC

General ReportCenter UI remains in source for later reassessment but is no longer mounted or offered in navigation/review. Existing report originals, actions, approvals, audit history and APIs are retained and included in backups. Battles continues to use these services for reviewed casualty/phase/equipment changes. Existing report originals can still be read through the report API. There is no automatic detection or AI expansion in this change.

## Verification and recovery

199 domain/API tests, 54 desktop/emulated-phone checks, typecheck, production build and all 14 protected source hashes passed. Browser checks include exact subject-ID submission and source-linked navigation, relationship preservation across categories and draft reload, department navigation without NRC, and the existing reviewed battle/casualty persistence flow. Desktop/phone screenshots were visually inspected; a style-name collision found in that inspection was corrected and the browser checks repeated. No claim of physical iPhone/Safari testing or complete accessibility certification.

Checkpoint tag: checkpoint/record-connections-2026-10-26. Backups before changes: app/backups/before-record-connections-2026-10-26.sqlite and .zip. Portable archive verified 46 files; isolated restore passed integrity, foreign keys and migrations 1–8. All 59 live tables match both the checkpoint and isolated restore, including seven corrected projects and zero production test drafts/reports. See ignored preservation JSON for per-table counts. Runtime databases/backups stay out of Git. Hosted Site was not changed.
