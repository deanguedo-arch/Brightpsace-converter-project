import MarkdownIt from "markdown-it";
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

    const directiveStart = line.match(/^:::(info|warning|example|accordion)\s*$/);
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
