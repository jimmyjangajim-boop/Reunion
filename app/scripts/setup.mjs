import { spawnSync } from "node:child_process";
for (const args of [
  ["--experimental-strip-types", "scripts/migrate.ts"],
  ["--experimental-strip-types", "scripts/import.ts"],
]) {
  const p = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (p.status) process.exit(p.status);
}
