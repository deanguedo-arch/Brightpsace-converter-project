import { renderParagraph, renderWorkbook } from "./shared.js";

export function renderLaunchFrame(section) {
  const intro = section.blocks.find((block) => block.type === "intro");
  const setup = section.blocks.find((block) => block.type === "question_set");
  const questions = setup?.questions || [];
  if (questions.length === 0) {
    return renderParagraph(intro?.text || "");
  }
  return [
    renderParagraph(intro?.text || ""),
    "",
    renderWorkbook("Student Setup", questions, {
      layout: "stack",
      description: "Start with your name and one decision pattern you want to improve during this module."
    })
  ].join("\n");
}
