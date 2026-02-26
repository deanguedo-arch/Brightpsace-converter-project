import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { normalizeComposerActivities, normalizeComposerLayout } from '../src/composer/layout.js';
import { validateComposerActivities } from '../src/composer/activityRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const PDF_PATH = path.join(repoRoot, 'public', 'materials', 'abstudies30', 'ab30theme1BOOKLET.pdf');
const OUTPUT_PATH = path.join(repoRoot, 'docs', 'composer-drafts', 'ab30-theme1-hybrid.json');

const MODULE_ID = 'view-ab30-theme1-aboriginal-rights-self-government';
const MODULE_TITLE = 'Aboriginal Studies 30 - Theme 1: Aboriginal Rights & Self-Government';

function extractPdfPagesViaPython(pdfPath) {
  const pythonScript = `
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    from pypdf import PdfReader
except Exception as exc:
    print(json.dumps({"error":"missing_pypdf","detail":str(exc)}, ensure_ascii=False))
    raise SystemExit(0)

pdf_path = sys.argv[1]
reader = PdfReader(pdf_path)
pages = []
for idx, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    lines = [" ".join(line.split()) for line in text.splitlines() if line and line.strip()]
    pages.append({
        "page": idx,
        "lines": lines,
        "text": " ".join(lines).strip()
    })

print(json.dumps({
    "pageCount": len(pages),
    "pages": pages
}, ensure_ascii=False))
`;

  const result = spawnSync('python', ['-', pdfPath], {
    cwd: repoRoot,
    input: pythonScript,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 30,
  });

  if (result.error) {
    throw new Error(`Failed to execute Python for PDF extraction: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Python PDF extraction failed (exit ${result.status}): ${result.stderr || 'no stderr'}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(String(result.stdout || '').trim());
  } catch (error) {
    throw new Error(`Could not parse Python extraction output as JSON: ${error.message}`);
  }

  if (parsed?.error === 'missing_pypdf') {
    throw new Error(
      `Python package "pypdf" is required. Install it with: python -m pip install pypdf. Detail: ${parsed?.detail || 'unknown'}`,
    );
  }
  if (!parsed || !Array.isArray(parsed.pages)) {
    throw new Error('Unexpected PDF extraction payload shape.');
  }
  return parsed;
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeaderLine(line) {
  const clean = normalizeWhitespace(line);
  if (!clean) return true;
  if (clean === 'Aboriginal Studies 30') return true;
  if (clean === 'Theme 1: Aboriginal Rights and Self-Government') return true;
  if (clean.startsWith('Theme 1: Aboriginal Rights and Self-Government')) return true;
  return false;
}

function getPageMap(extraction) {
  const map = new Map();
  extraction.pages.forEach((entry) => {
    map.set(entry.page, {
      page: entry.page,
      lines: (Array.isArray(entry.lines) ? entry.lines : []).map(normalizeWhitespace).filter((line) => line && !isHeaderLine(line)),
      text: normalizeWhitespace(entry.text || ''),
    });
  });
  return map;
}

function collectLines(pageMap, fromPage, toPage) {
  const lines = [];
  for (let page = fromPage; page <= toPage; page += 1) {
    const entry = pageMap.get(page);
    if (!entry) continue;
    lines.push(...entry.lines);
  }
  return lines;
}

function uniqueLines(lines) {
  const out = [];
  let last = '';
  for (const line of lines) {
    const clean = normalizeWhitespace(line);
    if (!clean) continue;
    if (clean === last) continue;
    out.push(clean);
    last = clean;
  }
  return out;
}

function htmlFromLines(lines) {
  return (Array.isArray(lines) ? lines : [])
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .map((line) => {
      if (/^[A-Z][A-Za-z0-9 &'’\-:,/().]{2,80}$/.test(line) && !line.endsWith('.')) return `<h4>${line}</h4>`;
      return `<p>${line}</p>`;
    })
    .join('\n');
}

function contentBlockData(title, lines) {
  const cleanLines = uniqueLines(lines);
  return {
    title,
    body: cleanLines.join('\n\n'),
    bodyMode: 'rich',
    bodyHtml: htmlFromLines(cleanLines),
    blockContainerBg: '',
    bodyContainerBg: '',
  };
}

function titleBlockData(title, subtitle = '') {
  const text = subtitle ? `${title}\n${subtitle}` : title;
  const textHtml = subtitle ? `<h2>${title}</h2><p>${subtitle}</p>` : `<h2>${title}</h2>`;
  return {
    text,
    textMode: 'rich',
    textHtml,
    align: 'left',
    blockContainerBg: '',
    bodyContainerBg: '',
  };
}

function inferFieldType(label) {
  const text = normalizeWhitespace(label).toLowerCase();
  if (text.includes('true or false')) return 'text';
  if (text.includes('define') || text.includes('what is') || text.includes('why') || text.includes('explain')) return 'textarea';
  if (text.includes('who') || text.includes('when') || text.includes('where')) return 'text';
  if (text.includes('list')) return 'textarea';
  return 'textarea';
}

function worksheetFromPrompts(title, introLines, prompts) {
  const blocks = [
    {
      kind: 'title',
      title,
      showContent: Array.isArray(introLines) && introLines.length > 0,
      content: uniqueLines(introLines || []).join('\n\n'),
    },
  ];

  (Array.isArray(prompts) ? prompts : [])
    .map((prompt) => normalizeWhitespace(prompt))
    .filter(Boolean)
    .forEach((prompt) => {
      blocks.push({
        kind: 'field',
        label: prompt,
        fieldType: inferFieldType(prompt),
        placeholder: 'Type your response...',
        helperMode: 'plain',
        helperText: '',
        helperHtml: '',
      });
    });

  return {
    title,
    blocks,
  };
}

function splitIntoChunks(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function extractQuestions(pageMap) {
  const questionSourcePages = [];
  for (let page = 8; page <= 30; page += 1) {
    const entry = pageMap.get(page);
    if (!entry) continue;
    const text = entry.text
      .replace(/Aboriginal Studies 30/g, ' ')
      .replace(/Theme 1: Aboriginal Rights and Self-Government/g, ' ');
    questionSourcePages.push(text);
  }

  let source = normalizeWhitespace(questionSourcePages.join(' '));
  source = source.replace(/\s+/g, ' ').trim();

  const tokenRegex = /(?<!\d)(\d{1,4})\.(?!\d)/g;
  const tokens = [];
  let match = tokenRegex.exec(source);
  while (match) {
    tokens.push({
      raw: Number.parseInt(match[1], 10),
      start: match.index,
      end: match.index + match[0].length,
    });
    match = tokenRegex.exec(source);
  }

  const mapsToQuestion = (raw, expected) => raw === expected || raw % 100 === expected || raw % 10 === expected;

  const selected = [];
  let tokenIdx = 0;
  for (let q = 1; q <= 87; q += 1) {
    let found = null;
    while (tokenIdx < tokens.length) {
      const token = tokens[tokenIdx];
      if (mapsToQuestion(token.raw, q)) {
        found = token;
        tokenIdx += 1;
        break;
      }
      tokenIdx += 1;
    }
    selected.push(found);
  }

  const cleanupPrompt = (text, questionNumber) => {
    let prompt = normalizeWhitespace(text)
      .replace(/\s*\/\s*\d+\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const qIndex = prompt.indexOf('?');
    if (qIndex >= 0) {
      let core = prompt.slice(0, qIndex + 1).trim();
      const tail = prompt.slice(qIndex + 1).trim();
      if (/\ba\)/i.test(tail) || /\btrue\b/i.test(tail)) {
        const cleanedTail = tail
          .replace(
            /\b(?:Collective and Individual Rights|Inherent Rights|Early Treaties|Colonization|Royal Proclamation|Numbered Treaties|Shifting Priorities|Different Languages|Negotiations Begin|Treaties Six, Seven, and Eight|Traditional Governance|Traditional Territories|Land and Governance|Traditional Government|Métis Governance|Aboriginal Leadership Then and Now|Role of Elders in the School|Western First Nations in Early Canada|Inuit People in Early Canada|Métis People in Early Canada|The Indian Agent|First Nations Government Under the Indian Act|Revisions to the Indian Act|Band Councils since 1969\(page 66-73\)|Devolution|Band Councils Today|Tribal Councils|The Era of Rights and Freedoms|Aboriginal Concerns Grow|The Constitution Act|Meech Lake Accord|Charlottetown Accord|National Organizations|Aboriginal Rights and Canadian Law|Indian Act|Natural Resources Transfer Agreements|Royal Commission on Aboriginal Peoples|Provincial Government Perspectives|Models of Self-Government|Assignment 1\.2).*$/i,
            '',
          )
          .trim();
        if (cleanedTail) core = `${core} ${cleanedTail}`;
      }
      prompt = core;
    }

    prompt = prompt
      .replace(/\bpage\s+\d+(?:-\d+)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!prompt) {
      return `Question ${questionNumber}`;
    }
    if (prompt.length > 320) {
      return `${prompt.slice(0, 317).trim()}...`;
    }
    return prompt;
  };

  const out = [];
  for (let q = 1; q <= 87; q += 1) {
    const current = selected[q - 1];
    if (!current) {
      out.push({ number: q, prompt: `Question ${q}` });
      continue;
    }
    let nextStart = source.length;
    for (let i = q; i < 87; i += 1) {
      if (selected[i]) {
        nextStart = selected[i].start;
        break;
      }
    }
    const segment = source.slice(current.end, nextStart);
    out.push({
      number: q,
      prompt: cleanupPrompt(segment, q),
    });
  }
  return out;
}

function createActivity(id, type, data, layout = { colSpan: 1 }) {
  return { id, type, data, layout };
}

function buildDraftPayload(extraction) {
  const pageMap = getPageMap(extraction);
  const questions = extractQuestions(pageMap);

  const tabs = [
    { id: 'overview', label: 'Overview', activityIds: [] },
    { id: 'key-terms-oral-tradition', label: 'Key Terms & Oral Tradition', activityIds: [] },
    { id: 'guiding-questions-1-34', label: 'Guiding Questions 1-34', activityIds: [] },
    { id: 'guiding-questions-35-68', label: 'Guiding Questions 35-68', activityIds: [] },
    { id: 'guiding-questions-69-87', label: 'Guiding Questions 69-87', activityIds: [] },
    { id: 'critical-responses', label: 'Critical Responses', activityIds: [] },
    { id: 'completion-export', label: 'Completion & Export', activityIds: [] },
  ];

  const activities = [
    createActivity('ab30-t1-tab-group', 'tab_group', {
      title: 'Theme 1 Navigation',
      tabs,
      defaultTabId: 'overview',
    }),
  ];

  const add = (tabId, id, type, data) => {
    activities.push(createActivity(id, type, data));
    const tab = tabs.find((entry) => entry.id === tabId);
    if (!tab) throw new Error(`Unknown tab id: ${tabId}`);
    tab.activityIds.push(id);
  };

  add(
    'overview',
    'ab30-t1-title',
    'title_block',
    titleBlockData('Aboriginal Studies 30 - Theme 1', 'Aboriginal Rights & Self-Government'),
  );

  add(
    'overview',
    'ab30-t1-overview-content',
    'content_block',
    contentBlockData(
      'Course Context and Purpose',
      collectLines(pageMap, 1, 3),
    ),
  );

  add('overview', 'ab30-t1-overview-callout', 'callout_block', {
    tone: 'tip',
    title: 'Respectful Learning Reminder',
    body:
      'This module covers historical and contemporary issues affecting Indigenous peoples. Engage with care, reflect critically, and prioritize respectful language and evidence-based responses.',
  });

  add(
    'key-terms-oral-tradition',
    'ab30-t1-key-terms-content',
    'content_block',
    contentBlockData(
      'Foundations: Inherent Rights and Oral Tradition',
      collectLines(pageMap, 4, 7),
    ),
  );

  add(
    'key-terms-oral-tradition',
    'ab30-t1-key-terms-worksheet',
    'worksheet_form',
    worksheetFromPrompts(
      'Key Terms Glossary Review',
      [
        'Using your textbook glossary, summarize each term in your own words while preserving textbook context.',
      ],
      [
        'Aboriginal Rights',
        'Aboriginal Title',
        'Collective Rights',
        'Indigenous Peoples',
        'Individual Rights',
        'Inherent Rights',
        'Nation',
        'Numbered Treaties',
        'Land Claim',
        'Self-Determination',
        'Self-Government',
        'Sovereignty',
      ],
    ),
  );

  add(
    'key-terms-oral-tradition',
    'ab30-t1-oral-tradition-assignment',
    'worksheet_form',
    worksheetFromPrompts(
      'Assignment 1.1 - Oral Tradition',
      [
        'Storytelling is part of Aboriginal oral tradition. Respond in 2-3 paragraphs using your classroom response criteria.',
      ],
      [
        'Define oral tradition in your own words.',
        'Explain the importance of oral tradition for Indigenous peoples and communities.',
        'Explain the purpose of oral tradition and how it connects to identity, values, and knowledge transfer.',
      ],
    ),
  );

  const makeGuidingSection = (tabId, title, questionStart, questionEnd, introLines, idPrefix) => {
    add(
      tabId,
      `${idPrefix}-intro`,
      'content_block',
      contentBlockData(title, introLines),
    );

    const sectionQuestions = questions.filter((row) => row.number >= questionStart && row.number <= questionEnd);
    const chunks = splitIntoChunks(sectionQuestions, 12);
    chunks.forEach((chunk, idx) => {
      add(
        tabId,
        `${idPrefix}-worksheet-${idx + 1}`,
        'worksheet_form',
        worksheetFromPrompts(
          `${title} - Responses ${idx * 12 + 1}-${idx * 12 + chunk.length}`,
          [],
          chunk.map((entry) => `Q${entry.number}. ${entry.prompt}`),
        ),
      );
    });
  };

  makeGuidingSection(
    'guiding-questions-1-34',
    'Assignment 1.0 Guiding Questions (1-34)',
    1,
    34,
    collectLines(pageMap, 8, 15),
    'ab30-t1-q1-34',
  );

  makeGuidingSection(
    'guiding-questions-35-68',
    'Assignment 1.0 Guiding Questions (35-68)',
    35,
    68,
    collectLines(pageMap, 16, 24),
    'ab30-t1-q35-68',
  );

  makeGuidingSection(
    'guiding-questions-69-87',
    'Assignment 1.0 Guiding Questions (69-87)',
    69,
    87,
    collectLines(pageMap, 25, 30),
    'ab30-t1-q69-87',
  );

  add(
    'critical-responses',
    'ab30-t1-critical-content',
    'content_block',
    contentBlockData(
      'Critical Response Assignments',
      [
        'Assignment 1.1 focuses on oral tradition and storytelling.',
        'Assignment 1.2 asks you to evaluate one promised advantage of rebuilding self-government and explain why it can benefit a First Nation.',
        'Use paragraph form and the response criteria posted in your classroom.',
      ],
    ),
  );

  add(
    'critical-responses',
    'ab30-t1-critical-assignment-1-2',
    'worksheet_form',
    worksheetFromPrompts(
      'Assignment 1.2 - Rebuilding Self-Government',
      [
        'Choose one of the four advantages of self-government promises and explain why it matters.',
      ],
      [
        'Which self-government advantage did you choose, and why?',
        'Explain how this advantage could improve outcomes for a First Nation community.',
        'Support your response with course content and, if used, additional research.',
      ],
    ),
  );

  add('critical-responses', 'ab30-t1-critical-reflection', 'reflection_journal', {
    title: 'Theme 1 Reflection',
    prompt:
      'Reflect on how your understanding of Aboriginal rights and self-government changed through this theme.',
    placeholder: 'Write your reflection...',
  });

  add(
    'completion-export',
    'ab30-t1-completion-content',
    'content_block',
    contentBlockData(
      'Theme Completion',
      collectLines(pageMap, 31, 32),
    ),
  );

  add('completion-export', 'ab30-t1-checklist', 'checklist_block', {
    title: 'Student Completion Checklist',
    items: [
      { text: 'Assignment 1.0 Definitions and Guiding Questions completed', checked: false },
      { text: 'Assignment 1.1 Oral Tradition critical response completed', checked: false },
      { text: 'Assignment 1.2 Rebuilding Self-Government critical response completed', checked: false },
      { text: 'Module handed in and reviewed with teacher', checked: false },
      { text: 'Ready to start Theme 2', checked: false },
    ],
  });

  add(
    'completion-export',
    'ab30-t1-final-comments',
    'worksheet_form',
    worksheetFromPrompts(
      'Final Grade and Comments',
      [],
      ['Raw score summary', 'Percentage and points summary', 'Teacher comments / feedback notes'],
    ),
  );

  add('completion-export', 'ab30-t1-save-load', 'save_load_block', {
    title: 'Save or Restore Theme 1 Progress',
    description: 'Download your responses as JSON and upload later to restore your work.',
    fileName: 'ab30-theme1-progress',
  });

  add('completion-export', 'ab30-t1-report', 'submission_builder', {
    title: 'Generate Theme 1 Report',
    buttonLabel: 'Generate Theme 1 Submission Report',
  });

  add('completion-export', 'ab30-t1-final-callout', 'callout_block', {
    tone: 'tip',
    title: 'Congratulations',
    body: 'You completed Theme 1. Save a backup, generate your report, and submit according to class instructions.',
  });

  const composerLayout = normalizeComposerLayout({
    mode: 'simple',
    maxColumns: 1,
    rowHeight: 24,
    margin: [12, 12],
    containerPadding: [12, 12],
    simpleMatchTallestRow: false,
  });

  const normalizedActivities = normalizeComposerActivities(activities, {
    maxColumns: composerLayout.maxColumns,
    mode: composerLayout.mode,
  });

  const validationRows = validateComposerActivities(normalizedActivities);
  const errors = validationRows.flatMap((row) => row.issues.filter((issue) => issue.level === 'error'));
  if (errors.length > 0) {
    throw new Error(`Generated composer activities contain ${errors.length} validation error(s).`);
  }

  return {
    kind: 'course-factory-module-draft',
    version: 2,
    exportedAt: new Date().toISOString(),
    draft: {
      id: 'module-draft-ab30-theme1-hybrid',
      label: 'AB30 Theme 1 Hybrid Draft',
      savedAt: new Date().toISOString(),
      payload: {
        version: 2,
        type: 'composer',
        moduleId: MODULE_ID,
        title: MODULE_TITLE,
        html: '',
        url: '',
        linkType: 'iframe',
        template: 'deck',
        theme: 'dark_cards',
        hero: {},
        finlit: {},
        composerStarterType: 'content_block',
        composerLayout,
        composerActivities: normalizedActivities,
        templateLayoutProfiles: {},
        finlitAuthoringTabId: 'activities',
        composerExtraRows: 0,
        composerSelectedIndex: 0,
        composerWorkspaceControlsCollapsed: false,
      },
    },
    meta: {
      sourcePdf: path.relative(repoRoot, PDF_PATH).replace(/\\/g, '/'),
      pageCount: extraction.pageCount,
      extractedQuestionCount: questions.length,
      activityCount: normalizedActivities.length,
      tabCount: tabs.length,
      notes: 'Generated by scripts/build_ab30_theme1_draft.mjs',
    },
  };
}

function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`Source PDF not found: ${path.relative(repoRoot, PDF_PATH)}`);
  }

  const extraction = extractPdfPagesViaPython(PDF_PATH);
  const draft = buildDraftPayload(extraction);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
  const activityCount = draft?.draft?.payload?.composerActivities?.length || 0;
  console.log(`Wrote ${path.relative(repoRoot, OUTPUT_PATH)} with ${activityCount} composer activities.`);
}

main();
