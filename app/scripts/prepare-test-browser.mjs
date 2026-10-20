// Optional Linux test fallback; not needed to run the app.
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
const out = path.join(tmpdir(), "rnas-test-browser");
mkdirSync(out, { recursive: true });
for (const file of ["chromium", "swiftshader.tar", "fonts.tar"])
  writeFileSync(
    path.join(out, file),
    brotliDecompressSync(
      readFileSync(
        path.resolve("node_modules/@sparticuz/chromium/bin", file + ".br"),
      ),
    ),
  );
chmodSync(path.join(out, "chromium"), 0o755);
for (const tar of ["swiftshader.tar", "fonts.tar"]) {
  const p = spawnSync(
    "tar",
    ["--no-same-owner", "-xf", path.join(out, tar), "-C", out],
    { stdio: "inherit" },
  );
  if (p.status) process.exit(p.status);
}
console.log(`RNAS_BROWSER_PATH=${path.join(out, "chromium")} npm run test:ui`);
