import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCourseScaffold, initUnitScaffold } from "../src/scaffold.js";

test("initCourseScaffold and initUnitScaffold create expected files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-scaffold-"));
  const course = await initCourseScaffold({
    repoRoot: root,
    courseSlug: "sample-course",
    makeDefault: true
  });
  assert.equal(course.created, true);

  const unit = await initUnitScaffold({
    repoRoot: root,
    courseSlug: "sample-course",
    unitSlug: "unit-01"
  });
  assert.equal(unit.created, true);

  const courseYaml = await fs.readFile(path.join(root, "courses", "sample-course", "course.yml"), "utf8");
  const unitYaml = await fs.readFile(
    path.join(root, "courses", "sample-course", "units", "unit-01", "unit.yml"),
    "utf8"
  );
  const contentMd = await fs.readFile(
    path.join(root, "courses", "sample-course", "units", "unit-01", "content.md"),
    "utf8"
  );

  assert.match(courseYaml, /default:\s*true/);
  assert.match(courseYaml, /theme:\s*bold-clay/);
  assert.match(unitYaml, /slug:\s*unit-01/);
  assert.match(unitYaml, /template:\s*premium-core/);
  assert.match(contentMd, /Start Here/);
});

test("init scaffolds accept explicit theme and template presets", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-scaffold-"));
  await initCourseScaffold({
    repoRoot: root,
    courseSlug: "signature-course",
    title: "Signature Course",
    makeDefault: true,
    theme: "cupertino-light"
  });

  await initUnitScaffold({
    repoRoot: root,
    courseSlug: "signature-course",
    unitSlug: "unit-apple",
    title: "Unit Apple",
    template: "case-studio",
    theme: "obsidian-pro"
  });

  const courseYaml = await fs.readFile(path.join(root, "courses", "signature-course", "course.yml"), "utf8");
  const unitYaml = await fs.readFile(
    path.join(root, "courses", "signature-course", "units", "unit-apple", "unit.yml"),
    "utf8"
  );
  const contentMd = await fs.readFile(
    path.join(root, "courses", "signature-course", "units", "unit-apple", "content.md"),
    "utf8"
  );

  assert.match(courseYaml, /theme:\s*cupertino-light/);
  assert.match(unitYaml, /template:\s*case-studio/);
  assert.match(unitYaml, /theme:\s*obsidian-pro/);
  assert.match(contentMd, /Case Brief/);
});
