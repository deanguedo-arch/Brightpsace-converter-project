import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseMarkdownToUnitBlocks } from "../src/markdown.js";
import { renderUnitToPreview } from "../src/renderUnit.js";

test("renderUnitToPreview includes workbook blocks with interactive field markers", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-render-"));
  const outputDir = path.join(tempRoot, "preview");
  const sourceDir = path.join(tempRoot, "unit");
  await fs.mkdir(sourceDir, { recursive: true });

  const parsed = parseMarkdownToUnitBlocks(`
## Practice

:::workbook
title: Reflection
fields:
  - type: text
    id: one
    label: First prompt
  - type: radio
    id: two
    label: Risk level
    options:
      - Low
      - High
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

  const html = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  assert.match(html, /data-workbook/);
  assert.match(html, /data-workbook-field/);
  assert.match(html, /Reflection/);
});

test("renderUnitToPreview includes scenario, ranking, and decision-tree blocks", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-render-"));
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
      - label: A
        outcome: Outcome A
:::

:::ranking
title: Ranking
items:
  - One
  - Two
:::

:::decision-tree
title: Decision
nodes:
  - id: start
    prompt: Start
    choices:
      - label: Next
        next: end
  - id: end
    prompt: End
    end: true
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

  const html = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  assert.match(html, /data-scenario/);
  assert.match(html, /data-ranking/);
  assert.match(html, /data-decision-tree/);
});

test("renderUnitToPreview includes learning dashboard hooks", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-render-"));
  const outputDir = path.join(tempRoot, "preview");
  const sourceDir = path.join(tempRoot, "unit");
  await fs.mkdir(sourceDir, { recursive: true });

  const parsed = parseMarkdownToUnitBlocks(`
## Practice

:::workbook
title: Reflection
fields:
  - type: text
    id: one
    label: First prompt
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

  const html = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  assert.match(html, /id="progress-dashboard"/);
  assert.match(html, /data-learning-dashboard/);
  assert.match(html, /data-dashboard-workbook/);
  assert.match(html, /data-dashboard-fill/);
});

test("renderUnitToPreview includes section stage controls for paced navigation", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-render-"));
  const outputDir = path.join(tempRoot, "preview");
  const sourceDir = path.join(tempRoot, "unit");
  await fs.mkdir(sourceDir, { recursive: true });

  const parsed = parseMarkdownToUnitBlocks(`
## Topic A
Alpha

## Topic B
Beta
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

  const html = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  assert.match(html, /data-section-stage/);
  assert.match(html, /data-stage-title/);
  assert.match(html, /data-stage-prev/);
  assert.match(html, /data-stage-next/);
  assert.match(html, /data-stepper-list/);
  assert.match(html, /data-stepper-item/);
  assert.match(html, /data-stepper-target="topic-a"/);
  assert.match(html, /data-stepper-target="topic-b"/);
  assert.match(html, /data-section-role="core"/);
  assert.match(html, /data-section-index="1"/);
  assert.match(html, /data-section-tone="tone-1"/);
  assert.match(html, /data-section-icon=/);
});
