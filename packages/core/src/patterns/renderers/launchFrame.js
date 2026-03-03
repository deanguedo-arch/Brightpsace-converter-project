import { renderParagraph, renderWorkbook } from "./shared.js";

export function renderLaunchFrame(section) {
  const intro = section.blocks.find((block) => block.type === "intro");
  const setup = section.blocks.find((block) => block.type === "question_set");
  return [
    renderParagraph(intro?.text || ""),
    "",
    renderWorkbook("Student Setup", setup?.questions || [], {
      layout: "stack",
      description: "Start with your name and one decision pattern you want to improve during this module."
    })
  ].join("\n");
}
