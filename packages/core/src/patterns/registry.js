import { classifySection } from "../pedagogy/classifySection.js";
import { resolveSectionOverride } from "../designPolicy.js";
import { applyGovernance } from "../pedagogy/governance.js";
import { evaluatePatternEligibility } from "./eligibility.js";
import { renderCaseWorkspace } from "./renderers/caseWorkspace.js";
import { renderDecisionPathway } from "./renderers/decisionPathway.js";
import { renderKnowledgeAtlas } from "./renderers/knowledgeAtlas.js";
import { renderLaunchFrame } from "./renderers/launchFrame.js";
import { renderMiniSimulator } from "./renderers/miniSimulator.js";
import { renderPremiumStackedWorkbook } from "./renderers/premiumStackedWorkbook.js";
import { renderScenarioJudge } from "./renderers/scenarioJudge.js";

const REGISTRY = [
  {
    id: "launch-frame",
    supports: ["launch"],
    render: renderLaunchFrame
  },
  {
    id: "knowledge-atlas",
    supports: ["knowledge"],
    render: renderKnowledgeAtlas
  },
  {
    id: "decision-pathway",
    supports: ["compare_contrast", "decision_making"],
    render: renderDecisionPathway
  },
  {
    id: "mini-simulator",
    supports: ["budgeting"],
    render: renderMiniSimulator
  },
  {
    id: "scenario-judge",
    supports: ["ethical_reasoning"],
    render: renderScenarioJudge
  },
  {
    id: "case-workspace",
    supports: ["case_analysis"],
    render: renderCaseWorkspace
  },
  {
    id: "premium-stacked-workbook",
    supports: ["knowledge", "communication_practice", "reflection"],
    render: renderPremiumStackedWorkbook
  }
];

function desiredPatternId(classification) {
  const intents = new Set(classification?.intents || []);
  if (intents.has("launch")) return "launch-frame";
  if (intents.has("case_analysis")) return "case-workspace";
  if (intents.has("compare_contrast") && intents.has("decision_making")) return "decision-pathway";
  if (intents.has("budgeting")) return "mini-simulator";
  if (intents.has("ethical_reasoning")) return "scenario-judge";
  if (intents.has("communication_practice")) return "premium-stacked-workbook";
  if (intents.has("knowledge")) return "knowledge-atlas";
  return "premium-stacked-workbook";
}

export function listPatternRegistrations() {
  return REGISTRY.map(({ id, supports }) => ({ id, supports: [...supports] }));
}

export function getPatternRegistration(patternId) {
  return REGISTRY.find((entry) => entry.id === patternId) || REGISTRY.find((entry) => entry.id === "premium-stacked-workbook");
}

export function selectPatternForSection(section, ctx = {}) {
  const sectionOverride = resolveSectionOverride(ctx.designOverrides, section.id);
  const classification = classifySection(section);
  const requestedPatternId = sectionOverride?.forcePatternId || desiredPatternId(classification);
  const eligibility = evaluatePatternEligibility(section, classification, requestedPatternId);
  const governed = applyGovernance({
    section,
    classification,
    requestedPatternId,
    eligibility,
    sectionOverride
  });

  return {
    sectionId: section.id,
    intents: classification.intents,
    patternId: governed.patternId,
    interactionScore: classification.interactionScore,
    confidence: classification.confidence,
    reasons: governed.reasons,
    sourceCoverageScore: governed.sourceCoverageScore,
    issues: governed.issues,
    trace: governed.trace,
    policyVersion: governed.policyVersion,
    precedence: governed.precedence,
    override: sectionOverride || null
  };
}

export function renderSectionWithPattern(section, ctx = {}) {
  const decision = selectPatternForSection(section, ctx);
  const renderer = getPatternRegistration(decision.patternId);
  return {
    decision,
    body: renderer.render(section, ctx)
  };
}
