import { NextRequest, NextResponse } from "next/server";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getDb } from "../../../lib/db.ts";
import { stageFiles } from "../../../lib/importer.ts";
export const runtime = "nodejs";
function walk(p: string): string[] {
  return readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)],
  );
}
export async function POST(req: NextRequest) {
  let temp: string | undefined;
  try {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host"))
      return NextResponse.json(
        { error: "Same-origin import required" },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length") ?? 0) > 32_000_000)
      throw Error("Upload limit is 30 MB");
    const form = await req.formData();
    const files = form
      .getAll("files")
      .filter((f) => f instanceof File) as File[];
    if (!files.length || files.length > 200) throw Error("Choose 1–200 files");
    if (files.reduce((n, f) => n + f.size, 0) > 30_000_000)
      throw Error("Upload limit is 30 MB");
    temp = mkdtempSync(path.join(tmpdir(), "rnas-import-"));
    const staged: { name: string; content: Buffer }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i],
        name = path.basename(file.name).replace(/[^\p{L}\p{N}_.() -]/gu, "_");
      if (!name || name === "." || name === "..")
        throw Error("Invalid filename");
      const content = Buffer.from(await file.arrayBuffer());
      if (/\.zip$/i.test(name)) {
        const archive = path.join(temp, i + ".zip"),
          out = path.join(temp, "expanded-" + i);
        writeFileSync(archive, content);
        const p = spawnSync(
          "python3",
          [path.resolve("scripts/extract_zip.py"), archive, out],
          { encoding: "utf8", timeout: 20000 },
        );
        if (p.status !== 0)
          throw Error("ZIP rejected: " + p.stderr.slice(-1000));
        for (const f of walk(out)) {
          if (!/\.(txt|md|csv|tsv|json|jsonl|png|jpe?g|webp|gif)$/i.test(f))
            continue;
          staged.push({
            name: name + "/" + path.relative(out, f).split(path.sep).join("/"),
            content: readFileSync(f),
          });
        }
        staged.push({ name, content });
      } else {
        if (!/\.(txt|md|csv|tsv|json|jsonl|png|jpe?g|webp|gif)$/i.test(name))
          throw Error("Unsupported import format");
        staged.push({ name, content });
      }
    }
    if (new Set(staged.map((f) => f.name)).size !== staged.length)
      throw Error("Duplicate filenames in upload");
    // Save raw bytes before recording the batch; an interrupted write never creates a database-only original.
    const { hash } = await import("../../../lib/importer.ts");
    for (const f of staged) {
      const target = path.resolve(
        process.env.RNAS_STAGED ?? "evidence/staged",
        hash(f.content),
      );
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, f.content, { flag: "w" });
    }
    const result = stageFiles(getDb(), staged);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
  }
}
