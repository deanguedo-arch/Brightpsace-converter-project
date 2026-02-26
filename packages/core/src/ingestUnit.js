import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { parse as parseCsv } from "csv-parse/sync";
import { parseMarkdownToUnitBlocks } from "./markdown.js";
import { getUnitDir } from "./course.js";
import { listFilesRecursive } from "./fs.js";
import { slugify, titleFromSlug } from "./utils.js";

function parseObjectives(config) {
  if (!Array.isArray(config?.objectives)) return [];
  return config.objectives.map((item) => String(item || "").trim()).filter(Boolean);
}

function mapResource(filePath, resourcesRoot) {
  const rel = path.relative(resourcesRoot, filePath).split(path.sep).join("/");
  const ext = path.extname(filePath).toLowerCase();
  const kindMap = {
    ".pdf": "pdf",
    ".mp4": "video",
    ".mp3": "audio",
    ".wav": "audio",
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".webp": "image",
    ".svg": "image"
  };
  return {
    id: slugify(rel.replace(/\//g, "-")) || rel,
    title: path.basename(filePath),
    href: `resources/${rel}`,
    kind: kindMap[ext] || "file"
  };
}

function parseFlashcards(rawCsv) {
  const records = parseCsv(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records
    .map((record, index) => ({
      id: `card-${index + 1}`,
      front: String(record.front || "").trim(),
      back: String(record.back || "").trim(),
      tag: String(record.tag || "").trim()
    }))
    .filter((card) => card.front && card.back);
}

export async function ingestUnit(repoRoot, courseSlug, unitSlug) {
  const unitDir = getUnitDir(repoRoot, courseSlug, unitSlug);
  const unitConfigPath = path.join(unitDir, "unit.yml");
  const contentPath = path.join(unitDir, "content.md");
  const flashcardsPath = path.join(unitDir, "flashcards.csv");
  const resourcesRoot = path.join(unitDir, "resources");

  const [unitConfigRaw, contentRaw] = await Promise.all([
    fs.readFile(unitConfigPath, "utf8"),
    fs.readFile(contentPath, "utf8")
  ]);
  const unitConfig = yaml.load(unitConfigRaw) || {};
  const parsed = parseMarkdownToUnitBlocks(contentRaw);

  const flashcardsRaw = await fs.readFile(flashcardsPath, "utf8").catch(() => "");
  const flashcards = flashcardsRaw ? parseFlashcards(flashcardsRaw) : [];

  const resourcesExists = await fs.stat(resourcesRoot).catch(() => null);
  const resourceFiles = resourcesExists?.isDirectory()
    ? await listFilesRecursive(resourcesRoot)
    : [];
  const resources = resourceFiles.map((filePath) => mapResource(filePath, resourcesRoot));

  return {
    courseSlug,
    unitSlug,
    sourceDir: unitDir,
    title: String(unitConfig.title || titleFromSlug(unitSlug)),
    subtitle: String(unitConfig.subtitle || ""),
    estimatedMinutes: Number(unitConfig.estimatedMinutes || 0) || null,
    objectives: parseObjectives(unitConfig),
    sections: parsed.sections,
    nav: parsed.nav,
    resources,
    flashcards
  };
}
