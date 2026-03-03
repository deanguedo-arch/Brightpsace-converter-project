import { createHash } from "node:crypto";
import { getRenderPolicy } from "./renderTargets.js";
import { getDesignPolicyConfig } from "./designPolicy.js";
import { renderSectionWithPattern } from "./patterns/registry.js";

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

export function renderGuidedUnit({
  normalizedUnit,
  target = "brightspace-embed",
  designOverrides = {}
}) {
  const policy = getRenderPolicy(target);
  const designPolicy = getDesignPolicyConfig();
  const parts = [];
  const patternDecisions = [];
  let blockCount = 0;
  let coveredBlocks = 0;
  const overridesApplied = [];

  for (const section of normalizedUnit.sections || []) {
    const { decision, body } = renderSectionWithPattern(section, {
      policy,
      designOverrides
    });
    patternDecisions.push(decision);
    if (decision.override) {
      overridesApplied.push({
        sectionId: section.id,
        forcePatternId: decision.override.forcePatternId,
        reason: decision.override.reason,
        source: decision.override.source || "design-overrides.json",
        expiresOn: decision.override.expiresOn || ""
      });
    }
    parts.push(`## ${section.normalizedTitle}`);
    parts.push("");
    parts.push(body.trim());
    parts.push("");
    blockCount += Array.isArray(section.blocks) ? section.blocks.length : 0;
    coveredBlocks += Math.round((decision.sourceCoverageScore || 0) * (Array.isArray(section.blocks) ? section.blocks.length : 0));
  }

  const content = parts.join("\n").trim() + "\n";
  const inputHash = sha256(stableStringify({
    target: policy.target,
    normalizedUnit,
    designPolicyVersion: designPolicy.version,
    designOverrides
  }));
  const contentHash = sha256(content);

  return {
    target: policy.target,
    content,
    patternDecisions,
    sourceCoverage: {
      sectionsCovered: normalizedUnit.sections?.length ? 1 : 0,
      blocksCovered: blockCount > 0 ? coveredBlocks / blockCount : 0
    },
    designPolicyVersion: designPolicy.version,
    governancePrecedence: designPolicy.precedence,
    overridesApplied,
    fingerprints: {
      inputHash,
      contentHash
    }
  };
}
