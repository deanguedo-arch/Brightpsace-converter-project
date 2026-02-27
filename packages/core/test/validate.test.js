import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseMarkdownToUnitBlocks } from "../src/markdown.js";
import { renderUnitToPreview } from "../src/renderUnit.js";
import { validateBrightspaceBuild } from "../src/validate.js";

test("validateBrightspaceBuild passes rendered scenario classes", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-validate-"));
  const outputDir = path.join(tempRoot, "preview");
  const sourceDir = path.join(tempRoot, "unit");
  await fs.mkdir(sourceDir, { recursive: true });

  const parsed = parseMarkdownToUnitBlocks(`
## Activities

:::scenario
title: Scenario
prompts:
  - question: Prompt
    options:
      - label: Option A
        outcome: Outcome A
:::
`);

  await renderUnitToPreview({
    repoRoot: path.resolve(process.cwd()),
    outputDir,
    unit: {
      courseSlug: "demo-course",
      unitSlug: "demo-unit",
      sourceDir,
      title: "Demo Unit",
      subtitle: "",
      estimatedMinutes: 10,
      objectives: [],
      sections: parsed.sections,
      nav: parsed.nav,
      resources: [],
      flashcards: []
    }
  });

  const validation = await validateBrightspaceBuild({
    buildDir: outputDir,
    externalAllowlist: []
  });

  const scenarioClassErrors = validation.errors.filter((error) => error.includes("scenario__outcome"));
  assert.equal(scenarioClassErrors.length, 0);
});
