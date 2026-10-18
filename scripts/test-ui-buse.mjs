import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const buse = process.env.PP2_BUSE_COMMAND;

if (!buse) {
  console.log("buse ui skipped: set PP2_BUSE_COMMAND to run the local smoke test");
} else {
  const command = process.platform === "win32" ? "cmd.exe" : buse;
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `"${buse}" --pp2-test`]
      : ["--pp2-test"];

  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 120_000,
  });

  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const stdout = result.stdout.trim();
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  assert(start >= 0 && end > start, `buse JSON missing:\n${stdout}`);

  const report = JSON.parse(stdout.slice(start, end + 1));
  assert.equal(report.ok, true, JSON.stringify(report, null, 2));

  console.log(`buse ui ok: ${report.logs.length} checks`);
}
