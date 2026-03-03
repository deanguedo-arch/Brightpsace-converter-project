import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCourseScaffold, initUnitScaffold } from "../src/scaffold.js";
import { createReferenceCompareWorkspace } from "../src/compare.js";

test("createReferenceCompareWorkspace builds a self-contained compare page", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-compare-"));
  const referenceDir = path.join(root, "references", "calm-canvas-clay");
  const exampleDir = path.join(root, "EXAMPLES");
  await fs.mkdir(referenceDir, { recursive: true });
  await fs.mkdir(exampleDir, { recursive: true });
  await fs.cp(path.join(process.cwd(), "packages", "theme"), path.join(root, "packages", "theme"), { recursive: true });

  await fs.writeFile(
    path.join(referenceDir, "reference.yml"),
    [
      "id: calm-canvas-clay",
      "title: CALM Workbook Clay Reference",
      "referenceFile: EXAMPLES/calmmodule1.md",
      "targetTheme: clay-workbook",
      "targetTemplate: guided-workbook",
      "mandatoryFeatures:",
      "  - teacher-export",
      "weights:",
      "  visualShell: 30",
      "  interactionParity: 25",
      "  sourceCoverage: 20",
      "  learnerFlow: 15",
      "  completionFlow: 10",
      "sectionMap: []",
      "threshold:",
      "  overall: 85",
      "  visualShell: 24",
      "  interactionParity: 18",
      "  sourceCoverage: 16",
      "  learnerFlow: 12",
      "  completionFlow: 8"
    ].join("\n"),
    "utf8"
  );
  await fs.writeFile(path.join(exampleDir, "calmmodule1.md"), "<!doctype html><title>Reference</title>", "utf8");

  await initCourseScaffold({ repoRoot: root, courseSlug: "demo-course" });
  await initUnitScaffold({
    repoRoot: root,
    courseSlug: "demo-course",
    unitSlug: "demo-unit",
    template: "guided-workbook",
    theme: "clay-workbook"
  });
  await fs.writeFile(
    path.join(root, "courses", "demo-course", "units", "demo-unit", "content.md"),
    [
      "## Launch",
      "",
      ":::workbook",
      "title: Start",
      "fields:",
      "  - type: text",
      "    id: student-name",
      "    label: Student Name",
      ":::",
      "",
      "## Review",
      "",
      ":::submission",
      ":::"
    ].join("\n"),
    "utf8"
  );

  const result = await createReferenceCompareWorkspace({
    repoRoot: root,
    courseSlug: "demo-course",
    unitSlug: "demo-unit",
    reference: "calm-canvas-clay"
  });

  const compareHtml = await fs.readFile(result.compareHtmlPath, "utf8");
  assert.equal(await fs.stat(result.compareHtmlPath).then((stats) => stats.isFile()), true);
  assert.equal(await fs.stat(result.referenceHtmlPath).then((stats) => stats.isFile()), true);
  assert.equal(await fs.stat(path.join(result.generatedDir, "index.html")).then((stats) => stats.isFile()), true);
  assert.match(compareHtml, /reference\.html/);
  assert.match(compareHtml, /generated\/index\.html/);
});
