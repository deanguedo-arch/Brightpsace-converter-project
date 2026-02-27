import fs from "node:fs/promises";
import { buildPreviewUnit } from "./build.js";
import { readCourseConfig } from "./course.js";
import { validateBrightspaceBuild } from "./validate.js";

function clampScore(value) {
  return Math.max(0, Math.min(5, Number(value) || 0));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function collectBlockStats(unit) {
  const stats = {
    markdown: 0,
    subheading: 0,
    callout: 0,
    accordion: 0,
    workbook: 0,
    scenario: 0,
    ranking: 0,
    decisionTree: 0,
    workbookFields: 0,
    scenarioPrompts: 0,
    rankingItems: 0,
    decisionNodes: 0
  };

  for (const section of unit.sections || []) {
    for (const block of section.blocks || []) {
      if (block.type === "markdown") stats.markdown += 1;
      if (block.type === "subheading") stats.subheading += 1;
      if (block.type === "callout") stats.callout += 1;
      if (block.type === "accordion") stats.accordion += 1;
      if (block.type === "workbook") {
        stats.workbook += 1;
        stats.workbookFields += Array.isArray(block.fields) ? block.fields.length : 0;
      }
      if (block.type === "scenario") {
        stats.scenario += 1;
        stats.scenarioPrompts += Array.isArray(block.prompts) ? block.prompts.length : 0;
      }
      if (block.type === "ranking") {
        stats.ranking += 1;
        stats.rankingItems += Array.isArray(block.items) ? block.items.length : 0;
      }
      if (block.type === "decision-tree") {
        stats.decisionTree += 1;
        stats.decisionNodes += Array.isArray(block.nodes) ? block.nodes.length : 0;
      }
    }
  }
  return stats;
}

function scorePedagogy(unit, stats) {
  let score = 0;
  const objectiveCount = (unit.objectives || []).length;
  const sectionCount = (unit.sections || []).length;
  const scaffoldingBlocks = stats.subheading + stats.callout + stats.accordion + stats.workbook;

  if (objectiveCount >= 3) score += 2;
  else if (objectiveCount >= 1) score += 1;

  if (sectionCount >= 6) score += 2;
  else if (sectionCount >= 3) score += 1;

  if (scaffoldingBlocks >= 6) score += 1;
  else if (scaffoldingBlocks >= 2) score += 0.5;

  return clampScore(score);
}

function scoreActivityRichness(unit, stats) {
  const interactionTypes = [
    stats.workbook > 0,
    stats.scenario > 0,
    stats.ranking > 0,
    stats.decisionTree > 0,
    (unit.flashcards || []).length > 0,
    stats.accordion > 0
  ].filter(Boolean).length;

  const interactionDensity =
    stats.workbookFields +
    stats.scenarioPrompts +
    stats.rankingItems +
    stats.decisionNodes +
    (unit.flashcards || []).length;

  let score = 1;
  if (interactionDensity >= 8) score = 3;
  if (interactionDensity >= 14) score = 4;
  if (interactionDensity >= 20) score = 5;
  if (interactionTypes >= 4 && score < 5) score += 0.5;
  return clampScore(score);
}

function scoreAssessment(stats) {
  const assessmentCount = stats.workbook + stats.scenario + stats.ranking + stats.decisionTree;
  let score = 1;
  if (assessmentCount >= 2) score = 3;
  if (assessmentCount >= 4) score = 4;
  if (assessmentCount >= 6) score = 5;
  return clampScore(score);
}

function scoreAccessibility(html, validation) {
  const text = String(html || "");
  const hasH1 = /<h1[\s>]/i.test(text);
  const hasH2 = /<h2[\s>]/i.test(text);
  const hasMain = /<main[\s>]/i.test(text);
  const hasLabel = /<label[\s>]/i.test(text);
  const hasAria = /aria-[a-z-]+=/i.test(text);
  const unknownClassErrors = (validation.errors || []).filter((entry) => entry.includes("unknown class")).length;
  const inlineStyleErrors = (validation.errors || []).filter((entry) => entry.includes("inline style")).length;

  let score = 2;
  if (hasH1 && hasH2 && hasMain) score += 1;
  if (hasLabel) score += 1;
  if (hasAria) score += 1;
  if (unknownClassErrors > 0) score -= 1;
  if (inlineStyleErrors > 0) score -= 1;
  return clampScore(score);
}

function scoreProduction(validation) {
  const errors = validation.errors || [];
  const warnings = validation.warnings || [];
  if (errors.length > 0) return 0;
  if (warnings.length > 3) return 3;
  if (warnings.length > 0) return 4;
  return 5;
}

function scoreUiQuality(html) {
  const text = String(html || "");
  let score = 1;
  if (/class="[^"]*unit-header/.test(text)) score += 1;
  if (/class="[^"]*sticky-nav/.test(text)) score += 1;
  if (/class="[^"]*card/.test(text)) score += 1;
  if (/class="[^"]*workbook|flashcards|scenario|ranking|decision-tree/.test(text)) score += 1;
  return clampScore(score);
}

