import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { ensureDir, writeFileEnsuringDir } from "./fs.js";
import { listCourseSlugs } from "./course.js";
import { slugify, titleFromSlug } from "./utils.js";
import {
  buildTemplateContent,
  resolveTemplatePreset,
  resolveThemePreset
} from "./presets.js";

function createCourseConfig({ slug, title, makeDefault, theme }) {
  const resolvedTheme = resolveThemePreset(theme);
  return {
    slug,
    title: title || titleFromSlug(slug),
    default: Boolean(makeDefault),
    theme: resolvedTheme.slug
  };
}

function createUnitConfig({ slug, title, template, theme }) {
  const resolvedTemplate = resolveTemplatePreset(template);
  const resolvedTheme = theme ? resolveThemePreset(theme) : null;
  return {
    slug,
    title: title || titleFromSlug(slug),
    estimatedMinutes: 20,
    template: resolvedTemplate.slug,
    ...(resolvedTheme ? { theme: resolvedTheme.slug } : {}),
    objectives: [
      "Review the core ideas in this unit.",
      "Complete interactive activities and resources.",
      "Mark complete after practice."
    ]
  };
}

function createUnitContentTemplate(unitTitle, template) {
  return buildTemplateContent(template, unitTitle);
}

export async function initCourseScaffold({
  repoRoot,
  courseSlug,
  title = "",
  makeDefault = false,
  theme = ""
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  const resolvedTheme = resolveThemePreset(theme);

  const existingCourseSlugs = await listCourseSlugs(repoRoot);
  const shouldBeDefault = makeDefault || existingCourseSlugs.length === 0;

  const courseDir = path.join(repoRoot, "courses", normalizedCourseSlug);
  const unitsDir = path.join(courseDir, "units");
  const courseConfigPath = path.join(courseDir, "course.yml");

  await ensureDir(unitsDir);
  const existingConfig = await fs.stat(courseConfigPath).catch(() => null);
  if (existingConfig) {
    return {
      courseSlug: normalizedCourseSlug,
      courseDir,
      created: false
    };
  }

  await writeFileEnsuringDir(
    courseConfigPath,
    yaml.dump(
      createCourseConfig({
        slug: normalizedCourseSlug,
        title,
        makeDefault: shouldBeDefault,
        theme: resolvedTheme.slug
      })
    )
  );

  return {
    courseSlug: normalizedCourseSlug,
    courseDir,
    created: true
  };
}

export async function initUnitScaffold({
  repoRoot,
  courseSlug,
  unitSlug,
  title = "",
  template = "",
  theme = ""
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedUnitSlug = slugify(unitSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  if (!normalizedUnitSlug) throw new Error("unitSlug is required.");
  const resolvedTemplate = resolveTemplatePreset(template);
  const resolvedTheme = theme ? resolveThemePreset(theme) : null;

  const courseInit = await initCourseScaffold({
    repoRoot,
    courseSlug: normalizedCourseSlug
  });
  const unitDir = path.join(courseInit.courseDir, "units", normalizedUnitSlug);
  const resourcesDir = path.join(unitDir, "resources");
  const unitConfigPath = path.join(unitDir, "unit.yml");
  const contentPath = path.join(unitDir, "content.md");

  await ensureDir(resourcesDir);

  const unitExists = await fs.stat(unitConfigPath).catch(() => null);
  if (!unitExists) {
    await writeFileEnsuringDir(
      unitConfigPath,
      yaml.dump(
        createUnitConfig({
          slug: normalizedUnitSlug,
          title,
          template: resolvedTemplate.slug,
          theme: resolvedTheme?.slug || ""
        })
      )
    );
  }

  const contentExists = await fs.stat(contentPath).catch(() => null);
  if (!contentExists) {
    const unitTitle = title || titleFromSlug(normalizedUnitSlug);
    await writeFileEnsuringDir(contentPath, createUnitContentTemplate(unitTitle, resolvedTemplate.slug));
  }

  return {
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    unitDir,
    created: !unitExists
  };
}
