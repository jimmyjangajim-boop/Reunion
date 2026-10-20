# Validation record

RNAS v0.1 delivery, 18 October 2026.

| Check                                 | Result                                                                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original source verification          | All 14 supplied primary text hashes match MANIFEST.json.                                                                                                              |
| Separately attached six project files | Each matches its ZIP counterpart byte-for-byte.                                                                                                                       |
| TypeScript                            | `npm run typecheck` passes.                                                                                                                                           |
| Domain and validation tests           | `npm test`: 31 passed, 2 files.                                                                                                                                       |
| Production build                      | `npm run build` passes; all application/API routes emitted.                                                                                                           |
| Desktop browser tests                 | 7 Playwright flows passed.                                                                                                                                            |
| iPhone-size browser tests             | 7 Playwright flows passed.                                                                                                                                            |
| Total automated test cases            | 45 passed.                                                                                                                                                            |
| Browser layout inspection             | Desktop and 390px phone dashboard inspected; no page overflow.                                                                                                        |
| Backup/restore CLI smoke test         | Restored assertions, sources, evidence, issues, timeline, appointments, chambers, units, and projects exactly match. Previous database retained as `.before-restore`. |
| Shipped database                      | 35 documents, 109 normalized assertions, 44 timeline entries, 175 open curated/generated issues. No browser-test fixtures included.                                   |

The browser tests use a separately seeded temporary database and temporary staged-import directory. Phone coverage is Chromium emulation, not physical-device or Safari engine testing. The initial browser pass found label/navigation timing issues; these were corrected and the full final suite passed.

A constrained environment blocked normal Playwright browser downloads. Final browser tests ran successfully using the included Linux Chromium fallback with `RNAS_BROWSER_PATH`. Standard installations may use `npx playwright install chromium` instead. No paid services were used.

The test suite covers the requested integrity invariants; it does not certify every planned national subsystem as complete. See `ACCEPTANCE.md` and `../IMPLEMENTATION_STATUS.md` for coverage and remaining limitations.
