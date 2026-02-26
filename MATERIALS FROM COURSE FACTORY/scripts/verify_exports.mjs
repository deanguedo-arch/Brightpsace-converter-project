#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { renderExports } from "./render_exports.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "out");
const LEGACY_PATH = path.join(OUT_DIR, "legacy_compiled.html");
const BETA_DIR = path.join(OUT_DIR, "beta");
const BASELINE_FILE = path.join(REPO_ROOT, "baselines", "exports_baseline.json");
const FIXED_UPDATED_AT = "2000-01-01T00:00:00.000Z";

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function stableStringify(value, space = 2) {
  const seen = new WeakSet();
  const normalize = (v) => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === "object") {
      if (seen.has(v)) throw new TypeError("Circular structure in manifest normalization");
      seen.add(v);
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
      seen.delete(v);
      return out;
    }
    return v;
  };
  return JSON.stringify(normalize(value), null, space);
}

function normalizeForHash(relPath, buf) {
  const p = relPath.replaceAll("\\", "/");
  if (p.endsWith("manifest.json")) {
    try {
      const obj = JSON.parse(buf.toString("utf8"));
      if (obj && "updatedAt" in obj) obj.updatedAt = FIXED_UPDATED_AT;
      return Buffer.from(stableStringify(obj, 2) + "\n", "utf8");
    } catch { return buf; }
  }
  if (p.endsWith("index.html")) {
    return Buffer.from(buf.toString("utf8").replace(/Last updated:\s*[^<\n]+/g, `Last updated: ${FIXED_UPDATED_AT}`), "utf8");
  }
  return buf;
}

async function listFiles(dir) {
  const out = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) { if(e.name !== "__MACOSX") await walk(abs); }
      else { if(!e.name.startsWith("._") && e.name !== ".DS_Store") out.push(abs); }
    }
  }
  await walk(dir);
  return out.sort();
}

async function hashOutputs() {
  await renderExports();
  const legacyHash = sha256(await fs.readFile(LEGACY_PATH));
  const betaFiles = await listFiles(BETA_DIR);
  const perFile = {};
  const manifest = [];
  
  for (const abs of betaFiles) {
    const rel = path.relative(OUT_DIR, abs).replaceAll("\\", "/");
    const h = sha256(normalizeForHash(rel, await fs.readFile(abs)));
    perFile[rel] = h;
    manifest.push(`${h}  ${rel}`);
  }
  
  return { legacyHash, betaAggregateHash: sha256(Buffer.from(manifest.join("\n") + "\n", "utf8")), perFile };
}

async function main() {
  const cmd = process.argv[2] || "verify";
  if (cmd === "baseline") {
    const cur = await hashOutputs();
    await fs.mkdir(path.dirname(BASELINE_FILE), { recursive: true });
    await fs.writeFile(BASELINE_FILE, JSON.stringify(cur, null, 2), "utf8");
    console.log("✅ BASELINE WRITTEN");
  } else {
    const base = JSON.parse(await fs.readFile(BASELINE_FILE, "utf8"));
    const cur = await hashOutputs();
    if (base.legacyHash === cur.legacyHash && base.betaAggregateHash === cur.betaAggregateHash) {
      console.log("✅ VERIFIED: NO DRIFT");
    } else {
      console.log("❌ OUTPUT DRIFT DETECTED");
      process.exit(1);
    }
  }
}
main();
