import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn } from "node:child_process";
const temp = mkdtempSync(path.join(tmpdir(), "rnas-ui-"));
const env = {
  ...process.env,
  RNAS_DB: path.join(temp, "test.sqlite"),
  RNAS_STAGED: path.join(temp, "staged"),
};
const seed = spawnSync(process.execPath, ["scripts/import.ts"], {
  stdio: "inherit",
  env,
});
if (seed.status) process.exit(seed.status);
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  { stdio: "inherit", env },
);
for (const sig of ["SIGTERM", "SIGINT"])
  process.on(sig, () => server.kill(sig));
server.on("exit", (code) => {
  rmSync(temp, { recursive: true, force: true });
  process.exit(code ?? 0);
});
