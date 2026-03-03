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

function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean).length;
}

function levelRank(level) {
  if (level === "L4") return 4;
  if (level === "L3") return 3;
  if (level === "L2") return 2;
  return 1;
}

function requiredVisualLevel(courseSlug, unitSlug) {
  if (String(courseSlug || "").trim() === "calm-course" && String(unitSlug || "").trim() === "module-2-v2") {
    return "L4";
  }
  return "L3";
}

function collectKnowledgeMetrics(unit) {
  const metrics = {
    knowledgeBlocks: 0,
    denseNarrativeBlocks: 0,
    longParagraphCount: 0
  };

  (unit.sections || []).forEach((section) => {
    (section.blocks || []).forEach((block) => {
      if (String(block.type || "").trim().toLowerCase() !== "knowledge") return;
      metrics.knowledgeBlocks += 1;
      const bodyHtml = String(block.bodyHtml || "");
      const bodyWords = wordCount(stripHtml(bodyHtml));
      const hasList = /<(ul|ol)\b/i.test(bodyHtml);
      const paragraphs = Array.from(bodyHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
        .map((match) => stripHtml(match[1]))
        .filter(Boolean);
      const paragraphCount = paragraphs.length;

      if (!hasList && bodyWords >= 140 && paragraphCount < 2) {
        metrics.denseNarrativeBlocks += 1;
      }

      paragraphs.forEach((paragraph) => {
        if (wordCount(paragraph) > 90) {
          metrics.longParagraphCount += 1;
        }
      });
    });
  });

  return metrics;
}

function collectCssContractMetrics(cssText) {
  const content = String(cssText || "");
  return {
    paragraphSpacingRule: /\.knowledge__content\s+p\s*\+\s*p\s*\{[^}]*margin-top\s*:\s*([0-9.]+)rem/i.test(content),
    listIndentRule: /\.knowledge__content\s+ul[\s\S]*?padding-left\s*:\s*([0-9.]+)rem/i.test(content)
      || /\.knowledge__content\s+ol[\s\S]*?padding-left\s*:\s*([0-9.]+)rem/i.test(content),
    lineMeasureRule: /\.knowledge__content\s*\{[^}]*max-width\s*:\s*([0-9.]+)ch/i.test(content),
    listRhythmRule: /\.knowledge__content\s+li\s*\+\s*li\s*\{[^}]*margin-top\s*:\s*([0-9.]+)rem/i.test(content)
  };
}

function evaluateVisualLevel(metrics) {
  const meetsL3 = metrics.cssRules.paragraphSpacingRule
    && metrics.cssRules.listIndentRule
    && metrics.knowledge.denseNarrativeBlocks === 0;

  const meetsL4 = meetsL3
    && metrics.cssRules.lineMeasureRule
    && metrics.cssRules.listRhythmRule
    && metrics.knowledge.longParagraphCount === 0;

  if (meetsL4) return "L4";
  if (meetsL3) return "L3";
  return "L2";
}

function buildViolations(metrics, requiredLevel, achievedLevel) {
  const violations = [];
  const add = (code, severity, detail) => violations.push({ code, severity, detail });

  if (!metrics.cssRules.paragraphSpacingRule) {
    add("VISUAL_PARAGRAPH_SPACING_RULE_MISSING", "error", "Missing `.knowledge__content p + p` spacing rule.");
  }
  if (!metrics.cssRules.listIndentRule) {
    add("VISUAL_LIST_INDENT_RULE_MISSING", "error", "Missing list indent rule for knowledge block lists.");
  }
  if (!metrics.cssRules.lineMeasureRule) {
    add("VISUAL_MEASURE_RULE_MISSING", "warn", "Missing line-length guard (`max-width`) for knowledge content.");
  }
  if (!metrics.cssRules.listRhythmRule) {
    add("VISUAL_LIST_RHYTHM_RULE_MISSING", "warn", "Missing vertical rhythm rule for list items.");
  }
  if (metrics.knowledge.denseNarrativeBlocks > 0) {
    add(
      "VISUAL_DENSE_NARRATIVE_BLOCKS",
      "warn",
      `${metrics.knowledge.denseNarrativeBlocks} knowledge block(s) render as dense narrative walls.`
    );
  }
  if (metrics.knowledge.longParagraphCount > 0) {
    add(
      "VISUAL_LONG_PARAGRAPHS",
      "warn",
      `${metrics.knowledge.longParagraphCount} paragraph(s) exceed 90 words in knowledge blocks.`
    );
  }

  if (levelRank(achievedLevel) < levelRank(requiredLevel)) {
    add("VISUAL_LEVEL_NOT_MET", "error", `Required ${requiredLevel} but achieved ${achievedLevel}.`);
  }

  return violations;
}

export function evaluateVisualQuality({
  unit,
  courseSlug,
  unitSlug,
  componentsCss
}) {
  const knowledge = collectKnowledgeMetrics(unit);
  const cssRules = collectCssContractMetrics(componentsCss);
  const metrics = { knowledge, cssRules };

  const requiredLevel = requiredVisualLevel(courseSlug, unitSlug);
  const achievedLevel = evaluateVisualLevel(metrics);
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

