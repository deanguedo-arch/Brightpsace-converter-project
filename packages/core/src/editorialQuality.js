function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlWithBreaks(text) {
  return String(text || "")
    .replace(/<\/(p|li|h[1-6]|blockquote|section|article|div|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean).length;
}

function normalizePrompt(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PROMPT_START_PATTERN = /^(how|what|why|when|where|which|who|define|describe|explain|list|identify|name|compare|analyze|reflect|write|choose|rank|state|tell|summarize|evaluate|outline|discuss|consider|using|think|at|looking|do|does|is|are|can|should|was|were)\b/i;

function isClearPrompt(prompt) {
  const normalized = String(prompt || "").trim();
  if (!normalized) return false;
  if (/\?$/.test(normalized)) return true;
  const withoutNumber = normalized.replace(/^\d+[\).]?\s+/, "");
  if (PROMPT_START_PATTERN.test(withoutNumber)) return true;
  return false;
}

function collectPromptTexts(unit) {
  const prompts = [];
  for (const section of unit.sections || []) {
    for (const block of section.blocks || []) {
      if (block.type === "workbook") {
        for (const field of block.fields || []) {
          const label = String(field.label || "").trim();
          const startsLikePrompt = PROMPT_START_PATTERN.test(label);
          const looksQuestion = /\?$/.test(label);
          const kind = String(field.kind || "").trim();
          const isInstructionalPrompt = kind !== "text" || startsLikePrompt || looksQuestion;
          if (label && isInstructionalPrompt) {
            prompts.push(label);
          }
        }
      }
      if (block.type === "scenario") {
        for (const prompt of block.prompts || []) {
          prompts.push(String(prompt.question || "").trim());
        }
      }
      if (block.type === "ranking") {
        for (const item of block.items || []) {
          prompts.push(String(item.label || "").trim());
        }
      }
      if (block.type === "decision-tree") {
        for (const node of block.nodes || []) {
          prompts.push(String(node.prompt || "").trim());
        }
      }
    }
  }
  return prompts.filter(Boolean);
}

function collectTextChunks(unit) {
  const chunks = [];
  const paragraphs = [];
  const knowledgeBlocks = [];
  const pushChunk = (value) => {
    const cleaned = stripHtml(value);
    if (cleaned) chunks.push(cleaned);
  };
  const pushParagraphs = (value) => {
    const lines = stripHtmlWithBreaks(value)
      .split(/\n{2,}|\n/g)
      .map((line) => line.trim())
      .filter(Boolean);
    lines.forEach((line) => paragraphs.push(line));
  };

  for (const section of unit.sections || []) {
    for (const block of section.blocks || []) {
      if (block.type === "markdown") {
        pushChunk(block.html);
        pushParagraphs(block.html);
      }
      if (block.type === "callout") {
        pushChunk(block.html);
        pushParagraphs(block.html);
      }
      if (block.type === "knowledge") {
        pushChunk(block.bodyHtml);
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.bodyHtml);
        pushParagraphs(block.descriptionHtml);
        knowledgeBlocks.push(block);
      }
      if (block.type === "workbook") {
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.descriptionHtml);
        for (const field of block.fields || []) {
          pushChunk(field.label);
          pushChunk(field.hint);
          pushChunk(field.placeholder);
          pushParagraphs(field.label);
          pushParagraphs(field.hint);
          if (Array.isArray(field.options)) {
            for (const option of field.options) {
              pushChunk(option.label);
              pushParagraphs(option.label);
            }
          }
        }
      }
      if (block.type === "scenario") {
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.descriptionHtml);
        for (const prompt of block.prompts || []) {
          pushChunk(prompt.question);
          pushParagraphs(prompt.question);
          for (const option of prompt.options || []) {
            pushChunk(option.label);
            pushChunk(option.outcomeHtml);
            pushParagraphs(option.label);
            pushParagraphs(option.outcomeHtml);
          }
        }
      }
      if (block.type === "ranking") {
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.descriptionHtml);
        for (const item of block.items || []) {
          pushChunk(item.label);
          pushParagraphs(item.label);
        }
      }
      if (block.type === "decision-tree") {
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.descriptionHtml);
        for (const node of block.nodes || []) {
          pushChunk(node.prompt);
          pushParagraphs(node.prompt);
          for (const choice of node.choices || []) {
            pushChunk(choice.label);
            pushParagraphs(choice.label);
          }
        }
      }
      if (block.type === "simulator") {
        pushChunk(block.descriptionHtml);
        pushParagraphs(block.descriptionHtml);
        for (const entry of block.incomeFields || []) {
          pushChunk(entry.label);
          pushParagraphs(entry.label);
        }
        for (const entry of block.expenseFields || []) {
          pushChunk(entry.label);
          pushParagraphs(entry.label);
        }
      }
    }
  }
  return { chunks: chunks.filter(Boolean), paragraphs: paragraphs.filter(Boolean), knowledgeBlocks };
}

