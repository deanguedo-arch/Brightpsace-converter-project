import test from "node:test";
import assert from "node:assert/strict";
import { parseMarkdownToUnitBlocks } from "../src/markdown.js";

test("parses headings and directives into structured blocks", () => {
  const markdown = `
## Intro
Welcome text.

:::info
Important note.
:::

### Details
More content.

:::accordion
- First: One
- Second: Two
:::
`;

  const parsed = parseMarkdownToUnitBlocks(markdown);
  assert.equal(parsed.sections.length, 1);
  assert.equal(parsed.sections[0].title, "Intro");
  assert.ok(parsed.nav.some((item) => item.title === "Intro"));
  assert.ok(parsed.nav.some((item) => item.title === "Details"));
  assert.ok(parsed.sections[0].blocks.some((block) => block.type === "callout"));
  assert.ok(parsed.sections[0].blocks.some((block) => block.type === "accordion"));
});

test("parses workbook directive into structured interactive fields", () => {
  const markdown = `
## Practice

:::workbook
title: Quick Check
description: Complete each prompt before moving on.
fields:
  - type: text
    id: sleep-hours
    label: How much sleep helps you focus?
    placeholder: ex. 8 hours
  - type: textarea
    label: What strategy helps you reset when stressed?
    rows: 5
  - type: radio
    id: risk-level
    label: How risky is this scenario?
    options:
      - Low
      - Medium
      - High
  - type: checklist
    id: support-options
    label: Which supports help most?
    options:
      - Teacher models first
      - Written directions
      - Peer walkthrough
:::
`;

  const parsed = parseMarkdownToUnitBlocks(markdown);
  const workbook = parsed.sections[0].blocks.find((block) => block.type === "workbook");

  assert.ok(workbook);
  assert.equal(workbook.title, "Quick Check");
  assert.equal(workbook.fields.length, 4);
  assert.equal(workbook.fields[0].kind, "text");
  assert.equal(workbook.fields[1].kind, "textarea");
  assert.equal(workbook.fields[2].kind, "radio");
  assert.equal(workbook.fields[3].kind, "checklist");
  assert.deepEqual(
    workbook.fields[2].options.map((option) => option.label),
    ["Low", "Medium", "High"]
  );
});

test("parses scenario, ranking, and decision-tree directives", () => {
  const markdown = `
## Activities

:::scenario
title: Relationship Choice
prompts:
  - id: pace
    question: You feel pressured to move too quickly. What do you do?
    options:
      - label: State boundary clearly
        outcome: Builds trust and respect.
      - label: Ignore your discomfort
        outcome: Increases stress and risk.
:::

:::ranking
title: Support Priority
instructions: Rank supports from most to least helpful right now.
items:
  - Talk to a trusted adult
  - Ask teacher for clarity
  - Build a sleep routine
:::

:::decision-tree
title: Party Decision Path
nodes:
  - id: start
    prompt: Friends offer alcohol.
    choices:
      - label: Refuse and suggest another plan
        next: safer
      - label: Accept to fit in
        next: risk
  - id: safer
    prompt: You leave with a trusted friend.
    end: true
  - id: risk
    prompt: Judgment and safety decline.
    end: true
:::
`;

  const parsed = parseMarkdownToUnitBlocks(markdown);
  const blocks = parsed.sections[0].blocks;
  const scenario = blocks.find((block) => block.type === "scenario");
  const ranking = blocks.find((block) => block.type === "ranking");
  const decisionTree = blocks.find((block) => block.type === "decision-tree");

  assert.ok(scenario);
  assert.ok(ranking);
  assert.ok(decisionTree);
  assert.equal(scenario.prompts.length, 1);
  assert.equal(ranking.items.length, 3);
  assert.equal(decisionTree.nodes.length, 3);
});
