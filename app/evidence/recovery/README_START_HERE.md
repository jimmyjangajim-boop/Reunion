# REUNION — CANON RECOVERY PACK

**Created 18 October 2026**  
**Purpose:** Give Codex the most comprehensive Reunion dataset accessible from this ChatGPT project and stored Reunion Library materials, without falsifying history or overwriting conflicting records.

## What is included

- **14 original text documents**, untouched, containing about **8,000 lines of lore**, pulled from the Reunion project attachments and distinct Library variants.
- Original 3 October 1992 political, military, economic and political-composition baselines; Constitution outline; Curro's policy notes and finance reporting; historic **1725 Kingdom of Reunion baseline** including 15th–17th-century wars; multiple later political/economic documents, including a 3 October 1992 Assembly broadcast and an **11 October 1993 Altis** war report.
- **Modern_History_Chat_Recovery.md**: secondary recovery of lore discussed in earlier Reunion chats (1970s Greek war, presidents, March 1992 Greek-Soviet war, April REF uprising, Croatia/Dalmatia/Ploče, Oct 1992 snapshot, 1993 Altis).
- **CONFIRMED_USER_OVERRIDES.md**: latest authoritative corrections: Zo III king and Zo III heir (literal ambiguity preserved), VP Darius Younger, Rehn killed/Curro replacement, Šibenik DMZ/Croatia border, 400-seat Parliament and its constitutional illegality, Oct 1992 baseline authority.
- **Conflict and missing-data registry**, with explicit problems rather than invented repairs.
- **Machine-readable timeline, battle, people and conflict tables** (TSV and/or CSV), plus source segments in JSON Lines.
- **Fast-search SQLite database** with FTS5 index over original source text and associated file/line locations.
- **Full original-source inventory** with paths, SHA-256 hashes, file IDs, line counts, indexed headings and topical concordance.

## IMPORTANT: this is not a full chat export

This package contains every DISTINCT text source made available in the Reunion project attachments and the additional Reunion Library versions found during preparation. It also includes useful material recovered from prior chat summaries. However, this system **cannot bulk-export the entire ChatGPT project conversation history or Discord chats**. The recovered-chat lore is secondary, NOT a verbatim transcript. Some facts may remain incomplete until original chats/Discord are imported.

**Another project's 'Eveis Operational Military Map' was found while exploring the broader Library but deliberately excluded** after visual inspection: it shows a science-fiction/Carina War setting, not Reunion. No reliable Reunion-specific source maps or image assets were found in the accessible Reunion folder.

## Folder guide

```
README_START_HERE.md
MANIFEST.json
01_ORIGINAL_SOURCES/
  Project_Attachments/   10 unique, untouched files
  Library_Variants/      4 separate, untouched files not mounted here by original names
02_RECOVERED_CHAT_LORE/
  Modern_History_Chat_Recovery.md
03_CANON_AND_CONFLICTS/
  CONFIRMED_USER_OVERRIDES.md
  CANON_STATUS_RULES.md
  UNRESOLVED_CONFLICTS_AND_GAPS.tsv
  MISSING_DATA_PRIORITY_LIST.md
04_SEARCH_INDEX/
  FILES_MANIFEST.csv
  SECTION_HEADINGS.csv
  TOPIC_COUNTS.csv
  TOPIC_CONCORDANCE.csv
05_STRUCTURED_DATA/
  reunion_source_search.sqlite
  source_segments.jsonl
  chronology_recovered.tsv / .csv
  issues_and_gaps.csv
  battle_claims_recovered.tsv / .csv
  people_roles_recovered.tsv / .csv
06_FOR_CODEX_LATER/
  HANDOFF_NOTES.md
```

## Which files to read first

1. `03_CANON_AND_CONFLICTS/CONFIRMED_USER_OVERRIDES.md`: newest authority.
2. `01_ORIGINAL_SOURCES/Project_Attachments/REUNION-MASTER-POLITICAL-—-BASELINE-v1.txt`: comprehensive **3 Oct 1992 baseline**, subject to explicit overrides.
3. `REUNION-—-ECONOMIC_LEDGER.txt.txt`, `REUNION-MILITARY-ORDER-OF-BATTLE.txt`, `REUNION-—-POLITICAL_COMPOSITION.txt.txt`, and `The-Constitution-of-Reunion.txt` for national mechanics.
4. `01_ORIGINAL_SOURCES/Project_Attachments/RP Map And Battles.txt`: detailed **1725** national/earlier-historical base; six Venetian wars, Estates, population, debt, military, geography, institutions and diplomacy. Accepted by user as 1725 canon.
5. `01_ORIGINAL_SOURCES/Library_Variants/Master Political V2(1).txt`: 3 Oct 1992 RBD announcement of dissolution.
6. `01_ORIGINAL_SOURCES/Library_Variants/Master Political V2(2).txt`: 11 Oct 1993 RBD Altis conflict report.
7. `02_RECOVERED_CHAT_LORE/Modern_History_Chat_Recovery.md`: recovered lore not otherwise preserved in primary files; caution: lower evidentiary rank.

## Recommended evidentiary priority

- New explicit player/user confirmation outranks older conflicting drafts.
- Historical events already played/resolved outrank proposals.
- Date-specific baseline establishes what was in effect on that day, unless overridden.
- The original filenames and raw bytes have been preserved; a later draft may contain valuable additions but shouldn't silently overwrite the earlier baseline.
- Unknowns stay unknown. Keep a distinction between "planned", "ordered", "contracted", "delivered", "operational", and "completed". Preserve exact casualties with their meaning and date.

## How to find records

- Open `04_SEARCH_INDEX/SECTION_HEADINGS.csv` for source navigation.
- Open `04_SEARCH_INDEX/TOPIC_CONCORDANCE.csv` for per-topic exact line references.
- `05_STRUCTURED_DATA/source_segments.jsonl` contains line-numbered chunks of the original files for Codex/ingestion.
- SQLite includes `sources`, `chunks`, `chunks_fts`, `timeline`, and `issues` tables.

Example SQLite query (works with standard Python `sqlite3`):

```sql
SELECT chunks.source_path, chunks.line_start, substr(chunks.text, 1, 240)
FROM chunks_fts
JOIN chunks ON chunks.id = chunks_fts.rowid
WHERE chunks_fts MATCH 'Dalmatia'
LIMIT 20;
```

## Constraints

No primary TXT file has been rewritten, normalized or repaired. Some original files are assistant-generated speeches, plans, or analyses: **not every assertion in them establishes canon**. No dates or military deliveries should be silently invented from estimates. There is intentionally **no finalized Codex build prompt** here, because the user wants to design that after inspecting this evidence package.
