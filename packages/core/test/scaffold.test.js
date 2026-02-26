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
  assert.match(unitYaml, /slug:\s*unit-01/);
  assert.match(contentMd, /Start Here/);
});
