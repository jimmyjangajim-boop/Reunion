# National report pipeline

`national_reports` links an immutable original `sources` row to reviewable `report_actions`. `report_reviews` is append-only. All departments use the same SQLite database.

1. Submit record or scenario text, up to 500,000 characters, preserving exact original content and line ranges. SHA-256 over mode/date/correction/source content makes repeated identical submissions idempotent.
2. Deterministic extraction matches exact existing unit and location names. Supported order forms include `Order [unit] to [location]` and `[unit] was ordered to deploy to [location]`. Arrival forms include `[unit] arrived in [location]` and `[unit] completed deployment to [location]`. Put statements on separate lines. ISO date headers can scope subsequent lines.
3. Unknown matches or dates remain missing. Other prose becomes proposed archive entries with no inferred administrative effects. Submission itself does not change canon.
4. Review original source, warnings and proposed changes. Correct proposed fields with a reason, select valid changes and approve them together. Revision checks reject stale reviews.
5. Revalidate every selected action. Existing military domain services enforce prior-order, date and treaty restrictions. One immediate transaction writes department effects, source-linked timeline, action state and audit history. Failure rolls everything back.
6. Applied reports survive restart. Unselected changes remain pending. Scenario reports cannot be approved into canon. Corrective reports retain links to prior reports; automatic reversal of earlier effects is not implemented.

One deferred detail issue per report avoids hundreds of low-value questions for unsupported prose. Diplomatic and appointment extraction remain future typed actions; no AI-generated SQL or arbitrary mutations are accepted.


## Parliamentary reports, migration 004

Supported explicit forms include `Parliament passed Bill IDENTIFIER: Title`, `Parliament introduced Bill IDENTIFIER`, `Parliament is considering Bill IDENTIFIER`, `Bill IDENTIFIER was enacted`, and `President Donahue signed Bill IDENTIFIER into law`. `The Assembly`, `approved`, and `considered` have equivalent bounded forms. An identifier must follow the explicit word Bill. Unsupported, conditional or negative prose remains an archive proposal. Extraction does not invent identifiers or infer a financial effect from a monetary bill title.

Review offers an existing-bill selector plus reported identifier, optional title, actual stage and explicit effective date. Unknown titles and dates remain unknown. A proposed effective date requires explicit enactment. Existing known titles/effective dates cannot be silently overwritten. Dates are checked against sourced stage history and the legacy introduction date; retroactive commencement is flagged for review rather than prohibited by an invented constitutional rule.

Approval records consideration, introduction, passage or enactment in the same `bills` register as Parliament. The register retains the furthest reported stage; a sourced earlier stage can backfill history without regressing it. Introduction and effective dates are supplied only when reported explicitly. These actions create no vote totals, appropriations, commitments or payments. A successful manual vote remains a separate record and does not auto-enact legislation.

`bill_events` and `bill_event_evidence` are append-only. Evidence retains every supporting original report/action and line range. The same bill/stage/date/effective-date tuple corroborates an existing event rather than duplicating its national timeline entry. Exact repeated report submissions remain idempotent.

Each proposal captures the current bill state. Another approved report changing that bill makes the proposal stale until a reasoned correction reviews the new state. Bulk approval checks every legislative baseline before writes, then revalidates each action against earlier effects in the same transaction. Conflicting dates, titles or references roll back all selected department changes together. Existing report action IDs and review states survive migration 004.


## Financial reports, migration 005

Financial reports reuse the existing budgets and ledger. Supported bounded wording is `Treasury disbursed USD 100 for Budget NAME; reference PAY-1: Memo`. Verbs also include `proposed`, `authorized`, `committed`, `appropriated`, and `recorded actual expense of`. For an unambiguous budget increase use `Treasury added an appropriation of USD 100 to Budget NAME; reference APP-1`. One financial statement goes on each line; ISO date context works as for other reports. Grouped whole-unit numbers such as `1,000` are supported. Dollars without a currency code, fractional amounts, transfers and conditional prose are not inferred.

Review requires an existing budget, explicit currency/whole-unit amount, exact date, stage and transaction reference. Match budget names exactly or select the specific account/year/currency when ambiguous. Reports do not invent funding accounts or FX conversions. A plain reported appropriation stays pending until the reviewer confirms the amount increases the existing limit; it cannot silently restate an existing total as new funding. Initial budget establishment remains the sourced Treasury form.

