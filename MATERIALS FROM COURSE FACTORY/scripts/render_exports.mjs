#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const BASELINE_JSON_PATH = process.env.BASELINE_JSON || path.join(REPO_ROOT, "baselines", "project_baseline.json");
const OUT_DIR = path.join(REPO_ROOT, "out");
const OUT_BETA_DIR = path.join(OUT_DIR, "beta");
const OUT_LEGACY_PATH = path.join(OUT_DIR, "legacy_compiled.html");

const GENERATORS_PATH = path.join(REPO_ROOT, "src", "utils", "generators.js");
const generators = await import(pathToFileURL(GENERATORS_PATH).toString());

async function ensureEmptyDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFileEnsuringDir(filePath, content) {
  const parent = path.dirname(filePath);
  await fs.mkdir(parent, { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function renderExports({ baselineJsonPath = BASELINE_JSON_PATH, excludedIds = [] } = {}) {
  const raw = await fs.readFile(baselineJsonPath, "utf8");
  const projectData = JSON.parse(raw);
  
  // Validation
  const modules = projectData?.["Current Course"]?.modules;
  if (!Array.isArray(modules)) throw new Error("Invalid Baseline JSON structure");

  await ensureEmptyDir(OUT_DIR);
  await fs.mkdir(OUT_BETA_DIR, { recursive: true });

  const { buildLegacyCompiledHtml, buildStaticFilesBetaFromProject } = generators;

  // Render Legacy
  const legacyHtml = buildLegacyCompiledHtml({ projectData, excludedIds, initialViewKey: null });
  await writeFileEnsuringDir(OUT_LEGACY_PATH, legacyHtml);

  // Render Beta
  const filesMap = buildStaticFilesBetaFromProject({ projectData, excludedIds });
  for (const [rel, content] of Object.entries(filesMap)) {
    const safeRel = rel.replace(/^\/+/, "");
    const outPath = path.join(OUT_BETA_DIR, safeRel);
    await writeFileEnsuringDir(outPath, String(content));
  }

  return { outDir: OUT_DIR, legacyPath: OUT_LEGACY_PATH, betaDir: OUT_BETA_DIR };
}

// Only run when executed directly, not when imported (e.g. by verify_exports.mjs).
const entryHref = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entryHref && import.meta.url === entryHref) {
  renderExports()
    .then(() => console.log("✅ Render Complete"))
    .catch(e => { console.error(e); process.exit(1); });
}
