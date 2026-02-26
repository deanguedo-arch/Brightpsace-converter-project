import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

function getCoursesDir(repoRoot) {
  return path.join(repoRoot, "courses");
}

export function getCourseDir(repoRoot, courseSlug) {
  return path.join(getCoursesDir(repoRoot), courseSlug);
}

export function getUnitDir(repoRoot, courseSlug, unitSlug) {
  return path.join(getCourseDir(repoRoot, courseSlug), "units", unitSlug);
}

export async function listCourseSlugs(repoRoot) {
  const coursesDir = getCoursesDir(repoRoot);
  try {
    const entries = await fs.readdir(coursesDir, { withFileTypes: true });
    const courseSlugs = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const configPath = path.join(coursesDir, entry.name, "course.yml");
      const hasConfig = await fs.stat(configPath).then(() => true).catch(() => false);
      if (hasConfig) courseSlugs.push(entry.name);
    }
    return courseSlugs;
  } catch {
    return [];
  }
}

export async function readCourseConfig(repoRoot, courseSlug) {
  const filePath = path.join(getCourseDir(repoRoot, courseSlug), "course.yml");
  const raw = await fs.readFile(filePath, "utf8");
  return yaml.load(raw) || {};
}

export async function resolveDefaultCourseSlug(repoRoot) {
  const courseSlugs = await listCourseSlugs(repoRoot);
  if (courseSlugs.length === 0) {
    throw new Error("No courses found in /courses.");
  }

  let defaultSlug = null;
  for (const courseSlug of courseSlugs) {
    const config = await readCourseConfig(repoRoot, courseSlug);
    if (config?.default === true) {
      if (defaultSlug) {
        throw new Error(
          `Multiple default courses detected: "${defaultSlug}" and "${courseSlug}". Keep only one default: true.`
        );
      }
      defaultSlug = courseSlug;
    }
  }

  if (!defaultSlug) {
    throw new Error("No default course found. Set default: true in one course.yml.");
  }
  return defaultSlug;
}

export async function listUnitSlugs(repoRoot, courseSlug) {
  const unitsDir = path.join(getCourseDir(repoRoot, courseSlug), "units");
  try {
    const entries = await fs.readdir(unitsDir, { withFileTypes: true });
    const unitSlugs = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const configPath = path.join(unitsDir, entry.name, "unit.yml");
      const hasConfig = await fs.stat(configPath).then(() => true).catch(() => false);
      if (hasConfig) unitSlugs.push(entry.name);
    }
    return unitSlugs;
  } catch {
    return [];
  }
}
