import { renderKnowledge, renderWorkbook } from "./shared.js";

function questionIdFromIndex(index) {
  return `honesty-reasoning-${index + 1}`;
}

export function renderScenarioJudge(section) {
  const knowledge = section.blocks.find((block) => block.type === "knowledge");
  const questionSet = section.blocks.find((block) => block.type === "question_set");
  const reflection = section.blocks.find((block) => block.type === "reflection");
  const knowledgeBody = (knowledge?.items || []).map((item) => `- ${item}`).join("\n");

  return [
    renderKnowledge(knowledge?.title || "Healthy Relationships", [], {
      open: true,
      description: knowledge?.description || "People in healthy relationships:",
      body: knowledgeBody
    }),
    "",
    renderWorkbook("Honesty Quiz", (questionSet?.questions || []).map((question, index) => ({
      id: questionIdFromIndex(index),
      prompt: question.prompt,
      answerKind: "textarea",
      rows: 4
    })), {
      layout: "stack"
    }),
    "",
    renderWorkbook("Discussion & Reflection", (reflection?.prompts || []).map((prompt, index) => ({
      id: `honesty-reflection-${index + 1}`,
      prompt,
      answerKind: "textarea",
      rows: index < 2 ? 4 : 3
    })), {
      layout: "stack"
    })
  ].join("\n");
}
