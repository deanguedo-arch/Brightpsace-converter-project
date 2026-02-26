import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { normalizeComposerActivities, normalizeComposerLayout } from '../src/composer/layout.js';
import { validateComposerActivities } from '../src/composer/activityRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DOCX_PATH = path.join(
  repoRoot,
  'public',
  'materials',
  'CALM',
  'CALM Module 4 - Career Exploration & Portfolio.docx',
);
const OUTPUT_PATH = path.join(repoRoot, 'docs', 'composer-drafts', 'calm-module-4-hybrid.json');

const MODULE_ID = 'view-calm-module-4-career-exploration-portfolio';
const MODULE_TITLE = 'CALM Module 4: Career Exploration & Portfolio';

function decodeXml(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCodePoint(Number.parseInt(num, 10)));
}

function extractZipEntry(zipBuffer, entryName) {
  const eocdSig = 0x06054b50;
  const cdfhSig = 0x02014b50;
  const lfhSig = 0x04034b50;

  let eocdOffset = -1;
  const minEOCD = 22;
  const maxComment = 0xffff;
  const searchStart = Math.max(0, zipBuffer.length - minEOCD - maxComment);
  for (let i = zipBuffer.length - minEOCD; i >= searchStart; i -= 1) {
    if (zipBuffer.readUInt32LE(i) === eocdSig) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Invalid DOCX zip: EOCD not found');
  }

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  const centralDirSize = zipBuffer.readUInt32LE(eocdOffset + 12);
  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  const centralDirEnd = centralDirOffset + centralDirSize;

  let ptr = centralDirOffset;
  for (let entryIndex = 0; entryIndex < totalEntries && ptr < centralDirEnd; entryIndex += 1) {
    if (zipBuffer.readUInt32LE(ptr) !== cdfhSig) {
      throw new Error(`Invalid DOCX zip: bad central header signature at ${ptr}`);
    }
    const compressionMethod = zipBuffer.readUInt16LE(ptr + 10);
    const compressedSize = zipBuffer.readUInt32LE(ptr + 20);
    const fileNameLen = zipBuffer.readUInt16LE(ptr + 28);
    const extraLen = zipBuffer.readUInt16LE(ptr + 30);
    const commentLen = zipBuffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(ptr + 42);
    const fileName = zipBuffer
      .subarray(ptr + 46, ptr + 46 + fileNameLen)
      .toString('utf8');

    if (fileName === entryName) {
      if (zipBuffer.readUInt32LE(localHeaderOffset) !== lfhSig) {
        throw new Error(`Invalid DOCX zip: bad local header signature for ${entryName}`);
      }
      const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedData = zipBuffer.subarray(dataStart, dataStart + compressedSize);
      if (compressionMethod === 0) return Buffer.from(compressedData);
      if (compressionMethod === 8) return zlib.inflateRawSync(compressedData);
      throw new Error(`Unsupported compression method ${compressionMethod} for ${entryName}`);
    }

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  throw new Error(`ZIP entry not found: ${entryName}`);
}

function extractParagraphLines(documentXml) {
  const paragraphMatches = documentXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const lines = [];
  for (const para of paragraphMatches) {
    const textMatches = para.match(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g) || [];
    const line = textMatches
      .map((node) => decodeXml(node.replace(/^<w:t\b[^>]*>/, '').replace(/<\/w:t>$/, '')))
      .join('')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!line) continue;
    if (line.length > 450) continue;
    lines.push(line);
  }
  return lines;
}

function extractTables(documentXml) {
  const tableMatches = documentXml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/g) || [];
  return tableMatches.map((tableXml) => {
    const rows = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || [];
    return rows.map((rowXml) => {
      const cells = rowXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || [];
      return cells.map((cellXml) => {
        const textMatches = cellXml.match(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g) || [];
        return textMatches
          .map((node) => decodeXml(node.replace(/^<w:t\b[^>]*>/, '').replace(/<\/w:t>$/, '')))
          .join('')
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      });
    });
  });
}

function startAtCareerExploration(lines) {
  const start = lines.indexOf('Career Exploration');
  return start >= 0 ? lines.slice(start) : lines.slice();
}

function isBlankPlaceholder(line) {
  return /^_+$/.test(String(line || '').trim());
}

