import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "skills.manifest.json");
const PROJECT_SKILLS_DIR = path.join(ROOT, ".agents", "skills");

async function main() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);
  const skills = Array.isArray(manifest.skills) ? manifest.skills : [];

  console.log("Project skill manifest:");
  for (const entry of skills) {
    const installedPath = path.join(PROJECT_SKILLS_DIR, entry.skill);
    const installed = await fs.stat(installedPath).then(() => true).catch(() => false);
    console.log(`- ${entry.repo}@${entry.skill} ${installed ? "(installed)" : "(not installed)"}`);
  }
}

main().catch((error) => {
  console.error(`skills:list failed: ${error.message}`);
  process.exit(1);
});
