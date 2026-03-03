import { renderKnowledge, renderWorkbook, q } from "./shared.js";

function toPromptQuestion(id, prompt, rows = 4) {
  return { id, prompt, answerKind: "textarea", rows };
}

function renderChecklistBody(checklist) {
  const groups = Array.isArray(checklist?.groups) ? checklist.groups : [];
  if (groups.length === 0) {
    return (checklist?.items || []).join("\n\n");
  }

  return groups.map((group) => {
    const items = (group.items || []).map((item) => `- ${item}`).join("\n");
    return [`#### ${group.title}`, items].filter(Boolean).join("\n");
  }).join("\n\n");
}

export function renderMiniSimulator(section) {
  const checklist = section.blocks.find((block) => block.type === "checklist");
  const researchReflection = section.blocks.find((block) => block.type === "reflection" && block.title === "Purchase Reflection");
  const managingMoney = section.blocks.find((block) => block.type === "question_set");
  const budgetTable = section.blocks.find((block) => block.type === "table" && block.tableKind === "budget");
  const budgetAnalysis = section.blocks.find((block) => block.type === "reflection" && block.title === "Budget Analysis");
  const incomeFields = (budgetTable?.rows || []).filter((row) => row[0] === "income");
  const expenseFields = (budgetTable?.rows || []).filter((row) => row[0] === "expense");

  return [
    renderKnowledge(checklist?.title || "Smart Buyer Checklist", [], {
      open: true,
      body: renderChecklistBody(checklist)
    }),
    "",
    renderWorkbook("Purchase Research Reflection", [
      toPromptQuestion("purchase-reflection", researchReflection?.prompts?.[0] || "Do you think you did enough research into your purchase? Why or why not?")
    ], {
      layout: "stack"
    }),
    "",
    "### Budgeting Assignment",
    "",
    renderWorkbook("Managing Money Questions", managingMoney?.questions || [], {
      layout: "stack"
    }),
    "",
    ":::simulator",
    "kind: budget",
    `title: ${q(budgetTable?.title || "Monthly Budget Builder")}`,
    "description: Build a current monthly budget using the same categories from the source workbook.",
    "income:",
    ...incomeFields.map((row) => `  - key: ${row[1]}\n    label: ${q(row[2])}`),
    "expenses:",
    ...expenseFields.map((row) => `  - key: ${row[1]}\n    label: ${q(row[2])}`),
    ":::",
    "",
    renderWorkbook("Budget Analysis", (budgetAnalysis?.prompts || []).map((prompt, index) => toPromptQuestion(`budget-analysis-${index + 1}`, prompt, index < 2 ? 3 : 4)), {
      layout: "stack"
    })
  ].join("\n");
}
