function hasBlock(section, type) {
  return (section?.blocks || []).some((block) => block.type === type);
}

function hasTableKind(section, tableKind) {
  return (section?.blocks || []).some((block) => block.type === "table" && block.tableKind === tableKind);
}

function hasCaseSet(section) {
  return (section?.blocks || []).some((block) => block.type === "case_set" && Array.isArray(block.cases) && block.cases.length >= 2);
}

export function evaluatePatternEligibility(section, classification, patternId) {
  const reasons = [];
  const intents = new Set(classification?.intents || []);
  let eligible = false;

  if (patternId === "launch-frame") {
    eligible = intents.has("launch");
    if (eligible) reasons.push("launch intent qualifies for launch frame");
  } else if (patternId === "knowledge-atlas") {
    eligible = intents.has("knowledge") && (hasBlock(section, "knowledge") || hasTableKind(section, "purchase-log"));
    if (eligible) reasons.push("knowledge density qualifies for knowledge atlas");
  } else if (patternId === "decision-pathway") {
    eligible = intents.has("compare_contrast") && intents.has("decision_making");
    if (eligible) reasons.push("compare/tradeoff signals qualify for decision pathway");
  } else if (patternId === "mini-simulator") {
    eligible = intents.has("budgeting") && hasTableKind(section, "budget");
    if (eligible) reasons.push("numeric budget structure qualifies for mini simulator");
  } else if (patternId === "scenario-judge") {
    eligible = intents.has("ethical_reasoning") && hasBlock(section, "question_set");
    if (eligible) reasons.push("ethical reasoning question set qualifies for scenario judge");
  } else if (patternId === "case-workspace") {
    eligible = intents.has("case_analysis") && hasCaseSet(section);
    if (eligible) reasons.push("multi-case structure qualifies for case workspace");
  } else if (patternId === "premium-stacked-workbook") {
    eligible = true;
    reasons.push("premium stacked workbook is the safe fallback");
  }

  return { eligible, reasons };
}
