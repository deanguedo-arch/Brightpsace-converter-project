import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { ensureDir, listFilesRecursive, writeFileEnsuringDir } from "./fs.js";
import { initUnitScaffold } from "./scaffold.js";
import { extractTextByExtension } from "./extractText.js";
import { slugify, titleFromSlug } from "./utils.js";
import { compileUnitFromSource } from "./compile.js";
import { normalizeSourceMaterial } from "./sourceNormalization.js";
import { renderGuidedUnit } from "./renderGuidedUnit.js";
import { loadDesignOverrides } from "./designPolicy.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([".txt"]);
const EXTRACTABLE_EXTENSIONS = new Set([".docx", ".pdf"]);

function fixCommonPdfEncoding(raw) {
  return String(raw || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
}

function toRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function looksLikeContentFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension);
}

function normalizeText(raw) {
  return fixCommonPdfEncoding(raw)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractRelationshipSteps(text) {
  const match = String(text || "").match(/Relationship Progression Activity([\s\S]*?)Remember:/i);
  if (!match) return [];

  const block = match[1] || "";
  const lines = normalizeLines(block)
    .filter((line) => !isNoiseLine(line))
    .filter((line) => !isUnderlineOnly(line))
    .map((line) => stripUnderscores(line))
    .filter(Boolean);

  const firstStepIndex = lines.findIndex((line) => /^Intercourse$/i.test(line));
  const candidate = firstStepIndex >= 0 ? lines.slice(firstStepIndex) : lines.slice(-16);

  const seen = new Set();
  const items = [];
  for (const raw of candidate) {
    const label = String(raw || "")
      .replace(/^["']+|["']+$/g, "")
      .replace(/"/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(label);
  }
  return items;
}

function extractInsideOutQuestions(text, limit = 10) {
  const match = String(text || "").match(/Summative Task B:\s*["']?Inside Out["']?\s*Film Study([\s\S]*)$/i);
  if (!match) return [];

  const blockLines = normalizeLines(match[1] || "")
    .filter((line) => !isNoiseLine(line));
  const questions = [];
  let current = "";

  for (const raw of blockLines) {
    const line = String(raw || "").trim();
    if (!line) continue;

    const m = line.match(/^(\d{1,2})\.\s+(.+)$/);
    if (m) {
      if (current) {
        questions.push(current.trim());
        if (questions.length >= limit) return questions;
      }
      current = m[2].trim();
      continue;
    }

    if (!current) continue;
    current = `${current} ${line}`.replace(/\s+/g, " ").trim();
  }

  if (current && questions.length < limit) {
    questions.push(current.trim());
  }

  return questions.slice(0, limit);
}

function looksLikeCalmModule1(text) {
  const value = String(text || "");
  return /Career\s+and\s+Life\s+Management/i.test(value)
    && /Module\s*1/i.test(value)
    && /Personal Choices/i.test(value);
}

function looksLikeCalmModule2(text) {
  const value = String(text || "");
  return /Career\s+and\s+Life\s+Management/i.test(value)
    && /Module\s*2/i.test(value)
    && /Resource Choices/i.test(value);
}

function buildConvertedUnitConfig({
  converter,
  title
}) {
  if (converter === "calm-module-2") {
    return {
      slug: "module-2-v2",
      title,
      subtitle: "Advertising, budgeting, consumer decisions, honesty, and conflict",
      estimatedMinutes: 120,
      template: "guided-workbook",
      theme: "clay-workbook",
      objectives: [
        "Analyze how advertising, peers, habit, and lifestyle influence spending choices.",
        "Compare short-term image purchases with stronger long-term money decisions.",
        "Use purchase research questions and a monthly budget to make better consumer choices.",
        "Apply honesty and communication skills to real relationship and conflict cases."
      ]
    };
  }

  if (converter === "calm-module-1") {
    return {
      title,
      subtitle: "Personal wellness, relationships, risk, and healthy decision making",
      estimatedMinutes: 120,
      template: "guided-workbook",
      theme: "clay-workbook",
      objectives: [
        "Identify personal patterns that affect learning, health, and daily choices.",
        "Analyze relationship, substance-use, and risk-taking scenarios with safer decision logic.",
        "Reflect on addiction and mental-health awareness using structured prompts.",
        "Complete summative personal-choice tasks with clear evidence and reflection."
      ]
    };
  }

  return {
    title,
    subtitle: "Guided interactive workbook generated from uploaded source materials",
    estimatedMinutes: 90,
    template: "guided-workbook",
    theme: "clay-workbook",
    objectives: [
      "Review source content in structured, readable sections.",
      "Complete interactive prompts with clear written responses.",
      "Use reflection and planning prompts to support next-step decisions."
    ]
  };
}

async function writeConvertedUnitConfig(unitDir, config, unitSlug) {
  const unitConfigPath = path.join(unitDir, "unit.yml");
  const unitConfig = {
    slug: unitSlug,
    title: config.title,
    ...(config.subtitle ? { subtitle: config.subtitle } : {}),
    estimatedMinutes: config.estimatedMinutes ?? 20,
    template: config.template || "premium-core",
    theme: config.theme || "bold-clay",
    objectives: Array.isArray(config.objectives) && config.objectives.length > 0
      ? config.objectives
      : [
          "Review the core ideas in this unit.",
          "Complete interactive activities and resources.",
          "Mark complete after practice."
        ]
  };
  await writeFileEnsuringDir(unitConfigPath, yaml.dump(unitConfig));
}

async function collectMaterials(files, extract) {
  const materials = [];
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (looksLikeContentFile(filePath)) {
      const text = normalizeText(await fs.readFile(filePath, "utf8"));
      if (text) materials.push({ filePath, text });
      continue;
    }
    if (extract && EXTRACTABLE_EXTENSIONS.has(ext)) {
      const text = normalizeText(await extractTextByExtension(filePath).catch(() => ""));
      if (text) materials.push({ filePath, text });
    }
  }
  return materials;
}

export async function convertUnitFromSource({
  repoRoot,
  sourcePath,
  courseSlug,
  unitSlug,
  extract = true,
  target = "brightspace-embed"
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedUnitSlug = slugify(unitSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  if (!normalizedUnitSlug) throw new Error("unitSlug is required.");

  const absoluteSource = path.resolve(repoRoot, sourcePath);
  const sourceStats = await fs.stat(absoluteSource).catch(() => null);
  if (!sourceStats) {
    throw new Error(`Source path not found: ${absoluteSource}`);
  }
  if (!sourceStats.isDirectory() && !sourceStats.isFile()) {
    throw new Error(`Source path must be a file or directory: ${absoluteSource}`);
  }

  const sourceRoot = sourceStats.isDirectory()
    ? absoluteSource
    : path.dirname(absoluteSource);
  const sourceFiles = sourceStats.isDirectory()
    ? await listFilesRecursive(absoluteSource)
    : [absoluteSource];

  const materials = await collectMaterials(sourceFiles, extract);
  const corpus = materials.map((item) => item.text).join("\n\n");

  let converter = "";
  let title = "";
  let content = "";
  let renderResult = null;
  let designOverridesMeta = null;
  const normalizedCorpus = normalizeText(corpus);

  if (!normalizedCorpus) {
    return compileUnitFromSource({
      repoRoot,
      sourcePath,
      courseSlug: normalizedCourseSlug,
      unitSlug: normalizedUnitSlug,
      extract,
      target
    });
  }

  if (looksLikeCalmModule1(corpus)) {
    converter = "calm-module-1";
    title = "CALM Module 1: Personal Choices";
  } else if (looksLikeCalmModule2(corpus)) {
    converter = "calm-module-2";
    title = "CALM Module 2: Resource Choices";
  } else {
    converter = "guided-auto";
    title = titleFromSlug(normalizedUnitSlug);
  }

  const plannedUnitDir = path.join(
    repoRoot,
    "courses",
    normalizedCourseSlug,
    "units",
    normalizedUnitSlug
  );
  designOverridesMeta = await loadDesignOverrides({ unitDir: plannedUnitDir });
  const normalizedUnit = normalizeSourceMaterial({
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    title,
    sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
    corpus: normalizedCorpus
  });
  renderResult = renderGuidedUnit({
    normalizedUnit,
    target,
    designOverrides: designOverridesMeta.overrides
  });
  content = renderResult.content;

  const scaffold = await initUnitScaffold({
    repoRoot,
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    title,
    template: "guided-workbook",
    theme: "clay-workbook"
  });

  const unitDir = scaffold.unitDir;
  const resourcesDir = path.join(unitDir, "resources");
  await ensureDir(resourcesDir);
  await writeConvertedUnitConfig(
    unitDir,
    buildConvertedUnitConfig({
      converter,
      title
    }),
    normalizedUnitSlug
  );

  const blueprint = {
    version: 1,
    generatedAt: new Date().toISOString(),
    converter,
    target,
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
    extractedMaterials: materials.map((item) => toRelative(sourceRoot, item.filePath)),
    ...(renderResult ? {
      patternDecisions: renderResult.patternDecisions,
      sourceCoverage: renderResult.sourceCoverage,
      designPolicy: {
        version: renderResult.designPolicyVersion,
        precedence: renderResult.governancePrecedence,
        overridesFile: designOverridesMeta?.exists ? toRelative(repoRoot, designOverridesMeta.filePath) : "",
        overridesApplied: renderResult.overridesApplied,
        overrideWarnings: designOverridesMeta?.warnings || []
      },
      fingerprints: renderResult.fingerprints
    } : {})
  };

  const blueprintPath = path.join(unitDir, "blueprint.convert.json");
  const contentPath = path.join(unitDir, "content.md");
  await writeFileEnsuringDir(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);
  await writeFileEnsuringDir(contentPath, content);

  for (const filePath of sourceFiles) {
    const rel = toRelative(sourceRoot, filePath);
    const destination = path.join(resourcesDir, rel);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(filePath, destination);
  }

  return {
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    unitDir,
    blueprintPath,
    contentPath,
    sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
    extractedMaterials: materials.map((item) => toRelative(sourceRoot, item.filePath))
  };
}
