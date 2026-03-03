import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

function normalizeReferenceValue(value) {
  return String(value || "").trim();
}

function resolveReferenceManifestPath(repoRoot, reference) {
  const raw = normalizeReferenceValue(reference);
  if (!raw) {
    throw new Error("A reference profile or manifest path is required.");
  }

  const directPath = path.isAbsolute(raw) ? raw : path.join(repoRoot, raw);
  if (/\.(ya?ml)$/i.test(raw)) {
    return directPath;
  }

  return path.join(repoRoot, "references", raw, "reference.yml");
}

function normalizeProfile(rawProfile, manifestPath, repoRoot) {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const id = String(profile.id || path.basename(path.dirname(manifestPath))).trim();
  if (!id) {
    throw new Error(`Reference profile at "${manifestPath}" is missing an id.`);
  }

  const referenceFileRaw = String(profile.referenceFile || "").trim();
  if (!referenceFileRaw) {
    throw new Error(`Reference profile "${id}" is missing referenceFile.`);
  }

  const referenceFilePath = path.isAbsolute(referenceFileRaw)
    ? referenceFileRaw
    : path.join(repoRoot, referenceFileRaw);

  return {
    id,
    title: String(profile.title || id).trim() || id,
    manifestPath,
    referenceFile: referenceFileRaw,
    referenceFilePath,
    targetTheme: String(profile.targetTheme || "").trim(),
    targetTemplate: String(profile.targetTemplate || "").trim(),
    mandatoryFeatures: Array.isArray(profile.mandatoryFeatures)
      ? profile.mandatoryFeatures.map((value) => String(value).trim()).filter(Boolean)
      : [],
    weights: {
      visualShell: Number(profile.weights?.visualShell || 0),
      interactionParity: Number(profile.weights?.interactionParity || 0),
      sourceCoverage: Number(profile.weights?.sourceCoverage || 0),
      learnerFlow: Number(profile.weights?.learnerFlow || 0),
      completionFlow: Number(profile.weights?.completionFlow || 0)
    },
    sectionMap: Array.isArray(profile.sectionMap)
      ? profile.sectionMap.map((entry) => ({
          sourceLabel: String(entry?.sourceLabel || "").trim(),
          targetId: String(entry?.targetId || "").trim(),
          requiredElements: Array.isArray(entry?.requiredElements)
            ? entry.requiredElements.map((value) => String(value).trim()).filter(Boolean)
            : []
        }))
      : [],
    threshold: {
      overall: Number(profile.threshold?.overall || 0),
      visualShell: Number(profile.threshold?.visualShell || 0),
      interactionParity: Number(profile.threshold?.interactionParity || 0),
      sourceCoverage: Number(profile.threshold?.sourceCoverage || 0),
      learnerFlow: Number(profile.threshold?.learnerFlow || 0),
      completionFlow: Number(profile.threshold?.completionFlow || 0)
    }
  };
}

export async function loadReferenceProfile(repoRoot, reference) {
  const manifestPath = resolveReferenceManifestPath(repoRoot, reference);
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = yaml.load(raw);
  const profile = normalizeProfile(parsed, manifestPath, repoRoot);

  const referenceStats = await fs.stat(profile.referenceFilePath).catch(() => null);
  if (!referenceStats?.isFile()) {
    throw new Error(
      `Reference file not found for profile "${profile.id}": ${profile.referenceFilePath}`
    );
  }

  return profile;
}
