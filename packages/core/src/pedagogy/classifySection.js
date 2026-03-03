import { scoreSectionIntents } from "./scoringRules.js";

export function classifySection(section) {
  const { scores, reasons } = scoreSectionIntents(section);
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const intents = sorted.map(([intent]) => intent);
  const total = sorted.reduce((sum, [, score]) => sum + score, 0);
  const topScore = sorted[0]?.[1] || 0;
  const confidence = total > 0 ? topScore / total : 0;

  return {
    sectionId: section.id,
    intents,
    scores,
    interactionScore: total,
    confidence,
    reasons
  };
}
