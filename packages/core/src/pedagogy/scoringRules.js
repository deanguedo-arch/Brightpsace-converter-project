function hasBlock(section, type) {
  return (section?.blocks || []).some((block) => block.type === type);
}

function findTable(section, tableKind) {
  return (section?.blocks || []).find((block) => block.type === "table" && block.tableKind === tableKind);
}

function findQuestionSet(section) {
  return (section?.blocks || []).find((block) => block.type === "question_set");
}

function findCaseSet(section) {
  return (section?.blocks || []).find((block) => block.type === "case_set");
}

function sectionText(section) {
  const parts = [section?.sourceTitle, section?.normalizedTitle];
  for (const block of section?.blocks || []) {
    if (typeof block.text === "string") parts.push(block.text);
    if (typeof block.rawText === "string") parts.push(block.rawText);
    if (Array.isArray(block.items)) parts.push(block.items.join(" "));
    if (Array.isArray(block.prompts)) parts.push(block.prompts.join(" "));
    if (Array.isArray(block.questions)) {
      parts.push(block.questions.map((question) => question.prompt).join(" "));
    }
    if (Array.isArray(block.cases)) {
      parts.push(block.cases.map((entry) => `${entry.title} ${entry.narrative}`).join(" "));
    }
  }
  return parts.join(" ").toLowerCase();
}

export function scoreSectionIntents(section) {
  const text = sectionText(section);
  const scores = {
    launch: 0,
    knowledge: 0,
    compare_contrast: 0,
    decision_making: 0,
    budgeting: 0,
    ethical_reasoning: 0,
    communication_practice: 0,
    case_analysis: 0,
    reflection: 0
  };
  const reasons = [];

  const questionSet = findQuestionSet(section);
  const budgetTable = findTable(section, "budget");
  const communicationTable = findTable(section, "translator");
  const purchaseTable = findTable(section, "purchase-log");
  const caseSet = findCaseSet(section);
  const scenarioCount = (section?.blocks || []).filter((block) => block.type === "scenario").length;
  const reflectionBlocks = (section?.blocks || []).filter((block) => block.type === "reflection").length;

  if (section?.id === "module-launch" || /module launch|start here|student setup/.test(text)) {
    scores.launch += 8;
    reasons.push("launch setup prompts detected");
  }
  if (hasBlock(section, "knowledge") || hasBlock(section, "checklist")) {
    scores.knowledge += 4;
    reasons.push("instructional knowledge content detected");
  }
  if (purchaseTable) {
    scores.knowledge += 2;
    reasons.push("purchase log structure detected");
  }
  if (scenarioCount >= 2 && /joe|sally|better decision/.test(text)) {
    scores.compare_contrast += 6;
    scores.decision_making += 5;
    reasons.push("paired tradeoff narrative detected");
  }
  if (/better decision|what matters more|decision/.test(text)) {
    scores.decision_making += 2;
  }
  if (budgetTable) {
    scores.budgeting += 8;
    reasons.push("budget table detected");
  }
  if (/income|expense|saving money|going into debt|monthly budget/.test(text)) {
    scores.budgeting += 3;
  }
  if (questionSet && questionSet.questions.length >= 6 && /justified|honesty|plagiarism/.test(text)) {
    scores.ethical_reasoning += 7;
    reasons.push("repeated ethical judgment prompts detected");
  }
  if (communicationTable || /poor communication skills|conflict/.test(text)) {
    scores.communication_practice += 7;
    reasons.push("communication repair practice detected");
  }
  if (caseSet && caseSet.cases.length >= 2) {
    scores.case_analysis += 8;
    reasons.push("multi-case analysis set detected");
  }
  if (reflectionBlocks > 0 || (questionSet && questionSet.questions.length > 0)) {
    scores.reflection += Math.max(reflectionBlocks * 2, 1);
  }

  return { scores, reasons };
}
