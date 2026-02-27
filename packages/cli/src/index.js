#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildPreviewUnit,
  compileUnitFromSource,
  importUnitFromFolder,
  initCourseScaffold,
  initUnitScaffold,
  scoreBuiltUnit,
  resolveDefaultCourseSlug,
  listCourseSlugs,
  listUnitSlugs,
  readCourseConfig,
  validateBrightspaceBuild
} from "../../core/src/index.js";
import { packageUnitAsScorm12 } from "../../scorm/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

function usage() {
  console.log(`cf - Brightspace course builder

Commands:
  cf doctor
  cf init course <courseSlug> [--title <title>] [--default]
  cf init unit <courseSlug> <unitSlug> [--title <title>]
  cf import <sourcePath> --course <courseSlug> --unit <unitSlug> [--extract]
  cf compile <sourcePath> --course <courseSlug> --unit <unitSlug> [--extract]
  cf preview <unitSlug> [--mode=sandbox] [--open] [--watch]
  cf preview <courseSlug> <unitSlug> [--mode=sandbox] [--open] [--watch]
  cf build <unitSlug> --scorm
  cf build <courseSlug> <unitSlug> --scorm
  cf build --all --scorm
  cf build <courseSlug> --all --scorm
    [--gate] [--min-overall 4] [--min-dimension 3]
  cf score [<courseSlug> <unitSlug>] [--min-overall 4] [--min-dimension 3] [--json]
  cf release <unitSlug> --scorm
  cf release <courseSlug> <unitSlug> --scorm
  cf release --all --scorm
  cf release <courseSlug> --all --scorm
    [--min-overall 4] [--min-dimension 3] [--skip-browser-check]
  cf validate --brightspace [<courseSlug> <unitSlug>]
`);
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const booleanFlags = new Set(["all", "brightspace", "scorm", "watch", "open", "extract", "default", "json", "skip-browser-check", "gate"]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      const body = arg.slice(2);
      if (body.includes("=")) {
        const [key, value] = body.split("=");
        flags[key] = value;
      } else {
        const next = argv[index + 1];
        if (!booleanFlags.has(body) && next && !next.startsWith("--")) {
          flags[body] = next;
          index += 1;
        } else {
          flags[body] = true;
        }
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4"
  };
  return map[ext] || "application/octet-stream";
}

async function serveDirectory(rootDir, port = 4173) {
  const server = http.createServer(async (req, res) => {
    const target = new URL(req.url || "/", "http://localhost");
    const clean = decodeURIComponent(target.pathname).replace(/\\/g, "/");
    const normalized = clean === "/" ? "/index.html" : clean;
    const absolute = path.resolve(rootDir, `.${normalized}`);
    if (!absolute.startsWith(path.resolve(rootDir))) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const fileStats = await fs.stat(absolute).catch(() => null);
    if (!fileStats?.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    const bytes = await fs.readFile(absolute);
    res.writeHead(200, {
      "Content-Type": contentType(absolute),
      "Cache-Control": "no-store"
    });
    res.end(bytes);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });
  console.log(`Preview server running: http://localhost:${port}`);
  console.log(`Serving compiled output from ${rootDir}`);
  return server;
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }
  spawn("xdg-open", [url], {
    detached: true,
    stdio: "ignore"
  }).unref();
}

function commandExists(command, args = ["--version"]) {
  const result = process.platform === "win32"
    ? spawnSync("where", [command], { stdio: "pipe" })
    : spawnSync("which", [command], { stdio: "pipe" });
  return result.status === 0;
}

function parseNodeMajor(version) {
  const major = Number(String(version).replace(/^v/, "").split(".")[0]);
  return Number.isFinite(major) ? major : 0;
}

function collectInstalledSkills() {
  const skillsDir = path.join(REPO_ROOT, ".agents", "skills");
  const installed = new Set();
  const entries = fsSync.existsSync(skillsDir)
    ? fsSync.readdirSync(skillsDir, { withFileTypes: true })
    : [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (fsSync.existsSync(skillFile)) {
      installed.add(entry.name);
    }
  }
  return installed;
}

function formatCheck(ok, message) {
  return `${ok ? "OK" : "FAIL"}  ${message}`;
}

async function runDoctor() {
  const checks = [];
  const nodeMajor = parseNodeMajor(process.version);
  checks.push({
    ok: nodeMajor >= 20,
    message: `Node runtime ${process.version} (requires >=20)`
  });
  checks.push({
    ok: commandExists("npm"),
    message: "npm available on PATH"
  });
  checks.push({
    ok: commandExists("npx"),
    message: "npx available on PATH"
  });
  checks.push({
    ok: commandExists("git"),
    message: "git available on PATH"
  });

  const requiredFiles = [
    "package.json",
    "skills.manifest.json",
    "AGENTS.md",
    "README.md"
  ];
  for (const file of requiredFiles) {
    checks.push({
      ok: fsSync.existsSync(path.join(REPO_ROOT, file)),
      message: `${file} present`
    });
  }

  const manifestRaw = await fs.readFile(path.join(REPO_ROOT, "skills.manifest.json"), "utf8").catch(() => "");
  const manifest = manifestRaw ? JSON.parse(manifestRaw) : { skills: [] };
  const installedSkills = collectInstalledSkills();
  for (const entry of manifest.skills || []) {
    checks.push({
      ok: installedSkills.has(entry.skill),
      message: `skill installed: ${entry.skill}`
    });
  }

  const courseSlugs = await listCourseSlugs(REPO_ROOT);
  checks.push({
    ok: courseSlugs.length > 0,
    message: "at least one course scaffold exists"
  });
  const hasDefault = await resolveDefaultCourseSlug(REPO_ROOT)
    .then(() => true)
    .catch(() => false);
  checks.push({
    ok: hasDefault,
    message: "default course configured"
  });

  console.log("cf doctor report");
  for (const check of checks) {
    console.log(formatCheck(check.ok, check.message));
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`Doctor found ${failed.length} failing checks.`);
  }
  console.log("All checks passed.");
}

