export function q(value) {
  return JSON.stringify(String(value || "").replace(/\s+/g, " ").trim());
}

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

function normalizeKnowledgeBody(body) {
  const blocks = String(body || "")
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const normalizedBlocks = [];
  for (const block of blocks) {
    if (/^(\*|-|#|>|`)/.test(block)) {
      normalizedBlocks.push(block);
      continue;
    }
    const chunks = chunkLongParagraph(block);
    chunks.forEach((chunk) => normalizedBlocks.push(chunk));
  }

  return normalizedBlocks.join("\n\n").trim();
}

function yamlScalar(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return q("");
  return /[:[\]{}#&*!|>'"%@`]/.test(text) ? q(text) : text;
}

export function yamlBlock(value, indent = 2) {
  return String(value || "")
    .split("\n")
    .map((line) => `${" ".repeat(indent)}${line}`.trimEnd())
    .join("\n");
}

export function renderWorkbook(title, questions = [], options = {}) {
  const layout = `layout: ${options.layout || "stack"}\n`;
  const description = options.description ? `description: ${yamlScalar(options.description)}\n` : "";
  const fields = questions.map((question) => {
    const lines = [
      `  - type: ${question.answerKind === "text" ? "text" : question.answerKind === "radio" ? "radio" : question.answerKind === "checklist" ? "checklist" : "textarea"}`,
      `    id: ${question.id}`
    ];
    lines.push(`    label: ${q(question.prompt)}`);
    if (question.hint) lines.push(`    hint: ${q(question.hint)}`);
    if (question.answerKind === "textarea") {
      lines.push("    autosize: true");
      lines.push(`    rows: ${question.rows || 4}`);
    }
    if ((question.answerKind === "radio" || question.answerKind === "checklist") && Array.isArray(question.options)) {
      lines.push("    options:");
      question.options.forEach((option) => {
        lines.push(`      - ${q(option)}`);
      });
    }
    return lines.join("\n");
  }).join("\n");

  return [
    ":::workbook",
    `title: ${yamlScalar(title)}`,
    layout.trimEnd(),
    description ? description.trimEnd() : "",
    "fields:",
    fields,
    ":::"
  ].filter(Boolean).join("\n");
}

export function renderKnowledge(title, items = [], options = {}) {
  const description = options.description ? `description: ${q(options.description)}\n` : "";
  const body = normalizeKnowledgeBody(String(
    options.body || items.map((item) => {
      if (/^[-*]\s/.test(item)) return item;
      return item;
    }).join("\n\n")
  ));
  return [
    ":::knowledge",
    `title: ${q(title)}`,
    options.open ? "open: true" : "",
    description ? description.trimEnd() : "",
    "body: |",
    yamlBlock(body, 2),
    ":::"
  ].filter(Boolean).join("\n");
}

export function renderParagraph(text) {
  return String(text || "").trim();
}

export function renderSubheading(title) {
  return `### ${title}`;
}
