import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { ensureDir, listFilesRecursive, writeFileEnsuringDir } from "./fs.js";
import { slugify, titleFromSlug } from "./utils.js";
import { listCourseSlugs } from "./course.js";
import { buildExtractedMarkdownSections, extractTextByExtension } from "./extractText.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([".txt"]);
const EXTRACTABLE_EXTENSIONS = new Set([".docx", ".pdf"]);

function toRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function looksLikeContentFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension);
}

function shouldSkipResourceCopy(filePath, sourceRoot) {
  const rel = toRelative(sourceRoot, filePath).toLowerCase();
  const name = path.basename(filePath).toLowerCase();
  if (name === "course.yml" || name === "unit.yml" || name === "content.md") return true;
  if (rel === "flashcards.csv") return true;
  return false;
}

function normalizeResourceRelativePath(sourceRoot, filePath) {
  const rel = toRelative(sourceRoot, filePath);
  if (/^resources\//i.test(rel)) {
    return rel.replace(/^resources\//i, "");
  }
  return rel;
}

function createCourseConfig(courseSlug, markDefault) {
  return {
    slug: courseSlug,
    title: titleFromSlug(courseSlug),
    default: markDefault
  };
}

function createUnitConfig(unitSlug) {
  return {
    slug: unitSlug,
    title: titleFromSlug(unitSlug),
    estimatedMinutes: 20,
    objectives: [
      "Review the core concepts in this unit.",
      "Engage with activities and resources.",
      "Mark the unit complete when finished."
    ]
  };
}

export async function importUnitFromFolder({
  repoRoot,
  sourcePath,
  courseSlug,
  unitSlug,
  extract = false
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedUnitSlug = slugify(unitSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  if (!normalizedUnitSlug) throw new Error("unitSlug is required.");

  const absoluteSource = path.resolve(repoRoot, sourcePath);
  const stats = await fs.stat(absoluteSource).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Source directory not found: ${absoluteSource}`);
  }

  const existingCoursesBeforeCreate = await listCourseSlugs(repoRoot);
  const courseDir = path.join(repoRoot, "courses", normalizedCourseSlug);
  const unitsDir = path.join(courseDir, "units");
  const unitDir = path.join(unitsDir, normalizedUnitSlug);
  const resourcesDir = path.join(unitDir, "resources");
  await ensureDir(resourcesDir);

  const courseYamlPath = path.join(courseDir, "course.yml");
  const unitYamlPath = path.join(unitDir, "unit.yml");
  const contentPath = path.join(unitDir, "content.md");
  const flashcardsPath = path.join(unitDir, "flashcards.csv");

  const existingCourse = await fs.stat(courseYamlPath).catch(() => null);
  if (!existingCourse) {
    const markDefault = existingCoursesBeforeCreate.length === 0;
    await writeFileEnsuringDir(courseYamlPath, yaml.dump(createCourseConfig(normalizedCourseSlug, markDefault)));
  }

  const sourceFiles = await listFilesRecursive(absoluteSource);
  let contentFile = null;
  let fallbackTextFile = null;
  let flashcardsSource = null;
  const extractableDocs = [];

  for (const filePath of sourceFiles) {
    const fileNameLower = path.basename(filePath).toLowerCase();
    if (fileNameLower === "flashcards.csv") {
      flashcardsSource = filePath;
      continue;
    }
    if (EXTRACTABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      extractableDocs.push(filePath);
    }
    if (looksLikeContentFile(filePath)) {
      if (!contentFile && MARKDOWN_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
        contentFile = filePath;
      }
      if (!fallbackTextFile) fallbackTextFile = filePath;
    }
  }
  if (!contentFile && fallbackTextFile) {
    contentFile = fallbackTextFile;
  }

  let contentOutput = "";
  if (contentFile) {
    const contentRaw = await fs.readFile(contentFile, "utf8");
    const isMarkdown = MARKDOWN_EXTENSIONS.has(path.extname(contentFile).toLowerCase());
    contentOutput = isMarkdown
      ? contentRaw
      : `## Imported Content\n\n${contentRaw.replace(/\r\n/g, "\n")}\n`;
  } else {
    contentOutput = "## Imported Content\n\nAdd learning content here. Use `:::info` / `:::warning` / `:::example` blocks and `:::accordion` sections.\n";
  }

  const extractedDocs = [];
  if (extract && extractableDocs.length > 0) {
    for (const filePath of extractableDocs) {
      const text = await extractTextByExtension(filePath).catch(() => "");
      if (text) {
        extractedDocs.push({ filePath, text });
      }
    }
  }
  const extractedMarkdown = buildExtractedMarkdownSections(extractedDocs);
  if (extractedMarkdown) {
    contentOutput = `${contentOutput.trim()}\n\n${extractedMarkdown}`;
  }
  await writeFileEnsuringDir(contentPath, contentOutput);

  if (flashcardsSource) {
    await ensureDir(path.dirname(flashcardsPath));
    await fs.copyFile(flashcardsSource, flashcardsPath);
  }

  for (const filePath of sourceFiles) {
    if (filePath === contentFile || filePath === flashcardsSource) continue;
    if (shouldSkipResourceCopy(filePath, absoluteSource)) continue;
    const rel = normalizeResourceRelativePath(absoluteSource, filePath);
    const destination = path.join(resourcesDir, rel);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(filePath, destination);
  }

  await writeFileEnsuringDir(unitYamlPath, yaml.dump(createUnitConfig(normalizedUnitSlug)));

  return {
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    unitDir,
    extractedDocs: extractedDocs.map((item) => toRelative(absoluteSource, item.filePath))
  };
}
