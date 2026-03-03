import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSourceMaterial } from "../src/sourceNormalization.js";
import { classifySection } from "../src/pedagogy/classifySection.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

const normalized = normalizeSourceMaterial({
  courseSlug: "calm-course",
  unitSlug: "module-2-v2",
  title: "CALM Module 2: Resource Choices",
  sourceFiles: ["calm-module-2.txt"],
  corpus: CALM_MODULE_2_CORPUS
});

test("classifySection maps Module 2 sections to expected pedagogical intents", () => {
  const byId = new Map(normalized.sections.map((section) => [section.id, classifySection(section)]));

  assert.ok(byId.get("module-launch").intents.includes("launch"));
  assert.ok(byId.get("spending-influences").intents.includes("knowledge"));
  assert.ok(byId.get("joe-vs-sally").intents.includes("compare_contrast"));
  assert.ok(byId.get("joe-vs-sally").intents.includes("decision_making"));
  assert.ok(byId.get("budget-builder").intents.includes("budgeting"));
  assert.ok(byId.get("budget-builder").intents.includes("reflection"));
  assert.ok(byId.get("honesty-and-relationship-cases").intents.includes("ethical_reasoning"));
  assert.ok(byId.get("conflict-and-communication").intents.includes("communication_practice"));
  assert.ok(byId.get("case-studies").intents.includes("case_analysis"));
});
