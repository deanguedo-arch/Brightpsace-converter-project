import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { ensureDir, writeFileEnsuringDir } from "./fs.js";
import { listCourseSlugs } from "./course.js";
import { slugify, titleFromSlug } from "./utils.js";

function createCourseConfig({ slug, title, makeDefault }) {
  return {
    slug,
    title: title || titleFromSlug(slug),
    default: Boolean(makeDefault)
  };
}

function createUnitConfig({ slug, title }) {
  return {
    slug,
    title: title || titleFromSlug(slug),
    estimatedMinutes: 20,
    objectives: [
      "Review the core ideas in this unit.",
      "Complete interactive activities and resources.",
      "Mark complete after practice."
    ]
  };
}

function createUnitContentTemplate(unitTitle) {
  return `## Start Here

Welcome to ${unitTitle}. Replace this text with your unit introduction.

:::info
Add context that helps learners understand why this unit matters.
:::

## Core Content

Use markdown for narrative content and directives for callouts, accordions, and workbook fields.

:::accordion
- Prompt 1: Add the first expandable content block.
- Prompt 2: Add the second expandable content block.
:::

:::workbook
title: Quick Practice
description: Capture short answers before moving on.
fields:
  - type: text
    label: What is one decision you will make differently this week?
  - type: radio
    label: Confidence level
    options:
      - Low
      - Medium
      - High
:::

## Reflection

Add a short reflection, checklist, or action prompt for the learner.
`;
}

export async function initCourseScaffold({
  repoRoot,
  courseSlug,
  title = "",
  makeDefault = false
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");

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
    yaml.dump(createCourseConfig({ slug: normalizedCourseSlug, title, makeDefault: shouldBeDefault }))
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
  title = ""
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedUnitSlug = slugify(unitSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  if (!normalizedUnitSlug) throw new Error("unitSlug is required.");

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
      yaml.dump(createUnitConfig({ slug: normalizedUnitSlug, title }))
    );
  }

  const contentExists = await fs.stat(contentPath).catch(() => null);
  if (!contentExists) {
    const unitTitle = title || titleFromSlug(normalizedUnitSlug);
    await writeFileEnsuringDir(contentPath, createUnitContentTemplate(unitTitle));
  }

  return {
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    unitDir,
    created: !unitExists
  };
}
