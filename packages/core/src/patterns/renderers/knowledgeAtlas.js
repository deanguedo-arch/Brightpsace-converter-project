import { renderKnowledge, renderParagraph, renderWorkbook, q } from "./shared.js";

function renderPurchaseWorkbook(table) {
  const fields = [];
  (table?.rows || []).forEach((row, index) => {
    fields.push({
      id: `purchase-item-${index + 1}`,
      prompt: `${row[0]}`,
      answerKind: "text"
    });
    fields.push({
      id: `purchase-influence-${index + 1}`,
      prompt: `Influence for ${row[0]}`,
      answerKind: "text"
    });
  });
  return renderWorkbook("Recent Purchases", fields, {
    description: "List 10 recent purchases and the main influence behind each one.",
    layout: "paired-rows"
  });
}

export function renderKnowledgeAtlas(section) {
  const intro = section.blocks.find((block) => block.type === "intro");
  const definitions = section.blocks.find((block) => block.type === "question_set" && block.title === "Definitions");
  const knowledge = section.blocks.find((block) => block.type === "knowledge");
  const audit = section.blocks.find((block) => block.type === "question_set" && block.title === "Personal Audit");
  const purchaseTable = section.blocks.find((block) => block.type === "table" && block.tableKind === "purchase-log");
  const biggestInfluence = section.blocks.find((block) => block.type === "reflection");

  return [
    renderParagraph(intro?.text || ""),
    "",
    renderKnowledge(knowledge?.title || "Influences in Marketing", knowledge?.items || [], { open: true }),
    "",
    renderWorkbook("Spending Influence Foundations", definitions?.questions || [], {
      layout: "stack"
    }),
    "",
    renderWorkbook("Personal Influence Audit", audit?.questions || [], {
      layout: "stack"
    }),
    "",
    renderPurchaseWorkbook(purchaseTable),
    "",
    renderWorkbook("Biggest Influence", [
      {
        id: "biggest-influence",
        prompt: biggestInfluence?.prompts?.[0] || "Of the 5 influences, which one do you think influences your spending the most? Explain.",
        answerKind: "textarea",
        rows: 4
      }
    ], {
      layout: "stack"
    })
  ].join("\n");
}