async function watchPreviewSources({ courseSlug, unitSlug, sandbox, onRebuild }) {
  const watchRoots = [
    path.join(REPO_ROOT, "courses", courseSlug, "units", unitSlug),
    path.join(REPO_ROOT, "packages", "theme", "src")
  ];
  const watchers = [];
  let timer = null;

  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await buildPreviewUnit({
          repoRoot: REPO_ROOT,
          courseSlug,
          unitSlug,
          sandbox
        });
        await onRebuild();
      } catch (error) {
        console.error(`Rebuild failed: ${error.message}`);
      }
    }, 150);
  };

  for (const root of watchRoots) {
    if (!fsSync.existsSync(root)) continue;
    const watcher = fsSync.watch(root, { recursive: true }, () => trigger());
    watchers.push(watcher);
  }

  return () => {
    for (const watcher of watchers) watcher.close();
    if (timer) clearTimeout(timer);
  };
}

async function resolveCourseAndUnit(positional, allMode) {
  if (allMode) {
    if (positional.length === 0) {
      const courseSlug = await resolveDefaultCourseSlug(REPO_ROOT);
      return { courseSlug, unitSlug: null };
    }
    if (positional.length === 1) {
      return { courseSlug: positional[0], unitSlug: null };
    }
    throw new Error("For --all builds use either `cf build --all --scorm` or `cf build <courseSlug> --all --scorm`.");
  }

  if (positional.length === 1) {
    const courseSlug = await resolveDefaultCourseSlug(REPO_ROOT);
    return { courseSlug, unitSlug: positional[0] };
  }
  if (positional.length === 2) {
    return { courseSlug: positional[0], unitSlug: positional[1] };
  }
  throw new Error("Invalid arguments. See `cf` usage.");
}

function printValidationResult(unitSlug, result) {
  if (result.warnings.length > 0) {
    console.log(`Warnings for ${unitSlug}:`);
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }
  if (result.errors.length > 0) {
    console.error(`Validation failed for ${unitSlug}:`);
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
  }
}

function parseThresholds(flags) {
  const minOverall = Number(flags["min-overall"] ?? 4);
  const minDimension = Number(flags["min-dimension"] ?? 3);
  if (!Number.isFinite(minOverall) || !Number.isFinite(minDimension)) {
    throw new Error("--min-overall and --min-dimension must be numbers.");
  }
  return { minOverall, minDimension };
}

function scorePassesThresholds(score, thresholds) {
  return score.overall >= thresholds.minOverall && score.minDimensionScore >= thresholds.minDimension;
}

function printScoreResult(target, score) {
  console.log(`\nScore for ${target}: ${score.overall.toFixed(2)} / 5 (${score.verdict})`);
  const labels = [
    ["pedagogyClarity", "Pedagogy"],
    ["activityRichness", "Activity"],
    ["assessmentQuality", "Assessment"],
    ["accessibilityReadability", "Accessibility"],
    ["productionSafety", "Production"],
    ["uiHierarchy", "UI"]
  ];
  for (const [key, label] of labels) {
    const value = score.dimensions[key];
    console.log(`  - ${label}: ${value.score.toFixed(2)} / ${value.max}`);
  }
  if (score.recommendations.length > 0) {
    console.log("  Recommendations:");
    for (const item of score.recommendations.slice(0, 4)) {
      console.log(`    - ${item}`);
    }
  }
}

