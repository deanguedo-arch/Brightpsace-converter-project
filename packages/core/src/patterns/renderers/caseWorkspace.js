import { renderParagraph, renderWorkbook } from "./shared.js";

export function renderCaseWorkspace(section) {
  const caseSet = section.blocks.find((block) => block.type === "case_set");
  const parts = [
    renderParagraph("Read the following social situations and analyze how the characters should handle them.")
  ];

  (caseSet?.cases || []).forEach((entry, index) => {
    parts.push("");
    parts.push(renderWorkbook(`Case ${index + 1}: ${entry.title}`, (entry.questions || []).map((prompt, questionIndex) => ({
      id: `${entry.id}-question-${questionIndex + 1}`,
      prompt,
      answerKind: "textarea",
      rows: 4
    })), {
      layout: "case-stack",
      description: entry.narrative
    }));
  });

  return parts.join("\n");
}
