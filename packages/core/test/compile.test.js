import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compileUnitFromSource } from "../src/compile.js";

test("compileUnitFromSource generates blueprint and interactive content draft", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-compile-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.writeFile(
    path.join(sourceDir, "notes.txt"),
    "Personal choices and wellbeing require planning, boundaries, consent, and risk awareness.",
    "utf8"
  );

  const result = await compileUnitFromSource({
    repoRoot: root,
    sourcePath: sourceDir,
    courseSlug: "compiled-course",
    unitSlug: "unit-a",
    extract: false
  });

  const contentPath = path.join(root, "courses", "compiled-course", "units", "unit-a", "content.md");
  const blueprintPath = path.join(root, "courses", "compiled-course", "units", "unit-a", "blueprint.json");
  const content = await fs.readFile(contentPath, "utf8");
  const blueprintRaw = await fs.readFile(blueprintPath, "utf8");
  const blueprint = JSON.parse(blueprintRaw);

  assert.equal(result.courseSlug, "compiled-course");
  assert.equal(result.unitSlug, "unit-a");
  assert.match(content, /:::scenario/);
  assert.match(content, /:::ranking/);
  assert.match(content, /:::decision-tree/);
  assert.match(content, /:::workbook/);
  assert.ok(Array.isArray(blueprint.focusTerms));
  assert.ok(blueprint.focusTerms.length > 0);
});

test("compileUnitFromSource accepts a single source file path", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-compile-file-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });
  const sourceFile = path.join(sourceDir, "module-notes.txt");
  await fs.writeFile(
    sourceFile,
    "Planning and consent help learners make safer personal choices.",
    "utf8"
  );

  const result = await compileUnitFromSource({
    repoRoot: root,
    sourcePath: sourceFile,
    courseSlug: "compiled-course",
    unitSlug: "unit-file-input",
    extract: false
  });

  const contentPath = path.join(root, "courses", "compiled-course", "units", "unit-file-input", "content.md");
  const resourcesPath = path.join(
    root,
    "courses",
    "compiled-course",
    "units",
    "unit-file-input",
    "resources",
    "module-notes.txt"
  );
  const content = await fs.readFile(contentPath, "utf8");

  assert.equal(result.sourceFiles.length, 1);
  assert.equal(result.sourceFiles[0], "module-notes.txt");
  assert.match(content, /:::scenario/);
  assert.match(content, /:::decision-tree/);
  assert.equal(await fs.stat(resourcesPath).then((stats) => stats.isFile()), true);
});

test("compileUnitFromSource filters code-like extracted text from launch summary", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-compile-filter-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.writeFile(
    path.join(sourceDir, "notes.txt"),
    [
      "import React, { useState } from 'react';",
      "formData.alcResources, ...formData.alcProsCons.flatMap(pc => [pc.pro, pc.con])",
      "Learners should practice consent, planning, and healthy boundaries in daily choices."
    ].join("\n"),
    "utf8"
  );

  await compileUnitFromSource({
    repoRoot: root,
    sourcePath: sourceDir,
    courseSlug: "compiled-course",
    unitSlug: "unit-filtered",
    extract: false
  });

  const contentPath = path.join(root, "courses", "compiled-course", "units", "unit-filtered", "content.md");
  const content = await fs.readFile(contentPath, "utf8");

  assert.doesNotMatch(content, /pc\.pro/i);
  assert.doesNotMatch(content, /import React/i);
  assert.match(content, /consent, planning, and healthy boundaries/i);
});
