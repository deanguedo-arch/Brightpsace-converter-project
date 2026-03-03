import fs from "node:fs/promises";
import path from "node:path";
import { buildPreviewUnit } from "./build.js";
import { loadReferenceProfile } from "./referenceProfiles.js";
import { evaluateEditorialQuality } from "./editorialQuality.js";
import { evaluateVisualQuality } from "./visualQuality.js";

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function hasHtml(text, pattern) {
  return pattern.test(String(text || ""));
}

function normalizeBlockType(type) {
  return String(type || "").trim().toLowerCase();
}

function getSectionBlockTypes(section) {
  return new Set((section?.blocks || []).map((block) => normalizeBlockType(block.type)));
}

function hasStudentNameField(unit) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) =>
      normalizeBlockType(block.type) === "workbook"
      && (block.fields || []).some((field) => {
        const label = String(field.label || "").trim().toLowerCase();
        const id = String(field.id || "").trim().toLowerCase();
        return label.includes("student name") || id === "student-name";
      })
    )
  );
}

function hasFieldHint(unit) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) =>
      normalizeBlockType(block.type) === "workbook"
      && (block.fields || []).some((field) => String(field.hint || "").trim().length > 0)
    )
  );
}

function hasAutosizeTextarea(unit) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) =>
      normalizeBlockType(block.type) === "workbook"
      && (block.fields || []).some((field) => field.kind === "textarea" && field.autosize !== false)
    )
  );
}

function hasWorkbookLayout(unit, targetLayout) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) =>
      normalizeBlockType(block.type) === "workbook"
      && String(block.layout || "default").trim() === targetLayout
    )
  );
}

function hasSimulatorKind(unit, simulatorKind) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) =>
      normalizeBlockType(block.type) === "simulator"
      && String(block.simulatorKind || "").trim() === simulatorKind
    )
  );
}

function hasKnowledgeBlock(unit) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) => normalizeBlockType(block.type) === "knowledge")
  );
}

function hasSubmissionBlock(unit) {
  return (unit.sections || []).some((section) =>
    (section.blocks || []).some((block) => normalizeBlockType(block.type) === "submission")
  );
}

