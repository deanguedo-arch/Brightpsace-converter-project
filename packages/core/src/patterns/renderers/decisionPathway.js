import { renderKnowledge, renderParagraph, renderWorkbook } from "./shared.js";

function wordCount(text) {
  return String(text || "").trim().split(/\s+/g).filter(Boolean).length;
}

function chunkLongParagraph(paragraph, maxWords = 72) {
  const normalized = String(paragraph || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (wordCount(normalized) <= maxWords) return [normalized];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return [normalized];

  const chunks = [];
  let current = [];
  let count = 0;
  for (const sentence of sentences) {
    const words = wordCount(sentence);
    if (count > 0 && count + words > maxWords) {
      chunks.push(current.join(" ").trim());
      current = [sentence];
      count = words;
      continue;
    }
    current.push(sentence);
    count += words;
  }
  if (current.length > 0) chunks.push(current.join(" ").trim());
  return chunks;
}

function normalizeIntro(introText) {
  const paragraphs = String(introText || "")
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const normalized = [];
  for (const paragraph of paragraphs) {
    chunkLongParagraph(paragraph).forEach((chunk) => normalized.push(chunk));
  }
  return normalized.join("\n\n");
}

export function renderDecisionPathway(section) {
  const intro = section.blocks.find((block) => block.type === "intro");
  const joe = section.blocks.find((block) => block.type === "scenario" && block.title === "Joe");
  const sally = section.blocks.find((block) => block.type === "scenario" && block.title === "Sally");
  const questions = section.blocks.find((block) => block.type === "question_set");
  const renderScenarioSection = (title, details = []) => [
    `#### ${title}`,
    ...details
  ].join("\n\n");
  const combinedNarrative = [
    renderScenarioSection("Joe", joe?.details || []),
    "---",
    renderScenarioSection("Sally", sally?.details || [])
  ].join("\n\n");

  return [
    renderParagraph(normalizeIntro(intro?.text || "")),
    "",
    renderKnowledge("The Price of Cool: Joe vs. Sally", [], { open: true, body: combinedNarrative }),
    "",
    renderWorkbook("The Price Of Cool", questions?.questions || [], {
      layout: "stack"
    })
  ].join("\n");
}
