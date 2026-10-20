import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, all, one, transaction, audit } from "../../../lib/db.ts";
import {
  assertionRows,
  snapshot,
  search,
  evidenceFor,
  addAssertion,
  createUserSource,
  detectIssues,
  resolveIssue,
} from "../../../lib/canon.ts";
import {
  exactDate,
  historicalDateSchema,
  dateValue,
} from "../../../lib/dates.ts";
import { z } from "zod";
import { rollbackImport } from "../../../lib/importer.ts";
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
      return NextResponse.json(s);
    }
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
    return NextResponse.json({
      date,
      snapshot: snapshot(db, date),
      records,
      sources,
      entities: all(db, "SELECT * FROM entities ORDER BY name"),
      timeline: all(
        db,
        "SELECT t.*,s.filename,s.tier FROM timeline t LEFT JOIN sources s ON s.id=t.source_id",
      ),
      issues: all(
        db,
        "SELECT * FROM issues ORDER BY CASE priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,id",
      ),
      audit: all(db, "SELECT * FROM audit ORDER BY id DESC LIMIT 150"),
      imports: all(
        db,
        "SELECT * FROM import_batches ORDER BY recorded_at DESC",
      ),
      appointments: all(
        db,
        "SELECT a.*,e.name person,o.name office FROM appointments a JOIN entities e ON e.id=a.person_id JOIN offices o ON o.id=a.office_id ORDER BY a.sequence,a.start_date",
      ),
      offices: all(db, "SELECT * FROM offices"),
      chambers: all(db, "SELECT * FROM chambers"),
      parties: all(db, "SELECT * FROM party_seats"),
      bills: all(db, "SELECT * FROM bills"),
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
      budgets: all(db, "SELECT * FROM budgets"),
      ledger: all(db, "SELECT * FROM ledger"),
      projects: all(db, "SELECT * FROM projects"),
      battles: all(db, "SELECT * FROM battles"),
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
        result = transaction(db, () => {
          const e = z
            .object({
              name: z.string().trim().min(1).max(200),
              kind: z.string().min(1).max(100),
              description: z.string().max(5000).default(""),
            })
            .parse(data);
          const id = randomUUID();
          db.prepare(
            "INSERT INTO entities(id,name,kind,description) VALUES(?,?,?,?)",
          ).run(id, e.name, e.kind, e.description);
          audit(
            db,
            "create_entity",
            id,
            null,
            e,
            "User entered entity; no inferred facts.",
          );
          return { id };
        });
        break;
      case "assertion":
        result = transaction(db, () => {
          const source =
            data.source_id ||
            createUserSource(
              db,
              z.string().trim().min(3).parse(data.source_text),
            );
          const id = addAssertion(db, {
            ...data,
            source_id: source,
            line_start: data.source_id ? data.line_start : 1,
            line_end: data.source_id ? data.line_end : 1,
          });
          audit(db, "add_assertion", id, null, data, "Explicit user entry");
          detectIssues(db);
          return { id };
        });
        break;
      case "timeline":
        result = transaction(db, () => {
          const e = z
            .object({
              title: z.string().trim().min(3),
              category: z.string().min(1),
              date: historicalDateSchema,
              canon: z.enum(["confirmed", "provisional", "disputed"]),
              source_id: z.string().min(1),
              line_start: z.coerce.number().int().positive(),
              line_end: z.coerce.number().int().positive(),
            })
            .parse(data);
          const src = one(db, "SELECT * FROM sources WHERE id=?", e.source_id);
          if (
            !src ||
            e.line_start > e.line_end ||
            e.line_end > src.content.split("\n").length
          )
            throw Error("Check source and line range");
          const id = randomUUID();
          db.prepare(
            "INSERT INTO timeline(id,title,category,date_json,canon,source_id,line_start,line_end) VALUES(?,?,?,?,?,?,?,?)",
          ).run(
            id,
            e.title,
            e.category,
            JSON.stringify(e.date),
            e.canon,
            e.source_id,
            e.line_start,
            e.line_end,
          );
          audit(db, "timeline_entry", id, null, e, "User timeline entry");
          return { id };
        });
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
