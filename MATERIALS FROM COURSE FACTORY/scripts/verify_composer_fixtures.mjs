#!/usr/bin/env node
import { compileProjectToFilesMap, compileModuleToHtml } from '../src/utils/compiler.js';
import { buildLegacyCompiledHtml } from '../src/utils/generators.js';

const activityFixtures = [
  {
    type: 'content_block',
    marker: 'Fixture Content',
    data: { title: 'Fixture Content', body: 'Body text' },
  },
  {
    type: 'embed_block',
    marker: 'Embed fixture',
    data: { url: 'https://example.com', caption: 'Embed fixture' },
  },
  {
    type: 'image_block',
    marker: 'Fixture Image',
    data: { url: 'https://example.com/fixture.png', alt: 'Fixture image alt', caption: 'Fixture Image', width: 'medium' },
  },
  {
    type: 'resource_list',
    marker: 'Fixture Resource',
    data: { title: 'Resources', items: [{ label: 'Fixture Resource', url: 'https://example.com/docs' }] },
  },
  {
    type: 'assessment_embed',
    marker: 'Fixture Embedded Assessment',
    data: {
      title: 'Embedded Assessments',
      items: [
        {
          id: 'assess-fixture-1',
          title: 'Fixture Embedded Assessment',
          html: '<div class="text-sm text-white">Fixture Embedded Assessment</div>',
          script: 'window.__fixtureAssessmentExecuted = true;',
        },
      ],
    },
  },
  {
    type: 'knowledge_check',
    marker: 'data-kc-block',
    data: {
      prompt: 'What is focus?',
      options: ['A', 'B', 'C'],
      correctIndex: 1,
      shortAnswerPrompt: 'Explain your choice',
    },
  },
  {
    type: 'spacer_block',
    marker: 'data-spacer-block',
    data: { height: 40 },
  },
  {
    type: 'submission_builder',
    marker: 'data-submission-download',
    data: { title: 'Submit', buttonLabel: 'Generate Submission' },
  },
  {
    type: 'fillable_chart',
    marker: 'data-fillable-chart-block',
    data: {
      title: 'Fixture Chart',
      description: 'Fill the chart',
      rowCount: 2,
      colCount: 2,
      rows: [
        { id: 'r1', label: 'Row A' },
        { id: 'r2', label: 'Row B' },
      ],
      columns: [
        { id: 'c1', label: 'Pros' },
        { id: 'c2', label: 'Cons' },
      ],
      cells: [
        [
          { label: '', editable: true, placeholder: 'Type pro...' },
          { label: '', editable: true, placeholder: 'Type con...' },
        ],
        [
          { label: 'Static note', editable: false, placeholder: '' },
          { label: '', editable: true, placeholder: 'Type con...' },
        ],
      ],
    },
  },
];

const layoutFixture = {
  moduleId: 'view-fixture-layout',
  maxColumns: 3,
  activities: [
    {
      id: 'activity-layout-a',
      marker: 'Layout Block A',
      colSpan: 2,
      data: { title: 'Layout Block A', body: 'A body' },
    },
    {
      id: 'activity-layout-b',
      marker: 'Layout Block B',
      colSpan: 1,
      data: { title: 'Layout Block B', body: 'B body' },
    },
    {
      id: 'activity-layout-c',
      marker: 'Layout Block C',
      colSpan: 3, // intentionally clamped from 7 below
      data: { title: 'Layout Block C', body: 'C body' },
    },
  ],
};

