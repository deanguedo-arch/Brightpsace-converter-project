import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function normalizeExtractedText(raw) {
  const text = String(raw || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

function fileHeading(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function extractTextFromDocx(filePath) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeExtractedText(result.value);
}

export async function extractTextFromPdf(filePath) {
  const pdfParse = require("pdf-parse");
  const fs = require("node:fs");
  const bytes = fs.readFileSync(filePath);
  const result = await pdfParse(bytes);
  return normalizeExtractedText(result.text);
}

export async function extractTextByExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".docx") {
    return extractTextFromDocx(filePath);
  }
  if (extension === ".pdf") {
    return extractTextFromPdf(filePath);
  }
  return "";
}

export function buildExtractedMarkdownSections(extractedDocs = []) {
  if (!Array.isArray(extractedDocs) || extractedDocs.length === 0) return "";
  const sections = extractedDocs
    .filter((item) => item?.text)
    .map((item) => {
      const title = fileHeading(item.filePath || "Imported Document") || "Imported Document";
      const text = String(item.text).slice(0, 12000);
      return `## ${title}\n\n${text}\n`;
    });
  return sections.join("\n");
}