function evaluateMandatoryFeatures({ unit, html }) {
  return {
    "launch-student-name": hasStudentNameField(unit),
    "top-progress-shell": hasHtml(html, /data-learning-dashboard/) && hasHtml(html, /data-section-stage/) && hasHtml(html, /class="unit-header/),
    "collapsible-knowledge": hasKnowledgeBlock(unit) && hasHtml(html, /data-knowledge/),
    "field-level-hints": hasFieldHint(unit) && hasHtml(html, /data-workbook-hint-toggle/),
    "autosize-textareas": hasAutosizeTextarea(unit) && hasHtml(html, /data-autosize="true"/),
    "teacher-export": hasHtml(html, /data-teacher-export/),
    "section-completion-feedback": hasHtml(html, /data-completion-feedback="burst"/),
    "budget-workbook-layout": (
      (hasWorkbookLayout(unit, "budget-grid") && hasHtml(html, /data-workbook-layout="budget-grid"/))
      || (hasSimulatorKind(unit, "budget") && hasHtml(html, /data-simulator-kind="budget"/))
    ),
    "case-study-layout": hasWorkbookLayout(unit, "case-stack") && hasHtml(html, /data-workbook-layout="case-stack"/)
  };
}

function scoreVisualShell({ html, profile, unit }) {
  let score = 0;
  if (String(unit.theme || "").trim() === profile.targetTheme) score += 8;
  if (String(unit.template || "").trim() === profile.targetTemplate) score += 8;
  if (hasHtml(html, /class="unit-header/)) score += 4;
  if (hasHtml(html, /data-learning-dashboard/)) score += 5;
  if (hasHtml(html, /data-section-stage/)) score += 5;
  return round(score);
}

function scoreInteractionParity({ html, featureMap }) {
  let score = 0;
  if (featureMap["collapsible-knowledge"]) score += 5;
  if (featureMap["field-level-hints"]) score += 5;
  if (featureMap["autosize-textareas"]) score += 5;
  if (featureMap["teacher-export"]) score += 5;
  if (featureMap["section-completion-feedback"]) score += 5;
  if (!hasHtml(html, /data-teacher-export/)) score = Math.min(score, 20);
  return round(score);
}

function scoreSectionCoverage(unit, profile) {
  if (!Array.isArray(profile.sectionMap) || profile.sectionMap.length === 0) {
    return {
      score: 20,
      results: []
    };
  }

  const results = profile.sectionMap.map((entry) => {
    const section = (unit.sections || []).find((candidate) => candidate.id === entry.targetId);
    const blockTypes = section ? getSectionBlockTypes(section) : new Set();
    const missingElements = (entry.requiredElements || []).filter((element) => !blockTypes.has(normalizeBlockType(element)));
    return {
      sourceLabel: entry.sourceLabel,
      targetId: entry.targetId,
      found: Boolean(section),
      missingElements,
      passed: Boolean(section) && missingElements.length === 0
    };
  });

  const passed = results.filter((entry) => entry.passed).length;
  const score = profile.sectionMap.length > 0
    ? (passed / profile.sectionMap.length) * 20
    : 20;

  return {
    score: round(score),
    results
  };
}

function scoreLearnerFlow({ html, featureMap }) {
  let score = 0;
  if (featureMap["launch-student-name"]) score += 5;
  if (featureMap["top-progress-shell"]) score += 5;
  if (hasHtml(html, /data-completion-checklist/)) score += 5;
  return round(score);
}

function scoreCompletionFlow({ html, unit }) {
  let score = 0;
  if (hasHtml(html, /data-teacher-export/)) score += 4;
  if (hasSubmissionBlock(unit)) score += 3;
  if (hasHtml(html, /data-mark-complete/)) score += 3;
  return round(score);
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectSemanticArtifacts(unit) {
  const violations = [];
  const addViolation = (code, detail, sectionId = "") => {
    violations.push({
      code,
      severity: "error",
      sectionId,
      detail
    });
  };

  const pushLinesFromText = (text, sectionId, fieldLabel = "") => {
    String(text || "")
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        if (/^(and|or|:|;|,|[-*])$/i.test(line)) {
          addViolation(
            "SEMANTIC_ARTIFACT",
            `Found orphan token line "${line}"${fieldLabel ? ` in "${fieldLabel}"` : ""}.`,
            sectionId
          );
        }
      });
  };

  (unit.sections || []).forEach((section) => {
    (section.blocks || []).forEach((block) => {
      if (block.type === "knowledge") {
        pushLinesFromText(htmlToText(block.bodyHtml), section.id, block.title || "Knowledge");
      }
      if (block.type === "workbook") {
        (block.fields || []).forEach((field) => {
          pushLinesFromText(field.label, section.id, field.id || "field");
          pushLinesFromText(field.hint, section.id, field.id || "field");
        });
      }
    });
  });

  return violations;
}

function collectLayoutViolations(unit) {
  const violations = [];
  (unit.sections || []).forEach((section) => {
    (section.blocks || []).forEach((block) => {
      if (normalizeBlockType(block.type) !== "workbook") return;
      const layout = String(block.layout || "stack").trim().toLowerCase();
      const textareaCount = (block.fields || []).filter((field) => String(field.kind || "").trim() === "textarea").length;
      if ((layout === "default" || layout === "split") && textareaCount > 1) {
        violations.push({
          code: "LAYOUT_POLICY_VIOLATION",
          severity: "error",
          sectionId: section.id,
          detail: `Workbook "${block.title || section.title}" used layout "${layout}" with ${textareaCount} long-answer fields.`
        });
      }
    });
  });
  return violations;
}

function determineNextSlice(scores, threshold) {
  if (scores.visualShell < threshold.visualShell) return "Theme/template shell parity";
  if (scores.interactionParity < threshold.interactionParity) return "Interaction primitives";
  if (scores.sourceCoverage < threshold.sourceCoverage) return "Converter section mapping";
  if (scores.learnerFlow < threshold.learnerFlow) return "Learner flow and launch framing";
  if (scores.completionFlow < threshold.completionFlow) return "Completion flow polish";
  return "Manual compare review";
}

export async function auditUnitAgainstReference({
  repoRoot,
  courseSlug,
  unitSlug,
  reference
}) {
  const profile = await loadReferenceProfile(repoRoot, reference);
  const built = await buildPreviewUnit({
    repoRoot,
    courseSlug,
    unitSlug,
    sandbox: false
  });
  const html = await fs.readFile(built.indexPath, "utf8");
  const unit = built.unitModel;
  const componentsCss = await fs.readFile(path.join(repoRoot, "packages", "theme", "src", "components.css"), "utf8")
    .catch(() => "");

  const featureMap = evaluateMandatoryFeatures({ unit, html });
  const missingMandatory = profile.mandatoryFeatures.filter((feature) => !featureMap[feature]);

  const sectionCoverage = scoreSectionCoverage(unit, profile);
  const scores = {
    visualShell: scoreVisualShell({ html, profile, unit }),
    interactionParity: scoreInteractionParity({ html, featureMap }),
    sourceCoverage: sectionCoverage.score,
    learnerFlow: scoreLearnerFlow({ html, featureMap }),
    completionFlow: scoreCompletionFlow({ html, unit })
  };
  scores.overall = round(
    scores.visualShell
      + scores.interactionParity
      + scores.sourceCoverage
      + scores.learnerFlow
      + scores.completionFlow
  );

  const policyViolations = [
    ...collectSemanticArtifacts(unit),
    ...collectLayoutViolations(unit)
  ];
  const visual = evaluateVisualQuality({
    unit,
    courseSlug,
    unitSlug,
    componentsCss
  });
  policyViolations.push(...visual.violations);
  const editorial = evaluateEditorialQuality({
    unit,
    courseSlug,
    unitSlug
  });
  policyViolations.push(...editorial.violations);
  const blockingViolations = policyViolations.filter((violation) => violation.severity === "error");

  const threshold = profile.threshold;
  const passed =
    missingMandatory.length === 0
    && blockingViolations.length === 0
    && scores.overall >= threshold.overall
    && scores.visualShell >= threshold.visualShell
    && scores.interactionParity >= threshold.interactionParity
    && scores.sourceCoverage >= threshold.sourceCoverage
    && scores.learnerFlow >= threshold.learnerFlow
    && scores.completionFlow >= threshold.completionFlow;

  return {
    passed,
    profile,
    built,
    scores,
    threshold,
    features: featureMap,
    missingMandatory,
    sectionCoverage: sectionCoverage.results,
    visual,
    editorial,
    policyViolations,
    nextSlice: determineNextSlice(scores, threshold)
  };
}
