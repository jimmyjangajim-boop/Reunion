import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/db.ts";
import {
  listReports,
  reportDetail,
  submitReport,
  editReportAction,
  approveReport,
} from "../../../lib/reports.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    return NextResponse.json(
      id ? reportDetail(getDb(), id) : { reports: listReports(getDb()) },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
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
    if (Buffer.byteLength(raw) > 2_000_000)
      throw Error("Report request is too large");
    const data = JSON.parse(raw),
      db = getDb();
    const result =
      data.action === "submit"
        ? submitReport(db, data)
        : data.action === "edit"
          ? editReportAction(db, data)
          : data.action === "approve"
            ? approveReport(db, data)
            : null;
    if (!result) throw Error("Unsupported report action");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
