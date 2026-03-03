import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEditorialQuality } from "../src/editorialQuality.js";

function minimalUnit(fields = []) {
  return {
    sections: [
      {
        id: "sample",
        title: "Sample",
        blocks: [
          {
            type: "workbook",
            title: "Prompts",
            fields
          }
        ]
      }
    ]
  };
}

test("evaluateEditorialQuality enforces L3 requirement for calm module 2", () => {
  const unit = minimalUnit([
    { label: "Define conflict in your own words.", hint: "" },
    { label: "Describe one spending habit you want to improve.", hint: "" },
    { label: "Explain why this change matters.", hint: "" }
  ]);
  const report = evaluateEditorialQuality({
    unit,
    courseSlug: "calm-course",
    unitSlug: "module-2-v2"
  });

  assert.equal(report.requiredLevel, "L3");
  assert.ok(["L1", "L2", "L3"].includes(report.achievedLevel));
});

test("evaluateEditorialQuality flags orphan and duplicate prompt issues", () => {
  const unit = minimalUnit([
    { label: ":", hint: "" },
    { label: "Explain what happened.", hint: "" },
    { label: "Explain what happened.", hint: "" }
  ]);
  const report = evaluateEditorialQuality({
    unit,
    courseSlug: "demo-course",
    unitSlug: "demo-unit"
  });

  assert.equal(report.requiredLevel, "L2");
  assert.ok(report.violations.some((entry) => entry.code === "EDITORIAL_ORPHAN_TOKENS"));
  assert.ok(report.violations.some((entry) => entry.code === "EDITORIAL_DUPLICATE_PROMPTS"));
  assert.equal(report.passed, false);
});
