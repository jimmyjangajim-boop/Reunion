# Cabinet and Government directory refinement — 22 October 2026

This increment extends the existing directory; it does not replace RNAS or change canon. It follows USER_RECORDS_DIRECTIVE.txt and the user's explicit approval to continue after the Cabinet inspection.

## Changes

- Ministry/institution names open office profiles. Official names open officeholder profiles. Both views share a source-backed dialog with direct switching, appointment/affiliation/responsibility fields and labeled history. The profile is extracted into `CabinetProfile.tsx` rather than expanding the directory component.
- The roster shows appointment date and political affiliation when established. Unknown dates and affiliations remain explicit. A missing official is not treated as a vacancy; explicit vacancy and disputed holder states remain distinct.
- Government separates The Presidency from The Crown. Cabinet retains President and Vice President above the ministries. Navigation connects Government and Cabinet without duplicating their record workflows. No portraits, political affiliations, responsibilities or officeholders are invented.
- Dated confirmed appointments for the exact recorded leadership role can resolve the officeholder without creating a duplicate institution row. Existing source observations remain intact. Dashboard President/VP/monarch widgets and the heir summary consume the same Cabinet projection used by the directory. `government` in the API remains the preserved assertion-based canon register; `cabinet` is the resolved administrative directory. No assertion is silently rewritten.
- Profile selection retains a stable office ID and selected date, then resolves against the current payload. A profile from another selected date is not retained as a stale copied row.
- Related events exclude future/unbounded dates, rejected/superseded and archive-only 1725 material. Explicit linked person IDs work alongside labeled name mentions; a mention is not participation. Canon and operational states remain visible.
- Personal records observed by the selected date are separate from undated reference records. Established interval records remain available after their known start without waiting for the validity interval to end. Future point facts are excluded. Canon/operational labels are retained; a dated plan is not a completed outcome.
- Related legislation uses the existing shared `billAtDate()` resolver, including source events, so later/undated enactment does not appear in an earlier profile. The API reads bill events once for both Parliament and Cabinet.
- Term histories belong to the office, rather than borrowing every other office held by the same person. The history and observation sections explicitly cover all recorded dates. Term approval states and source links are visible, and archive-only 1725 terms do not become current officials. Unknown term dates remain unknown.
- Mobile rosters show labeled ministry/official/office/date/affiliation entries without horizontal scrolling. Desktop retains the compact table. The existing appointment, office creation and decision commands remain unchanged.

## Defects versus usability changes

Actual read-model defects addressed: all-time/future personal events and legislative stages leaking into dated profiles; unrelated offices included in a person's apparent term history; dated exact-role leadership appointments not represented consistently; profile objects retained independently of the current date/payload. These are display/projection corrections, not canon revisions.

Clickable office profiles, branch headings, roster metadata, navigation and responsive entries are usability refinements. They are not evidence that the prior data was invalid.

## Boundaries

Role matching for leadership is explicit: President, Vice President, Reigning monarch and Heir. Arbitrary custom office names are not guessed into these roles. Conflicting active terms remain disputed. Confirmed dated appointments follow the existing administrative appointment precedence used for ministries; creating them still requires the existing explicit approval workflow. A displayed administrative appointment does not silently supersede preserved canonical assertions.

Undated canon references are labeled and never described as dated appointments. Baseline minister observations are not appointment dates and do not carry into unrelated dates. Finance's original undated term rows are not rewritten from a succession mention; the reviewed 25 June succession fact and the original evidence remain preserved. Exact term-date reconciliation and richer institutional establishment/closure histories remain separate reviewed operations.

All recorded sources can be opened from the evidence disclosure, including sources about dates other than the current selector. The dated profile sections determine current applicability. Full term history is intentionally not an as-of roster. Biographical completeness, source attribution for every existing generic office, inline office creation inside appointment drafts and advanced person-profile navigation remain future work.

## Preservation and verification

Checkpoint tag `checkpoint/cabinet-directory-2026-10-22` protects Parliament commit 0824dfcd907b9a79cef0639491e4553904c25e1d. Branch `feature/cabinet-directory-2026-10-22` builds on it. No migration, dependency or runtime data modification.

All 59 live tables match `backups/before-cabinet-directory-2026-10-22.sqlite` exactly. The corresponding portable ZIP verifies 46 database/evidence files with migrations 1–8. Its database restored separately into `data/cabinet-directory-restore-proof.sqlite`, passes integrity/foreign-key checks and matches all 59 live tables. Results are in ignored `backups/cabinet-directory-preservation-check.json`. Canon, original sources, national budget and all seven corrected project envelopes are unchanged. Runtime databases/backups are excluded from Git.

Validation: 190 domain/API tests across 16 files, 44 desktop/emulated-phone browser checks, typecheck, production build and all 14 original-source hashes. Cabinet tests cover explicit leadership terms, office-only history, interval/past/future/undated facts, archive exclusion, explicit entity links and shared dated legislation. Browser flows exercise ministry/person profile switching, historical unknowns, Government/Cabinet navigation and an isolated appointment displayed consistently across dashboard and both directory screens. The fictitious test appointment exists only in the temporary browser database. Desktop and phone screenshots are inspected; no physical-device, exhaustive accessibility or load-testing claim.

Next bounded work: military organizational/administrative views and universal search under the records directive. Preserve working Cabinet and Parliament flows; no combat simulator, autonomous decisions or AI-first extraction expansion.
