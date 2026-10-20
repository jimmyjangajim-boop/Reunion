# National report pipeline

`national_reports` links an immutable original `sources` row to reviewable `report_actions`. `report_reviews` is append-only. All departments use the same SQLite database.

1. Submit record or scenario text, up to 500,000 characters, preserving exact original content and line ranges. SHA-256 over mode/date/correction/source content makes repeated identical submissions idempotent.
2. Deterministic extraction matches exact existing unit and location names. Supported order forms include `Order [unit] to [location]` and `[unit] was ordered to deploy to [location]`. Arrival forms include `[unit] arrived in [location]` and `[unit] completed deployment to [location]`. Put statements on separate lines. ISO date headers can scope subsequent lines.
3. Unknown matches or dates remain missing. Other prose becomes proposed archive entries with no inferred administrative effects. Submission itself does not change canon.
4. Review original source, warnings and proposed changes. Correct proposed fields with a reason, select valid changes and approve them together. Revision checks reject stale reviews.
5. Revalidate every selected action. Existing military domain services enforce prior-order, date and treaty restrictions. One immediate transaction writes department effects, source-linked timeline, action state and audit history. Failure rolls everything back.
6. Applied reports survive restart. Unselected changes remain pending. Scenario reports cannot be approved into canon. Corrective reports retain links to prior reports; automatic reversal of earlier effects is not implemented.

One deferred detail issue per report avoids hundreds of low-value questions for unsupported prose. Parliamentary, financial, diplomatic and appointment extraction remain future typed actions; no AI-generated SQL or arbitrary mutations are accepted.
