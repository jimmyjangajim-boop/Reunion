# Canon governance and preservation rules

This is an archival note for a future Codex implementation, **not the final Codex build prompt**.

## Evidence tiers
1. Explicit newest user canon correction/decision, dated and recorded.
2. Approved in-universe event resolved during roleplay (ideally original full transcript).
3. Authoritative dated baseline supplied by user, except overridden fields.
4. Other uploaded primary source/draft files, which may describe proposals, snapshots and commentary.
5. Prior assistant summary/recovered-chat note: SECONDARY, to be corroborated.
6. Suggestions, simulations, options and plans: NOT FACTS until approved.

**Caution:** Recency alone is not sufficient. Later content may describe earlier events or be a proposed alternate scenario. Each claim needs an event date, a source date, and a status.

## Data model needs
- `fact_id`, `canonical_subject`, `predicate`, `value`, `source_file`, `source_line_start`, `source_line_end`, `source_type`, `in_world_date_or_interval`, `recorded_date`, `status`, `confidence`, `overridden_by`, `notes`.
- Separate `disputed`, `superseded`, `unknown`, `proposed`, `planned`, `ordered`, `delivered`, `operational`, `completed` statuses.
- Keep true gaps as `null` and preserve bounds like `sometime in the 1970s` or `a couple days after appointment`; no fake dates.
- Casualty numbers must specify KIA/WIA/MIA/POW vs unspecified losses before being added together.
- Treat political, border, succession and unit nomenclature independently; one typo does not justify rewriting others.

## Human adjudication
Conflicts need an explicit human choice: **accept source A**, **accept source B**, **merge with explanation**, **supersede both with new canon**, or **leave unresolved**. Save every decision, rationale and past version.
