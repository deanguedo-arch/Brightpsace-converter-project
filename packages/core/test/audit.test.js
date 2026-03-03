import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCourseScaffold, initUnitScaffold } from "../src/scaffold.js";
import { auditUnitAgainstReference } from "../src/audit.js";

async function setupReferenceRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-audit-"));
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
      "  - launch-student-name",
      "  - collapsible-knowledge",
      "  - field-level-hints",
      "  - autosize-textareas",
      "  - teacher-export",
      "  - budget-workbook-layout",
      "  - case-study-layout",
      "weights:",
      "  visualShell: 30",
      "  interactionParity: 25",
      "  sourceCoverage: 20",
      "  learnerFlow: 15",
      "  completionFlow: 10",
      "sectionMap:",
      "  - sourceLabel: Advertising and Consumerism",
      "    targetId: spending-influences",
      "    requiredElements:",
      "      - workbook",
      "      - knowledge",
      "      - ranking",
      "  - sourceLabel: Managing your Money",
      "    targetId: budget-builder",
      "    requiredElements:",
      "      - workbook",
      "  - sourceLabel: Case Studies",
      "    targetId: review-submit",
      "    requiredElements:",
      "      - submission",
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

  return root;
}

test("auditUnitAgainstReference passes a unit with the required parity markers", async () => {
  const root = await setupReferenceRepo();
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
      "## Module Launch",
      "",
      ":::workbook",
      "title: Student Setup",
      "layout: split",
      "fields:",
      "  - type: text",
      "    id: student-name",
      "    label: Student Name",
      "  - type: textarea",
      "    id: launch-reflection",
      "    label: What are you hoping to improve?",
      "    hint: Name one decision pattern you want to change.",
      "    autosize: true",
      ":::",
      "",
      "## Spending Influences",
      "",
      ":::knowledge",
      "title: Influences in Marketing",
      "body: |",
      "  Advertising and people around you both shape spending decisions.",
      ":::",
      "",
      ":::workbook",
      "title: Spending Audit",
      "fields:",
      "  - type: textarea",
      "    label: Which influence affects you most?",
      "    hint: Think about ads, friends, habit, or convenience.",
      ":::",
      "",
      ":::ranking",
      "title: Rank the influences",
      "items:",
      "  - Advertising",
      "  - Friends",
      ":::",
      "",
      "## Budget Builder",
      "",
      ":::workbook",
      "title: Budget",
      "layout: budget-grid",
      "fields:",
      "  - type: text",
      "    label: Income from job",
      ":::",
      "",
      "## Conflict And Communication",
      "",
      ":::workbook",
      "title: Case Lab",
      "layout: case-stack",
      "fields:",
      "  - type: textarea",
      "    label: What would you say first?",
      ":::",
      "",
      "## Review Submit",
      "",
      ":::submission",
      "title: Review & Submit",
      ":::"
    ].join("\n"),
    "utf8"
  );

  const report = await auditUnitAgainstReference({
    repoRoot: root,
    courseSlug: "demo-course",
    unitSlug: "demo-unit",
    reference: "calm-canvas-clay"
  });

  assert.equal(report.passed, true);
  assert.equal(report.missingMandatory.length, 0);
  assert.ok(report.scores.overall >= 85);
});

test("auditUnitAgainstReference reports missing parity features when the unit is incomplete", async () => {
  const root = await setupReferenceRepo();
  await initCourseScaffold({ repoRoot: root, courseSlug: "demo-course" });
  await initUnitScaffold({ repoRoot: root, courseSlug: "demo-course", unitSlug: "demo-unit" });
  await fs.writeFile(
    path.join(root, "courses", "demo-course", "units", "demo-unit", "content.md"),
    [
      "## Launch",
      "",
      "Short text only."
    ].join("\n"),
    "utf8"
  );

  const report = await auditUnitAgainstReference({
    repoRoot: root,
    courseSlug: "demo-course",
    unitSlug: "demo-unit",
    reference: "calm-canvas-clay"
  });

  assert.equal(report.passed, false);
  assert.ok(report.missingMandatory.length >= 1);
  assert.ok(report.nextSlice);
});