async function runNpmTest() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm test"]
    : ["test"];
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("npm test failed."));
    });
  });
}

async function runPlaywrightSmoke(previewDir, targetName) {
  const scriptPath = path.join(REPO_ROOT, "scripts", "playwright-smoke.mjs");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, previewDir], {
      cwd: REPO_ROOT,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Playwright smoke failed for ${targetName}.`));
    });
  });
}

async function resolveScoreTargets(positional) {
  const targets = [];
  if (positional.length === 0) {
    const courseSlug = await resolveDefaultCourseSlug(REPO_ROOT);
    const units = await listUnitSlugs(REPO_ROOT, courseSlug);
    for (const unitSlug of units) targets.push({ courseSlug, unitSlug });
  } else if (positional.length === 1) {
    const courseSlug = positional[0];
    const units = await listUnitSlugs(REPO_ROOT, courseSlug);
    for (const unitSlug of units) targets.push({ courseSlug, unitSlug });
  } else if (positional.length === 2) {
    targets.push({ courseSlug: positional[0], unitSlug: positional[1] });
  } else {
    throw new Error("Too many arguments for score.");
  }
  if (targets.length === 0) {
    throw new Error("No units found for scoring.");
  }
  return targets;
}

async function runInit(positional, flags) {
  const target = positional[0];
  if (!target) {
    throw new Error("Usage: cf init course <courseSlug> | cf init unit <courseSlug> <unitSlug>");
  }

  if (target === "course") {
    const courseSlug = positional[1];
    if (!courseSlug) {
      throw new Error("Usage: cf init course <courseSlug> [--title <title>] [--default]");
    }
    const created = await initCourseScaffold({
      repoRoot: REPO_ROOT,
      courseSlug,
      title: String(flags.title || ""),
      makeDefault: Boolean(flags.default)
    });
    console.log(
      created.created
        ? `Created course scaffold: courses/${created.courseSlug}`
        : `Course scaffold already exists: courses/${created.courseSlug}`
    );
    return;
  }

  if (target === "unit") {
    let courseSlug = positional[1];
    let unitSlug = positional[2];
    if (!courseSlug) {
      throw new Error("Usage: cf init unit <courseSlug> <unitSlug> [--title <title>]");
    }
    if (!unitSlug) {
      unitSlug = courseSlug;
      courseSlug = await resolveDefaultCourseSlug(REPO_ROOT);
    }
    const created = await initUnitScaffold({
      repoRoot: REPO_ROOT,
      courseSlug,
      unitSlug,
      title: String(flags.title || "")
    });
    console.log(
      created.created
        ? `Created unit scaffold: courses/${created.courseSlug}/units/${created.unitSlug}`
        : `Unit scaffold already exists: courses/${created.courseSlug}/units/${created.unitSlug}`
    );
    return;
  }

  throw new Error(`Unknown init target: ${target}`);
}

async function runImport(positional, flags) {
  const sourcePath = positional[0];
  if (!sourcePath) {
    throw new Error("Usage: cf import <sourcePath> --course <courseSlug> --unit <unitSlug>");
  }
  if (!flags.course || !flags.unit) {
    throw new Error("Import requires --course and --unit.");
  }
  const imported = await importUnitFromFolder({
    repoRoot: REPO_ROOT,
    sourcePath,
    courseSlug: String(flags.course),
    unitSlug: String(flags.unit),
    extract: Boolean(flags.extract)
  });
  console.log(`Imported to courses/${imported.courseSlug}/units/${imported.unitSlug}`);
  if (imported.extractedDocs?.length) {
    console.log(`Extracted text from ${imported.extractedDocs.length} document(s):`);
    for (const doc of imported.extractedDocs) {
      console.log(`  - ${doc}`);
    }
  }
}

async function runPreview(positional, flags) {
  const mode = String(flags.mode || "production").toLowerCase();
  const sandbox = mode === "sandbox";
  const watch = Boolean(flags.watch);
  const shouldOpen = Boolean(flags.open);
  const port = Number(flags.port || 4173);
  const { courseSlug, unitSlug } = await resolveCourseAndUnit(positional, false);
  const built = await buildPreviewUnit({
    repoRoot: REPO_ROOT,
    courseSlug,
    unitSlug,
    sandbox
  });
  console.log(`Built preview: ${built.indexPath}`);
  const server = await serveDirectory(built.outputDir, port);
  const previewUrl = `http://localhost:${port}`;
  if (shouldOpen) {
    openBrowser(previewUrl);
    console.log(`Opened browser: ${previewUrl}`);
  }

  let stopWatch = null;
  if (watch) {
    stopWatch = await watchPreviewSources({
      courseSlug,
      unitSlug,
      sandbox,
      onRebuild: async () => {
        console.log(`Rebuilt preview for ${courseSlug}/${unitSlug}`);
      }
    });
    console.log("Watch mode enabled.");
  }

  function shutdown() {
    if (stopWatch) stopWatch();
    server.close(() => process.exit(0));
  }
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await new Promise(() => {});
}

