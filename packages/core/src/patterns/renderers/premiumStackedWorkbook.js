import { renderKnowledge, renderParagraph, renderWorkbook } from "./shared.js";

export function renderPremiumStackedWorkbook(section) {
  if (section.id === "review-submit") {
    return [
      renderParagraph("Confirm each section is complete, then export your teacher-view text file for Brightspace submission."),
      "",
      ":::submission",
      "title: Review & Submit",
      "description: Confirm each section is complete, then export your teacher-view text file for Brightspace submission.",
      ":::"
    ].join("\n");
  }

  const intro = section.blocks.find((block) => block.type === "intro");
  const knowledge = section.blocks.find((block) => block.type === "knowledge");
  const primaryQuestions = section.blocks.find((block) => block.type === "question_set");
  const communicationTable = section.blocks.find((block) => block.type === "table" && block.tableKind === "translator");

  const parts = [];
  if (intro?.text) {
    parts.push(renderParagraph(intro.text));
    parts.push("");
  }
  if (knowledge) {
    parts.push(renderKnowledge(knowledge.title, knowledge.items, { open: true }));
    parts.push("");
  }
  if (primaryQuestions) {
    parts.push(renderWorkbook(primaryQuestions.title || "Reflection", primaryQuestions.questions || [], {
      layout: "stack"
    }));
    parts.push("");
  }
  if (communicationTable) {
    parts.push(renderWorkbook("Communication Skills Translator", (communicationTable.rows || []).map((row, index) => ({
      id: `translator-${index + 1}`,
      prompt: `Replace "${row[0]}" with a stronger communication move.`,
      answerKind: "text"
    })), {
      layout: "stack",
      description: "Translate each poor communication habit into a stronger alternative."
    }));
  }

  return parts.join("\n").trim();
}