function collectSentenceMetrics(chunks) {
  const sentences = [];
  for (const chunk of chunks) {
    for (const sentence of String(chunk || "").split(/[.!?]+/g)) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      const words = wordCount(trimmed);
      if (words < 3) continue;
      sentences.push({ text: trimmed, words });
    }
  }

  const total = sentences.length;
  if (total === 0) {
    return {
      sentenceCount: 0,
      averageSentenceWords: 0,
      longSentenceCount: 0,
      longSentenceRate: 0
    };
  }

  const longSentenceCount = sentences.filter((sentence) => sentence.words > 30).length;
  const averageSentenceWords = sentences.reduce((sum, sentence) => sum + sentence.words, 0) / total;

  return {
    sentenceCount: total,
    averageSentenceWords,
    longSentenceCount,
    longSentenceRate: longSentenceCount / total
  };
}

function collectParagraphOverflow(paragraphs) {
  return (paragraphs || []).filter((paragraph) => wordCount(paragraph) > 110).length;
}

function collectOrphanTokenCount(chunks) {
  let count = 0;
  for (const chunk of chunks) {
    for (const line of String(chunk || "").split(/\r?\n/g)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^(and|or|:|;|,|[-*])$/i.test(trimmed)) count += 1;
    }
  }
  return count;
}

function collectDuplicatePromptCount(prompts) {
  const seen = new Set();
  const duplicates = new Set();
  for (const prompt of prompts) {
    const normalized = normalizePrompt(prompt);
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.add(normalized);
    else seen.add(normalized);
  }
  return duplicates.size;
}

function collectPromptStartViolationRate(prompts) {
  if (prompts.length === 0) return 0;
  const invalid = prompts.filter((prompt) => !isClearPrompt(prompt)).length;
  return invalid / prompts.length;
}

function collectDenseBulletDumpCount(knowledgeBlocks) {
  let count = 0;
  for (const block of knowledgeBlocks || []) {
    const body = String(block.bodyHtml || "");
    const bullets = (body.match(/<li\b/gi) || []).length;
    const groupedHeadings = (body.match(/<strong>/gi) || []).length + (body.match(/<h4>/gi) || []).length;
    if (bullets > 12 && groupedHeadings < 2) count += 1;
  }
  return count;
}

function evaluateLevelFromMetrics(metrics) {
  const meetsL2 = metrics.orphanTokenCount === 0
    && metrics.duplicatePromptCount === 0
    && metrics.promptStartViolationRate <= 0.2
    && metrics.longSentenceRate <= 0.25
    && metrics.paragraphOverflowCount <= 2;

  const meetsL3 = metrics.orphanTokenCount === 0
    && metrics.duplicatePromptCount === 0
    && metrics.promptStartViolationRate <= 0.12
    && metrics.longSentenceRate <= 0.15
    && metrics.paragraphOverflowCount === 0
    && metrics.denseBulletDumpCount === 0;

  if (meetsL3) return "L3";
  if (meetsL2) return "L2";
  return "L1";
}