function verdictFromScores(overall, minDimensionScore) {
  if (minDimensionScore >= 3 && overall >= 4) return "Ship Ready";
  if (minDimensionScore >= 2 && overall >= 3) return "Conditional";
  return "Not Ready";
}

function collectRecommendations(dimensions) {
  const recommendations = [];
  if (dimensions.pedagogyClarity.score < 3) {
    recommendations.push("Increase section scaffolding and explicit learning objectives.");
  }
  if (dimensions.activityRichness.score < 3) {
    recommendations.push("Add more interactive blocks (workbook/scenario/ranking/decision-tree).");
  }
  if (dimensions.assessmentQuality.score < 3) {
    recommendations.push("Add stronger formative checks and summative prompts.");
  }
  if (dimensions.accessibilityReadability.score < 3) {
    recommendations.push("Improve semantic structure and labeled controls.");
  }
  if (dimensions.productionSafety.score < 3) {
    recommendations.push("Resolve guardrail/validation errors before release.");
  }
  if (dimensions.uiHierarchy.score < 3) {
    recommendations.push("Improve visual hierarchy and component consistency.");
  }
  return recommendations;
}

export function scoreUnitQuality({ unit, html, validation = { errors: [], warnings: [] } }) {
  const stats = collectBlockStats(unit);

  const dimensions = {
    pedagogyClarity: {
      score: scorePedagogy(unit, stats),
      max: 5
    },
    activityRichness: {
      score: scoreActivityRichness(unit, stats),
      max: 5
    },
    assessmentQuality: {
      score: scoreAssessment(stats),
      max: 5
    },
    accessibilityReadability: {
      score: scoreAccessibility(html, validation),
      max: 5
    },
    productionSafety: {
      score: scoreProduction(validation),
      max: 5
    },
    uiHierarchy: {
      score: scoreUiQuality(html),
      max: 5
    }
  };

  const values = Object.values(dimensions).map((entry) => entry.score);
  const overall = round(values.reduce((sum, score) => sum + score, 0) / values.length, 2);
  const minDimensionScore = Math.min(...values);
  const verdict = verdictFromScores(overall, minDimensionScore);

  return {
    overall,
    minDimensionScore: round(minDimensionScore, 2),
    verdict,
    dimensions,
    recommendations: collectRecommendations(dimensions),
    interaction: {
      workbookFields: stats.workbookFields,
      scenarioPrompts: stats.scenarioPrompts,
      rankingItems: stats.rankingItems,
      decisionNodes: stats.decisionNodes,
      flashcards: (unit.flashcards || []).length
    },
    validation
  };
}

export async function scoreBuiltUnit({
  repoRoot,
  courseSlug,
  unitSlug
}) {
  const built = await buildPreviewUnit({
    repoRoot,
    courseSlug,
    unitSlug,
    sandbox: false
  });
  const courseConfig = await readCourseConfig(repoRoot, courseSlug);
  const externalAllowlist = Array.isArray(courseConfig?.externalAllowlist)
    ? courseConfig.externalAllowlist.map((value) => String(value))
    : [];
  const validation = await validateBrightspaceBuild({
    buildDir: built.outputDir,
    externalAllowlist
  });
  const html = await fs.readFile(built.indexPath, "utf8");
  const score = scoreUnitQuality({
    unit: built.unitModel,
    html,
    validation
  });
  return {
    ...score,
    built,
    validation
  };
}
