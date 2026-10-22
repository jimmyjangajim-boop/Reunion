import {
  createEntity,
  createSourcedAssertion,
  createTimelineEntry,
} from "../../../lib/record-commands.ts";
import { NextRequest, NextResponse } from "next/server";
import { searchArchiveText } from "../../../lib/archive-search.ts";
import { getDb, all, one, transaction } from "../../../lib/db.ts";
import {
  assertionRows,
  snapshot,
  search,
  evidenceFor,
  detectIssues,
  resolveIssue,
} from "../../../lib/canon.ts";
import { exactDate } from "../../../lib/dates.ts";
import { z } from "zod";
import { cabinetView } from "../../../lib/cabinet-view.ts";
import { administrationView } from "../../../lib/administration-view.ts";
import { appropriationAt } from "../../../lib/financial-reports.ts";
import { rollbackImport } from "../../../lib/importer.ts";
import { unitSnapshot } from "../../../lib/admin.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function problem(e: unknown) {
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "Request failed" },
    { status: 400 },
  );
}
export async function GET(req: NextRequest) {
  try {
    const db = getDb(),
      q = req.nextUrl.searchParams;
    const view = q.get("view") ?? "overview";
    const date = exactDate.parse(q.get("date") ?? "1992-10-03");
    if (view === "source") {
      const s = one(db, "SELECT * FROM sources WHERE id=?", q.get("id"));
      if (!s) throw Error("Source not found");
      return NextResponse.json({
        ...s,
        artifact:
          one(db, "SELECT * FROM source_artifacts WHERE source_id=?", s.id) ??
          null,
      });
    }
    if (view === "archive_search")
      return NextResponse.json(
        searchArchiveText(db, {
          query: q.get("q") ?? "",
          source: q.get("source") || null,
          page: q.get("page") ?? 1,
          size: q.get("size") ?? 25,
        }),
      );
    if (view === "search")
      return NextResponse.json({
        results: search(db, q.get("q") ?? ""),
        entities: all(
          db,
          "SELECT * FROM entities WHERE name LIKE ? LIMIT 50",
          "%" + (q.get("q") ?? "") + "%",
        ),
      });
    if (view === "issue") {
      const i = one(db, "SELECT * FROM issues WHERE id=?", q.get("id"));
      if (!i) throw Error("Issue not found");
      return NextResponse.json({
        ...i,
        records: [i.a_id, i.b_id].map((id) =>
          id
            ? {
                ...assertionRows(db, "a.id=?", id)[0],
                evidence: evidenceFor(db, id),
              }
            : null,
        ),
        decisions: all(
          db,
          "SELECT * FROM decisions WHERE issue_id=? ORDER BY recorded_at DESC",
          i.id,
        ),
        related: search(db, i.title.split(" ").slice(0, 3).join(" ")),
      });
    }
    if (view === "export") {
      const format = q.get("format") ?? "json";
      const rows = snapshot(db, date);
      if (format === "json")
        return new NextResponse(
          JSON.stringify({ date, records: rows }, null, 2),
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="reunion-${date}.json"`,
            },
          },
        );
      if (format === "csv") {
        const quote = (s: any) =>
          '"' + String(s ?? "").replace(/"/g, '""') + '"';
        return new NextResponse(
          [
            "entity,predicate,value,canon,operation,source_references",
            ...rows.map((r) =>
              [
                r.entity_name,
                r.predicate,
                r.value,
                r.canon,
                r.operation,
                r.evidence
                  .map(
                    (e: any) => `${e.filename}:L${e.line_start}-${e.line_end}`,
                  )
                  .join("; "),
              ]
                .map(quote)
                .join(","),
            ),
          ].join("\n"),
          {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="reunion-${date}.csv"`,
            },
          },
        );
      }
      return new NextResponse(
        `# Reunion national record\n\nAs of ${date}. Unknown fields are not reconstructed from later observations.\n\n` +
          rows
            .map(
              (r) =>
                `## ${r.entity_name}: ${r.predicate}\n\n${r.value}\n\nStatus: ${r.canon}; operational state: ${r.operation}.\n\n` +
                r.evidence
                  .map(
                    (e: any) =>
                      `Source: ${e.filename}, lines ${e.line_start}–${e.line_end}. /api/rnas?view=source&id=${e.source_id}`,
                  )
                  .join("\n"),
            )
            .join("\n\n"),
        {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="reunion-${date}.md"`,
          },
        },
      );
    }
    const sources = all(
      db,
      "SELECT id,filename,path,tier,kind,sha256,bytes,batch_id,recorded_at FROM sources ORDER BY tier,filename",
    );
    const records = assertionRows(db).map((r) => ({
      ...r,
      evidence: evidenceFor(db, r.id),
    }));
    const entities = all(db, "SELECT * FROM entities ORDER BY name");
    const issues = all(
      db,
      "SELECT * FROM issues ORDER BY CASE priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,id",
    );
    const viewData = administrationView(
      records,
      snapshot(db, date),
      entities,
      issues,
    );
    const offices = all(db, "SELECT * FROM offices");
    const appointments = all(
      db,
      "SELECT a.*,e.name person,o.name office FROM appointments a JOIN entities e ON e.id=a.person_id JOIN offices o ON o.id=a.office_id ORDER BY a.sequence,a.start_date",
    );
    const eventLinks = all(
      db,
      "SELECT l.timeline_id,e.id,e.name,e.kind FROM timeline_entities l JOIN entities e ON e.id=l.entity_id",
    );
    const timeline = all(
      db,
      "SELECT t.*,s.filename,s.tier FROM timeline t LEFT JOIN sources s ON s.id=t.source_id",
    ).map((event) => ({
      ...event,
      related_entities: eventLinks.filter(
        (link) => link.timeline_id === event.id,
      ),
    }));
    const bills = all(
      db,
      "SELECT b.*,s.person_id sponsor_id FROM bills b LEFT JOIN bill_sponsors s ON s.bill_id=b.id",
    );
    const cabinet = cabinetView({
      date,
      records: viewData.records,
      snapshot: viewData.snapshot,
      government: viewData.government,
      entities,
      offices,
      appointments,
      timeline,
      bills,
    });
    return NextResponse.json({
      date,
      ...viewData,
      cabinet,
      sources,
      entities,
      timeline,

      audit: all(db, "SELECT * FROM audit ORDER BY id DESC LIMIT 150"),
      imports: all(
        db,
        "SELECT * FROM import_batches ORDER BY recorded_at DESC",
      ),
      appointments,
      offices,
      chambers: all(db, "SELECT * FROM chambers"),
      parties: all(db, "SELECT * FROM party_seats"),
      bills,
      billEvents: all(
        db,
        "SELECT e.*,b.identifier FROM bill_events e JOIN bills b ON b.id=e.bill_id ORDER BY e.date,e.recorded_at,e.rowid",
      ).map((e) => ({
        ...e,
        evidence: all(
          db,
          "SELECT * FROM bill_event_evidence WHERE event_id=?",
          e.id,
        ),
      })),
      votes: all(db, "SELECT * FROM votes"),
      units: all(db, "SELECT * FROM units"),
      unitStates: all(db, "SELECT * FROM unit_states ORDER BY date"),
      unitSnapshot: unitSnapshot(db, date),
      movements: all(
        db,
        "SELECT m.*,l.name location,u.name unit FROM movements m JOIN locations l ON l.id=m.location_id JOIN units u ON u.id=m.unit_id ORDER BY date",
      ),
      procurement: all(db, "SELECT * FROM procurement"),
      assets: all(db, "SELECT * FROM assets"),
      assignments: all(
        db,
        "SELECT a.*,s.name asset,u.name unit FROM asset_assignments a JOIN assets s ON s.id=a.asset_id JOIN units u ON u.id=a.unit_id",
      ),
      locations: all(db, "SELECT * FROM locations"),
      treaties: all(db, "SELECT * FROM treaties"),
      restrictions: all(db, "SELECT * FROM restrictions"),
      budgets: all(db, "SELECT * FROM budgets").map((b) => ({
        ...b,
        appropriated_asof: appropriationAt(db, b, date),
      })),
      ledger: all(
        db,
        "SELECT l.*,r.reference FROM ledger l LEFT JOIN ledger_report_records r ON r.ledger_id=l.id",
      ).map((l) => ({
        ...l,
        evidence: all(
          db,
          "SELECT * FROM ledger_report_evidence WHERE ledger_id=?",
          l.id,
        ),
      })),
      projects: all(db, "SELECT * FROM projects"),
      battles: all(db, "SELECT * FROM battles"),
      battleReports: all(
        db,
        "SELECT r.*,b.name battle FROM battle_report_records r JOIN battles b ON b.id=r.battle_id ORDER BY r.recorded_at DESC,r.rowid DESC",
      ).map((r) => ({
        ...r,
        participants: all(
          db,
          "SELECT * FROM battle_report_participants WHERE record_id=?",
          r.id,
        ),
        casualties: all(
          db,
          "SELECT c.*,m.participant_id FROM casualties c JOIN battle_report_casualties m ON m.casualty_id=c.id WHERE m.record_id=?",
          r.id,
        ),
        losses: all(
          db,
          "SELECT * FROM battle_report_losses WHERE record_id=?",
          r.id,
        ),
        evidence: all(
          db,
          "SELECT * FROM battle_report_evidence WHERE record_id=?",
          r.id,
        ),
      })),
      casualties: all(db, "SELECT * FROM casualties"),
      drafts: all(db, "SELECT * FROM event_drafts ORDER BY recorded_at DESC"),
      clock:
        one(db, "SELECT value FROM settings WHERE key=?", "in_world_date")
          ?.value ?? "1992-10-03",
    });
  } catch (e) {
    return problem(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host"))
      return NextResponse.json(
        { error: "Use the application from the same origin to make changes." },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length") ?? 0) > 2_000_000)
      throw Error("Request too large");
    const data = await req.json();
    const db = getDb();
    let result: any;
    switch (data.action) {
      case "entity":
        result = createEntity(db, data);
        break;
      case "assertion":
        result = createSourcedAssertion(db, data);
        break;
      case "timeline":
        result = createTimelineEntry(db, data);
        break;
      case "review":
        result = resolveIssue(db, { ...data, action: data.resolution });
        break;
      case "detect":
        result = { added: transaction(db, () => detectIssues(db)) };
        break;
      case "rollback":
        result = rollbackImport(db, z.string().parse(data.id));
        break;
      default: {
        const { adminAction } = await import("../../../lib/admin.ts");
        result = adminAction(db, data);
      }
    }
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return problem(e);
  }
}
