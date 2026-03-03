export const RENDER_TARGETS = ["brightspace-embed", "scorm"];

export const SECTION_INTENTS = [
  "launch",
  "knowledge",
  "compare_contrast",
  "decision_making",
  "budgeting",
  "ethical_reasoning",
  "communication_practice",
  "case_analysis",
  "reflection"
];

export const PATTERN_IDS = [
  "launch-frame",
  "knowledge-atlas",
  "decision-pathway",
  "mini-simulator",
  "scenario-judge",
  "case-workspace",
  "premium-stacked-workbook"
];

export function isRenderTarget(value) {
  return RENDER_TARGETS.includes(String(value || "").trim());
}

export function isPatternId(value) {
  return PATTERN_IDS.includes(String(value || "").trim());
}
