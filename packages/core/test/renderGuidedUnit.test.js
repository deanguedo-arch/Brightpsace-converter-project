import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSourceMaterial } from "../src/sourceNormalization.js";
import { renderGuidedUnit } from "../src/renderGuidedUnit.js";
import { DESIGN_POLICY_PRECEDENCE, DESIGN_POLICY_VERSION } from "../src/designPolicy.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("renderGuidedUnit emits the planned pattern decisions and preserves key Module 2 source text", async () => {
  const normalized = normalizeSourceMaterial({
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    title: "CALM Module 2: Resource Choices",
    sourceFiles: ["calm-module-2.txt"],
    corpus: CALM_MODULE_2_CORPUS
  });

  const rendered = renderGuidedUnit({
    normalizedUnit: normalized,
    target: "brightspace-embed"
  });

  assert.match(rendered.content, /:::simulator/);
  assert.match(rendered.content, /Joe gets a job as a clerk at Wal-Mart/i);
  assert.match(rendered.content, /The Influences of Significant others/i);
  assert.match(rendered.content, /Gertrude sees her friend Ethyl tagging the wall/i);
  assert.match(rendered.content, /What if Leticia told Maya that her boyfriend said he would dump her if she didn't lose weight/i);
  assert.match(rendered.content, /title:\s+Student Setup[\s\S]*layout:\s+stack/i);
  assert.match(rendered.content, /title:\s+Recent Purchases[\s\S]*layout:\s+paired-rows/i);
  assert.match(rendered.content, /title:\s+"The Price of Cool: Joe vs\. Sally"/i);
  assert.match(rendered.content, /#### Joe[\s\S]*#### Sally/i);
  assert.match(rendered.content, /#### 1\. Ask yourself before buying[\s\S]*#### 5\. Know a store's return\/exchange\/refund policy/i);
  assert.match(rendered.content, /description:\s+"People in healthy relationships:"/i);
  assert.doesNotMatch(rendered.content, /:::ranking/);
  assert.doesNotMatch(rendered.content, /:::decision-tree/);
  assert.doesNotMatch(rendered.content, /:::scenario[\s\S]*title:\s+Honesty Quiz/i);
  assert.doesNotMatch(rendered.content, /Item purchased or item you are considering/i);
  assert.doesNotMatch(rendered.content, /^\s*and\s*$/m);
  assert.doesNotMatch(rendered.content, /^\s*:\s*$/m);

  const budgetDecision = rendered.patternDecisions.find((entry) => entry.sectionId === "budget-builder");
  assert.equal(budgetDecision.patternId, "mini-simulator");
  assert.equal(rendered.target, "brightspace-embed");
  assert.equal(rendered.sourceCoverage.sectionsCovered, 1);
  assert.ok(rendered.sourceCoverage.blocksCovered > 0.95);
  assert.equal(rendered.designPolicyVersion, DESIGN_POLICY_VERSION);
  assert.deepEqual(rendered.governancePrecedence, DESIGN_POLICY_PRECEDENCE);
  assert.match(rendered.fingerprints.inputHash, /^[a-f0-9]{64}$/);
  assert.match(rendered.fingerprints.contentHash, /^[a-f0-9]{64}$/);
  const golden = JSON.parse(await fs.readFile(path.join(__dirname, "fixtures", "module2Golden.json"), "utf8"));
  assert.equal(rendered.fingerprints.inputHash, golden.inputHash);
  assert.equal(rendered.fingerprints.contentHash, golden.contentHash);

  const rerendered = renderGuidedUnit({
    normalizedUnit: normalized,
    target: "brightspace-embed"
  });
  assert.equal(rerendered.fingerprints.inputHash, rendered.fingerprints.inputHash);
  assert.equal(rerendered.fingerprints.contentHash, rendered.fingerprints.contentHash);
});
