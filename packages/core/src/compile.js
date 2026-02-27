import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, listFilesRecursive, writeFileEnsuringDir } from "./fs.js";
import { initUnitScaffold } from "./scaffold.js";
import { extractTextByExtension } from "./extractText.js";
import { slugify, titleFromSlug } from "./utils.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([".txt"]);
const EXTRACTABLE_EXTENSIONS = new Set([".docx", ".pdf"]);
const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "below", "being", "between", "could",
  "every", "first", "from", "have", "into", "most", "other", "over", "same", "than",
  "that", "their", "there", "these", "they", "this", "those", "through", "under",
  "very", "what", "when", "where", "which", "while", "with", "would", "your", "course",
  "module", "unit", "student", "students"
]);
const CODE_STOPWORDS = new Set([
  "import", "export", "const", "class", "function", "return", "react", "props", "state",
  "usestate", "useeffect", "usememo", "classname", "onclick", "onchange", "formdata",
  "flatmap", "map", "filter", "reduce", "value", "label", "styles", "component"
]);
const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/i;
const CODE_PATTERN = /[{}<>`]|=>|;|\/\*|\*\/|\b(import|export|const|let|var|function|class|return|className|useState|useEffect|useMemo|formData)\b/i;

function toRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function looksLikeContentFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension);
}

function normalizeText(raw) {
  return String(raw || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFocusTerms(text, limit = 8) {
  const counts = new Map();
  const words = text.toLowerCase().match(/[a-z]{4,}/g) || [];
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    if (CODE_STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function looksNaturalSentence(sentence) {
  const value = String(sentence || "").trim();
  if (value.length < 40 || value.length > 260) return false;
  if (URL_PATTERN.test(value)) return false;
  if (CODE_PATTERN.test(value)) return false;
  const letters = (value.match(/[a-z]/gi) || []).length;
  if (letters < 30) return false;
  const symbols = (value.match(/[^a-z0-9\s,.'"-]/gi) || []).length;
  return (symbols / value.length) <= 0.08;
}

function toNaturalCorpus(text) {
  const lines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !URL_PATTERN.test(line))
    .filter((line) => !CODE_PATTERN.test(line))
    .filter((line) => /[a-z]/i.test(line));
  return normalizeText(lines.join("\n"));
}

function extractKeySentences(text, limit = 6) {
  const candidates = normalizeText(text)
    .split(/[.!?]\s+/)
    .map((item) => item.trim())
    .filter((item) => looksNaturalSentence(item));
  return candidates.slice(0, limit);
}

function passOneExtract(materials) {
  const corpus = materials.map((item) => item.text).join("\n\n");
  const naturalCorpus = toNaturalCorpus(corpus);
  const basis = naturalCorpus || corpus;
  return {
    corpus,
    focusTerms: extractFocusTerms(basis),
    keySentences: extractKeySentences(basis)
  };
}

function passTwoBlueprint({
  courseSlug,
  unitSlug,
  sourceFiles,
  focusTerms,
  keySentences
}) {
  const fallbackTerms = ["wellbeing", "boundaries", "planning", "support"];
  const terms = focusTerms.length > 0 ? focusTerms : fallbackTerms;
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    courseSlug,
    unitSlug,
    title: titleFromSlug(unitSlug),
    focusTerms: terms.slice(0, 8),
    keySentences,
    sourceFiles,
    sections: [
      { id: "module-launch", title: "Module Launch", goal: "Context and objectives" },
      { id: "scenario-lab", title: "Scenario Lab", goal: "Practice safe decision-making" },
      { id: "priority-ranking", title: "Priority Ranking", goal: "Rank supports and actions" },
      { id: "decision-path", title: "Decision Path", goal: "Trace short and long-term outcomes" },
      { id: "action-plan", title: "Action Plan", goal: "Commit to specific next steps" }
    ]
  };
}

function passThreeDraft(blueprint) {
  const term = (index, fallback) => blueprint.focusTerms[index] || fallback;
  const sentence = (index, fallback) => blueprint.keySentences[index] || fallback;
  const title = blueprint.title || titleFromSlug(blueprint.unitSlug);

  return `## Module Launch

Welcome to **${title}**. This unit was compiled from source materials into an interactive, Brightspace-safe learning experience.

:::info
Core ideas from source:
- ${sentence(0, `Make informed choices about ${term(0, "wellbeing")} and ${term(1, "support")}.`)}
- ${sentence(1, `Build practical habits for ${term(2, "planning")} and ${term(3, "boundaries")}.`)}
:::

## Scenario Lab

:::scenario
title: Choice Simulation
description: Select a response for each prompt and review likely outcomes.
prompts:
  - id: prompt-1
    question: A peer pressures you to ignore your ${term(3, "boundaries")}. What is your best next move?
    options:
      - label: State your boundary clearly and leave the pressure moment.
        outcome: This protects your safety and reinforces self-respect.
      - label: Stay silent to avoid conflict.
        outcome: Risk increases because your needs are not communicated.
  - id: prompt-2
    question: Your stress is high and your ${term(2, "planning")} breaks down. What helps first?
    options:
      - label: Ask a trusted support person and reset your plan.
        outcome: Support plus structure improves follow-through.
      - label: Avoid the issue and hope it resolves itself.
        outcome: Delays usually make the problem harder to manage.
:::

## Priority Ranking

:::ranking
title: Rank Your Supports
instructions: Rank these from most helpful (1) to least helpful for your current week.
items:
  - Sleep and recovery routine
  - Trusted adult check-in
  - Clear daily planning
  - Positive peer accountability
:::

## Decision Path

:::decision-tree
title: Outcome Pathway
description: Follow each choice and observe the downstream effects.
nodes:
  - id: start
    prompt: You are offered a risky shortcut.
    choices:
      - label: Decline and use a safer alternative.
        next: safer
      - label: Accept to fit in.
        next: risk
  - id: safer
    prompt: You keep control of your choices and protect future options.
    end: true
  - id: risk
    prompt: Short-term approval leads to lower safety and more stress.
    end: true
:::

## Action Plan

:::workbook
title: Next-Week Commitments
description: Capture specific actions you will execute.
fields:
  - type: text
    label: One boundary you will protect this week
  - type: textarea
    label: Your plan for managing ${term(0, "wellbeing")} when stress rises
    rows: 4
  - type: checklist
    label: Supports you will use
    options:
      - Trusted adult check-in
      - Structured daily plan
      - Sleep and recovery habit
      - Peer accountability
:::
`;
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
  return { files, materials };
}

export async function compileUnitFromSource({
  repoRoot,
  sourcePath,
  courseSlug,
  unitSlug,
  extract = true
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

  const scaffold = await initUnitScaffold({
    repoRoot,
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug
  });

  const unitDir = scaffold.unitDir;
  const resourcesDir = path.join(unitDir, "resources");
  await ensureDir(resourcesDir);

  const { materials } = await collectMaterials(sourceFiles, extract);
  const passOne = passOneExtract(materials);
  const sourceFileList = sourceFiles.map((filePath) => toRelative(sourceRoot, filePath));
  const blueprint = passTwoBlueprint({
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    sourceFiles: sourceFileList,
    focusTerms: passOne.focusTerms,
    keySentences: passOne.keySentences
  });
  const contentDraft = passThreeDraft(blueprint);

  const blueprintPath = path.join(unitDir, "blueprint.json");
  const contentPath = path.join(unitDir, "content.md");
  await writeFileEnsuringDir(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);
  await writeFileEnsuringDir(contentPath, contentDraft);

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
    sourceFiles: sourceFileList,
    extractedMaterials: materials.map((entry) => toRelative(sourceRoot, entry.filePath))
  };
}