function cleanLines(lines) {
  const next = [];
  let last = '';
  for (const raw of lines) {
    const line = String(raw || '').trim();
    if (!line) continue;
    if (line === last) continue;
    next.push(line);
    last = line;
  }
  return next;
}

function findRequiredIndex(lines, marker) {
  const idx = lines.indexOf(marker);
  if (idx < 0) throw new Error(`Could not find required marker: "${marker}"`);
  return idx;
}

function between(lines, startInclusive, endExclusive) {
  return lines.slice(startInclusive, endExclusive).filter(Boolean);
}

function toId(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createActivity(id, type, data, layout = { colSpan: 1 }) {
  return {
    id,
    type,
    data,
    layout,
  };
}

function htmlFromParagraphLines(lines) {
  return (Array.isArray(lines) ? lines : [])
    .filter((line) => line && !isBlankPlaceholder(line))
    .map((line) => {
      if (/^[0-9]+\./.test(line.trim())) return `<li>${line.replace(/^[0-9]+\.\s*/, '')}</li>`;
      if (/^[A-Z][A-Za-z0-9 ,&'’“”().:/-]{1,80}:$/.test(line.trim())) return `<h4>${line}</h4>`;
      return `<p>${line}</p>`;
    })
    .join('\n');
}

function contentBlockData(title, lines) {
  const bodyLines = (Array.isArray(lines) ? lines : []).filter((line) => line && !isBlankPlaceholder(line));
  const bodyText = bodyLines.join('\n\n');
  return {
    title,
    body: bodyText,
    bodyMode: 'rich',
    bodyHtml: htmlFromParagraphLines(bodyLines),
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

function inferFieldType(prompt) {
  const text = String(prompt || '').toLowerCase();
  if (text.includes('name:') || text.includes('address') || text.includes('phone') || text.includes('email')) return 'text';
  if (text.includes('rank 1') || text.includes('top 3') || text.includes('top 5') || text.includes('top 10')) return 'text';
  if (text.startsWith('1.') || text.startsWith('2.') || text.startsWith('3.')) return 'textarea';
  if (text.includes('estimated total cost') || text.includes('average salary') || text.includes('hourly wage')) return 'number';
  return 'textarea';
}

function worksheetFromPrompts(title, introLines, prompts) {
  const blocks = [];
  if (title) {
    blocks.push({
      kind: 'title',
      title,
      showContent: Array.isArray(introLines) && introLines.length > 0,
      content: (introLines || []).filter((line) => !isBlankPlaceholder(line)).join('\n\n'),
    });
  }
  (prompts || [])
    .filter((prompt) => prompt && !isBlankPlaceholder(prompt))
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

function splitByMarkers(lines, markers) {
  const markerSet = new Set(markers);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (markerSet.has(line)) {
      if (current) sections.push(current);
      current = { heading: line, lines: [] };
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function chunk(array, size) {
  const next = [];
  for (let i = 0; i < array.length; i += size) {
    next.push(array.slice(i, i + size));
  }
  return next;
}

function buildCareerResearchWorksheetFromTable(tableRows, title) {
  const prompts = [];
  for (const row of tableRows) {
    const first = String(row?.[0] || '').trim();
    const second = String(row?.[1] || '').trim();
    if (first) prompts.push(first);
    if (second) prompts.push(second);
  }
  return worksheetFromPrompts(title, [], prompts);
}

function buildTable5Charts(table5) {
  const header = table5?.[1] || [];
  const cols = [
    String(header?.[1] || 'Phone/Contact Information').trim() || 'Phone/Contact Information',
    String(header?.[2] || 'Qualification Criteria').trim() || 'Qualification Criteria',
    String(header?.[3] || 'Important Information').trim() || 'Important Information',
  ];
  const rows = (table5 || []).slice(2).map((row, idx) => ({
    label: String(row?.[0] || `Resource ${idx + 1}`).trim() || `Resource ${idx + 1}`,
    cells: [String(row?.[1] || '').trim(), String(row?.[2] || '').trim(), String(row?.[3] || '').trim()],
  }));
  const rowChunks = chunk(rows, 8);
  return rowChunks.map((rowsChunk, idx) => {
    const rowDefs = rowsChunk.map((row, rowIdx) => ({ id: `row-${idx + 1}-${rowIdx + 1}`, label: row.label }));
    const colDefs = cols.map((col, colIdx) => ({ id: `col-${colIdx + 1}`, label: col }));
    const cells = rowsChunk.map((row) =>
      row.cells.map((cellText) => ({
        label: cellText,
        editable: true,
        placeholder: cellText ? `${cellText} / notes...` : 'Type your response...',
      })),
    );
    return {
      title: `Resource Planning Chart ${idx + 1}`,
      description: 'Track institution, funding, scholarship, and career contact resources.',
      rowCount: rowDefs.length,
      colCount: colDefs.length,
      showRowLabels: true,
      rowLabelHeader: 'Resource Category',
      rows: rowDefs,
      columns: colDefs,
      cells,
    };
  });
}

function buildSkillsCharts(tableRows, titlePrefix) {
  const rowChunks = chunk(tableRows, 8);
  return rowChunks.map((rowsChunk, idx) => {
    const columns = [
      { id: 'col-1', label: 'Column 1' },
      { id: 'col-2', label: 'Column 2' },
      { id: 'col-3', label: 'Column 3' },
    ];
    const rows = rowsChunk.map((_, rowIdx) => ({ id: `row-${idx + 1}-${rowIdx + 1}`, label: `Item ${rowIdx + 1}` }));
    const cells = rowsChunk.map((row) =>
      [0, 1, 2].map((colIdx) => {
        const cell = String(row?.[colIdx] || '').trim();
        return {
          label: cell,
          editable: true,
          placeholder: 'Add an example or evidence for this skill...',
        };
      }),
    );
    return {
      title: `${titlePrefix} ${idx + 1}`,
      description: 'Reference list from the workbook.',
      rowCount: rows.length,
      colCount: columns.length,
      showRowLabels: false,
      rowLabelHeader: '',
      rows,
      columns,
      cells,
    };
  });
}

function buildRubricBlocks(table8) {
  const header = table8?.[0] || [];
  const columns = [
    { label: String(header?.[1] || 'Does Not Meet').trim() || 'Does Not Meet', score: 1 },
    { label: String(header?.[2] || 'Partially Meets').trim() || 'Partially Meets', score: 3 },
    { label: String(header?.[3] || 'Meets').trim() || 'Meets', score: 5 },
    { label: String(header?.[4] || 'Exceeds').trim() || 'Exceeds', score: 6 },
  ];
  const criteriaRows = (table8 || []).slice(1).map((row) => ({
    criterion: String(row?.[0] || '').trim(),
    cells: [String(row?.[1] || '').trim(), String(row?.[2] || '').trim(), String(row?.[3] || '').trim(), String(row?.[4] || '').trim()],
  }));
  const chunks = chunk(criteriaRows, 5);
  return chunks.map((rowsChunk, idx) => ({
    title: `Career Portfolio Rubric ${idx + 1}`,
    instructions: 'Review each criterion level and self-assess honestly before final submission.',
    rowCount: rowsChunk.length,
    colCount: columns.length,
    selfScoringEnabled: true,
    totalLabel: 'Rubric Self Score Total',
    rows: rowsChunk.map((row) => ({ label: row.criterion || 'Criterion' })),
    columns,
    cells: rowsChunk.map((row) => row.cells),
  }));
}

function buildCoursePlanningWorksheet(table4) {
  const prompts = [];
  for (const row of (table4 || []).slice(1)) {
    const left = String(row?.[0] || '').trim();
    const right = String(row?.[3] || '').trim();
    if (left) prompts.push(`${left} - Completed / Remaining`);
    if (right) prompts.push(`${right} - Completed / Remaining`);
  }
  return worksheetFromPrompts(
    'Career Planning Course Sheet',
    [
      'Use this planning sheet to track completed credits and remaining requirements for graduation and career pathways.',
      'Mark what is already done, then map what you still need to take.',
    ],
    prompts,
  );
}

function lineSliceWithoutBlanks(lines, start, end) {
  return between(lines, start, end).filter((line) => !isBlankPlaceholder(line));
}

function promptLines(lines, start, end) {
  return between(lines, start, end)
    .filter((line) => !isBlankPlaceholder(line))
    .filter((line) => /[?:]$/.test(line) || /^[0-9]+\./.test(line));
}

function buildModuleDraft() {
  const docxBuffer = fs.readFileSync(DOCX_PATH);
  const documentXmlBuffer = extractZipEntry(docxBuffer, 'word/document.xml');
  const documentXml = documentXmlBuffer.toString('utf8');

  const rawLines = extractParagraphLines(documentXml);
  const lines = cleanLines(startAtCareerExploration(rawLines));
  const tables = extractTables(documentXml);

  if (tables.length < 8) {
    throw new Error(`Expected 8 tables in DOCX, found ${tables.length}`);
  }

  const idxCareer = findRequiredIndex(lines, 'Career Exploration');
  const idxCareerInsite = findRequiredIndex(lines, 'CAREERinsite: Online Career Planning Tools');
  const idxInterests = findRequiredIndex(lines, 'Interests Exercise:');
  const idxLetsExplore = findRequiredIndex(lines, 'Let’s Explore!');
  const idxPostSecondary = findRequiredIndex(lines, 'Post-Secondary Exploration:');
  const idxCreateResume = findRequiredIndex(lines, 'Creating a Resume');
  const idxCreateCover = findRequiredIndex(lines, 'Creating a Cover Letter');
  const idxCreatePortfolio = findRequiredIndex(lines, 'Creating a Career Portfolio');
  const idxFinalReflection = findRequiredIndex(lines, 'Final Reflection Questions:');
  const idxDone = findRequiredIndex(lines, 'Congratulations, you’re ALL DONE!');

  const activities = [];
  const tabs = [
    { id: 'career-exploration', label: 'Career Exploration', activityIds: [] },
    { id: 'know-yourself', label: 'Know Yourself', activityIds: [] },
    { id: 'career-research', label: 'Career Research', activityIds: [] },
    { id: 'post-secondary', label: 'Post-Secondary', activityIds: [] },
    { id: 'resume-cover-letter', label: 'Resume & Cover Letter', activityIds: [] },
    { id: 'portfolio', label: 'Portfolio', activityIds: [] },
    { id: 'final-reflection-export', label: 'Final Reflection & Export', activityIds: [] },
  ];

  function add(tabId, id, type, data) {
    activities.push(createActivity(id, type, data));
    const tab = tabs.find((entry) => entry.id === tabId);
    if (!tab) throw new Error(`Unknown tab id: ${tabId}`);
    tab.activityIds.push(id);
  }

  // Top-level tab container (first activity).
  activities.push(
    createActivity('calm4-tab-group', 'tab_group', {
      title: 'CALM Module 4 Navigation',
      tabs,
      defaultTabId: 'career-exploration',
    }),
  );

  // Career Exploration tab.
  add(
    'career-exploration',
    'calm4-career-title',
    'title_block',
    titleBlockData('CALM Module 4: Career Exploration & Portfolio', 'Career exploration pathways and planning.'),
  );

  const careerNarrative = lineSliceWithoutBlanks(lines, idxCareer, idxCareerInsite);
  const accordionMarkers = ['Job Shadowing:', 'Volunteering:', 'Work Experience 15, 25 & 35:', 'Registered Apprenticeship Program (RAP):'];
  const splitCareer = splitByMarkers(careerNarrative, accordionMarkers);
  const introLines = splitCareer.length > 0 ? careerNarrative.slice(0, careerNarrative.indexOf(splitCareer[0].heading)).filter(Boolean) : careerNarrative;

  add('career-exploration', 'calm4-career-overview', 'content_block', contentBlockData('Career Exploration Overview', introLines));
  add('career-exploration', 'calm4-career-accordion', 'accordion_block', {
    title: 'Career Exploration Pathways',
    items: splitCareer.map((section) => ({
      title: section.heading.replace(/:$/, ''),
      content: section.lines.filter((line) => !isBlankPlaceholder(line)).join('\n\n'),
    })),
  });

  add(
    'career-exploration',
    'calm4-career-prompts',
    'worksheet_form',
    worksheetFromPrompts(
      'Career Exploration Response Prompts',
      ['Respond to each prompt in detail and connect your answers to real career options.'],
      [
        'If you had the opportunity to job shadow anywhere in the work force, where would it be? (List at least two jobs/places)',
        'Why do people volunteer?',
        'What skills do you have that would be helpful to a community organization? List as many as you can think of:',
        'What kind of volunteer experience do you have?',
        'If you had to volunteer in your community, what would you like to spend your time doing?',
        'Why would a young person want to include some volunteer experience on their resume?',
        'Based on the articles, do you think youth should be required to do some sort of volunteer work during their high school years? Explain.',
      ],
    ),
  );

  add('career-exploration', 'calm4-career-counselor-callout', 'callout_block', {
    tone: 'tip',
    title: 'Act Now: Support Is Available',
    body: 'If you are interested in job shadowing, volunteering, Work Experience, or RAP, contact your school counselor or success coach right away.',
  });

  // Know Yourself tab.
  const knowYourselfIntro = lineSliceWithoutBlanks(lines, idxCareerInsite, idxInterests);
  add('know-yourself', 'calm4-know-intro', 'content_block', contentBlockData('CAREERinsite: Know Yourself Activities', knowYourselfIntro));

  const knowMarkers = [
    'Interests Exercise:',
    'Abilities Exercise:',
    'Work Values Quiz:',
    'Multiple Intelligences Quiz:',
    'Identify Your Experiences:',
    'Skills Quiz:',
    'Traits Quiz:',
    'Preferred Working Conditions Quiz:',
    'Visions Exercise:',
    'Know Yourself Reflection:',
  ];
  const knowLines = lineSliceWithoutBlanks(lines, idxInterests, idxLetsExplore);
  const knowSections = splitByMarkers(knowLines, knowMarkers);

  knowSections.forEach((section) => {
    if (section.heading === 'Know Yourself Reflection:') {
      add('know-yourself', 'calm4-know-reflection-journal', 'reflection_journal', {
        title: 'Know Yourself Reflection',
        prompt:
          'Reflect on how your interests, values, abilities, and traits may change over time and why regular self-assessment matters.',
        placeholder: 'Write your reflection...',
      });
      add(
        'know-yourself',
        'calm4-know-reflection-worksheet',
        'worksheet_form',
        worksheetFromPrompts(
          'Know Yourself Reflection Questions',
          [],
          section.lines.filter((line) => /[?]$/.test(line)),
        ),
      );
      return;
    }
    const prompts = section.lines.filter((line) => /[?:]$/.test(line) || /^Intelligence #/.test(line) || /^Significant Experience #/.test(line));
    const intro = section.lines.filter((line) => !prompts.includes(line)).slice(0, 6);
    add(
      'know-yourself',
      `calm4-know-${toId(section.heading)}`,
      'worksheet_form',
      worksheetFromPrompts(section.heading.replace(/:$/, ''), intro, prompts),
    );
  });

  // Career research tab.
  const careerResearchIntro = lineSliceWithoutBlanks(lines, idxLetsExplore, idxPostSecondary);
  add('career-research', 'calm4-career-research-intro', 'content_block', contentBlockData('Career Research Assignment', careerResearchIntro));

  add(
    'career-research',
    'calm4-career-research-1',
    'worksheet_form',
    buildCareerResearchWorksheetFromTable(tables[0], 'Career #1 - Apprenticeship / On-the-Job Training'),
  );
  add(
    'career-research',
    'calm4-career-research-2',
    'worksheet_form',
    buildCareerResearchWorksheetFromTable(tables[1], 'Career #2 - College / University Program'),
  );
  add(
    'career-research',
    'calm4-career-research-3',
    'worksheet_form',
    buildCareerResearchWorksheetFromTable(tables[2], 'Career #3 - Career of Your Choice'),
  );

  add(
    'career-research',
    'calm4-career-research-reflection',
    'worksheet_form',
    worksheetFromPrompts(
      'Career Exploration Reflection',
      [],
      promptLines(lines, findRequiredIndex(lines, 'Career Exploration Reflection:'), idxPostSecondary),
    ),
  );

  // Post-secondary tab.
  const postSecondaryLines = lineSliceWithoutBlanks(lines, idxPostSecondary, idxCreateResume);
  const idxInst1 = postSecondaryLines.indexOf('Post-Secondary Institution #1');
  const idxInst2 = postSecondaryLines.indexOf('Post-Secondary Institution #2');
  const idxLearning = postSecondaryLines.indexOf('Learning from Those Who Have Gone Before Us');
  const idxPlanning = postSecondaryLines.indexOf('Career Planning Basics');

  add(
    'post-secondary',
    'calm4-postsecondary-intro',
    'content_block',
    contentBlockData(
      'Post-Secondary Exploration',
      idxInst1 > 0 ? postSecondaryLines.slice(0, idxInst1) : postSecondaryLines.slice(0, 8),
    ),
  );

  add(
    'post-secondary',
    'calm4-postsecondary-inst1',
    'worksheet_form',
    worksheetFromPrompts(
      'Post-Secondary Institution #1',
      [],
      idxInst1 >= 0 && idxInst2 > idxInst1
        ? postSecondaryLines.slice(idxInst1 + 1, idxInst2).filter((line) => /[?:]$/.test(line) || /^[0-9]+\./.test(line))
        : [],
    ),
  );

  add(
    'post-secondary',
    'calm4-postsecondary-inst2',
    'worksheet_form',
    worksheetFromPrompts(
      'Post-Secondary Institution #2',
      [],
      idxInst2 >= 0 && idxLearning > idxInst2
        ? postSecondaryLines.slice(idxInst2 + 1, idxLearning).filter((line) => /[?:]$/.test(line) || /^[0-9]+\./.test(line))
        : [],
    ),
  );

  if (idxLearning >= 0 && idxPlanning > idxLearning) {
    const interviewSlice = postSecondaryLines.slice(idxLearning, idxPlanning);
    add(
      'post-secondary',
      'calm4-postsecondary-interviews',
      'worksheet_form',
      worksheetFromPrompts(
        'Learning from Those Who Have Gone Before Us',
        interviewSlice.slice(0, 6),
        interviewSlice.filter((line) => /[?:]$/.test(line) || /^Interview #/.test(line) || /^Name of person/.test(line) || /^Their Occupation/.test(line)),
      ),
    );
  }

  if (idxPlanning >= 0) {
    const planningSlice = postSecondaryLines.slice(idxPlanning);
    add(
      'post-secondary',
      'calm4-postsecondary-resourceful',
      'worksheet_form',
      worksheetFromPrompts(
        'Career Planning Basics',
        planningSlice.slice(0, 14),
        planningSlice.filter((line) => /[?]$/.test(line)),
      ),
    );
  }

  add('post-secondary', 'calm4-postsecondary-course-planning', 'worksheet_form', buildCoursePlanningWorksheet(tables[3]));

  const table5Charts = buildTable5Charts(tables[4]);
  table5Charts.forEach((chart, idx) => {
    add('post-secondary', `calm4-postsecondary-resource-chart-${idx + 1}`, 'fillable_chart', chart);
  });

  // Resume & Cover Letter tab.
  const resumeLines = lineSliceWithoutBlanks(lines, idxCreateResume, idxCreateCover);
  const coverLines = lineSliceWithoutBlanks(lines, idxCreateCover, idxCreatePortfolio);
  add('resume-cover-letter', 'calm4-resume-content', 'content_block', contentBlockData('Creating a Resume', resumeLines));

  const resumePrompts = resumeLines.filter((line) => /[?:]$/.test(line) || /^What was the name/.test(line) || /^What position/.test(line));
  add(
    'resume-cover-letter',
    'calm4-resume-worksheet',
    'worksheet_form',
    worksheetFromPrompts('Resume Builder Prompts', ['Use these fields to draft your complete resume content.'], resumePrompts),
  );

  const softSkillCharts = buildSkillsCharts(tables[5], 'Soft Skills Reference Chart');
  softSkillCharts.forEach((chart, idx) => {
    add('resume-cover-letter', `calm4-soft-skills-chart-${idx + 1}`, 'fillable_chart', chart);
  });
  const hardSkillCharts = buildSkillsCharts(tables[6], 'Hard Skills Reference Chart');
  hardSkillCharts.forEach((chart, idx) => {
    add('resume-cover-letter', `calm4-hard-skills-chart-${idx + 1}`, 'fillable_chart', chart);
  });

  add('resume-cover-letter', 'calm4-cover-letter-content', 'content_block', contentBlockData('Creating a Cover Letter', coverLines));
  add('resume-cover-letter', 'calm4-resume-cover-checklist', 'checklist_block', {
    title: 'Resume + Cover Letter Completion Checklist',
    items: [
      { text: 'Resume is tailored to the target posting.', checked: false },
      { text: 'Resume has been proofread by at least two people.', checked: false },
      { text: 'Cover letter is one page or less and personalized.', checked: false },
      { text: 'Cover letter includes why you fit the role and how to contact you.', checked: false },
      { text: 'You attached/linked the posting used for your cover letter practice.', checked: false },
    ],
  });

  // Portfolio tab.
  const portfolioLines = lineSliceWithoutBlanks(lines, idxCreatePortfolio, idxFinalReflection);
  add('portfolio', 'calm4-portfolio-content', 'content_block', contentBlockData('Creating a Career Portfolio', portfolioLines));

  add('portfolio', 'calm4-portfolio-evidence', 'portfolio_evidence', {
    title: 'Portfolio Evidence Submission',
    instructions: 'Capture your strongest artifacts and explain what each item demonstrates about your readiness.',
    criteria: [
      'Clear evidence of skill/achievement',
      'Professional formatting and organization',
      'Strong reflection on growth and goals',
      'Relevance to career direction',
    ],
  });

  add('portfolio', 'calm4-portfolio-checklist', 'checklist_block', {
    title: 'Portfolio Required Components',
    items: [
      { text: 'Cover page', checked: false },
      { text: 'Table of contents', checked: false },
      { text: 'Resume and cover letter', checked: false },
      { text: 'List of 3 references', checked: false },
      { text: 'Up-to-date transcript', checked: false },
      { text: 'Autobiography', checked: false },
      { text: 'Mission statement', checked: false },
      { text: 'Summary of values, interests, and career goals', checked: false },
      { text: 'Samples of work', checked: false },
      { text: 'Optional bonus evidence (awards, evaluations, extras)', checked: false },
    ],
  });

  const rubricBlocks = buildRubricBlocks(tables[7]);
  rubricBlocks.forEach((rubric, idx) => {
    add('portfolio', `calm4-portfolio-rubric-${idx + 1}`, 'rubric_creator', rubric);
  });

  // Final Reflection & Export tab.
  const finalLines = lineSliceWithoutBlanks(lines, idxFinalReflection, idxDone + 1);
  const finalPrompts = finalLines.filter((line) => /[?]$/.test(line) || line === 'Explain the importance of ongoing self-assessment and self-appraisal');
  add(
    'final-reflection-export',
    'calm4-final-reflection',
    'worksheet_form',
    worksheetFromPrompts(
      'Final Reflection Questions',
      finalLines.slice(0, 2),
      finalPrompts,
    ),
  );
  add('final-reflection-export', 'calm4-save-load', 'save_load_block', {
    title: 'Save or Restore Module 4 Progress',
    description: 'Download your current responses as JSON, then upload later to restore and continue where you left off.',
    fileName: 'calm-module-4-progress',
  });
  add('final-reflection-export', 'calm4-report', 'submission_builder', {
    title: 'Generate Submission Report',
    buttonLabel: 'Generate Module 4 Report',
  });
  add('final-reflection-export', 'calm4-final-callout', 'callout_block', {
    tone: 'tip',
    title: 'Completion',
    body: 'Congratulations, you are all done. Generate your report, save your JSON backup, and submit your portfolio artifacts.',
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
  const validation = validateComposerActivities(normalizedActivities);
  const errors = validation.flatMap((row) => row.issues.filter((issue) => issue.level === 'error'));
  if (errors.length > 0) {
    throw new Error(`Composer activity validation failed with ${errors.length} error(s).`);
  }

  const payload = {
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
  };

  return {
    kind: 'course-factory-module-draft',
    version: 2,
    exportedAt: new Date().toISOString(),
    draft: {
      id: 'module-draft-calm-module-4-hybrid',
      label: 'CALM Module 4 Hybrid Draft',
      savedAt: new Date().toISOString(),
      payload,
    },
    meta: {
      sourceDocx: path.relative(repoRoot, DOCX_PATH).replace(/\\/g, '/'),
      paragraphCount: lines.length,
      tableCount: tables.length,
      activityCount: normalizedActivities.length,
      tabCount: tabs.length,
      notes: 'Generated by scripts/build_calm_module4_draft.mjs',
    },
  };
}

function main() {
  const draft = buildModuleDraft();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
  const activityCount = draft?.draft?.payload?.composerActivities?.length || 0;
  console.log(`Wrote ${path.relative(repoRoot, OUTPUT_PATH)} with ${activityCount} composer activities.`);
}

main();
