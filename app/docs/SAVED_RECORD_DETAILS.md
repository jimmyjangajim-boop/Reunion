# Saved record details

26 October 2026. Records-first continuation; National Report Center stays mothballed. Later universal-search work extracted the existing reader/presentation into domain-records.ts and RecordDetails.tsx; the saved receipt wrappers retain their own citations and approval metadata. See UNIVERSAL_SEARCH.md for current shared coverage.

## Finding and correction

**Medium workflow defect:** New Record saved receipts had only Open related registry. They dropped users into a department instead of showing the record just created. A future-dated bill or movement could then be hidden by the department's historical filter. A receipt also did not offer its preserved source line link directly. Affected files: NewRecordWorkspace.tsx and Console.tsx.

Added Open saved record for all nine guided types: person, institution, organization, bill, appointment, unit, deployment, treaty and historical event. This works immediately after approval and from a reopened receipt. Open related registry remains separate. Unknown term dates/arrival remain unknown; month-level treaty dates keep their precision/bounds. Zero is displayed as zero. Current stored stages/statuses are explicitly across all dates, without changing the selected historical date or asserting earlier validity.

## Connections and boundaries

The server derives the exact domain target from the saved receipt's kind and target_id. It reads only fixed canonical tables and explicit link tables. Entity identities open the existing Archive detail workflow, including linked records/events. Unit identities open the existing military profile. Sponsor, appointee, treaty-state and historical-event links use stored IDs; no similarly named records are guessed or merged. Office/destination names are shown from their stored typed IDs. Missing target rows return an understandable error while preserving the receipt; hide/reopen retries a failed load.

Saved entry evidence opens preserved source IDs and exact cited line ranges. The recording timestamp and explicit approval reason stay distinct from historical dates. The current row's source can be opened separately if different from saved-entry evidence. Current fields are not a complete historical dossier, and original citations do not automatically corroborate every later change. Original receipt payload/citations remain immutable. No schema, dependency, domain write service, canon, budget or project-finance changes.

Implementation: server-only saved-record-details.ts; GET target view in api/records; client-safe transport type in record-registry.ts; abortable SavedRecordDetails presentation with existing source/identity/formation callbacks. The original specialized guided forms/review/save transaction are unchanged. No general record editor or parallel database is introduced.

## Verification

- 211 domain/API tests, including all nine exact targets, no database writes on read, preserved source text/ranges, partial/unknown dates, explicit zero, later row changes versus the immutable receipt, missing/unsaved targets and no-cache API responses.
- 58 desktop/emulated-phone browser checks, including all nine receipt views, source lines, entity/unit profiles, immediate post-save opening, reload, future-dated records without selector changes and failed-load retry. Existing department, financial, canon, military and battle/casualty flows still pass. Screenshots visually inspected; no physical phone/Safari certification claimed.
- Typecheck, production build and all 14 protected source hashes passed.
- Checkpoint checkpoint/saved-record-details-2026-10-26; portable backup verified 46 files; isolated restore passed integrity/FK/migrations 1–8. All 59 live tables equal checkpoint and restored copies, with seven projects and zero production test drafts/reports. Runtime backups and preservation JSON are ignored and excluded from Git.

Universal typed-domain search, native deep links into every departmental profile/history and richer prerequisite authoring remain separate work. Hosted Site unchanged.
