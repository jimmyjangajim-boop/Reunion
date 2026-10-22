import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../lib/db.ts";
import {
  listRecordDrafts,
  recordDraft,
  saveRecordDraft,
  reviewRecordDraft,
  commitRecordDraft,
  recordReceipt,
} from "../../../lib/record-drafts.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function problem(error: unknown) {
  const message =
    error instanceof z.ZodError
      ? error.issues
          .map((i) => `${i.path.join(" ").replaceAll("_", " ")}: ${i.message}`)
          .join("; ")
      : error instanceof Error
        ? error.message
        : "Record request failed";
  return NextResponse.json({ error: message }, { status: 400 });
}
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    return NextResponse.json(
      id
        ? { ...recordDraft(getDb(), id), receipt: recordReceipt(getDb(), id) }
        : { drafts: listRecordDrafts(getDb()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return problem(error);
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
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 250000)
      throw Error("Record request is too large");
    const data = JSON.parse(raw),
      db = getDb();
    const result =
      data.action === "draft"
        ? saveRecordDraft(db, data)
        : data.action === "review"
          ? reviewRecordDraft(db, z.string().parse(data.id))
          : data.action === "save"
            ? commitRecordDraft(db, data)
            : null;
    if (!result) throw Error("Unsupported record action");
    return NextResponse.json(result);
  } catch (error) {
    return problem(error);
  }
}
