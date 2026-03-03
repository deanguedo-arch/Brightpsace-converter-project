import { getDesignPolicyConfig } from "../designPolicy.js";

export function computeSectionCoverage(section) {
  const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
  if (blocks.length === 0) return 0;

  let covered = 0;
  for (const block of blocks) {
    if (block.type === "intro" && String(block.text || "").trim()) covered += 1;
    else if (block.type === "knowledge" && Array.isArray(block.items) && block.items.length > 0) covered += 1;
    else if (block.type === "scenario" && Array.isArray(block.details) && block.details.length > 0) covered += 1;
    else if (block.type === "question_set" && Array.isArray(block.questions) && block.questions.length > 0) covered += 1;
    else if (block.type === "table" && Array.isArray(block.rows) && block.rows.length > 0) covered += 1;
    else if (block.type === "checklist" && Array.isArray(block.items) && block.items.length > 0) covered += 1;
    else if (block.type === "case_set" && Array.isArray(block.cases) && block.cases.length > 0) covered += 1;
    else if (block.type === "reflection" && Array.isArray(block.prompts) && block.prompts.length > 0) covered += 1;
    else if (block.type === "other" && String(block.rawText || "").trim()) covered += 1;
  }

  return covered / blocks.length;
}

function collectSanitationArtifacts(section) {
  const lines = [];

  const pushLines = (value) => {
    if (typeof value !== "string") return;
    value
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(line));
  };

  (section?.blocks || []).forEach((block) => {
    if (typeof block.text === "string") pushLines(block.text);
    if (typeof block.rawText === "string") pushLines(block.rawText);
    if (Array.isArray(block.items)) block.items.forEach((item) => pushLines(item));
    if (Array.isArray(block.prompts)) block.prompts.forEach((item) => pushLines(item));
    if (Array.isArray(block.details)) block.details.forEach((item) => pushLines(item));
    if (Array.isArray(block.questions)) {
      block.questions.forEach((question) => pushLines(question?.prompt));
    }
    if (Array.isArray(block.cases)) {
      block.cases.forEach((entry) => {
        pushLines(entry?.title);
        pushLines(entry?.narrative);
        (entry?.questions || []).forEach((question) => pushLines(question));
      });
    }
  });

  return lines.filter((line) => /^(and|or|:|;|,|[-*])$/i.test(line));
}

export function applyGovernance({
  section,
  classification,
  requestedPatternId,
  eligibility,
  sectionOverride
}) {
  const policy = getDesignPolicyConfig();
  const minimumCoverage = policy.thresholds.minimumCoverage;
  const minimumConfidence = policy.thresholds.minimumConfidence;
  const fallbackPatternId = policy.thresholds.fallbackPatternId;

  const coverage = computeSectionCoverage(section);
  const sanitationArtifacts = collectSanitationArtifacts(section);
  const trace = [];
  const reasons = [...(classification?.reasons || []), ...(eligibility?.reasons || [])];
  const issues = [];
  let patternId = requestedPatternId;

  if (sectionOverride) {
    reasons.push(`OVERRIDE_APPLIED: ${sectionOverride.reason}`);
    trace.push({
      stage: "override",
      code: "OVERRIDE_APPLIED",
      result: "applied",
      detail: sectionOverride.reason,
      patternId
    });
  }

  trace.push({
    stage: "fidelity",
    code: coverage < minimumCoverage ? "SOURCE_COVERAGE_LOW" : "SOURCE_COVERAGE_OK",
    result: coverage < minimumCoverage ? "fallback" : "pass",
    detail: `Coverage ${coverage.toFixed(2)}.`,
    patternId
  });

  if (sanitationArtifacts.length > 0) {
    const detail = `Found ${sanitationArtifacts.length} sanitation artifact line(s).`;
    reasons.push(`SANITATION_ARTIFACT_DETECTED: ${detail}`);
    issues.push({
      code: "SANITATION_ARTIFACT_DETECTED",
      detail
    });
    trace.push({
      stage: "sanitation",
      code: "SANITATION_ARTIFACT_DETECTED",
      result: "warn",
      detail,
      patternId
    });
  } else {
    trace.push({
      stage: "sanitation",
      code: "SANITATION_OK",
      result: "pass",
      detail: "No sanitation artifacts detected.",
      patternId
    });
  }

  if (!eligibility?.eligible) {
    patternId = fallbackPatternId;
    reasons.push("ELIGIBILITY_FAIL: Fallback to premium stacked workbook because no richer pattern qualified.");
    issues.push({
      code: "ELIGIBILITY_FAIL",
      detail: "No richer pattern qualified for this section."
    });
  } else if (coverage < minimumCoverage && requestedPatternId !== fallbackPatternId) {
    patternId = fallbackPatternId;
    reasons.push("SOURCE_COVERAGE_LOW: Fallback to premium stacked workbook because source coverage was below threshold.");
    issues.push({
      code: "SOURCE_COVERAGE_LOW",
      detail: `Coverage ${coverage.toFixed(2)} was below ${minimumCoverage}.`
    });
  } else if ((classification?.confidence || 0) < minimumConfidence && requestedPatternId !== fallbackPatternId) {
    patternId = fallbackPatternId;
    reasons.push("CLASSIFIER_CONFIDENCE_LOW: Fallback to premium stacked workbook because classifier confidence was too low.");
    issues.push({
      code: "CLASSIFIER_CONFIDENCE_LOW",
      detail: `Confidence ${(classification?.confidence || 0).toFixed(2)} was below ${minimumConfidence}.`
    });
  }

  trace.push({
    stage: "pedagogy",
    code: patternId === fallbackPatternId && requestedPatternId !== fallbackPatternId
      ? "PEDAGOGY_FALLBACK"
      : "PEDAGOGY_OK",
    result: patternId === fallbackPatternId && requestedPatternId !== fallbackPatternId ? "fallback" : "pass",
    detail: `Selected pattern "${patternId}".`,
    patternId
  });

  trace.push({
    stage: "layout",
    code: "LAYOUT_POLICY_APPLIED",
    result: "pass",
    detail: "Renderer layout policy will enforce stack-first workbook composition.",
    patternId
  });

  trace.push({
    stage: "visual",
    code: "VISUAL_POLICY_APPLIED",
    result: "pass",
    detail: "Theme/token policy will apply during target rendering.",
    patternId
  });

  return {
    patternId,
    sourceCoverageScore: coverage,
    reasons,
    issues,
    trace,
    policyVersion: policy.version,
    precedence: policy.precedence,
    sanitationArtifacts
  };
}