function requiredEditorialLevel(courseSlug, unitSlug) {
  if (String(courseSlug || "").trim() === "calm-course" && String(unitSlug || "").trim() === "module-2-v2") {
    return "L3";
  }
  return "L2";
}

function levelRank(level) {
  if (level === "L3") return 3;
  if (level === "L2") return 2;
  return 1;
}

function buildViolations(metrics, requiredLevel, achievedLevel) {
  const violations = [];
  const add = (code, severity, detail) => violations.push({ code, severity, detail });

  if (metrics.orphanTokenCount > 0) {
    add("EDITORIAL_ORPHAN_TOKENS", "error", `${metrics.orphanTokenCount} orphan token lines detected.`);
  }
  if (metrics.duplicatePromptCount > 0) {
    add("EDITORIAL_DUPLICATE_PROMPTS", "error", `${metrics.duplicatePromptCount} duplicated prompt stems detected.`);
  }
  if (metrics.promptStartViolationRate > 0.2) {
    add("EDITORIAL_PROMPT_CLARITY", "error", "Too many prompts do not start with a clear instructional stem.");
  } else if (metrics.promptStartViolationRate > 0.12) {
    add("EDITORIAL_PROMPT_CLARITY", "warn", "Prompt stem consistency is below premium target.");
  }
  if (metrics.longSentenceRate > 0.25) {
    add("EDITORIAL_SENTENCE_LENGTH", "warn", "Long sentence ratio exceeds production target.");
  }
  if (metrics.paragraphOverflowCount > 2) {
    add("EDITORIAL_PARAGRAPH_DENSITY", "warn", "Paragraph density is too heavy for workbook scanning.");
  } else if (metrics.paragraphOverflowCount > 0) {
    add("EDITORIAL_PARAGRAPH_DENSITY", "warn", "Some blocks still exceed preferred paragraph density.");
  }
  if (metrics.denseBulletDumpCount > 0) {
    add("EDITORIAL_DENSE_BULLETS", "warn", "Dense bullet dumps detected in knowledge blocks.");
  }

  if (levelRank(achievedLevel) < levelRank(requiredLevel)) {
    add(
      "EDITORIAL_LEVEL_NOT_MET",
      "error",
      `Required ${requiredLevel} but achieved ${achievedLevel}.`
    );
  }

  return violations;
}

export function evaluateEditorialQuality({ unit, courseSlug, unitSlug }) {
  const { chunks, paragraphs, knowledgeBlocks } = collectTextChunks(unit);
  const prompts = collectPromptTexts(unit);
  const sentence = collectSentenceMetrics(chunks);

  const metrics = {
    chunkCount: chunks.length,
    promptCount: prompts.length,
    sentenceCount: sentence.sentenceCount,
    averageSentenceWords: Number(sentence.averageSentenceWords.toFixed(2)),
    longSentenceCount: sentence.longSentenceCount,
    longSentenceRate: Number(sentence.longSentenceRate.toFixed(3)),
    orphanTokenCount: collectOrphanTokenCount(chunks),
    duplicatePromptCount: collectDuplicatePromptCount(prompts),
    promptStartViolationRate: Number(collectPromptStartViolationRate(prompts).toFixed(3)),
    paragraphOverflowCount: collectParagraphOverflow(paragraphs),
    denseBulletDumpCount: collectDenseBulletDumpCount(knowledgeBlocks)
  };

  const requiredLevel = requiredEditorialLevel(courseSlug, unitSlug);
  const achievedLevel = evaluateLevelFromMetrics(metrics);
  const violations = buildViolations(metrics, requiredLevel, achievedLevel);
  const passed = !violations.some((violation) => violation.severity === "error");

  return {
    requiredLevel,
    achievedLevel,
    passed,
    metrics,
    violations
  };
}
