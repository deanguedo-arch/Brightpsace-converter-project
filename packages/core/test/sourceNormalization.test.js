import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSourceMaterial } from "../src/sourceNormalization.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

test("normalizeSourceMaterial preserves long-form Module 2 source blocks", () => {
  const normalized = normalizeSourceMaterial({
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    title: "CALM Module 2: Resource Choices",
    sourceFiles: ["calm-module-2.txt"],
    corpus: CALM_MODULE_2_CORPUS
  });

  assert.equal(normalized.title, "CALM Module 2: Resource Choices");
  assert.deepEqual(
    normalized.sections.map((section) => section.id),
    [
      "module-launch",
      "spending-influences",
      "joe-vs-sally",
      "budget-builder",
      "honesty-and-relationship-cases",
      "conflict-and-communication",
      "case-studies",
      "review-submit"
    ]
  );

  const spending = normalized.sections.find((section) => section.id === "spending-influences");
  const knowledge = spending.blocks.find((block) => block.type === "knowledge");
  const purchaseTable = spending.blocks.find((block) => block.type === "table");
  assert.ok(knowledge);
  assert.match(knowledge.rawText, /Significant others/i);
  assert.match(knowledge.rawText, /Consumer choices are mainly determined by habit/i);
  assert.match(knowledge.rawText, /Changes in Lifestyle/i);
  assert.ok(purchaseTable);
  assert.equal(purchaseTable.rows.length, 10);

  const waiting = normalized.sections.find((section) => section.id === "joe-vs-sally");
  const joeScenario = waiting.blocks.find((block) => block.type === "scenario" && /Joe/i.test(block.title));
  const sallyScenario = waiting.blocks.find((block) => block.type === "scenario" && /Sally/i.test(block.title));
  assert.ok(joeScenario);
  assert.ok(sallyScenario);
  assert.match(joeScenario.rawText, /He has finally paid off the car loan, which cost him an extra \$6,000/i);
  assert.match(sallyScenario.rawText, /Sally has an asset of nearly \$30,000/i);

  const honesty = normalized.sections.find((section) => section.id === "honesty-and-relationship-cases");
  const honestyQuestions = honesty.blocks.find((block) => block.type === "question_set");
  assert.ok(honestyQuestions);
  assert.equal(honestyQuestions.questions.length, 7);
  assert.match(honestyQuestions.questions[1].prompt, /Gertrude/i);
  assert.match(honestyQuestions.questions[5].prompt, /Charlotte/i);

  const cases = normalized.sections.find((section) => section.id === "case-studies");
  const caseSet = cases.blocks.find((block) => block.type === "case_set");
  assert.ok(caseSet);
  assert.equal(caseSet.cases.length, 3);
  assert.match(caseSet.cases[2].title, /Maya and Leticia/i);
  assert.equal(caseSet.cases[0].questions.length, 3);
});

test("normalizeSourceMaterial anchors Joe and Sally to exact section lines instead of earlier mentions", () => {
  const normalized = normalizeSourceMaterial({
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    title: "CALM Module 2: Resource Choices",
    sourceFiles: ["calm-module-2.txt"],
    corpus: CALM_MODULE_2_CORPUS.replace(
      "This is a very positive development, and we can only hope that more teenagers will follow in the footsteps of the twenty-something and not fall into the familiar trap of buying an expensive car.",
      "This is a very positive development, and we can only hope that more teenagers will follow in the footsteps of the twenty-something and not fall into the familiar trap of buying an expensive car. Joe and Sally are two examples of different choices."
    )
  });

  const waiting = normalized.sections.find((section) => section.id === "joe-vs-sally");
  const joeScenario = waiting.blocks.find((block) => block.type === "scenario" && /Joe/i.test(block.title));
  const sallyScenario = waiting.blocks.find((block) => block.type === "scenario" && /Sally/i.test(block.title));

  assert.ok(joeScenario);
  assert.ok(sallyScenario);
  assert.equal(joeScenario.details[0], "Joe gets a job as a clerk at Wal-Mart. He's living at home and saving every last dollar so he can make the $2,000 down payment on a $20,000 Camaro with the racing scoop on the hood.");
  assert.equal(sallyScenario.details[0], "Sally also lives at home and works at the Wal-Mart checkout line a few feet away from Joe, but she didn't buy a cool car.");
  assert.doesNotMatch(joeScenario.rawText, /^\s*and\s*$/m);
  assert.doesNotMatch(sallyScenario.rawText, /^\s*:\s*$/m);
});
