/**
 * Cross-platform Python launcher for npm scripts.
 * Tries py / python3 / python so Mac + Windows both work.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptName = process.argv[2];
if (!scriptName) {
  console.error("Usage: node scripts/run_python.mjs <script.py> [args...]");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, scriptName);
const args = process.argv.slice(3);
const candidates =
  process.platform === "win32"
    ? ["py", "python", "python3"]
    : ["python3", "python"];

let lastErr = "";
for (const bin of candidates) {
  const invoke =
    bin === "py"
      ? ["-3", scriptPath, ...args]
      : [scriptPath, ...args];
  const result = spawnSync(bin, invoke, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.error) {
    lastErr = result.error.message;
    continue;
  }
  if (result.status === 0 || result.status === null) {
    process.exit(result.status ?? 0);
  }
  // Interpreter found but script failed — do not try next candidate.
  process.exit(result.status ?? 1);
}

console.error(
  `No Python interpreter found (tried: ${candidates.join(", ")}). Install Python 3.`,
);
if (lastErr) console.error(lastErr);
process.exit(1);
