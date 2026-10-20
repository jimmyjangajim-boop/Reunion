# National report pipeline

`national_reports` links an immutable original `sources` row to reviewable `report_actions`. `report_reviews` is append-only. All departments use the same SQLite database.

1. Submit record or scenario text, up to 500,000 characters, preserving exact original content and line ranges. SHA-256 over mode/date/correction/source content makes repeated identical submissions idempotent.
2. Deterministic extraction matches exact existing unit and location names. Supported order forms include `Order [unit] to [location]` and `[unit] was ordered to deploy to [location]`. Arrival forms include `[unit] arrived in [location]` and `[unit] completed deployment to [location]`. Put statements on separate lines. ISO date headers can scope subsequent lines.
3. Unknown matches or dates remain missing. Other prose becomes proposed archive entries with no inferred administrative effects. Submission itself does not change canon.
4. Review original source, warnings and proposed changes. Correct proposed fields with a reason, select valid changes and approve them together. Revision checks reject stale reviews.
5. Revalidate every selected action. Existing military domain services enforce prior-order, date and treaty restrictions. One immediate transaction writes department effects, source-linked timeline, action state and audit history. Failure rolls everything back.
6. Applied reports survive restart. Unselected changes remain pending. Scenario reports cannot be approved into canon. Corrective reports retain links to prior reports; automatic reversal of earlier effects is not implemented.

One deferred detail issue per report avoids hundreds of low-value questions for unsupported prose. Financial, diplomatic and appointment extraction remain future typed actions; no AI-generated SQL or arbitrary mutations are accepted.


## Parliamentary reports, migration 004

Supported explicit forms include `Parliament passed Bill IDENTIFIER: Title`, `Parliament introduced Bill IDENTIFIER`, `Parliament is considering Bill IDENTIFIER`, `Bill IDENTIFIER was enacted`, and `President Donahue signed Bill IDENTIFIER into law`. `The Assembly`, `approved`, and `considered` have equivalent bounded forms. An identifier must follow the explicit word Bill. Unsupported, conditional or negative prose remains an archive proposal. Extraction does not invent identifiers or infer a financial effect from a monetary bill title.

Review offers an existing-bill selector plus reported identifier, optional title, actual stage and explicit effective date. Unknown titles and dates remain unknown. A proposed effective date requires explicit enactment. Existing known titles/effective dates cannot be silently overwritten. Dates are checked against sourced stage history and the legacy introduction date; retroactive commencement is flagged for review rather than prohibited by an invented constitutional rule.

Approval records consideration, introduction, passage or enactment in the same `bills` register as Parliament. The register retains the furthest reported stage; a sourced earlier stage can backfill history without regressing it. Introduction and effective dates are supplied only when reported explicitly. These actions create no vote totals, appropriations, commitments or payments. A successful manual vote remains a separate record and does not auto-enact legislation.

`bill_events` and `bill_event_evidence` are append-only. Evidence retains every supporting original report/action and line range. The same bill/stage/date/effective-date tuple corroborates an existing event rather than duplicating its national timeline entry. Exact repeated report submissions remain idempotent.

Each proposal captures the current bill state. Another approved report changing that bill makes the proposal stale until a reasoned correction reviews the new state. Bulk approval checks every legislative baseline before writes, then revalidates each action against earlier effects in the same transaction. Conflicting dates, titles or references roll back all selected department changes together. Existing report action IDs and review states survive migration 004.
