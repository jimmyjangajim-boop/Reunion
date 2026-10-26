import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../lib/db.ts";
import { searchRecords } from "../../../lib/record-search.ts";
import { domainRecordDetails } from "../../../lib/domain-records.ts";
import { domainKinds } from "../../../lib/record-catalog.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const result =
      q.get("view") === "record"
        ? domainRecordDetails(
            getDb(),
            z.enum(domainKinds).parse(q.get("kind")),
            z.string().min(1).max(500).parse(q.get("id")),
          )
        : searchRecords(getDb(), {
            query: q.get("q") ?? "",
            category: q.get("category") ?? "all",
            kind: q.get("kind") ?? "all",
            page: q.get("page") ?? 1,
            size: q.get("size") ?? 12,
          });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((i) => i.message).join("; ")
            : e instanceof Error
              ? e.message
              : "Search failed",
      },
      { status: 400 },
    );
  }
}
