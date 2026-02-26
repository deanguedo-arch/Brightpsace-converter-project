import * as React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Edit,
  FolderOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  createKnowledgeCheckBuilderQuestion,
  createWorksheetBuilderBlock,
  getActivityDefinition,
  listActivityTypeGroups,
  listActivityTypes,
  normalizeFillableChartData,
  normalizeKnowledgeCheckBuilderQuestions,
  normalizeWorksheetBuilderBlocks,
} from '../../composer/activityRegistry.js';
import {
  buildComposerGridModel,
  clampComposerColSpan,
  moveComposerActivityToCell,
  normalizeComposerActivities,
  normalizeComposerLayout,
} from '../../composer/layout.js';
import {
  applyTemplateLayoutProfile,
  captureTemplateLayoutProfile,
  cloneTemplateLayoutProfile,
  normalizeTemplateLayoutProfiles,
  resolveTemplateKey,
} from '../../composer/templateLayoutProfiles.js';
import { isComposerEnabled } from '../../utils/composer.js';
import { buildModuleFrameHTML, buildPreviewStorageScope } from '../../utils/generators.js';
import {
  FINLIT_CORE_TAB_IDS,
  createFinlitHeroFormState,
  createFinlitTemplateFormState,
  normalizeFinlitHeroForSave,
  normalizeFinlitTemplateForSave,
} from '../../utils/finlitHero.js';
import { resolveFinlitTabComposerState } from '../../utils/finlitTabActivities.js';
import GenericDataEditor from '../GenericDataEditor.jsx';
import HotspotEditor from '../composer/HotspotEditor.jsx';
import VaultBrowser from '../VaultBrowser.jsx';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { useEffect, useMemo, useRef, useState } = React;
const GridLayout = WidthProvider(ReactGridLayout);

function createActivity(type) {
  const def = getActivityDefinition(type);
  if (!def) return null;
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    data: def.createDefaultData ? def.createDefaultData() : {},
    layout: { colSpan: 1 },
  };
}

function escapeEditorHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RICH_EDITOR_FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial (System)' },
  { value: 'Helvetica', label: 'Helvetica (System)' },
  { value: 'Verdana', label: 'Verdana (System)' },
  { value: 'Tahoma', label: 'Tahoma (System)' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS (System)' },
  { value: 'Segoe UI', label: 'Segoe UI (System)' },
  { value: 'Georgia', label: 'Georgia (System)' },
  { value: 'Garamond', label: 'Garamond (System)' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype (System)' },
  { value: 'Times New Roman', label: 'Times New Roman (System)' },
  { value: 'Courier New', label: 'Courier New (System)' },
  { value: 'Lucida Console', label: 'Lucida Console (System)' },
  { value: 'Impact', label: 'Impact (System)' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS (System)' },
  { value: 'Inter', label: 'Inter (Web Font)' },
  { value: 'Roboto', label: 'Roboto (Web Font)' },
  { value: 'Open Sans', label: 'Open Sans (Web Font)' },
  { value: 'Lato', label: 'Lato (Web Font)' },
  { value: 'Montserrat', label: 'Montserrat (Web Font)' },
  { value: 'Poppins', label: 'Poppins (Web Font)' },
  { value: 'Raleway', label: 'Raleway (Web Font)' },
  { value: 'Nunito', label: 'Nunito (Web Font)' },
  { value: 'Playfair Display', label: 'Playfair Display (Web Font)' },
  { value: 'Merriweather', label: 'Merriweather (Web Font)' },
  { value: 'Oswald', label: 'Oswald (Web Font)' },
  { value: 'Bebas Neue', label: 'Bebas Neue (Web Font)' },
];

const BLOCK_THEME_OPTIONS = [
  { value: 'default', label: 'Default (Current Colors)' },
  { value: 'slate', label: 'Slate' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'forest', label: 'Forest' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'mono', label: 'Monochrome' },
];

const BLOCK_THEME_PREVIEW_COLORS = {
  default: { textColor: '#e2e8f0', containerBg: '#0f172a' },
  slate: { textColor: '#dbe3ee', containerBg: '#0f172a' },
  ocean: { textColor: '#dbeafe', containerBg: '#1e3a8a' },
  forest: { textColor: '#dcfce7', containerBg: '#14532d' },
  sunset: { textColor: '#ffedd5', containerBg: '#9a3412' },
  mono: { textColor: '#f8fafc', containerBg: '#111827' },
};

const MODULE_TEMPLATE_OPTIONS = [
  { value: '', label: 'Use Course Default' },
  { value: 'deck', label: 'Deck' },
  { value: 'finlit', label: 'FinLit' },
  { value: 'coursebook', label: 'Coursebook' },
  { value: 'toolkit_dashboard', label: 'Toolkit Dashboard' },
];

const MODULE_THEME_OPTIONS = [
  { value: '', label: 'Use Course Default' },
  { value: 'dark_cards', label: 'Dark Cards' },
  { value: 'finlit_clean', label: 'FinLit Clean' },
  { value: 'coursebook_light', label: 'Coursebook Light' },
  { value: 'toolkit_clean', label: 'Toolkit Clean' },
];

function normalizeThemeValue(value) {
  const raw = String(value || '').trim().toLowerCase();
  return BLOCK_THEME_OPTIONS.some((theme) => theme.value === raw) ? raw : 'default';
}

function getThemePreviewColors(themeValue) {
  return BLOCK_THEME_PREVIEW_COLORS[normalizeThemeValue(themeValue)] || BLOCK_THEME_PREVIEW_COLORS.default;
}

function normalizeColorInputValue(value, fallback = '#0f172a') {
  const raw = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
}

function normalizeEditorTabToken(value, fallback = 'tab') {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || fallback;
}

function extractRichEditorText(html) {
  const input = String(html || '');
  if (!input) return '';
  if (typeof document === 'undefined') {
    return input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\u00a0/g, ' ')
      .trim();
  }
  const container = document.createElement('div');
  container.innerHTML = input;
  return (container.innerText || container.textContent || '').replace(/\u00a0/g, ' ').trim();
}

function stripInlineRichFormatting(html) {
  const input = String(html || '');
  if (!input.trim()) return '';
  if (typeof document === 'undefined') {
    return input
      .replace(/<font\b[^>]*>/gi, '')
      .replace(/<\/font>/gi, '')
      .replace(/\sstyle\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\s(?:bgcolor|color|face|size)\s*=\s*(['"]).*?\1/gi, '');
  }
  const template = document.createElement('template');
  template.innerHTML = input;
  const fontNodes = Array.from(template.content.querySelectorAll('font'));
  fontNodes.forEach((fontNode) => {
    const parent = fontNode.parentNode;
    if (!parent) return;
    while (fontNode.firstChild) {
      parent.insertBefore(fontNode.firstChild, fontNode);
    }
    parent.removeChild(fontNode);
  });
  Array.from(template.content.querySelectorAll('*')).forEach((node) => {
    node.removeAttribute('style');
    node.removeAttribute('bgcolor');
    node.removeAttribute('color');
    node.removeAttribute('face');
    node.removeAttribute('size');
  });
  return template.innerHTML;
}

function normalizeDeleteContentText(value) {
  return extractRichEditorText(value).replace(/\s+/g, ' ').trim();
}

function hasActivityUserContent(currentValue, defaultValue) {
  if (typeof currentValue === 'string') {
    const normalizedCurrent = normalizeDeleteContentText(currentValue);
    if (!normalizedCurrent) return false;
    const normalizedDefault = typeof defaultValue === 'string' ? normalizeDeleteContentText(defaultValue) : '';
    return normalizedCurrent !== normalizedDefault;
  }
  if (Array.isArray(currentValue)) {
    const defaultList = Array.isArray(defaultValue) ? defaultValue : [];
    return currentValue.some((item, idx) => hasActivityUserContent(item, defaultList[idx]));
  }
  if (currentValue && typeof currentValue === 'object') {
    const defaultObject = defaultValue && typeof defaultValue === 'object' ? defaultValue : {};
    return Object.keys(currentValue).some((key) => hasActivityUserContent(currentValue[key], defaultObject[key]));
  }
  return false;
}

function activityRequiresDeleteConfirmation(activity) {
  if (!activity || typeof activity !== 'object') return false;
  const definition = getActivityDefinition(activity.type);
  if (!definition) return false;
  const currentData = activity.data && typeof activity.data === 'object' ? activity.data : {};
  const defaultData = definition.createDefaultData ? definition.createDefaultData() : {};
  return hasActivityUserContent(currentData, defaultData);
}

function extractMaterialImageAsset(material) {
  if (!material || typeof material !== 'object') return null;
  const imagePattern = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i;
  const candidates = [material.viewUrl, material.downloadUrl].map((value) => String(value || '').trim()).filter(Boolean);
  const url = candidates.find((value) => imagePattern.test(value) || /^data:image\//i.test(value));
  if (!url) return null;
  return {
    id: material.id,
    url,
    label: material.title || material.number || material.id || 'Image asset',
    alt: material.title || material.number || '',
  };
}

function getActivityRichEditorConfig(activity) {
  const type = activity?.type || '';
  if (type === 'content_block') {
    return {
      modeKey: 'bodyMode',
      htmlKey: 'bodyHtml',
      textKey: 'body',
      plainLabel: 'Body',
      titleInputLabel: 'Section Title',
      titleInputKey: 'title',
      plainRowsClass: 'h-40',
    };
  }
  if (type === 'title_block') {
    return {
      modeKey: 'textMode',
      htmlKey: 'textHtml',
      textKey: 'text',
      plainLabel: 'Title Text',
      titleInputLabel: null,
      titleInputKey: null,
      plainRowsClass: 'h-28',
    };
  }
  return null;
}

const RUBRIC_MIN_SIZE = 2;
const RUBRIC_MAX_SIZE = 5;

function clampRubricDimension(value, fallback = 3) {
  const parsed = Number.parseInt(value, 10);
  const base = Number.isFinite(parsed) ? parsed : Number.parseInt(fallback, 10);
  const normalized = Number.isFinite(base) ? base : 3;
  return Math.max(RUBRIC_MIN_SIZE, Math.min(RUBRIC_MAX_SIZE, normalized));
}

function getDefaultRubricColumns(count) {
  const safeCount = clampRubricDimension(count, 3);
  const presets = {
    2: [
      { label: 'Strong', score: 2 },
      { label: 'Needs Work', score: 1 },
    ],
    3: [
      { label: 'Exceeds', score: 3 },
      { label: 'Meets', score: 2 },
      { label: 'Developing', score: 1 },
    ],
    4: [
      { label: 'Exemplary', score: 4 },
      { label: 'Proficient', score: 3 },
      { label: 'Developing', score: 2 },
      { label: 'Beginning', score: 1 },
    ],
    5: [
      { label: 'Mastery', score: 5 },
      { label: 'Advanced', score: 4 },
      { label: 'Proficient', score: 3 },
      { label: 'Developing', score: 2 },
      { label: 'Beginning', score: 1 },
    ],
  };
  return (presets[safeCount] || presets[3]).map((column) => ({ ...column }));
}

function normalizeRubricData(data, rowValue, colValue) {
  const rowCount = clampRubricDimension(rowValue ?? data?.rowCount ?? data?.rows?.length ?? 3, 3);
  const colCount = clampRubricDimension(colValue ?? data?.colCount ?? data?.columns?.length ?? 3, 3);
  const fallbackColumns = getDefaultRubricColumns(colCount);
  const rows = Array.from({ length: rowCount }, (_, rowIdx) => {
    const raw = Array.isArray(data?.rows) ? data.rows[rowIdx] : null;
    const fallback = `Criterion ${rowIdx + 1}`;
    return {
      label: String(raw?.label || fallback).trim() || fallback,
    };
  });
  const columns = Array.from({ length: colCount }, (_, colIdx) => {
    const raw = Array.isArray(data?.columns) ? data.columns[colIdx] : null;
    const fallback = fallbackColumns[colIdx] || { label: `Level ${colIdx + 1}`, score: colCount - colIdx };
    const parsedScore = Number.parseFloat(raw?.score);
    return {
      label: String(raw?.label || fallback.label).trim() || fallback.label,
      score: Number.isFinite(parsedScore) ? parsedScore : fallback.score,
    };
  });
  const cells = rows.map((row, rowIdx) =>
    columns.map((column, colIdx) => {
      const raw = Array.isArray(data?.cells) && Array.isArray(data.cells[rowIdx]) ? data.cells[rowIdx][colIdx] : '';
      const fallback = `Describe "${column.label}" for ${row.label.toLowerCase()}.`;
      return String(raw || fallback);
    }),
  );
  return {
    rowCount,
    colCount,
    rows,
    columns,
    cells,
    selfScoringEnabled: data?.selfScoringEnabled !== false,
  };
}

function reorderByIndex(items, fromIndex, toIndex) {
  if (!Array.isArray(items)) return [];
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return [...items];
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return [...items];
  if (fromIndex === toIndex) return [...items];
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function EditModal({
  editingModule,
  editForm,
  setEditForm,
  setEditingModule,
  projectData,
  saveEditModule,
  moduleHistory,
  setModuleHistory,
  revertModuleVersion,
}) {
  const composerEnabled = isComposerEnabled(projectData);
  const standaloneMode = editForm.moduleMode || 'custom_html';
  const canUseComposer = composerEnabled || standaloneMode === 'composer';
  const finlitHero = useMemo(() => createFinlitHeroFormState(editForm.hero), [editForm.hero]);
  const finlitSettings = useMemo(() => createFinlitTemplateFormState(editForm.finlit), [editForm.finlit]);
  const courseTemplateDefault = String(projectData?.['Course Settings']?.templateDefault || 'deck').trim().toLowerCase();
  const editEffectiveTemplate = String(editForm.template || courseTemplateDefault || 'deck').trim().toLowerCase();
  const showFinlitOptions = editForm.moduleType === 'standalone' && standaloneMode === 'composer' && editEffectiveTemplate === 'finlit';
  const isFinlitComposer = showFinlitOptions;
  const [finlitAuthoringTabId, setFinlitAuthoringTabId] = useState('activities');
  const composerLayout = useMemo(() => normalizeComposerLayout(editForm.composerLayout), [editForm.composerLayout]);
  const composerMaxColumns = composerLayout.maxColumns;
  const composerLayoutMode = composerLayout.mode;
  const isCanvasMode = composerLayoutMode === 'canvas';
  const activities = useMemo(
    () => normalizeComposerActivities(editForm.activities, { maxColumns: composerMaxColumns, mode: composerLayout.mode }),
    [editForm.activities, composerLayout.mode, composerMaxColumns],
  );
  const resolvedFinlitComposerState = useMemo(
    () =>
      resolveFinlitTabComposerState({
        finlit: finlitSettings,
        moduleActivities: activities,
        composerLayout,
        activeTabId: finlitAuthoringTabId,
        activeTabActivities: activities,
      }),
    [activities, composerLayout, finlitAuthoringTabId, finlitSettings],
  );
  const canonicalComposerActivities = useMemo(
    () =>
      Array.isArray(resolvedFinlitComposerState?.canonicalActivities)
        ? resolvedFinlitComposerState.canonicalActivities
        : [],
    [resolvedFinlitComposerState],
  );
  const activeFinlitTabId = useMemo(
    () => (isFinlitComposer ? resolvedFinlitComposerState?.activeTabId || 'activities' : 'activities'),
    [isFinlitComposer, resolvedFinlitComposerState],
  );
  const finlitLinkableActivities = useMemo(
    () =>
      (isFinlitComposer ? canonicalComposerActivities : activities)
        .map((activity) => {
          const id = String(activity?.id || '').trim();
          if (!id || activity?.type === 'tab_group') return null;
          const definition = getActivityDefinition(activity?.type);
          const rawLabel = activity?.data?.title || activity?.data?.text || definition?.label || id;
          const label = String(rawLabel || '').trim() || id;
          return {
            id,
            type: activity?.type || '',
            label,
          };
        })
        .filter(Boolean),
    [activities, canonicalComposerActivities, isFinlitComposer],
  );
  const normalizedTemplateLayoutProfiles = useMemo(
    () =>
      normalizeTemplateLayoutProfiles(editForm.templateLayoutProfiles, {
        activities: isFinlitComposer ? canonicalComposerActivities : activities,
      }),
    [activities, canonicalComposerActivities, editForm.templateLayoutProfiles, isFinlitComposer],
  );
  const activityTypes = useMemo(() => listActivityTypes(), []);
  const activityTypeGroups = useMemo(() => listActivityTypeGroups(), []);
  const moduleBankMaterials = useMemo(
    () =>
      ((projectData?.['Current Course']?.materials || [])
        .filter((mat) => !mat.hidden)
        .sort((a, b) => (a.order || 0) - (b.order || 0))),
    [projectData],
  );
  const moduleBankImageAssets = useMemo(
    () => moduleBankMaterials.map(extractMaterialImageAsset).filter(Boolean),
    [moduleBankMaterials],
  );
  const availableAssessments = useMemo(() => {
    const modules = projectData?.['Current Course']?.modules || [];
    return modules
      .flatMap((mod) => (mod.assessments || []).map((assessment) => ({ ...assessment, moduleId: mod.id, moduleTitle: mod.title })))
      .filter((assessment) => !assessment.hidden);
  }, [projectData]);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [draggingActivityIndex, setDraggingActivityIndex] = useState(null);
  const [dragOverActivityIndex, setDragOverActivityIndex] = useState(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState(null);
  const [composerExtraRows, setComposerExtraRows] = useState(0);
  const [newActivityType, setNewActivityType] = useState(activityTypes[0] || 'content_block');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedImageMaterialId, setSelectedImageMaterialId] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [draggingKnowledgeQuestionIndex, setDraggingKnowledgeQuestionIndex] = useState(null);
  const [dragOverKnowledgeQuestionIndex, setDragOverKnowledgeQuestionIndex] = useState(null);
  const [draggingWorksheetBlockIndex, setDraggingWorksheetBlockIndex] = useState(null);
  const [dragOverWorksheetBlockIndex, setDragOverWorksheetBlockIndex] = useState(null);
  const [composerPreviewNonce, setComposerPreviewNonce] = useState(0);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTargetField, setVaultTargetField] = useState(null);
  const richEditorRef = useRef(null);
  const richEditorSelectionRef = useRef(null);
  const richEditorUpdateTimerRef = useRef(null);
  const composerPreviewIframeRef = useRef(null);
  const composerPreviewTargetActivityIdRef = useRef('');
  const composerPreviewShouldFollowRef = useRef(false);
  const composerGridModel = useMemo(
    () =>
      buildComposerGridModel(activities, composerMaxColumns, {
        includeTrailingRow: true,
        trailingRows: composerExtraRows,
      }),
    [activities, composerExtraRows, composerMaxColumns],
  );
  const composerPlacementsByIndex = useMemo(
    () => new Map(composerGridModel.placements.map((placement) => [placement.index, placement])),
    [composerGridModel],
  );

  useEffect(() => {
    setSelectedActivityIndex(0);
    setComposerExtraRows(0);
    setFinlitAuthoringTabId('activities');
  }, [editingModule, standaloneMode]);

  useEffect(() => {
    setDraggingActivityIndex(null);
    setDragOverActivityIndex(null);
    setDragOverSlotKey(null);
    setDraggingKnowledgeQuestionIndex(null);
    setDragOverKnowledgeQuestionIndex(null);
    setDraggingWorksheetBlockIndex(null);
    setDragOverWorksheetBlockIndex(null);
  }, [editingModule, standaloneMode, activities.length]);

  useEffect(() => {
    if (selectedActivityIndex > activities.length - 1) {
      setSelectedActivityIndex(Math.max(activities.length - 1, 0));
    }
  }, [activities.length, selectedActivityIndex]);

  useEffect(() => {
    if (!isFinlitComposer) {
      if (finlitAuthoringTabId !== 'activities') {
        setFinlitAuthoringTabId('activities');
      }
      return;
    }
    const nextTabId = String(resolvedFinlitComposerState?.activeTabId || 'activities').trim() || 'activities';
    if (nextTabId !== finlitAuthoringTabId) {
      setFinlitAuthoringTabId(nextTabId);
    }
    const nextTabsSignature = JSON.stringify(resolvedFinlitComposerState?.finlit?.tabs || []);
    const currentTabsSignature = JSON.stringify(finlitSettings?.tabs || []);
    const nextActivities = Array.isArray(resolvedFinlitComposerState?.activeTabActivities)
      ? resolvedFinlitComposerState.activeTabActivities
      : [];
    const nextActivitiesSignature = JSON.stringify(nextActivities);
    const currentActivitiesSignature = JSON.stringify(activities);
    if (nextTabsSignature === currentTabsSignature && nextActivitiesSignature === currentActivitiesSignature) return;
    setEditForm((prev) => {
      const prevFinlit = createFinlitTemplateFormState(prev.finlit);
      const prevActivities = normalizeComposerActivities(prev.activities, {
        maxColumns: composerMaxColumns,
        mode: composerLayout.mode,
      });
      if (
        JSON.stringify(prevFinlit?.tabs || []) === nextTabsSignature &&
        JSON.stringify(prevActivities) === nextActivitiesSignature
      ) {
        return prev;
      }
      return {
        ...prev,
        finlit: resolvedFinlitComposerState.finlit,
        activities: nextActivities,
      };
    });
  }, [
    activities,
    composerLayout.mode,
    composerMaxColumns,
    finlitAuthoringTabId,
    finlitSettings,
    isFinlitComposer,
    resolvedFinlitComposerState,
    setEditForm,
  ]);

  useEffect(
    () => () => {
      if (richEditorUpdateTimerRef.current) {
        clearTimeout(richEditorUpdateTimerRef.current);
        richEditorUpdateTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedMaterialId && moduleBankMaterials.length > 0) {
      setSelectedMaterialId(moduleBankMaterials[0].id);
    }
  }, [moduleBankMaterials, selectedMaterialId]);

  useEffect(() => {
    if (moduleBankImageAssets.length === 0) {
      if (selectedImageMaterialId) setSelectedImageMaterialId('');
      return;
    }
    if (!selectedImageMaterialId || !moduleBankImageAssets.some((asset) => asset.id === selectedImageMaterialId)) {
      setSelectedImageMaterialId(moduleBankImageAssets[0].id);
    }
  }, [moduleBankImageAssets, selectedImageMaterialId]);

  useEffect(() => {
    if (!selectedAssessmentId && availableAssessments.length > 0) {
      setSelectedAssessmentId(availableAssessments[0].id);
    }
  }, [availableAssessments, selectedAssessmentId]);

  useEffect(() => {
    if (standaloneMode !== 'composer') return;
    setComposerPreviewNonce((n) => n + 1);
  }, [editingModule, standaloneMode]);

  const selectedActivity = activities[selectedActivityIndex] || null;
  const selectedPlacement = selectedActivity ? composerPlacementsByIndex.get(selectedActivityIndex) || null : null;

  useEffect(() => {
    if (richEditorUpdateTimerRef.current) {
      clearTimeout(richEditorUpdateTimerRef.current);
      richEditorUpdateTimerRef.current = null;
    }
  }, [selectedActivityIndex, standaloneMode]);

  useEffect(() => {
    const editor = richEditorRef.current;
    const richConfig = getActivityRichEditorConfig(selectedActivity);
    if (!editor || !selectedActivity || !richConfig) return;
    const data = selectedActivity.data || {};
    const bodyMode = data[richConfig.modeKey] === 'plain' ? 'plain' : 'rich';
    if (bodyMode !== 'rich') return;
    const nextHtml = data[richConfig.htmlKey] || escapeEditorHtml(data[richConfig.textKey] || '').replace(/\n/g, '<br>');
    if (document.activeElement !== editor && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [
    selectedActivity?.id,
    selectedActivity?.type,
    selectedActivity?.data?.bodyMode,
    selectedActivity?.data?.bodyHtml,
    selectedActivity?.data?.body,
    selectedActivity?.data?.textMode,
    selectedActivity?.data?.textHtml,
    selectedActivity?.data?.text,
  ]);

  const composerPreviewStorageScope = useMemo(
    () => buildPreviewStorageScope('phase1-edit-composer-preview', editForm.id || editForm.title || 'composer'),
    [editForm.id, editForm.title],
  );

  const composerPreviewSrcDoc = useMemo(() => {
    if (standaloneMode !== 'composer') return '';
    const courseSettings = projectData?.['Course Settings'] || {};
    const resolvedFinlitState = resolveFinlitTabComposerState({
      finlit: finlitSettings,
      moduleActivities: activities,
      composerLayout,
      activeTabId: finlitAuthoringTabId,
      activeTabActivities: activities,
    });
    const hero = normalizeFinlitHeroForSave(finlitHero);
    const finlit = normalizeFinlitTemplateForSave(resolvedFinlitState.finlit);
    const previewActivities =
      isFinlitComposer && Array.isArray(resolvedFinlitState.canonicalActivities)
        ? resolvedFinlitState.canonicalActivities
        : activities;
    const previewModule = {
      id: editForm.id || 'view-composer-preview',
      title: editForm.title || 'Composer Preview',
      type: 'standalone',
      mode: 'composer',
      template: editForm.template || null,
      theme: editForm.theme || null,
      hero,
      finlit,
      composerLayout,
      activities: previewActivities,
      ...(isFinlitComposer ? { finlitActiveTabId: resolvedFinlitState.activeTabId } : {}),
      rawHtml: '',
      html: '',
      css: '',
      script: '',
    };
    return (
      buildModuleFrameHTML(previewModule, {
        ...courseSettings,
        __courseName: courseSettings.courseName || projectData?.['Current Course']?.name || 'Course',
        __toolkit: projectData?.['Global Toolkit'] || [],
        __materials: projectData?.['Current Course']?.materials || [],
        __storageScope: composerPreviewStorageScope,
      }) || ''
    );
  }, [
    activities,
    composerLayout,
    composerPreviewStorageScope,
    editForm.id,
    editForm.template,
    editForm.theme,
    editForm.title,
    finlitAuthoringTabId,
    finlitHero,
    finlitSettings,
    isFinlitComposer,
    projectData,
    standaloneMode,
  ]);

  const scrollComposerPreviewToActivity = React.useCallback(
    (activityId) => {
      const targetId = String(activityId || '').trim();
      if (!targetId) return false;
      const iframe = composerPreviewIframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc) return false;
      const escapedActivityId = targetId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const activeTabId = isFinlitComposer ? String(activeFinlitTabId || '').trim() : '';
      let panelRoot = doc;
      if (activeTabId) {
        const escapedTabId = activeTabId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const trigger = doc.querySelector(`[data-finlit-tab-trigger="${escapedTabId}"]`);
        if (trigger instanceof HTMLElement) {
          trigger.click();
        }
        const panel = doc.querySelector(`[data-finlit-tab-panel="${escapedTabId}"]`);
        if (panel) {
          panelRoot = panel;
        }
      }
      const targetInPanel = panelRoot.querySelector?.(`[data-activity-id="${escapedActivityId}"]`) || null;
      if (targetInPanel && typeof targetInPanel.scrollIntoView === 'function') {
        targetInPanel.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      }
      const fallbackTarget = doc.querySelector(`[data-activity-id="${escapedActivityId}"]`);
      if (!fallbackTarget || typeof fallbackTarget.scrollIntoView !== 'function') return false;
      fallbackTarget.scrollIntoView({ block: 'center', inline: 'nearest' });
      return true;
    },
    [activeFinlitTabId, isFinlitComposer],
  );

  useEffect(() => {
    composerPreviewTargetActivityIdRef.current = String(selectedActivity?.id || '').trim();
  }, [selectedActivity?.id]);

  useEffect(() => {
    if (standaloneMode !== 'composer') {
      composerPreviewShouldFollowRef.current = false;
      return;
    }
    composerPreviewShouldFollowRef.current = true;
  }, [standaloneMode, selectedActivity?.id]);

  useEffect(() => {
    if (standaloneMode !== 'composer') return;
    if (!composerPreviewShouldFollowRef.current) return;
    const targetId = String(selectedActivity?.id || '').trim();
    if (!targetId) return;
    const timer = setTimeout(() => {
      if (scrollComposerPreviewToActivity(targetId)) {
        composerPreviewShouldFollowRef.current = false;
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [composerPreviewSrcDoc, selectedActivity?.id, scrollComposerPreviewToActivity, standaloneMode]);

  const buildTemplateLayoutProfilesForComposerState = ({
    templateOverride = editForm.template,
    nextComposerLayout = composerLayout,
    nextActivities = isFinlitComposer ? canonicalComposerActivities : activities,
    templateProfiles = normalizedTemplateLayoutProfiles,
  } = {}) => {
    const resolvedTemplateKey = resolveTemplateKey(templateOverride, courseTemplateDefault);
    const capturedProfile = captureTemplateLayoutProfile(nextComposerLayout, nextActivities);
    return normalizeTemplateLayoutProfiles(
      {
        ...(templateProfiles && typeof templateProfiles === 'object' ? templateProfiles : {}),
        [resolvedTemplateKey]: capturedProfile,
      },
      { activities: nextActivities },
    );
  };

  const updateActivities = (nextActivities, nextComposerLayout = composerLayout, { templateOverride = editForm.template } = {}) => {
    const normalizedLayout = normalizeComposerLayout(nextComposerLayout);
    const targetTemplateKey = resolveTemplateKey(templateOverride, courseTemplateDefault);
    const shouldSyncFinlit = editForm.moduleType === 'standalone' && standaloneMode === 'composer' && targetTemplateKey === 'finlit';
    let normalizedActivities = normalizeComposerActivities(nextActivities, {
      maxColumns: normalizedLayout.maxColumns,
      mode: normalizedLayout.mode,
    });
    let nextFinlitState = finlitSettings;
    let nextFinlitAuthoringTabId = finlitAuthoringTabId;
    let profileActivities = normalizedActivities;
    if (shouldSyncFinlit) {
      const resolved = resolveFinlitTabComposerState({
        finlit: finlitSettings,
        moduleActivities: activities,
        composerLayout: normalizedLayout,
        activeTabId: finlitAuthoringTabId,
        activeTabActivities: normalizedActivities,
      });
      nextFinlitState = resolved.finlit;
      nextFinlitAuthoringTabId = resolved.activeTabId;
      profileActivities = Array.isArray(resolved.canonicalActivities) ? resolved.canonicalActivities : normalizedActivities;
      normalizedActivities = Array.isArray(resolved.activeTabActivities) ? resolved.activeTabActivities : normalizedActivities;
    }
    const nextTemplateLayoutProfiles = buildTemplateLayoutProfilesForComposerState({
      templateOverride,
      nextComposerLayout: normalizedLayout,
      nextActivities: profileActivities,
    });
    composerPreviewShouldFollowRef.current = true;
    setEditForm((prev) => ({
      ...prev,
      moduleMode: 'composer',
      composerLayout: normalizedLayout,
      activities: normalizedActivities,
      ...(shouldSyncFinlit ? { finlit: nextFinlitState } : {}),
      templateLayoutProfiles: nextTemplateLayoutProfiles,
    }));
    if (shouldSyncFinlit && nextFinlitAuthoringTabId !== finlitAuthoringTabId) {
      setFinlitAuthoringTabId(nextFinlitAuthoringTabId);
    }
  };

  const handleTemplateChange = (nextTemplateOverrideRaw) => {
    const nextTemplateOverride = String(nextTemplateOverrideRaw || '').trim() || null;
    if (standaloneMode !== 'composer') {
      setEditForm((prev) => ({ ...prev, template: nextTemplateOverride }));
      return;
    }

    const currentTemplateKey = resolveTemplateKey(editForm.template, courseTemplateDefault);
    const nextTemplateKey = resolveTemplateKey(nextTemplateOverride, courseTemplateDefault);
    const isCurrentFinlitComposer = currentTemplateKey === 'finlit';
    const isNextFinlitComposer = nextTemplateKey === 'finlit';
    let templateSourceActivities = activities;
    let templateSourceFinlit = finlitSettings;
    if (isCurrentFinlitComposer) {
      const resolvedCurrentFinlit = resolveFinlitTabComposerState({
        finlit: finlitSettings,
        moduleActivities: activities,
        composerLayout,
        activeTabId: finlitAuthoringTabId,
        activeTabActivities: activities,
      });
      templateSourceFinlit = resolvedCurrentFinlit.finlit;
      if (!isNextFinlitComposer && Array.isArray(resolvedCurrentFinlit.canonicalActivities)) {
        templateSourceActivities = resolvedCurrentFinlit.canonicalActivities;
      }
    }
    const activeProfile = captureTemplateLayoutProfile(composerLayout, templateSourceActivities);
    const baseProfiles = normalizeTemplateLayoutProfiles(editForm.templateLayoutProfiles, { activities: templateSourceActivities });
    const profilesWithCurrent = normalizeTemplateLayoutProfiles(
      {
        ...(baseProfiles && typeof baseProfiles === 'object' ? baseProfiles : {}),
        [currentTemplateKey]: activeProfile,
      },
      { activities: templateSourceActivities },
    );
    const targetProfileSource =
      profilesWithCurrent[nextTemplateKey] || profilesWithCurrent[currentTemplateKey] || activeProfile;
    const targetProfile = cloneTemplateLayoutProfile(targetProfileSource);
    const profilesWithTarget = normalizeTemplateLayoutProfiles(
      {
        ...(profilesWithCurrent && typeof profilesWithCurrent === 'object' ? profilesWithCurrent : {}),
        [nextTemplateKey]: targetProfile,
      },
      { activities: templateSourceActivities },
    );
    const applied = applyTemplateLayoutProfile(
      templateSourceActivities,
      targetProfile,
      composerLayout.mode,
      composerLayout.maxColumns,
    );
    const nextTemplateLayoutProfiles = buildTemplateLayoutProfilesForComposerState({
      templateOverride: nextTemplateOverride,
      nextComposerLayout: applied.composerLayout,
      nextActivities: applied.activities,
      templateProfiles: profilesWithTarget,
    });
    let nextFinlit = templateSourceFinlit;
    let nextActivities = applied.activities;
    let nextAuthoringTabId = finlitAuthoringTabId;
    if (!isCurrentFinlitComposer && isNextFinlitComposer) {
      const resolvedIntoFinlit = resolveFinlitTabComposerState({
        finlit: finlitSettings,
        moduleActivities: applied.activities,
        composerLayout: applied.composerLayout,
        activeTabId: 'activities',
        activeTabActivities: applied.activities,
      });
      nextFinlit = resolvedIntoFinlit.finlit;
      nextAuthoringTabId = resolvedIntoFinlit.activeTabId;
      nextActivities = Array.isArray(resolvedIntoFinlit.activeTabActivities)
        ? resolvedIntoFinlit.activeTabActivities
        : nextActivities;
    } else if (isCurrentFinlitComposer && isNextFinlitComposer) {
      const resolvedStayFinlit = resolveFinlitTabComposerState({
        finlit: templateSourceFinlit,
        moduleActivities: activities,
        composerLayout: applied.composerLayout,
        activeTabId: finlitAuthoringTabId,
        activeTabActivities: applied.activities,
      });
      nextFinlit = resolvedStayFinlit.finlit;
      nextAuthoringTabId = resolvedStayFinlit.activeTabId;
      nextActivities = Array.isArray(resolvedStayFinlit.activeTabActivities)
        ? resolvedStayFinlit.activeTabActivities
        : nextActivities;
    } else if (isCurrentFinlitComposer && !isNextFinlitComposer) {
      nextAuthoringTabId = 'activities';
    }
    composerPreviewShouldFollowRef.current = false;
    setEditForm((prev) => ({
      ...prev,
      template: nextTemplateOverride,
      moduleMode: 'composer',
      finlit: nextFinlit,
      composerLayout: applied.composerLayout,
      activities: nextActivities,
      templateLayoutProfiles: nextTemplateLayoutProfiles,
    }));
    setFinlitAuthoringTabId(nextAuthoringTabId);
    setSelectedActivityIndex((prev) => {
      const maxIndex = Math.max(0, nextActivities.length - 1);
      return Math.max(0, Math.min(maxIndex, Number.parseInt(prev, 10) || 0));
    });
  };

  const updateComposerMaxColumns = (nextColumns) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(editForm.composerLayout || {}),
      maxColumns: nextColumns,
    });
    const normalizedActivities = normalizeComposerActivities(activities, {
      maxColumns: normalizedLayout.maxColumns,
      mode: normalizedLayout.mode,
    });
    updateActivities(normalizedActivities, normalizedLayout);
  };

  const updateComposerLayoutMode = (nextMode) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(editForm.composerLayout || {}),
      mode: nextMode,
    });
    updateActivities(activities, normalizedLayout);
  };

  const updateComposerCanvasMetric = (key, value) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(editForm.composerLayout || {}),
      [key]: value,
    });
    updateActivities(activities, normalizedLayout);
  };

  const updateComposerSimpleMatchTallestRow = (enabled) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(editForm.composerLayout || {}),
      simpleMatchTallestRow: enabled === true,
    });
    updateActivities(activities, normalizedLayout);
  };

  const updateSelectedActivityMeta = (metaKey, updates) => {
    if (!selectedActivity) return;
    const nextActivities = activities.map((activity, idx) =>
      idx === selectedActivityIndex
        ? {
            ...activity,
            [metaKey]: {
              ...((activity && typeof activity === 'object' ? activity[metaKey] : {}) || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateActivities(nextActivities);
  };

  const updateSelectedActivityCanvasLayout = (updates) => {
    if (!selectedActivity) return;
    const nextActivities = activities.map((activity, idx) =>
      idx === selectedActivityIndex
        ? {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateActivities(nextActivities);
  };

  const applyCanvasGridLayout = (layoutItems) => {
    if (!Array.isArray(layoutItems)) return;
    const nextActivities = activities.map((activity, idx) => {
      const match = layoutItems.find((item) => String(item.i) === String(idx));
      if (!match) return activity;
      const nextW = Math.max(1, Number.parseInt(match.w, 10) || 1);
      return {
        ...activity,
        layout: {
          ...(activity.layout || {}),
          x: Number.parseInt(match.x, 10) || 0,
          y: Number.parseInt(match.y, 10) || 0,
          w: nextW,
          h: Math.max(1, Number.parseInt(match.h, 10) || 1),
          colSpan: nextW,
        },
      };
    });
    updateActivities(nextActivities);
  };

  const updateSelectedActivityData = (updates) => {
    if (!selectedActivity) return;
    const nextActivities = activities.map((activity, idx) =>
      idx === selectedActivityIndex
        ? {
            ...activity,
            data: {
              ...(activity.data || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateActivities(nextActivities);
  };

  const clearPendingRichEditorUpdate = () => {
    if (!richEditorUpdateTimerRef.current) return;
    clearTimeout(richEditorUpdateTimerRef.current);
    richEditorUpdateTimerRef.current = null;
  };

  const getSelectedRichStyleResetPayload = () => {
    if (!selectedActivity) return null;
    const richConfig = getActivityRichEditorConfig(selectedActivity);
    if (!richConfig) return null;
    const data = selectedActivity.data || {};
    const bodyMode = data[richConfig.modeKey] === 'plain' ? 'plain' : 'rich';
    if (bodyMode !== 'rich') return null;
    const sourceHtml = data[richConfig.htmlKey] || escapeEditorHtml(data[richConfig.textKey] || '').replace(/\n/g, '<br>');
    const cleanedHtml = stripInlineRichFormatting(sourceHtml);
    const cleanedText = extractRichEditorText(cleanedHtml);
    return { richConfig, cleanedHtml, cleanedText };
  };

  const resetSelectedActivityBodyStyle = () => {
    if (!selectedActivity) return;
    const payload = getSelectedRichStyleResetPayload();
    const updates = { bodyContainerBg: '' };
    if (payload) {
      clearPendingRichEditorUpdate();
      if (richEditorRef.current) {
        richEditorRef.current.innerHTML = payload.cleanedHtml;
      }
      updates[payload.richConfig.modeKey] = 'rich';
      updates[payload.richConfig.htmlKey] = payload.cleanedHtml;
      updates[payload.richConfig.textKey] = payload.cleanedText;
    }
    updateSelectedActivityData(updates);
  };

  const resetSelectedActivityStyle = () => {
    if (!selectedActivity) return;
    const payload = getSelectedRichStyleResetPayload();
    const updates = {
      blockTheme: 'default',
      blockFontFamily: '',
      blockTextColor: '',
      blockContainerBg: '',
      bodyContainerBg: '',
    };
    if (payload) {
      clearPendingRichEditorUpdate();
      if (richEditorRef.current) {
        richEditorRef.current.innerHTML = payload.cleanedHtml;
      }
      updates[payload.richConfig.modeKey] = 'rich';
      updates[payload.richConfig.htmlKey] = payload.cleanedHtml;
      updates[payload.richConfig.textKey] = payload.cleanedText;
    }
    updateSelectedActivityData(updates);
  };

  const replaceSelectedActivityData = (nextData) => {
    if (!selectedActivity) return;
    const nextActivities = activities.map((activity, idx) =>
      idx === selectedActivityIndex
        ? {
            ...activity,
            data: nextData && typeof nextData === 'object' ? nextData : {},
          }
        : activity,
    );
    updateActivities(nextActivities);
  };

  const addActivity = () => {
    const activity = createActivity(newActivityType);
    if (!activity) return;
    const maxRow = composerGridModel.placements.reduce((largest, placement) => Math.max(largest, placement.row), 0);
    if (isCanvasMode) {
      const maxY = activities.reduce((largest, item) => Math.max(largest, Number(item?.layout?.y) || 0), 0);
      activity.layout = {
        ...(activity.layout || {}),
        colSpan: clampComposerColSpan(activity?.layout?.colSpan, composerMaxColumns),
        x: 0,
        y: maxY + 1,
        w: 1,
        h: 4,
      };
    } else {
      activity.layout = {
        ...(activity.layout || {}),
        colSpan: clampComposerColSpan(activity?.layout?.colSpan, composerMaxColumns),
        row: Math.max(1, maxRow + 1),
        col: 1,
      };
    }
    const nextActivities = [...activities, activity];
    updateActivities(nextActivities);
    setSelectedActivityIndex(nextActivities.length - 1);
  };

  const addEmptyRow = () => {
    if (!isCanvasMode && selectedPlacement) {
      const insertAfterRow = Math.max(1, Number.parseInt(selectedPlacement.row, 10) || 1);
      let changed = false;
      const nextActivities = activities.map((activity, idx) => {
        const placement = composerPlacementsByIndex.get(idx);
        if (!placement || placement.row <= insertAfterRow) return activity;
        changed = true;
        return {
          ...activity,
          layout: {
            ...(activity.layout || {}),
            row: placement.row + 1,
          },
        };
      });
      if (changed) {
        updateActivities(nextActivities);
        return;
      }
    }
    setComposerExtraRows((count) => Math.min(50, count + 1));
  };

  const removeEmptyRowAt = (targetRow) => {
    if (isCanvasMode) return;
    const row = Math.max(1, Number.parseInt(targetRow, 10) || 1);

    let changed = false;
    const nextActivities = activities.map((activity, idx) => {
      const placement = composerPlacementsByIndex.get(idx);
      if (!placement || placement.row <= row) return activity;
      changed = true;
      return {
        ...activity,
        layout: {
          ...(activity.layout || {}),
          row: Math.max(1, placement.row - 1),
        },
      };
    });

    if (changed) {
      updateActivities(nextActivities);
      return;
    }

    const maxRow = composerGridModel.placements.reduce((largest, placement) => Math.max(largest, placement.row), 0);
    if (row > maxRow && composerExtraRows > 0) {
      setComposerExtraRows((count) => Math.max(0, count - 1));
    }
  };

  const removeActivityByIndex = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= activities.length) return;
    const targetActivity = activities[index];
    if (!targetActivity) return;
    if (activityRequiresDeleteConfirmation(targetActivity)) {
      const label = getActivityDefinition(targetActivity.type)?.label || 'block';
      const confirmed = window.confirm(`Delete this ${label}?`);
      if (!confirmed) return;
    }
    const nextActivities = activities.filter((_, idx) => idx !== index);
    updateActivities(nextActivities);
    if (!nextActivities.length) {
      setSelectedActivityIndex(0);
      return;
    }
    setSelectedActivityIndex((prevIndex) => {
      if (!Number.isInteger(prevIndex)) return 0;
      if (prevIndex > index) return prevIndex - 1;
      if (prevIndex === index) return Math.min(index, nextActivities.length - 1);
      return prevIndex;
    });
  };

  const removeSelectedActivity = () => {
    if (!selectedActivity) return;
    removeActivityByIndex(selectedActivityIndex);
  };

  const moveSelectedActivity = (direction) => {
    if (isCanvasMode) return;
    if (!selectedActivity || !selectedPlacement) return;
    const colSpan = clampComposerColSpan(selectedActivity?.layout?.colSpan, composerMaxColumns);
    const maxStartCol = Math.max(1, composerMaxColumns - colSpan + 1);
    let targetRow = selectedPlacement.row;
    let targetCol = selectedPlacement.col;

    if (direction === 'left') targetCol = Math.max(1, targetCol - 1);
    if (direction === 'right') targetCol = Math.min(maxStartCol, targetCol + 1);
    if (direction === 'up') targetRow = Math.max(1, targetRow - 1);
    if (direction === 'down') targetRow += 1;

    const result = moveComposerActivityToCell(activities, selectedActivityIndex, targetRow, targetCol, {
      maxColumns: composerMaxColumns,
    });
    if (!result.changed) return;
    updateActivities(result.activities);
    setSelectedActivityIndex(selectedActivityIndex);
  };

  const moveActivityToCell = (fromIndex, targetRow, targetCol) => {
    if (isCanvasMode) return;
    if (!Number.isInteger(fromIndex) || !Number.isInteger(targetRow) || !Number.isInteger(targetCol)) return;
    const result = moveComposerActivityToCell(activities, fromIndex, targetRow, targetCol, {
      maxColumns: composerMaxColumns,
    });
    if (!result.changed) return;
    updateActivities(result.activities);
    setSelectedActivityIndex(fromIndex);
  };

  const duplicateSelectedActivity = () => {
    if (!selectedActivity) return;
    const basePlacement = selectedPlacement || { row: 1, col: 1 };
    const duplicate = {
      ...selectedActivity,
      id: `activity-${Date.now()}`,
      data: {
        ...(selectedActivity.data || {}),
      },
      layout: {
        ...(selectedActivity.layout || {}),
        ...(isCanvasMode
          ? {
              x: Number.isInteger(selectedActivity?.layout?.x) ? selectedActivity.layout.x : 0,
              y: (Number.isInteger(selectedActivity?.layout?.y) ? selectedActivity.layout.y : 0) + 1,
            }
          : {
              row: basePlacement.row + 1,
              col: basePlacement.col,
            }),
      },
    };
    const nextActivities = [...activities];
    nextActivities.push(duplicate);
    updateActivities(nextActivities);
    setSelectedActivityIndex(nextActivities.length - 1);
  };

  const updateSelectedActivitySpan = (nextSpan) => {
    if (isCanvasMode) return;
    if (!selectedActivity) return;
    const clamped = clampComposerColSpan(nextSpan, composerMaxColumns);
    const nextActivities = activities.map((activity, idx) =>
      idx === selectedActivityIndex
        ? {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              colSpan: clamped,
            },
          }
        : activity,
    );
    updateActivities(nextActivities);
  };

  const setStandaloneMode = (mode) => {
    const normalizedLayout = normalizeComposerLayout(editForm.composerLayout);
    const normalizedActivities = normalizeComposerActivities(editForm.activities, {
      maxColumns: normalizedLayout.maxColumns,
      mode: normalizedLayout.mode,
    });
    const templateKey = resolveTemplateKey(editForm.template, courseTemplateDefault);
    const enteringFinlitComposer = mode === 'composer' && templateKey === 'finlit';
    let nextFinlit = finlitSettings;
    let nextActivities = normalizedActivities;
    let nextAuthoringTabId = finlitAuthoringTabId;
    if (enteringFinlitComposer) {
      const resolved = resolveFinlitTabComposerState({
        finlit: finlitSettings,
        moduleActivities: normalizedActivities,
        composerLayout: normalizedLayout,
        activeTabId: finlitAuthoringTabId,
        activeTabActivities: normalizedActivities,
      });
      nextFinlit = resolved.finlit;
      nextAuthoringTabId = resolved.activeTabId;
      nextActivities = Array.isArray(resolved.activeTabActivities) ? resolved.activeTabActivities : nextActivities;
    } else if (mode !== 'composer' && isFinlitComposer) {
      nextActivities = Array.isArray(canonicalComposerActivities) ? canonicalComposerActivities : nextActivities;
      nextAuthoringTabId = 'activities';
    }
    const profileActivities =
      enteringFinlitComposer && Array.isArray(canonicalComposerActivities) && canonicalComposerActivities.length > 0
        ? canonicalComposerActivities
        : nextActivities;
    const nextTemplateLayoutProfiles =
      mode === 'composer'
        ? buildTemplateLayoutProfilesForComposerState({
            templateOverride: editForm.template,
            nextComposerLayout: normalizedLayout,
            nextActivities: profileActivities,
          })
        : normalizeTemplateLayoutProfiles(editForm.templateLayoutProfiles, { activities: nextActivities });
    composerPreviewShouldFollowRef.current = false;
    setEditForm((prev) => ({
      ...prev,
      moduleMode: mode,
      finlit: nextFinlit,
      composerLayout: normalizedLayout,
      activities: nextActivities,
      templateLayoutProfiles: nextTemplateLayoutProfiles,
    }));
    setFinlitAuthoringTabId(nextAuthoringTabId);
  };

  const updateFinlitHeroField = (key, value) => {
    if (!['title', 'subtitle', 'progressLabel', 'mediaUrl', 'mediaType'].includes(key)) return;
    composerPreviewShouldFollowRef.current = false;
    const nextHero = {
      ...finlitHero,
      [key]: value,
    };
    setEditForm((prev) => ({
      ...prev,
      hero: nextHero,
    }));
  };

  const sanitizeFinlitTabActivityIds = (ids) => {
    const valid = new Set(finlitLinkableActivities.map((entry) => entry.id));
    const seen = new Set();
    return (Array.isArray(ids) ? ids : [])
      .map((item) => String(item || '').trim())
      .filter((id) => id && valid.has(id) && !seen.has(id) && seen.add(id));
  };

  const updateFinlitTabs = (updater) => {
    composerPreviewShouldFollowRef.current = false;
    const tabs = Array.isArray(finlitSettings.tabs) ? finlitSettings.tabs : [];
    const draftTabs = tabs.map((tab) => ({
      ...tab,
      activityIds: Array.isArray(tab.activityIds) ? [...tab.activityIds] : [],
      activities: Array.isArray(tab.activities) ? tab.activities.map((activity) => ({ ...activity })) : [],
      links: Array.isArray(tab.links) ? tab.links.map((link) => ({ ...link })) : [],
    }));
    const updatedTabs = typeof updater === 'function' ? updater(draftTabs) : draftTabs;
    setEditForm((prev) => ({
      ...prev,
      finlit: {
        ...finlitSettings,
        tabs: Array.isArray(updatedTabs) ? updatedTabs : draftTabs,
      },
    }));
  };

  const addFinlitTab = () => {
    updateFinlitTabs((tabs) => {
      const existing = new Set(tabs.map((tab) => String(tab?.id || '').trim()));
      const base = normalizeEditorTabToken(`tab-${tabs.length + 1}`, `tab-${tabs.length + 1}`);
      let nextId = base;
      let suffix = 2;
      while (existing.has(nextId)) {
        nextId = `${base}-${suffix}`;
        suffix += 1;
      }
      return [
        ...tabs,
        {
          id: nextId,
          label: `Tab ${tabs.length + 1}`,
          activityIds: [],
          activities: [],
          links: [],
        },
      ];
    });
  };

  const updateFinlitTab = (tabId, updates) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateFinlitTabs((tabs) =>
      tabs.map((tab) => {
        if (String(tab?.id || '').trim() !== targetId) return tab;
        const nextLabel = updates && Object.prototype.hasOwnProperty.call(updates, 'label') ? String(updates.label || '') : tab.label;
        const nextIds =
          updates && Object.prototype.hasOwnProperty.call(updates, 'activityIds')
            ? sanitizeFinlitTabActivityIds(updates.activityIds)
            : sanitizeFinlitTabActivityIds(tab.activityIds);
        return {
          ...tab,
          ...updates,
          label: nextLabel,
          activityIds: nextIds,
        };
      }),
    );
  };

  const removeFinlitTab = (tabId) => {
    const targetId = String(tabId || '').trim();
    if (!targetId || FINLIT_CORE_TAB_IDS.includes(targetId)) return;
    updateFinlitTabs((tabs) => tabs.filter((tab) => String(tab?.id || '').trim() !== targetId));
    if (finlitAuthoringTabId === targetId) {
      setFinlitAuthoringTabId('activities');
    }
  };

  const addFinlitTabLink = (tabId) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateFinlitTabs((tabs) =>
      tabs.map((tab) =>
        String(tab?.id || '').trim() === targetId
          ? { ...tab, links: [...(Array.isArray(tab.links) ? tab.links : []), { title: '', url: '', description: '' }] }
          : tab,
      ),
    );
  };

  const updateFinlitTabLink = (tabId, index, updates) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateFinlitTabs((tabs) =>
      tabs.map((tab) => {
        if (String(tab?.id || '').trim() !== targetId) return tab;
        const links = Array.isArray(tab.links) ? tab.links : [];
        if (!Number.isInteger(index) || index < 0 || index >= links.length) return tab;
        return {
          ...tab,
          links: links.map((link, linkIdx) => (linkIdx === index ? { ...link, ...updates } : link)),
        };
      }),
    );
  };

  const removeFinlitTabLink = (tabId, index) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateFinlitTabs((tabs) =>
      tabs.map((tab) => {
        if (String(tab?.id || '').trim() !== targetId) return tab;
        const links = Array.isArray(tab.links) ? tab.links : [];
        return {
          ...tab,
          links: links.filter((_, linkIdx) => linkIdx !== index),
        };
      }),
    );
  };

  const openFinlitTabInComposer = (tabId) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    const resolved = resolveFinlitTabComposerState({
      finlit: finlitSettings,
      moduleActivities: activities,
      composerLayout,
      activeTabId: targetId,
    });
    composerPreviewShouldFollowRef.current = false;
    setEditForm((prev) => ({
      ...prev,
      moduleMode: 'composer',
      finlit: resolved.finlit,
      activities: Array.isArray(resolved.activeTabActivities) ? resolved.activeTabActivities : [],
    }));
    setFinlitAuthoringTabId(resolved.activeTabId);
    setSelectedActivityIndex(0);
  };

  const handleVaultSelect = (payload) => {
    const kind = payload && typeof payload === 'object' ? payload.kind : null;
    const selectedFile = kind === 'vault-file' ? payload.file : payload;
    const filePath = String(selectedFile?.path || '').trim();
    if (vaultTargetField && typeof vaultTargetField === 'object' && vaultTargetField.target === 'finlit-hero-media' && filePath) {
      updateFinlitHeroField('mediaUrl', filePath);
    }
    setIsVaultOpen(false);
    setVaultTargetField(null);
  };

  const queueRichEditorUpdate = (html, text, immediate = false) => {
    const richConfig = getActivityRichEditorConfig(selectedActivity);
    if (!richConfig) return;
    if (richEditorUpdateTimerRef.current) {
      clearTimeout(richEditorUpdateTimerRef.current);
      richEditorUpdateTimerRef.current = null;
    }
    const applyUpdate = () => {
      updateSelectedActivityData({
        [richConfig.modeKey]: 'rich',
        [richConfig.htmlKey]: html,
        [richConfig.textKey]: text,
      });
    };
    if (immediate) {
      applyUpdate();
      return;
    }
    richEditorUpdateTimerRef.current = setTimeout(() => {
      richEditorUpdateTimerRef.current = null;
      applyUpdate();
    }, 140);
  };

  const captureRichSelection = () => {
    const editor = richEditorRef.current;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    richEditorSelectionRef.current = range.cloneRange();
  };

  const restoreRichSelection = () => {
    const range = richEditorSelectionRef.current;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const runRichEditorCommand = (command, value = null) => {
    if (!richEditorRef.current) return;
    richEditorRef.current.focus();
    restoreRichSelection();
    if (command === 'fontSize' || command === 'fontName' || command === 'foreColor' || command === 'hiliteColor' || command === 'backColor') {
      try {
        document.execCommand('styleWithCSS', false, true);
      } catch {
        // Ignore browser differences in execCommand support.
      }
    }
    const normalizedValue =
      command === 'formatBlock' && typeof value === 'string'
        ? value.replace(/[<>]/g, '').toUpperCase()
        : value;
    const didExecute = document.execCommand(command, false, normalizedValue);
    if (!didExecute && command === 'hiliteColor') {
      document.execCommand('backColor', false, normalizedValue);
    }
    if (!didExecute && command === 'insertUnorderedList') {
      document.execCommand('insertHTML', false, '<ul><li>List item</li></ul>');
    }
    if (!didExecute && command === 'insertOrderedList') {
      document.execCommand('insertHTML', false, '<ol><li>List item</li></ol>');
    }
    const html = richEditorRef.current.innerHTML || '';
    const text = richEditorRef.current.innerText || '';
    captureRichSelection();
    queueRichEditorUpdate(html, text, true);
  };

  const preserveRichSelection = (event) => {
    event.preventDefault();
  };

  const renderSelectedActivityStylePanel = () => {
    if (!selectedActivity) return null;
    const data = selectedActivity.data || {};
    const styleMeta = selectedActivity.style || {};
    const behaviorMeta = selectedActivity.behavior || {};
    const themeValue = normalizeThemeValue(data.blockTheme);
    const themePreview = getThemePreviewColors(themeValue);
    const effectiveFill =
      data.blockContainerBg ||
      data.containerBg ||
      (selectedActivity.type === 'title_block' ? '#1e1b4b' : themePreview.containerBg || '#0f172a');
    const effectiveTextColor = data.blockTextColor || themePreview.textColor || '#e2e8f0';
    return (
      <div className="mb-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Block Style</p>
          <button
            type="button"
            onClick={resetSelectedActivityStyle}
            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
            title="Reset block and body styles to defaults"
          >
            Reset Style
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Theme</label>
            <select
              value={themeValue}
              onChange={(e) => updateSelectedActivityData({ blockTheme: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              {BLOCK_THEME_OPTIONS.map((themeOption) => (
                <option key={`modal-block-theme-${themeOption.value}`} value={themeOption.value}>
                  {themeOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Font Family</label>
            <select
              value={data.blockFontFamily || ''}
              onChange={(e) => updateSelectedActivityData({ blockFontFamily: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              <option value="">Default</option>
              {RICH_EDITOR_FONT_OPTIONS.map((fontOption) => (
                <option key={`modal-block-font-${fontOption.value}`} value={fontOption.value} style={{ fontFamily: fontOption.value }}>
                  {fontOption.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Text Color</span>
            <input
              type="color"
              value={normalizeColorInputValue(effectiveTextColor, '#e2e8f0')}
              onChange={(e) => updateSelectedActivityData({ blockTextColor: e.target.value })}
              className="h-6 w-10 cursor-pointer border border-slate-600 rounded bg-transparent"
              title="Block text color"
              aria-label="Block text color"
            />
          </label>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Container Fill</span>
            <input
              type="color"
              value={normalizeColorInputValue(effectiveFill, '#0f172a')}
              onChange={(e) => updateSelectedActivityData({ blockContainerBg: e.target.value })}
              className="h-6 w-10 cursor-pointer border border-slate-600 rounded bg-transparent"
              title="Block container background color"
              aria-label="Block container background color"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Variant</label>
            <select
              value={styleMeta.variant === 'flat' ? 'flat' : 'card'}
              onChange={(e) => updateSelectedActivityMeta('style', { variant: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              <option value="card">Card</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Padding</label>
            <select
              value={styleMeta.padding || 'md'}
              onChange={(e) => updateSelectedActivityMeta('style', { padding: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Title Scale</label>
            <select
              value={styleMeta.titleVariant || 'md'}
              onChange={(e) => updateSelectedActivityMeta('style', { titleVariant: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              {['xs', 'sm', 'md', 'lg', 'xl'].map((value) => (
                <option key={`modal-title-variant-${value}`} value={value}>
                  {value.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Border</span>
            <input
              type="checkbox"
              checked={styleMeta.border !== false}
              onChange={(e) => updateSelectedActivityMeta('style', { border: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500"
            />
          </label>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Collapsible</span>
            <input
              type="checkbox"
              checked={behaviorMeta.collapsible === true}
              onChange={(e) =>
                updateSelectedActivityMeta('behavior', {
                  collapsible: e.target.checked,
                  collapsedByDefault: e.target.checked ? behaviorMeta.collapsedByDefault === true : false,
                })
              }
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500"
            />
          </label>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Start Collapsed</span>
            <input
              type="checkbox"
              checked={behaviorMeta.collapsedByDefault === true}
              disabled={behaviorMeta.collapsible !== true}
              onChange={(e) => updateSelectedActivityMeta('behavior', { collapsedByDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 disabled:opacity-40"
            />
          </label>
        </div>
        <p className="text-[10px] text-slate-500">
          Theme sets block defaults. Rich text inline formatting still overrides theme styles.
        </p>
      </div>
    );
  };

  const renderActivityEditor = () => {
    if (!selectedActivity) {
      return <p className="text-xs text-slate-500">Select an activity to edit.</p>;
    }

    const data = selectedActivity.data || {};
    if (selectedActivity.type === 'content_block' || selectedActivity.type === 'title_block') {
      const richConfig = getActivityRichEditorConfig(selectedActivity);
      if (!richConfig) return null;
      const bodyMode = data[richConfig.modeKey] === 'plain' ? 'plain' : 'rich';
      return (
        <div className="space-y-3">
          {richConfig.titleInputKey ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">{richConfig.titleInputLabel}</label>
              <input
                type="text"
                value={data[richConfig.titleInputKey] || ''}
                onChange={(e) => updateSelectedActivityData({ [richConfig.titleInputKey]: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              />
            </div>
          ) : null}
          {selectedActivity.type === 'title_block' ? (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-300 mb-1">Alignment</label>
                <select
                  value={data.align || 'left'}
                  onChange={(e) => updateSelectedActivityData({ align: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="col-span-6 text-[11px] text-slate-500 self-end pb-1">
                Use heading styles + font, text color, and container fill controls for strong hero text.
              </div>
            </div>
          ) : null}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">{richConfig.plainLabel}</label>
              <div className="inline-flex bg-slate-950 border border-slate-700 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => updateSelectedActivityData({ [richConfig.modeKey]: 'rich' })}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${bodyMode === 'rich' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Rich
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedActivityData({ [richConfig.modeKey]: 'plain' })}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${bodyMode === 'plain' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Plain
                </button>
              </div>
            </div>
            {bodyMode === 'plain' ? (
              <textarea
                value={data[richConfig.textKey] || ''}
                onChange={(e) =>
                  updateSelectedActivityData({
                    [richConfig.modeKey]: 'plain',
                    [richConfig.textKey]: e.target.value,
                  })
                }
                className={`w-full ${richConfig.plainRowsClass} bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm`}
              />
            ) : (
              <div className="rounded border border-slate-700 bg-slate-950 overflow-hidden">
                <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-slate-900/80">
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('bold')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">B</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('italic')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs italic">I</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('underline')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs underline">U</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('formatBlock', 'P')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">P</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('formatBlock', 'H2')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">H2</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('formatBlock', 'H3')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">H3</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('fontSize', '2')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A-</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('fontSize', '3')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('fontSize', '5')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A+</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('insertUnorderedList')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">• List</button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('insertOrderedList')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">1. List</button>
                  <button
                    type="button"
                    onMouseDown={preserveRichSelection}
                    onClick={() => {
                      const url = window.prompt('Enter URL');
                      if (!url) return;
                      runRichEditorCommand('createLink', url);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  >
                    Link
                  </button>
                  <button type="button" onMouseDown={preserveRichSelection} onClick={() => runRichEditorCommand('removeFormat')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">Clear</button>
                </div>
                <div className="px-2 pb-2 bg-slate-900/80 border-b border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const font = e.target.value;
                        if (!font) return;
                        runRichEditorCommand('fontName', font);
                      }}
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-white"
                      aria-label="Font family"
                    >
                      <option value="">Font Family</option>
                      {RICH_EDITOR_FONT_OPTIONS.map((fontOption) => (
                        <option key={`editor-font-${fontOption.value}`} value={fontOption.value} style={{ fontFamily: fontOption.value }}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center justify-between rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      <span>Text Color</span>
                      <input
                        type="color"
                        defaultValue="#e2e8f0"
                        onChange={(e) => runRichEditorCommand('foreColor', e.target.value)}
                        className="h-6 w-10 cursor-pointer border border-slate-600 rounded bg-transparent"
                        title="Set text color"
                        aria-label="Set text color"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      <span>Container Fill</span>
                      <input
                        type="color"
                        value={normalizeColorInputValue(
                          data.bodyContainerBg || data.blockContainerBg || data.containerBg,
                          selectedActivity.type === 'title_block' ? '#1e1b4b' : '#0f172a',
                        )}
                        onChange={(e) => updateSelectedActivityData({ bodyContainerBg: e.target.value })}
                        className="h-6 w-10 cursor-pointer border border-slate-600 rounded bg-transparent"
                        title="Set body container background color override"
                        aria-label="Set body container background color override"
                      />
                    </label>
                    <button
                      type="button"
                      onMouseDown={preserveRichSelection}
                      onClick={resetSelectedActivityBodyStyle}
                      className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-200"
                      title="Reset body style overrides"
                    >
                      Reset Body Style
                    </button>
                  </div>
                </div>
                <div
                  ref={richEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(event) => {
                    const html = event.currentTarget.innerHTML || '';
                    const text = event.currentTarget.innerText || '';
                    captureRichSelection();
                    queueRichEditorUpdate(html, text);
                  }}
                  onMouseUp={captureRichSelection}
                  onKeyUp={captureRichSelection}
                  onBlur={(event) => {
                    const html = event.currentTarget.innerHTML || '';
                    const text = event.currentTarget.innerText || '';
                    captureRichSelection();
                    queueRichEditorUpdate(html, text, true);
                  }}
                  className="cf-rich-editor min-h-[180px] p-3 text-sm text-white outline-none"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'embed_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Embed URL</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => updateSelectedActivityData({ url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Caption</label>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => updateSelectedActivityData({ caption: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'resource_list') {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">List Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={`resource-item-${idx}`} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={item?.label || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), label: e.target.value };
                    updateSelectedActivityData({ items: nextItems });
                  }}
                  className="col-span-3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={item?.viewUrl || item?.url || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), viewUrl: e.target.value };
                    updateSelectedActivityData({ items: nextItems });
                  }}
                  className="col-span-4 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="View URL"
                />
                <button
                  onClick={() => {
                    const nextItems = items.filter((_, itemIdx) => itemIdx !== idx);
                    updateSelectedActivityData({ items: nextItems });
                  }}
                  className="col-span-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
                  type="button"
                  title="Remove resource"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
                <input
                  type="text"
                  value={item?.downloadUrl || item?.url || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), downloadUrl: e.target.value };
                    updateSelectedActivityData({ items: nextItems });
                  }}
                  className="col-span-6 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Download URL"
                />
                <input
                  type="text"
                  value={item?.description || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), description: e.target.value };
                    updateSelectedActivityData({ items: nextItems });
                  }}
                  className="col-span-6 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Optional description"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateSelectedActivityData({ items: [...items, { label: '', viewUrl: '', downloadUrl: '', description: '' }] })}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Resource
            </button>
            <div className="pt-3 border-t border-slate-700">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Add From Module Bank</label>
              <div className="grid grid-cols-12 gap-2">
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="col-span-9 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                >
                  {moduleBankMaterials.length === 0 && <option value="">No stored materials</option>}
                  {moduleBankMaterials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.title || mat.number || mat.id}
                    </option>
                  ))}
                </select>
            <button
              type="button"
              onClick={() => {
                const selected = moduleBankMaterials.find((mat) => mat.id === selectedMaterialId);
                if (!selected) return;
                const viewUrl = selected.viewUrl || selected.downloadUrl || '';
                const downloadUrl = selected.downloadUrl || selected.viewUrl || '';
                const nextItems = [
                  ...items,
                  {
                    label: selected.title || selected.number || selected.id,
                    viewUrl,
                    downloadUrl,
                    description: selected.description || '',
                    digitalContent: selected.digitalContent || null,
                  },
                ];
                updateSelectedActivityData({ items: nextItems });
              }}
                  disabled={!selectedMaterialId || moduleBankMaterials.length === 0}
                  className="col-span-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-xs font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'knowledge_check') {
      const questions = normalizeKnowledgeCheckBuilderQuestions(data);
      const moveKnowledgeQuestion = (fromIndex, toIndex) => {
        const nextQuestions = reorderByIndex(questions, fromIndex, toIndex);
        updateSelectedActivityData({ questions: nextQuestions });
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Block Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Knowledge Check"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Questions</label>
            <div className="space-y-2">
              {questions.map((question, qIdx) => {
                const isDropTarget = dragOverKnowledgeQuestionIndex === qIdx && draggingKnowledgeQuestionIndex !== null && qIdx !== draggingKnowledgeQuestionIndex;
                const options = Array.isArray(question.options) ? question.options : [];
                const isShortAnswer = question.type === 'short_answer';
                return (
                  <div
                    key={`kc-question-${qIdx}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                      if (dragOverKnowledgeQuestionIndex !== qIdx) setDragOverKnowledgeQuestionIndex(qIdx);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                      const fromIndex = Number.isInteger(draggingKnowledgeQuestionIndex) ? draggingKnowledgeQuestionIndex : fallback;
                      moveKnowledgeQuestion(fromIndex, qIdx);
                      setDraggingKnowledgeQuestionIndex(null);
                      setDragOverKnowledgeQuestionIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggingKnowledgeQuestionIndex(null);
                      setDragOverKnowledgeQuestionIndex(null);
                    }}
                    className={`space-y-2 rounded border p-3 ${isDropTarget ? 'border-indigo-500 bg-indigo-500/15' : 'border-slate-700 bg-slate-900/70'}`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <p className="col-span-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Question {qIdx + 1}</p>
                      <select
                        value={isShortAnswer ? 'short_answer' : 'multiple_choice'}
                        onChange={(e) => {
                          const nextType = e.target.value === 'short_answer' ? 'short_answer' : 'multiple_choice';
                          const nextQuestions = questions.map((item, idx) => {
                            if (idx !== qIdx) return item;
                            if (nextType === 'short_answer') {
                              return {
                                type: 'short_answer',
                                prompt: item.prompt == null ? '' : String(item.prompt),
                                placeholder: item.placeholder == null ? '' : String(item.placeholder),
                              };
                            }
                            return {
                              type: 'multiple_choice',
                              prompt: item.prompt == null ? '' : String(item.prompt),
                              options: ['Option A', 'Option B', 'Option C'],
                              correctIndex: 0,
                            };
                          });
                          updateSelectedActivityData({ questions: nextQuestions });
                        }}
                        className="col-span-3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="short_answer">Short Answer</option>
                      </select>
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          setDraggingKnowledgeQuestionIndex(qIdx);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(qIdx));
                          }
                        }}
                        onDragEnd={() => {
                          setDraggingKnowledgeQuestionIndex(null);
                          setDragOverKnowledgeQuestionIndex(null);
                        }}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded p-2 text-xs font-black cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        ::
                      </button>
                      <button
                        type="button"
                        onClick={() => moveKnowledgeQuestion(qIdx, Math.max(0, qIdx - 1))}
                        disabled={qIdx === 0}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded p-2 flex items-center justify-center"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveKnowledgeQuestion(qIdx, Math.min(questions.length - 1, qIdx + 1))}
                        disabled={qIdx >= questions.length - 1}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded p-2 flex items-center justify-center"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedActivityData({ questions: questions.filter((_, idx) => idx !== qIdx) })}
                        className="col-span-3 bg-rose-600 hover:bg-rose-500 text-white rounded p-2 text-xs"
                        title="Delete question"
                      >
                        Delete
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Prompt</label>
                      <textarea
                        value={question.prompt || ''}
                        onChange={(e) => {
                          const nextQuestions = questions.map((item, idx) => (idx === qIdx ? { ...item, prompt: e.target.value } : item));
                          updateSelectedActivityData({ questions: nextQuestions });
                        }}
                        className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                      />
                    </div>
                    {isShortAnswer ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={question.placeholder || ''}
                          onChange={(e) => {
                            const nextQuestions = questions.map((item, idx) => (idx === qIdx ? { ...item, placeholder: e.target.value } : item));
                            updateSelectedActivityData({ questions: nextQuestions });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                          placeholder="Write your response..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Options</label>
                        {options.map((option, optionIdx) => (
                          <div key={`kc-question-${qIdx}-option-${optionIdx}`} className="grid grid-cols-12 gap-2">
                            <input
                              type="text"
                              value={option || ''}
                              onChange={(e) => {
                                const nextQuestions = questions.map((item, idx) => {
                                  if (idx !== qIdx) return item;
                                  const nextOptions = [...(Array.isArray(item.options) ? item.options : [])];
                                  nextOptions[optionIdx] = e.target.value;
                                  return { ...item, options: nextOptions };
                                });
                                updateSelectedActivityData({ questions: nextQuestions });
                              }}
                              className="col-span-10 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                            />
                            <input
                              type="radio"
                              name={`kc-correct-${qIdx}`}
                              checked={(question.correctIndex || 0) === optionIdx}
                              onChange={() => {
                                const nextQuestions = questions.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctIndex: optionIdx } : item,
                                );
                                updateSelectedActivityData({ questions: nextQuestions });
                              }}
                              className="col-span-1 self-center"
                              title="Correct answer"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextQuestions = questions.map((item, idx) => {
                                  if (idx !== qIdx) return item;
                                  const nextOptions = (Array.isArray(item.options) ? item.options : []).filter((_, itemIdx) => itemIdx !== optionIdx);
                                  return {
                                    ...item,
                                    options: nextOptions,
                                    correctIndex: Math.max(0, Math.min(item.correctIndex || 0, Math.max(nextOptions.length - 1, 0))),
                                  };
                                });
                                updateSelectedActivityData({ questions: nextQuestions });
                              }}
                              className="col-span-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
                              title="Remove option"
                            >
                              <Trash2 size={12} className="mx-auto" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const nextQuestions = questions.map((item, idx) =>
                              idx === qIdx ? { ...item, options: [...(Array.isArray(item.options) ? item.options : []), ''] } : item,
                            );
                            updateSelectedActivityData({ questions: nextQuestions });
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Option
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {questions.length === 0 && <p className="text-xs text-slate-500">No questions yet. Add one below.</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateSelectedActivityData({ questions: [...questions, createKnowledgeCheckBuilderQuestion('multiple_choice')] })}
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Multiple Choice
            </button>
            <button
              type="button"
              onClick={() => updateSelectedActivityData({ questions: [...questions, createKnowledgeCheckBuilderQuestion('short_answer')] })}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Short Answer
            </button>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'worksheet_form') {
      const blocks = normalizeWorksheetBuilderBlocks(data);
      const moveWorksheetBlock = (fromIndex, toIndex) => {
        const nextBlocks = reorderByIndex(blocks, fromIndex, toIndex);
        updateSelectedActivityData({ blocks: nextBlocks });
      };
      const setWorksheetBlockField = (blockIdx, updates) => {
        const nextBlocks = blocks.map((item, idx) => (idx === blockIdx ? { ...item, ...updates } : item));
        updateSelectedActivityData({ blocks: nextBlocks });
      };
      const runWorksheetHelperRichCommand = (blockIdx, command, value = null) => {
        const editor = document.querySelector(`[data-edit-worksheet-helper-editor="${blockIdx}"]`);
        if (!(editor instanceof HTMLElement)) return;
        editor.focus();
        if (command === 'createLink') {
          const url = window.prompt('Enter URL');
          if (!url) return;
          document.execCommand('createLink', false, url);
        } else {
          document.execCommand(command, false, value);
        }
        const html = editor.innerHTML || '';
        const text = editor.innerText || '';
        setWorksheetBlockField(blockIdx, {
          helperMode: 'rich',
          helperHtml: html,
          helperText: text,
        });
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Worksheet Header (Optional)</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Worksheet"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Worksheet Blocks</label>
            <div className="space-y-2">
              {blocks.map((block, blockIdx) => {
                const isDropTarget = dragOverWorksheetBlockIndex === blockIdx && draggingWorksheetBlockIndex !== null && blockIdx !== draggingWorksheetBlockIndex;
                const isTitle = block.kind === 'title';
                return (
                  <div
                    key={`worksheet-block-${blockIdx}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                      if (dragOverWorksheetBlockIndex !== blockIdx) setDragOverWorksheetBlockIndex(blockIdx);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                      const fromIndex = Number.isInteger(draggingWorksheetBlockIndex) ? draggingWorksheetBlockIndex : fallback;
                      moveWorksheetBlock(fromIndex, blockIdx);
                      setDraggingWorksheetBlockIndex(null);
                      setDragOverWorksheetBlockIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggingWorksheetBlockIndex(null);
                      setDragOverWorksheetBlockIndex(null);
                    }}
                    className={`space-y-2 rounded border p-3 ${isDropTarget ? 'border-indigo-500 bg-indigo-500/15' : 'border-slate-700 bg-slate-900/70'}`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <p className="col-span-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Block {blockIdx + 1}</p>
                      <select
                        value={isTitle ? 'title' : 'field'}
                        onChange={(e) => {
                          const nextKind = e.target.value === 'title' ? 'title' : 'field';
                          const nextBlocks = blocks.map((item, idx) => {
                            if (idx !== blockIdx) return item;
                            if (nextKind === 'title') {
                              return {
                                ...createWorksheetBuilderBlock('title'),
                                title: item.kind === 'title' ? item.title : item.label || 'Section Title',
                              };
                            }
                            return {
                              ...createWorksheetBuilderBlock('field'),
                              label: item.kind === 'field' ? item.label : item.title || 'Field Label',
                            };
                          });
                          updateSelectedActivityData({ blocks: nextBlocks });
                        }}
                        className="col-span-3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                      >
                        <option value="field">Field</option>
                        <option value="title">Title + Instructions</option>
                      </select>
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          setDraggingWorksheetBlockIndex(blockIdx);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(blockIdx));
                          }
                        }}
                        onDragEnd={() => {
                          setDraggingWorksheetBlockIndex(null);
                          setDragOverWorksheetBlockIndex(null);
                        }}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded p-2 text-xs font-black cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        ::
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWorksheetBlock(blockIdx, Math.max(0, blockIdx - 1))}
                        disabled={blockIdx === 0}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded p-2 flex items-center justify-center"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWorksheetBlock(blockIdx, Math.min(blocks.length - 1, blockIdx + 1))}
                        disabled={blockIdx >= blocks.length - 1}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded p-2 flex items-center justify-center"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedActivityData({ blocks: blocks.filter((_, idx) => idx !== blockIdx) })}
                        className="col-span-3 bg-rose-600 hover:bg-rose-500 text-white rounded p-2 text-xs"
                        title="Delete block"
                      >
                        Delete
                      </button>
                    </div>
                    {isTitle ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Title Text</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => {
                              const nextBlocks = blocks.map((item, idx) => (idx === blockIdx ? { ...item, title: e.target.value } : item));
                              updateSelectedActivityData({ blocks: nextBlocks });
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                            placeholder="Section title"
                          />
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(block.showContent)}
                            onChange={(e) => {
                              const nextBlocks = blocks.map((item, idx) => (idx === blockIdx ? { ...item, showContent: e.target.checked } : item));
                              updateSelectedActivityData({ blocks: nextBlocks });
                            }}
                            className="w-4 h-4"
                          />
                          Show instructions under title
                        </label>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Instruction Content</label>
                          <textarea
                            value={block.content || ''}
                            onChange={(e) => {
                              const nextBlocks = blocks.map((item, idx) => (idx === blockIdx ? { ...item, content: e.target.value } : item));
                              updateSelectedActivityData({ blocks: nextBlocks });
                            }}
                            className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs disabled:opacity-50"
                            placeholder="Add instructions or context for this section."
                            disabled={!block.showContent}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Field Label</label>
                            <input
                              type="text"
                              value={block.label || ''}
                              onChange={(e) => setWorksheetBlockField(blockIdx, { label: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                              placeholder="Field label"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Input Type</label>
                            <select
                              value={block.fieldType || 'text'}
                              onChange={(e) => setWorksheetBlockField(blockIdx, { fieldType: e.target.value || 'text' })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="number">Number</option>
                            </select>
                          </div>
                          <div className="col-span-4">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Placeholder</label>
                            <input
                              type="text"
                              value={block.placeholder || ''}
                              onChange={(e) => setWorksheetBlockField(blockIdx, { placeholder: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                              placeholder="Optional placeholder"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Prompt Mode</label>
                          <select
                            value={block.helperMode === 'rich' ? 'rich' : 'plain'}
                            onChange={(e) => setWorksheetBlockField(blockIdx, { helperMode: e.target.value === 'rich' ? 'rich' : 'plain' })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                          >
                            <option value="plain">Plain Prompt</option>
                            <option value="rich">Rich Prompt</option>
                          </select>
                        </div>
                        {block.helperMode === 'rich' ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'bold')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">B</button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'italic')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs italic">I</button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'underline')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs underline">U</button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'insertUnorderedList')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">• List</button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'createLink')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">Link</button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runWorksheetHelperRichCommand(blockIdx, 'removeFormat')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">Clear</button>
                            </div>
                            <div className="rounded border border-slate-700 bg-slate-950">
                              <div
                                data-edit-worksheet-helper-editor={blockIdx}
                                contentEditable
                                suppressContentEditableWarning
                                className="cf-rich-editor min-h-[120px] p-2 text-xs text-white outline-none"
                                dangerouslySetInnerHTML={{ __html: block.helperHtml || '' }}
                                onInput={(event) => {
                                  const html = event.currentTarget.innerHTML || '';
                                  const text = event.currentTarget.innerText || '';
                                  setWorksheetBlockField(blockIdx, {
                                    helperMode: 'rich',
                                    helperHtml: html,
                                    helperText: text,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Prompt Text</label>
                            <textarea
                              value={block.helperText || ''}
                              onChange={(e) => setWorksheetBlockField(blockIdx, { helperText: e.target.value })}
                              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                              placeholder="Add context/instructions shown above this field."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {blocks.length === 0 && <p className="text-xs text-slate-500">No blocks yet. Add a title or field below.</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateSelectedActivityData({ blocks: [...blocks, createWorksheetBuilderBlock('title')] })}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Title Block
            </button>
            <button
              type="button"
              onClick={() => updateSelectedActivityData({ blocks: [...blocks, createWorksheetBuilderBlock('field')] })}
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'fillable_chart') {
      const chart = normalizeFillableChartData(data);
      const updateChart = (updates = {}) => {
        const source = {
          ...data,
          rowCount: updates?.rowCount ?? chart.rowCount,
          colCount: updates?.colCount ?? chart.colCount,
          showRowLabels: updates?.showRowLabels ?? chart.showRowLabels,
          rowLabelHeader: updates?.rowLabelHeader ?? chart.rowLabelHeader,
          rows: updates?.rows ?? chart.rows,
          columns: updates?.columns ?? chart.columns,
          cells: updates?.cells ?? chart.cells,
        };
        updateSelectedActivityData(normalizeFillableChartData(source));
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Chart Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Fillable Chart"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateSelectedActivityData({ description: e.target.value })}
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Explain how students should use the chart."
            />
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Rows</label>
              <input
                type="number"
                min="1"
                max="8"
                value={chart.rowCount}
                onChange={(e) => updateChart({ rowCount: Math.max(1, Math.min(8, Number.parseInt(e.target.value, 10) || 1)) })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="8"
                value={chart.colCount}
                onChange={(e) => updateChart({ colCount: Math.max(1, Math.min(8, Number.parseInt(e.target.value, 10) || 1)) })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Row Label Column</label>
              <label className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={chart.showRowLabels !== false}
                  onChange={(e) => updateChart({ showRowLabels: e.target.checked })}
                  className="w-4 h-4"
                />
                Show
              </label>
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Column A Header</label>
              <input
                type="text"
                value={chart.rowLabelHeader || ''}
                onChange={(e) => updateChart({ rowLabelHeader: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs disabled:opacity-50"
                placeholder="Rows"
                disabled={chart.showRowLabels === false}
              />
            </div>
            <div className="col-span-12 flex items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  const rowCount = chart.rowCount;
                  const nextColumns = [
                    { id: 'col-pros', label: 'Pros' },
                    { id: 'col-cons', label: 'Cons' },
                  ];
                  const nextCells = Array.from({ length: rowCount }, (_, rowIdx) => {
                    const existingRow = Array.isArray(chart.cells[rowIdx]) ? chart.cells[rowIdx] : [];
                    return [
                      { ...(existingRow[0] || {}), editable: true, placeholder: 'Add a pro...' },
                      { ...(existingRow[1] || {}), editable: true, placeholder: 'Add a con...' },
                    ];
                  });
                  updateChart({
                    colCount: 2,
                    columns: nextColumns,
                    cells: nextCells,
                  });
                }}
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
              >
                Apply Pros/Cons Preset
              </button>
            </div>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase">Column Labels</label>
            {chart.columns.map((column, colIdx) => (
              <input
                key={`chart-col-${colIdx}`}
                type="text"
                value={column.label || ''}
                onChange={(e) => {
                  const nextColumns = chart.columns.map((item, idx) => (idx === colIdx ? { ...item, label: e.target.value } : item));
                  updateChart({ columns: nextColumns });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                placeholder={`Column ${colIdx + 1}`}
              />
            ))}
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase">Cells</label>
            {chart.rows.map((row, rowIdx) => (
              <div key={`chart-cell-row-${rowIdx}`} className="rounded border border-slate-700 bg-slate-950/60 p-2 space-y-2">
                {chart.showRowLabels !== false && (
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-2 text-[11px] font-bold text-slate-400 uppercase">Row Label</span>
                    <input
                      type="text"
                      value={row.label || ''}
                      onChange={(e) => {
                        const nextRows = chart.rows.map((item, idx) => (idx === rowIdx ? { ...item, label: e.target.value } : item));
                        updateChart({ rows: nextRows });
                      }}
                      className="col-span-10 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                      placeholder={`Row ${rowIdx + 1}`}
                    />
                  </div>
                )}
                {chart.columns.map((column, colIdx) => {
                  const cell = chart.cells[rowIdx][colIdx];
                  return (
                    <div key={`chart-cell-${rowIdx}-${colIdx}`} className="grid grid-cols-12 gap-2 items-center">
                      <p className="col-span-3 text-[11px] text-slate-400 truncate">{column.label || `Column ${colIdx + 1}`}</p>
                      <input
                        type="text"
                        value={cell.label || ''}
                        onChange={(e) => {
                          const nextCells = chart.cells.map((items, rIdx) =>
                            items.map((item, cIdx) => (rIdx === rowIdx && cIdx === colIdx ? { ...item, label: e.target.value } : item)),
                          );
                          updateChart({ cells: nextCells });
                        }}
                        className="col-span-4 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                        placeholder="Cell label/content"
                      />
                      <label className="col-span-2 inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={cell.editable !== false}
                          onChange={(e) => {
                            const nextCells = chart.cells.map((items, rIdx) =>
                              items.map((item, cIdx) => (rIdx === rowIdx && cIdx === colIdx ? { ...item, editable: e.target.checked } : item)),
                            );
                            updateChart({ cells: nextCells });
                          }}
                          className="w-4 h-4"
                        />
                        Editable
                      </label>
                      <input
                        type="text"
                        value={cell.placeholder || ''}
                        onChange={(e) => {
                          const nextCells = chart.cells.map((items, rIdx) =>
                            items.map((item, cIdx) => (rIdx === rowIdx && cIdx === colIdx ? { ...item, placeholder: e.target.value } : item)),
                          );
                          updateChart({ cells: nextCells });
                        }}
                        className="col-span-3 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                        placeholder="Placeholder"
                        disabled={cell.editable === false}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'image_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => updateSelectedActivityData({ url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="https://... or /assets/image.jpg"
            />
            <div className="grid grid-cols-12 gap-2 mt-2">
              <select
                value={selectedImageMaterialId}
                onChange={(e) => setSelectedImageMaterialId(e.target.value)}
                className="col-span-10 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {moduleBankImageAssets.length === 0 && <option value="">No image materials found</option>}
                {moduleBankImageAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const selected = moduleBankImageAssets.find((asset) => asset.id === selectedImageMaterialId);
                  if (!selected) return;
                  updateSelectedActivityData({
                    url: selected.url,
                    alt: data.alt || selected.alt || '',
                  });
                }}
                disabled={!selectedImageMaterialId || moduleBankImageAssets.length === 0}
                className="col-span-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white"
              >
                Use
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Use local `/materials/...` image paths for offline-ready modules.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Alt Text</label>
            <input
              type="text"
              value={data.alt || ''}
              onChange={(e) => updateSelectedActivityData({ alt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Caption</label>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => updateSelectedActivityData({ caption: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Display Width</label>
            <select
              value={data.width || 'full'}
              onChange={(e) => updateSelectedActivityData({ width: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            >
              <option value="full">Full width</option>
              <option value="wide">Wide</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
            </select>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'hotspot_image') {
      return <HotspotEditor data={data} onChange={updateSelectedActivityData} />;
    }

    if (selectedActivity.type === 'assessment_embed') {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Block Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={`assessment-item-${item.id || idx}`} className="flex items-center justify-between gap-2 rounded border border-slate-700 bg-slate-900 p-2">
                <div>
                  <p className="text-xs font-bold text-white">{item.title || item.id || `Assessment ${idx + 1}`}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{item.id || 'no-id'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSelectedActivityData({ items: items.filter((_, itemIdx) => itemIdx !== idx) })}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs"
                  title="Remove assessment"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="text-xs text-slate-500">No assessments linked yet.</p>}
          </div>
          <div className="grid grid-cols-12 gap-2">
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="col-span-9 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {availableAssessments.length === 0 && <option value="">No saved assessments</option>}
              {availableAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title || assessment.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const selected = availableAssessments.find((assessment) => assessment.id === selectedAssessmentId);
                if (!selected) return;
                if (items.some((item) => item.id === selected.id)) return;
                const nextItems = [
                  ...items,
                  {
                    id: selected.id,
                    title: selected.title || selected.id,
                    html: selected.html || '',
                    script: selected.script || '',
                  },
                ];
                updateSelectedActivityData({ items: nextItems });
              }}
              disabled={!selectedAssessmentId || availableAssessments.length === 0}
              className="col-span-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-xs font-bold text-white"
            >
              Add
            </button>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'rubric_creator') {
      const rubric = normalizeRubricData(data);
      const rows = rubric.rows;
      const columns = rubric.columns;
      const cells = rubric.cells;
      const rowCount = rubric.rowCount;
      const colCount = rubric.colCount;

      const applyRubricShape = (nextRowCount, nextColCount) => {
        const normalized = normalizeRubricData(data, nextRowCount, nextColCount);
        updateSelectedActivityData({
          rowCount: normalized.rowCount,
          colCount: normalized.colCount,
          rows: normalized.rows,
          columns: normalized.columns,
          cells: normalized.cells,
        });
      };

      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Rubric Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Instructions</label>
            <textarea
              value={data.instructions || ''}
              onChange={(e) => updateSelectedActivityData({ instructions: e.target.value })}
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">Rows</label>
              <select
                value={rowCount}
                onChange={(e) => applyRubricShape(Number.parseInt(e.target.value, 10), colCount)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              >
                {[2, 3, 4, 5].map((count) => (
                  <option key={`rubric-row-count-${count}`} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">Columns</label>
              <select
                value={colCount}
                onChange={(e) => applyRubricShape(rowCount, Number.parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              >
                {[2, 3, 4, 5].map((count) => (
                  <option key={`rubric-col-count-${count}`} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 flex items-end">
              <label className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={rubric.selfScoringEnabled}
                  onChange={(e) => updateSelectedActivityData({ selfScoringEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                Enable self scoring
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Total Label</label>
            <input
              type="text"
              value={data.totalLabel || 'Self Score Total'}
              onChange={(e) => updateSelectedActivityData({ totalLabel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              disabled={!rubric.selfScoringEnabled}
            />
          </div>
          <div className="space-y-2 rounded border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Columns (Label + Score)</p>
            {columns.map((column, colIdx) => (
              <div key={`rubric-column-${colIdx}`} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={column.label}
                  onChange={(e) => {
                    const nextColumns = columns.map((item, idx) => (idx === colIdx ? { ...item, label: e.target.value } : item));
                    updateSelectedActivityData({ rowCount, colCount, rows, columns: nextColumns, cells });
                  }}
                  className="col-span-8 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder={`Column ${colIdx + 1} label`}
                />
                <input
                  type="number"
                  step="0.5"
                  value={Number.isFinite(Number(column.score)) ? column.score : 0}
                  onChange={(e) => {
                    const parsed = Number.parseFloat(e.target.value);
                    const nextColumns = columns.map((item, idx) =>
                      idx === colIdx ? { ...item, score: Number.isFinite(parsed) ? parsed : 0 } : item,
                    );
                    updateSelectedActivityData({ rowCount, colCount, rows, columns: nextColumns, cells });
                  }}
                  className="col-span-4 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Score"
                  title="Column score value"
                />
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Row Labels</p>
            {rows.map((row, rowIdx) => (
              <input
                key={`rubric-row-${rowIdx}`}
                type="text"
                value={row.label}
                onChange={(e) => {
                  const nextRows = rows.map((item, idx) => (idx === rowIdx ? { ...item, label: e.target.value } : item));
                  updateSelectedActivityData({ rowCount, colCount, rows: nextRows, columns, cells });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                placeholder={`Criterion ${rowIdx + 1}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Cell Descriptions</p>
            <div className="overflow-x-auto rounded border border-slate-700">
              <table className="min-w-[720px] w-full border-collapse text-xs">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="p-2 border-b border-slate-700 text-left text-slate-300 uppercase tracking-wide">Criteria</th>
                    {columns.map((column, colIdx) => (
                      <th key={`rubric-head-${colIdx}`} className="p-2 border-b border-slate-700 text-left text-slate-300 uppercase tracking-wide">
                        {column.label || `Column ${colIdx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={`rubric-grid-row-${rowIdx}`} className="align-top">
                      <td className="p-2 border-b border-slate-800 text-slate-200 font-semibold">
                        {row.label || `Criterion ${rowIdx + 1}`}
                      </td>
                      {columns.map((column, colIdx) => (
                        <td key={`rubric-grid-cell-${rowIdx}-${colIdx}`} className="p-2 border-b border-slate-800">
                          <textarea
                            value={cells[rowIdx]?.[colIdx] || ''}
                            onChange={(e) => {
                              const nextCells = cells.map((cellRow, cellRowIdx) =>
                                cellRowIdx === rowIdx
                                  ? cellRow.map((cellValue, cellColIdx) => (cellColIdx === colIdx ? e.target.value : cellValue))
                                  : cellRow,
                              );
                              updateSelectedActivityData({ rowCount, colCount, rows, columns, cells: nextCells });
                            }}
                            className="w-full h-20 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                            placeholder={`Describe "${column.label || `Column ${colIdx + 1}`}"`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'spacer_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Spacer Height (px)</label>
            <input
              type="number"
              min="0"
              max="600"
              value={Number.isFinite(Number(data.height)) ? data.height : 48}
              onChange={(e) => updateSelectedActivityData({ height: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Optional utility block. You can also leave rows open and move blocks directly into empty grid cells.
          </p>
        </div>
      );
    }

    if (selectedActivity.type === 'submission_builder') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Section Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Button Label</label>
            <input
              type="text"
              value={data.buttonLabel || ''}
              onChange={(e) => updateSelectedActivityData({ buttonLabel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
        </div>
      );
    }

    if (selectedActivity.type === 'save_load_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Section Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateSelectedActivityData({ description: e.target.value })}
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Download Filename</label>
            <input
              type="text"
              value={data.fileName || ''}
              onChange={(e) => updateSelectedActivityData({ fileName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="module-progress"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            This block downloads learner responses as JSON and restores them from uploaded backup files.
          </p>
        </div>
      );
    }

    if (selectedActivity.type === 'tab_group') {
      const tabSpecs = [
        { key: 'activities', match: 'activit', defaultId: 'activities', defaultLabel: 'Activities' },
        { key: 'additional', match: 'additional', defaultId: 'additional', defaultLabel: 'Additional Learning' },
      ];
      const sourceTabs = Array.isArray(data.tabs) ? data.tabs : [];
      const linkableActivities = activities
        .map((activity, idx) => {
          if (idx === selectedActivityIndex) return null;
          const id = String(activity?.id || '').trim();
          if (!id) return null;
          const definition = getActivityDefinition(activity?.type);
          const rawLabel = activity?.data?.title || activity?.data?.text || definition?.label || id;
          const label = String(rawLabel || '').trim() || id;
          return {
            id,
            index: idx,
            type: activity?.type || '',
            label,
          };
        })
        .filter(Boolean);
      const linkableIdSet = new Set(linkableActivities.map((entry) => entry.id));
      const sanitizeIds = (ids) => {
        const next = [];
        const seen = new Set();
        (Array.isArray(ids) ? ids : []).forEach((idValue) => {
          const id = String(idValue || '').trim();
          if (!id || seen.has(id) || !linkableIdSet.has(id)) return;
          seen.add(id);
          next.push(id);
        });
        return next;
      };
      const normalizeTab = (tab, spec) => {
        const source = tab && typeof tab === 'object' ? tab : {};
        return {
          ...source,
          id: String(source.id || spec.defaultId).trim() || spec.defaultId,
          label: String(source.label || spec.defaultLabel).trim() || spec.defaultLabel,
          activityIds: sanitizeIds(source.activityIds),
          activities: Array.isArray(source.activities) ? source.activities : [],
        };
      };
      const findTabIndex = (tabs, spec) =>
        tabs.findIndex((tab) => String(tab?.id || '').toLowerCase().includes(spec.match));
      const getTabValue = (spec) => {
        const idx = findTabIndex(sourceTabs, spec);
        return normalizeTab(idx >= 0 ? sourceTabs[idx] : null, spec);
      };
      const upsertTab = (spec, updater) => {
        const currentTabs = Array.isArray(data.tabs) ? data.tabs : [];
        const idx = findTabIndex(currentTabs, spec);
        const base = normalizeTab(idx >= 0 ? currentTabs[idx] : null, spec);
        const updated = normalizeTab(updater ? updater(base) : base, spec);
        const nextTab = { ...updated, id: spec.defaultId };
        const nextTabs = [...currentTabs];
        if (idx >= 0) nextTabs[idx] = nextTab;
        else nextTabs.push(nextTab);
        updateSelectedActivityData({
          tabs: nextTabs,
          defaultTabId: String(data.defaultTabId || spec.defaultId || 'activities'),
        });
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Tab Group Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Tab Group"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Legacy tab-group mapping. Use the module-level FinLit Options panel for primary tab/link editing.
            </p>
          </div>
          {tabSpecs.map((spec) => {
            const tab = getTabValue(spec);
            const selectedIds = sanitizeIds(tab.activityIds);
            return (
              <div key={`finlit-tab-editor-${spec.key}`} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tab Label</label>
                    <input
                      type="text"
                      value={tab.label}
                      onChange={(e) => upsertTab(spec, (prev) => ({ ...prev, label: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                      placeholder={spec.defaultLabel}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tab ID</label>
                    <div className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-[11px] text-slate-300 font-mono">
                      {spec.defaultId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">{selectedIds.length} linked activities</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => upsertTab(spec, (prev) => ({ ...prev, activityIds: linkableActivities.map((entry) => entry.id) }))}
                      disabled={linkableActivities.length === 0}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => upsertTab(spec, (prev) => ({ ...prev, activityIds: [] }))}
                      disabled={selectedIds.length === 0}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-44 overflow-y-auto rounded border border-slate-700 bg-slate-950/60 divide-y divide-slate-800">
                  {linkableActivities.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500">Add other activities first, then link them to this tab.</p>
                  ) : (
                    linkableActivities.map((entry) => {
                      const checked = selectedIds.includes(entry.id);
                      return (
                        <label key={`${spec.key}-${entry.id}`} className="flex items-start gap-2 p-2 cursor-pointer hover:bg-slate-900/70">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              upsertTab(spec, (prev) => {
                                const current = sanitizeIds(prev.activityIds);
                                const nextSet = new Set(current);
                                if (nextSet.has(entry.id)) nextSet.delete(entry.id);
                                else nextSet.add(entry.id);
                                const ordered = linkableActivities.map((item) => item.id).filter((id) => nextSet.has(id));
                                return { ...prev, activityIds: ordered };
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs text-slate-200 truncate">{entry.label}</span>
                            <span className="block text-[10px] text-slate-500 font-mono truncate">
                              {entry.id} ({entry.type || 'activity'})
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const fallbackTemplate = (() => {
      const def = getActivityDefinition(selectedActivity.type);
      if (def && typeof def.createDefaultData === 'function') {
        return def.createDefaultData();
      }
      return data;
    })();

    return <GenericDataEditor data={data} onChange={replaceSelectedActivityData} schemaTemplate={fallbackTemplate} />;
  };

  return (
    <>
      {editingModule && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit size={20} className="text-blue-400" />
                Edit Module: {editForm.title || 'Untitled'}
              </h3>
              <button onClick={() => setEditingModule(null)} className="text-slate-400 hover:text-white" type="button">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-300 mb-2">Module Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                  placeholder="Module title"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Template Override</label>
                  <select
                    value={editForm.template || ''}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  >
                    {MODULE_TEMPLATE_OPTIONS.map((option) => (
                      <option key={`edit-template-${option.value || 'default'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Theme Override</label>
                  <select
                    value={editForm.theme || ''}
                    onChange={(e) => setEditForm({ ...editForm, theme: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  >
                    {MODULE_THEME_OPTIONS.map((option) => (
                      <option key={`edit-theme-${option.value || 'default'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showFinlitOptions && (
                <details className="mb-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-300 uppercase tracking-wide">FinLit Options</summary>
                  <div className="mt-3 space-y-3">
                    <div className="rounded border border-slate-700 bg-slate-900/60 p-3 space-y-3">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase">Hero</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Optional header content for FinLit modules.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Hero Title</label>
                          <input
                            type="text"
                            value={finlitHero.title}
                            onChange={(e) => updateFinlitHeroField('title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                            placeholder="Module hero title"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Progress Label</label>
                          <input
                            type="text"
                            value={finlitHero.progressLabel}
                            onChange={(e) => updateFinlitHeroField('progressLabel', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                            placeholder="Week 1 of 6"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={finlitHero.subtitle}
                          onChange={(e) => updateFinlitHeroField('subtitle', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                          placeholder="Short supporting line under the hero title"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Media Type</label>
                          <select
                            value={finlitHero.mediaType}
                            onChange={(e) => updateFinlitHeroField('mediaType', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                          >
                            <option value="auto">Auto Detect</option>
                            <option value="image">Image</option>
                            <option value="video">Video File</option>
                            <option value="embed">Embed URL</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Media URL</label>
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              type="text"
                              value={finlitHero.mediaUrl}
                              onChange={(e) => updateFinlitHeroField('mediaUrl', e.target.value)}
                              className="col-span-9 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                              placeholder="https://... /materials/... / YouTube embed URL"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setVaultTargetField({ target: 'finlit-hero-media' });
                                setIsVaultOpen(true);
                              }}
                              className="col-span-3 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                              title="Select hero media from vault"
                            >
                              <FolderOpen size={11} /> Vault
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-slate-700 bg-slate-900/60 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-300 uppercase">Tabs</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Each tab can have its own block arrangement. Open a tab in the builder to edit its content.</p>
                        </div>
                        <button
                          type="button"
                          onClick={addFinlitTab}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white inline-flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Tab
                        </button>
                      </div>
                      <div className="space-y-3">
                        {finlitSettings.tabs.map((tab, tabIndex) => {
                          const tabId = String(tab?.id || `tab-${tabIndex + 1}`);
                          const selectedIds = sanitizeFinlitTabActivityIds(tab?.activityIds);
                          const isCoreTab = FINLIT_CORE_TAB_IDS.includes(tabId);
                          const tabLinks = Array.isArray(tab?.links) ? tab.links : [];
                          const tabActivityCount = Array.isArray(tab?.activities) ? tab.activities.length : 0;
                          const isActiveAuthoringTab = activeFinlitTabId === tabId;
                          return (
                            <div key={`edit-finlit-tab-${tabId}`} className="rounded border border-slate-700 bg-slate-950/70 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-bold text-slate-300 uppercase">
                                    {isCoreTab ? `${tabId} (core)` : `Tab ${tabIndex + 1}`}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {tabActivityCount} block{tabActivityCount === 1 ? '' : 's'}
                                    {isActiveAuthoringTab ? ' • currently editing' : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openFinlitTabInComposer(tabId)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold text-white ${
                                      isActiveAuthoringTab ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
                                    }`}
                                  >
                                    {isActiveAuthoringTab ? 'Editing This Tab' : 'Open In Builder'}
                                  </button>
                                  {!isCoreTab && (
                                    <button
                                      type="button"
                                      onClick={() => removeFinlitTab(tabId)}
                                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white"
                                    >
                                      Remove Tab
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-8">
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tab Label</label>
                                  <input
                                    type="text"
                                    value={tab?.label || ''}
                                    onChange={(e) => updateFinlitTab(tabId, { label: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                    placeholder={`Tab ${tabIndex + 1}`}
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tab ID</label>
                                  <div className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-[11px] text-slate-300 font-mono">
                                    {tabId}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] text-slate-400">{selectedIds.length} linked activities</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateFinlitTab(tabId, { activityIds: finlitLinkableActivities.map((entry) => entry.id) })}
                                    disabled={finlitLinkableActivities.length === 0}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateFinlitTab(tabId, { activityIds: [] })}
                                    disabled={selectedIds.length === 0}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="max-h-44 overflow-y-auto rounded border border-slate-700 bg-slate-900/40 divide-y divide-slate-800">
                                {finlitLinkableActivities.length === 0 ? (
                                  <p className="p-3 text-xs text-slate-500">Add other composer activities first, then link them here.</p>
                                ) : (
                                  finlitLinkableActivities.map((entry) => {
                                    const checked = selectedIds.includes(entry.id);
                                    return (
                                      <label key={`${tabId}-activity-${entry.id}`} className="flex items-start gap-2 p-2 cursor-pointer hover:bg-slate-900/70">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            const nextSet = new Set(selectedIds);
                                            if (nextSet.has(entry.id)) nextSet.delete(entry.id);
                                            else nextSet.add(entry.id);
                                            const ordered = finlitLinkableActivities.map((item) => item.id).filter((id) => nextSet.has(id));
                                            updateFinlitTab(tabId, { activityIds: ordered });
                                          }}
                                          className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500"
                                        />
                                        <span className="min-w-0">
                                          <span className="block text-xs text-slate-200 truncate">{entry.label}</span>
                                          <span className="block text-[10px] text-slate-500 font-mono truncate">
                                            {entry.id} ({entry.type || 'activity'})
                                          </span>
                                        </span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase">Tab Links</label>
                                  <button
                                    type="button"
                                    onClick={() => addFinlitTabLink(tabId)}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white inline-flex items-center gap-1"
                                  >
                                    <Plus size={12} /> Add Link
                                  </button>
                                </div>
                                {tabLinks.length === 0 ? (
                                  <p className="text-[11px] text-slate-500">No links added yet.</p>
                                ) : (
                                  tabLinks.map((link, index) => (
                                    <div key={`${tabId}-link-${index}`} className="rounded border border-slate-700 bg-slate-950/70 p-2 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-300 uppercase">Link {index + 1}</p>
                                        <button
                                          type="button"
                                          onClick={() => removeFinlitTabLink(tabId, index)}
                                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={link?.title || ''}
                                        onChange={(e) => updateFinlitTabLink(tabId, index, { title: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                        placeholder="Link title"
                                      />
                                      <input
                                        type="text"
                                        value={link?.url || ''}
                                        onChange={(e) => updateFinlitTabLink(tabId, index, { url: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs font-mono"
                                        placeholder="https://example.com/resource"
                                      />
                                      <textarea
                                        value={link?.description || ''}
                                        onChange={(e) => updateFinlitTabLink(tabId, index, { description: e.target.value })}
                                        className="w-full h-16 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                        placeholder="Short description shown under the link"
                                      />
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>
              )}
              {editForm.moduleType === 'external' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">URL</label>
                    <input
                      type="text"
                      value={editForm.url || ''}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-sm"
                      placeholder="https://example.com/module"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Link Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkType"
                          value="iframe"
                          checked={editForm.linkType === 'iframe'}
                          onChange={(e) => setEditForm({ ...editForm, linkType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-slate-300">Embed in iframe</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkType"
                          value="newtab"
                          checked={editForm.linkType === 'newtab'}
                          onChange={(e) => setEditForm({ ...editForm, linkType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-slate-300">Open in new tab</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {editForm.moduleType === 'standalone' && (
                <div className="space-y-4">
                  {canUseComposer && (
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Module Mode</label>
                      <div className="grid grid-cols-2 bg-slate-950 border border-slate-700 rounded-lg p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setStandaloneMode('custom_html')}
                          className={`py-2 rounded text-xs font-bold transition-colors ${
                            standaloneMode === 'custom_html'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          Custom HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => setStandaloneMode('composer')}
                          className={`py-2 rounded text-xs font-bold transition-colors ${
                            standaloneMode === 'composer'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          Composer
                        </button>
                      </div>
                      {!composerEnabled && (
                        <p className="text-[11px] text-amber-400 mt-2">
                          Composer mode is currently locked by settings. Existing composer modules remain editable.
                        </p>
                      )}
                    </div>
                  )}

                  {standaloneMode === 'composer' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-5 bg-slate-950 border border-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-white">Activities</h4>
                            <span className="text-[11px] text-slate-500">{activities.length} total</span>
                          </div>
                          <div className="mb-3 p-2 rounded border border-slate-700 bg-slate-900/60">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Layout Mode</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => updateComposerLayoutMode('simple')}
                                className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide border ${
                                  composerLayoutMode === 'simple'
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                Simple
                              </button>
                              <button
                                type="button"
                                onClick={() => updateComposerLayoutMode('canvas')}
                                className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide border ${
                                  composerLayoutMode === 'canvas'
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                Canvas
                              </button>
                            </div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Grid Columns</label>
                            <select
                              value={composerMaxColumns}
                              onChange={(e) => updateComposerMaxColumns(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                            >
                              {[1, 2, 3, 4].map((count) => (
                                <option key={count} value={count}>
                                  {count} {count === 1 ? 'Column' : 'Columns'}
                                </option>
                              ))}
                            </select>
                            {isCanvasMode ? (
                              <div className="grid grid-cols-5 gap-2 mt-2">
                                <label className="text-[10px] text-slate-400">
                                  Row H
                                  <input
                                    type="number"
                                    min="8"
                                    max="200"
                                    value={composerLayout.rowHeight}
                                    onChange={(e) => updateComposerCanvasMetric('rowHeight', e.target.value)}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  Gap X
                                  <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={Array.isArray(composerLayout.margin) ? composerLayout.margin[0] : 12}
                                    onChange={(e) =>
                                      updateComposerCanvasMetric('margin', [
                                        Number.parseInt(e.target.value, 10) || 0,
                                        Array.isArray(composerLayout.margin) ? composerLayout.margin[1] : 12,
                                      ])
                                    }
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  Gap Y
                                  <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={Array.isArray(composerLayout.margin) ? composerLayout.margin[1] : 12}
                                    onChange={(e) =>
                                      updateComposerCanvasMetric('margin', [
                                        Array.isArray(composerLayout.margin) ? composerLayout.margin[0] : 12,
                                        Number.parseInt(e.target.value, 10) || 0,
                                      ])
                                    }
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  Pad X
                                  <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding[0] : 12}
                                    onChange={(e) =>
                                      updateComposerCanvasMetric('containerPadding', [
                                        Number.parseInt(e.target.value, 10) || 0,
                                        Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding[1] : 12,
                                      ])
                                    }
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  Pad Y
                                  <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding[1] : 12}
                                    onChange={(e) =>
                                      updateComposerCanvasMetric('containerPadding', [
                                        Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding[0] : 12,
                                        Number.parseInt(e.target.value, 10) || 0,
                                      ])
                                    }
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                  />
                                </label>
                              </div>
                            ) : (
                              <label className="mt-2 flex items-center justify-between gap-3 rounded border border-slate-700 bg-slate-900/70 px-2 py-2 text-[10px] text-slate-300">
                                <div>
                                  <p className="font-black uppercase tracking-wide text-slate-200">Match Tallest Block Per Row</p>
                                  <p className="text-slate-500">Keep row cards the same height in simple mode.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateComposerSimpleMatchTallestRow(!(composerLayout.simpleMatchTallestRow === true))}
                                  className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                    composerLayout.simpleMatchTallestRow === true
                                      ? 'border-blue-300 bg-blue-500'
                                      : 'border-slate-600 bg-slate-800'
                                  }`}
                                  aria-label="Toggle simple row height matching"
                                >
                                  <span
                                    className={`mx-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                      composerLayout.simpleMatchTallestRow === true ? 'translate-x-4' : ''
                                    }`}
                                  />
                                </button>
                              </label>
                            )}
                          </div>

                          <div className="max-h-72 overflow-y-auto pr-1">
                            {isCanvasMode ? (
                              <GridLayout
                                className="layout"
                                layout={activities.map((activity, idx) => ({
                                  i: String(idx),
                                  x: Number.isInteger(activity?.layout?.x) ? activity.layout.x : 0,
                                  y: Number.isInteger(activity?.layout?.y) ? activity.layout.y : 0,
                                  w: Math.max(1, Math.min(composerMaxColumns, Number.parseInt(activity?.layout?.w, 10) || Number.parseInt(activity?.layout?.colSpan, 10) || 1)),
                                  h: Math.max(1, Number.parseInt(activity?.layout?.h, 10) || 4),
                                }))}
                                cols={composerMaxColumns}
                                rowHeight={composerLayout.rowHeight}
                                margin={Array.isArray(composerLayout.margin) ? composerLayout.margin : [12, 12]}
                                containerPadding={Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding : [12, 12]}
                                autoSize
                                isResizable
                                isDraggable
                                compactType={null}
                                verticalCompact={false}
                                preventCollision={false}
                                draggableHandle=".cf-canvas-handle"
                                onLayoutChange={applyCanvasGridLayout}
                              >
                                {activities.map((activity, idx) => {
                                  const def = getActivityDefinition(activity.type);
                                  const isSelected = idx === selectedActivityIndex;
                                  return (
                                    <div key={String(idx)} className="overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedActivityIndex(idx)}
                                        className={`w-full h-full text-left p-2 rounded border transition-colors ${
                                          isSelected
                                            ? 'bg-emerald-900/30 border-emerald-600 text-white'
                                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-bold truncate">{def?.label || activity.type}</p>
                                          <span className="cf-canvas-handle inline-flex items-center justify-center w-5 h-5 rounded bg-slate-800 text-slate-300 text-[10px] font-black cursor-grab active:cursor-grabbing">
                                            ::
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-mono truncate mt-1">{activity.id || `activity-${idx + 1}`}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                                          x:{activity?.layout?.x || 0} y:{activity?.layout?.y || 0} w:{activity?.layout?.w || 1} h:{activity?.layout?.h || 4}
                                        </p>
                                      </button>
                                    </div>
                                  );
                                })}
                              </GridLayout>
                            ) : null}
                            <div className={`${isCanvasMode ? 'hidden ' : ''}grid gap-2`} style={{ gridTemplateColumns: `repeat(${composerMaxColumns}, minmax(0, 1fr))` }}>
                              {composerGridModel.emptySlots.map((slot) => {
                                const isSlotTarget =
                                  draggingActivityIndex !== null &&
                                  dragOverSlotKey === slot.key &&
                                  dragOverActivityIndex === null;
                                return (
                                  <div
                                    key={slot.key}
                                    className={`relative rounded border border-dashed transition-colors ${
                                      isSlotTarget
                                        ? 'border-indigo-400 bg-indigo-500/20'
                                        : 'border-slate-700/80 bg-slate-900/35'
                                    }`}
                                    style={{ gridColumn: `${slot.col}`, gridRow: `${slot.row}`, minHeight: '58px' }}
                                    onDragOver={(event) => {
                                      if (!Number.isInteger(draggingActivityIndex)) return;
                                      event.preventDefault();
                                      if (event.dataTransfer) {
                                        event.dataTransfer.dropEffect = 'move';
                                      }
                                      if (dragOverSlotKey !== slot.key) setDragOverSlotKey(slot.key);
                                      if (dragOverActivityIndex !== null) setDragOverActivityIndex(null);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverSlotKey === slot.key) setDragOverSlotKey(null);
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                                      const fromIndex = Number.isInteger(draggingActivityIndex) ? draggingActivityIndex : fallback;
                                      moveActivityToCell(fromIndex, slot.row, slot.col);
                                      setDraggingActivityIndex(null);
                                      setDragOverActivityIndex(null);
                                      setDragOverSlotKey(null);
                                    }}
                                  >
                                    <button
                                      type="button"
                                      draggable={false}
                                      onDragStart={(event) => event.preventDefault()}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeEmptyRowAt(slot.row);
                                      }}
                                      className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded border border-slate-600/60 bg-slate-900/40 text-slate-300 hover:border-rose-400/70 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
                                      title="Delete empty row"
                                      aria-label={`Delete empty row ${slot.row}`}
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                );
                              })}
                              {activities.map((activity, idx) => {
                                const def = getActivityDefinition(activity.type);
                                const colSpan = Math.min(activity?.layout?.colSpan || 1, composerMaxColumns);
                                const placement = composerPlacementsByIndex.get(idx);
                                const isSelected = idx === selectedActivityIndex;
                                const isDropTarget = idx === dragOverActivityIndex && draggingActivityIndex !== null && idx !== draggingActivityIndex;
                                return (
                                  <div
                                    key={activity.id || `${activity.type}-${idx}`}
                                    className="relative"
                                    style={{
                                      gridColumn: placement
                                        ? `${placement.col} / span ${placement.colSpan}`
                                        : `span ${colSpan} / span ${colSpan}`,
                                      gridRow: placement ? `${placement.row}` : undefined,
                                    }}
                                    draggable
                                    onDragStart={(event) => {
                                      setDraggingActivityIndex(idx);
                                      setSelectedActivityIndex(idx);
                                      setDragOverSlotKey(null);
                                      if (event.dataTransfer) {
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', String(idx));
                                      }
                                    }}
                                    onDragOver={(event) => {
                                      event.preventDefault();
                                      if (event.dataTransfer) {
                                        event.dataTransfer.dropEffect = 'move';
                                      }
                                      if (dragOverActivityIndex !== idx) setDragOverActivityIndex(idx);
                                      if (dragOverSlotKey !== null) setDragOverSlotKey(null);
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                                      const fromIndex = Number.isInteger(draggingActivityIndex) ? draggingActivityIndex : fallback;
                                      moveActivityToCell(fromIndex, placement?.row || 1, placement?.col || 1);
                                      setDraggingActivityIndex(null);
                                      setDragOverActivityIndex(null);
                                      setDragOverSlotKey(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggingActivityIndex(null);
                                      setDragOverActivityIndex(null);
                                      setDragOverSlotKey(null);
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedActivityIndex(idx)}
                                      className={`w-full text-left p-2 pr-8 rounded border transition-colors ${
                                        isSelected
                                          ? 'bg-emerald-900/30 border-emerald-600 text-white'
                                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                                      } ${isDropTarget ? 'ring-1 ring-indigo-400 border-indigo-500' : ''}`}
                                    >
                                      <p className="text-xs font-bold">{def?.label || activity.type}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">{activity.id || `activity-${idx + 1}`}</p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Span {colSpan}</p>
                                    </button>
                                    <button
                                      type="button"
                                      draggable={false}
                                      onDragStart={(event) => event.preventDefault()}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeActivityByIndex(idx);
                                      }}
                                      className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded border border-slate-600/60 bg-slate-900/40 text-slate-300 hover:border-rose-400/70 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
                                      title="Delete block"
                                      aria-label={`Delete ${def?.label || activity.type}`}
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            {activities.length === 0 && <p className="text-xs text-slate-500 mt-1">No activities yet.</p>}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-700">
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={newActivityType}
                                onChange={(e) => setNewActivityType(e.target.value)}
                                className="col-span-2 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                              >
                                {activityTypeGroups.map((group) => (
                                  <optgroup key={`modal-group-${group.category}`} label={group.label}>
                                    {group.types.map((type) => {
                                      const def = getActivityDefinition(type);
                                      return (
                                        <option key={type} value={type}>
                                          {def?.label || type}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={addActivity}
                                className="bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                              >
                                <Plus size={12} /> Add
                              </button>
                            </div>
                            {!isCanvasMode ? (
                              <>
                                <button
                                  type="button"
                                  onClick={addEmptyRow}
                                  className="w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 text-white text-xs inline-flex items-center justify-center gap-1"
                                  title="Add one open row below the selected block (or at bottom if none selected)"
                                >
                                  <Plus size={12} /> Add Open Row
                                </button>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase self-center">Selected Span</label>
                                  <select
                                    value={selectedActivity?.layout?.colSpan || 1}
                                    onChange={(e) => updateSelectedActivitySpan(e.target.value)}
                                    disabled={!selectedActivity}
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs disabled:opacity-40"
                                  >
                                    {Array.from({ length: composerMaxColumns }, (_, idx) => idx + 1).map((span) => (
                                      <option key={span} value={span}>
                                        Span {span}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedActivity('left')}
                                    disabled={!selectedActivity || !selectedPlacement || selectedPlacement.col <= 1}
                                    className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                    title="Move left"
                                  >
                                    <ChevronLeft size={12} /> Left
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedActivity('right')}
                                    disabled={
                                      !selectedActivity ||
                                      !selectedPlacement ||
                                      selectedPlacement.col >= Math.max(1, composerMaxColumns - (selectedActivity?.layout?.colSpan || 1) + 1)
                                    }
                                    className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                    title="Move right"
                                  >
                                    <ChevronRight size={12} /> Right
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedActivity('up')}
                                    disabled={!selectedActivity || !selectedPlacement || selectedPlacement.row <= 1}
                                    className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                  >
                                    <ChevronUp size={12} /> Up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedActivity('down')}
                                    disabled={!selectedActivity}
                                    className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                  >
                                    <ChevronDown size={12} /> Down
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                <label className="text-[10px] text-slate-400">
                                  X
                                  <input
                                    type="number"
                                    min="0"
                                    value={selectedActivity?.layout?.x || 0}
                                    onChange={(e) => updateSelectedActivityCanvasLayout({ x: Number.parseInt(e.target.value, 10) || 0 })}
                                    disabled={!selectedActivity}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  Y
                                  <input
                                    type="number"
                                    min="0"
                                    value={selectedActivity?.layout?.y || 0}
                                    onChange={(e) => updateSelectedActivityCanvasLayout({ y: Number.parseInt(e.target.value, 10) || 0 })}
                                    disabled={!selectedActivity}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  W
                                  <input
                                    type="number"
                                    min="1"
                                    max={composerMaxColumns}
                                    value={selectedActivity?.layout?.w || 1}
                                    onChange={(e) => {
                                      const nextW = Math.max(1, Number.parseInt(e.target.value, 10) || 1);
                                      updateSelectedActivityCanvasLayout({ w: nextW, colSpan: nextW });
                                    }}
                                    disabled={!selectedActivity}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-400">
                                  H
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedActivity?.layout?.h || 4}
                                    onChange={(e) => updateSelectedActivityCanvasLayout({ h: Math.max(1, Number.parseInt(e.target.value, 10) || 1) })}
                                    disabled={!selectedActivity}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                  />
                                </label>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={duplicateSelectedActivity}
                                disabled={!selectedActivity}
                                className="flex-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                title="Duplicate selected activity"
                              >
                                <Copy size={12} /> Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={removeSelectedActivity}
                                disabled={!selectedActivity}
                                className="flex-1 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                title="Delete selected activity"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-7 bg-slate-950 border border-slate-700 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-white mb-3">
                            {selectedActivity ? (getActivityDefinition(selectedActivity.type)?.label || selectedActivity.type) : 'Activity Editor'}
                          </h4>
                          {renderSelectedActivityStylePanel()}
                          {renderActivityEditor()}
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-white">Live Module Preview</h4>
                          <button
                            type="button"
                            onClick={() => {
                              composerPreviewShouldFollowRef.current = false;
                              setComposerPreviewNonce((n) => n + 1);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                            title="Remount preview iframe"
                          >
                            <RefreshCw size={12} />
                            Reset
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3">Preview updates while you edit activities.</p>
                        <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                          {composerPreviewSrcDoc ? (
                            <iframe
                              ref={composerPreviewIframeRef}
                              key={`composer-edit-preview-${editForm.id || 'draft'}-${composerPreviewNonce}`}
                              srcDoc={composerPreviewSrcDoc}
                              className="w-full border-0"
                              style={{ minHeight: '420px' }}
                              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
                              title="Composer live preview"
                              onLoad={() => {
                                if (!composerPreviewShouldFollowRef.current) return;
                                const targetId = composerPreviewTargetActivityIdRef.current;
                                if (!targetId) return;
                                if (scrollComposerPreviewToActivity(targetId)) {
                                  composerPreviewShouldFollowRef.current = false;
                                }
                              }}
                            />
                          ) : (
                            <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                              Composer preview unavailable.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Full HTML Document</label>
                      <p className="text-xs text-emerald-400 mb-2 font-medium">
                        Edit the complete HTML document - your code runs as-is in an iframe
                      </p>
                      <textarea
                        value={editForm.fullDocument || ''}
                        onChange={(e) => setEditForm({ ...editForm, fullDocument: e.target.value })}
                        className="w-full h-96 bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-xs"
                        placeholder="<!DOCTYPE html>..."
                      />
                    </div>
                  )}
                </div>
              )}

              {editForm.moduleType === 'legacy' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">HTML</label>
                    <textarea
                      value={editForm.html || ''}
                      onChange={(e) => setEditForm({ ...editForm, html: e.target.value })}
                      className="w-full h-64 bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Script</label>
                    <textarea
                      value={editForm.script || ''}
                      onChange={(e) => setEditForm({ ...editForm, script: e.target.value })}
                      className="w-full h-64 bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-800 border-t border-slate-700 p-4 flex gap-3">
              <button onClick={() => setEditingModule(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" type="button">
                Cancel
              </button>
              <button
                onClick={() => {
                  const module = projectData['Current Course']?.modules?.find((m) => m.id === editingModule);
                  if (module?.history && module.history.length > 0) {
                    setModuleHistory({ moduleId: editingModule, history: module.history });
                  } else {
                    alert('No version history available for this module yet. History is created when you save changes.');
                  }
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center gap-2 transition-colors"
                title="View version history"
                type="button"
              >
                <Clock size={16} />
                History
              </button>
              <button onClick={saveEditModule} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg transition-colors" type="button">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {isVaultOpen && (
        <VaultBrowser
          mode="file"
          onSelect={handleVaultSelect}
          onClose={() => {
            setIsVaultOpen(false);
            setVaultTargetField(null);
          }}
        />
      )}

      {moduleHistory && (
        <div className="fixed inset-0 bg-black/80 z-[55] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModuleHistory(null)}>
          <div
            className="bg-slate-900 border border-amber-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={20} className="text-amber-400" />
                Version History
              </h3>
              <button onClick={() => setModuleHistory(null)} className="text-slate-400 hover:text-white" type="button">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {moduleHistory.history.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No version history available yet.</p>
              ) : (
                <div className="space-y-3">
                  {moduleHistory.history.map((version, idx) => {
                    const date = new Date(version.timestamp);
                    const isLatest = idx === moduleHistory.history.length - 1;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          isLatest ? 'bg-amber-900/20 border-amber-700/50' : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">Version {moduleHistory.history.length - idx}</span>
                              {isLatest && (
                                <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded uppercase font-bold">Current</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {date.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!isLatest && (
                            <button
                              onClick={() => {
                                if (confirm('Revert to this version? This will replace the current version.')) {
                                  revertModuleVersion(moduleHistory.moduleId, idx);
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                              type="button"
                            >
                              <RotateCcw size={12} />
                              Revert
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-mono truncate" title={version.title}>
                          {version.title}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-500">
                          {version.html && <span>HTML: {(version.html.length / 1024).toFixed(1)}KB</span>}
                          {version.css && <span className="ml-2">CSS: {(version.css.length / 1024).toFixed(1)}KB</span>}
                          {version.script && <span className="ml-2">Script: {(version.script.length / 1024).toFixed(1)}KB</span>}
                          {version.url && <span className="ml-2">External Link</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-800 border-t border-slate-700 p-4">
              <p className="text-xs text-slate-400 text-center">History is automatically saved when you make changes. Last 10 versions are kept.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
