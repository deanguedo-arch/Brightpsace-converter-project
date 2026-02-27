import MarkdownIt from "markdown-it";
import yaml from "js-yaml";
import { slugify } from "./utils.js";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false
});

function pushMarkdownBlock(buffer, section) {
  const text = buffer.join("\n").trim();
  buffer.length = 0;
  if (!text) return;
  section.blocks.push({
    type: "markdown",
    html: md.render(text)
  });
}

function parseAccordion(bodyLines) {
  const items = [];
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^- (.+?):\s*(.+)$/);
    if (match) {
      items.push({
        title: match[1].trim(),
        bodyHtml: md.render(match[2].trim())
      });
    }
  }
  if (items.length === 0) {
    const fallback = bodyLines.join("\n").trim();
    if (fallback) {
      items.push({
        title: "Details",
        bodyHtml: md.render(fallback)
      });
    }
  }
  return items;
}

function normalizeWorkbookOption(rawOption, index) {
  if (typeof rawOption === "string" || typeof rawOption === "number") {
    const label = String(rawOption).trim();
    if (!label) return null;
    return {
      value: slugify(label) || `option-${index + 1}`,
      label
    };
  }
  if (!rawOption || typeof rawOption !== "object") return null;
  const label = String(rawOption.label || rawOption.value || "").trim();
  if (!label) return null;
  const value = String(rawOption.value || slugify(label) || `option-${index + 1}`).trim();
  if (!value) return null;
  return { value, label };
}

function normalizeWorkbookField(rawField, index) {
  if (!rawField || typeof rawField !== "object") return null;

  const rawKind = String(rawField.type || rawField.kind || "").trim().toLowerCase();
  const kindAliases = {
    input: "text",
    string: "text",
    longtext: "textarea",
    multi: "checklist",
    checkbox: "checklist",
    checkboxes: "checklist"
  };
  const kind = kindAliases[rawKind] || rawKind;
  const allowedKinds = new Set(["text", "textarea", "radio", "checklist"]);
  if (!allowedKinds.has(kind)) return null;

  const label = String(rawField.label || rawField.prompt || rawField.question || "").trim();
  if (!label) return null;

  const id = slugify(rawField.id || rawField.key || label) || `field-${index + 1}`;
  const placeholder = String(rawField.placeholder || "").trim();
  const rowsRaw = Number(rawField.rows);
  const rows = Number.isFinite(rowsRaw) ? Math.max(2, Math.min(12, Math.round(rowsRaw))) : 4;
  const optionsRaw = Array.isArray(rawField.options) ? rawField.options : [];
  const options = optionsRaw
    .map((option, optionIndex) => normalizeWorkbookOption(option, optionIndex))
    .filter(Boolean);

  if ((kind === "radio" || kind === "checklist") && options.length === 0) return null;

  return {
    id,
    kind,
    label,
    placeholder,
    rows,
    options
  };
}

function parseWorkbook(bodyLines) {
  const source = bodyLines.join("\n").trim();
  if (!source) return null;

  const config = yaml.load(source);
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;

  const title = String(config.title || config.heading || "Workbook").trim() || "Workbook";
  const description = String(config.description || config.instructions || "").trim();
  const fieldsRaw = Array.isArray(config.fields) ? config.fields : [];
  const fields = fieldsRaw
    .map((field, index) => normalizeWorkbookField(field, index))
    .filter(Boolean);

  if (fields.length === 0) return null;

  return {
    type: "workbook",
    title,
    descriptionHtml: description ? md.render(description) : "",
    fields
  };
}

function normalizeOption(rawOption, index) {
  if (typeof rawOption === "string" || typeof rawOption === "number") {
    const label = String(rawOption).trim();
    if (!label) return null;
    return {
      value: slugify(label) || `option-${index + 1}`,
      label
    };
  }
  if (!rawOption || typeof rawOption !== "object") return null;
  const label = String(rawOption.label || rawOption.value || "").trim();
  if (!label) return null;
  return {
    value: String(rawOption.value || slugify(label) || `option-${index + 1}`).trim(),
    label,
    outcomeHtml: rawOption.outcome ? md.render(String(rawOption.outcome).trim()) : ""
  };
}

function parseScenario(bodyLines) {
  const source = bodyLines.join("\n").trim();
  if (!source) return null;
  const config = yaml.load(source);
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;

  const title = String(config.title || "Scenario").trim() || "Scenario";
  const description = String(config.description || config.instructions || "").trim();
  const prompts = (Array.isArray(config.prompts) ? config.prompts : [])
    .map((entry, promptIndex) => {
      if (!entry || typeof entry !== "object") return null;
      const question = String(entry.question || entry.prompt || "").trim();
      if (!question) return null;
      const options = (Array.isArray(entry.options) ? entry.options : [])
        .map((option, optionIndex) => normalizeOption(option, optionIndex))
        .filter(Boolean);
      if (options.length === 0) return null;
      return {
        id: slugify(entry.id || `prompt-${promptIndex + 1}`) || `prompt-${promptIndex + 1}`,
        question,
        options
      };
    })
    .filter(Boolean);

  if (prompts.length === 0) return null;
  return {
    type: "scenario",
    title,
    descriptionHtml: description ? md.render(description) : "",
    prompts
  };
}

