import test from "node:test";
import assert from "node:assert/strict";
import { scoreUnitQuality } from "../src/score.js";

function makeUnit(overrides = {}) {
  return {
    courseSlug: "demo-course",
    unitSlug: "demo-unit",
    title: "Demo Unit",
    objectives: ["One", "Two", "Three"],
    sections: [
      {
        id: "intro",
        title: "Intro",
        blocks: [
          { type: "subheading", id: "intro-topic", title: "Topic" },
          { type: "callout", kind: "info" },
          { type: "markdown", html: "<p>Welcome.</p>" },
          { type: "workbook", fields: [{ kind: "text" }, { kind: "textarea" }] }
        ]
      },
      {
        id: "practice",
        title: "Practice",
        blocks: [
          { type: "scenario", prompts: [{}, {}] },
          { type: "ranking", items: [{}, {}, {}] },
          { type: "decision-tree", nodes: [{}, {}, {}] }
        ]
      },
      {
        id: "apply",
        title: "Apply",
        blocks: [{ type: "accordion", items: [{}, {}] }]
      },
      {
        id: "reflect",
        title: "Reflect",
        blocks: [{ type: "markdown", html: "<p>Reflect.</p>" }]
      }
    ],
    resources: [{ id: "r1", kind: "pdf" }],
    flashcards: [{ id: "f1" }, { id: "f2" }, { id: "f3" }, { id: "f4" }, { id: "f5" }, { id: "f6" }],
    ...overrides
  };
}

test("scoreUnitQuality returns ship-ready verdict for strong unit", () => {
  const unit = makeUnit();
  const result = scoreUnitQuality({
    unit,
    html: `
      <h1 class="unit-header">Title</h1>
      <main>
        <h2>Section</h2>
        <label for="x">Prompt</label>
        <input id="x" aria-label="Prompt input">
        <div class="sticky-nav card workbook flashcards scenario ranking decision-tree"></div>
      </main>
    `,
    validation: { errors: [], warnings: [] }
  });

  assert.equal(result.verdict, "Ship Ready");
  assert.ok(result.overall >= 4);
  assert.ok(result.dimensions.productionSafety.score >= 4);
});

test("scoreUnitQuality fails with not-ready verdict when production or interaction quality is low", () => {
  const unit = makeUnit({
    objectives: [],
    sections: [{ id: "one", title: "Only", blocks: [{ type: "markdown", html: "<p>Text only.</p>" }] }],
    flashcards: []
  });
  const result = scoreUnitQuality({
    unit,
    html: "<main><section data-section></section></main>",
    validation: { errors: ["index.html: external URL not allowed"], warnings: [] }
  });

  assert.equal(result.verdict, "Not Ready");
  assert.ok(result.overall < 4);
  assert.ok(result.dimensions.productionSafety.score < 3);
  assert.ok(result.dimensions.activityRichness.score < 3);
});
