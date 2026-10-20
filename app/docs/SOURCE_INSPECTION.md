# Source inspection and import coverage

All 14 original texts were read during source inspection. The supplied corpus remains unchanged.

| Source                                     | Lines | SHA-256 check    |
| ------------------------------------------ | ----: | ---------------- |
| Master Economics V1(1).txt                 |   288 | Matches manifest |
| Master Political V2(1).txt                 |   382 | Matches manifest |
| Master Political V2(2).txt                 |   332 | Matches manifest |
| Master Political V2.txt                    |   181 | Matches manifest |
| Curros-Plans.txt                           |   135 | Matches manifest |
| Master Economics V1.txt                    |   339 | Matches manifest |
| Master Political V2.txt                    |   291 | Matches manifest |
| REUNION-MASTER-POLITICAL-—-BASELINE-v1.txt |  1923 | Matches manifest |
| REUNION-MILITARY-ORDER-OF-BATTLE.txt       |   268 | Matches manifest |
| REUNION-—-ECONOMIC_LEDGER.txt.txt          |   180 | Matches manifest |
| REUNION-—-POLITICAL_COMPOSITION.txt.txt    |    92 | Matches manifest |
| RP Map And Battles.txt                     |  2685 | Matches manifest |
| Reunion master political.txt               |   307 | Matches manifest |
| The-Constitution-of-Reunion.txt            |   605 | Matches manifest |

Both recovery documents were inspected as secondary evidence. Recovery rows bearing labels such as user-confirmed are not promoted solely on that label. Only explicitly corroborated primary events are approved on import.

## Structured files

- `03_CANON_AND_CONFLICTS/UNRESOLVED_CONFLICTS_AND_GAPS.tsv`: 26 rows. Columns: id, priority, category, issue, known_state, resolution_needed.
- `04_SEARCH_INDEX/FILES_MANIFEST.csv`: 14 rows. Columns: relative_path, original_filename, size_bytes, sha256, lines, project_or_library_file_id, kind, raw_file_not_modifed.
- `04_SEARCH_INDEX/SECTION_HEADINGS.csv`: 717 rows. Columns: file, line, heading, pattern.
- `04_SEARCH_INDEX/TOPIC_CONCORDANCE.csv`: 1016 rows. Columns: file, topic, line, excerpt.
- `04_SEARCH_INDEX/TOPIC_COUNTS.csv`: 69 rows. Columns: file, topic, matching_lines.
- `05_STRUCTURED_DATA/battle_claims_recovered.csv`: 27 rows. Columns: id, battle_or_operation, date_or_window, belligerents, Reunion_losses_recalled, Other_losses_recalled, casualty_category, claim_status, caveats.
- `05_STRUCTURED_DATA/battle_claims_recovered.tsv`: 27 rows. Columns: id, battle_or_operation, date_or_window, belligerents, Reunion_losses_recalled, Other_losses_recalled, casualty_category, claim_status, caveats.
- `05_STRUCTURED_DATA/chronology_recovered.csv`: 44 rows. Columns: id, earliest_date, latest_date, precision, event, status, evidence.
- `05_STRUCTURED_DATA/chronology_recovered.tsv`: 44 rows. Columns: id, earliest_date, latest_date, precision, event, status, evidence.
- `05_STRUCTURED_DATA/issues_and_gaps.csv`: 26 rows. Columns: id, priority, category, issue, known_state, resolution_needed.
- `05_STRUCTURED_DATA/people_roles_recovered.csv`: 29 rows. Columns: id, name, role_or_connection, in_universe_period, source_status, warning.
- `05_STRUCTURED_DATA/people_roles_recovered.tsv`: 29 rows. Columns: id, name, role_or_connection, in_universe_period, source_status, warning.
- `05_STRUCTURED_DATA/source_segments.jsonl`: 184 line-referenced original-source segments.

## Supplied archival SQLite index

Opened read-only for schema and row inspection. It remains in evidence; the app uses a separate relational database.

- `sources`: 14 rows; full table scanned.
- `chunks`: 184 rows; full table scanned.
- `timeline`: 44 rows; full table scanned.
- `issues`: 26 rows; full table scanned.

## Extraction limits

Archive and staging preserve all text. Normalization is deliberately selective. Every original claim has not been manually encoded as a national state variable. Review source lines before promoting additional assertions.

The 1725 accepted baseline and corroborated Venetian-war entries are sourced directly. October 1993 Altis is its own dated record. Cabinet table entries retain a 1992-10-03 observation date; original appointment dates remain unknown.

Missing records are represented as unknowns or review issues. No geographic coordinates or subsequent outcomes were inferred.
