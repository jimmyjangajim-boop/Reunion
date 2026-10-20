# Acceptance checks

The specification's invariants are covered as follows. A passing invariant test does not imply a complete subsystem around that invariant.

| #   | Required behavior                           | Verification                                                                                          |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Original sources preserved                  | All 14 extracted byte hashes match the supplied manifest; original ZIP retained.                      |
| 2   | Idempotent reimport                         | Repeat import retains identical source/assertion/evidence/timeline counts.                            |
| 3   | Overrides preserve old evidence             | Darius snapshot and superseded Jack assertion both retained.                                          |
| 4   | King and heir distinct                      | Stable separate entity IDs with the repeated designation and open issue.                              |
| 5   | Darius Vice President                       | Date-specific 1992-10-03 snapshot, cited direct correction.                                           |
| 6   | Rehn then Curro, no invented dates          | Ordered succession rows with null dates and relative descriptions.                                    |
| 7   | 400 seats and constitutional inconsistency  | Actual 400, legal maximum 300, party total 400, occupied capacity unknown.                            |
| 8   | Dispute does not block ordinary entry       | Domain test and desktop/phone entity-entry workflow with unresolved naming issue.                     |
| 9   | Exclusive asset assignment                  | Overlapping tracked vessel/aircraft assignment rejected by service/SQLite trigger.                    |
| 10  | Order does not equal arrival                | Completed history empty until explicitly confirmed; browser movement workflow.                        |
| 11  | Historical OOB preserved                    | Parent and strength before transfer differ correctly from subsequent state.                           |
| 12  | Undelivered assets not operational          | Initial procurement operational zero; undelivered assignment rejected.                                |
| 13  | Vote capacity enforced                      | Over-capacity and unknown-occupation votes rejected; no inferred threshold.                           |
| 14  | Fiscal stages separate                      | Distinct committed/actual entries and overrun warning/override.                                       |
| 15  | Historical finance immutable across imports | Economic observations identical after repeat import.                                                  |
| 16  | Casualty categories remain distinct         | KIA/WIA/MIA/POW and alternate unspecified phase stored separately.                                    |
| 17  | Restricted deployment warning               | Šibenik order/arrival checks; explicit override required.                                             |
| 18  | Incomplete dates preserved                  | Month/year/decade/relative/unknown labels retained without manufactured precision.                    |
| 19  | Unapproved simulations do not alter canon   | Simulated confirmed assertion rejected; draft orders and time preview have no effect before approval. |
| 20  | Backup restoration retains records          | SQLite roundtrip test plus backup/restore CLI comparison of national tables.                          |

Additional checks cover hierarchy cycles, atomic rollback of a failed multi-action event, cabinet term overlap, source immutability, permanent review history, search syntax safety, import staging/rollback, mobile overflow, and visible disputed fiscal labeling.
