import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadDesignOverrides } from "../src/designPolicy.js";
import { normalizeSourceMaterial } from "../src/sourceNormalization.js";
import { selectPatternForSection } from "../src/patterns/registry.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

test("loadDesignOverrides parses valid entries and skips expired or invalid ones", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "cf-design-overrides-"));
  await fs.writeFile(
    path.join(tmp, "design-overrides.json"),
    JSON.stringify({
      policyVersion: "1.0.0",
      sections: {
        "module-launch": {
          forcePatternId: "premium-stacked-workbook",
          reason: "Pilot parity fallback"
        },
        "spending-influences": {
          forcePatternId: "not-a-pattern",
          reason: "Invalid pattern should be skipped"
        },
        "joe-vs-sally": {
          forcePatternId: "decision-pathway",
          reason: "Expired override should be skipped",
          expiresOn: "2020-01-01"
        }
      }
    }),
    "utf8"
  );

  const loaded = await loadDesignOverrides({ unitDir: tmp });

  assert.equal(loaded.exists, true);
  assert.ok(loaded.overrides["module-launch"]);
  assert.equal(loaded.overrides["module-launch"].forcePatternId, "premium-stacked-workbook");
  assert.equal(loaded.overrides["spending-influences"], undefined);
  assert.equal(loaded.overrides["joe-vs-sally"], undefined);
  assert.ok(loaded.warnings.some((warning) => /invalid forcePatternId/i.test(warning)));
  assert.ok(loaded.warnings.some((warning) => /expired/i.test(warning)));
});

test("selectPatternForSection applies a valid section override with traceable reason", () => {
  const normalized = normalizeSourceMaterial({
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    title: "CALM Module 2: Resource Choices",
    sourceFiles: ["calm-module-2.txt"],
    corpus: CALM_MODULE_2_CORPUS
  });

  const launch = normalized.sections.find((section) => section.id === "module-launch");
  const decision = selectPatternForSection(launch, {
    designOverrides: {
      "module-launch": {
        forcePatternId: "premium-stacked-workbook",
        reason: "Pilot override for deterministic fallback",
        source: "design-overrides.json"
      }
    }
  });

  assert.equal(decision.patternId, "premium-stacked-workbook");
  assert.ok(decision.reasons.some((reason) => /override/i.test(reason)));
});
