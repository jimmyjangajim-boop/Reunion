# Military organization and service records — 25 October 2026

The user's reattached records-first directive confirms the existing scope. This bounded increment extends the existing military administration UI; it does not build combat simulation, change canon, or recreate the database.

## Delivered

- Dedicated Armed Forces workspace: searchable formation hierarchy, manpower observations, equipment records and movement orders/deployments. The register retains real ancestors when a descendant matches search or branch filters. Native disclosure controls expand recorded subordinate relationships; no headquarters, chains of command or independence are invented when parents are unknown.
- Unit profiles show the latest existing `unitSnapshot()` observation, its date/source, personnel bounds, authorized strength, commander, garrison, readiness, mission, supply and recorded state. Formation/disbandment dates remain unknown when unsupported. Parent links open real unit profiles. Observation history has a selected-date/full-history switch and source links.
- The shared server snapshot now exposes already-stored state fields and observation provenance; the read operation performs no writes. Both hierarchy and manpower table consume that same snapshot rather than implementing a competing latest-state query.
- Unit equipment lists use explicit assignment intervals. They do not distribute procurement quantities to formations, infer equipment availability, or present the mutable latest asset condition as a historical condition. The complete asset identity register is separately labeled across all dates.
- Procurement rows are date-specific observations, with an explicit full-register mode. Ordered/delivered/operational values remain separate. No delivery, acceptance, serviceability or cash movement is inferred from elapsed time.
- A shared deployment register serves Armed Forces, individual unit profiles and the existing Military Map destination. It supports search, selected-date/full-history views, exact formation links, missions, treaty warnings and existing arrival confirmation. The large decorative map placeholder is replaced with a compact explanation that verified geometry is absent.
- Completed movements are not shown as arrived before their recorded arrival date. Because the existing completion command only accepts an ordered movement, a later-completed record is shown as ordered in earlier dated views; a second arrival action is never offered. Unknown completion dates and unrecorded cancellation dates remain explicit. Future arrival explanations/overrides do not appear in earlier dated views.
- Guided movement source citations and preserved approval/audit explanations are visible from the register. The API retrieves real receipt citations and distinct authority records, without generating new evidence. Source text and arrival approval remain preserved in their existing stores.
- Unit battle history uses only explicit unit/participant links. It retains phase references, outcome, source, canon labels, categorized casualty records, unknown/zero distinctions and separately reported equipment losses. Phase casualties are not duplicated as legacy casualties; unassigned national casualties are not attributed to every unit. Unknown or future phase dates require the explicit full-history view. Source evidence and the existing reviewed Battles workflow remain accessible.
- The existing New Record formation/deployment forms, unit/hierarchy updates, asset/assignment forms and reviewed battle operation remain shared. No parallel CRUD, simulator, natural-language extractor or financial command was added.

## Historical rules and limits

The formation register has two layers: recorded identities and the latest observation on/before the selected date. Known formation/disbandment bounds limit the dated identity list using inclusive endpoint conventions. Unknown dates do not establish existence on an arbitrary day; the UI says so. Latest observations retain their dates and are not recalculated present strength. National manpower totals would risk overlapping formations and unknown upper bounds, so none are fabricated.

Cyclic or unavailable parents remain flagged source issues. Rendering breaks unsafe links to avoid loops; it does not edit their stored history or invent replacement parents. Search context ancestors are labeled. All registered identities can be inspected separately, including records outside known formation dates.

Procurement snapshots are point observations; equipment assignment intervals are distinct. The asset schema does not fully model entry/serviceability history, so the dated assignment table omits latest register condition. Batch delivery/acceptance, aggregate inventories, replacement/maintenance pipelines and full fleet/wing service histories remain future work.

Movement orders are the supported military order type. Other order classes need specialized forms and validated operations. A cancellation flag lacks an effective cancellation timestamp in the current schema; its dated status is therefore not guessed. Confirm arrival reuses the existing atomic command and treaty checks. No map coordinates or territory are invented.

Unit battle history is an explicit-link register, not a semantic reconstruction from narrative names. Bounds support retrieval without assigning unknown exact days. Casualties across phases/categories are never combined or silently deducted from personnel. Archive-only 1725 and rejected/superseded parent battle records remain outside current military history. Additional source normalization and direct historical record routes remain separate work.

## Verification and recovery

Checkpoint tag `checkpoint/military-workspace-2026-10-25` protects Cabinet commit 83840b01194aa096ef3c8f3facba4f2fd8f08ad4. Branch `feature/military-workspace-2026-10-25` builds on it. No migration, new dependency, source edit or runtime data write.

All 59 live tables match `backups/before-military-workspace-2026-10-25.sqlite` exactly. Its portable ZIP verifies 46 database/evidence files, migrations 1–8. An isolated restore into `data/military-workspace-restore-proof.sqlite` passes integrity/foreign-key checks and matches all 59 live tables. Machine-readable comparison: ignored `backups/military-workspace-preservation-check.json`. Approved budget, defense/GDP figures, the seven reconciled economic projects and all other canon remain unchanged. Runtime databases/backups are not committed.

Validation: 197 domain/API tests across 17 files, 50 desktop/emulated-phone browser checks, typecheck, production build and 14 original-source hashes. New coverage includes hierarchy ancestry/cycles/missing links, formation dates, exact zero and unknown ranges, assignment intervals, procurement point dates, arrival chronology, phase identity attribution and date precision. Browser flows cover sourced unit profiles, hierarchy expansion, future orders, dated versus full registers and cross-page unit links, while preserving existing Cabinet/Parliament/Treasury/Battles/draft workflows. New fixtures are restricted to temporary test databases. Desktop and phone screenshots were inspected; physical-device, exhaustive accessibility and load testing are not claimed.

Next: universal search across typed domain records with direct profile navigation, followed by additional specialized guided forms and versioned subsystem exchange/import previews. Preserve these military views and the working review services; simulation expansion remains frozen.