function buildProjectWithFixtures() {
  const modules = activityFixtures.map((fixture, idx) => ({
    id: `view-fixture-${idx + 1}`,
    title: `Fixture ${fixture.type}`,
    type: 'standalone',
    mode: 'composer',
    activities: [{ id: `activity-${idx + 1}`, type: fixture.type, data: fixture.data }],
    rawHtml:
      idx === 0
        ? '<!DOCTYPE html><html><body><p>RAW_SHOULD_NOT_SHOW</p></body></html>'
        : '',
    html: '',
    css: '',
    script: '',
  }));
  modules.push({
    id: layoutFixture.moduleId,
    title: 'Fixture layout module',
    type: 'standalone',
    mode: 'composer',
    composerLayout: { maxColumns: layoutFixture.maxColumns },
    activities: [
      {
        id: layoutFixture.activities[0].id,
        type: 'content_block',
        layout: { colSpan: layoutFixture.activities[0].colSpan },
        data: layoutFixture.activities[0].data,
      },
      {
        id: layoutFixture.activities[1].id,
        type: 'content_block',
        layout: { colSpan: layoutFixture.activities[1].colSpan },
        data: layoutFixture.activities[1].data,
      },
      {
        id: layoutFixture.activities[2].id,
        type: 'content_block',
        layout: { colSpan: 7 }, // should clamp to maxColumns (3)
        data: layoutFixture.activities[2].data,
      },
    ],
    rawHtml: '<!DOCTYPE html><html><body><p>RAW_LAYOUT_SHOULD_NOT_SHOW</p></body></html>',
    html: '',
    css: '',
    script: '',
  });

  return {
    projectSchemaVersion: 2,
    'Current Course': {
      name: 'Composer Fixture Course',
      modules,
      materials: [],
    },
    'Course Settings': {
      courseName: 'Composer Fixture Course',
      accentColor: 'sky',
      backgroundColor: 'slate-900',
      fontFamily: 'inter',
      customCSS: '',
      compilationDefaults: {
        includeMaterials: true,
        includeAssessments: true,
        includeToolkit: true,
        enableProgressTracking: true,
        enableComposer: true,
      },
    },
    'Global Toolkit': [],
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertLayoutSpans(html, label) {
  assert(html.includes(`data-composer-columns="${layoutFixture.maxColumns}"`), `${label} missing composer columns marker`);

  for (const activity of layoutFixture.activities) {
    assert(html.includes(activity.marker), `${label} missing layout marker: ${activity.marker}`);
    const spanPattern = new RegExp(
      `data-activity-id="${activity.id}"[\\s\\S]*?data-composer-col-span="${activity.colSpan}"`,
    );
    assert(spanPattern.test(html), `${label} missing expected colSpan=${activity.colSpan} for ${activity.id}`);
  }

  const order = layoutFixture.activities.map((activity) => html.indexOf(activity.marker));
  assert(order.every((idx) => idx >= 0), `${label} missing layout activity order markers`);
  assert(order[0] < order[1] && order[1] < order[2], `${label} layout activity order changed`);
}

function run() {
  const projectData = buildProjectWithFixtures();
  const filesMap = compileProjectToFilesMap({ projectData });

  for (let i = 0; i < activityFixtures.length; i += 1) {
    const fixture = activityFixtures[i];
    const moduleId = `view-fixture-${i + 1}`;
    const relPath = `modules/${moduleId}.html`;

    const exportHtml = filesMap[relPath];
    assert(typeof exportHtml === 'string' && exportHtml.length > 0, `Missing export HTML for ${moduleId}`);
    assert(exportHtml.includes(fixture.marker), `Export HTML missing marker for ${fixture.type}: ${fixture.marker}`);

    const previewHtml = compileModuleToHtml({ projectData, moduleId });
    assert(typeof previewHtml === 'string' && previewHtml.length > 0, `Missing preview HTML for ${moduleId}`);
    assert(previewHtml.includes(fixture.marker), `Preview HTML missing marker for ${fixture.type}: ${fixture.marker}`);
  }

  const layoutPath = `modules/${layoutFixture.moduleId}.html`;
  const layoutExportHtml = filesMap[layoutPath];
  assert(typeof layoutExportHtml === 'string' && layoutExportHtml.length > 0, `Missing export HTML for ${layoutFixture.moduleId}`);
  assertLayoutSpans(layoutExportHtml, 'Export HTML');

  const legacyHtml = buildLegacyCompiledHtml({ projectData });
  assert(typeof legacyHtml === 'string' && legacyHtml.length > 0, 'Missing legacy compiled HTML');
  assert(!legacyHtml.includes('RAW_SHOULD_NOT_SHOW'), 'Legacy HTML incorrectly used rawHtml for composer module');
  assert(!legacyHtml.includes('RAW_LAYOUT_SHOULD_NOT_SHOW'), 'Legacy HTML incorrectly used rawHtml for layout fixture module');
  for (let i = 0; i < activityFixtures.length; i += 1) {
    const fixture = activityFixtures[i];
    assert(
      legacyHtml.includes(fixture.marker),
      `Legacy HTML missing marker for ${fixture.type}: ${fixture.marker}`
    );
  }
  assertLayoutSpans(legacyHtml, 'Legacy HTML');

  const layoutPreviewHtml = compileModuleToHtml({ projectData, moduleId: layoutFixture.moduleId });
  assert(typeof layoutPreviewHtml === 'string' && layoutPreviewHtml.length > 0, `Missing preview HTML for ${layoutFixture.moduleId}`);
  assertLayoutSpans(layoutPreviewHtml, 'Preview HTML');

  console.log(`✅ COMPOSER FIXTURES OK (${activityFixtures.length} activity types)`);
}

try {
  run();
} catch (error) {
  console.error('❌ COMPOSER FIXTURES FAILED');
  console.error(error?.message || error);
  process.exit(1);
}
