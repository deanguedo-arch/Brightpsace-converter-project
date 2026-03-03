import fs from "node:fs/promises";
import path from "node:path";
import { isPatternId } from "./sourceTypes.js";

export const DESIGN_POLICY_VERSION = "1.0.0";
export const DESIGN_POLICY_PRECEDENCE = [
  "fidelity",
  "sanitation",
  "pedagogy",
  "layout",
  "visual"
];

const DEFAULT_THRESHOLDS = {
  minimumCoverage: 0.8,
  minimumConfidence: 0.34,
  fallbackPatternId: "premium-stacked-workbook"
};

function parseDateOnly(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getDesignPolicyConfig() {
  return {
    version: DESIGN_POLICY_VERSION,
    precedence: [...DESIGN_POLICY_PRECEDENCE],
    thresholds: { ...DEFAULT_THRESHOLDS }
  };
}

function normalizeOverride(sectionId, rawOverride, warnings, now) {
  if (!rawOverride || typeof rawOverride !== "object" || Array.isArray(rawOverride)) {
    warnings.push(`Override for section "${sectionId}" was ignored because it was not an object.`);
    return null;
  }

  const forcePatternId = String(rawOverride.forcePatternId || "").trim();
  if (!isPatternId(forcePatternId)) {
    warnings.push(`Override for section "${sectionId}" was ignored because invalid forcePatternId was provided.`);
    return null;
  }

  const reason = String(rawOverride.reason || "").trim();
  if (!reason) {
    warnings.push(`Override for section "${sectionId}" was ignored because reason is required.`);
    return null;
  }

  const expiresOn = rawOverride.expiresOn ? parseDateOnly(rawOverride.expiresOn) : null;
  if (rawOverride.expiresOn && !expiresOn) {
    warnings.push(`Override for section "${sectionId}" was ignored because expiresOn is not a valid date.`);
    return null;
  }
  if (expiresOn && expiresOn.getTime() < now.getTime()) {
    warnings.push(`Override for section "${sectionId}" was ignored because it has expired.`);
    return null;
  }

  return {
    forcePatternId,
    reason,
    expiresOn: rawOverride.expiresOn ? String(rawOverride.expiresOn) : "",
    source: "design-overrides.json"
  };
}

export async function loadDesignOverrides({ unitDir, now = new Date() }) {
  const filePath = path.join(unitDir, "design-overrides.json");
  const raw = await fs.readFile(filePath, "utf8").catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });

  if (raw === null) {
    return {
      exists: false,
      filePath,
      policyVersion: "",
      overrides: {},
      warnings: []
    };
  }

  const warnings = [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      exists: true,
      filePath,
      policyVersion: "",
      overrides: {},
      warnings: ["design-overrides.json is not valid JSON."]
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      exists: true,
      filePath,
      policyVersion: "",
      overrides: {},
      warnings: ["design-overrides.json must contain a top-level object."]
    };
  }

  const sections = parsed.sections && typeof parsed.sections === "object" && !Array.isArray(parsed.sections)
    ? parsed.sections
    : {};
  const overrides = {};

  Object.entries(sections).forEach(([sectionId, rawOverride]) => {
    const normalized = normalizeOverride(sectionId, rawOverride, warnings, now);
    if (normalized) overrides[sectionId] = normalized;
  });

  return {
    exists: true,
    filePath,
    policyVersion: String(parsed.policyVersion || "").trim(),
    overrides,
    warnings
  };
}

export function resolveSectionOverride(overrides, sectionId) {
  if (!overrides || typeof overrides !== "object") return null;
  const sectionKey = String(sectionId || "").trim();
  if (!sectionKey) return null;
  return overrides[sectionKey] || null;
}