Only an explicit additional appropriation raises the existing budget limit and records its before/after amount. Proposed/authorized entries do not raise that limit. Commitments, disbursements and actual expenses remain separate stages and are never summed as one expense. No revenue, debt, transfers, payment or actual expense is generated merely because an appropriation or bill passes.

A budget/stage/reference identifies a transaction. Repeated reports of the same amount/date/currency add source evidence without another ledger entry, timeline event or appropriation increase. A conflict under that reference blocks approval. Separate payments require separate references. Similar legacy entries raise a warning rather than silently merge; legacy records have no reliable automatic reference identity.

Budget/ledger hashes reject stale pending proposals until a reasoned correction. Approval checks all original baselines, then applies selected changes in report line order with fresh validation in one transaction. Preview can show a payment funded by an earlier pending additional appropriation, with an explicit dependency warning. If that increase is deselected, or another payment exhausts the funds, approval fails and rolls everything back. Several stages of a transaction can share one reference without being merged across stages.

Authorization checks compare each stage separately against the recorded limit and known dated increases. A future appropriation cannot fund earlier spending. Backdated entries are also checked against later spending dates before subsequent increases. Exceeding the recorded appropriation requires an explicit override reason, preserved on the entry. Fiscal-year mismatch is flagged; no unknown fiscal/legal rule is invented. Treasury shows sourced references/evidence and limits adjusted for known dated increases. The initial base limit may lack a commencement date, so this is not a complete historical budget reconstruction.

Reported ledger entries, transaction references, evidence and appropriation adjustments are preserved by triggers. New corrections/reversals, returns, cancellations and balanced reallocations remain future work. Automatic undo is not implemented; corrective reports do not delete old transactions. Scenario financial proposals cannot be approved into canon.


## Combined Battle / After-Action Reports, migrations 006–007

Open Battles → New Battle / After-Action Report. Preserve the engagement account, create/select a battle, supply a stable report/phase reference and enter known date/location/belligerents/outcome. Add existing formations, unresolved reported names or explicitly create a supplied formation with branch/type. Enter KIA/WIA/MIA/POW/unspecified separately; blank is unknown and zero is explicit. Add equipment losses with nullable quantities and optional participant/explicit tracked asset.

Save report and review stages one battle action and an immutable original. No domain writes occur at submission or suggestion. Review displays the structured result and source; corrections require reasons. Approval validates current references/state and commits battle, formations, phase, participants, known casualty rows, losses, selected asset effects, timeline and audit together. Any failure rolls back every effect. Rejection records a reason without domain effects. Report queues/history survive restart and are also linked from National Report Center. Generic Report Center bulk approval excludes battle actions so they receive the dedicated full review. Scenarios cannot be adopted into canon.

The deterministic suggestion button recognizes limited explicit dates, near/at place names, exact OOB names or a bounded ordinal formation name, and unambiguous category counts. It leaves name/reference/outcome/losses for review and does not create formations. Missing-year dates use only explicitly supplied report-date context, with a warning; otherwise they remain unknown. Multiple formations, conflicting count mentions and conditional/negative/enemy prose require manual attribution. This is not general English extraction, an external model call or an automatic canon importer.

A battle/reference identifies one combat phase. Equivalent structured facts add evidence without duplicating casualty/loss/asset/timeline effects. Conflicting facts under that reference block; a genuinely distinct phase needs a different reference. Existing base battle records and legacy casualty reports are preserved. A reasoned proposal correction is required after relevant database changes. Automatic undo or supersession of an approved casualty/loss phase is not implemented; do not evade a known conflict by inventing a new phase.

Explicit tracked asset updates require count 1, lost/damaged state, an exact day and valid service/assignment chronology. Known later assignments/effects block backdated losses. Lost closes active assignments at the recorded day; damaged keeps them. The old state and assignment rows are preserved in effects/audit. Unidentified loss counts remain informational; there is no automatic strength/readiness, inventory, territory, cost or cash adjustment. Operational outcome is sourced text rather than a fabricated territorial transition.