async function runBuild(positional, flags) {
  if (!flags.scorm) {
    throw new Error("Build requires --scorm.");
  }
  const thresholds = flags.gate ? parseThresholds(flags) : null;
  const allMode = Boolean(flags.all);
  const { courseSlug, unitSlug } = await resolveCourseAndUnit(positional, allMode);
  const units = allMode ? await listUnitSlugs(REPO_ROOT, courseSlug) : [unitSlug];
  const courseConfig = await readCourseConfig(REPO_ROOT, courseSlug);
  const externalAllowlist = Array.isArray(courseConfig?.externalAllowlist)
    ? courseConfig.externalAllowlist.map((value) => String(value))
    : [];
  if (units.length === 0) {
    throw new Error(`No units found for course "${courseSlug}".`);
  }

  for (const currentUnitSlug of units) {
    console.log(`\nBuilding ${courseSlug}/${currentUnitSlug}`);
    const built = await buildPreviewUnit({
      repoRoot: REPO_ROOT,
      courseSlug,
      unitSlug: currentUnitSlug,
      sandbox: false
    });
    const validation = await validateBrightspaceBuild({
      buildDir: built.outputDir,
      externalAllowlist
    });
    printValidationResult(currentUnitSlug, validation);
    if (validation.errors.length > 0) {
      throw new Error(`Guardrails failed for ${courseSlug}/${currentUnitSlug}.`);
    }

    const outZipPath = path.join(REPO_ROOT, "dist", "scorm", courseSlug, `${currentUnitSlug}.zip`);
    await packageUnitAsScorm12({
      previewDir: built.outputDir,
      outZipPath,
      courseSlug,
      unitSlug: currentUnitSlug,
      title: built.unitModel.title
    });
    console.log(`SCORM zip: ${outZipPath}`);

    if (flags.gate && thresholds) {
      const scored = await scoreBuiltUnit({
        repoRoot: REPO_ROOT,
        courseSlug,
        unitSlug: currentUnitSlug
      });
      printScoreResult(`${courseSlug}/${currentUnitSlug}`, scored);
      if (!scorePassesThresholds(scored, thresholds)) {
        throw new Error(
          `Build gate failed for ${courseSlug}/${currentUnitSlug} (overall ${scored.overall.toFixed(2)}, minimum ${scored.minDimensionScore.toFixed(2)}).`
        );
      }
    }
  }
}

async function runValidate(positional, flags) {
  if (!flags.brightspace) {
    throw new Error("Usage: cf validate --brightspace [<courseSlug> <unitSlug>]");
  }

  const targets = [];
  if (positional.length === 0) {
    const courseSlug = await resolveDefaultCourseSlug(REPO_ROOT);
    const units = await listUnitSlugs(REPO_ROOT, courseSlug);
    for (const unitSlug of units) targets.push({ courseSlug, unitSlug });
  } else if (positional.length === 1) {
    const courseSlug = positional[0];
    const units = await listUnitSlugs(REPO_ROOT, courseSlug);
    for (const unitSlug of units) targets.push({ courseSlug, unitSlug });
  } else if (positional.length === 2) {
    targets.push({ courseSlug: positional[0], unitSlug: positional[1] });
  } else {
    throw new Error("Too many arguments for validate.");
  }

  if (targets.length === 0) {
    throw new Error("No units found for validation.");
  }

  let hasErrors = false;
  for (const target of targets) {
    const courseConfig = await readCourseConfig(REPO_ROOT, target.courseSlug);
    const externalAllowlist = Array.isArray(courseConfig?.externalAllowlist)
      ? courseConfig.externalAllowlist.map((value) => String(value))
      : [];
    const built = await buildPreviewUnit({
      repoRoot: REPO_ROOT,
      courseSlug: target.courseSlug,
      unitSlug: target.unitSlug,
      sandbox: false
    });
    const validation = await validateBrightspaceBuild({
      buildDir: built.outputDir,
      externalAllowlist
    });
    printValidationResult(`${target.courseSlug}/${target.unitSlug}`, validation);
    if (validation.errors.length > 0) hasErrors = true;
  }

  if (hasErrors) {
    throw new Error("Validation failed.");
  }
  console.log("Brightspace validation passed.");
}