function parseRanking(bodyLines) {
  const source = bodyLines.join("\n").trim();
  if (!source) return null;
  const config = yaml.load(source);
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;

  const title = String(config.title || "Ranking").trim() || "Ranking";
  const instructions = String(config.instructions || config.description || "").trim();
  const items = (Array.isArray(config.items) ? config.items : [])
    .map((item, index) => {
      if (typeof item === "string" || typeof item === "number") {
        const label = String(item).trim();
        if (!label) return null;
        return {
          id: slugify(label) || `item-${index + 1}`,
          label
        };
      }
      if (!item || typeof item !== "object") return null;
      const label = String(item.label || item.text || item.value || "").trim();
      if (!label) return null;
      return {
        id: slugify(item.id || label) || `item-${index + 1}`,
        label
      };
    })
    .filter(Boolean);

  if (items.length < 2) return null;
  return {
    type: "ranking",
    title,
    descriptionHtml: instructions ? md.render(instructions) : "",
    items
  };
}

function parseDecisionTree(bodyLines) {
  const source = bodyLines.join("\n").trim();
  if (!source) return null;
  const config = yaml.load(source);
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;

  const title = String(config.title || "Decision Tree").trim() || "Decision Tree";
  const description = String(config.description || config.instructions || "").trim();
  const rawNodes = Array.isArray(config.nodes) ? config.nodes : [];
  const nodes = rawNodes
    .map((entry, nodeIndex) => {
      if (!entry || typeof entry !== "object") return null;
      const id = slugify(entry.id || `node-${nodeIndex + 1}`) || `node-${nodeIndex + 1}`;
      const prompt = String(entry.prompt || entry.question || "").trim();
      if (!prompt) return null;
      const end = Boolean(entry.end);
      const choices = (Array.isArray(entry.choices) ? entry.choices : [])
        .map((choice, choiceIndex) => {
          if (!choice || typeof choice !== "object") return null;
          const label = String(choice.label || choice.text || "").trim();
          if (!label) return null;
          const next = String(choice.next || choice.to || "").trim();
          return {
            id: `${id}-choice-${choiceIndex + 1}`,
            label,
            next: next ? slugify(next) || next : ""
          };
        })
        .filter(Boolean);
      if (!end && choices.length === 0) return null;
      return {
        id,
        prompt,
        end,
        choices
      };
    })
    .filter(Boolean);

  if (nodes.length === 0) return null;
  return {
    type: "decision-tree",
    title,
    descriptionHtml: description ? md.render(description) : "",
    nodes
  };
}

function createSection(title, idsInUse) {
  const base = slugify(title || "section") || "section";
  let id = base;
  let i = 2;
  while (idsInUse.has(id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  idsInUse.add(id);
  return {
    id,
    title: title || "Section",
    blocks: []
  };
}

export function parseMarkdownToUnitBlocks(content) {
  const lines = String(content || "").split(/\r?\n/);
  const idsInUse = new Set();
  const sections = [];
  const nav = [];

  let currentSection = createSection("Overview", idsInUse);
  let buffer = [];

  function finalizeCurrentSection() {
    pushMarkdownBlock(buffer, currentSection);
    if (currentSection.blocks.length > 0) {
      sections.push(currentSection);
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const directiveStart = line.match(/^:::(info|warning|example|accordion|workbook|scenario|ranking|decision-tree)\s*$/);
    if (directiveStart) {
      pushMarkdownBlock(buffer, currentSection);
      const kind = directiveStart[1];
      const bodyLines = [];
      let cursor = index + 1;
      for (; cursor < lines.length; cursor += 1) {
        if (/^:::\s*$/.test(lines[cursor])) break;
        bodyLines.push(lines[cursor]);
      }
      index = cursor;
      if (kind === "accordion") {
        currentSection.blocks.push({
          type: "accordion",
          items: parseAccordion(bodyLines)
        });
      } else if (kind === "workbook") {
        const workbook = parseWorkbook(bodyLines);
        if (workbook) {
          currentSection.blocks.push(workbook);
        } else {
          currentSection.blocks.push({
            type: "markdown",
            html: md.render(bodyLines.join("\n").trim())
          });
        }
      } else if (kind === "scenario") {
        const scenario = parseScenario(bodyLines);
        if (scenario) currentSection.blocks.push(scenario);
      } else if (kind === "ranking") {
        const ranking = parseRanking(bodyLines);
        if (ranking) currentSection.blocks.push(ranking);
      } else if (kind === "decision-tree") {
        const tree = parseDecisionTree(bodyLines);
        if (tree) currentSection.blocks.push(tree);
      } else {
        currentSection.blocks.push({
          type: "callout",
          kind,
          html: md.render(bodyLines.join("\n").trim())
        });
      }
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      finalizeCurrentSection();
      currentSection = createSection(h2Match[1].trim(), idsInUse);
      nav.push({
        id: currentSection.id,
        title: currentSection.title,
        depth: 2
      });
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      pushMarkdownBlock(buffer, currentSection);
      const subTitle = h3Match[1].trim();
      const baseSubId = `${currentSection.id}-${slugify(subTitle) || "topic"}`;
      let subId = baseSubId;
      let count = 2;
      while (idsInUse.has(subId)) {
        subId = `${baseSubId}-${count}`;
        count += 1;
      }
      idsInUse.add(subId);
      currentSection.blocks.push({
        type: "subheading",
        id: subId,
        title: subTitle
      });
      nav.push({
        id: subId,
        title: subTitle,
        depth: 3
      });
      continue;
    }

    buffer.push(line);
  }

  finalizeCurrentSection();
  if (sections.length === 0) {
    sections.push(currentSection);
  }

  if (nav.length === 0) {
    nav.push({
      id: sections[0]?.id || "overview",
      title: sections[0]?.title || "Overview",
      depth: 2
    });
  }

  return { sections, nav };
}
