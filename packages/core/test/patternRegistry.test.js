import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSourceMaterial } from "../src/sourceNormalization.js";
import { selectPatternForSection } from "../src/patterns/registry.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

const normalized = normalizeSourceMaterial({
  courseSlug: "calm-course",
  unitSlug: "module-2-v2",
  title: "CALM Module 2: Resource Choices",
  sourceFiles: ["calm-module-2.txt"],
  corpus: CALM_MODULE_2_CORPUS
});

test("selectPatternForSection chooses the planned Module 2 patterns", () => {
  const expected = {
    "module-launch": "launch-frame",
    "spending-influences": "knowledge-atlas",
    "joe-vs-sally": "decision-pathway",
    "budget-builder": "mini-simulator",
    "honesty-and-relationship-cases": "scenario-judge",
    "conflict-and-communication": "premium-stacked-workbook",
    "case-studies": "case-workspace",
    "review-submit": "premium-stacked-workbook"
  };

  normalized.sections.forEach((section) => {
    const decision = selectPatternForSection(section);
    assert.equal(decision.patternId, expected[section.id], section.id);
    assert.ok(Array.isArray(decision.reasons) && decision.reasons.length > 0);
    assert.ok(decision.sourceCoverageScore > 0.8);
  });
});

test("selectPatternForSection falls back when a rich pattern is not justified", () => {
  const decision = selectPatternForSection({
    id: "reflection-only",
    sourceTitle: "Reflection",
    normalizedTitle: "Reflection",
    order: 1,
    blocks: [
      {
        type: "reflection",
        prompts: ["What did you learn?"]
      }
    ]
  });

  assert.equal(decision.patternId, "premium-stacked-workbook");
  assert.ok(decision.reasons.some((reason) => /fallback|confidence|coverage/i.test(reason)));
});
