import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "skills.manifest.json");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const invocation = process.platform === "win32"
      ? { command: "cmd", args: ["/c", command, ...args] }
      : { command, args };
    const child = spawn(invocation.command, invocation.args, {
      cwd: ROOT,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${command} ${args.join(" ")}), exit code ${code}`));
    });
  });
}

function pickNpx() {
  if (process.platform === "win32") return "npx.cmd";
  return "npx";
}

async function main() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);
  const targets = Array.isArray(manifest.targets) ? manifest.targets : ["codex"];
  const skills = Array.isArray(manifest.skills) ? manifest.skills : [];

  if (skills.length === 0) {
    throw new Error("skills.manifest.json has no skills configured.");
  }

  const npx = pickNpx();
  for (const entry of skills) {
    if (!entry?.repo || !entry?.skill) {
      throw new Error(`Invalid manifest entry: ${JSON.stringify(entry)}`);
    }
    const args = [
      "skills",
      "add",
      entry.repo,
      "--skill",
      entry.skill,
      "-y"
    ];
    for (const target of targets) {
      args.push("-a", target);
    }
    console.log(`\nInstalling ${entry.repo}@${entry.skill}`);
    await runCommand(npx, args);
  }
  console.log("\nSkills bootstrap complete.");
}

main().catch((error) => {
  console.error(`skills:bootstrap failed: ${error.message}`);
  process.exit(1);
});
