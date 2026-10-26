# Universal search: primary registers

26 October 2026. Continues the existing records system. National Report Center remains mothballed.

## Findings and corrections

| Finding | Severity / classification | Affected files | Correction |
| --- | --- | --- | --- |
| Global search omitted operational records, so users had to repeat a search in several departments. | Medium capability/navigation gap. | Console.tsx; old LinkedSearchRecords.tsx | One broad category/type/page interface across the primary registers and archive. Replaced the old search component. |
| Previous global source/entity results were capped, with no complete source paging. | Medium search reachability defect. | Console.tsx; legacy canon search transport | New GET-only search service uses the existing paginated source helper and pages across normalized/source boundaries. Tests reach beyond 100 source passages with no omissions/duplicates. Legacy endpoints remain for compatibility. |
| Adding search details beside saved receipts could duplicate their read queries/field logic. | Structural risk prevented during this increment, not a newly reproduced data defect. | saved-record-details.ts; SavedRecordDetails.tsx | Extracted one explicit typed reader and shared read-only presentation. The receipt wrapper still supplies its own original evidence and approval metadata. |
| Opening source evidence closed Archive/Cabinet/unit profiles, losing context. | Usability refinement to existing intentional behavior. | ArchiveWorkspace.tsx; CabinetProfile.tsx; MilitaryUnitProfile.tsx; source layer in Console | Native source layer keeps the underlying profile open and selected. Close the source to return to that record. |

## Search coverage

Fourteen primary operational types: bills, appointments, offices, votes, formations, deployments/orders, procurement observations, tracked assets, battles, treaties, named locations, appropriations, ledger transactions and projects/programs. Archive identities, sourced facts, historical events, source filenames/paths and preserved text passages are also searchable.

Broad categories are People, Government & politics, Military, Diplomacy, Economy & treasury, Places, Historical archive and Sources. They are browsing labels; stored kinds and canon are unchanged. The separate type filter narrows results further. Twelve results per page; changing filters resets the page. Back to search preserves the current query/category/type/page. Unsuccessful requests have a retry action, and stale responses are discarded.

Search includes all recorded dates/statuses, including future records, superseded evidence and archive-only 1725. It does not change the historical selector, approve records, advance time or infer effects. Search hits show their type and available date/canon context. Source metadata and passages are different hit types and can refer to the same document; counts are hits, not unique original files. Open sources to inspect authority/tier, exact wording, line bounds and provenance.

Input is a focused name/phrase of up to twelve searchable words and 2,000 characters. All words must match; punctuation/SQL/FTS operators are treated as text tokens, never executable syntax. Longer word sequences fail visibly rather than silently ignoring the later words. This is search, not report detection or natural-language extraction.

## Exact record details and connections

Primary register hits open exact typed IDs in the shared reader. Archive hits open their existing detail workflow. Explicit sponsor/appointee/treaty-state/event links open identities; unit links open existing military profiles. Other typed links include transaction ↔ appropriation, appointment ↔ office, movement → destination, and vote → bill, with Back navigation between records. Related links are paged when necessary. Joined names are searchable; names are never used to join separate identities.

Details show current stored fields across all recorded dates, separately from a saved receipt and as-of departmental projections. Unknown terms/arrivals, zero counts and date precision remain explicit. Financial fields distinguish funding envelopes, appropriation, accounting stages and amounts; separators improve readability without rounding/rebalancing data. Source-reported project payments are not converted into ledger cash entries or physical completion. Procurement counts and battle phases are not aggregated into inferred readiness or losses.

Known line citations from guided entries, ledger reports, legislation and battle records are preserved. Other source links open whole originals, without guessed ranges. This is not a complete departmental history dossier: individual casualties/phases, asset assignments, strength observations, chamber/party composition series, audit/issues and every import/draft row are not separate primary search result types. Their existing workspaces/evidence remain available. Richer native profile integration and larger data-volume optimization remain future work.

## Architecture and verification

Client-safe record-catalog.ts; server-only fixed read definitions in domain-records.ts; validation and combined paging in record-search.ts; GET-only api/search; GlobalSearchWorkspace and shared RecordDetails. No new migration, dependency, persistent index, record store or write path. Existing creation/review/domain services remain authoritative. National Report Center and simulation expansion remain mothballed/frozen as requested.

Validation: 218 domain/API tests, 66 desktop/emulated-phone browser checks, typecheck, production build and all 14 protected source hashes passed. Desktop/phone layouts and source overlays were visually inspected. Tests use isolated databases. No physical iPhone/Safari, exhaustive accessibility or high-volume load certification is claimed. Recovery evidence: checkpoint/universal-search-2026-10-26; backups/before-universal-search-2026-10-26.sqlite and .zip (46 verified files); isolated restore data/universal-search-restore-proof.sqlite; all 59 production tables identical to checkpoint and restored copies. Runtime databases/backups and preservation JSON are ignored. Hosted Site unchanged.
