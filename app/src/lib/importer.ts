import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { all, one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { indexSource, addAssertion, detectIssues } from "./canon.ts";
import { dateValue } from "./dates.ts";
export const hash = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
export function parseCSV(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quote = !quote;
    } else if (c === "," && !quote) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quote) {
      row.push(field.replace(/\r$/, ""));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const head = rows.shift() ?? [];
  return rows.map((r) =>
    Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])),
  );
}
function walk(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(root, e.name)) : [path.join(root, e.name)],
  );
}
export function importRecovery(
  db: DB,
  root = path.resolve("evidence/recovery"),
) {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "MANIFEST.json"), "utf8"),
  );
  for (const src of manifest.primary_sources) {
    const bytes = readFileSync(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ root,
        src.relative_path,
      ),
    );
    if (hash(bytes) !== src.sha256)
      throw Error("Source checksum mismatch: " + src.relative_path);
  }
  const manifestHash = hash(readFileSync(path.join(root, "MANIFEST.json")));
  const batch = "recovery-" + manifestHash.slice(0, 16);
  if (one(db, "SELECT id FROM import_batches WHERE id=?", batch))
    return { duplicate: true, batch };
  return transaction(db, () => {
    db.prepare(
      "INSERT INTO import_batches(id,name,sha256,state) VALUES(?,?,?,'accepted')",
    ).run(batch, "Reunion canon recovery · 18 October 2026", manifestHash);
    const sources = new Map<string, string>();
    for (const file of walk(root).filter((f) =>
      /\.(txt|md|tsv|csv|json|jsonl)$/i.test(f),
    )) {
      const relative = path.relative(root, file).split(path.sep).join("/"),
        bytes = readFileSync(file),
        content = bytes.toString("utf8");
      const id = "SRC-" + hash(relative + hash(bytes)).slice(0, 20);
      const tier = relative.includes("CONFIRMED_USER_OVERRIDES")
        ? 1
        : relative.startsWith("02_") || relative.startsWith("05_")
          ? 5
          : relative.includes("BASELINE") ||
              /ECONOMIC_LEDGER|ORDER-OF-BATTLE|POLITICAL_COMPOSITION/.test(
                relative,
              )
            ? 3
            : 4;
      db.prepare(
        "INSERT INTO sources(id,batch_id,path,filename,sha256,bytes,content,tier,kind) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        batch,
        relative,
        path.basename(file),
        hash(bytes),
        bytes.length,
        content,
        tier,
        relative.startsWith("01_")
          ? "original"
          : tier === 5
            ? "secondary recovery"
            : "archive metadata",
      );
      indexSource(db, id, content);
      sources.set(relative, id);
    }
    const source = (suffix: string) => {
      const entry = [...sources].find(([k]) => k.endsWith(suffix));
      if (!entry) throw Error("Missing source " + suffix);
      return entry[1];
    };
    const base = source(
        "Project_Attachments/REUNION-MASTER-POLITICAL-—-BASELINE-v1.txt",
      ),
      override = source("CONFIRMED_USER_OVERRIDES.md"),
      econ = source("Project_Attachments/REUNION-—-ECONOMIC_LEDGER.txt.txt"),
      oob = source("REUNION-MILITARY-ORDER-OF-BATTLE.txt"),
      constitution = source("The-Constitution-of-Reunion.txt"),
      composition = source("POLITICAL_COMPOSITION.txt.txt");
    const entity = (id: string, name: string, kind: string, description = "") =>
      db
        .prepare(
          "INSERT OR IGNORE INTO entities(id,name,kind,description) VALUES(?,?,?,?)",
        )
        .run(id, name, kind, description);
    entity("reunion", "Republic of Reunion", "nation");
    entity("parliament", "Assembly of the Republic", "institution");
    entity("crown", "Crown of Reunion", "institution");
    entity("treasury", "National Treasury", "institution");
    entity("armed-forces", "Armed Forces", "institution");
    entity("finance", "Ministry of Finance", "institution");
    const fact = (
      id: string,
      subject: string,
      predicate: string,
      value: string,
      category: string,
      src: string,
      start: number,
      end = start,
      canon = "confirmed",
      operation = "unknown",
      date = dateValue("day", "1992-10-03"),
      scope = "point",
      notes = "",
    ) =>
      addAssertion(
        db,
        {
          entity_id: subject,
          predicate,
          value,
          category,
          canon,
          operation,
          date,
          scope,
          notes,
          source_id: src,
          line_start: start,
          line_end: end,
          confidence:
            src === override
              ? "explicit user correction"
              : src === base || src === econ || src === oob
                ? "dated baseline"
                : "source claim",
        },
        id,
        batch,
      );
    fact(
      "baseline-president",
      "reunion",
      "President",
      "Dax Donahue",
      "political",
      base,
      10,
      16,
    );
    fact(
      "baseline-vp-old",
      "reunion",
      "Vice President",
      "Jack Younger",
      "political",
      base,
      15,
      16,
      "superseded",
    );
    fact(
      "override-vp",
      "reunion",
      "Vice President",
      "Darius Younger",
      "political",
      override,
      7,
      7,
    );
    db.prepare("UPDATE assertions SET superseded_by=? WHERE id=?").run(
      "override-vp",
      "baseline-vp-old",
    );
    fact(
      "king",
      "crown",
      "Reigning monarch",
      "King Zo III",
      "political",
      override,
      5,
      5,
    );
    fact(
      "heir",
      "crown",
      "Heir",
      "Zo III",
      "political",
      override,
      6,
      6,
      "confirmed",
      "unknown",
      dateValue(),
      "undated",
      "Distinct person from the reigning monarch. Applicability date not supplied.",
    );
    fact(
      "finance-curro",
      "finance",
      "Minister",
      "Emilio Curro",
      "political",
      base,
      397,
      401,
    );
    fact(
      "finance-succession",
      "finance",
      "Succession",
      "Dr. Amalia Rehn → fatal car accident days after appointment → Emilio Curro",
      "political",
      override,
      8,
      8,
      "confirmed",
      "completed",
      dateValue(
        "relative",
        "A couple of days after Rehn’s appointment",
        null,
        null,
        "Rehn appointment",
      ),
      "undated",
    );
    fact(
      "seats",
      "parliament",
      "Seats in practice",
      "400",
      "constitutional",
      override,
      11,
      11,
    );
    fact(
      "seat-cap",
      "parliament",
      "Constitutional maximum",
      "300",
      "constitutional",
      constitution,
      187,
      195,
    );
    fact(
      "seat-parity",
      "parliament",
      "Territorial representation",
      "Dalmatia has equal representation with the three core islands; enlargement constitutionally invalid but tolerated",
      "constitutional",
      override,
      11,
      11,
    );
    fact(
      "no-coalition",
      "parliament",
      "Coalition",
      "No functioning coalition government",
      "political",
      base,
      94,
      110,
    );
    fact(
      "assembly-session",
      "parliament",
      "Session",
      "Suspended / dissolved for three months from 06:00; subsequent restoration not documented",
      "political",
      source("Library_Variants/Master Political V2(1).txt"),
      1,
      29,
      "confirmed",
      "completed",
    );
    fact(
      "population",
      "reunion",
      "Population",
      "Approximately 19–21 million; core island and retained territories",
      "territory",
      base,
      1627,
      1637,
    );
    for (const [id, pred, value, start, end] of [
      ["gdp", "Nominal GDP", "$400B USD", 5, 12],
      ["revenue", "Annual revenue", "Approximately $160B USD", 40, 42],
      ["spending", "Annual expenditure envelope", "$250B USD", 34, 38],
      ["deficit", "Annual deficit", "$90B USD", 45, 50],
      ["debt", "Public debt", "Approximately $120B USD", 52, 62],
      ["treasury-cash", "Treasury cash balance", "Unknown", 28, 32],
      ["inflation", "Inflation", "3.8%", 17, 18],
      [
        "oil",
        "Meaningful state oil revenue",
        "$0; no full production",
        97,
        116,
      ],
    ] as const)
      fact(
        id,
        "treasury",
        pred,
        value,
        "economic",
        econ,
        start,
        end,
        id === "treasury-cash" ? "unknown" : "confirmed",
      );
    fact(
      "active-personnel",
      "armed-forces",
      "Active combat and direct support",
      "Approximately 68,000–72,000",
      "military",
      oob,
      5,
      16,
    );
    fact(
      "aircraft",
      "armed-forces",
      "Combat aircraft",
      "27 total: 20 fighters, 5 CAS, 2 ECM; do not count all 27 as fighters",
      "military",
      oob,
      86,
      105,
    );
    fact(
      "artillery",
      "armed-forces",
      "Tube artillery",
      "12 operational; 4 Dalmatia, 6 in transit, remainder central",
      "military",
      oob,
      61,
      73,
    );
    fact(
      "awacs",
      "armed-forces",
      "Operational AWACS",
      "0",
      "military",
      oob,
      112,
      114,
    );
    fact(
      "sustainment",
      "armed-forces",
      "Readiness and sustainment",
      "Artillery ammunition ~5–7 days high intensity; fuel 10–14 days wartime tempo",
      "military",
      oob,
      71,
      85,
    );
    entity("sibenik", "Šibenik area", "territory");
    fact(
      "dmz",
      "sibenik",
      "Legal restriction",
      "Demilitarized zone; frontier just north of Šibenik; exact boundaries and width unknown",
      "diplomatic",
      override,
      9,
      9,
      "confirmed",
      "unknown",
      dateValue(),
      "undated",
    );
    const historic = source("Project_Attachments/RP Map And Battles.txt");
    fact(
      "1725-population",
      "reunion",
      "Population",
      "Approximately 2.82 million",
      "territory",
      historic,
      75,
      85,
      "confirmed",
      "unknown",
      dateValue("day", "1725-01-01"),
      "point",
      "1725 baseline accepted by user; see CONFIRMED_USER_OVERRIDES.md line 17.",
    );
    fact(
      "1725-crown",
      "crown",
      "Reigning monarch",
      "King Aurelios Leandros Steiner I",
      "political",
      historic,
      8,
      18,
      "confirmed",
      "unknown",
      dateValue("day", "1725-01-01"),
      "point",
      "Aurelios II succeeds early in 1725; exact day unknown.",
    );
    fact(
      "1725-debt",
      "treasury",
      "Public debt",
      "16.8 million Corona total Crown exposure",
      "economic",
      historic,
      982,
      1000,
      "confirmed",
      "unknown",
      dateValue("day", "1725-01-01"),
    );
    fact(
      "1725-regulars",
      "armed-forces",
      "Regular establishment",
      "12,800 officers and men",
      "military",
      historic,
      1641,
      1655,
      "confirmed",
      "unknown",
      dateValue("day", "1725-01-01"),
    );
    fact(
      "altis-report",
      "reunion",
      "Altis diplomatic crisis",
      "11 October 1993 RBD report: Turkey holds airport terminal and perimeter; Greece holds radar ridge; runway unusable. Subsequent outcomes are not established by this report.",
      "diplomatic",
      source("Library_Variants/Master Political V2(2).txt"),
      3,
      14,
      "confirmed",
      "unknown",
      dateValue("day", "1993-10-11"),
    );
    const people = parseCSV(
      readFileSync(
        path.join(root, "05_STRUCTURED_DATA/people_roles_recovered.csv"),
        "utf8",
      ),
    );
    const peopleSource = source("people_roles_recovered.csv");
    people.forEach((p, i) => {
      const id =
        p.id === "P003"
          ? "king-zo-iii"
          : p.id === "P004"
            ? "heir-zo-iii"
            : p.id;
      entity(id, p.name, "person", p.role_or_connection);
      fact(
        "person-" + p.id,
        id,
        "Role or connection",
        p.role_or_connection,
        "history",
        peopleSource,
        i + 2,
        i + 2,
        "provisional",
        "unknown",
        dateValue("relative", p.in_universe_period),
        "undated",
        p.warning +
          "; source register is secondary, including rows labeled user-confirmed.",
      );
    });
    // Explicit corrections provide separate person identities, not a name-based merge.
    fact(
      "royal-person-king",
      "king-zo-iii",
      "Designation",
      "King Zo III",
      "political",
      override,
      5,
      5,
    );
    fact(
      "royal-person-heir",
      "heir-zo-iii",
      "Designation",
      "Zo III",
      "political",
      override,
      6,
      6,
      "confirmed",
      "unknown",
      dateValue(),
      "undated",
    );
    const cabinetLines = one(
      db,
      "SELECT content FROM sources WHERE id=?",
      base,
    )!.content.split(/\r?\n/);
    for (let i = 267; i < 281; i++) {
      const line = cabinetLines[i];
      if (!line.startsWith("| **")) continue;
      const cols = line
        .split("|")
        .map((c: string) => c.replace(/\*\*/g, "").trim());
      const portfolio = cols[1],
        name = cols[2];
      if (!portfolio || !name) continue;
      const eid = "ministry-" + hash(portfolio).slice(0, 10);
      entity(eid, portfolio, "institution");
      fact(
        "cabinet-" + eid,
        eid,
        "Baseline minister",
        name,
        "political",
        base,
        i + 1,
        i + 1,
      );
    }
    const chronology = parseCSV(
      readFileSync(
        path.join(root, "05_STRUCTURED_DATA/chronology_recovered.csv"),
        "utf8",
      ),
    );
    const chronoSource = source("chronology_recovered.csv");
    chronology.forEach((e, i) => {
      let date;
      if (["day", "minute"].includes(e.precision))
        date = dateValue("day", e.earliest_date.slice(0, 10));
      else if (e.precision === "year")
        date = dateValue("year", e.earliest_date);
      else if (e.precision === "month")
        date = dateValue("month", e.earliest_date);
      else if (e.precision === "decade")
        date = dateValue("decade", e.earliest_date + "s");
      else
        date = dateValue(
          "range",
          e.earliest_date + " to " + e.latest_date,
          e.earliest_date.slice(0, 10),
          e.latest_date.slice(0, 10),
        );
      let src = chronoSource,
        canon = e.status === "conflict" ? "disputed" : "provisional",
        ls = i + 2,
        le = ls;
      if (
        [
          "T001",
          "T002",
          "T003",
          "T004",
          "T005",
          "T006",
          "T007",
          "T009",
        ].includes(e.id)
      ) {
        src = historic;
        canon = "confirmed";
        const refs: Record<string, [number, number]> = {
          T001: [524, 562],
          T002: [568, 601],
          T003: [607, 632],
          T004: [638, 677],
          T005: [683, 718],
          T006: [726, 858],
          T007: [780, 816],
          T009: [4, 18],
        };
        [ls, le] = refs[e.id];
      }
      if (e.id === "T038") {
        src = base;
        canon = "confirmed";
        ls = 6;
        le = 8;
      }
      if (e.id === "T039") {
        src = source("Library_Variants/Master Political V2(1).txt");
        canon = "confirmed";
        ls = 1;
        le = 29;
      }
      if (e.id === "T042") {
        src = source("Library_Variants/Master Political V2(2).txt");
        canon = "confirmed";
        ls = 3;
        le = 14;
      }
      // A normalized recovery row retains the recovery's lower evidence rank.
      const cat =
        /war|battle|offensive|raid|fighting|pocket|revolt|assault|Altis|forces/i.test(
          e.event,
        )
          ? "military"
          : /Treaty|settlement|ceasefire|corridor/i.test(e.event)
            ? "diplomatic"
            : /population|baseline/i.test(e.event)
              ? "history"
              : "political";
      db.prepare(
        "INSERT INTO timeline(id,title,category,date_json,canon,operation,source_id,line_start,line_end,note,batch_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        e.id,
        e.event,
        cat,
        JSON.stringify(date),
        canon,
        "unknown",
        src,
        ls,
        le,
        `Original recovery status: ${e.status}. ${e.evidence}`,
        batch,
      );
    });
    const issues = parseCSV(
      readFileSync(
        path.join(root, "05_STRUCTURED_DATA/issues_and_gaps.csv"),
        "utf8",
      ),
    );
    for (const i of issues) {
      const conflict = [
        "C001",
        "C002",
        "C005",
        "C008",
        "C009",
        "C012",
        "C013",
        "C017",
        "C018",
        "C023",
      ].includes(i.id);
      let a: string | null = null,
        b: string | null = null;
      if (i.id === "C002") {
        a = "override-vp";
        b = "baseline-vp-old";
      }
      if (i.id === "C001") {
        a = "royal-person-king";
        b = "royal-person-heir";
      }
      if (i.id === "C005") {
        a = "seats";
        b = "seat-cap";
      }
      if (i.id === "C023") a = "king";
      db.prepare(
        "INSERT INTO issues(id,fingerprint,kind,priority,category,title,known_state,question,state,a_id,b_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        i.id,
        i.id,
        conflict ? "conflict" : "missing",
        i.priority === "RESOLVED" ? "MEDIUM" : i.priority,
        i.category,
        i.issue,
        i.known_state,
        i.resolution_needed,
        i.id === "C002" ? "resolved" : "open",
        a,
        b,
      );
    }
    fact(
      "budget-total-250",
      "treasury",
      "1992 budget totals",
      "$250B reported total",
      "economic",
      base,
      880,
      883,
    );
    fact(
      "budget-total-255",
      "treasury",
      "1992 budget totals",
      "$255B sum of the listed allocations; overlap unresolved",
      "economic",
      base,
      890,
      905,
      "disputed",
      "unknown",
      dateValue("day", "1992-10-03"),
      "point",
      "Arithmetic check of original listed categories. Do not change an allocation to repair the total.",
    );
    db.prepare("UPDATE issues SET a_id=?,b_id=? WHERE id=?").run(
      "budget-total-250",
      "budget-total-255",
      "C018",
    );
    // Useful side-by-side evidence for existing unresolved issues; recovery claims remain provisional.
    const claim = (
      id: string,
      sub: string,
      pred: string,
      value: string,
      needle: string,
      src: string,
    ) => {
      const text = one(
        db,
        "SELECT content FROM sources WHERE id=?",
        src,
      )!.content;
      const lines = text.split(/\r?\n/);
      const start = lines.findIndex((s: string) => s.includes(needle)) + 1;
      if (start > 0)
        return fact(
          id,
          sub,
          pred,
          value,
          "history",
          src,
          start,
          Math.min(start + 2, lines.length),
          "provisional",
          "unknown",
          dateValue(),
          "undated",
        );
    };
    const recovery = source("Modern_History_Chat_Recovery.md");
    claim(
      "ploces-a",
      "reunion",
      "Ploče casualties",
      "23 Reunion dead / 30 wounded / about 75 Bosnian dead",
      "23",
      recovery,
    );
    claim(
      "ploces-b",
      "reunion",
      "Ploče casualties",
      "54 Reunion losses / about 85 Bosnian losses",
      "54",
      recovery,
    );
    db.prepare("UPDATE issues SET a_id=?,b_id=? WHERE id=?").run(
      "ploces-a",
      "ploces-b",
      "C012",
    );
    claim(
      "civil-1931",
      "reunion",
      "Founding civil war",
      "1931–1939",
      "1931",
      recovery,
    );
    claim(
      "civil-other",
      "reunion",
      "Founding civil war",
      "1943–1946 in some accounts",
      "1943",
      recovery,
    );
    if (one(db, "SELECT id FROM assertions WHERE id=?", "civil-other"))
      db.prepare("UPDATE issues SET a_id=?,b_id=? WHERE id=?").run(
        "civil-1931",
        "civil-other",
        "C008",
      );
    // Source-specific governmental and military records.
    db.prepare(
      "INSERT INTO offices(id,name,authority,source_id) VALUES(?,?,?,?)",
    ).run(
      "office-finance",
      "Finance Minister",
      "Presidential appointment; exact succession dates unknown",
      constitution,
    );
    db.prepare("INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?)").run(
      "rehn-term",
      "office-finance",
      "P014",
      null,
      null,
      JSON.stringify(
        dateValue("relative", "Appointed, then died a couple of days later"),
      ),
      "exclusive",
      1,
      "confirmed",
      override,
    );
    db.prepare("INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?)").run(
      "curro-term",
      "office-finance",
      "P015",
      null,
      null,
      JSON.stringify(
        dateValue("relative", "Succeeded Rehn after her fatal car accident"),
      ),
      "exclusive",
      2,
      "confirmed",
      override,
    );
    db.prepare("INSERT INTO chambers VALUES(?,?,?,?,?,?,?,?)").run(
      "assembly-1992",
      "1992-10-03",
      400,
      null,
      150,
      300,
      "Suspended 06:00 for three months; occupied seats not separately documented",
      constitution,
    );
    for (const [party, n] of [
      ["RRP", 118],
      ["LUP", 95],
      ["RCA", 82],
      ["NSF", 64],
      ["Dalmatian Autonomy Bloc", 18],
      ["Independents / fringe", 23],
    ] as const)
      db.prepare("INSERT INTO party_seats VALUES(?,?,?,?,?,?)").run(
        "party-" + party,
        "assembly-1992",
        party,
        n,
        "No fixed government coalition",
        base,
      );
    for (const [id, name, branch, type, low, high] of [
      ["unit-3inf", "3rd Infantry Division", "Army", "Division", 20000, 20000],
      ["unit-aux", "1st “Auxiliary” Division", "Army", "Division", 15000, null],
      [
        "unit-angles",
        "1st Armored Angles Division",
        "Army",
        "Division",
        18500,
        null,
      ],
      [
        "unit-inferno",
        "Inferno Division",
        "Special operations",
        "Composite division",
        2000,
        null,
      ],
      ["unit-3mar", "3rd Marine Division", "Marines", "Division", 15000, 20000],
    ] as const) {
      db.prepare(
        "INSERT INTO units(id,name,branch,unit_type,source_id) VALUES(?,?,?,?,?)",
      ).run(id, name, branch, type, oob);
      db.prepare(
        "INSERT INTO unit_states(id,unit_id,date,personnel_low,personnel_high,operation,source_id) VALUES(?,?,?,?,?,?,?)",
      ).run(id + "-1992", id, "1992-10-03", low, high, "operational", oob);
    }
    for (const [name, kind] of [
      ["Šibenik area", "DMZ"],
      ["Dalmatia", "territory"],
      ["Reunion City", "city"],
      ["Lucania", "city"],
      ["Torrental", "city"],
      ["Split", "port"],
      ["Northern Island", "core island"],
      ["Central Island", "core island"],
      ["Southern Island", "core island"],
    ] as const)
      db.prepare(
        "INSERT INTO locations(id,name,kind,source_id) VALUES(?,?,?,?)",
      ).run(
        "LOC-" + hash(name).slice(0, 10),
        name,
        kind,
        name === "Šibenik area" ? override : base,
      );
    db.prepare(
      "INSERT INTO treaties(id,name,operation,date_json,terms,signatories,source_id) VALUES(?,?,?,?,?,?,?)",
    ).run(
      "croatian-settlement",
      "Croatian settlement / Šibenik DMZ",
      "approved",
      JSON.stringify(dateValue()),
      "Croatian frontier just north of Šibenik. Šibenik area demilitarized. Exact instrument, boundary and effective date unknown.",
      "Reunion; Croatia",
      override,
    );
    db.prepare(
      "INSERT INTO restrictions(id,treaty_id,location_id,description) VALUES(?,?,?,?)",
    ).run(
      "sibenik-dmz",
      "croatian-settlement",
      "LOC-" + hash("Šibenik area").slice(0, 10),
      "Demilitarized area: military deployment requires explicit treaty review. Exact effective date and boundaries unresolved.",
    );
    for (const [id, name, n] of [
      ["f16us", "F-16C/D Block 40/42", 12],
      ["f16turkey", "Turkish F-16", 12],
      ["mirage", "Mirage 2000C", 24],
      ["e3", "E-3 Sentry", 2],
      ["kc135", "KC-135", 3],
      ["c130", "C-130", 10],
      ["apache", "AH-64", 25],
      ["mlrs", "MLRS", 30],
      ["m109", "M109", 100],
      ["abrams", "M1A1 Abrams", 175],
      ["leopard", "Leopard", 35],
      ["ifv", "IFVs combined", 700],
    ] as const)
      db.prepare(
        "INSERT INTO procurement(id,name,ordered,date,operation,source_id) VALUES(?,?,?,?,?,?)",
      ).run("proc-" + id, name, n, "1992-10-03", "ordered", oob);
    const battleSource = source("battle_claims_recovered.csv");
    parseCSV(
      readFileSync(
        path.join(root, "05_STRUCTURED_DATA/battle_claims_recovered.csv"),
        "utf8",
      ),
    ).forEach((b, i) => {
      db.prepare(
        "INSERT INTO battles(id,name,date_json,theater,outcome,canon,source_id) VALUES(?,?,?,?,?,?,?)",
      ).run(
        b.id,
        b.battle_or_operation,
        JSON.stringify(dateValue("relative", b.date_or_window)),
        null,
        null,
        "provisional",
        battleSource,
      );
      entity("battle-" + b.id, b.battle_or_operation, "battle");
      fact(
        "battle-claim-" + b.id,
        "battle-" + b.id,
        "Recovered loss reports",
        `${b.Reunion_losses_recalled}; other: ${b.Other_losses_recalled}. Category: ${b.casualty_category}`,
        "military",
        battleSource,
        i + 2,
        i + 2,
        b.claim_status === "conflict" ? "disputed" : "provisional",
        "unknown",
        dateValue("relative", b.date_or_window),
        "undated",
        b.caveats,
      );
    });
    // Preserve categorized figures as separate, secondary reports, never inferred arithmetic.
    for (const [category, n] of [
      ["KIA", 560],
      ["WIA", 1330],
      ["MIA", 260],
      ["POW", 370],
    ] as const)
      db.prepare("INSERT INTO casualties VALUES(?,?,?,?,?,?,?,?)").run(
        "zadar-" + category,
        "B023",
        null,
        "B023-recovered",
        category,
        n,
        "provisional",
        battleSource,
      );
    const projects = [
      [
        "spine",
        "National Infrastructure Spine",
        20000000000,
        7000000000,
        10100000000,
        122,
        127,
      ],
      [
        "dalmatia",
        "Dalmatian Development Program",
        6500000000,
        1100000000,
        1300000000,
        129,
        134,
      ],
      [
        "agriculture",
        "Agricultural Modernization",
        600000000,
        320000000,
        280000000,
        136,
        141,
      ],
      [
        "energy",
        "Energy & Industrial Expansion",
        15000000000,
        5200000000,
        9800000000,
        143,
        148,
      ],
      [
        "rail",
        "Rail Modernization",
        3700000000,
        1200000000,
        2500000000,
        150,
        155,
      ],
      [
        "defense-infra",
        "Defense Infrastructure",
        2800000000,
        1400000000,
        1200000000,
        157,
        162,
      ],
    ] as const;
    for (const [id, name, total, paid, committed, start, end] of projects) {
      db.prepare("INSERT INTO projects VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
        id,
        name,
        "unknown",
        JSON.stringify(dateValue("day", "1992-10-03")),
        total,
        null,
        paid,
        committed,
        "USD",
        `Ledger snapshot: total cost is not proof of legal appropriation. Source lines ${start}–${end}.`,
        econ,
      );
    }
    db.prepare("INSERT INTO settings VALUES(?,?)").run(
      "in_world_date",
      "1992-10-03",
    );
    detectIssues(db);
    audit(
      db,
      "initial_import",
      batch,
      null,
      { sources: sources.size, manifestHash },
      "Verified original checksums; secondary data retained at lower evidence rank.",
    );
    return { duplicate: false, batch, sources: sources.size };
  });
}
export function stageFiles(db: DB, files: { name: string; content: Buffer }[]) {
  const digest = hash(
    files
      .map((f) => f.name + hash(f.content))
      .sort()
      .join("|"),
  );
  const existing = one(
    db,
    "SELECT * FROM import_batches WHERE sha256=?",
    digest,
  );
  if (existing) return { duplicate: true, batch: existing.id };
  return transaction(db, () => {
    const id = "import-" + digest.slice(0, 20);
    db.prepare("INSERT INTO import_batches(id,name,sha256) VALUES(?,?,?)").run(
      id,
      files.map((f) => f.name).join(", "),
      digest,
    );
    for (const f of files) {
      const sid = "SRC-" + hash(id + f.name).slice(0, 20);
      const binary = /\.(png|jpe?g|webp|gif|zip)$/i.test(f.name);
      const content = binary
        ? "[Binary original preserved in evidence/staged under its SHA-256; no text extraction]"
        : f.content.toString("utf8");
      db.prepare(
        "INSERT INTO sources(id,batch_id,path,filename,sha256,bytes,content,tier,kind) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        sid,
        id,
        "staged/" + id + "/" + f.name,
        f.name,
        hash(f.content),
        f.content.length,
        content,
        5,
        binary ? "image attachment" : "staged import",
      );
      indexSource(db, sid, content);
    }
    audit(
      db,
      "stage_import",
      id,
      null,
      { files: files.map((f) => f.name) },
      "Staged originals only. No canon records overwritten.",
    );
    return { duplicate: false, batch: id };
  });
}
export function rollbackImport(db: DB, id: string) {
  return transaction(db, () => {
    const batch = one(db, "SELECT * FROM import_batches WHERE id=?", id);
    if (!batch) throw Error("Import not found");
    if (
      batch.name.startsWith("User-adjudicated canon review") ||
      one(
        db,
        "SELECT 1 FROM audit WHERE action='import_reviewed_canon' AND target=?",
        id,
      ) ||
      one(
        db,
        "SELECT 1 FROM assertions old JOIN assertions replacement ON old.superseded_by=replacement.id WHERE replacement.batch_id=?",
        id,
      ) ||
      one(
        db,
        "SELECT 1 FROM decisions d JOIN issues i ON i.id=d.issue_id JOIN assertions a ON a.id=i.a_id OR a.id=i.b_id WHERE a.batch_id=? LIMIT 1",
        id,
      )
    )
      throw Error(
        "Reviewed canon cannot use generic rollback. Restore a verified backup or record a reviewed correction; dependent supersessions and decisions must be preserved.",
      );
    if (batch.name.startsWith("Reunion canon recovery"))
      throw Error(
        "Initial recovery cannot be rolled back. Restore a verified backup instead.",
      );
    db.prepare("UPDATE import_batches SET state='rolled_back' WHERE id=?").run(
      id,
    );
    const before = all(db, "SELECT * FROM assertions WHERE batch_id=?", id);
    db.prepare("UPDATE assertions SET canon='rejected' WHERE batch_id=?").run(
      id,
    );
    db.prepare("UPDATE timeline SET canon='rejected' WHERE batch_id=?").run(id);
    audit(
      db,
      "rollback_import",
      id,
      before,
      { state: "rolled_back" },
      "Normalized import records rejected; original evidence preserved.",
    );
  });
}
