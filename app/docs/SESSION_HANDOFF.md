# Current handoff: consolidated verified baseline

26 October 2026. Start from release/verified-baseline-2026-10-26 and its single combined review against main. The application runtime is unchanged from 87cd925 (universal-search PR #10). Consolidation adds one upgrade-preservation regression test and current documentation. The ten incremental commits/branches remain preserved; their earlier review records are superseded by the combined baseline rather than independently merged.

## Read first

- IMPLEMENTATION_STATUS.md: one current status, including what is incomplete.
- FEATURE_RUNDOWN.md: the full current user-facing feature guide.
- BASELINE_2026-10-26.md and baseline-2026-10-26.json: review chain, checks and recovery evidence.
- ../../ARCHITECTURE.md: UI/domain/read/write/canon boundaries.
- CANON_AUTHORITY.md and latest direct user decisions: preserve canon and the approved budget.
- ROADMAP.md: next bounded work; original historical plans are not current priorities.

The earlier accumulated handoffs are preserved at history/before-verified-baseline-2026-10-26/SESSION_HANDOFF.md. Do not restart the completed architecture audit or reimplement the working systems from those old plans.

## Verified state

219 domain/API tests, 66 desktop/emulated-phone checks, typecheck, production build and 14 source hashes passed. New regression verifies all 53 pre-existing data/history tables survive schema-7 reconstruction → current schema upgrade. A fresh setup reproduces 25 core tables excluding recording timestamps and a repeated setup leaves all 59 tables unchanged. This is an upgrade/reconstruction proof, not recovery of the missing deleted-chat database.

Code checkpoint: checkpoint/verified-baseline-2026-10-26. Ignored runtime recovery artifacts: app/backups/pre-baseline-2026-10-26.bundle (complete Git history/38 refs), before-verified-baseline-2026-10-26.sqlite and .zip (46 verified portable files), app/data/verified-baseline-restore-proof.sqlite and verified-baseline-fresh-setup.sqlite. See app/backups/verified-baseline-preservation-check.json and verified-baseline-upgrade-check.json. All 59 live tables match checkpoint/restore exactly. Never restore a test copy over the live database.

No production test entries, new canon, budget/project edits, runtime schema changes, dependency changes or hosted Site deployment in this consolidation. General National Report Center remains mothballed; shared report services and the reviewed Battles workflow remain functional. New Record is primary. Simulation, automatic decision-making and AI-first extraction expansion stay frozen.

## Next work

Finish review of the combined baseline before another major subsystem. Then implement one missing guided record/prerequisite workflow at a time through existing validated commands. Versioned subsystem import previews, sourced parliamentary mandates, procurement/accounting lifecycles and deeper historical dossiers remain unfinished. Do not fabricate missing dates, boundaries, portraits, balances, deliveries, personnel, members or activity to fill the interface.

The runtime source/script/migration/package tree hashes are recorded in baseline-2026-10-26.json. Main promotion and hosted deployment are separate actions; a prepared combined review does not mean either occurred.
