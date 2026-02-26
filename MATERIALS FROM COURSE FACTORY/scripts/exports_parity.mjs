#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const BASELINE_JSON_PATH =
  process.env.BASELINE_JSON || path.join(REPO_ROOT, "baselines", "project_baseline.json");

const COMPILER_PATH = path.join(REPO_ROOT, "src", "utils", "compiler.js");
const compiler = await import(pathToFileURL(COMPILER_PATH).toString());

function sha256(content) {
  return crypto.createHash("sha256").update(Buffer.from(String(content), "utf8")).digest("hex");
}

function extractModuleIdFromPath(relPath) {
  if (!relPath.startsWith("modules/") || !relPath.endsWith(".html")) return null;
  return relPath.slice("modules/".length, -".html".length);
}

async function main() {
  const raw = await fs.readFile(BASELINE_JSON_PATH, "utf8");
  const projectData = JSON.parse(raw);
  const filesMap = compiler.compileProjectToFilesMap({ projectData, excludedIds: [] });
  const moduleEntries = Object.entries(filesMap).filter(([rel]) => rel.startsWith("modules/") && rel.endsWith(".html"));

  const mismatches = [];
  for (const [relPath, exportHtml] of moduleEntries) {
    const moduleId = extractModuleIdFromPath(relPath);
    if (!moduleId) continue;
    const previewHtml = compiler.compileModuleToHtml({ projectData, moduleId });
    if (previewHtml == null) {
      mismatches.push({
        moduleId,
        relPath,
        reason: "preview compile returned null",
      });
      continue;
    }
    const exportHash = sha256(exportHtml);
    const previewHash = sha256(previewHtml);
    if (exportHash !== previewHash) {
      mismatches.push({
        moduleId,
        relPath,
        reason: "hash mismatch",
        exportHash,
        previewHash,
      });
    }
  }

  if (mismatches.length > 0) {
    console.log("❌ PREVIEW/EXPORT PARITY FAILED");
    mismatches.forEach((m) => {
      const detail =
        m.reason === "hash mismatch"
          ? `export=${m.exportHash} preview=${m.previewHash}`
          : m.reason;
      console.log(`- ${m.moduleId} (${m.relPath}): ${detail}`);
    });
    process.exit(1);
  }

  console.log(`✅ PREVIEW/EXPORT PARITY OK (${moduleEntries.length} modules)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
