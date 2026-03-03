import test from "node:test";
import assert from "node:assert/strict";
import { evaluateVisualQuality } from "../src/visualQuality.js";

test("evaluateVisualQuality enforces L4 for calm module 2", () => {
  const unit = {
    sections: [
      {
        id: "spending-influences",
        blocks: [
          {
            type: "knowledge",
            bodyHtml: "<p>This is a dense narrative paragraph without readable spacing controls that keeps running for too long and does not break into shorter chunks for scannability in the learner view.</p>"
          }
        ]
      }
    ]
  };
  const css = ".knowledge__content ul { margin: 0; }";

  const result = evaluateVisualQuality({
    unit,
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    componentsCss: css
  });

  assert.equal(result.requiredLevel, "L4");
  assert.equal(result.passed, false);
  assert.ok(result.violations.some((violation) => violation.code === "VISUAL_LEVEL_NOT_MET"));
});

test("evaluateVisualQuality passes when L4 visual rules are satisfied", () => {
  const unit = {
    sections: [
      {
        id: "spending-influences",
        blocks: [
          {
            type: "knowledge",
            bodyHtml: [
              "<p>Marketing choices are shaped by family habits and social context.</p>",
              "<p>Good purchasing decisions come from comparing options, prices, and timing.</p>",
              "<ul><li>Check the total cost.</li><li>Confirm return terms.</li></ul>"
            ].join("")
          }
        ]
      }
    ]
  };
  const css = `
    .knowledge__content { max-width: 75ch; }
    .knowledge__content p + p { margin-top: 0.82rem; }
    .knowledge__content ul { padding-left: 1.28rem; }
    .knowledge__content li + li { margin-top: 0.1rem; }
  `;

  const result = evaluateVisualQuality({
    unit,
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    componentsCss: css
  });

  assert.equal(result.requiredLevel, "L4");
  assert.equal(result.achievedLevel, "L4");
  assert.equal(result.passed, true);
});

