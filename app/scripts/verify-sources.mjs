import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("evidence/recovery");
const manifest = JSON.parse(
  readFileSync(path.join(root, "MANIFEST.json"), "utf8"),
);
for (const f of manifest.primary_sources) {
  if (
    createHash("sha256")
      .update(readFileSync(path.join(root, f.relative_path)))
      .digest("hex") !== f.sha256
  )
    throw Error("Changed original: " + f.relative_path);
}
console.log("All 14 original sources match the supplied SHA-256 hashes.");