async function runScore(positional, flags) {
  const thresholds = parseThresholds(flags);
  const targets = await resolveScoreTargets(positional);
  const results = [];
  let hasGateFailure = false;

  for (const target of targets) {
    const scored = await scoreBuiltUnit({
      repoRoot: REPO_ROOT,
      courseSlug: target.courseSlug,
      unitSlug: target.unitSlug
    });
    const name = `${target.courseSlug}/${target.unitSlug}`;
    printValidationResult(name, scored.validation);
    printScoreResult(name, scored);
    const pass = scorePassesThresholds(scored, thresholds);
    if (!pass) {
      hasGateFailure = true;
      console.error(
        `  Gate failed: overall ${scored.overall.toFixed(2)} < ${thresholds.minOverall} or min dimension ${scored.minDimensionScore.toFixed(2)} < ${thresholds.minDimension}`
      );
    }
    results.push({
      courseSlug: target.courseSlug,
      unitSlug: target.unitSlug,
      score: scored.overall,
      minDimensionScore: scored.minDimensionScore,
      verdict: scored.verdict,
      pass,
      dimensions: scored.dimensions,
      recommendations: scored.recommendations,
      validation: scored.validation
    });
  }

  if (flags.json) {
    console.log(JSON.stringify({ thresholds, results }, null, 2));
  }

  if (hasGateFailure) {
    throw new Error("Score gate failed.");
  }
}

async function runCompile(positional, flags) {
  const sourcePath = positional[0];
  if (!sourcePath) {
    throw new Error("Usage: cf compile <sourcePath> --course <courseSlug> --unit <unitSlug> [--extract]");
  }
  if (!flags.course || !flags.unit) {
    throw new Error("Compile requires --course and --unit.");
  }
  const compiled = await compileUnitFromSource({
    repoRoot: REPO_ROOT,
    sourcePath,
    courseSlug: String(flags.course),
    unitSlug: String(flags.unit),
    extract: Boolean(flags.extract)
  });
  console.log(`Compiled unit blueprint: courses/${compiled.courseSlug}/units/${compiled.unitSlug}`);
  console.log(`Blueprint: ${compiled.blueprintPath}`);
  console.log(`Draft content: ${compiled.contentPath}`);
  if (compiled.extractedMaterials.length > 0) {
    console.log(`Extracted/loaded ${compiled.extractedMaterials.length} source file(s):`);
    for (const file of compiled.extractedMaterials) {
      console.log(`  - ${file}`);
    }
  }
}

async function runRelease(positional, flags) {
  if (!flags.scorm) {
    throw new Error("Release requires --scorm.");
  }
  console.log("Running release gate: npm test -> build -> validate -> score");
  await runNpmTest();
  await runBuild(positional, { ...flags, scorm: true });
  await runValidate(positional, { brightspace: true });
  if (!flags["skip-browser-check"]) {
    const targets = await resolveScoreTargets(positional);
    for (const target of targets) {
      const scored = await scoreBuiltUnit({
        repoRoot: REPO_ROOT,
        courseSlug: target.courseSlug,
        unitSlug: target.unitSlug
      });
      const name = `${target.courseSlug}/${target.unitSlug}`;
      console.log(`Running Playwright smoke for ${name}`);
      await runPlaywrightSmoke(scored.built.outputDir, name);
    }
  }
  await runScore(positional, flags);
  console.log("Release gate passed.");
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) {
    usage();
    return;
  }

  const { positional, flags } = parseArgs(rest);
  switch (command) {
    case "doctor":
      await runDoctor();
      break;
    case "init":
      await runInit(positional, flags);
      break;
    case "import":
      await runImport(positional, flags);
      break;
    case "compile":
      await runCompile(positional, flags);
      break;
    case "preview":
      await runPreview(positional, flags);
      break;
    case "build":
      await runBuild(positional, flags);
      break;
    case "validate":
      await runValidate(positional, flags);
      break;
    case "score":
      await runScore(positional, flags);
      break;
    case "release":
      await runRelease(positional, flags);
      break;
    case "help":
    case "--help":
      usage();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
