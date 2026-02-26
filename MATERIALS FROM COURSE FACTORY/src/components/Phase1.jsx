import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  Box,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileJson,
  FolderOpen,
  PenTool,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import VaultBrowser from './VaultBrowser';
import { CodeBlock } from './Shared.jsx';
import GenericDataEditor from './GenericDataEditor.jsx';
import HotspotEditor from './composer/HotspotEditor.jsx';
import ComposerSidebarTools from './composer/ComposerSidebarTools.jsx';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  buildModuleFrameHTML,
  buildPreviewStorageScope,
  buildScopedStorageBootstrapTag,
  cleanModuleScript,
  getMaterialBadgeLabel,
  validateModule,
} from '../utils/generators.js';
import {
  createKnowledgeCheckBuilderQuestion,
  createWorksheetBuilderBlock,
  getActivityDefinition,
  listActivityTypeGroups,
  normalizeFillableChartData,
  normalizeKnowledgeCheckBuilderQuestions,
  normalizeWorksheetBuilderBlocks,
} from '../composer/activityRegistry.js';
import vaultIndex from '../data/vault.json';
import {
  buildComposerGridModel,
  clampComposerColSpan,
  moveComposerActivityToCell,
  normalizeComposerActivities,
  normalizeComposerLayout,
} from '../composer/layout.js';
import {
  applyTemplateLayoutProfile,
  captureTemplateLayoutProfile,
  cloneTemplateLayoutProfile,
  normalizeTemplateLayoutProfiles,
  resolveTemplateKey,
} from '../composer/templateLayoutProfiles.js';
import {
  FINLIT_CORE_TAB_IDS,
  createFinlitHeroFormState,
  createFinlitTemplateFormState,
  normalizeFinlitHeroForSave,
  normalizeFinlitTemplateForSave,
} from '../utils/finlitHero.js';
import { resolveFinlitTabComposerState } from '../utils/finlitTabActivities.js';

const { useEffect, useMemo, useRef, useState } = React;
const GridLayout = WidthProvider(ReactGridLayout);

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

function getComposerRichEditorConfig(activity) {
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

const MODULE_MANAGER_AUTOSAVE_KEY = 'course_factory_module_manager_autosave_v1';
const MODULE_MANAGER_SAVED_DRAFTS_KEY = 'course_factory_module_manager_saved_drafts_v1';
const MODULE_MANAGER_MAX_SAVED_DRAFTS = 30;

// --- PHASE 1: HARVEST ---
const Phase1 = ({ projectData, setProjectData, addMaterial, editMaterial, deleteMaterial, moveMaterial, toggleMaterialHidden, addAssessment, editAssessment, deleteAssessment, moveAssessment, toggleAssessmentHidden, addQuestionToMaster, moveQuestion, deleteQuestion, updateQuestion, clearMasterAssessment, masterQuestions, setMasterQuestions, masterAssessmentTitle, setMasterAssessmentTitle, currentQuestionType, setCurrentQuestionType, currentQuestion, setCurrentQuestion, editingQuestion, setEditingQuestion, generateMixedAssessment, generatedAssessment, setGeneratedAssessment, assessmentType, setAssessmentType, assessmentTitle, setAssessmentTitle, quizQuestions, setQuizQuestions, printInstructions, setPrintInstructions, editingAssessment, setEditingAssessment, isVaultOpen, setIsVaultOpen, setVaultTargetField, vaultTargetField }) => {
  const [harvestType, setHarvestType] = useState('MODULE_MANAGER'); // 'ASSESSMENT', 'MATERIALS', 'AI_MODULE', 'MODULE_MANAGER'
  const [mode, setMode] = useState('ADD');
  const [importInput, setImportInput] = useState("");
  const [importPreview, setImportPreview] = useState([]); 
  
  // MODULE MANAGER STATE
  const [moduleManagerType, setModuleManagerType] = useState('standalone'); // 'standalone' | 'composer' | 'external'
  const [moduleManagerTemplate, setModuleManagerTemplate] = useState('');
  const [moduleManagerTemplateLayoutProfiles, setModuleManagerTemplateLayoutProfiles] = useState({});
  const [moduleManagerTheme, setModuleManagerTheme] = useState('');
  const [moduleManagerHero, setModuleManagerHero] = useState(() => createFinlitHeroFormState());
  const [moduleManagerFinlit, setModuleManagerFinlit] = useState(() => createFinlitTemplateFormState());
  const [moduleManagerFinlitAuthoringTabId, setModuleManagerFinlitAuthoringTabId] = useState('activities');
  const [moduleManagerComposerStarterType, setModuleManagerComposerStarterType] = useState('content_block');
  const moduleManagerActivityTypeGroups = useMemo(() => listActivityTypeGroups(), []);
  const [moduleManagerComposerLayout, setModuleManagerComposerLayout] = useState({
    mode: 'simple',
    maxColumns: 1,
    rowHeight: 24,
    margin: [12, 12],
    containerPadding: [12, 12],
    simpleMatchTallestRow: false,
  });
  const [moduleManagerComposerActivities, setModuleManagerComposerActivities] = useState([]);
  const [moduleManagerComposerExtraRows, setModuleManagerComposerExtraRows] = useState(0);
  const [moduleManagerComposerSelectedIndex, setModuleManagerComposerSelectedIndex] = useState(0);
  const [moduleManagerComposerDraggingIndex, setModuleManagerComposerDraggingIndex] = useState(null);
  const [moduleManagerComposerDragOverIndex, setModuleManagerComposerDragOverIndex] = useState(null);
  const [moduleManagerComposerDragOverSlotKey, setModuleManagerComposerDragOverSlotKey] = useState(null);
  const [moduleManagerKnowledgeDragIndex, setModuleManagerKnowledgeDragIndex] = useState(null);
  const [moduleManagerKnowledgeDragOverIndex, setModuleManagerKnowledgeDragOverIndex] = useState(null);
  const [moduleManagerWorksheetDragIndex, setModuleManagerWorksheetDragIndex] = useState(null);
  const [moduleManagerWorksheetDragOverIndex, setModuleManagerWorksheetDragOverIndex] = useState(null);
  const [moduleManagerResourceMaterialId, setModuleManagerResourceMaterialId] = useState('');
  const [moduleManagerImageMaterialId, setModuleManagerImageMaterialId] = useState('');
  const [moduleManagerAssessmentId, setModuleManagerAssessmentId] = useState('');
  const [moduleManagerComposerPreviewNonce, setModuleManagerComposerPreviewNonce] = useState(0);
  const [moduleManagerComposerSidebarMode, setModuleManagerComposerSidebarMode] = useState('grid'); // 'grid' | 'outline' | 'issues' | 'templates'
  const [moduleManagerComposerLeftPaneCollapsed, setModuleManagerComposerLeftPaneCollapsed] = useState(false);
  const [moduleManagerComposerLeftPaneMode, setModuleManagerComposerLeftPaneMode] = useState('builder'); // 'builder' | 'editor'
  const [moduleManagerComposerPreviewCollapsed, setModuleManagerComposerPreviewCollapsed] = useState(false);
  const [moduleManagerComposerPreviewWidth, setModuleManagerComposerPreviewWidth] = useState(55);
  const [moduleManagerComposerPreviewHeight, setModuleManagerComposerPreviewHeight] = useState(900);
  const [moduleManagerComposerBuilderHeight, setModuleManagerComposerBuilderHeight] = useState(760);
  const [moduleManagerComposerBuilderCellWidth, setModuleManagerComposerBuilderCellWidth] = useState(220);
  const [moduleManagerComposerWorkspaceControlsCollapsed, setModuleManagerComposerWorkspaceControlsCollapsed] = useState(false);
  const [moduleManagerComposerCanvasGapRows, setModuleManagerComposerCanvasGapRows] = useState(1);
  const [moduleManagerComposerLockBuilderScale, setModuleManagerComposerLockBuilderScale] = useState(true);
  const [, setModuleManagerComposerHistoryVersion] = useState(0);
  const moduleManagerRichEditorRef = useRef(null);
  const moduleManagerRichEditorSelectionRef = useRef(null);
  const moduleManagerRichEditorUpdateTimerRef = useRef(null);
  const moduleManagerComposerPreviewIframeRef = useRef(null);
  const moduleManagerComposerPreviewTargetActivityIdRef = useRef('');
  const moduleManagerComposerPreviewShouldFollowRef = useRef(false);
  const moduleManagerComposerHistoryRef = useRef({ past: [], future: [] });
  const moduleManagerCanvasInteractionRef = useRef({ snapshot: null, changed: false, activeId: null, mode: null });
  const moduleManagerDraftImportRef = useRef(null);
  const [moduleManagerHTML, setModuleManagerHTML] = useState('');
  const [moduleManagerURL, setModuleManagerURL] = useState('');
  const [moduleManagerID, setModuleManagerID] = useState('');
  const [moduleManagerTitle, setModuleManagerTitle] = useState('');
  const [moduleManagerLinkType, setModuleManagerLinkType] = useState('iframe'); // 'iframe' | 'newtab'
  const [moduleManagerStatus, setModuleManagerStatus] = useState(null);
  const [moduleManagerMessage, setModuleManagerMessage] = useState('');
  const [testingLink, setTestingLink] = useState(false);
  const [linkTestResult, setLinkTestResult] = useState(null); 
  const [stagingJson, setStagingJson] = useState("");
  const [stagingTitle, setStagingTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // 'success'
  const [moduleManagerSavedDrafts, setModuleManagerSavedDrafts] = useState([]);
  const [moduleManagerSelectedDraftId, setModuleManagerSelectedDraftId] = useState('');
  const [moduleManagerDownloadDraftOnSave, setModuleManagerDownloadDraftOnSave] = useState(true);

  const moduleBankMaterials = useMemo(
    () =>
      ((projectData?.["Current Course"]?.materials || [])
        .filter((mat) => !mat.hidden)
        .sort((a, b) => (a.order || 0) - (b.order || 0))),
    [projectData],
  );
  const moduleBankImageAssets = useMemo(
    () => moduleBankMaterials.map(extractMaterialImageAsset).filter(Boolean),
    [moduleBankMaterials],
  );
  const moduleBankAssessments = useMemo(() => {
    const modules = projectData?.["Current Course"]?.modules || [];
    return modules
      .flatMap((mod) => (mod.assessments || []).map((assessment) => ({ ...assessment, moduleId: mod.id, moduleTitle: mod.title })))
      .filter((assessment) => !assessment.hidden);
  }, [projectData]);

  // NEW: AI Studio Module Creator State
  const [aiDescription, setAiDescription] = useState("");
  const [migrateCode, setMigrateCode] = useState("");
  const [migratePrompt, setMigratePrompt] = useState("");
  const [migrateOutput, setMigrateOutput] = useState("");

  // Assessment override colors (Phase 1 Edit modal) - "Use course default" + common colors
  const assessmentOverrideOptions = [
    { value: '', label: 'Use course default' },
    { value: 'white', label: 'White', swatch: 'bg-white border-slate-300', text: 'text-slate-900' },
    { value: 'slate-900', label: 'Slate 900', swatch: 'bg-slate-900 border-slate-700', text: 'text-white' },
    { value: 'slate-800', label: 'Slate 800', swatch: 'bg-slate-800 border-slate-700', text: 'text-white' },
    { value: 'slate-700', label: 'Slate 700', swatch: 'bg-slate-700 border-slate-600', text: 'text-white' },
    { value: 'slate-600', label: 'Slate 600', swatch: 'bg-slate-600 border-slate-500', text: 'text-white' },
    { value: 'slate-400', label: 'Slate 400', swatch: 'bg-slate-400 border-slate-300', text: 'text-white' },
    { value: 'slate-300', label: 'Slate 300', swatch: 'bg-slate-300 border-slate-200', text: 'text-slate-900' },
    { value: 'slate-200', label: 'Slate 200', swatch: 'bg-slate-200 border-slate-100', text: 'text-slate-900' },
    { value: 'gray-900', label: 'Gray 900', swatch: 'bg-gray-900 border-gray-700', text: 'text-white' },
    { value: 'gray-700', label: 'Gray 700', swatch: 'bg-gray-700 border-gray-600', text: 'text-white' },
    { value: 'black', label: 'Black', swatch: 'bg-black border-slate-700', text: 'text-white' }
  ];

  // Material card themes (Phase 1 Edit modal)
  const materialThemeOptions = [
    { value: '', label: 'Use course default' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'muted', label: 'Muted' },
    { value: 'high-contrast-light', label: 'High contrast (light)' },
    { value: 'high-contrast-dark', label: 'High contrast (dark)' }
  ];

  // Materials Manager State
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [phase1MaterialPreview, setPhase1MaterialPreview] = useState(null);
  const [phase1AssessmentPreview, setPhase1AssessmentPreview] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    number: '',
    title: '',
    description: '',
    viewUrl: '',
    downloadUrl: '',
    color: 'slate',
    mediaType: 'number',
    themeOverride: null,
    assignedModules: [],
    hasDigitalContent: false,
    digitalContent: null,
    digitalContentJson: '' // Raw JSON string for editing
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [parsedAiModule, setParsedAiModule] = useState(null);
  const [aiParseError, setAiParseError] = useState(null);
  const normalizedModuleManagerLayout = normalizeComposerLayout(moduleManagerComposerLayout);
  const moduleManagerComposerMaxColumns = normalizedModuleManagerLayout.maxColumns;
  const moduleManagerComposerLayoutMode = normalizedModuleManagerLayout.mode;
  const isModuleManagerCanvasMode = moduleManagerComposerLayoutMode === 'canvas';
  const courseTemplateDefault = String(projectData?.['Course Settings']?.templateDefault || 'deck').trim().toLowerCase();
  const moduleManagerEffectiveTemplate = resolveTemplateKey(moduleManagerTemplate, courseTemplateDefault);
  const showModuleManagerFinlitOptions = moduleManagerType === 'composer' && moduleManagerEffectiveTemplate === 'finlit';
  const isModuleManagerFinlitComposer = showModuleManagerFinlitOptions;
  const normalizedModuleManagerTemplateProfiles = useMemo(
    () => normalizeTemplateLayoutProfiles(moduleManagerTemplateLayoutProfiles, { activities: moduleManagerComposerActivities }),
    [moduleManagerTemplateLayoutProfiles, moduleManagerComposerActivities],
  );
  const moduleManagerFinlitState = createFinlitTemplateFormState(moduleManagerFinlit);
  const moduleManagerResolvedFinlitComposerState = useMemo(
    () =>
      resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: moduleManagerComposerActivities,
        composerLayout: normalizedModuleManagerLayout,
        activeTabId: moduleManagerFinlitAuthoringTabId,
        activeTabActivities: moduleManagerComposerActivities,
      }),
    [
      moduleManagerComposerActivities,
      moduleManagerFinlitAuthoringTabId,
      moduleManagerFinlitState,
      normalizedModuleManagerLayout,
    ],
  );
  const moduleManagerCanonicalComposerActivities = useMemo(
    () =>
      Array.isArray(moduleManagerResolvedFinlitComposerState?.canonicalActivities)
        ? moduleManagerResolvedFinlitComposerState.canonicalActivities
        : [],
    [moduleManagerResolvedFinlitComposerState],
  );
  const moduleManagerActiveFinlitTabId = useMemo(
    () =>
      isModuleManagerFinlitComposer
        ? moduleManagerResolvedFinlitComposerState?.activeTabId || 'activities'
        : 'activities',
    [isModuleManagerFinlitComposer, moduleManagerResolvedFinlitComposerState],
  );
  const moduleManagerFinlitLinkableActivities = useMemo(
    () =>
      (isModuleManagerFinlitComposer ? moduleManagerCanonicalComposerActivities : moduleManagerComposerActivities)
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
    [isModuleManagerFinlitComposer, moduleManagerCanonicalComposerActivities, moduleManagerComposerActivities],
  );
  const moduleManagerPreviewPaneWidth = Math.max(30, Math.min(75, Number(moduleManagerComposerPreviewWidth) || 55));
  const moduleManagerPreviewPaneHeight = Math.max(420, Math.min(2000, Number(moduleManagerComposerPreviewHeight) || 900));
  const moduleManagerBuilderPaneHeight = Math.max(360, Math.min(1800, Number(moduleManagerComposerBuilderHeight) || 760));
  const moduleManagerBuilderCellWidth = Math.max(140, Math.min(360, Number(moduleManagerComposerBuilderCellWidth) || 220));
  const moduleManagerCanvasGapRowCount = Math.max(1, Math.min(12, Number.parseInt(moduleManagerComposerCanvasGapRows, 10) || 1));
  const moduleManagerBuilderCanvasWidth = moduleManagerComposerMaxColumns * moduleManagerBuilderCellWidth;
  const moduleManagerEditorPaneWidth = Math.max(25, 100 - moduleManagerPreviewPaneWidth);
  const moduleManagerBothWorkspacePanesOpen = !moduleManagerComposerLeftPaneCollapsed && !moduleManagerComposerPreviewCollapsed;
  const moduleManagerGridModel = useMemo(
    () =>
      buildComposerGridModel(moduleManagerComposerActivities, moduleManagerComposerMaxColumns, {
        includeTrailingRow: true,
        trailingRows: moduleManagerComposerExtraRows,
      }),
    [moduleManagerComposerActivities, moduleManagerComposerExtraRows, moduleManagerComposerMaxColumns],
  );
  const moduleManagerPlacementByIndex = useMemo(
    () => new Map(moduleManagerGridModel.placements.map((placement) => [placement.index, placement])),
    [moduleManagerGridModel],
  );
  const moduleManagerCanvasItems = useMemo(
    () =>
      moduleManagerComposerActivities.map((activity, idx) => ({
        i: String(idx),
        x: Number.isInteger(activity?.layout?.x) ? activity.layout.x : Math.max(0, (activity?.layout?.col || 1) - 1),
        y: Number.isInteger(activity?.layout?.y) ? activity.layout.y : Math.max(0, (activity?.layout?.row || 1) - 1),
        w: Number.isInteger(activity?.layout?.w) ? activity.layout.w : Math.max(1, activity?.layout?.colSpan || 1),
        h: Number.isInteger(activity?.layout?.h) ? activity.layout.h : 4,
      })),
    [moduleManagerComposerActivities],
  );
  const moduleManagerCanvasOccupiedRows = useMemo(
    () =>
      moduleManagerCanvasItems.reduce(
        (largest, item) => Math.max(largest, Math.max(0, Number.parseInt(item.y, 10) || 0) + Math.max(1, Number.parseInt(item.h, 10) || 1)),
        1,
      ),
    [moduleManagerCanvasItems],
  );
  const moduleManagerCanvasMarginY = Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin[1] : 12;
  const moduleManagerCanvasPaddingY = Array.isArray(normalizedModuleManagerLayout.containerPadding)
    ? normalizedModuleManagerLayout.containerPadding[1]
    : 12;
  const moduleManagerCanvasVisibleRows = Math.max(1, moduleManagerCanvasOccupiedRows + Math.max(0, moduleManagerComposerExtraRows || 0));
  const moduleManagerCanvasMinHeight =
    moduleManagerCanvasVisibleRows * normalizedModuleManagerLayout.rowHeight +
    Math.max(0, moduleManagerCanvasVisibleRows - 1) * moduleManagerCanvasMarginY +
    moduleManagerCanvasPaddingY * 2;

  // Assessment Generator Functions
  const handleVaultSelect = (payload) => {
    const kind = payload && typeof payload === 'object' ? payload.kind : null;
    const selectedFile = kind === 'vault-file' ? payload.file : payload;
    const selectedFolderSegments =
      kind === 'vault-folder' && payload && Array.isArray(payload.segments) ? payload.segments : null;

    if (
      selectedFolderSegments &&
      vaultTargetField &&
      typeof vaultTargetField === 'object' &&
      vaultTargetField.target === 'composer-resource-folder-import'
    ) {
      if (selectedComposerActivity?.type === 'resource_list') {
        const items = Array.isArray(selectedComposerActivity.data?.items) ? selectedComposerActivity.data.items : [];
        const folderPrefix = `/Course-factoryPERFECT/materials/${selectedFolderSegments.join('/')}`.replace(/\/+$/, '');
        const prefixWithSlash = folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`;
        const vaultFiles = Array.isArray(vaultIndex?.files) ? vaultIndex.files : [];
        const matchingFiles = vaultFiles.filter((file) => String(file?.path || '').startsWith(prefixWithSlash));
        const existingPaths = new Set(items.map((item) => String(item?.viewUrl || item?.downloadUrl || item?.url || '').trim()));
        const appended = matchingFiles
          .map((file) => {
            const path = String(file?.path || '').trim();
            if (!path || existingPaths.has(path)) return null;
            existingPaths.add(path);
            return {
              label: file?.title || file?.filename || path.split('/').pop() || 'Resource',
              viewUrl: path,
              downloadUrl: path,
              description: '',
            };
          })
          .filter(Boolean);

        if (appended.length > 0) {
          updateSelectedComposerActivityData({ items: [...items, ...appended] });
        }
      }
      setIsVaultOpen(false);
      setVaultTargetField(null);
      return;
    }

    const filePath = String(selectedFile?.path || '').trim();
    if (!filePath) {
      setIsVaultOpen(false);
      setVaultTargetField(null);
      return;
    }

    if (vaultTargetField && typeof vaultTargetField === 'object' && vaultTargetField.target === 'composer-resource') {
      if (selectedComposerActivity?.type === 'resource_list') {
        const items = Array.isArray(selectedComposerActivity.data?.items) ? selectedComposerActivity.data.items : [];
        const itemIndex = Number(vaultTargetField.itemIndex);
        if (Number.isInteger(itemIndex) && itemIndex >= 0 && itemIndex < items.length) {
          const key = vaultTargetField.field === 'downloadUrl' ? 'downloadUrl' : 'viewUrl';
          const nextItems = [...items];
          nextItems[itemIndex] = { ...(nextItems[itemIndex] || {}), [key]: filePath };
          updateSelectedComposerActivityData({ items: nextItems });
        }
      }
    } else if (vaultTargetField && typeof vaultTargetField === 'object' && vaultTargetField.target === 'composer-image') {
      if (selectedComposerActivity?.type === 'image_block') {
        updateSelectedComposerActivityData({ url: filePath || '' });
      }
    } else if (vaultTargetField && typeof vaultTargetField === 'object' && vaultTargetField.target === 'finlit-hero-media') {
      setModuleManagerHero((prev) => ({
        ...createFinlitHeroFormState(prev),
        mediaUrl: filePath,
      }));
    } else if (vaultTargetField === 'view') {
      setMaterialForm(prev => ({ ...prev, viewUrl: filePath }));
    } else if (vaultTargetField === 'download') {
      setMaterialForm(prev => ({ ...prev, downloadUrl: filePath }));
    }
    setIsVaultOpen(false);
    setVaultTargetField(null);
  };

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const updateQuizQuestion = (index, field, value) => {
    const newQuestions = [...quizQuestions];
    if (field === 'question' || field === 'correct') {
      newQuestions[index][field] = value;
    } else if (field.startsWith('option-')) {
      const optIndex = parseInt(field.split('-')[1]);
      newQuestions[index].options[optIndex] = value;
    }
    setQuizQuestions(newQuestions);
  };

  const generateQuizAssessment = () => {
    const quizId = `quiz_${Date.now()}`;
    
    // Get Course Settings for dynamic colors
    const courseSettings = projectData["Course Settings"] || {};
    const backgroundColor = courseSettings.backgroundColor || 'slate-950';
    const accentColor = courseSettings.accentColor || 'sky';
    const isLightBg = backgroundColor.includes('white') || backgroundColor.includes('slate-100') || backgroundColor.includes('slate-50');
    
    const headingTextColor = courseSettings.headingTextColor || (isLightBg ? 'slate-900' : 'white');
    const secondaryTextColor = courseSettings.secondaryTextColor || (isLightBg ? 'slate-600' : 'slate-400');
    const assessmentTextColor = courseSettings.assessmentTextColor || 'white';
    const buttonColor = courseSettings.buttonColor || `${accentColor}-600`;
    
    const toTextClass = (value) => value.startsWith('text-') ? value : `text-${value}`;
    const toBgBase = (value) => value.startsWith('bg-') ? value.slice(3) : value;
    
    const headingTextClass = toTextClass(headingTextColor);
    const secondaryTextClass = toTextClass(secondaryTextColor);
    const assessmentTextClass = toTextClass(assessmentTextColor);
    const bodyTextClass = assessmentTextClass;
    const buttonBgBase = toBgBase(buttonColor);
    const buttonBgClass = `bg-${buttonBgBase}`;
    const buttonHoverClass = buttonBgBase.endsWith('-600') ? `hover:bg-${buttonBgBase.replace(/-600$/, '-500')}` : `hover:bg-${buttonBgBase}`;
    const buttonTextClass = isLightBg ? 'text-slate-900' : 'text-white';
    
    const cardBgClass = isLightBg ? 'bg-white' : 'bg-slate-900';
    const cardBorderClass = isLightBg ? 'border-slate-300' : 'border-slate-700';
    const optionBgClass = isLightBg ? 'bg-slate-100' : 'bg-slate-800';
    const optionHoverClass = isLightBg ? 'hover:bg-slate-200' : 'hover:bg-slate-750';
    const inputBgClass = isLightBg ? 'bg-white' : 'bg-slate-950';
    const inputTextClass = assessmentTextClass;
    const modalBgClass = isLightBg ? 'bg-white' : 'bg-slate-900';
    const modalBorderClass = isLightBg ? 'border-slate-300' : 'border-slate-700';
    
    // MULTIPLE CHOICE QUIZ
    if (assessmentType === 'quiz') {
    const questionsHtml = quizQuestions.map((q, idx) => `
      <div class="mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass}">
        <h3 class="text-lg font-bold ${headingTextClass} mb-4">${idx + 1}. ${q.question}</h3>
        <div class="space-y-2">
          ${q.options.map((opt, optIdx) => `
            <label class="flex items-center gap-3 p-3 ${optionBgClass} rounded-lg cursor-pointer ${optionHoverClass} transition-colors">
              <input type="radio" name="q${idx}" value="${optIdx}" class="w-4 h-4 assessment-input" />
              <span class="${bodyTextClass}">${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    const answers = quizQuestions.map(q => q.correct);

    const html = `<div id="${quizId}" class="w-full h-full custom-scroll p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-black ${headingTextClass} italic mb-2">${assessmentTitle}</h1>
          <p class="text-sm ${secondaryTextClass}">Select the best answer for each question.</p>
        </header>
        <form id="${quizId}-form" class="space-y-6">
          ${questionsHtml}
        </form>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mt-8 no-print">
          <button type="button" onclick="${quizId}_reset()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Reset
          </button>
          <button type="button" onclick="${quizId}_generateReport()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Print & Submit
          </button>
        </div>
        
        <!-- Reset Confirmation Modal -->
        <div id="${quizId}-reset-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center hidden">
          <div class="${modalBgClass} border ${modalBorderClass} rounded-xl p-6 max-w-md mx-4">
            <h3 class="text-lg font-bold ${headingTextClass} mb-4">Reset Assessment?</h3>
            <p class="${bodyTextClass} mb-6">Are you sure you want to reset all your answers? This cannot be undone.</p>
            <div class="flex gap-3">
              <button onclick="document.getElementById('${quizId}-reset-modal').classList.add('hidden')" class="flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-2 rounded">Cancel</button>
              <button onclick="${quizId}_confirmReset()" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    const script = `
    // Reset function - shows confirmation modal
    function ${quizId}_reset() {
      var modal = document.getElementById('${quizId}-reset-modal');
      if (modal) modal.classList.remove('hidden');
    }
    
    // Confirm Reset
    function ${quizId}_confirmReset() {
      document.getElementById('${quizId}-reset-modal').classList.add('hidden');
      var form = document.getElementById('${quizId}-form');
      if (form) form.reset();
    }
    
    // Generate Report - creates a clean printable page
    function ${quizId}_generateReport() {
      var container = document.getElementById('${quizId}');
      if (!container) { alert('Assessment not found'); return; }
      
      // Build questions HTML with selected answers
      var questionsHTML = '';
      var questions = container.querySelectorAll('[class*="mb-8 p-6"]');
      var qNum = 1;
      
      questions.forEach(function(q) {
        var questionText = q.querySelector('h3')?.textContent || 'Question ' + qNum;
        var selectedRadio = q.querySelector('input[type="radio"]:checked');
        var answer = '';
        
        if (selectedRadio) {
          var label = selectedRadio.closest('label');
          answer = label ? label.textContent.trim() : 'Selected Option';
        }
        
        if (questionText.trim()) {
          questionsHTML += '<div style="margin-bottom:25px; border-left:4px solid #333; padding-left:15px;">' +
            '<h3 style="font-size:14px; font-weight:bold; margin-bottom:10px; color:#333;">' + questionText + '</h3>' +
            '<div style="background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid #ddd; min-height:40px; font-size:13px;">' + 
            (answer || '<em style="color:#999;">No answer selected</em>') + 
            '</div></div>';
          qNum++;
        }
      });
      
      var printHTML = '<!DOCTYPE html><html><head><title>${assessmentTitle} - Submission</title>' +
        '<style>body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: white; line-height: 1.5; max-width: 800px; margin: 0 auto; }' +
        '.header { border-bottom: 4px solid #333; padding-bottom: 15px; margin-bottom: 25px; }' +
        '.header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin: 0; }' +
        '</style></head><body>' +
        '<div class="header"><h1>${assessmentTitle}</h1><p style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#666; margin-top:5px;">Multiple Choice Assessment</p></div>' +
        '<div class="questions">' + questionsHTML + '</div>' +
        '<div style="margin-top:40px; border-top:2px solid #333; padding-top:20px; text-align:center;">' +
        '<p style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#999;">End of Submission</p></div>' +
        '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }<\\/script></body></html>';
      
      var pw = window.open('', '_blank');
      if (pw) { pw.document.open(); pw.document.write(printHTML); pw.document.close(); }
      else { alert('Please allow popups to print.'); }
    }
    `;

      setGeneratedAssessment(JSON.stringify({ id: quizId, html, script, type: 'quiz', title: assessmentTitle }, null, 2));
    }
    
    // LONG ANSWER
    else if (assessmentType === 'longanswer') {
      const promptsHtml = quizQuestions.map((q, idx) => `
        <div class="mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass} print-section">
          <h3 class="text-lg font-bold ${headingTextClass} mb-4 print-question">${idx + 1}. ${q.question}</h3>
          <textarea 
            id="${quizId}-answer-${idx}" 
            placeholder="Type your answer here..."
            class="w-full h-48 ${inputBgClass} border ${cardBorderClass} rounded-lg p-4 ${inputTextClass} resize-none focus:border-${accentColor}-500 focus:outline-none print-response assessment-input"
          ></textarea>
          <p class="text-xs ${secondaryTextClass} italic mt-2 no-print">Auto-saved to browser</p>
        </div>
      `).join('');

      const html = `<div id="${quizId}" class="w-full h-full custom-scroll p-8">
        <div class="max-w-4xl mx-auto">
          <header class="mb-8">
            <h1 class="text-3xl font-black ${headingTextClass} italic mb-2 print-title">${assessmentTitle}</h1>
            <p class="text-sm ${secondaryTextClass} no-print">Complete all questions. Your responses are auto-saved.</p>
          </header>
          
          <!-- Student Info -->
          <div class="grid grid-cols-2 gap-4 mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass} print-header">
            <div>
              <label class="block text-xs font-bold ${secondaryTextClass} uppercase mb-2">Student Name</label>
              <input 
                type="text" 
                id="${quizId}-student-name"
                placeholder="Enter your name..."
                class="w-full ${inputBgClass} border ${cardBorderClass} rounded p-3 ${inputTextClass} text-sm focus:border-${accentColor}-500 focus:outline-none assessment-input"
              />
            </div>
            <div>
              <label class="block text-xs font-bold ${secondaryTextClass} uppercase mb-2">Date</label>
              <input 
                type="date" 
                id="${quizId}-student-date"
                class="w-full ${inputBgClass} border ${cardBorderClass} rounded p-3 ${inputTextClass} text-sm focus:border-${accentColor}-500 focus:outline-none assessment-input"
              />
            </div>
          </div>

          <!-- Questions -->
          <div class="space-y-6">
            ${promptsHtml}
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-3 mt-8 no-print">
            <button type="button" onclick="${quizId}_reset()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
              Reset
            </button>
            <button type="button" onclick="${quizId}_download()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
              Download Backup
            </button>
            <button type="button" onclick="document.getElementById('${quizId}-upload').click()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
              Upload Backup
            </button>
            <button type="button" onclick="${quizId}_generateReport()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
              Print & Submit
            </button>
          </div>
          <input type="file" id="${quizId}-upload" accept=".json" style="display: none;" onchange="${quizId}_loadBackup(this)" />

          <!-- Status Messages -->
          <div id="${quizId}-loaded" class="hidden mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500">
            <p class="text-blue-400 font-bold">Backup loaded successfully!</p>
          </div>

          <!-- Reset Confirmation Modal -->
          <div id="${quizId}-reset-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center hidden">
            <div class="${modalBgClass} border ${modalBorderClass} rounded-xl p-6 max-w-md mx-4">
              <h3 class="text-lg font-bold ${headingTextClass} mb-4">Reset Assessment?</h3>
              <p class="${bodyTextClass} mb-6">Are you sure you want to reset all your answers? This cannot be undone.</p>
              <div class="flex gap-3">
                <button onclick="document.getElementById('${quizId}-reset-modal').classList.add('hidden')" class="flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-2 rounded">Cancel</button>
                <button onclick="${quizId}_confirmReset()" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded">Reset</button>
              </div>
            </div>
          </div>

          <!-- Print Instructions -->
          <div class="mt-8 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg no-print">
            <p class="text-amber-300 text-sm">
              <strong>Instructions:</strong> Complete all questions, then click "Print & Submit" to generate a clean printable report.
            </p>
          </div>
        </div>
      </div>`;

      const script = `
      var ${quizId}_count = ${quizQuestions.length};
      
      // Initialize: Load saved data on page load
      window.addEventListener('load', function() {
        ${quizId}_loadFromLocalStorage();
      });
      
      // Reset function - shows confirmation modal
      function ${quizId}_reset() {
        var modal = document.getElementById('${quizId}-reset-modal');
        if (modal) modal.classList.remove('hidden');
      }
      
      // Confirm Reset
      function ${quizId}_confirmReset() {
        document.getElementById('${quizId}-reset-modal').classList.add('hidden');
        var nameField = document.getElementById('${quizId}-student-name');
        var dateField = document.getElementById('${quizId}-student-date');
        if (nameField) { nameField.value = ''; localStorage.removeItem('${quizId}-student-name'); }
        if (dateField) { dateField.value = ''; localStorage.removeItem('${quizId}-student-date'); }
        for (var i = 0; i < ${quizId}_count; i++) {
          var textarea = document.getElementById('${quizId}-answer-' + i);
          if (textarea) { textarea.value = ''; localStorage.removeItem('${quizId}-answer-' + i); }
        }
      }
      
      // Auto-save on input for all fields
      function ${quizId}_setupAutoSave() {
        var nameField = document.getElementById('${quizId}-student-name');
        var dateField = document.getElementById('${quizId}-student-date');
        if (nameField) {
          nameField.addEventListener('input', function() {
            localStorage.setItem('${quizId}-student-name', this.value);
          });
        }
        if (dateField) {
          dateField.addEventListener('input', function() {
            localStorage.setItem('${quizId}-student-date', this.value);
          });
        }
        
        for (var i = 0; i < ${quizId}_count; i++) {
          (function(idx) {
            var textarea = document.getElementById('${quizId}-answer-' + idx);
            if (textarea) {
              textarea.addEventListener('input', function() {
                localStorage.setItem('${quizId}-answer-' + idx, this.value);
              });
            }
          })(i);
        }
      }
      
      // Load from localStorage
      function ${quizId}_loadFromLocalStorage() {
        var nameField = document.getElementById('${quizId}-student-name');
        var dateField = document.getElementById('${quizId}-student-date');
        
        if (nameField) {
          var savedName = localStorage.getItem('${quizId}-student-name');
          if (savedName) nameField.value = savedName;
        }
        if (dateField) {
          var savedDate = localStorage.getItem('${quizId}-student-date');
          if (savedDate) dateField.value = savedDate;
        }
        
        for (var i = 0; i < ${quizId}_count; i++) {
          var textarea = document.getElementById('${quizId}-answer-' + i);
          if (textarea) {
            var saved = localStorage.getItem('${quizId}-answer-' + i);
            if (saved) textarea.value = saved;
          }
        }
        
        ${quizId}_setupAutoSave();
      }
      
      // Download Backup
      function ${quizId}_download() {
        var data = {
          studentName: document.getElementById('${quizId}-student-name')?.value || '',
          studentDate: document.getElementById('${quizId}-student-date')?.value || '',
          answers: []
        };
        
        for (var i = 0; i < ${quizId}_count; i++) {
          var textarea = document.getElementById('${quizId}-answer-' + i);
          data.answers.push(textarea ? textarea.value : '');
        }
        
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '${assessmentTitle.replace(/[^a-z0-9]/gi, '_')}_backup.json';
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Load Backup
      function ${quizId}_loadBackup(input) {
        var file = input.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result);
            
            var nameField = document.getElementById('${quizId}-student-name');
            var dateField = document.getElementById('${quizId}-student-date');
            
            if (nameField && data.studentName) {
              nameField.value = data.studentName;
              localStorage.setItem('${quizId}-student-name', data.studentName);
            }
            if (dateField && data.studentDate) {
              dateField.value = data.studentDate;
              localStorage.setItem('${quizId}-student-date', data.studentDate);
            }
            
            data.answers.forEach(function(answer, i) {
              var textarea = document.getElementById('${quizId}-answer-' + i);
              if (textarea) {
                textarea.value = answer;
                localStorage.setItem('${quizId}-answer-' + i, answer);
              }
            });
            
            var loadedDiv = document.getElementById('${quizId}-loaded');
            if (loadedDiv) {
              loadedDiv.classList.remove('hidden');
              setTimeout(function() { loadedDiv.classList.add('hidden'); }, 3000);
            }
          } catch(err) {
            alert('Error loading backup file.');
          }
        };
        reader.readAsText(file);
      }
      
      // Generate Report - creates a clean printable page in new window
      function ${quizId}_generateReport() {
        var container = document.getElementById('${quizId}');
        if (!container) { alert('Assessment not found'); return; }
        
        var studentName = document.getElementById('${quizId}-student-name')?.value || 'Not Provided';
        var studentDate = document.getElementById('${quizId}-student-date')?.value || new Date().toLocaleDateString();
        
        var questionsHTML = '';
        var questions = container.querySelectorAll('.print-section');
        
        questions.forEach(function(q, idx) {
          var questionText = q.querySelector('.print-question')?.textContent || 'Question ' + (idx+1);
          var textarea = q.querySelector('textarea');
          var answer = textarea ? textarea.value : '';
          
          questionsHTML += '<div style="margin-bottom:25px; border-left:4px solid #333; padding-left:15px;">' +
            '<h3 style="font-size:14px; font-weight:bold; margin-bottom:10px; color:#333;">' + questionText + '</h3>' +
            '<div style="background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid #ddd; min-height:80px; white-space:pre-wrap; font-size:13px;">' + 
            (answer || '<em style="color:#999;">No answer provided</em>') + 
            '</div></div>';
        });
        
        var printHTML = '<!DOCTYPE html><html><head><title>${assessmentTitle} - Submission</title>' +
          '<style>body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: white; line-height: 1.5; max-width: 800px; margin: 0 auto; }' +
          '.header { border-bottom: 4px solid #333; padding-bottom: 15px; margin-bottom: 25px; }' +
          '.header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin: 0; }' +
          '.student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }' +
          '.student-info div { font-size: 14px; }' +
          '.student-info strong { display: block; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; }</style></head><body>' +
          '<div class="header"><h1>${assessmentTitle}</h1><p style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#666; margin-top:5px;">Long Answer Assessment</p></div>' +
          '<div class="student-info"><div><strong>Student Name</strong>' + studentName + '</div><div><strong>Date</strong>' + studentDate + '</div></div>' +
          '<div class="questions">' + questionsHTML + '</div>' +
          '<div style="margin-top:40px; border-top:2px solid #333; padding-top:20px; text-align:center;">' +
          '<p style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#999;">End of Submission</p></div>' +
          '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }<\\/script></body></html>';
        
        var pw = window.open('', '_blank');
        if (pw) { pw.document.open(); pw.document.write(printHTML); pw.document.close(); }
        else { alert('Please allow popups to print.'); }
      }
      `;

      setGeneratedAssessment(JSON.stringify({ id: quizId, html, script, type: 'longanswer', title: assessmentTitle }, null, 2));
    }
    
    // PRINT & SUBMIT
    else if (assessmentType === 'print') {
      const instructions = printInstructions || `<li>Complete all required work on a separate sheet</li>
              <li>Review your answers carefully</li>
              <li>Print this page as a cover sheet</li>
              <li>Attach your work and submit</li>`;
      
      const html = `<div id="${quizId}" class="w-full h-full custom-scroll p-8">
        <div class="max-w-4xl mx-auto">
          <header class="mb-8">
            <h1 class="text-3xl font-black ${headingTextClass} italic mb-2">${assessmentTitle}</h1>
            <p class="text-sm ${secondaryTextClass}">Complete this assignment and submit to your instructor.</p>
          </header>
          <div class="p-8 ${cardBgClass} rounded-xl border ${cardBorderClass}">
            <h3 class="text-lg font-bold ${headingTextClass} mb-4">Instructions:</h3>
            <ol class="list-decimal list-inside space-y-2 ${bodyTextClass} mb-8">
              ${instructions}
            </ol>
            <div class="border-t ${cardBorderClass} pt-6 space-y-4">
              <div><span class="font-bold ${headingTextClass}">Student Name:</span> <span class="inline-block border-b ${cardBorderClass} w-64 ml-2"></span></div>
              <div><span class="font-bold ${headingTextClass}">Date:</span> <span class="inline-block border-b ${cardBorderClass} w-48 ml-2"></span></div>
              <div><span class="font-bold ${headingTextClass}">Assignment:</span> <span class="text-${accentColor}-400">${assessmentTitle}</span></div>
                </div>
          </div>
          <div class="mt-6 flex gap-4">
            <button type="button" onclick="window.print()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-8 rounded-lg">Print & Submit</button>
          </div>
          <div class="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <p class="text-amber-300 text-sm"><strong>Reminder:</strong> Print this page, complete the assignment, and submit to your instructor.</p>
                </div>
            </div>
        </div>`;
          
      const script = `console.log('Print & Submit assessment loaded: ${assessmentTitle}');`;

      setGeneratedAssessment(JSON.stringify({ id: quizId, html, script, type: 'print', title: assessmentTitle }, null, 2));
      setPrintInstructions(""); // Reset for next use
    }
  };

  const handleSessionSave = (overrideJson = null) => {
      setAiParseError(null);
      const jsonToUse = overrideJson || stagingJson;
      const titleToUse = stagingTitle;

      if (!jsonToUse || !titleToUse) {
          setAiParseError("Missing title or code content.");
          return;
      }

      let parsedCode = jsonToUse;
      try { 
          if (typeof jsonToUse === 'string') { 
              // Basic check to see if it's JSON
              if(jsonToUse.trim().startsWith('{') || jsonToUse.trim().startsWith('[')) {
                  parsedCode = JSON.parse(jsonToUse); 
              }
          } 
      } catch (e) { 
          setAiParseError("Invalid JSON format. Please check your syntax.");
          return; 
      }

      const newItem = { 
          id: parsedCode.id ? parsedCode.id : `item-${Date.now()}`,
          title: titleToUse, 
          code: parsedCode,
          // Initialize history with version 1 (original state)
          history: [{
            timestamp: new Date().toISOString(),
            title: titleToUse,
            code: parsedCode
          }]
      };

      // Validate module before saving
      const validation = validateModule(newItem, true);
      if (!validation.isValid) {
        setAiParseError('Validation failed: ' + validation.errors.join(', '));
        if (validation.warnings.length > 0) {
          console.warn('Module warnings:', validation.warnings);
        }
        return;
      }
      
      // Show warnings but allow save
      if (validation.warnings.length > 0) {
        console.warn('Module warnings:', validation.warnings);
      }

      // FUNCTIONAL UPDATE TO PREVENT STATE OVERWRITE
      setProjectData(prev => {
          const newData = { ...prev };
          const currentModules = newData["Current Course"].modules || [];
          newData["Current Course"] = {
              ...newData["Current Course"],
              modules: [...currentModules, newItem]
          };
          return newData;
      });

      setStagingJson("");
      setStagingTitle("");
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
  };

  // CSS AUTO-SCOPING FUNCTION
  const scopeCSS = (css, viewId) => {
    if (!css || !viewId) return css;
    
    // Add #view-{id} prefix to CSS selectors
    // Handle various CSS patterns
    let scoped = css;
    
    // Scope regular selectors (but not @rules)
    scoped = scoped.replace(/([^{}@]+)\{/g, (match, selector) => {
      // Skip if already scoped or is @rule
      if (selector.trim().startsWith('@') || selector.includes(`#${viewId}`)) {
        return match;
      }
      
      // Clean selector and add scope
      const cleanSelector = selector.trim();
      if (cleanSelector) {
        return `#${viewId} ${cleanSelector} {`;
      }
      return match;
    });
    
    return scoped;
  };

  // MODULE MANAGER FUNCTIONS
  // ========================================
  // SIMPLIFIED HARVESTING: Store raw HTML as-is
  // The module runs in an iframe so no parsing/transformation needed
  // ========================================
  const buildComposerStarterActivity = (type) => {
    const selectedType = type || 'content_block';
    const definition = getActivityDefinition(selectedType) || getActivityDefinition('content_block');
    const resolvedType = definition?.type || 'content_block';
    const defaultData = definition?.createDefaultData ? definition.createDefaultData() : {};
    return {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: resolvedType,
      data: defaultData,
      layout: {
        colSpan: 1,
        x: 0,
        y: 0,
        w: 1,
        h: 4,
      },
      style: {
        border: true,
        variant: 'card',
        padding: 'md',
        titleVariant: 'md',
      },
      behavior: {
        collapsible: false,
        collapsedByDefault: false,
      },
    };
  };

  const buildModuleManagerDraftPayload = () => {
    const composerLayout = normalizeComposerLayout(moduleManagerComposerLayout);
    const activeComposerActivities = normalizeComposerActivities(moduleManagerComposerActivities, {
      maxColumns: composerLayout.maxColumns,
      mode: composerLayout.mode,
    });
    const resolvedFinlitComposerState = resolveFinlitTabComposerState({
      finlit: moduleManagerFinlitState,
      moduleActivities: activeComposerActivities,
      composerLayout,
      activeTabId: moduleManagerFinlitAuthoringTabId,
      activeTabActivities: activeComposerActivities,
    });
    const composerActivities =
      isModuleManagerFinlitComposer && Array.isArray(resolvedFinlitComposerState.canonicalActivities)
        ? resolvedFinlitComposerState.canonicalActivities
        : activeComposerActivities;
    const templateLayoutProfiles = normalizeTemplateLayoutProfiles(
      {
        ...(normalizedModuleManagerTemplateProfiles && typeof normalizedModuleManagerTemplateProfiles === 'object'
          ? normalizedModuleManagerTemplateProfiles
          : {}),
        [resolveTemplateKey(moduleManagerTemplate, courseTemplateDefault)]: captureTemplateLayoutProfile(
          composerLayout,
          composerActivities,
        ),
      },
      { activities: composerActivities },
    );
    return {
      version: 2,
      type: moduleManagerType,
      moduleId: moduleManagerID,
      title: moduleManagerTitle,
      html: moduleManagerHTML,
      url: moduleManagerURL,
      linkType: moduleManagerLinkType,
      template: moduleManagerTemplate,
      theme: moduleManagerTheme,
      hero: createFinlitHeroFormState(moduleManagerHero),
      finlit: resolvedFinlitComposerState.finlit,
      composerStarterType: moduleManagerComposerStarterType,
      composerLayout,
      composerActivities,
      templateLayoutProfiles,
      finlitAuthoringTabId: resolvedFinlitComposerState.activeTabId,
      composerExtraRows: moduleManagerComposerExtraRows,
      composerSelectedIndex: moduleManagerComposerSelectedIndex,
      composerWorkspaceControlsCollapsed: moduleManagerComposerWorkspaceControlsCollapsed,
    };
  };

  const applyModuleManagerDraftPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return false;

    const nextType =
      payload.type === 'composer' || payload.type === 'external' || payload.type === 'standalone'
        ? payload.type
        : 'standalone';
    const nextStarterType =
      payload.composerStarterType && getActivityDefinition(payload.composerStarterType)
        ? payload.composerStarterType
        : 'content_block';
    const nextLayout = normalizeComposerLayout(payload.composerLayout);
    const hydratedActivities = normalizeComposerActivities(payload.composerActivities, {
      maxColumns: nextLayout.maxColumns,
      mode: nextLayout.mode,
    });
    const nextActivities =
      hydratedActivities.length > 0
        ? hydratedActivities
        : normalizeComposerActivities([buildComposerStarterActivity(nextStarterType)], {
            maxColumns: nextLayout.maxColumns,
            mode: nextLayout.mode,
          });
    const requestedIndex = Number.parseInt(payload.composerSelectedIndex, 10);
    const nextSelectedIndex = Number.isInteger(requestedIndex)
      ? Math.max(0, Math.min(nextActivities.length - 1, requestedIndex))
      : 0;
    const requestedExtraRows = Number.parseInt(payload.composerExtraRows, 10);
    const nextExtraRows = Number.isInteger(requestedExtraRows) ? Math.max(0, Math.min(requestedExtraRows, 50)) : 0;
    const nextWorkspaceControlsCollapsed = payload.composerWorkspaceControlsCollapsed === true;
    const loadedTemplateProfiles = normalizeTemplateLayoutProfiles(payload.templateLayoutProfiles, { activities: nextActivities });
    const nextTemplateProfiles = normalizeTemplateLayoutProfiles(
      {
        ...(loadedTemplateProfiles && typeof loadedTemplateProfiles === 'object' ? loadedTemplateProfiles : {}),
        [resolveTemplateKey(payload.template, courseTemplateDefault)]: captureTemplateLayoutProfile(nextLayout, nextActivities),
      },
      { activities: nextActivities },
    );

    setModuleManagerType(nextType);
    setModuleManagerID(payload.moduleId || '');
    setModuleManagerTitle(payload.title || '');
    setModuleManagerHTML(payload.html || '');
    setModuleManagerURL(payload.url || '');
    setModuleManagerLinkType(payload.linkType === 'newtab' ? 'newtab' : 'iframe');
    setModuleManagerTemplate(payload.template || '');
    setModuleManagerTheme(payload.theme || '');
    setModuleManagerHero(createFinlitHeroFormState(payload.hero));
    setModuleManagerFinlit(createFinlitTemplateFormState(payload.finlit));
    setModuleManagerComposerStarterType(nextStarterType);
    setModuleManagerTemplateLayoutProfiles(nextTemplateProfiles);
    setModuleManagerComposerLayout(nextLayout);
    setModuleManagerComposerActivities(nextActivities);
    setModuleManagerFinlitAuthoringTabId(String(payload.finlitAuthoringTabId || 'activities').trim() || 'activities');
    setModuleManagerComposerExtraRows(nextExtraRows);
    setModuleManagerComposerSelectedIndex(nextSelectedIndex);
    setModuleManagerComposerWorkspaceControlsCollapsed(nextWorkspaceControlsCollapsed);
    resetComposerHistory();
    return true;
  };

  const persistModuleManagerSavedDrafts = (nextDrafts) => {
    const trimmedDrafts = Array.isArray(nextDrafts) ? nextDrafts.slice(0, MODULE_MANAGER_MAX_SAVED_DRAFTS) : [];
    setModuleManagerSavedDrafts(trimmedDrafts);
    try {
      localStorage.setItem(MODULE_MANAGER_SAVED_DRAFTS_KEY, JSON.stringify(trimmedDrafts));
    } catch (err) {
      console.error('Failed to persist module manager drafts:', err);
    }
    return trimmedDrafts;
  };

  const showModuleManagerNotice = (status, message, durationMs = 2200) => {
    setModuleManagerStatus(status);
    setModuleManagerMessage(message);
    if (!durationMs) return;
    setTimeout(() => {
      setModuleManagerStatus(null);
      setModuleManagerMessage('');
    }, durationMs);
  };

  const buildModuleManagerDraftRecord = ({ id, payload, label, savedAt }) => ({
    id: id || `module-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label:
      label ||
      moduleManagerTitle.trim() ||
      moduleManagerID.trim() ||
      `${payload?.type === 'composer' ? 'Composer' : payload?.type === 'external' ? 'External' : 'Standalone'} Draft`,
    savedAt: savedAt || new Date().toISOString(),
    payload,
  });

  const downloadModuleManagerDraftFile = (draft) => {
    if (!draft || !draft.payload) return false;
    try {
      const payload = {
        kind: 'course-factory-module-draft',
        version: 2,
        exportedAt: new Date().toISOString(),
        draft,
      };
      const filenameBase = (draft.label || draft.id || 'module-draft').replace(/[^a-z0-9._ -]/gi, '_').trim() || 'module-draft';
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filenameBase}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 500);
      return true;
    } catch (err) {
      console.error('Failed to download module manager draft:', err);
      return false;
    }
  };

  const saveModuleManagerDraft = ({ overwriteSelected = false } = {}) => {
    try {
      const payload = buildModuleManagerDraftPayload();
      const draftId =
        overwriteSelected && moduleManagerSelectedDraftId
          ? moduleManagerSelectedDraftId
          : `module-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const existing = moduleManagerSavedDrafts.find((draft) => draft.id === draftId);
      const nextDraft = buildModuleManagerDraftRecord({
        id: draftId,
        payload,
        label: existing?.label || undefined,
      });
      const withoutCurrent = moduleManagerSavedDrafts.filter((draft) => draft.id !== draftId);
      persistModuleManagerSavedDrafts([nextDraft, ...withoutCurrent]);
      setModuleManagerSelectedDraftId(nextDraft.id);
      if (moduleManagerDownloadDraftOnSave) {
        downloadModuleManagerDraftFile(nextDraft);
      }
      const message = overwriteSelected && existing ? `Updated draft "${nextDraft.label}".` : `Saved draft "${nextDraft.label}".`;
      showModuleManagerNotice('success', message);
    } catch (err) {
      showModuleManagerNotice('error', `Failed to save draft: ${err.message}`, 2800);
    }
  };

  const updateModuleManagerSelectedDraft = () => {
    if (!moduleManagerSelectedDraftId) {
      showModuleManagerNotice('error', 'Select a draft to update.', 1800);
      return;
    }
    saveModuleManagerDraft({ overwriteSelected: true });
  };

  const loadModuleManagerDraft = () => {
    const draft = moduleManagerSavedDrafts.find((entry) => entry.id === moduleManagerSelectedDraftId);
    if (!draft) {
      showModuleManagerNotice('error', 'Select a saved draft to load.', 1800);
      return;
    }
    const loaded = applyModuleManagerDraftPayload(draft.payload);
    if (!loaded) {
      showModuleManagerNotice('error', 'Selected draft is invalid and could not be loaded.', 2400);
      return;
    }
    showModuleManagerNotice('success', `Loaded draft "${draft.label}".`);
  };

  const triggerModuleManagerDraftImport = () => {
    if (!moduleManagerDraftImportRef.current) return;
    moduleManagerDraftImportRef.current.value = '';
    moduleManagerDraftImportRef.current.click();
  };

  const exportModuleManagerSelectedDraft = () => {
    const draft = moduleManagerSavedDrafts.find((entry) => entry.id === moduleManagerSelectedDraftId);
    if (!draft) {
      showModuleManagerNotice('error', 'Select a saved draft to export.', 2000);
      return;
    }
    const downloaded = downloadModuleManagerDraftFile(draft);
    if (!downloaded) {
      showModuleManagerNotice('error', 'Could not export selected draft.', 2200);
      return;
    }
    showModuleManagerNotice('success', `Exported draft "${draft.label}".`, 1600);
  };

  const importModuleManagerDraftFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);

      const mergeAndSelectDraft = (draftRecord) => {
        if (!draftRecord || typeof draftRecord !== 'object' || !draftRecord.payload) return false;
        const normalizedDraft = buildModuleManagerDraftRecord({
          id: draftRecord.id,
          payload: draftRecord.payload,
          label: draftRecord.label,
          savedAt: draftRecord.savedAt,
        });
        const nextDrafts = [normalizedDraft, ...moduleManagerSavedDrafts.filter((entry) => entry.id !== normalizedDraft.id)];
        persistModuleManagerSavedDrafts(nextDrafts);
        setModuleManagerSelectedDraftId(normalizedDraft.id);
        return true;
      };

      let importedPayload = null;
      let importedDraftRecord = null;

      if (parsed && typeof parsed === 'object' && parsed.kind === 'course-factory-module-draft' && parsed.draft?.payload) {
        importedDraftRecord = parsed.draft;
        importedPayload = parsed.draft.payload;
      } else if (parsed && typeof parsed === 'object' && parsed.payload && typeof parsed.payload === 'object') {
        importedDraftRecord = parsed;
        importedPayload = parsed.payload;
      } else if (Array.isArray(parsed)) {
        const candidates = parsed.filter((entry) => entry && typeof entry === 'object' && entry.payload);
        if (!candidates.length) {
          showModuleManagerNotice('error', 'No valid drafts found in file.', 2400);
          return;
        }
        const merged = [
          ...candidates.map((entry) =>
            buildModuleManagerDraftRecord({
              id: entry.id,
              payload: entry.payload,
              label: entry.label,
              savedAt: entry.savedAt,
            }),
          ),
          ...moduleManagerSavedDrafts,
        ];
        const uniqueById = [];
        const seen = new Set();
        merged.forEach((entry) => {
          if (!entry?.id || seen.has(entry.id)) return;
          seen.add(entry.id);
          uniqueById.push(entry);
        });
        const persisted = persistModuleManagerSavedDrafts(uniqueById);
        const firstImported = persisted[0];
        if (firstImported) {
          setModuleManagerSelectedDraftId(firstImported.id);
          applyModuleManagerDraftPayload(firstImported.payload);
          showModuleManagerNotice('success', `Imported ${candidates.length} drafts from file.`);
        }
        return;
      } else if (parsed && typeof parsed === 'object') {
        importedPayload = parsed;
        importedDraftRecord = {
          id: `module-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label: file.name.replace(/\.[^.]+$/, '') || 'Imported Draft',
          savedAt: new Date().toISOString(),
          payload: parsed,
        };
      }

      if (!importedPayload || !importedDraftRecord) {
        showModuleManagerNotice('error', 'File format not recognized for module drafts.', 2600);
        return;
      }

      const loaded = applyModuleManagerDraftPayload(importedPayload);
      if (!loaded) {
        showModuleManagerNotice('error', 'Imported draft is invalid and could not be loaded.', 2600);
        return;
      }

      mergeAndSelectDraft(importedDraftRecord);
      showModuleManagerNotice('success', `Imported and loaded "${importedDraftRecord.label || 'draft'}".`);
    } catch (err) {
      showModuleManagerNotice('error', `Failed to import draft file: ${err.message}`, 3000);
    }
  };

  const deleteModuleManagerDraft = () => {
    if (!moduleManagerSelectedDraftId) {
      showModuleManagerNotice('error', 'Select a draft to delete.', 1800);
      return;
    }
    const nextDrafts = moduleManagerSavedDrafts.filter((draft) => draft.id !== moduleManagerSelectedDraftId);
    persistModuleManagerSavedDrafts(nextDrafts);
    setModuleManagerSelectedDraftId(nextDrafts[0]?.id || '');
    showModuleManagerNotice('success', 'Draft deleted.', 1800);
  };

  const resetModuleManagerBuilder = () => {
    const confirmed = window.confirm(
      'Reset Module Manager builder?\n\nThis clears the current unsaved module setup.\n\nContinue?',
    );
    if (!confirmed) return;

    setModuleManagerType('standalone');
    setModuleManagerID('');
    setModuleManagerTitle('');
    setModuleManagerHTML('');
    setModuleManagerURL('');
    setModuleManagerLinkType('iframe');
    setModuleManagerTemplate('');
    setModuleManagerTemplateLayoutProfiles({});
    setModuleManagerTheme('');
    setModuleManagerHero(createFinlitHeroFormState());
    setModuleManagerFinlit(createFinlitTemplateFormState());
    setModuleManagerFinlitAuthoringTabId('activities');
    setModuleManagerComposerLayout({
      mode: 'simple',
      maxColumns: 1,
      rowHeight: 24,
      margin: [12, 12],
      containerPadding: [12, 12],
      simpleMatchTallestRow: false,
    });
    setModuleManagerComposerActivities(
      normalizeComposerActivities([buildComposerStarterActivity(moduleManagerComposerStarterType)], {
        maxColumns: 1,
        mode: 'simple',
      }),
    );
    setModuleManagerComposerExtraRows(0);
    setModuleManagerComposerWorkspaceControlsCollapsed(false);
    setModuleManagerComposerCanvasGapRows(1);
    setModuleManagerComposerSelectedIndex(0);
    resetComposerHistory();
    setModuleManagerComposerDraggingIndex(null);
    setModuleManagerComposerDragOverIndex(null);
    setModuleManagerComposerDragOverSlotKey(null);
    setModuleManagerStatus('success');
    setModuleManagerMessage('Builder reset.');
    setTimeout(() => {
      setModuleManagerStatus(null);
      setModuleManagerMessage('');
    }, 1800);
  };

  useEffect(() => {
    try {
      const rawDrafts = localStorage.getItem(MODULE_MANAGER_SAVED_DRAFTS_KEY);
      if (rawDrafts) {
        const parsed = JSON.parse(rawDrafts);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter((draft) => draft && typeof draft === 'object' && draft.id && draft.payload)
            .slice(0, MODULE_MANAGER_MAX_SAVED_DRAFTS);
          setModuleManagerSavedDrafts(sanitized);
          if (sanitized.length > 0) {
            setModuleManagerSelectedDraftId(sanitized[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load module manager drafts:', err);
    }

    try {
      const rawAutosave = localStorage.getItem(MODULE_MANAGER_AUTOSAVE_KEY);
      if (!rawAutosave) return;
      const parsedAutosave = JSON.parse(rawAutosave);
      if (!parsedAutosave || typeof parsedAutosave !== 'object') return;
      const restored = applyModuleManagerDraftPayload(parsedAutosave.payload);
      if (restored) {
        setModuleManagerStatus('success');
        setModuleManagerMessage('Module manager autosave restored.');
        setTimeout(() => {
          setModuleManagerStatus(null);
          setModuleManagerMessage('');
        }, 2200);
      }
    } catch (err) {
      console.error('Failed to restore module manager autosave:', err);
    }
  }, []);

  useEffect(() => {
    const payload = buildModuleManagerDraftPayload();
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          MODULE_MANAGER_AUTOSAVE_KEY,
          JSON.stringify({
            savedAt: new Date().toISOString(),
            payload,
          }),
        );
      } catch (err) {
        console.error('Failed to write module manager autosave:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    moduleManagerType,
    moduleManagerID,
    moduleManagerTitle,
    moduleManagerHTML,
    moduleManagerURL,
    moduleManagerLinkType,
    moduleManagerTemplate,
    moduleManagerTemplateLayoutProfiles,
    moduleManagerTheme,
    moduleManagerHero,
    moduleManagerFinlit,
    moduleManagerComposerStarterType,
    moduleManagerComposerLayout,
    moduleManagerComposerActivities,
    moduleManagerComposerExtraRows,
    moduleManagerComposerSelectedIndex,
    moduleManagerComposerWorkspaceControlsCollapsed,
  ]);

  useEffect(() => {
    if (moduleManagerType !== 'composer') return;
    if (moduleManagerComposerActivities.length > 0) return;
    setModuleManagerComposerActivities(
      normalizeComposerActivities([buildComposerStarterActivity(moduleManagerComposerStarterType)], {
        maxColumns: moduleManagerComposerMaxColumns,
        mode: moduleManagerComposerLayoutMode,
      }),
    );
    setModuleManagerComposerSelectedIndex(0);
  }, [moduleManagerType, moduleManagerComposerActivities.length, moduleManagerComposerStarterType, moduleManagerComposerMaxColumns, moduleManagerComposerLayoutMode]);

  useEffect(() => {
    if (moduleManagerComposerSelectedIndex > moduleManagerComposerActivities.length - 1) {
      setModuleManagerComposerSelectedIndex(Math.max(moduleManagerComposerActivities.length - 1, 0));
    }
  }, [moduleManagerComposerActivities.length, moduleManagerComposerSelectedIndex]);

  useEffect(() => {
    if (!moduleManagerResourceMaterialId && moduleBankMaterials.length > 0) {
      setModuleManagerResourceMaterialId(moduleBankMaterials[0].id);
    }
  }, [moduleBankMaterials, moduleManagerResourceMaterialId]);

  useEffect(() => {
    if (moduleBankImageAssets.length === 0) {
      if (moduleManagerImageMaterialId) setModuleManagerImageMaterialId('');
      return;
    }
    if (!moduleManagerImageMaterialId || !moduleBankImageAssets.some((asset) => asset.id === moduleManagerImageMaterialId)) {
      setModuleManagerImageMaterialId(moduleBankImageAssets[0].id);
    }
  }, [moduleBankImageAssets, moduleManagerImageMaterialId]);

  useEffect(() => {
    if (!moduleManagerAssessmentId && moduleBankAssessments.length > 0) {
      setModuleManagerAssessmentId(moduleBankAssessments[0].id);
    }
  }, [moduleBankAssessments, moduleManagerAssessmentId]);

  useEffect(() => {
    if (moduleManagerType !== 'composer') return;
    setModuleManagerComposerPreviewNonce((n) => n + 1);
  }, [moduleManagerType]);

  useEffect(() => {
    setModuleManagerComposerDraggingIndex(null);
    setModuleManagerComposerDragOverIndex(null);
    setModuleManagerComposerDragOverSlotKey(null);
    setModuleManagerKnowledgeDragIndex(null);
    setModuleManagerKnowledgeDragOverIndex(null);
    setModuleManagerWorksheetDragIndex(null);
    setModuleManagerWorksheetDragOverIndex(null);
  }, [moduleManagerType, moduleManagerComposerActivities.length]);

  useEffect(
    () => () => {
      if (moduleManagerRichEditorUpdateTimerRef.current) {
        clearTimeout(moduleManagerRichEditorUpdateTimerRef.current);
        moduleManagerRichEditorUpdateTimerRef.current = null;
      }
    },
    [],
  );

  const selectedComposerActivity = moduleManagerComposerActivities[moduleManagerComposerSelectedIndex] || null;
  const selectedComposerPlacement = selectedComposerActivity
    ? moduleManagerPlacementByIndex.get(moduleManagerComposerSelectedIndex) || null
    : null;
  useEffect(() => {
    if (!isModuleManagerFinlitComposer) {
      if (moduleManagerFinlitAuthoringTabId !== 'activities') {
        setModuleManagerFinlitAuthoringTabId('activities');
      }
      return;
    }
    const resolved = resolveFinlitTabComposerState({
      finlit: moduleManagerFinlitState,
      moduleActivities: moduleManagerComposerActivities,
      composerLayout: normalizedModuleManagerLayout,
      activeTabId: moduleManagerFinlitAuthoringTabId,
      activeTabActivities: moduleManagerComposerActivities,
    });
    const nextTabId = String(resolved?.activeTabId || 'activities').trim() || 'activities';
    if (nextTabId !== moduleManagerFinlitAuthoringTabId) {
      setModuleManagerFinlitAuthoringTabId(nextTabId);
    }
    const nextTabsSignature = JSON.stringify(resolved?.finlit?.tabs || []);
    const currentTabsSignature = JSON.stringify(moduleManagerFinlitState?.tabs || []);
    if (nextTabsSignature !== currentTabsSignature) {
      setModuleManagerFinlit(resolved.finlit);
    }
    const nextActivities = Array.isArray(resolved?.activeTabActivities) ? resolved.activeTabActivities : [];
    if (JSON.stringify(nextActivities) !== JSON.stringify(moduleManagerComposerActivities)) {
      setModuleManagerComposerActivities(nextActivities);
    }
    setModuleManagerComposerSelectedIndex((prevIndex) => {
      const maxIndex = Math.max(0, nextActivities.length - 1);
      return Math.max(0, Math.min(maxIndex, Number.parseInt(prevIndex, 10) || 0));
    });
  }, [
    isModuleManagerFinlitComposer,
    moduleManagerComposerActivities,
    moduleManagerFinlitAuthoringTabId,
    moduleManagerFinlitState,
    normalizedModuleManagerLayout,
  ]);
  const buildTemplateLayoutProfilesForComposerState = React.useCallback(
    ({
      templateOverride = moduleManagerTemplate,
      composerLayout = moduleManagerComposerLayout,
      activities = isModuleManagerFinlitComposer ? moduleManagerCanonicalComposerActivities : moduleManagerComposerActivities,
      templateProfiles = normalizedModuleManagerTemplateProfiles,
    } = {}) => {
      const resolvedTemplateKey = resolveTemplateKey(templateOverride, courseTemplateDefault);
      const capturedProfile = captureTemplateLayoutProfile(composerLayout, activities);
      return normalizeTemplateLayoutProfiles(
        {
          ...(templateProfiles && typeof templateProfiles === 'object' ? templateProfiles : {}),
          [resolvedTemplateKey]: capturedProfile,
        },
        { activities },
      );
    },
    [
      courseTemplateDefault,
      isModuleManagerFinlitComposer,
      moduleManagerCanonicalComposerActivities,
      moduleManagerComposerActivities,
      moduleManagerComposerLayout,
      moduleManagerTemplate,
      normalizedModuleManagerTemplateProfiles,
    ],
  );
  const updateModuleManagerHeroField = (key, value) => {
    if (!['title', 'subtitle', 'progressLabel', 'mediaUrl', 'mediaType'].includes(key)) return;
    moduleManagerComposerPreviewShouldFollowRef.current = false;
    setModuleManagerHero((prev) => ({
      ...createFinlitHeroFormState(prev),
      [key]: value,
    }));
  };
  const sanitizeModuleManagerFinlitTabActivityIds = (ids) => {
    const valid = new Set(moduleManagerFinlitLinkableActivities.map((entry) => entry.id));
    const seen = new Set();
    return (Array.isArray(ids) ? ids : [])
      .map((item) => String(item || '').trim())
      .filter((id) => id && valid.has(id) && !seen.has(id) && seen.add(id));
  };
  const updateModuleManagerFinlitTabs = (updater) => {
    moduleManagerComposerPreviewShouldFollowRef.current = false;
    setModuleManagerFinlit((prev) => {
      const next = createFinlitTemplateFormState(prev);
      const tabs = Array.isArray(next.tabs) ? next.tabs : [];
      const draftTabs = tabs.map((tab) => ({
        ...tab,
        activityIds: Array.isArray(tab.activityIds) ? [...tab.activityIds] : [],
        activities: Array.isArray(tab.activities) ? tab.activities.map((activity) => ({ ...activity })) : [],
        links: Array.isArray(tab.links) ? tab.links.map((link) => ({ ...link })) : [],
      }));
      const updatedTabs = typeof updater === 'function' ? updater(draftTabs) : draftTabs;
      return {
        ...next,
        tabs: Array.isArray(updatedTabs) ? updatedTabs : draftTabs,
      };
    });
  };
  const addModuleManagerFinlitTab = () => {
    updateModuleManagerFinlitTabs((tabs) => {
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
  const updateModuleManagerFinlitTab = (tabId, updates) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateModuleManagerFinlitTabs((tabs) =>
      tabs.map((tab) => {
        if (String(tab?.id || '').trim() !== targetId) return tab;
        const nextLabel = updates && Object.prototype.hasOwnProperty.call(updates, 'label') ? String(updates.label || '') : tab.label;
        const nextActivityIds =
          updates && Object.prototype.hasOwnProperty.call(updates, 'activityIds')
            ? sanitizeModuleManagerFinlitTabActivityIds(updates.activityIds)
            : sanitizeModuleManagerFinlitTabActivityIds(tab.activityIds);
        return {
          ...tab,
          ...updates,
          label: nextLabel,
          activityIds: nextActivityIds,
        };
      }),
    );
  };
  const removeModuleManagerFinlitTab = (tabId) => {
    const targetId = String(tabId || '').trim();
    if (!targetId || FINLIT_CORE_TAB_IDS.includes(targetId)) return;
    updateModuleManagerFinlitTabs((tabs) => tabs.filter((tab) => String(tab?.id || '').trim() !== targetId));
    if (moduleManagerFinlitAuthoringTabId === targetId) {
      setModuleManagerFinlitAuthoringTabId('activities');
    }
  };
  const addModuleManagerFinlitTabLink = (tabId) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateModuleManagerFinlitTabs((tabs) =>
      tabs.map((tab) =>
        String(tab?.id || '').trim() === targetId
          ? { ...tab, links: [...(Array.isArray(tab.links) ? tab.links : []), { title: '', url: '', description: '' }] }
          : tab,
      ),
    );
  };
  const updateModuleManagerFinlitTabLink = (tabId, index, updates) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateModuleManagerFinlitTabs((tabs) =>
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
  const removeModuleManagerFinlitTabLink = (tabId, index) => {
    const targetId = String(tabId || '').trim();
    if (!targetId) return;
    updateModuleManagerFinlitTabs((tabs) =>
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
  const openModuleManagerFinlitTabInBuilder = React.useCallback(
    (tabId) => {
      const targetId = String(tabId || '').trim();
      if (!targetId) return;
      const resolved = resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: moduleManagerComposerActivities,
        composerLayout: normalizedModuleManagerLayout,
        activeTabId: targetId,
      });
      setModuleManagerFinlit(resolved.finlit);
      setModuleManagerFinlitAuthoringTabId(resolved.activeTabId);
      setModuleManagerComposerActivities(resolved.activeTabActivities);
      setModuleManagerComposerSelectedIndex(0);
      setModuleManagerComposerLeftPaneMode('builder');
      moduleManagerComposerPreviewShouldFollowRef.current = false;
    },
    [
      moduleManagerComposerActivities,
      moduleManagerFinlitState,
      normalizedModuleManagerLayout,
      setModuleManagerComposerLeftPaneMode,
    ],
  );
  useEffect(() => {
    if (moduleManagerRichEditorUpdateTimerRef.current) {
      clearTimeout(moduleManagerRichEditorUpdateTimerRef.current);
      moduleManagerRichEditorUpdateTimerRef.current = null;
    }
  }, [moduleManagerComposerSelectedIndex, moduleManagerType]);

  useEffect(() => {
    const editor = moduleManagerRichEditorRef.current;
    const richConfig = getComposerRichEditorConfig(selectedComposerActivity);
    if (!editor || !selectedComposerActivity || !richConfig) return;
    const data = selectedComposerActivity.data || {};
    const bodyMode = data[richConfig.modeKey] === 'plain' ? 'plain' : 'rich';
    if (bodyMode !== 'rich') return;
    const nextHtml = data[richConfig.htmlKey] || escapeEditorHtml(data[richConfig.textKey] || '').replace(/\n/g, '<br>');
    if (document.activeElement !== editor && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [
    selectedComposerActivity?.id,
    selectedComposerActivity?.type,
    selectedComposerActivity?.data?.bodyMode,
    selectedComposerActivity?.data?.bodyHtml,
    selectedComposerActivity?.data?.body,
    selectedComposerActivity?.data?.textMode,
    selectedComposerActivity?.data?.textHtml,
    selectedComposerActivity?.data?.text,
  ]);

  const moduleManagerComposerPreviewScope = useMemo(
    () => buildPreviewStorageScope('phase1-composer-preview', moduleManagerID.trim() || moduleManagerTitle.trim() || 'composer'),
    [moduleManagerID, moduleManagerTitle],
  );
  const phase1MaterialPreviewScope = useMemo(
    () => buildPreviewStorageScope('phase1-material-preview', phase1MaterialPreview?.id || phase1MaterialPreview?.title || 'materials'),
    [phase1MaterialPreview?.id, phase1MaterialPreview?.title],
  );
  const phase1AssessmentPreviewScope = useMemo(
    () => buildPreviewStorageScope('phase1-assessment-preview', phase1AssessmentPreview?.id || phase1AssessmentPreview?.title || 'assessment'),
    [phase1AssessmentPreview?.id, phase1AssessmentPreview?.title],
  );

  const moduleManagerComposerPreviewDoc = useMemo(() => {
    if (moduleManagerType !== 'composer') return '';
    const courseSettings = projectData?.['Course Settings'] || {};
    const rawId = moduleManagerID.trim();
    const moduleId = rawId ? (rawId.startsWith('view-') ? rawId : `view-${rawId}`) : 'view-composer-preview';
    const title = moduleManagerTitle.trim() || moduleId.replace('view-', '').replace(/-/g, ' ') || 'Composer Preview';
    const resolvedFinlitComposerState = resolveFinlitTabComposerState({
      finlit: moduleManagerFinlitState,
      moduleActivities: moduleManagerComposerActivities,
      composerLayout: normalizedModuleManagerLayout,
      activeTabId: moduleManagerFinlitAuthoringTabId,
      activeTabActivities: moduleManagerComposerActivities,
    });
    const hero = normalizeFinlitHeroForSave(moduleManagerHero);
    const finlit = normalizeFinlitTemplateForSave(resolvedFinlitComposerState.finlit);
    const previewActivities =
      isModuleManagerFinlitComposer && Array.isArray(resolvedFinlitComposerState.canonicalActivities)
        ? resolvedFinlitComposerState.canonicalActivities
        : moduleManagerComposerActivities;
    const previewModule = {
      id: moduleId,
      title,
      type: 'standalone',
      mode: 'composer',
      template: moduleManagerTemplate || null,
      theme: moduleManagerTheme || null,
      hero,
      finlit,
      composerLayout: normalizedModuleManagerLayout,
      activities: previewActivities,
      ...(isModuleManagerFinlitComposer ? { finlitActiveTabId: resolvedFinlitComposerState.activeTabId } : {}),
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
        __storageScope: moduleManagerComposerPreviewScope,
      }) || ''
    );
  }, [
    moduleManagerComposerPreviewScope,
    moduleManagerComposerActivities,
    moduleManagerComposerMaxColumns,
    moduleManagerFinlitAuthoringTabId,
    moduleManagerFinlitState,
    moduleManagerHero,
    moduleManagerFinlit,
    moduleManagerID,
    moduleManagerTheme,
    moduleManagerTitle,
    moduleManagerTemplate,
    moduleManagerType,
    isModuleManagerFinlitComposer,
    normalizedModuleManagerLayout,
    projectData,
  ]);

  const scrollModuleManagerPreviewToActivity = React.useCallback(
    (activityId) => {
      const targetId = String(activityId || '').trim();
      if (!targetId) return false;
      const iframe = moduleManagerComposerPreviewIframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc) return false;
      const escapedActivityId = targetId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const activeTabId = isModuleManagerFinlitComposer ? String(moduleManagerActiveFinlitTabId || '').trim() : '';
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
    [isModuleManagerFinlitComposer, moduleManagerActiveFinlitTabId],
  );

  useEffect(() => {
    moduleManagerComposerPreviewTargetActivityIdRef.current = String(selectedComposerActivity?.id || '').trim();
  }, [selectedComposerActivity?.id]);

  useEffect(() => {
    if (moduleManagerType !== 'composer') {
      moduleManagerComposerPreviewShouldFollowRef.current = false;
      return;
    }
    moduleManagerComposerPreviewShouldFollowRef.current = true;
  }, [moduleManagerType, selectedComposerActivity?.id]);

  useEffect(() => {
    if (moduleManagerType !== 'composer') return;
    if (!moduleManagerComposerPreviewShouldFollowRef.current) return;
    const targetId = String(selectedComposerActivity?.id || '').trim();
    if (!targetId) return;
    const timer = setTimeout(() => {
      if (scrollModuleManagerPreviewToActivity(targetId)) {
        moduleManagerComposerPreviewShouldFollowRef.current = false;
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [moduleManagerType, moduleManagerComposerPreviewDoc, selectedComposerActivity?.id, scrollModuleManagerPreviewToActivity]);

  const phase1MaterialCompiledPreviewDoc = useMemo(() => {
    if (!phase1MaterialPreview) return '';
    const courseSettings = projectData?.['Course Settings'] || {};
    const previewMaterial = {
      ...phase1MaterialPreview,
      hidden: false,
      order: 0,
    };
    const previewModule = {
      id: 'item-materials-preview',
      title: 'Course Materials',
      type: 'legacy',
      code: { id: 'view-materials', html: '', script: '' },
      materials: [previewMaterial],
    };
    return (
      buildModuleFrameHTML(previewModule, {
        ...courseSettings,
        __courseName: courseSettings.courseName || projectData?.['Current Course']?.name || 'Course',
        __toolkit: projectData?.['Global Toolkit'] || [],
        __materials: [previewMaterial],
        __storageScope: phase1MaterialPreviewScope,
        ignoreAssetBaseUrl: true,
      }) || ''
    );
  }, [phase1MaterialPreview, phase1MaterialPreviewScope, projectData]);

  const cloneComposerSnapshotData = React.useCallback((value) => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }, []);

  const buildComposerSnapshot = React.useCallback(
    ({
      activities = moduleManagerComposerActivities,
      layout = moduleManagerComposerLayout,
      extraRows = moduleManagerComposerExtraRows,
      selectedIndex = moduleManagerComposerSelectedIndex,
      templateOverride = moduleManagerTemplate,
      templateLayoutProfiles = normalizedModuleManagerTemplateProfiles,
    } = {}) => ({
      activities: cloneComposerSnapshotData(Array.isArray(activities) ? activities : []),
      layout: cloneComposerSnapshotData(normalizeComposerLayout(layout)),
      extraRows: Math.max(0, Math.min(50, Number.parseInt(extraRows, 10) || 0)),
      selectedIndex: Math.max(0, Number.parseInt(selectedIndex, 10) || 0),
      templateOverride: typeof templateOverride === 'string' ? templateOverride : '',
      templateLayoutProfiles: cloneComposerSnapshotData(
        normalizeTemplateLayoutProfiles(templateLayoutProfiles, {
          activities: Array.isArray(activities) ? activities : [],
        }),
      ),
    }),
    [
      cloneComposerSnapshotData,
      moduleManagerComposerActivities,
      moduleManagerComposerExtraRows,
      moduleManagerComposerLayout,
      moduleManagerComposerSelectedIndex,
      moduleManagerTemplate,
      normalizedModuleManagerTemplateProfiles,
    ],
  );

  const getComposerSnapshotSignature = React.useCallback((snapshot) => {
    if (!snapshot) return '';
    return JSON.stringify([
      snapshot.layout || {},
      snapshot.extraRows || 0,
      snapshot.selectedIndex || 0,
      snapshot.templateOverride || '',
      snapshot.templateLayoutProfiles || {},
      Array.isArray(snapshot.activities) ? snapshot.activities : [],
    ]);
  }, []);

  const areComposerSnapshotsEqual = React.useCallback(
    (left, right) => getComposerSnapshotSignature(left) === getComposerSnapshotSignature(right),
    [getComposerSnapshotSignature],
  );

  const bumpComposerHistoryVersion = React.useCallback(() => {
    setModuleManagerComposerHistoryVersion((version) => version + 1);
  }, []);

  const resetComposerHistory = React.useCallback(() => {
    moduleManagerComposerHistoryRef.current = { past: [], future: [] };
    moduleManagerCanvasInteractionRef.current = { snapshot: null, changed: false, activeId: null, mode: null };
    bumpComposerHistoryVersion();
  }, [bumpComposerHistoryVersion]);

  const pushComposerHistorySnapshot = React.useCallback(
    (snapshot) => {
      if (!snapshot) return;
      const nextSnapshot = buildComposerSnapshot(snapshot);
      const history = moduleManagerComposerHistoryRef.current;
      const last = history.past[history.past.length - 1];
      if (last && areComposerSnapshotsEqual(last, nextSnapshot)) return;
      history.past.push(nextSnapshot);
      if (history.past.length > 120) {
        history.past = history.past.slice(history.past.length - 120);
      }
      history.future = [];
      bumpComposerHistoryVersion();
    },
    [areComposerSnapshotsEqual, buildComposerSnapshot, bumpComposerHistoryVersion],
  );

  const applyComposerSnapshot = React.useCallback(
    (snapshot) => {
      if (!snapshot || typeof snapshot !== 'object') return;
      const normalizedLayout = normalizeComposerLayout(snapshot.layout);
      const normalizedActivities = normalizeComposerActivities(snapshot.activities, {
        maxColumns: normalizedLayout.maxColumns,
        mode: normalizedLayout.mode,
      });
      const safeSelectedIndex = Math.max(0, Math.min(normalizedActivities.length - 1, Number.parseInt(snapshot.selectedIndex, 10) || 0));
      const safeExtraRows = Math.max(0, Math.min(50, Number.parseInt(snapshot.extraRows, 10) || 0));
      const nextTemplateOverride =
        typeof snapshot.templateOverride === 'string' ? snapshot.templateOverride : moduleManagerTemplate;
      const normalizedSnapshotProfiles = normalizeTemplateLayoutProfiles(snapshot.templateLayoutProfiles, {
        activities: normalizedActivities,
      });
      const nextTemplateProfiles = normalizeTemplateLayoutProfiles(
        {
          ...(normalizedSnapshotProfiles && typeof normalizedSnapshotProfiles === 'object' ? normalizedSnapshotProfiles : {}),
          [resolveTemplateKey(nextTemplateOverride, courseTemplateDefault)]: captureTemplateLayoutProfile(
            normalizedLayout,
            normalizedActivities,
          ),
        },
        { activities: normalizedActivities },
      );
      setModuleManagerComposerLayout(normalizedLayout);
      setModuleManagerComposerActivities(normalizedActivities);
      setModuleManagerComposerExtraRows(safeExtraRows);
      setModuleManagerComposerSelectedIndex(safeSelectedIndex);
      setModuleManagerTemplate(nextTemplateOverride);
      setModuleManagerTemplateLayoutProfiles(nextTemplateProfiles);
    },
    [courseTemplateDefault, moduleManagerTemplate],
  );

  const undoComposerDraftChange = React.useCallback(() => {
    const history = moduleManagerComposerHistoryRef.current;
    if (!history.past.length) return;
    const currentSnapshot = buildComposerSnapshot();
    const previousSnapshot = history.past.pop();
    history.future.unshift(currentSnapshot);
    if (history.future.length > 120) {
      history.future = history.future.slice(0, 120);
    }
    applyComposerSnapshot(previousSnapshot);
    bumpComposerHistoryVersion();
  }, [applyComposerSnapshot, buildComposerSnapshot, bumpComposerHistoryVersion]);

  const redoComposerDraftChange = React.useCallback(() => {
    const history = moduleManagerComposerHistoryRef.current;
    if (!history.future.length) return;
    const currentSnapshot = buildComposerSnapshot();
    const nextSnapshot = history.future.shift();
    history.past.push(currentSnapshot);
    if (history.past.length > 120) {
      history.past = history.past.slice(history.past.length - 120);
    }
    applyComposerSnapshot(nextSnapshot);
    bumpComposerHistoryVersion();
  }, [applyComposerSnapshot, buildComposerSnapshot, bumpComposerHistoryVersion]);

  const moduleManagerComposerCanUndo = moduleManagerComposerHistoryRef.current.past.length > 0;
  const moduleManagerComposerCanRedo = moduleManagerComposerHistoryRef.current.future.length > 0;

  const updateComposerActivities = (
    nextActivities,
    nextLayout = moduleManagerComposerLayout,
    { recordHistory = true, historySnapshot = null, templateOverride = moduleManagerTemplate, templateProfiles = null } = {},
  ) => {
    const normalizedLayout = normalizeComposerLayout(nextLayout);
    const targetTemplateKey = resolveTemplateKey(templateOverride, courseTemplateDefault);
    const shouldSyncFinlit = isModuleManagerFinlitComposer && targetTemplateKey === 'finlit';
    let normalizedActivities = normalizeComposerActivities(nextActivities, {
      maxColumns: normalizedLayout.maxColumns,
      mode: normalizedLayout.mode,
    });
    let profileActivities = normalizedActivities;
    let nextFinlitState = moduleManagerFinlitState;
    let nextFinlitAuthoringTabId = moduleManagerFinlitAuthoringTabId;
    if (shouldSyncFinlit) {
      const resolved = resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: moduleManagerComposerActivities,
        composerLayout: normalizedLayout,
        activeTabId: moduleManagerFinlitAuthoringTabId,
        activeTabActivities: normalizedActivities,
      });
      nextFinlitState = resolved.finlit;
      nextFinlitAuthoringTabId = resolved.activeTabId;
      profileActivities = Array.isArray(resolved.canonicalActivities) ? resolved.canonicalActivities : normalizedActivities;
      normalizedActivities = Array.isArray(resolved.activeTabActivities) ? resolved.activeTabActivities : normalizedActivities;
    }
    const baseProfiles = normalizeTemplateLayoutProfiles(
      templateProfiles != null ? templateProfiles : moduleManagerTemplateLayoutProfiles,
      { activities: profileActivities },
    );
    const nextTemplateProfiles = normalizeTemplateLayoutProfiles(
      {
        ...(baseProfiles && typeof baseProfiles === 'object' ? baseProfiles : {}),
        [resolveTemplateKey(templateOverride, courseTemplateDefault)]: captureTemplateLayoutProfile(
          normalizedLayout,
          profileActivities,
        ),
      },
      { activities: profileActivities },
    );
    const nextSignature = JSON.stringify([normalizedLayout, normalizedActivities]);
    const currentSignature = JSON.stringify([normalizeComposerLayout(moduleManagerComposerLayout), moduleManagerComposerActivities]);
    const nextFinlitTabsSignature = JSON.stringify(nextFinlitState?.tabs || []);
    const currentFinlitTabsSignature = JSON.stringify(moduleManagerFinlitState?.tabs || []);
    if (nextSignature === currentSignature) {
      const currentProfiles = normalizeTemplateLayoutProfiles(moduleManagerTemplateLayoutProfiles, {
        activities: profileActivities,
      });
      const profilesChanged = JSON.stringify(currentProfiles) !== JSON.stringify(nextTemplateProfiles);
      const finlitChanged =
        shouldSyncFinlit &&
        (nextFinlitTabsSignature !== currentFinlitTabsSignature || nextFinlitAuthoringTabId !== moduleManagerFinlitAuthoringTabId);
      if (profilesChanged) {
        setModuleManagerTemplateLayoutProfiles(nextTemplateProfiles);
      }
      if (finlitChanged) {
        setModuleManagerFinlit(nextFinlitState);
        setModuleManagerFinlitAuthoringTabId(nextFinlitAuthoringTabId);
      }
      return false;
    }
    if (recordHistory) {
      pushComposerHistorySnapshot(historySnapshot || buildComposerSnapshot());
    }
    moduleManagerComposerPreviewShouldFollowRef.current = true;
    setModuleManagerComposerLayout(normalizedLayout);
    setModuleManagerComposerActivities(normalizedActivities);
    setModuleManagerTemplateLayoutProfiles(nextTemplateProfiles);
    if (shouldSyncFinlit) {
      setModuleManagerFinlit(nextFinlitState);
      setModuleManagerFinlitAuthoringTabId(nextFinlitAuthoringTabId);
    }
    return true;
  };

  const handleModuleManagerTemplateChange = (nextTemplateOverrideRaw) => {
    const nextTemplateOverride = String(nextTemplateOverrideRaw || '').trim();
    if (moduleManagerType !== 'composer') {
      setModuleManagerTemplate(nextTemplateOverride);
      return;
    }
    const currentLayout = normalizeComposerLayout(moduleManagerComposerLayout);
    const currentActivities = normalizeComposerActivities(moduleManagerComposerActivities, {
      maxColumns: currentLayout.maxColumns,
      mode: currentLayout.mode,
    });
    const currentTemplateKey = resolveTemplateKey(moduleManagerTemplate, courseTemplateDefault);
    const nextTemplateKey = resolveTemplateKey(nextTemplateOverride, courseTemplateDefault);
    const isCurrentFinlitComposer = currentTemplateKey === 'finlit';
    const isNextFinlitComposer = nextTemplateKey === 'finlit';
    let templateSourceActivities = currentActivities;
    if (isCurrentFinlitComposer) {
      const resolvedCurrentFinlit = resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: currentActivities,
        composerLayout: currentLayout,
        activeTabId: moduleManagerFinlitAuthoringTabId,
        activeTabActivities: currentActivities,
      });
      if (!isNextFinlitComposer && Array.isArray(resolvedCurrentFinlit.canonicalActivities)) {
        templateSourceActivities = resolvedCurrentFinlit.canonicalActivities;
      }
      setModuleManagerFinlit(resolvedCurrentFinlit.finlit);
    }
    const activeProfile = captureTemplateLayoutProfile(currentLayout, templateSourceActivities);
    const baseProfiles = normalizeTemplateLayoutProfiles(moduleManagerTemplateLayoutProfiles, { activities: templateSourceActivities });
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
      currentLayout.mode,
      currentLayout.maxColumns,
    );
    let selectedIndexActivities = applied.activities;
    updateComposerActivities(applied.activities, applied.composerLayout, {
      templateOverride: nextTemplateOverride,
      templateProfiles: profilesWithTarget,
    });
    setModuleManagerTemplate(nextTemplateOverride);
    if (isCurrentFinlitComposer && !isNextFinlitComposer) {
      setModuleManagerFinlitAuthoringTabId('activities');
    } else if (!isCurrentFinlitComposer && isNextFinlitComposer) {
      const resolvedIntoFinlit = resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: applied.activities,
        composerLayout: applied.composerLayout,
        activeTabId: 'activities',
        activeTabActivities: applied.activities,
      });
      setModuleManagerFinlit(resolvedIntoFinlit.finlit);
      setModuleManagerFinlitAuthoringTabId(resolvedIntoFinlit.activeTabId);
      setModuleManagerComposerActivities(resolvedIntoFinlit.activeTabActivities);
      selectedIndexActivities = Array.isArray(resolvedIntoFinlit.activeTabActivities)
        ? resolvedIntoFinlit.activeTabActivities
        : selectedIndexActivities;
    }
    setModuleManagerComposerSelectedIndex((prevIndex) => {
      const maxIndex = Math.max(0, selectedIndexActivities.length - 1);
      return Math.max(0, Math.min(maxIndex, Number.parseInt(prevIndex, 10) || 0));
    });
  };

  const updateComposerMaxColumns = (nextColumns) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(moduleManagerComposerLayout || {}),
      maxColumns: nextColumns,
    });
    updateComposerActivities(moduleManagerComposerActivities, normalizedLayout);
  };

  const updateComposerLayoutMode = (nextMode) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(moduleManagerComposerLayout || {}),
      mode: nextMode,
    });
    updateComposerActivities(moduleManagerComposerActivities, normalizedLayout);
  };

  const updateComposerCanvasMetric = (key, value) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(moduleManagerComposerLayout || {}),
      [key]: value,
    });
    updateComposerActivities(moduleManagerComposerActivities, normalizedLayout);
  };

  const updateComposerSimpleMatchTallestRow = (enabled) => {
    const normalizedLayout = normalizeComposerLayout({
      ...(moduleManagerComposerLayout || {}),
      simpleMatchTallestRow: enabled === true,
    });
    updateComposerActivities(moduleManagerComposerActivities, normalizedLayout);
  };

  useEffect(() => {
    const handleComposerUndoRedo = (event) => {
      if (moduleManagerType !== 'composer') return;
      const target = event.target;
      const tagName = String(target?.tagName || '').toLowerCase();
      const isEditableField =
        Boolean(target?.isContentEditable) || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      if (isEditableField) return;

      const key = String(event.key || '').toLowerCase();
      const withCmd = event.ctrlKey || event.metaKey;
      if (!withCmd) return;

      const isUndo = key === 'z' && !event.shiftKey;
      const isRedo = key === 'y' || (key === 'z' && event.shiftKey);
      if (!isUndo && !isRedo) return;

      event.preventDefault();
      if (isUndo) {
        undoComposerDraftChange();
      } else {
        redoComposerDraftChange();
      }
    };

    window.addEventListener('keydown', handleComposerUndoRedo);
    return () => window.removeEventListener('keydown', handleComposerUndoRedo);
  }, [moduleManagerType, redoComposerDraftChange, undoComposerDraftChange]);

  const updateSelectedComposerActivityMeta = (metaKey, updates) => {
    if (!selectedComposerActivity) return;
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) =>
      idx === moduleManagerComposerSelectedIndex
        ? {
            ...activity,
            [metaKey]: {
              ...((activity && typeof activity === 'object' ? activity[metaKey] : {}) || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateComposerActivities(nextActivities);
  };

  const updateSelectedComposerActivityCanvasLayout = (updates) => {
    if (!selectedComposerActivity) return;
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) =>
      idx === moduleManagerComposerSelectedIndex
        ? {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateComposerActivities(nextActivities);
  };

  const updateSelectedComposerActivityData = (updates) => {
    if (!selectedComposerActivity) return;
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) =>
      idx === moduleManagerComposerSelectedIndex
        ? {
            ...activity,
            data: {
              ...(activity.data || {}),
              ...updates,
            },
          }
        : activity,
    );
    updateComposerActivities(nextActivities);
  };

  const clearPendingModuleManagerRichEditorUpdate = () => {
    if (!moduleManagerRichEditorUpdateTimerRef.current) return;
    clearTimeout(moduleManagerRichEditorUpdateTimerRef.current);
    moduleManagerRichEditorUpdateTimerRef.current = null;
  };

  const getSelectedComposerRichStyleResetPayload = () => {
    if (!selectedComposerActivity) return null;
    const richConfig = getComposerRichEditorConfig(selectedComposerActivity);
    if (!richConfig) return null;
    const data = selectedComposerActivity.data || {};
    const bodyMode = data[richConfig.modeKey] === 'plain' ? 'plain' : 'rich';
    if (bodyMode !== 'rich') return null;
    const sourceHtml = data[richConfig.htmlKey] || escapeEditorHtml(data[richConfig.textKey] || '').replace(/\n/g, '<br>');
    const cleanedHtml = stripInlineRichFormatting(sourceHtml);
    const cleanedText = extractRichEditorText(cleanedHtml);
    return { richConfig, cleanedHtml, cleanedText };
  };

  const resetSelectedComposerBodyStyle = () => {
    if (!selectedComposerActivity) return;
    const payload = getSelectedComposerRichStyleResetPayload();
    const updates = { bodyContainerBg: '' };
    if (payload) {
      clearPendingModuleManagerRichEditorUpdate();
      if (moduleManagerRichEditorRef.current) {
        moduleManagerRichEditorRef.current.innerHTML = payload.cleanedHtml;
      }
      updates[payload.richConfig.modeKey] = 'rich';
      updates[payload.richConfig.htmlKey] = payload.cleanedHtml;
      updates[payload.richConfig.textKey] = payload.cleanedText;
    }
    updateSelectedComposerActivityData(updates);
  };

  const resetSelectedComposerActivityStyle = () => {
    if (!selectedComposerActivity) return;
    const payload = getSelectedComposerRichStyleResetPayload();
    const updates = {
      blockTheme: 'default',
      blockFontFamily: '',
      blockTextColor: '',
      blockContainerBg: '',
      bodyContainerBg: '',
    };
    if (payload) {
      clearPendingModuleManagerRichEditorUpdate();
      if (moduleManagerRichEditorRef.current) {
        moduleManagerRichEditorRef.current.innerHTML = payload.cleanedHtml;
      }
      updates[payload.richConfig.modeKey] = 'rich';
      updates[payload.richConfig.htmlKey] = payload.cleanedHtml;
      updates[payload.richConfig.textKey] = payload.cleanedText;
    }
    updateSelectedComposerActivityData(updates);
  };

  const replaceSelectedComposerActivityData = (nextData) => {
    if (!selectedComposerActivity) return;
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) =>
      idx === moduleManagerComposerSelectedIndex
        ? {
            ...activity,
            data: nextData && typeof nextData === 'object' ? nextData : {},
          }
        : activity,
    );
    updateComposerActivities(nextActivities);
  };

  const addComposerActivityDraft = () => {
    const nextActivity = buildComposerStarterActivity(moduleManagerComposerStarterType);
    const maxRow = moduleManagerGridModel.placements.reduce((largest, placement) => Math.max(largest, placement.row), 0);
    if (isModuleManagerCanvasMode) {
      const maxY = moduleManagerComposerActivities.reduce((largest, activity) => Math.max(largest, Number(activity?.layout?.y) || 0), 0);
      nextActivity.layout = {
        ...(nextActivity.layout || {}),
        colSpan: clampComposerColSpan(nextActivity?.layout?.colSpan, moduleManagerComposerMaxColumns),
        x: 0,
        y: maxY + 1,
        w: 1,
        h: 4,
      };
    } else {
      nextActivity.layout = {
        ...(nextActivity.layout || {}),
        colSpan: clampComposerColSpan(nextActivity?.layout?.colSpan, moduleManagerComposerMaxColumns),
        row: Math.max(1, maxRow + 1),
        col: 1,
      };
    }
    const nextActivities = [...moduleManagerComposerActivities, nextActivity];
    updateComposerActivities(nextActivities);
    setModuleManagerComposerSelectedIndex(nextActivities.length - 1);
  };

  const addComposerActivityFromTemplate = (templateActivity) => {
    const base = templateActivity && typeof templateActivity === 'object' ? templateActivity : null;
    const requestedType = String(base?.type || '').trim();
    const resolvedType = requestedType && getActivityDefinition(requestedType) ? requestedType : moduleManagerComposerStarterType;
    const starter = buildComposerStarterActivity(resolvedType);

    let clonedData = starter.data;
    if (base?.data && typeof base.data === 'object') {
      try {
        clonedData = JSON.parse(JSON.stringify(base.data));
      } catch {
        clonedData = { ...(base.data || {}) };
      }
    }

    const maxRow = moduleManagerGridModel.placements.reduce((largest, placement) => Math.max(largest, placement.row), 0);
    const requestedSpan = base?.layout?.colSpan ?? starter?.layout?.colSpan ?? 1;
    const nextActivity = {
      ...starter,
      type: resolvedType,
      data: clonedData && typeof clonedData === 'object' ? clonedData : {},
      layout: {
        ...(starter.layout || {}),
        colSpan: clampComposerColSpan(requestedSpan, moduleManagerComposerMaxColumns),
        ...(isModuleManagerCanvasMode
          ? {
              x: 0,
              y: moduleManagerComposerActivities.reduce((largest, item) => Math.max(largest, Number(item?.layout?.y) || 0), 0) + 1,
              w: clampComposerColSpan(requestedSpan, moduleManagerComposerMaxColumns),
              h: 4,
            }
          : {
              row: Math.max(1, maxRow + 1),
              col: 1,
            }),
      },
    };

    const nextActivities = [...moduleManagerComposerActivities, nextActivity];
    updateComposerActivities(nextActivities);
    setModuleManagerComposerSelectedIndex(nextActivities.length - 1);
  };

  const addComposerEmptyRowDraft = () => {
    if (!isModuleManagerCanvasMode && selectedComposerPlacement) {
      const insertAfterRow = Math.max(1, Number.parseInt(selectedComposerPlacement.row, 10) || 1);
      let changed = false;
      const nextActivities = moduleManagerComposerActivities.map((activity, idx) => {
        const placement = moduleManagerPlacementByIndex.get(idx);
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
        updateComposerActivities(nextActivities);
        return;
      }
    }
    pushComposerHistorySnapshot(buildComposerSnapshot());
    setModuleManagerComposerExtraRows((count) => Math.min(50, count + 1));
  };

  const removeComposerEmptyRowDraft = (targetRow) => {
    if (isModuleManagerCanvasMode) return;
    const row = Math.max(1, Number.parseInt(targetRow, 10) || 1);

    let changed = false;
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) => {
      const placement = moduleManagerPlacementByIndex.get(idx);
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
      updateComposerActivities(nextActivities);
      return;
    }

    const maxRow = moduleManagerGridModel.placements.reduce((largest, placement) => Math.max(largest, placement.row), 0);
    if (row > maxRow && moduleManagerComposerExtraRows > 0) {
      pushComposerHistorySnapshot(buildComposerSnapshot());
      setModuleManagerComposerExtraRows((count) => Math.max(0, count - 1));
    }
  };

  const shiftCanvasActivitiesDownFromRow = (startRow, rowCount = moduleManagerCanvasGapRowCount) => {
    if (!isModuleManagerCanvasMode) return;
    const clampedStart = Math.max(0, Number.parseInt(startRow, 10) || 0);
    const clampedRows = Math.max(1, Math.min(12, Number.parseInt(rowCount, 10) || 1));
    let changed = false;

    const nextActivities = moduleManagerComposerActivities.map((activity) => {
      const currentY = Number.isInteger(activity?.layout?.y)
        ? activity.layout.y
        : Math.max(0, (Number.parseInt(activity?.layout?.row, 10) || 1) - 1);
      if (currentY < clampedStart) return activity;
      changed = true;
      const nextY = currentY + clampedRows;
      return {
        ...activity,
        layout: {
          ...(activity.layout || {}),
          y: nextY,
          row: nextY + 1,
        },
      };
    });

    if (changed) {
      updateComposerActivities(nextActivities);
      return;
    }
    pushComposerHistorySnapshot(buildComposerSnapshot());
    setModuleManagerComposerExtraRows((count) => Math.min(50, count + clampedRows));
  };

  const insertCanvasGapRelativeToSelected = (placement = 'below') => {
    if (!isModuleManagerCanvasMode || !selectedComposerActivity) return;
    const selectedY = Number.isInteger(selectedComposerActivity?.layout?.y)
      ? selectedComposerActivity.layout.y
      : Math.max(0, (Number.parseInt(selectedComposerActivity?.layout?.row, 10) || 1) - 1);
    const selectedH = Math.max(1, Number.parseInt(selectedComposerActivity?.layout?.h, 10) || 1);
    const startRow = placement === 'above' ? selectedY : selectedY + selectedH;
    shiftCanvasActivitiesDownFromRow(startRow, moduleManagerCanvasGapRowCount);
  };

  const addCanvasOpenRowsDraft = () => {
    pushComposerHistorySnapshot(buildComposerSnapshot());
    setModuleManagerComposerExtraRows((count) => Math.min(50, count + moduleManagerCanvasGapRowCount));
  };

  const removeComposerActivityByIndex = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= moduleManagerComposerActivities.length) return;
    const targetActivity = moduleManagerComposerActivities[index];
    if (!targetActivity) return;
    if (activityRequiresDeleteConfirmation(targetActivity)) {
      const label = getActivityDefinition(targetActivity.type)?.label || 'block';
      const confirmed = window.confirm(`Delete this ${label}?`);
      if (!confirmed) return;
    }
    const nextActivities = moduleManagerComposerActivities.filter((_, idx) => idx !== index);
    updateComposerActivities(nextActivities);
    if (!nextActivities.length) {
      setModuleManagerComposerSelectedIndex(0);
      return;
    }
    setModuleManagerComposerSelectedIndex((prevIndex) => {
      if (!Number.isInteger(prevIndex)) return 0;
      if (prevIndex > index) return prevIndex - 1;
      if (prevIndex === index) return Math.min(index, nextActivities.length - 1);
      return prevIndex;
    });
  };

  const removeSelectedComposerActivityDraft = () => {
    if (!selectedComposerActivity) return;
    removeComposerActivityByIndex(moduleManagerComposerSelectedIndex);
  };

  const moveSelectedComposerActivityDraft = (direction) => {
    if (isModuleManagerCanvasMode) return;
    if (!selectedComposerActivity || !selectedComposerPlacement) return;
    const colSpan = clampComposerColSpan(selectedComposerActivity?.layout?.colSpan, moduleManagerComposerMaxColumns);
    const maxStartCol = Math.max(1, moduleManagerComposerMaxColumns - colSpan + 1);
    let targetRow = selectedComposerPlacement.row;
    let targetCol = selectedComposerPlacement.col;

    if (direction === 'left') targetCol = Math.max(1, targetCol - 1);
    if (direction === 'right') targetCol = Math.min(maxStartCol, targetCol + 1);
    if (direction === 'up') targetRow = Math.max(1, targetRow - 1);
    if (direction === 'down') targetRow += 1;

    const result = moveComposerActivityToCell(
      moduleManagerComposerActivities,
      moduleManagerComposerSelectedIndex,
      targetRow,
      targetCol,
      { maxColumns: moduleManagerComposerMaxColumns },
    );
    if (!result.changed) return;
    updateComposerActivities(result.activities);
    setModuleManagerComposerSelectedIndex(moduleManagerComposerSelectedIndex);
  };

  const moveComposerActivityToGridCell = (fromIndex, targetRow, targetCol) => {
    if (isModuleManagerCanvasMode) return;
    if (!Number.isInteger(fromIndex) || !Number.isInteger(targetRow) || !Number.isInteger(targetCol)) return;
    const result = moveComposerActivityToCell(moduleManagerComposerActivities, fromIndex, targetRow, targetCol, {
      maxColumns: moduleManagerComposerMaxColumns,
    });
    if (!result.changed) return;
    updateComposerActivities(result.activities);
    setModuleManagerComposerSelectedIndex(fromIndex);
  };

  const clampCanvasRectToColumns = (rect) => {
    const h = Math.max(1, Number.parseInt(rect?.h, 10) || 1);
    const w = Math.max(1, Math.min(moduleManagerComposerMaxColumns, Number.parseInt(rect?.w, 10) || 1));
    const x = Math.max(0, Math.min(moduleManagerComposerMaxColumns - w, Number.parseInt(rect?.x, 10) || 0));
    const y = Math.max(0, Number.parseInt(rect?.y, 10) || 0);
    return { x, y, w, h };
  };

  const rectsOverlap = (left, right) =>
    !(
      left.x + left.w <= right.x ||
      right.x + right.w <= left.x ||
      left.y + left.h <= right.y ||
      right.y + right.h <= left.y
    );

  const rectOverlapArea = (left, right) => {
    const overlapX = Math.max(0, Math.min(left.x + left.w, right.x + right.w) - Math.max(left.x, right.x));
    const overlapY = Math.max(0, Math.min(left.y + left.h, right.y + right.h) - Math.max(left.y, right.y));
    return overlapX * overlapY;
  };

  const resolveCanvasAutoFitWithPushLimit = (
    proposedActivities,
    activeIndex,
    { allowShrink = false, baseActivities = proposedActivities, mode = 'drag' } = {},
  ) => {
    if (
      !Array.isArray(proposedActivities) ||
      !Number.isInteger(activeIndex) ||
      activeIndex < 0 ||
      activeIndex >= proposedActivities.length
    ) {
      return { activities: proposedActivities, valid: true };
    }

    let valid = true;

    const nextActivities = proposedActivities.map((activity) => {
      const layout = clampCanvasRectToColumns(activity?.layout || {});
      return {
        ...activity,
        layout: {
          ...(activity.layout || {}),
          ...layout,
          colSpan: layout.w,
          col: layout.x + 1,
          row: layout.y + 1,
        },
      };
    });
    const baseRects = (Array.isArray(baseActivities) ? baseActivities : []).map((activity) =>
      clampCanvasRectToColumns(activity?.layout || {}),
    );
    const activeProposedRect = clampCanvasRectToColumns(nextActivities[activeIndex]?.layout || {});
    const activeBaseRect = baseRects[activeIndex] || activeProposedRect;
    const isResize = mode === 'resize';
    const resizedHorizontally = isResize && activeProposedRect.w !== activeBaseRect.w;
    const resizedVertically = isResize && activeProposedRect.h !== activeBaseRect.h;
    const pushUnit = Math.max(1, activeBaseRect.h);
    const maxPushUnits = isResize && resizedHorizontally && !resizedVertically ? 0 : pushUnit;
    const shrinkNeighbors = allowShrink && (!isResize || (resizedHorizontally && !resizedVertically));
    const baseBottomWithoutActive = baseRects.reduce((largest, rect, idx) => {
      if (idx === activeIndex || !rect) return largest;
      return Math.max(largest, rect.y + rect.h);
    }, 0);

    // Drag replace mode: if dropped over another block, swap positions instead of pushing.
    if (mode === 'drag') {
      let replaceTargetIndex = -1;
      let replaceTargetRatio = 0;
      baseRects.forEach((candidateRect, idx) => {
        if (idx === activeIndex || !candidateRect) return;
        if (!rectsOverlap(activeProposedRect, candidateRect)) return;
        const overlapArea = rectOverlapArea(activeProposedRect, candidateRect);
        const activeArea = Math.max(1, activeProposedRect.w * activeProposedRect.h);
        const candidateArea = Math.max(1, candidateRect.w * candidateRect.h);
        const overlapRatio = overlapArea / Math.max(1, Math.min(activeArea, candidateArea));
        if (overlapRatio > replaceTargetRatio) {
          replaceTargetRatio = overlapRatio;
          replaceTargetIndex = idx;
        }
      });

      if (replaceTargetIndex >= 0 && replaceTargetRatio >= 0.65) {
        const targetBaseRect = baseRects[replaceTargetIndex] || clampCanvasRectToColumns(nextActivities[replaceTargetIndex]?.layout || {});
        const swappedActivities = nextActivities.map((activity, idx) => {
          let rect = baseRects[idx] || clampCanvasRectToColumns(activity?.layout || {});
          if (idx === activeIndex) rect = targetBaseRect;
          if (idx === replaceTargetIndex) rect = activeBaseRect;
          return {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...rect,
              colSpan: rect.w,
              col: rect.x + 1,
              row: rect.y + 1,
            },
          };
        });
        return { activities: swappedActivities, valid: true };
      }

      const collided = baseRects
        .map((candidateRect, idx) => ({ candidateRect, idx }))
        .filter((item) => item.idx !== activeIndex && item.candidateRect)
        .filter((item) => rectsOverlap(activeProposedRect, item.candidateRect));
      if (collided.length > 0) {
        const pushStartY = collided.reduce((smallest, item) => Math.min(smallest, item.candidateRect.y), collided[0].candidateRect.y);
        const pushedActivities = nextActivities.map((activity, idx) => {
          const baseRect = baseRects[idx] || clampCanvasRectToColumns(activity?.layout || {});
          let rect = { ...baseRect };
          if (idx === activeIndex) {
            rect = { ...activeProposedRect };
          } else if (baseRect.y >= pushStartY) {
            rect = { ...baseRect, y: baseRect.y + maxPushUnits };
          }
          return {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...rect,
              colSpan: rect.w,
              col: rect.x + 1,
              row: rect.y + 1,
            },
          };
        });
        const activeRect = clampCanvasRectToColumns(pushedActivities[activeIndex]?.layout || {});
        const invalidCollision = pushedActivities.some((activity, idx) => {
          if (idx === activeIndex) return false;
          const rect = clampCanvasRectToColumns(activity?.layout || {});
          return rectsOverlap(activeRect, rect);
        });
        if (!invalidCollision) {
          return { activities: pushedActivities, valid: true };
        }
      }
    }

    if (isResize && resizedHorizontally && !resizedVertically) {
      const workingRects = baseRects.map((rect, idx) => ({
        idx,
        rect: idx === activeIndex ? { ...activeProposedRect } : { ...(rect || clampCanvasRectToColumns(nextActivities[idx]?.layout || {})) },
      }));
      const activeRect = workingRects.find((item) => item.idx === activeIndex)?.rect || { ...activeProposedRect };
      const sameBand = workingRects
        .filter((item) => item.idx !== activeIndex)
        .filter((item) => !(item.rect.y + item.rect.h <= activeRect.y || activeRect.y + activeRect.h <= item.rect.y))
        .sort((a, b) => a.rect.x - b.rect.x || a.idx - b.idx);
      let cursor = activeRect.x + activeRect.w;
      for (const item of sameBand) {
        if (item.rect.x < cursor) {
          const overlap = cursor - item.rect.x;
          item.rect.x = cursor;
          item.rect.w = Math.max(1, item.rect.w - overlap);
        }
        if (item.rect.x + item.rect.w > moduleManagerComposerMaxColumns) {
          valid = false;
          break;
        }
        cursor = item.rect.x + item.rect.w;
      }
      if (valid) {
        const activeAndBand = [{ idx: activeIndex, rect: activeRect }, ...sameBand];
        for (let i = 0; i < activeAndBand.length; i += 1) {
          for (let j = i + 1; j < activeAndBand.length; j += 1) {
            if (rectsOverlap(activeAndBand[i].rect, activeAndBand[j].rect)) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }
      }
      if (valid) {
        const rectByIndex = new Map(workingRects.map((item) => [item.idx, item.rect]));
        const adjusted = nextActivities.map((activity, idx) => {
          const rect = rectByIndex.get(idx) || clampCanvasRectToColumns(activity?.layout || {});
          return {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...rect,
              colSpan: rect.w,
              col: rect.x + 1,
              row: rect.y + 1,
            },
          };
        });
        return { activities: adjusted, valid: true };
      }
    }

    if (isResize && resizedVertically && !resizedHorizontally) {
      const workingRects = baseRects.map((rect, idx) => ({
        idx,
        rect: idx === activeIndex ? { ...activeProposedRect } : { ...(rect || clampCanvasRectToColumns(nextActivities[idx]?.layout || {})) },
      }));
      const activeRect = workingRects.find((item) => item.idx === activeIndex)?.rect || { ...activeProposedRect };
      const others = workingRects.filter((item) => item.idx !== activeIndex);

      // First pass: only push blocks that are actually overlapping the resized block.
      for (const item of others) {
        if (!rectsOverlap(item.rect, activeRect)) continue;
        const baseRect = baseRects[item.idx] || item.rect;
        const nextY = activeRect.y + activeRect.h;
        if (nextY > baseRect.y + maxPushUnits) {
          valid = false;
          break;
        }
        item.rect.y = nextY;
      }

      // Second pass: cascade only when overlaps are real after the first push.
      if (valid) {
        let changed = true;
        let guard = 0;
        while (changed && guard < 64) {
          guard += 1;
          changed = false;
          const sorted = others.slice().sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x || a.idx - b.idx);
          for (let i = 0; i < sorted.length; i += 1) {
            for (let j = i + 1; j < sorted.length; j += 1) {
              if (!rectsOverlap(sorted[i].rect, sorted[j].rect)) continue;
              const baseRect = baseRects[sorted[j].idx] || sorted[j].rect;
              const nextY = sorted[i].rect.y + sorted[i].rect.h;
              if (nextY > baseRect.y + maxPushUnits) {
                valid = false;
                break;
              }
              if (nextY !== sorted[j].rect.y) {
                sorted[j].rect.y = nextY;
                changed = true;
              }
            }
            if (!valid) break;
          }
        }
      }

      if (valid) {
        const rectByIndex = new Map(workingRects.map((item) => [item.idx, item.rect]));
        const adjusted = nextActivities.map((activity, idx) => {
          const rect = rectByIndex.get(idx) || clampCanvasRectToColumns(activity?.layout || {});
          return {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              ...rect,
              colSpan: rect.w,
              col: rect.x + 1,
              row: rect.y + 1,
            },
          };
        });
        return { activities: adjusted, valid: true };
      }
    }

    const placed = [];
    const order = [activeIndex, ...nextActivities.map((_, idx) => idx).filter((idx) => idx !== activeIndex)];
    const canPlace = (candidate) => placed.every((item) => !rectsOverlap(candidate, item.rect));

      const tryFitWithinPushLimit = (baseRect) => {
      const widthCandidates = shrinkNeighbors
        ? Array.from({ length: Math.max(1, baseRect.w) }, (_, idx) => Math.max(1, baseRect.w - idx))
        : [Math.max(1, baseRect.w)];
      const rowOffsets =
        isResize && resizedHorizontally && !resizedVertically
          ? [0]
          : [0, maxPushUnits];
      for (const nextW of widthCandidates) {
        const maxX = Math.max(0, moduleManagerComposerMaxColumns - nextW);
        const preferredX = Math.max(0, Math.min(maxX, baseRect.x));
        const xCandidates =
          isResize && resizedVertically && !resizedHorizontally
            ? [preferredX]
            : [preferredX, ...Array.from({ length: maxX + 1 }, (_, idx) => idx).filter((x) => x !== preferredX)];
        for (const rowOffset of rowOffsets) {
          const candidateY = baseRect.y + rowOffset;
          for (const candidateX of xCandidates) {
            const candidate = clampCanvasRectToColumns({
              ...baseRect,
              x: candidateX,
              y: candidateY,
              w: nextW,
            });
            if (canPlace(candidate)) return candidate;
          }
        }
      }
      return null;
    };

    order.forEach((idx, orderIdx) => {
      const current = nextActivities[idx];
      const proposedRect = clampCanvasRectToColumns(current?.layout || {});
      let rect = { ...proposedRect };
      if (orderIdx !== 0) {
        const baseRect = baseRects[idx] || proposedRect;
        const fitted = tryFitWithinPushLimit(baseRect);
        if (fitted) {
          rect = fitted;
        } else {
          valid = false;
          rect = { ...baseRect };
        }
      }

      nextActivities[idx] = {
        ...current,
        layout: {
          ...(current.layout || {}),
          ...rect,
          colSpan: rect.w,
          col: rect.x + 1,
          row: rect.y + 1,
        },
      };
      placed.push({ index: idx, rect });
    });

    const nextBottomRow = nextActivities.reduce((largest, activity) => {
      const rect = clampCanvasRectToColumns(activity?.layout || {});
      return Math.max(largest, rect.y + rect.h);
    }, 0);
    const nextBottomWithoutActive = nextActivities.reduce((largest, activity, idx) => {
      if (idx === activeIndex) return largest;
      const rect = clampCanvasRectToColumns(activity?.layout || {});
      return Math.max(largest, rect.y + rect.h);
    }, 0);
    if (nextBottomWithoutActive > baseBottomWithoutActive + maxPushUnits || nextBottomRow < 0) {
      valid = false;
    }

    return { activities: nextActivities, valid };
  };

  const deriveCanvasActivitiesFromLayout = (layoutItems) => {
    if (!Array.isArray(layoutItems)) return { changed: false, activities: moduleManagerComposerActivities };
    const itemsByIndex = new Map(
      layoutItems
        .map((item) => {
          const idx = Number.parseInt(item?.i, 10);
          if (!Number.isInteger(idx)) return null;
          return [idx, item];
        })
        .filter(Boolean),
    );

    let changed = false;
    let nextActivities = moduleManagerComposerActivities.map((activity, idx) => {
      const match = itemsByIndex.get(idx);
      if (!match) return activity;
      const nextLayout = clampCanvasRectToColumns({
        x: Number.parseInt(match.x, 10) || 0,
        y: Number.parseInt(match.y, 10) || 0,
        w: Math.max(1, Number.parseInt(match.w, 10) || 1),
        h: Math.max(1, Number.parseInt(match.h, 10) || 1),
      });
      const prevLayout = activity?.layout || {};
      if (
        (Number.parseInt(prevLayout.x, 10) || 0) !== nextLayout.x ||
        (Number.parseInt(prevLayout.y, 10) || 0) !== nextLayout.y ||
        (Number.parseInt(prevLayout.w, 10) || 1) !== nextLayout.w ||
        (Number.parseInt(prevLayout.h, 10) || 1) !== nextLayout.h
      ) {
        changed = true;
      }
      return {
        ...activity,
        layout: {
          ...(activity.layout || {}),
          ...nextLayout,
          colSpan: nextLayout.w,
          col: nextLayout.x + 1,
          row: nextLayout.y + 1,
        },
      };
    });

    if (
      (moduleManagerCanvasInteractionRef.current.mode === 'resize' ||
        moduleManagerCanvasInteractionRef.current.mode === 'drag') &&
      Number.isInteger(Number.parseInt(moduleManagerCanvasInteractionRef.current.activeId, 10))
    ) {
      const interactionMode = moduleManagerCanvasInteractionRef.current.mode;
      const activeIndex = Number.parseInt(moduleManagerCanvasInteractionRef.current.activeId, 10);
      const baseActivities =
        moduleManagerCanvasInteractionRef.current.snapshot?.activities || moduleManagerComposerActivities;
      const { activities: resolvedActivities, valid } = resolveCanvasAutoFitWithPushLimit(nextActivities, activeIndex, {
        allowShrink: interactionMode === 'resize',
        baseActivities,
        mode: interactionMode,
      });
      if (!valid) {
        // Enforce capped push behavior for drag/resize: reject attempts that require more than one pushed row.
        return { changed: false, activities: moduleManagerComposerActivities };
      }
      const beforeSignature = JSON.stringify(nextActivities);
      const afterSignature = JSON.stringify(resolvedActivities);
      if (beforeSignature !== afterSignature) {
        changed = true;
      }
      nextActivities = resolvedActivities;
    }

    return { changed, activities: nextActivities };
  };

  const applyCanvasGridLayout = (layoutItems, { recordHistory = false } = {}) => {
    const { changed, activities } = deriveCanvasActivitiesFromLayout(layoutItems);
    if (!changed) return false;
    const didUpdate = updateComposerActivities(activities, moduleManagerComposerLayout, { recordHistory });
    if (didUpdate && moduleManagerCanvasInteractionRef.current.snapshot) {
      moduleManagerCanvasInteractionRef.current.changed = true;
    }
    return didUpdate;
  };

  const beginComposerCanvasInteraction = (mode, item) => {
    if (!isModuleManagerCanvasMode) return;
    const nextMode = mode === 'resize' ? 'resize' : 'drag';
    const activeId = String(item?.i ?? '');
    moduleManagerCanvasInteractionRef.current = {
      snapshot: buildComposerSnapshot(),
      changed: false,
      activeId,
      mode: nextMode,
    };
  };

  const finishComposerCanvasInteraction = (layoutItems) => {
    const interaction = moduleManagerCanvasInteractionRef.current;
    if (!interaction.snapshot) return;
    applyCanvasGridLayout(layoutItems, { recordHistory: false });
    if (interaction.changed) {
      pushComposerHistorySnapshot(interaction.snapshot);
    }
    moduleManagerCanvasInteractionRef.current = { snapshot: null, changed: false, activeId: null, mode: null };
  };

  const duplicateSelectedComposerActivityDraft = () => {
    if (!selectedComposerActivity) return;
    const basePlacement = selectedComposerPlacement || { row: 1, col: 1 };
    const duplicate = {
      ...selectedComposerActivity,
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: {
        ...(selectedComposerActivity.data || {}),
      },
      layout: {
        ...(selectedComposerActivity.layout || {}),
        ...(isModuleManagerCanvasMode
          ? {
              x: Number.isInteger(selectedComposerActivity?.layout?.x) ? selectedComposerActivity.layout.x : 0,
              y: (Number.isInteger(selectedComposerActivity?.layout?.y) ? selectedComposerActivity.layout.y : 0) + 1,
            }
          : {
              row: basePlacement.row + 1,
              col: basePlacement.col,
            }),
      },
    };
    const nextActivities = [...moduleManagerComposerActivities];
    nextActivities.push(duplicate);
    updateComposerActivities(nextActivities);
    setModuleManagerComposerSelectedIndex(nextActivities.length - 1);
  };

  const updateSelectedComposerActivitySpan = (nextSpan) => {
    if (isModuleManagerCanvasMode) return;
    if (!selectedComposerActivity) return;
    const clamped = clampComposerColSpan(nextSpan, moduleManagerComposerMaxColumns);
    const nextActivities = moduleManagerComposerActivities.map((activity, idx) =>
      idx === moduleManagerComposerSelectedIndex
        ? {
            ...activity,
            layout: {
              ...(activity.layout || {}),
              colSpan: clamped,
            },
          }
        : activity,
    );
    updateComposerActivities(nextActivities);
  };

  const queueModuleManagerRichEditorUpdate = (html, text, immediate = false) => {
    const richConfig = getComposerRichEditorConfig(selectedComposerActivity);
    if (!richConfig) return;
    if (moduleManagerRichEditorUpdateTimerRef.current) {
      clearTimeout(moduleManagerRichEditorUpdateTimerRef.current);
      moduleManagerRichEditorUpdateTimerRef.current = null;
    }
    const applyUpdate = () => {
      updateSelectedComposerActivityData({
        [richConfig.modeKey]: 'rich',
        [richConfig.htmlKey]: html,
        [richConfig.textKey]: text,
      });
    };
    if (immediate) {
      applyUpdate();
      return;
    }
    moduleManagerRichEditorUpdateTimerRef.current = setTimeout(() => {
      moduleManagerRichEditorUpdateTimerRef.current = null;
      applyUpdate();
    }, 140);
  };

  const captureModuleManagerRichSelection = () => {
    const editor = moduleManagerRichEditorRef.current;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    moduleManagerRichEditorSelectionRef.current = range.cloneRange();
  };

  const restoreModuleManagerRichSelection = () => {
    const range = moduleManagerRichEditorSelectionRef.current;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const runModuleManagerRichEditorCommand = (command, value = null) => {
    if (!moduleManagerRichEditorRef.current) return;
    moduleManagerRichEditorRef.current.focus();
    restoreModuleManagerRichSelection();
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
    const html = moduleManagerRichEditorRef.current.innerHTML || '';
    const text = moduleManagerRichEditorRef.current.innerText || '';
    captureModuleManagerRichSelection();
    queueModuleManagerRichEditorUpdate(html, text, true);
  };

  const preserveModuleManagerRichSelection = (event) => {
    event.preventDefault();
  };

  const renderSelectedComposerActivityStylePanel = () => {
    if (!selectedComposerActivity) return null;
    const data = selectedComposerActivity.data || {};
    const styleMeta = selectedComposerActivity.style || {};
    const behaviorMeta = selectedComposerActivity.behavior || {};
    const themeValue = normalizeThemeValue(data.blockTheme);
    const themePreview = getThemePreviewColors(themeValue);
    const effectiveFill =
      data.blockContainerBg ||
      data.containerBg ||
      (selectedComposerActivity.type === 'title_block' ? '#1e1b4b' : themePreview.containerBg || '#0f172a');
    const effectiveTextColor = data.blockTextColor || themePreview.textColor || '#e2e8f0';
    return (
      <div className="mb-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Block Style</p>
          <button
            type="button"
            onClick={resetSelectedComposerActivityStyle}
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
              onChange={(e) => updateSelectedComposerActivityData({ blockTheme: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              {BLOCK_THEME_OPTIONS.map((themeOption) => (
                <option key={`block-theme-${themeOption.value}`} value={themeOption.value}>
                  {themeOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Font Family</label>
            <select
              value={data.blockFontFamily || ''}
              onChange={(e) => updateSelectedComposerActivityData({ blockFontFamily: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              <option value="">Default</option>
              {RICH_EDITOR_FONT_OPTIONS.map((fontOption) => (
                <option key={`block-font-${fontOption.value}`} value={fontOption.value} style={{ fontFamily: fontOption.value }}>
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
              onChange={(e) => updateSelectedComposerActivityData({ blockTextColor: e.target.value })}
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
              onChange={(e) => updateSelectedComposerActivityData({ blockContainerBg: e.target.value })}
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
              onChange={(e) => updateSelectedComposerActivityMeta('style', { variant: e.target.value })}
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
              onChange={(e) => updateSelectedComposerActivityMeta('style', { padding: e.target.value })}
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
              onChange={(e) => updateSelectedComposerActivityMeta('style', { titleVariant: e.target.value })}
              className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
            >
              {['xs', 'sm', 'md', 'lg', 'xl'].map((value) => (
                <option key={`composer-title-variant-${value}`} value={value}>
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
              onChange={(e) => updateSelectedComposerActivityMeta('style', { border: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Collapsible</span>
            <input
              type="checkbox"
              checked={behaviorMeta.collapsible === true}
              onChange={(e) =>
                updateSelectedComposerActivityMeta('behavior', {
                  collapsible: e.target.checked,
                  collapsedByDefault: e.target.checked ? behaviorMeta.collapsedByDefault === true : false,
                })
              }
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between rounded bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <span>Start Collapsed</span>
            <input
              type="checkbox"
              checked={behaviorMeta.collapsedByDefault === true}
              disabled={behaviorMeta.collapsible !== true}
              onChange={(e) => updateSelectedComposerActivityMeta('behavior', { collapsedByDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 disabled:opacity-40"
            />
          </label>
        </div>
        <p className="text-[10px] text-slate-500">
          Theme sets block defaults. Rich text inline formatting still overrides theme styles.
        </p>
      </div>
    );
  };

  const renderModuleManagerComposerActivityEditor = () => {
    if (!selectedComposerActivity) {
      return <p className="text-xs text-slate-500">Select an activity to edit.</p>;
    }

    const data = selectedComposerActivity.data || {};
    if (selectedComposerActivity.type === 'content_block' || selectedComposerActivity.type === 'title_block') {
      const richConfig = getComposerRichEditorConfig(selectedComposerActivity);
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
                onChange={(e) => updateSelectedComposerActivityData({ [richConfig.titleInputKey]: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              />
            </div>
          ) : null}
          {selectedComposerActivity.type === 'title_block' ? (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <label className="block text-xs font-bold text-slate-300 mb-1">Alignment</label>
                <select
                  value={data.align || 'left'}
                  onChange={(e) => updateSelectedComposerActivityData({ align: e.target.value })}
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
                  onClick={() => updateSelectedComposerActivityData({ [richConfig.modeKey]: 'rich' })}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${bodyMode === 'rich' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Rich
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedComposerActivityData({ [richConfig.modeKey]: 'plain' })}
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
                  updateSelectedComposerActivityData({
                    [richConfig.modeKey]: 'plain',
                    [richConfig.textKey]: e.target.value,
                  })
                }
                className={`w-full ${richConfig.plainRowsClass} bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm`}
              />
            ) : (
              <div className="rounded border border-slate-700 bg-slate-950 overflow-hidden">
                <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-slate-900/80">
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('bold')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">B</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('italic')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs italic">I</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('underline')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs underline">U</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('formatBlock', 'P')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">P</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('formatBlock', 'H2')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">H2</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('formatBlock', 'H3')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">H3</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('fontSize', '2')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A-</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('fontSize', '3')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('fontSize', '5')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">A+</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('insertUnorderedList')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">• List</button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('insertOrderedList')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">1. List</button>
                  <button
                    type="button"
                    onMouseDown={preserveModuleManagerRichSelection}
                    onClick={() => {
                      const url = window.prompt('Enter URL');
                      if (!url) return;
                      runModuleManagerRichEditorCommand('createLink', url);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  >
                    Link
                  </button>
                  <button type="button" onMouseDown={preserveModuleManagerRichSelection} onClick={() => runModuleManagerRichEditorCommand('removeFormat')} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">Clear</button>
                </div>
                <div className="px-2 pb-2 bg-slate-900/80 border-b border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const font = e.target.value;
                        if (!font) return;
                        runModuleManagerRichEditorCommand('fontName', font);
                      }}
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-white"
                      aria-label="Font family"
                    >
                      <option value="">Font Family</option>
                      {RICH_EDITOR_FONT_OPTIONS.map((fontOption) => (
                        <option key={`composer-font-${fontOption.value}`} value={fontOption.value} style={{ fontFamily: fontOption.value }}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center justify-between rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      <span>Text Color</span>
                      <input
                        type="color"
                        defaultValue="#e2e8f0"
                        onChange={(e) => runModuleManagerRichEditorCommand('foreColor', e.target.value)}
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
                          selectedComposerActivity.type === 'title_block' ? '#1e1b4b' : '#0f172a',
                        )}
                        onChange={(e) => updateSelectedComposerActivityData({ bodyContainerBg: e.target.value })}
                        className="h-6 w-10 cursor-pointer border border-slate-600 rounded bg-transparent"
                        title="Set body container background color override"
                        aria-label="Set body container background color override"
                      />
                    </label>
                    <button
                      type="button"
                      onMouseDown={preserveModuleManagerRichSelection}
                      onClick={resetSelectedComposerBodyStyle}
                      className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-200"
                      title="Reset body style overrides"
                    >
                      Reset Body Style
                    </button>
                  </div>
                </div>
                <div
                  ref={moduleManagerRichEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(event) => {
                    const html = event.currentTarget.innerHTML || '';
                    const text = event.currentTarget.innerText || '';
                    captureModuleManagerRichSelection();
                    queueModuleManagerRichEditorUpdate(html, text);
                  }}
                  onMouseUp={captureModuleManagerRichSelection}
                  onKeyUp={captureModuleManagerRichSelection}
                  onBlur={(event) => {
                    const html = event.currentTarget.innerHTML || '';
                    const text = event.currentTarget.innerText || '';
                    captureModuleManagerRichSelection();
                    queueModuleManagerRichEditorUpdate(html, text, true);
                  }}
                  className="cf-rich-editor min-h-[180px] p-3 text-sm text-white outline-none"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'embed_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Embed URL</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => updateSelectedComposerActivityData({ url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Caption</label>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => updateSelectedComposerActivityData({ caption: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'resource_list') {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">List Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
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
                    updateSelectedComposerActivityData({ items: nextItems });
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
                    updateSelectedComposerActivityData({ items: nextItems });
                  }}
                  className="col-span-3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="View URL"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVaultTargetField({ target: 'composer-resource', itemIndex: idx, field: 'viewUrl' });
                    setIsVaultOpen(true);
                  }}
                  className="col-span-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded p-2 text-slate-200 flex items-center justify-center"
                  title="Select view URL from vault"
                >
                  <FolderOpen size={12} />
                </button>
                <input
                  type="text"
                  value={item?.downloadUrl || item?.url || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), downloadUrl: e.target.value };
                    updateSelectedComposerActivityData({ items: nextItems });
                  }}
                  className="col-span-3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Download URL"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVaultTargetField({ target: 'composer-resource', itemIndex: idx, field: 'downloadUrl' });
                    setIsVaultOpen(true);
                  }}
                  className="col-span-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded p-2 text-slate-200 flex items-center justify-center"
                  title="Select download URL from vault"
                >
                  <FolderOpen size={12} />
                </button>
                <button
                  onClick={() => {
                    const nextItems = items.filter((_, itemIdx) => itemIdx !== idx);
                    updateSelectedComposerActivityData({ items: nextItems });
                  }}
                  className="col-span-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
                  type="button"
                  title="Remove resource"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
                <input
                  type="text"
                  value={item?.description || ''}
                  onChange={(e) => {
                    const nextItems = [...items];
                    nextItems[idx] = { ...(nextItems[idx] || {}), description: e.target.value };
                    updateSelectedComposerActivityData({ items: nextItems });
                  }}
                  className="col-span-12 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Optional description"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateSelectedComposerActivityData({ items: [...items, { label: '', viewUrl: '', downloadUrl: '', description: '' }] })}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Resource
            </button>
            <button
              type="button"
              onClick={() => {
                setVaultTargetField({ target: 'composer-resource-folder-import' });
                setIsVaultOpen(true);
              }}
              className="ml-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-100 font-bold inline-flex items-center gap-1"
              title="Select a vault folder and append all its files as resources"
            >
              <FolderOpen size={12} /> Import Vault Folder
            </button>
            <div className="pt-3 border-t border-slate-700">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Add From Module Bank</label>
              <div className="grid grid-cols-12 gap-2">
                <select
                  value={moduleManagerResourceMaterialId}
                  onChange={(e) => setModuleManagerResourceMaterialId(e.target.value)}
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
                    const selected = moduleBankMaterials.find((mat) => mat.id === moduleManagerResourceMaterialId);
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
                    updateSelectedComposerActivityData({ items: nextItems });
                  }}
                  disabled={!moduleManagerResourceMaterialId || moduleBankMaterials.length === 0}
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

    if (selectedComposerActivity.type === 'knowledge_check') {
      const questions = normalizeKnowledgeCheckBuilderQuestions(data);
      const moveKnowledgeQuestion = (fromIndex, toIndex) => {
        const nextQuestions = reorderByIndex(questions, fromIndex, toIndex);
        updateSelectedComposerActivityData({ questions: nextQuestions });
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Block Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Knowledge Check"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Questions</label>
            <div className="space-y-2">
              {questions.map((question, qIdx) => {
                const isDropTarget =
                  moduleManagerKnowledgeDragOverIndex === qIdx &&
                  moduleManagerKnowledgeDragIndex !== null &&
                  qIdx !== moduleManagerKnowledgeDragIndex;
                const options = Array.isArray(question.options) ? question.options : [];
                const isShortAnswer = question.type === 'short_answer';
                return (
                  <div
                    key={`builder-kc-question-${qIdx}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                      if (moduleManagerKnowledgeDragOverIndex !== qIdx) setModuleManagerKnowledgeDragOverIndex(qIdx);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                      const fromIndex = Number.isInteger(moduleManagerKnowledgeDragIndex) ? moduleManagerKnowledgeDragIndex : fallback;
                      moveKnowledgeQuestion(fromIndex, qIdx);
                      setModuleManagerKnowledgeDragIndex(null);
                      setModuleManagerKnowledgeDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setModuleManagerKnowledgeDragIndex(null);
                      setModuleManagerKnowledgeDragOverIndex(null);
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
                          updateSelectedComposerActivityData({ questions: nextQuestions });
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
                          setModuleManagerKnowledgeDragIndex(qIdx);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(qIdx));
                          }
                        }}
                        onDragEnd={() => {
                          setModuleManagerKnowledgeDragIndex(null);
                          setModuleManagerKnowledgeDragOverIndex(null);
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
                        onClick={() => updateSelectedComposerActivityData({ questions: questions.filter((_, idx) => idx !== qIdx) })}
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
                          updateSelectedComposerActivityData({ questions: nextQuestions });
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
                            updateSelectedComposerActivityData({ questions: nextQuestions });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                          placeholder="Write your response..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Options</label>
                        {options.map((option, optionIdx) => (
                          <div key={`builder-kc-question-${qIdx}-option-${optionIdx}`} className="grid grid-cols-12 gap-2">
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
                                updateSelectedComposerActivityData({ questions: nextQuestions });
                              }}
                              className="col-span-10 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                            />
                            <input
                              type="radio"
                              name={`builder-kc-correct-${qIdx}`}
                              checked={(question.correctIndex || 0) === optionIdx}
                              onChange={() => {
                                const nextQuestions = questions.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctIndex: optionIdx } : item,
                                );
                                updateSelectedComposerActivityData({ questions: nextQuestions });
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
                                updateSelectedComposerActivityData({ questions: nextQuestions });
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
                            updateSelectedComposerActivityData({ questions: nextQuestions });
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
              onClick={() =>
                updateSelectedComposerActivityData({
                  questions: [...questions, createKnowledgeCheckBuilderQuestion('multiple_choice')],
                })
              }
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Multiple Choice
            </button>
            <button
              type="button"
              onClick={() =>
                updateSelectedComposerActivityData({
                  questions: [...questions, createKnowledgeCheckBuilderQuestion('short_answer')],
                })
              }
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Short Answer
            </button>
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'worksheet_form') {
      const blocks = normalizeWorksheetBuilderBlocks(data);
      const moveWorksheetBlock = (fromIndex, toIndex) => {
        const nextBlocks = reorderByIndex(blocks, fromIndex, toIndex);
        updateSelectedComposerActivityData({ blocks: nextBlocks });
      };
      const setWorksheetBlockField = (blockIdx, updates) => {
        const nextBlocks = blocks.map((item, idx) => (idx === blockIdx ? { ...item, ...updates } : item));
        updateSelectedComposerActivityData({ blocks: nextBlocks });
      };
      const runWorksheetHelperRichCommand = (blockIdx, command, value = null) => {
        const editor = document.querySelector(`[data-mm-worksheet-helper-editor="${blockIdx}"]`);
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
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Worksheet"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Worksheet Blocks</label>
            <div className="space-y-2">
              {blocks.map((block, blockIdx) => {
                const isDropTarget =
                  moduleManagerWorksheetDragOverIndex === blockIdx &&
                  moduleManagerWorksheetDragIndex !== null &&
                  blockIdx !== moduleManagerWorksheetDragIndex;
                const isTitle = block.kind === 'title';
                return (
                  <div
                    key={`builder-worksheet-block-${blockIdx}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                      if (moduleManagerWorksheetDragOverIndex !== blockIdx) setModuleManagerWorksheetDragOverIndex(blockIdx);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                      const fromIndex = Number.isInteger(moduleManagerWorksheetDragIndex) ? moduleManagerWorksheetDragIndex : fallback;
                      moveWorksheetBlock(fromIndex, blockIdx);
                      setModuleManagerWorksheetDragIndex(null);
                      setModuleManagerWorksheetDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setModuleManagerWorksheetDragIndex(null);
                      setModuleManagerWorksheetDragOverIndex(null);
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
                          updateSelectedComposerActivityData({ blocks: nextBlocks });
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
                          setModuleManagerWorksheetDragIndex(blockIdx);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(blockIdx));
                          }
                        }}
                        onDragEnd={() => {
                          setModuleManagerWorksheetDragIndex(null);
                          setModuleManagerWorksheetDragOverIndex(null);
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
                        onClick={() => updateSelectedComposerActivityData({ blocks: blocks.filter((_, idx) => idx !== blockIdx) })}
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
                              updateSelectedComposerActivityData({ blocks: nextBlocks });
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
                              updateSelectedComposerActivityData({ blocks: nextBlocks });
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
                              updateSelectedComposerActivityData({ blocks: nextBlocks });
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
                                data-mm-worksheet-helper-editor={blockIdx}
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
              onClick={() =>
                updateSelectedComposerActivityData({
                  blocks: [...blocks, createWorksheetBuilderBlock('title')],
                })
              }
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Title Block
            </button>
            <button
              type="button"
              onClick={() =>
                updateSelectedComposerActivityData({
                  blocks: [...blocks, createWorksheetBuilderBlock('field')],
                })
              }
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'fillable_chart') {
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
        updateSelectedComposerActivityData(normalizeFillableChartData(source));
      };
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Chart Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="Fillable Chart"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateSelectedComposerActivityData({ description: e.target.value })}
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
                className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
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

    if (selectedComposerActivity.type === 'image_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={(e) => updateSelectedComposerActivityData({ url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="https://... or /assets/image.jpg"
            />
            <div className="grid grid-cols-12 gap-2 mt-2">
              <select
                value={moduleManagerImageMaterialId}
                onChange={(e) => setModuleManagerImageMaterialId(e.target.value)}
                className="col-span-8 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
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
                  const selected = moduleBankImageAssets.find((asset) => asset.id === moduleManagerImageMaterialId);
                  if (!selected) return;
                  updateSelectedComposerActivityData({
                    url: selected.url,
                    alt: data.alt || selected.alt || '',
                  });
                }}
                disabled={!moduleManagerImageMaterialId || moduleBankImageAssets.length === 0}
                className="col-span-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white"
              >
                Use
              </button>
              <button
                type="button"
                onClick={() => {
                  setVaultTargetField({ target: 'composer-image' });
                  setIsVaultOpen(true);
                }}
                className="col-span-2 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                title="Browse Local Vault"
              >
                <FolderOpen size={11} /> Vault
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              For offline modules, use local paths like `/materials/...` from your vault/material library.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Alt Text</label>
            <input
              type="text"
              value={data.alt || ''}
              onChange={(e) => updateSelectedComposerActivityData({ alt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Caption</label>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => updateSelectedComposerActivityData({ caption: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Display Width</label>
            <select
              value={data.width || 'full'}
              onChange={(e) => updateSelectedComposerActivityData({ width: e.target.value })}
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

    if (selectedComposerActivity.type === 'hotspot_image') {
      return <HotspotEditor data={data} onChange={updateSelectedComposerActivityData} />;
    }

    if (selectedComposerActivity.type === 'assessment_embed') {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Block Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
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
                  onClick={() => updateSelectedComposerActivityData({ items: items.filter((_, itemIdx) => itemIdx !== idx) })}
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
              value={moduleManagerAssessmentId}
              onChange={(e) => setModuleManagerAssessmentId(e.target.value)}
              className="col-span-9 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {moduleBankAssessments.length === 0 && <option value="">No saved assessments</option>}
              {moduleBankAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title || assessment.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const selected = moduleBankAssessments.find((assessment) => assessment.id === moduleManagerAssessmentId);
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
                updateSelectedComposerActivityData({ items: nextItems });
              }}
              disabled={!moduleManagerAssessmentId || moduleBankAssessments.length === 0}
              className="col-span-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-xs font-bold text-white"
            >
              Add
            </button>
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'spacer_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Spacer Height (px)</label>
            <input
              type="number"
              min="0"
              max="600"
              value={Number.isFinite(Number(data.height)) ? data.height : 48}
              onChange={(e) => updateSelectedComposerActivityData({ height: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Optional utility block. You can also keep rows open and move blocks directly into empty grid cells.
          </p>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'submission_builder') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Section Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Button Label</label>
            <input
              type="text"
              value={data.buttonLabel || ''}
              onChange={(e) => updateSelectedComposerActivityData({ buttonLabel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'save_load_block') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Section Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateSelectedComposerActivityData({ description: e.target.value })}
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Download Filename</label>
            <input
              type="text"
              value={data.fileName || ''}
              onChange={(e) => updateSelectedComposerActivityData({ fileName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              placeholder="module-progress"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            This block downloads all learner inputs as JSON and can restore them from an uploaded backup file.
          </p>
        </div>
      );
    }

    if (selectedComposerActivity.type === 'tab_group') {
      const tabSpecs = [
        { key: 'activities', match: 'activit', defaultId: 'activities', defaultLabel: 'Activities' },
        { key: 'additional', match: 'additional', defaultId: 'additional', defaultLabel: 'Additional Learning' },
      ];
      const sourceTabs = Array.isArray(data.tabs) ? data.tabs : [];
      const linkableActivities = moduleManagerComposerActivities
        .map((activity, idx) => {
          if (idx === moduleManagerComposerSelectedIndex) return null;
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
        updateSelectedComposerActivityData({
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
              onChange={(e) => updateSelectedComposerActivityData({ title: e.target.value })}
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
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
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
      const def = getActivityDefinition(selectedComposerActivity.type);
      if (def && typeof def.createDefaultData === 'function') {
        return def.createDefaultData();
      }
      return data;
    })();

    return <GenericDataEditor data={data} onChange={replaceSelectedComposerActivityData} schemaTemplate={fallbackTemplate} />;
  };

  const addStandaloneModule = () => {
    try {
      if (!moduleManagerID.trim()) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Please provide a Module ID (e.g., view-focus-phase3)');
        return;
      }
      
      if (!moduleManagerHTML.trim()) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Please paste your complete HTML file');
        return;
      }
      
      // Ensure ID starts with 'view-'
      const moduleId = moduleManagerID.startsWith('view-') ? moduleManagerID : `view-${moduleManagerID}`;
      
      // Check for duplicate module ID
      const existingModule = projectData["Current Course"].modules?.find(m => m.id === moduleId);
      if (existingModule) {
        setModuleManagerStatus('error');
        setModuleManagerMessage(`Module ID "${moduleId}" already exists! Use a different ID.`);
        return;
      }
      
      // Basic validation: Check if it looks like HTML
      const rawHtml = moduleManagerHTML.trim();
      if (!rawHtml.includes('<') || !rawHtml.includes('>')) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('This does not appear to be valid HTML');
        return;
      }
      
      // Extract title from HTML if not provided
      let title = moduleManagerTitle.trim();
      if (!title) {
        const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else {
          title = moduleId.replace('view-', '').replace(/-/g, ' ');
        }
      }
      
      // Create module object with RAW HTML stored as-is
      // No parsing, no CSS extraction, no script extraction
      // The iframe will handle everything
      const normalizedHero = normalizeFinlitHeroForSave(moduleManagerHero);
      const normalizedFinlit = normalizeFinlitTemplateForSave(moduleManagerFinlit);
      const newModule = {
        id: moduleId,
        title: title,
        type: 'standalone',
        mode: 'custom_html',
        template: moduleManagerTemplate || null,
        theme: moduleManagerTheme || null,
        hero: normalizedHero,
        finlit: normalizedFinlit,
        activities: [],
        composerLayout: { mode: 'simple', maxColumns: 1, rowHeight: 24, margin: [12, 12], containerPadding: [12, 12], simpleMatchTallestRow: false },
        templateLayoutProfiles: {},
        // Store the COMPLETE raw HTML document - this is the key change
        rawHtml: rawHtml,
        // Keep these for backward compatibility (empty for new modules)
        html: '',
        css: '',
        script: '',
        // History for version tracking
        history: [{
          timestamp: new Date().toISOString(),
          title: title,
          mode: 'custom_html',
          template: moduleManagerTemplate || null,
          theme: moduleManagerTheme || null,
          hero: normalizedHero,
          finlit: normalizedFinlit,
          activities: [],
          composerLayout: { mode: 'simple', maxColumns: 1, rowHeight: 24, margin: [12, 12], containerPadding: [12, 12], simpleMatchTallestRow: false },
          templateLayoutProfiles: {},
          rawHtml: rawHtml
        }]
      };
      
      // Add to project
      setProjectData(prev => {
        const newData = { ...prev };
        const currentModules = newData["Current Course"].modules || [];
        newData["Current Course"] = {
          ...newData["Current Course"],
          modules: [...currentModules, newModule]
        };
        return newData;
      });
      
      // Clear state
      setModuleManagerHTML('');
      setModuleManagerID('');
      setModuleManagerTitle('');
      setModuleManagerTemplate('');
      setModuleManagerTemplateLayoutProfiles({});
      setModuleManagerTheme('');
      setModuleManagerHero(createFinlitHeroFormState());
      setModuleManagerFinlit(createFinlitTemplateFormState());
      setModuleManagerFinlitAuthoringTabId('activities');
      setModuleManagerStatus('success');
      setModuleManagerMessage(`Module "${title}" added successfully. It will run in an isolated iframe.`);
      
      setTimeout(() => {
        setModuleManagerStatus(null);
        setModuleManagerMessage('');
      }, 3000);
      
    } catch (err) {
      setModuleManagerStatus('error');
      setModuleManagerMessage('Error: ' + err.message);
      console.error('Module manager error:', err);
    }
  };

  const addComposerModule = () => {
    try {
      if (!moduleManagerID.trim()) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Please provide a Module ID (e.g., view-focus-phase3)');
        return;
      }

      // Ensure ID starts with 'view-'
      const moduleId = moduleManagerID.startsWith('view-') ? moduleManagerID : `view-${moduleManagerID}`;

      // Check for duplicate module ID
      const existingModule = projectData["Current Course"].modules?.find(m => m.id === moduleId);
      if (existingModule) {
        setModuleManagerStatus('error');
        setModuleManagerMessage(`Module ID "${moduleId}" already exists! Use a different ID.`);
        return;
      }

      // Derive title from ID when omitted
      const title = moduleManagerTitle.trim() || moduleId.replace('view-', '').replace(/-/g, ' ');
      const composerLayout = normalizeComposerLayout(moduleManagerComposerLayout);
      const composerActivities =
        moduleManagerComposerActivities.length > 0
          ? normalizeComposerActivities(moduleManagerComposerActivities, {
              maxColumns: composerLayout.maxColumns,
              mode: composerLayout.mode,
            })
          : normalizeComposerActivities([buildComposerStarterActivity(moduleManagerComposerStarterType)], {
              maxColumns: composerLayout.maxColumns,
              mode: composerLayout.mode,
            });
      const resolvedFinlitComposerState = resolveFinlitTabComposerState({
        finlit: moduleManagerFinlitState,
        moduleActivities: composerActivities,
        composerLayout,
        activeTabId: moduleManagerFinlitAuthoringTabId,
        activeTabActivities: composerActivities,
      });
      const canonicalComposerActivities =
        isModuleManagerFinlitComposer && Array.isArray(resolvedFinlitComposerState.canonicalActivities)
          ? resolvedFinlitComposerState.canonicalActivities
          : composerActivities;
      const normalizedHero = normalizeFinlitHeroForSave(moduleManagerHero);
      const normalizedFinlit = normalizeFinlitTemplateForSave(resolvedFinlitComposerState.finlit);
      const templateLayoutProfiles = buildTemplateLayoutProfilesForComposerState({
        templateOverride: moduleManagerTemplate,
        composerLayout,
        activities: canonicalComposerActivities,
      });

      const newModule = {
        id: moduleId,
        title,
        type: 'standalone',
        mode: 'composer',
        template: moduleManagerTemplate || null,
        theme: moduleManagerTheme || null,
        hero: normalizedHero,
        finlit: normalizedFinlit,
        composerLayout,
        activities: canonicalComposerActivities,
        templateLayoutProfiles,
        rawHtml: '',
        html: '',
        css: '',
        script: '',
        history: [{
          timestamp: new Date().toISOString(),
          title,
          mode: 'composer',
          template: moduleManagerTemplate || null,
          theme: moduleManagerTheme || null,
          hero: normalizedHero,
          finlit: normalizedFinlit,
          composerLayout,
          activities: canonicalComposerActivities,
          templateLayoutProfiles,
        }]
      };

      // Validate module before saving
      const validation = validateModule(newModule, true);
      if (!validation.isValid) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Validation failed: ' + validation.errors.join(', '));
        if (validation.warnings.length > 0) {
          console.warn('Module warnings:', validation.warnings);
        }
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('Module warnings:', validation.warnings);
      }

      setProjectData(prev => {
        const newData = { ...prev };
        const currentModules = newData["Current Course"].modules || [];
        newData["Current Course"] = {
          ...newData["Current Course"],
          modules: [...currentModules, newModule]
        };
        return newData;
      });

      setModuleManagerID('');
      setModuleManagerTitle('');
      setModuleManagerTemplate('');
      setModuleManagerTemplateLayoutProfiles({});
      setModuleManagerTheme('');
      setModuleManagerHero(createFinlitHeroFormState());
      setModuleManagerFinlit(createFinlitTemplateFormState());
      setModuleManagerFinlitAuthoringTabId('activities');
      setModuleManagerComposerLayout({
        mode: 'simple',
        maxColumns: 1,
        rowHeight: 24,
        margin: [12, 12],
        containerPadding: [12, 12],
        simpleMatchTallestRow: false,
      });
      setModuleManagerComposerActivities(
        normalizeComposerActivities([buildComposerStarterActivity(moduleManagerComposerStarterType)], {
          maxColumns: 1,
          mode: 'simple',
        }),
      );
      setModuleManagerComposerExtraRows(0);
      setModuleManagerComposerCanvasGapRows(1);
      setModuleManagerComposerSelectedIndex(0);
      resetComposerHistory();
      setModuleManagerStatus('success');
      setModuleManagerMessage(`Composer module "${title}" added with ${canonicalComposerActivities.length} activities.`);

      setTimeout(() => {
        setModuleManagerStatus(null);
        setModuleManagerMessage('');
      }, 3000);
    } catch (err) {
      setModuleManagerStatus('error');
      setModuleManagerMessage('Error: ' + err.message);
      console.error('Composer module manager error:', err);
    }
  };
  
  const addExternalLinkModule = () => {
    try {
      if (!moduleManagerID.trim()) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Please provide a Module ID (e.g., view-biology-ch1)');
        return;
      }
      
      if (!moduleManagerURL.trim()) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Please provide a URL');
        return;
      }
      
      // Validate URL
      try {
        new URL(moduleManagerURL);
      } catch {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Invalid URL format. Please include http:// or https://');
        return;
      }
      
      // Ensure ID starts with 'view-'
      const moduleId = moduleManagerID.startsWith('view-') ? moduleManagerID : `view-${moduleManagerID}`;
      
      // Check for duplicate
      const existingModule = projectData["Current Course"].modules?.find(m => m.id === moduleId);
      if (existingModule) {
        setModuleManagerStatus('error');
        setModuleManagerMessage(`Module ID "${moduleId}" already exists! Use a different ID.`);
        return;
      }
      
      // Create module object
      const normalizedHero = normalizeFinlitHeroForSave(moduleManagerHero);
      const normalizedFinlit = normalizeFinlitTemplateForSave(moduleManagerFinlit);
      const newModule = {
        id: moduleId,
        title: moduleManagerTitle || moduleId.replace('view-', '').replace(/-/g, ' '),
        type: 'external',
        mode: 'custom_html',
        template: moduleManagerTemplate || null,
        theme: moduleManagerTheme || null,
        hero: normalizedHero,
        finlit: normalizedFinlit,
        activities: [],
        composerLayout: { mode: 'simple', maxColumns: 1, rowHeight: 24, margin: [12, 12], containerPadding: [12, 12], simpleMatchTallestRow: false },
        templateLayoutProfiles: {},
        url: moduleManagerURL,
        linkType: moduleManagerLinkType,
        // Initialize history with version 1 (original state)
        history: [{
          timestamp: new Date().toISOString(),
          title: moduleManagerTitle || moduleId.replace('view-', '').replace(/-/g, ' '),
          mode: 'custom_html',
          template: moduleManagerTemplate || null,
          theme: moduleManagerTheme || null,
          hero: normalizedHero,
          finlit: normalizedFinlit,
          activities: [],
          composerLayout: { mode: 'simple', maxColumns: 1, rowHeight: 24, margin: [12, 12], containerPadding: [12, 12], simpleMatchTallestRow: false },
          templateLayoutProfiles: {},
          url: moduleManagerURL,
          linkType: moduleManagerLinkType
        }]
      };
      
      // Validate module before saving
      const validation = validateModule(newModule, true);
      if (!validation.isValid) {
        setModuleManagerStatus('error');
        setModuleManagerMessage('Validation failed: ' + validation.errors.join(', '));
        if (validation.warnings.length > 0) {
          console.warn('Module warnings:', validation.warnings);
        }
        return;
      }
      
      // Show warnings but allow save
      if (validation.warnings.length > 0) {
        console.warn('Module warnings:', validation.warnings);
      }
      
      // Add to project
      setProjectData(prev => {
        const newData = { ...prev };
        const currentModules = newData["Current Course"].modules || [];
        newData["Current Course"] = {
          ...newData["Current Course"],
          modules: [...currentModules, newModule]
        };
        return newData;
      });
      
      // Clear state
      setModuleManagerURL('');
      setModuleManagerID('');
      setModuleManagerTitle('');
      setModuleManagerTemplate('');
      setModuleManagerTemplateLayoutProfiles({});
      setModuleManagerTheme('');
      setModuleManagerHero(createFinlitHeroFormState());
      setModuleManagerFinlit(createFinlitTemplateFormState());
      setModuleManagerFinlitAuthoringTabId('activities');
      setModuleManagerStatus('success');
      setModuleManagerMessage(`External link module "${newModule.title}" added successfully.`);
      
      setTimeout(() => {
        setModuleManagerStatus(null);
        setModuleManagerMessage('');
      }, 3000);
      
    } catch (err) {
      setModuleManagerStatus('error');
      setModuleManagerMessage('Error: ' + err.message);
      console.error('Module manager error:', err);
    }
  };
  
  const testExternalLink = async (url) => {
    if (!url || !url.trim()) {
      setLinkTestResult({
        success: false,
        message: 'Please enter a URL first'
      });
      return;
    }
    
    setTestingLink(true);
    setLinkTestResult(null);
    
    try {
      // Validate URL format first
      let testUrl = url.trim();
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = 'https://' + testUrl;
      }
      
      new URL(testUrl); // Validate format
      
      // Try to fetch (with CORS check)
      // Note: This will fail for CORS-protected sites, but that's okay - we're just checking format
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(testUrl, { 
          method: 'HEAD', 
          mode: 'no-cors', // This will always "succeed" but we can check if URL is valid
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Since we're using no-cors, we can't check the actual response
        // But if we got here, the URL format is valid
        setLinkTestResult({
          success: true,
          message: 'URL format is valid. Note: Cannot verify accessibility due to browser security (CORS).'
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          setLinkTestResult({
            success: false,
            message: 'Request timed out. URL may be unreachable or slow.'
          });
        } else {
          // URL format is valid, but we can't verify accessibility
          setLinkTestResult({
            success: true,
            message: 'URL format is valid. Cannot verify accessibility due to browser security.'
          });
        }
      }
    } catch (err) {
      setLinkTestResult({
        success: false,
        message: 'Invalid URL format: ' + err.message
      });
    } finally {
      setTestingLink(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileJson className="text-yellow-400" /> Phase 1: Harvest
        </h2>
        
        {/* HARVEST TYPE TOGGLE */}
        <div className="mb-6">
            <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 w-full md:w-auto overflow-x-auto">
                <button onClick={() => setHarvestType('ASSESSMENT')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${harvestType === 'ASSESSMENT' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <CheckCircle size={14} /> Assessment
                </button>
                <button onClick={() => setHarvestType('MATERIALS')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${harvestType === 'MATERIALS' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                   <FolderOpen size={14} /> Materials
                </button>
                 <button onClick={() => setHarvestType('AI_MODULE')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${harvestType === 'AI_MODULE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Sparkles size={14} /> AI Studio
                 </button>
                 <button onClick={() => setHarvestType('MODULE_MANAGER')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${harvestType === 'MODULE_MANAGER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Box size={14} /> Module Manager
                 </button>
            </div>
        </div>

         <>
            {harvestType === 'ASSESSMENT' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                     <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                        <h3 className="text-sm font-bold text-purple-400 mb-4">Assessment Center</h3>
                        
                        {/* Assessment Mode Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-purple-800/50 pb-2 overflow-x-auto">
                            <button 
                                onClick={() => setMode('ADD')} 
                                className={`px-4 py-2 rounded-t text-xs font-bold transition-colors whitespace-nowrap ${mode === 'ADD' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <Plus size={14} /> Add Questions
                            </button>
                            <button 
                                onClick={() => setMode('MASTER')} 
                                className={`px-4 py-2 rounded-t text-xs font-bold transition-colors whitespace-nowrap ${mode === 'MASTER' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <Sparkles size={14} /> Master Assessment
                            </button>
                            <button 
                                onClick={() => setMode('MANAGE')} 
                                className={`px-4 py-2 rounded-t text-xs font-bold transition-colors whitespace-nowrap ${mode === 'MANAGE' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <Clipboard size={14} /> Manage
                            </button>
                            <button 
                                onClick={() => setMode('MIGRATE')} 
                                className={`px-4 py-2 rounded-t text-xs font-bold transition-colors whitespace-nowrap ${mode === 'MIGRATE' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <RefreshCw size={14} /> Migrate
                            </button>
                            <button 
                                onClick={() => setMode('IMPORT')} 
                                className={`px-4 py-2 rounded-t text-xs font-bold transition-colors whitespace-nowrap ${mode === 'IMPORT' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <FileJson size={14} /> Smart Import
                            </button>
                        </div>

                        {/* ADD QUESTIONS MODE */}
                        {mode === 'ADD' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 italic">Build individual questions to add to your Master Assessment.</p>
                                
                                {/* Question Type Selector */}
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={() => {
                                            setCurrentQuestionType('multiple-choice');
                                            setCurrentQuestion({ question: '', options: ['', '', '', ''], correct: 0 });
                                        }} 
                                        className={`flex-1 py-3 px-4 rounded text-xs font-bold transition-all ${currentQuestionType === 'multiple-choice' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        <CheckCircle size={14} /> Multiple Choice
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setCurrentQuestionType('long-answer');
                                            setCurrentQuestion({ question: '', options: ['', '', '', ''], correct: 0 });
                                        }} 
                                        className={`flex-1 py-3 px-4 rounded text-xs font-bold transition-all ${currentQuestionType === 'long-answer' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        <Edit size={14} /> Long Answer
                                    </button>
                        </div>

                                {/* Multiple Choice Question Builder */}
                                {currentQuestionType === 'multiple-choice' && (
                                    <div className="p-4 bg-blue-900/10 border border-blue-700/30 rounded-xl space-y-4">
                                        <h4 className="text-sm font-bold text-blue-400">Multiple Choice Question</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Question</label>
                                            <textarea 
                                                value={currentQuestion.question}
                                                onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                                                placeholder="Enter your question..."
                                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm h-20 resize-none"
                                            />
                    </div>
                    
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Answer Options</label>
                                            <div className="space-y-2">
                                                {currentQuestion.options.map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <input 
                                                            type="radio"
                                                            name="correct-answer"
                                                            checked={currentQuestion.correct === idx}
                                                            onChange={() => setCurrentQuestion({...currentQuestion, correct: idx})}
                                                            className="w-4 h-4"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOptions = [...currentQuestion.options];
                                                                newOptions[idx] = e.target.value;
                                                                setCurrentQuestion({...currentQuestion, options: newOptions});
                                                            }}
                                                            placeholder={`Option ${idx + 1}`}
                                                            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-slate-500 italic mt-2">Select the correct answer by clicking the radio button</p>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (!currentQuestion.question.trim()) {
                                                    alert("Please enter a question");
                                                    return;
                                                }
                                                if (currentQuestion.options.some(opt => !opt.trim())) {
                                                    alert("Please fill in all answer options");
                                                    return;
                                                }
                                                addQuestionToMaster({
                                                    type: 'multiple-choice',
                                                    question: currentQuestion.question,
                                                    options: currentQuestion.options,
                                                    correct: currentQuestion.correct
                                                });
                                                alert("Question added to Master Assessment.");
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add to Master Assessment
                        </button>
                    </div>
                                )}

                                {/* Long Answer Question Builder */}
                                {currentQuestionType === 'long-answer' && (
                                    <div className="p-4 bg-emerald-900/10 border border-emerald-700/30 rounded-xl space-y-4">
                                        <h4 className="text-sm font-bold text-emerald-400">Long Answer Question</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Question / Prompt</label>
                                            <textarea 
                                                value={currentQuestion.question}
                                                onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                                                placeholder="Enter your question or prompt..."
                                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm h-32 resize-none"
                                            />
                                            <p className="text-[9px] text-slate-500 italic mt-2">Students will see a large text area to respond</p>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (!currentQuestion.question.trim()) {
                                                    alert("Please enter a question or prompt");
                                                    return;
                                                }
                                                addQuestionToMaster({
                                                    type: 'long-answer',
                                                    question: currentQuestion.question
                                                });
                                                alert("Question added to Master Assessment.");
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add to Master Assessment
                                        </button>
                         </div>
                    )}

                                {/* Quick Info */}
                                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                    <p className="text-purple-300 text-xs">
                                        <strong>Tip:</strong> Add all your questions here, then go to the "Master Assessment" tab to organize them and generate the final assessment.
                                    </p>
                 </div>
             </div>
        )}

                        {/* CREATE NEW MODE - OLD (KEEPING FOR BACKWARDS COMPAT) */}
                        {mode === 'CREATE' && (
                            <>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Title</label>
                        <input 
                            type="text" 
                            value={assessmentTitle} 
                            onChange={(e) => setAssessmentTitle(e.target.value)} 
                            placeholder="e.g., Mental Fitness Quiz 1" 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                        />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setAssessmentType('quiz')} 
                            className={`flex-1 py-2 px-3 rounded text-xs font-bold ${assessmentType === 'quiz' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                            Multiple Choice
                        </button>
                                    <button 
                                        onClick={() => setAssessmentType('longanswer')} 
                                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${assessmentType === 'longanswer' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        Long Answer
                                    </button>
                        <button 
                            onClick={() => setAssessmentType('print')} 
                            className={`flex-1 py-2 px-3 rounded text-xs font-bold ${assessmentType === 'print' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                            Print & Submit
                        </button>
                    </div>
                            </>
                        )}

                        {mode === 'CREATE' && assessmentType === 'quiz' && (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded border border-slate-700">
                                {quizQuestions.map((q, idx) => (
                                    <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-purple-400">Question {idx + 1}</span>
                                            {quizQuestions.length > 1 && (
                                                <button 
                                                    onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== idx))}
                                                    className="text-rose-400 hover:text-rose-300"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={q.question}
                                            onChange={(e) => updateQuizQuestion(idx, 'question', e.target.value)}
                                            placeholder="Enter question..."
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs mb-2"
                                        />
                                        <div className="space-y-1">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name={`correct-${idx}`}
                                                        checked={q.correct === optIdx}
                                                        onChange={() => updateQuizQuestion(idx, 'correct', optIdx)}
                                                        className="w-3 h-3"
                                                    />
                                                    <input 
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => updateQuizQuestion(idx, `option-${optIdx}`, e.target.value)}
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={addQuizQuestion}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Question
                            </button>
                        </div>
                    )}

                        {mode === 'CREATE' && assessmentType === 'longanswer' && (
                            <div className="space-y-4">
                                <div className="max-h-96 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded border border-slate-700">
                                    {quizQuestions.map((q, idx) => (
                                        <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-purple-400">Prompt {idx + 1}</span>
                                                {quizQuestions.length > 1 && (
                                                    <button 
                                                        onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== idx))}
                                                        className="text-rose-400 hover:text-rose-300"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <textarea 
                                                value={q.question}
                                                onChange={(e) => updateQuizQuestion(idx, 'question', e.target.value)}
                                                placeholder="Enter your question or prompt..."
                                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs h-20 resize-none"
                                            />
                                            <p className="text-[9px] text-slate-500 italic mt-1">Students will see a large text area to respond to this prompt.</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={addQuizQuestion}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Add Prompt
                                </button>
                        </div>
                    )}

                        {mode === 'CREATE' && assessmentType === 'print' && (
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase">Custom Instructions (Optional)</label>
                                <textarea 
                                    value={printInstructions}
                                    onChange={(e) => setPrintInstructions(e.target.value)}
                                    placeholder="Enter custom instructions for students... (Leave blank for default)"
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-xs h-32 resize-none"
                                />
                                <p className="text-[9px] text-slate-500 italic">Default: Standard print & submit instructions with name/date fields</p>
                            </div>
                        )}

                        {mode === 'CREATE' && (
                            <>
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={generateQuizAssessment} 
                                        disabled={!assessmentTitle || (assessmentType === 'quiz' && quizQuestions.some(q => !q.question)) || (assessmentType === 'longanswer' && quizQuestions.some(q => !q.question))}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate Assessment Code
                        </button>
                    </div>

                    {generatedAssessment && (
                        <div className="mt-4">
                                        <CodeBlock label="Assessment JSON Preview" code={generatedAssessment} height="h-64" />
                                        <button 
                                            onClick={() => {
                                                try {
                                                    const parsed = JSON.parse(generatedAssessment);
                                                    addAssessment({
                                                        title: assessmentTitle,
                                                        type: assessmentType,
                                                        html: parsed.html,
                                                        script: parsed.script,
                                                        generatedId: parsed.id || null
                                                    });
                                                    alert("Assessment added successfully! Switching to Manage tab...");
                                                    setGeneratedAssessment("");
                                                    setAssessmentTitle("");
                                                    setQuizQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                                                    setMode('MANAGE'); // Switch to Manage tab to see it
                                                } catch(e) {
                                                    alert("Error adding assessment. Please try again.");
                                                    console.error(e);
                                                }
                                            }}
                                            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded text-xs flex items-center justify-center gap-2"
                                        >
                                            <Zap size={14} /> Add Assessment to Assessments Module
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* MASTER ASSESSMENT MODE */}
                        {mode === 'MASTER' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 italic">Organize your questions and generate the final assessment.</p>
                                
                                {/* Assessment Title */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Title</label>
                                    <input 
                                        type="text"
                                        value={masterAssessmentTitle}
                                        onChange={(e) => setMasterAssessmentTitle(e.target.value)}
                                        placeholder="e.g., Mental Fitness Comprehensive Test"
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                    />
                                </div>

                                {/* Questions List */}
                                <div className="border-t border-slate-700 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">
                                            Questions ({masterQuestions.length})
                                        </h4>
                                        {masterQuestions.length > 0 && (
                                            <button 
                                                onClick={clearMasterAssessment}
                                                className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>

                                    {masterQuestions.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
                                            <p className="text-sm text-slate-500 italic">No questions yet.</p>
                                            <p className="text-xs text-slate-600 mt-2">Go to "Add Questions" tab to add questions.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {masterQuestions.sort((a, b) => a.order - b.order).map((q, idx) => (
                                                <div key={q.id} className="p-4 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800/70 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm flex-shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${q.type === 'multiple-choice' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                    {q.type === 'multiple-choice' ? 'MC' : 'LA'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-200 font-medium mb-1">{q.question}</p>
                                                            {q.type === 'multiple-choice' && (
                                                                <p className="text-[10px] text-slate-500">
                                                                    Correct: {q.options[q.correct]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button 
                                                                onClick={() => moveQuestion(q.id, 'up')}
                                                                disabled={idx === 0}
                                                                className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"
                                                                title="Move up"
                                                            >
                                                                <ArrowUpCircle size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => moveQuestion(q.id, 'down')}
                                                                disabled={idx === masterQuestions.length - 1}
                                                                className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30 rotate-180"
                                                                title="Move down"
                                                            >
                                                                <ArrowUpCircle size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingQuestion(q)}
                                                                className="p-1.5 hover:bg-blue-900 hover:text-blue-400 rounded"
                                                                title="Edit"
                                                            >
                                                                <PenTool size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteQuestion(q.id)}
                                                                className="p-1.5 hover:bg-rose-900 hover:text-rose-400 rounded"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button */}
                                {masterQuestions.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            if (!masterAssessmentTitle.trim()) {
                                                alert("Please enter an assessment title");
                                                return;
                                            }
                                            // Generate assessment - will implement this function next
                                            generateMixedAssessment();
                                        }}
                                        disabled={!masterAssessmentTitle}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Sparkles size={18} /> Generate Assessment Code
                                    </button>
                                )}

                                {/* Generated Assessment Preview */}
                                {generatedAssessment && (
                                    <div className="mt-4">
                                        <CodeBlock label="Assessment JSON Preview" code={generatedAssessment} height="h-64" />
                                        <button 
                                            onClick={() => {
                                                try {
                                                    const parsed = JSON.parse(generatedAssessment);
                                                    addAssessment({
                                                        title: masterAssessmentTitle,
                                                        type: 'mixed',
                                                        html: parsed.html,
                                                        script: parsed.script,
                                                        questionCount: masterQuestions.length,
                                                        generatedId: parsed.id || null,
                                                        source: 'master',
                                                        masterAssessmentTitle,
                                                        masterQuestionsSnapshot: masterQuestions.map((q) => ({
                                                            ...q,
                                                            options: q.options ? [...q.options] : []
                                                        }))
                                                    });
                                                    alert("Assessment added successfully! Switching to Manage tab...");
                                                    setGeneratedAssessment("");
                                                    setMasterAssessmentTitle("");
                                                    setMasterQuestions([]);
                                                    setMode('MANAGE');
                                                } catch(e) {
                                                    alert("Error adding assessment. Please try again.");
                                                    console.error(e);
                                                }
                                            }}
                                            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded text-xs flex items-center justify-center gap-2"
                                        >
                                            <Zap size={14} /> Add Assessment to Module
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MANAGE MODE - Assessment Manager */}
                        {mode === 'MANAGE' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 italic">Manage assessments stored in the Assessments module.</p>
                                
                                <div className="space-y-2">
                                    {(() => {
                                        const assessmentsModule = projectData["Current Course"].modules.find(m => m.id === "item-assessments");
                                        const assessments = assessmentsModule?.assessments || [];
                                        
                                        if (assessments.length === 0) {
                                            return <p className="text-xs text-slate-500 italic text-center py-4">No assessments yet. Create one using "Create New" tab.</p>;
                                        }

                                        return assessments.sort((a, b) => a.order - b.order).map((assess) => {
                                            const canSendToMaster = Array.isArray(assess.masterQuestionsSnapshot) && assess.masterQuestionsSnapshot.length > 0;
                                            return (
                                                <div key={assess.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800/70 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-8 h-8 rounded flex items-center justify-center text-purple-500 bg-purple-500/10 border border-purple-500/20 font-bold text-xs">
                                                                <CheckCircle size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className={`text-sm font-medium ${assess.hidden ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                                    {assess.title} {assess.hidden && <span className="text-[9px] text-slate-600">(HIDDEN)</span>}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500">
                                                                    Type: {assess.type === 'quiz' ? 'Multiple Choice' : assess.type === 'longanswer' ? 'Long Answer' : 'Print & Submit'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={() => toggleAssessmentHidden(assess.id)}
                                                                className={`p-1.5 rounded transition-colors ${assess.hidden ? 'bg-slate-700 text-slate-400' : 'bg-emerald-900 text-emerald-400'}`}
                                                                title={assess.hidden ? "Show" : "Hide"}
                                                            >
                                                                {assess.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setPhase1AssessmentPreview(assess)}
                                                                className="p-1.5 hover:bg-indigo-900 hover:text-indigo-300 rounded"
                                                                title="Preview"
                                                            >
                                                                <Eye size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => moveAssessment(assess.id, 'up')}
                                                                disabled={assess.order === 0}
                                                                className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"
                                                                title="Move up"
                                                            >
                                                                <ArrowUpCircle size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => moveAssessment(assess.id, 'down')}
                                                                disabled={assess.order === assessments.length - 1}
                                                                className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30 rotate-180"
                                                                title="Move down"
                                                            >
                                                                <ArrowUpCircle size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (!canSendToMaster) return;
                                                                    const hasMasterDraft = masterQuestions.length > 0 || masterAssessmentTitle.trim();
                                                                    const warningMessage = hasMasterDraft
                                                                        ? 'This will replace your current Master Assessment questions and title. Continue?'
                                                                        : 'Send this assessment back to Master Assessment for editing?';
                                                                    if (!confirm(warningMessage)) return;
                                                                    const restoredQuestions = assess.masterQuestionsSnapshot.map((q) => ({
                                                                        ...q,
                                                                        options: q.options ? [...q.options] : []
                                                                    }));
                                                                    setMasterQuestions(restoredQuestions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
                                                                    setMasterAssessmentTitle(assess.masterAssessmentTitle || assess.title || '');
                                                                    setGeneratedAssessment('');
                                                                    setEditingQuestion(null);
                                                                    setMode('MASTER');
                                                                }}
                                                                disabled={!canSendToMaster}
                                                                className={`p-1.5 rounded ${canSendToMaster ? 'hover:bg-slate-700' : 'opacity-30 cursor-not-allowed'}`}
                                                                title={canSendToMaster ? "Send back to Master Assessment" : "No Master snapshot available"}
                                                            >
                                                                <RotateCcw size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingAssessment(assess);
                                                                }}
                                                                className="p-1.5 hover:bg-blue-900 hover:text-blue-400 rounded"
                                                                title="Edit"
                                                            >
                                                                <PenTool size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteAssessment(assess.id)}
                                                                className="p-1.5 hover:bg-rose-900 hover:text-rose-400 rounded"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {phase1AssessmentPreview && (
                                    <div
                                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                        onClick={() => setPhase1AssessmentPreview(null)}
                                    >
                                        <div
                                            className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        <Eye size={20} className="text-indigo-300" />
                                                        Assessment Preview: {phase1AssessmentPreview.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-1">Phase 1 live preview</p>
                                                </div>
                                                <button onClick={() => setPhase1AssessmentPreview(null)} className="text-slate-400 hover:text-white transition-colors">
                                                    <X size={24} />
                                                </button>
                                            </div>
                                            <div className="p-0 max-h-[calc(90vh-80px)] overflow-y-auto">
                                                <iframe
                                                    srcDoc={(() => {
                                                        const safeHtml = phase1AssessmentPreview.html || '<p class="text-slate-500">No HTML content</p>';
                                                        const safeScript = cleanModuleScript(phase1AssessmentPreview.script || '');
                                                        const scopedStorageBootstrapTag = buildScopedStorageBootstrapTag(phase1AssessmentPreviewScope);
                                                        return `<!DOCTYPE html><html><head>${scopedStorageBootstrapTag}<script src="https://cdn.tailwindcss.com"><\/script><style>body{background:#020617;color:#e2e8f0;padding:20px;}</style></head><body>${safeHtml}<script>${safeScript}<\/script></body></html>`;
                                                    })()}
                                                    className="w-full border-0"
                                                    style={{ minHeight: '600px' }}
                                                    title={phase1AssessmentPreview.title || 'Assessment Preview'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* EDIT ASSESSMENT MODAL */}
                                {editingAssessment && (
                                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingAssessment(null)}>
                                        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <PenTool size={20} className="text-purple-400" />
                                                    Edit Assessment
                                                </h3>
                                                <button onClick={() => setEditingAssessment(null)} className="text-slate-400 hover:text-white transition-colors">
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Title</label>
                                                    <input 
                                                        type="text"
                                                        value={editingAssessment.title}
                                                        onChange={(e) => setEditingAssessment({...editingAssessment, title: e.target.value})}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Type</label>
                                                    <div className="text-sm text-slate-300 bg-slate-950 border border-slate-700 rounded p-3">
                                                        {editingAssessment.type === 'quiz' ? 'Multiple Choice' : editingAssessment.type === 'longanswer' ? 'Long Answer' : 'Print & Submit'}
                                                        <span className="text-[10px] text-slate-500 block mt-1">Type cannot be changed after creation</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Text Color Override</label>
                                                    <p className="text-[10px] text-slate-500 mb-1 italic">Overrides Phase 5 Assessment Text Color for this assessment only</p>
                                                    <select
                                                        value={editingAssessment.textColorOverride ?? ''}
                                                        onChange={(e) => setEditingAssessment({ ...editingAssessment, textColorOverride: e.target.value || null })}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                                    >
                                                        {assessmentOverrideOptions.map((opt) => (
                                                            <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Box Color Override</label>
                                                    <p className="text-[10px] text-slate-500 mb-1 italic">Overrides Phase 5 Assessment Box Color for this assessment only</p>
                                                    <select
                                                        value={editingAssessment.boxColorOverride ?? ''}
                                                        onChange={(e) => setEditingAssessment({ ...editingAssessment, boxColorOverride: e.target.value || null })}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                                    >
                                                        {assessmentOverrideOptions.map((opt) => (
                                                            <option key={'box-' + (opt.value || 'default')} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                                                    <p className="text-amber-300 text-xs">
                                                        <strong>Note:</strong> To edit questions/prompts, you'll need to recreate the assessment in the "Create New" tab with your changes.
                                                    </p>
                                                </div>

                                                <div className="flex gap-3 pt-4">
                                                    <button 
                                                        onClick={() => setEditingAssessment(null)}
                                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            editAssessment(editingAssessment.id, {
                                                                title: editingAssessment.title,
                                                                textColorOverride: editingAssessment.textColorOverride || null,
                                                                boxColorOverride: editingAssessment.boxColorOverride || null
                                                            });
                                                            setEditingAssessment(null);
                                                        }}
                                                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                                                    >
                                                        <Save size={16} /> Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                        {/* EDIT QUESTION MODAL */}
                        {/* Rendered at the bottom so the same modal can be shown from any mode */}
                        {editingQuestion && (() => {
                            const isMC = editingQuestion.type === 'multiple-choice';
                            const optionsList = editingQuestion.options?.length ? editingQuestion.options : ['', '', '', ''];
                            const allOptionsFilled = optionsList.every(opt => opt && opt.trim());
                            const canSave = editingQuestion.question?.trim() && (!isMC || allOptionsFilled);

                            const setOptionValue = (idx, value) => {
                                setEditingQuestion(prev => {
                                    if (!prev) return prev;
                                    const updatedOptions = prev.options ? [...prev.options] : ['', '', '', ''];
                                    updatedOptions[idx] = value;
                                    return { ...prev, options: updatedOptions };
                                });
                            };

                            const switchQuestionType = (type) => {
                                setEditingQuestion(prev => {
                                    if (!prev) return prev;
                                    if (type === 'multiple-choice') {
                                        return {
                                            ...prev,
                                            type,
                                            options: prev.options?.length ? [...prev.options] : ['', '', '', ''],
                                            correct: typeof prev.correct === 'number' ? prev.correct : 0
                                        };
                                    }
                                    return { ...prev, type };
                                });
                            };

                            const saveChanges = () => {
                                updateQuestion(editingQuestion.id, {
                                    question: editingQuestion.question.trim(),
                                    type: editingQuestion.type,
                                    options: editingQuestion.type === 'multiple-choice'
                                        ? (editingQuestion.options || ['', '', '', '']).map(opt => opt.trim())
                                        : editingQuestion.options,
                                    correct: editingQuestion.type === 'multiple-choice' ? (typeof editingQuestion.correct === 'number' ? editingQuestion.correct : 0) : 0
                                });
                                setEditingQuestion(null);
                            };

                            return (
                                <div
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                    onClick={() => setEditingQuestion(null)}
                                >
                                    <div
                                        className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <PenTool size={20} className="text-purple-400" />
                                                Edit Question
                                            </h3>
                                            <button
                                                onClick={() => setEditingQuestion(null)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => switchQuestionType('multiple-choice')}
                                                    className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all ${isMC ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    <CheckCircle size={14} /> Multiple Choice
                                                </button>
                                                <button
                                                    onClick={() => switchQuestionType('long-answer')}
                                                    className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all ${!isMC ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    <Edit size={14} /> Long Answer
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                                    Question
                                                </label>
                                                <textarea
                                                    value={editingQuestion.question}
                                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                                    placeholder="Enter your question or prompt..."
                                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm h-24 resize-none"
                                                />
                                            </div>

                                            {isMC ? (
                                                <div className="p-4 bg-blue-900/10 border border-blue-700/30 rounded-xl space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                                            Answer Options
                                                        </label>
                                                        <div className="space-y-2">
                                                            {optionsList.map((opt, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <input
                                                                        type="radio"
                                                                        name="editing-correct-answer"
                                                                        checked={editingQuestion.correct === idx}
                                                                        onChange={() => setEditingQuestion({ ...editingQuestion, correct: idx })}
                                                                        className="w-4 h-4"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={opt}
                                                                        onChange={(e) => setOptionValue(idx, e.target.value)}
                                                                        placeholder={`Option ${idx + 1}`}
                                                                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 italic">
                                                        Select the correct answer by clicking the radio button.
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-slate-500 italic">
                                                    Students will see a large text area to respond to this prompt.
                                                </p>
                                            )}

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={() => setEditingQuestion(null)}
                                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={saveChanges}
                                                    disabled={!canSave}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <Save size={16} /> Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* MIGRATE MODE - Assessment Migrator */}
                        {mode === 'MIGRATE' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400">Convert existing assessment code to work with the Assessment Center using AI Studio.</p>
                                
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Paste Existing Assessment Code</label>
                                    <textarea 
                                        value={migrateCode}
                                        onChange={(e) => setMigrateCode(e.target.value)}
                                        placeholder="Paste your existing assessment HTML and JavaScript here..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-xs font-mono h-48 resize-none"
                                    />
                                    
                                    <button 
                                        onClick={() => {
                                            const prompt = `I have an existing assessment that I need to adapt to work with my course builder system.

**ORIGINAL ASSESSMENT CODE:**
\`\`\`
${migrateCode}
\`\`\`

**REQUIREMENTS:**
1. Convert this to use our dark theme (slate-900 backgrounds, white text)
2. Use Tailwind CSS classes for all styling
3. Ensure it works with our assessment system structure
4. Return the code in this exact JSON format:
\`\`\`json
{
  "id": "assess-[unique-id]",
  "title": "[Assessment Title]",
  "type": "quiz", // or "longanswer" or "print"
  "html": "[Full HTML code here]",
  "script": "[Full JavaScript code here]"
}
\`\`\`

**STYLING GUIDELINES:**
- Use dark theme: bg-slate-900, bg-slate-950, text-white, text-slate-400
- Purple accents for assessment elements
- Rounded corners with rounded-lg, rounded-xl
- Borders with border-slate-700, border-slate-800
- Buttons: bg-purple-600 hover:bg-purple-500 text-white

Please convert the code following these guidelines and return ONLY the JSON.`;
                                            
                                            setMigratePrompt(prompt);
                                        }}
                                        disabled={!migrateCode.trim()}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={14} /> Generate AI Studio Prompt
                                    </button>
                                    
                                    {migratePrompt && (
                                        <div className="space-y-2">
                                            <CodeBlock label="AI Studio Prompt (Copy & Use in Google AI Studio)" code={migratePrompt} height="h-48" />
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(migratePrompt);
                                                    alert("Prompt copied! Paste it into Google AI Studio.");
                                                }}
                                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                                            >
                                                <Copy size={14} /> Copy Prompt to Clipboard
                                            </button>
                                            
                                            <div className="border-t border-slate-700 pt-3 mt-3">
                                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2">Paste AI Studio Output</label>
                                                <textarea 
                                                    value={migrateOutput}
                                                    onChange={(e) => setMigrateOutput(e.target.value)}
                                                    placeholder="Paste the JSON output from AI Studio here..."
                                                    className="w-full bg-slate-950 border border-emerald-700 rounded p-3 text-white text-xs font-mono h-32 resize-none"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        try {
                                                            const parsed = JSON.parse(migrateOutput);
                                                            addAssessment({
                                                                title: parsed.title,
                                                                type: parsed.type,
                                                                html: parsed.html,
                                                                script: parsed.script,
                                                                generatedId: parsed.id || null
                                                            });
                                                            alert("Assessment added successfully!");
                                                            setMigrateCode('');
                                                            setMigratePrompt('');
                                                            setMigrateOutput('');
                                                            setMode('MANAGE');
                                                        } catch(e) {
                                                            alert("Invalid JSON. Please check the output and try again.");
                                                        }
                                                    }}
                                                    disabled={!migrateOutput.trim()}
                                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <Zap size={14} /> Add Migrated Assessment
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* DANGER ZONE - Clear All Data */}
                                <div className="mt-8 pt-6 border-t border-rose-900/50">
                                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Danger Zone
                                    </h4>
                                    <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-lg space-y-3">
                                        <p className="text-xs text-rose-300">
                                            Clear all saved data to start fresh. This will delete your current course, all modules, assessments, and settings. <strong>This cannot be undone.</strong>
                                        </p>
                                        <button 
                                            onClick={() => {
                                                if (window.confirm('WARNING: This will permanently delete ALL your course data including:\n\n- Course settings\n- All modules\n- All assessments\n- All materials\n\nAre you sure you want to continue?')) {
                                                    if (window.confirm('FINAL CONFIRMATION: Type "DELETE" in the next prompt to confirm.\n\nClick OK to proceed with deletion.')) {
                                                        const userInput = window.prompt('Type DELETE to confirm:');
                                                        if (userInput === 'DELETE') {
                                                            localStorage.removeItem('course_factory_v2_data');
                                                            localStorage.removeItem('course_factory_backup');
                                                            // Clear any other related keys
                                                            Object.keys(localStorage).forEach(key => {
                                                                if (key.startsWith('courseProgress_') || key.startsWith('course_factory')) {
                                                                    localStorage.removeItem(key);
                                                                }
                                                            });
                                                            alert('All data cleared. The page will now reload.');
                                                            window.location.reload();
                                                        } else {
                                                            alert('Deletion cancelled. Your data is safe.');
                                                        }
                                                    }
                                                }
                                            }}
                                            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={16} /> Clear All Data & Start Fresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* IMPORT MODE - Smart Import */}
                        {mode === 'IMPORT' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                                {/* LEFT COLUMN: Input & AI Instructions */}
                                <div className="space-y-4">
                                    <div className="bg-slate-900 border border-purple-500/30 p-4 rounded-xl space-y-3">
                                        <h3 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                                            <Sparkles size={16}/> Option A: AI Super-Import
                                        </h3>
                                        <div>
                                            <p className="text-xs font-bold text-slate-300 mb-1">For Multiple-Choice Questions:</p>
                                            <div className="bg-black p-2 rounded border border-slate-700 relative group mb-2">
                                                <code className="text-[10px] text-emerald-400 font-mono block break-words">
                                                    Convert this quiz text into JSON. For multiple-choice: [{"{"} "question": "...", "options": ["A","B","C","D"], "correct": 0 {"}"}]. For long-answer: [{"{"} "question": "...", "options": [] {"}"}]. (Correct index: A=0, B=1, C=2, D=3). Output JSON ONLY.
                                                </code>
                                                <button 
                                                    className="absolute top-1 right-1 text-slate-500 hover:text-white"
                                                    onClick={() => navigator.clipboard.writeText('Convert this quiz text into JSON. For multiple-choice: [{ "question": "...", "options": ["A","B","C","D"], "correct": 0 }]. For long-answer/short-answer: [{ "question": "...", "options": [] }]. (Correct index: A=0, B=1, C=2, D=3). Output JSON ONLY.')}
                                                >
                                                    <Copy size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-300 mb-1">For Long-Answer/Short-Answer Questions:</p>
                                            <div className="bg-black p-2 rounded border border-slate-700 relative group mb-2">
                                                <code className="text-[10px] text-cyan-400 font-mono block break-words">
                                                    Convert these open-ended questions into JSON: [{"{"} "question": "What is...?", "options": [] {"}"}]. Include ALL questions, even if they have no answer choices. Output JSON ONLY.
                                                </code>
                                                <button 
                                                    className="absolute top-1 right-1 text-slate-500 hover:text-white"
                                                    onClick={() => navigator.clipboard.writeText('Convert these open-ended questions into JSON: [{ "question": "What is...?", "options": [] }]. Include ALL questions, even if they have no answer choices. Output JSON ONLY.')}
                                                >
                                                    <Copy size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-amber-300 mb-1">For Mixed Types (Recommended):</p>
                                            <div className="bg-black p-2 rounded border border-amber-700 relative group">
                                                <code className="text-[10px] text-amber-400 font-mono block break-words">
                                                    Convert this mixed assessment into JSON. Multiple-choice: [{"{"} "question": "...", "options": ["A","B","C","D"], "correct": 0 {"}"}]. Long-answer: [{"{"} "question": "...", "options": [] {"}"}]. Include ALL questions in order. Output JSON ONLY.
                                                </code>
                                                <button 
                                                    className="absolute top-1 right-1 text-slate-500 hover:text-white"
                                                    onClick={() => navigator.clipboard.writeText('Convert this mixed assessment into JSON. For multiple-choice questions: [{ "question": "...", "options": ["A","B","C","D"], "correct": 0 }]. For long-answer/short-answer questions: [{ "question": "...", "options": [] }]. Include ALL questions in the order they appear. (Correct index: A=0, B=1, C=2, D=3). Output JSON ONLY.')}
                                                >
                                                    <Copy size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-slate-300 mb-2">Paste Data (JSON or Text)</h3>
                                        <textarea
                                            value={importInput}
                                            onChange={(e) => {
                                                setImportInput(e.target.value);
                                                const result = sanitizeImportData(e.target.value);
                                                setImportPreview(result.data);
                                            }}
                                            className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-white focus:border-purple-500 outline-none resize-none"
                                            placeholder="Paste JSON here... OR Paste raw text like:&#10;Multiple-choice:&#10;1. Question?&#10;a. Yes&#10;b. No&#10;Answer: A&#10;&#10;Long-answer:&#10;2. Explain your answer."
                                        />
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Live Preview & Commit */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-white">Preview ({importPreview.length} Qs)</h3>
                                        {importPreview.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const mcCount = importPreview.filter(q => (q.type || (q.options?.length > 0 ? 'multiple-choice' : 'long-answer')) === 'multiple-choice').length;
                                                    const laCount = importPreview.filter(q => (q.type || (q.options?.length > 0 ? 'multiple-choice' : 'long-answer')) === 'long-answer').length;
                                                    return (
                                                        <>
                                                            {mcCount > 0 && <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-bold">{mcCount} MC</span>}
                                                            {laCount > 0 && <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 font-bold">{laCount} LA</span>}
                                                            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">Valid</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scroll pr-2 mb-4 bg-slate-950/50 rounded-lg p-2 border border-slate-800 h-64">
                                        {importPreview.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Paste content to preview...</div>
                                        ) : (
                                            importPreview.map((q, idx) => {
                                                const questionText = typeof q.question === 'string' ? q.question : (q.question || 'Untitled Question');
                                                const optionsArray = Array.isArray(q.options) ? q.options : [];
                                                const questionType = q.type || (optionsArray.length > 0 ? 'multiple-choice' : 'long-answer');
                                                const isLongAnswer = questionType === 'long-answer';
                                                
                                                return (
                                                    <div key={idx} className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="font-bold text-slate-200 flex gap-2 flex-1">
                                                                <span className="text-purple-400">{idx + 1}.</span> 
                                                                <span>{questionText}</span>
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                                isLongAnswer 
                                                                    ? 'bg-cyan-500/20 text-cyan-400' 
                                                                    : 'bg-purple-500/20 text-purple-400'
                                                            }`}>
                                                                {isLongAnswer ? 'Long Answer' : 'Multiple Choice'}
                                                            </span>
                                                        </div>
                                                        {isLongAnswer ? (
                                                            <div className="text-slate-500 italic text-[10px] pl-4">
                                                                Open-ended response
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1 pl-4">
                                                                {optionsArray.length > 0 ? (
                                                                    optionsArray.map((opt, oIdx) => {
                                                                        const optionText = typeof opt === 'string' ? opt : String(opt || '');
                                                                        return (
                                                                            <div key={oIdx} className={`flex items-center gap-2 ${q.correct === oIdx ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                                                                <span>{String.fromCharCode(65+oIdx)}.</span> <span>{optionText}</span>
                                                                                {q.correct === oIdx && <span className="text-[10px] text-emerald-400">(Correct)</span>}
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div className="text-slate-500 italic text-[10px]">No options provided</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (importPreview.length === 0) return;
                                            // Convert to format expected by masterQuestions
                                            const formattedQuestions = importPreview.map(q => ({
                                                type: q.type || (q.options?.length > 0 ? 'multiple-choice' : 'long-answer'),
                                                question: q.question,
                                                options: q.options || [],
                                                correct: typeof q.correct === 'number' ? q.correct : 0
                                            }));
                                            formattedQuestions.forEach(q => addQuestionToMaster(q));
                                            const mcCount = formattedQuestions.filter(q => q.type === 'multiple-choice').length;
                                            const laCount = formattedQuestions.filter(q => q.type === 'long-answer').length;
                                            alert(`Imported ${formattedQuestions.length} questions. (${mcCount} multiple-choice, ${laCount} long-answer)`);
                                            setImportInput("");
                                            setImportPreview([]);
                                            setMode('MASTER');
                                        }}
                                        disabled={importPreview.length === 0}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 transition-all"
                                    >
                                        Import to Master Assessment
                                    </button>
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
            )}

            {harvestType === 'MATERIALS' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                     <div className="p-4 bg-pink-900/20 border border-pink-700/50 rounded-lg">
                        <h3 className="text-sm font-bold text-pink-400 mb-4">Materials Manager</h3>
                        
                        {/* ADD NEW MATERIAL FORM */}
                        <div className="p-4 bg-slate-950 rounded-xl border border-pink-800/50 mb-4">
                            <h4 className="text-xs font-bold text-pink-300 mb-3">Add New Material</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <input 
                                    type="text"
                                    value={materialForm.number}
                                    onChange={(e) => setMaterialForm({...materialForm, number: e.target.value})}
                                    placeholder="Number (e.g., 05)"
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                />
                                <select
                                    value={materialForm.color}
                                    onChange={(e) => setMaterialForm({...materialForm, color: e.target.value})}
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                >
                                    <option value="slate">Gray</option>
                                    <option value="rose">Red</option>
                                    <option value="amber">Orange</option>
                                    <option value="emerald">Green</option>
                                    <option value="sky">Blue</option>
                                    <option value="purple">Purple</option>
                                </select>
                                <select
                                    value={materialForm.mediaType}
                                    onChange={(e) => setMaterialForm({...materialForm, mediaType: e.target.value})}
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                >
                                    <option value="number">Badge: Number</option>
                                    <option value="book">Badge: Book</option>
                                    <option value="pdf">Badge: PDF</option>
                                    <option value="video">Badge: Video</option>
                                    <option value="slides">Badge: Slides</option>
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-[10px] text-slate-500 mb-1">Card theme</label>
                                <select
                                    value={materialForm.themeOverride ?? ''}
                                    onChange={(e) => setMaterialForm({...materialForm, themeOverride: e.target.value || null})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                >
                                    {materialThemeOptions.map((opt) => (
                                        <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <input 
                                type="text"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                                placeholder="Title (e.g., The Engine)"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm mb-2"
                            />
                            <input 
                                type="text"
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                                placeholder="Description"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs mb-2"
                            />
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text"
                                    value={materialForm.viewUrl}
                                    onChange={(e) => setMaterialForm({...materialForm, viewUrl: e.target.value})}
                                    placeholder="View URL"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                />
                                {materialForm.mediaType !== 'video' && (
                                    <button 
                                        onClick={() => { setVaultTargetField('view'); setIsVaultOpen(true); }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded px-3"
                                        title="Browse Local Vault"
                                    >
                                        <FolderOpen size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text"
                                    value={materialForm.downloadUrl}
                                    onChange={(e) => setMaterialForm({...materialForm, downloadUrl: e.target.value})}
                                    placeholder="Download URL (Google Drive /view link)"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                />
                                {materialForm.mediaType !== 'video' && (
                                    <button 
                                        onClick={() => { setVaultTargetField('download'); setIsVaultOpen(true); }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded px-3"
                                        title="Browse Local Vault"
                                    >
                                        <FolderOpen size={14} />
                                    </button>
                                )}
                            </div>
                            
                            {/* Digital Content Import */}
                            <div className="mb-3 p-3 bg-slate-900 rounded border border-slate-700">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input 
                                        type="checkbox"
                                        checked={materialForm.hasDigitalContent}
                                        onChange={(e) => setMaterialForm({...materialForm, hasDigitalContent: e.target.checked})}
                                        className="rounded border-slate-700 bg-slate-900 text-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-emerald-400 uppercase">Enable Digital Resource</span>
                                </label>
                                {materialForm.hasDigitalContent && (
                                    <div className="mt-2">
                                        <p className="text-[10px] text-slate-500 mb-2">Paste JSON content for a themed, readable digital version (chapters, sections, etc.)</p>
                                        <textarea
                                            value={materialForm.digitalContentJson}
                                            onChange={(e) => {
                                                const json = e.target.value;
                                                setMaterialForm({...materialForm, digitalContentJson: json});
                                                // Try to parse and validate
                                                try {
                                                    if (json.trim()) {
                                                        const parsed = JSON.parse(json);
                                                        if (parsed.chapters || parsed.title) {
                                                            setMaterialForm(prev => ({...prev, digitalContent: parsed, digitalContentJson: json}));
                                                        }
                                                    }
                                                } catch(e) {
                                                    // Invalid JSON, keep raw text
                                                }
                                            }}
                                            placeholder='{"title": "My Resource", "chapters": [{"number": 1, "title": "Chapter 1", "sections": [{"heading": "Section 1", "content": "Content here..."}]}]}'
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono h-24 resize-none"
                                        />
                                        {materialForm.digitalContentJson && (
                                            <div className="mt-2">
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(materialForm.digitalContentJson);
                                                        const chapterCount = parsed.chapters?.length || 0;
                                                        const sectionCount = parsed.chapters?.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0) || 0;
                                                        return (
                                                            <p className="text-[10px] text-emerald-400">
                                                                Valid JSON: {chapterCount} chapter{chapterCount !== 1 ? 's' : ''}, {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                                                            </p>
                                                        );
                                                    } catch(e) {
                                                        return <p className="text-[10px] text-rose-400">Invalid JSON: {e.message}</p>;
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Module Assignment */}
                            <div className="mb-3 p-3 bg-slate-900 rounded border border-slate-700">
                                <label className="block text-xs font-bold text-cyan-400 uppercase mb-2">Assign to Modules (Optional)</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {(() => {
                                        const allModules = projectData["Current Course"]?.modules || [];
                                        return allModules.map(m => (
                                            <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={materialForm.assignedModules.includes(m.id)}
                                                    onChange={(e) => {
                                                        const updated = e.target.checked 
                                                            ? [...materialForm.assignedModules, m.id]
                                                            : materialForm.assignedModules.filter(id => id !== m.id);
                                                        setMaterialForm({...materialForm, assignedModules: updated});
                                                    }}
                                                    className="rounded border-slate-700 bg-slate-900 text-cyan-600"
                                                />
                                                <span className="text-xs text-slate-300">{m.title}</span>
                                            </label>
                                        ));
                                    })()}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    if (!materialForm.title) {
                                        alert("Title is required");
                                        return;
                                    }
                                    // Must have either viewUrl or digitalContent
                                    if (!materialForm.viewUrl && !materialForm.digitalContent) {
                                        alert("Please provide either a View URL or Digital Content");
                                        return;
                                    }
                                    addMaterial(materialForm);
                                    setMaterialForm({ number: '', title: '', description: '', viewUrl: '', downloadUrl: '', color: 'slate', mediaType: 'number', themeOverride: null, assignedModules: [], hasDigitalContent: false, digitalContent: null, digitalContentJson: '' });
                                }}
                                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Material
                            </button>
                        </div>

                        {/* MATERIALS LIST */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-pink-300 mb-2">Current Materials</h4>
                            {(() => {
                                const courseMaterials = projectData["Current Course"]?.materials || [];
                                
                                if (courseMaterials.length === 0) {
                                    return <p className="text-xs text-slate-500 italic text-center py-4">No materials yet. Add one above.</p>;
                                }

                                return courseMaterials.sort((a, b) => a.order - b.order).map((mat) => {
                                    const badgeLabel = getMaterialBadgeLabel(mat);
                                    const badgeTextClass = mat.mediaType && mat.mediaType !== 'number'
                                        ? 'text-[9px] font-black uppercase tracking-widest'
                                        : 'text-xs font-bold';
                                    return (
                                        <div key={mat.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800/70 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-${mat.color}-500 bg-${mat.color}-500/10 border border-${mat.color}-500/20 ${badgeTextClass}`}>
                                                        {badgeLabel}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`text-sm font-medium ${mat.hidden ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                            {mat.title} {mat.hidden && <span className="text-[9px] text-slate-600">(HIDDEN)</span>}
                                                            {mat.digitalContent && <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-emerald-900 text-emerald-400 rounded uppercase font-bold">Digital</span>}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">{mat.description}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => toggleMaterialHidden(mat.id)}
                                                        className={`p-1.5 rounded transition-colors ${mat.hidden ? 'bg-slate-700 text-slate-400' : 'bg-emerald-900 text-emerald-400'}`}
                                                        title={mat.hidden ? "Show" : "Hide"}
                                                    >
                                                        {mat.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setPhase1MaterialPreview(mat)}
                                                        className="p-1.5 hover:bg-cyan-900 hover:text-cyan-300 rounded"
                                                        title="Preview"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingMaterial(mat.id);
                                                            setMaterialForm({
                                                                ...mat,
                                                                mediaType: mat.mediaType || 'number',
                                                                themeOverride: mat.themeOverride ?? null,
                                                                hasDigitalContent: !!mat.digitalContent,
                                                                digitalContentJson: mat.digitalContent ? JSON.stringify(mat.digitalContent, null, 2) : ''
                                                            });
                                                        }}
                                                        className="p-1.5 hover:bg-blue-900 hover:text-blue-400 rounded"
                                                        title="Edit"
                                                    >
                                                        <PenTool size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => moveMaterial(mat.id, 'up')}
                                                        disabled={mat.order === 0}
                                                        className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"
                                                        title="Move up"
                                                    >
                                                        <ArrowUpCircle size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => moveMaterial(mat.id, 'down')}
                                                        disabled={mat.order === courseMaterials.length - 1}
                                                        className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30 rotate-180"
                                                        title="Move down"
                                                    >
                                                        <ArrowUpCircle size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteMaterial(mat.id)}
                                                        className="p-1.5 hover:bg-rose-900 hover:text-rose-400 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {phase1MaterialPreview && (
                            <div
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setPhase1MaterialPreview(null)}
                            >
                                <div
                                    className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Eye size={20} className="text-cyan-300" />
                                                Material Preview: {phase1MaterialPreview.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">{phase1MaterialPreview.description || 'No description'}</p>
                                        </div>
                                        <button onClick={() => setPhase1MaterialPreview(null)} className="text-slate-400 hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                                        {phase1MaterialCompiledPreviewDoc && (
                                            <div className="mb-6">
                                                <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-wide mb-2">
                                                    Compiled Materials Preview
                                                </p>
                                                <div className="rounded-lg overflow-hidden border border-slate-700 bg-black">
                                                    <iframe
                                                        srcDoc={phase1MaterialCompiledPreviewDoc}
                                                        className="w-full border-0"
                                                        style={{ minHeight: '620px' }}
                                                        title={phase1MaterialPreview.title || 'Material Compiled Preview'}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-2">
                                                    This is the compiled module rendering. Use the in-frame <span className="text-emerald-300">Read</span> button to test JSON digital content.
                                                </p>
                                            </div>
                                        )}
                                        {phase1MaterialPreview.viewUrl && (
                                            <div className="mb-6 rounded-lg overflow-hidden border border-slate-700 bg-black">
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide px-3 pt-3">Direct Source Preview</p>
                                                <iframe
                                                    src={
                                                        phase1MaterialPreview.viewUrl.includes('/view')
                                                            ? phase1MaterialPreview.viewUrl.replace('/view', '/preview')
                                                            : phase1MaterialPreview.viewUrl
                                                    }
                                                    className="w-full border-0"
                                                    style={{ minHeight: '420px' }}
                                                    title={phase1MaterialPreview.title || 'Material Source Preview'}
                                                />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 uppercase">Number</span>
                                                <p className="text-white">{phase1MaterialPreview.number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 uppercase">Badge</span>
                                                <p className="text-white">{getMaterialBadgeLabel(phase1MaterialPreview)}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase">View URL</span>
                                                <p className="text-cyan-300 text-xs break-all">{phase1MaterialPreview.viewUrl || 'N/A'}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Download URL</span>
                                                <p className="text-cyan-300 text-xs break-all">{phase1MaterialPreview.downloadUrl || 'N/A'}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Digital Content</span>
                                                <p className="text-white text-sm">
                                                    {phase1MaterialPreview.digitalContent
                                                        ? `Enabled (${phase1MaterialPreview.digitalContent?.chapters?.length || 0} chapters)`
                                                        : 'Not configured'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EDIT MATERIAL MODAL */}
                        {editingMaterial && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                                <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Edit Material</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input 
                                                type="text"
                                                value={materialForm.number}
                                                onChange={(e) => setMaterialForm({...materialForm, number: e.target.value})}
                                                placeholder="Number"
                                                className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                            />
                                            <select
                                                value={materialForm.color}
                                                onChange={(e) => setMaterialForm({...materialForm, color: e.target.value})}
                                                className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                            >
                                                <option value="slate">Gray</option>
                                                <option value="rose">Red</option>
                                                <option value="amber">Orange</option>
                                                <option value="emerald">Green</option>
                                                <option value="sky">Blue</option>
                                                <option value="purple">Purple</option>
                                            </select>
                                            <select
                                                value={materialForm.mediaType}
                                                onChange={(e) => setMaterialForm({...materialForm, mediaType: e.target.value})}
                                                className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                            >
                                                <option value="number">Badge: Number</option>
                                                <option value="book">Badge: Book</option>
                                                <option value="pdf">Badge: PDF</option>
                                                <option value="video">Badge: Video</option>
                                                <option value="slides">Badge: Slides</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Card theme</label>
                                            <p className="text-[10px] text-slate-500 mb-1 italic">Overrides Phase 5 default for this material</p>
                                            <select
                                                value={materialForm.themeOverride ?? ''}
                                                onChange={(e) => setMaterialForm({...materialForm, themeOverride: e.target.value || null})}
                                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                            >
                                                {materialThemeOptions.map((opt) => (
                                                    <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input 
                                            type="text"
                                            value={materialForm.title}
                                            onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                                            placeholder="Title"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                        />
                                        <input 
                                            type="text"
                                            value={materialForm.description}
                                            onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                                            placeholder="Description"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                        />
                                        <input 
                                            type="text"
                                            value={materialForm.viewUrl}
                                            onChange={(e) => setMaterialForm({...materialForm, viewUrl: e.target.value})}
                                            placeholder="View URL"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                        />
                                        <input 
                                            type="text"
                                            value={materialForm.downloadUrl}
                                            onChange={(e) => setMaterialForm({...materialForm, downloadUrl: e.target.value})}
                                            placeholder="Download URL"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                        />
                                        
                                        {/* Module Assignment */}
                                        <div className="p-3 bg-black/50 rounded border border-slate-700">
                                            <label className="block text-xs font-bold text-cyan-400 uppercase mb-2">Assign to Modules (Optional)</label>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {(() => {
                                                    const allModules = projectData["Current Course"]?.modules || [];
                                                    return allModules.map(m => (
                                                        <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={(materialForm.assignedModules || []).includes(m.id)}
                                                                onChange={(e) => {
                                                                    const currentAssigned = materialForm.assignedModules || [];
                                                                    const updated = e.target.checked 
                                                                        ? [...currentAssigned, m.id]
                                                                        : currentAssigned.filter(id => id !== m.id);
                                                                    setMaterialForm({...materialForm, assignedModules: updated});
                                                                }}
                                                                className="rounded border-slate-700 bg-slate-900 text-cyan-600"
                                                            />
                                                            <span className="text-xs text-slate-300">{m.title}</span>
                                                        </label>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                        
                                        {/* Digital Content */}
                                        <div className="p-3 bg-black/50 rounded border border-slate-700">
                                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                <input 
                                                    type="checkbox"
                                                    checked={materialForm.hasDigitalContent}
                                                    onChange={(e) => setMaterialForm({...materialForm, hasDigitalContent: e.target.checked})}
                                                    className="rounded border-slate-700 bg-slate-900 text-emerald-600"
                                                />
                                                <span className="text-xs font-bold text-emerald-400 uppercase">Enable Digital Resource</span>
                                            </label>
                                            {materialForm.hasDigitalContent && (
                                                <div className="mt-2">
                                                    <p className="text-[10px] text-slate-500 mb-2">Paste JSON content for a themed, readable digital version</p>
                                                    <textarea
                                                        value={materialForm.digitalContentJson || ''}
                                                        onChange={(e) => {
                                                            const json = e.target.value;
                                                            setMaterialForm({...materialForm, digitalContentJson: json});
                                                            try {
                                                                if (json.trim()) {
                                                                    const parsed = JSON.parse(json);
                                                                    if (parsed.chapters || parsed.title) {
                                                                        setMaterialForm(prev => ({...prev, digitalContent: parsed, digitalContentJson: json}));
                                                                    }
                                                                }
                                                            } catch(e) {
                                                                // Invalid JSON
                                                            }
                                                        }}
                                                        placeholder='{"title": "My Resource", "chapters": [...]}'
                                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono h-32 resize-none"
                                                    />
                                                    {materialForm.digitalContentJson && (
                                                        <div className="mt-2">
                                                            {(() => {
                                                                try {
                                                                    const parsed = JSON.parse(materialForm.digitalContentJson);
                                                                    const chapterCount = parsed.chapters?.length || 0;
                                                                    const sectionCount = parsed.chapters?.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0) || 0;
                                                                    return <p className="text-[10px] text-emerald-400">Valid: {chapterCount} chapters, {sectionCount} sections</p>;
                                                                } catch(e) {
                                                                    return <p className="text-[10px] text-rose-400">Invalid JSON: {e.message}</p>;
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button 
                                            onClick={() => {
                                                setEditingMaterial(null);
                                                setMaterialForm({ number: '', title: '', description: '', viewUrl: '', downloadUrl: '', color: 'slate', mediaType: 'number', themeOverride: null, assignedModules: [], hasDigitalContent: false, digitalContent: null, digitalContentJson: '' });
                                            }}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                editMaterial(editingMaterial, materialForm);
                                                setEditingMaterial(null);
                                                setMaterialForm({ number: '', title: '', description: '', viewUrl: '', downloadUrl: '', color: 'slate', mediaType: 'number', themeOverride: null, assignedModules: [], hasDigitalContent: false, digitalContent: null, digitalContentJson: '' });
                                            }}
                                            className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                                        >
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
            )}

            {harvestType === 'MODULE_MANAGER' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                    <div className="p-6 bg-indigo-900/20 border border-indigo-700/50 rounded-xl">
                        <h3 className="text-lg font-bold text-indigo-400 mb-2 flex items-center gap-2">
                            <Box size={20} /> Module Manager
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Add complete HTML pages as modules. Each module runs in its own <span className="text-emerald-400 font-bold">isolated iframe</span> - your code works exactly as you created it with no modifications.
                        </p>
                        
                        {/* Type Selector */}
                        <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg border border-slate-700">
                            <button
                                onClick={() => {
                                    setModuleManagerType('standalone');
                                    setLinkTestResult(null);
                                }}
                                className={`flex-1 py-2 px-4 rounded text-xs font-bold transition-all ${moduleManagerType === 'standalone' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Standalone HTML
                            </button>
                            <button
                                onClick={() => {
                                    setModuleManagerType('composer');
                                    setLinkTestResult(null);
                                }}
                                className={`flex-1 py-2 px-4 rounded text-xs font-bold transition-all ${moduleManagerType === 'composer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Composer Module
                            </button>
                            <button
                                onClick={() => {
                                    setModuleManagerType('external');
                                    setLinkTestResult(null);
                                }}
                                className={`flex-1 py-2 px-4 rounded text-xs font-bold transition-all ${moduleManagerType === 'external' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                External Link
                            </button>
                        </div>

                        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Draft Saves</p>
                                <span className="text-[10px] text-slate-500">{moduleManagerSavedDrafts.length} saved</span>
                            </div>
                            <input
                                ref={moduleManagerDraftImportRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={importModuleManagerDraftFile}
                            />
                            <div className="grid grid-cols-12 gap-2">
                                <button
                                    type="button"
                                    onClick={() => saveModuleManagerDraft({ overwriteSelected: false })}
                                    className="col-span-12 sm:col-span-3 rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <Save size={12} /> Save New
                                </button>
                                <button
                                    type="button"
                                    onClick={updateModuleManagerSelectedDraft}
                                    disabled={!moduleManagerSelectedDraftId}
                                    className="col-span-12 sm:col-span-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <RefreshCw size={12} /> Update Selected
                                </button>
                                <select
                                    value={moduleManagerSelectedDraftId}
                                    onChange={(e) => setModuleManagerSelectedDraftId(e.target.value)}
                                    className="col-span-12 sm:col-span-6 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                >
                                    {moduleManagerSavedDrafts.length === 0 && <option value="">No saved drafts</option>}
                                    {moduleManagerSavedDrafts.map((draft) => (
                                        <option key={draft.id} value={draft.id}>
                                            {draft.label} ({draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'no timestamp'})
                                        </option>
                                    ))}
                                </select>
                                <label className="col-span-12 sm:col-span-6 inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={moduleManagerDownloadDraftOnSave}
                                        onChange={(event) => setModuleManagerDownloadDraftOnSave(event.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    Download .json when saving
                                </label>
                                <button
                                    type="button"
                                    onClick={loadModuleManagerDraft}
                                    disabled={!moduleManagerSelectedDraftId}
                                    className="col-span-6 sm:col-span-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <FolderOpen size={12} /> Load
                                </button>
                                <button
                                    type="button"
                                    onClick={deleteModuleManagerDraft}
                                    disabled={!moduleManagerSelectedDraftId}
                                    className="col-span-6 sm:col-span-2 rounded bg-rose-700/80 hover:bg-rose-600 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={triggerModuleManagerDraftImport}
                                    className="col-span-6 sm:col-span-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <FolderOpen size={12} /> Import File
                                </button>
                                <button
                                    type="button"
                                    onClick={exportModuleManagerSelectedDraft}
                                    disabled={!moduleManagerSelectedDraftId}
                                    className="col-span-6 sm:col-span-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <FileJson size={12} /> Export File
                                </button>
                                <button
                                    type="button"
                                    onClick={resetModuleManagerBuilder}
                                    className="col-span-12 sm:col-span-4 rounded bg-amber-700/80 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                >
                                    <RotateCcw size={12} /> Reset Builder
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                                Builder state auto-saves locally. You can keep multiple drafts, import/export JSON draft files, and load any saved draft back into Module Manager.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Module ID */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                                    Module ID <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={moduleManagerID}
                                    onChange={(e) => setModuleManagerID(e.target.value)}
                                    placeholder="hss3020 or view-hss3020"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1 italic">
                                    Unique identifier (will be prefixed with 'view-' if needed)
                                </p>
                            </div>
                            
                            {/* Module Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                                    Module Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={moduleManagerTitle}
                                    onChange={(e) => setModuleManagerTitle(e.target.value)}
                                    placeholder="HSS3020 Course"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1 italic">
                                    Display name for the sidebar button
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Template Override</label>
                                    <select
                                        value={moduleManagerTemplate}
                                        onChange={(e) => handleModuleManagerTemplateChange(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                                    >
                                        {MODULE_TEMPLATE_OPTIONS.map((option) => (
                                            <option key={`module-template-${option.value || 'default'}`} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Theme Override</label>
                                    <select
                                        value={moduleManagerTheme}
                                        onChange={(e) => setModuleManagerTheme(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                                    >
                                        {MODULE_THEME_OPTIONS.map((option) => (
                                            <option key={`module-theme-${option.value || 'default'}`} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {showModuleManagerFinlitOptions && (
                                <details className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                                    <summary className="cursor-pointer text-xs font-bold text-slate-300 uppercase tracking-wide">
                                        FinLit Options
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        <div className="rounded border border-slate-700 bg-slate-900/60 p-3 space-y-3">
                                            <div>
                                                <h4 className="text-[11px] font-bold text-slate-300 uppercase">Hero</h4>
                                                <p className="text-[10px] text-slate-500 mt-1">Optional header content for FinLit modules.</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Hero Title</label>
                                                    <input
                                                        type="text"
                                                        value={moduleManagerHero.title}
                                                        onChange={(e) => updateModuleManagerHeroField('title', e.target.value)}
                                                        placeholder="Module hero title"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Progress Label</label>
                                                    <input
                                                        type="text"
                                                        value={moduleManagerHero.progressLabel}
                                                        onChange={(e) => updateModuleManagerHeroField('progressLabel', e.target.value)}
                                                        placeholder="Week 1 of 6"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Subtitle</label>
                                                <input
                                                    type="text"
                                                    value={moduleManagerHero.subtitle}
                                                    onChange={(e) => updateModuleManagerHeroField('subtitle', e.target.value)}
                                                    placeholder="Short supporting line under the hero title"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Media Type</label>
                                                    <select
                                                        value={moduleManagerHero.mediaType}
                                                        onChange={(e) => updateModuleManagerHeroField('mediaType', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                    >
                                                        <option value="auto">Auto Detect</option>
                                                        <option value="image">Image</option>
                                                        <option value="video">Video File</option>
                                                        <option value="embed">Embed URL</option>
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Media URL</label>
                                                    <div className="grid grid-cols-12 gap-2">
                                                        <input
                                                            type="text"
                                                            value={moduleManagerHero.mediaUrl}
                                                            onChange={(e) => updateModuleManagerHeroField('mediaUrl', e.target.value)}
                                                            placeholder="https://... /materials/... / YouTube embed URL"
                                                            className="col-span-9 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
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
                                                    <p className="text-[10px] text-slate-500 mt-1">
                                                        Each tab can have its own block arrangement. Open a tab in the builder to edit its content.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addModuleManagerFinlitTab}
                                                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white inline-flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Tab
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {moduleManagerFinlitState.tabs.map((tab, tabIndex) => {
                                                    const tabId = String(tab?.id || `tab-${tabIndex + 1}`);
                                                    const selectedIds = sanitizeModuleManagerFinlitTabActivityIds(tab?.activityIds);
                                                    const isCoreTab = FINLIT_CORE_TAB_IDS.includes(tabId);
                                                    const tabLinks = Array.isArray(tab?.links) ? tab.links : [];
                                                    const tabActivityCount = Array.isArray(tab?.activities) ? tab.activities.length : 0;
                                                    const isActiveAuthoringTab = moduleManagerActiveFinlitTabId === tabId;
                                                    return (
                                                        <div key={`module-finlit-tab-${tabId}`} className="rounded border border-slate-700 bg-slate-950/70 p-3 space-y-2">
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
                                                                        onClick={() => openModuleManagerFinlitTabInBuilder(tabId)}
                                                                        className={`px-2 py-1 rounded text-[10px] font-bold text-white ${
                                                                            isActiveAuthoringTab ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                                                                        }`}
                                                                    >
                                                                        {isActiveAuthoringTab ? 'Editing This Tab' : 'Open In Builder'}
                                                                    </button>
                                                                    {!isCoreTab && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeModuleManagerFinlitTab(tabId)}
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
                                                                        onChange={(e) => updateModuleManagerFinlitTab(tabId, { label: e.target.value })}
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
                                                                        onClick={() =>
                                                                            updateModuleManagerFinlitTab(tabId, {
                                                                                activityIds: moduleManagerFinlitLinkableActivities.map((entry) => entry.id),
                                                                            })
                                                                        }
                                                                        disabled={moduleManagerFinlitLinkableActivities.length === 0}
                                                                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateModuleManagerFinlitTab(tabId, { activityIds: [] })}
                                                                        disabled={selectedIds.length === 0}
                                                                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-white"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="max-h-44 overflow-y-auto rounded border border-slate-700 bg-slate-900/40 divide-y divide-slate-800">
                                                                {moduleManagerFinlitLinkableActivities.length === 0 ? (
                                                                    <p className="p-3 text-xs text-slate-500">Add other composer activities first, then link them here.</p>
                                                                ) : (
                                                                    moduleManagerFinlitLinkableActivities.map((entry) => {
                                                                        const checked = selectedIds.includes(entry.id);
                                                                        return (
                                                                            <label key={`${tabId}-finlit-activity-${entry.id}`} className="flex items-start gap-2 p-2 cursor-pointer hover:bg-slate-900/70">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={checked}
                                                                                    onChange={() => {
                                                                                        const nextSet = new Set(selectedIds);
                                                                                        if (nextSet.has(entry.id)) nextSet.delete(entry.id);
                                                                                        else nextSet.add(entry.id);
                                                                                        const ordered = moduleManagerFinlitLinkableActivities
                                                                                            .map((item) => item.id)
                                                                                            .filter((id) => nextSet.has(id));
                                                                                        updateModuleManagerFinlitTab(tabId, { activityIds: ordered });
                                                                                    }}
                                                                                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
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
                                                                        onClick={() => addModuleManagerFinlitTabLink(tabId)}
                                                                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white inline-flex items-center gap-1"
                                                                    >
                                                                        <Plus size={12} /> Add Link
                                                                    </button>
                                                                </div>
                                                                {tabLinks.length === 0 ? (
                                                                    <p className="text-[11px] text-slate-500">No links added yet.</p>
                                                                ) : (
                                                                    tabLinks.map((link, linkIndex) => (
                                                                        <div key={`${tabId}-link-${linkIndex}`} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-[11px] font-bold text-slate-300 uppercase">Link {linkIndex + 1}</p>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeModuleManagerFinlitTabLink(tabId, linkIndex)}
                                                                                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={link?.title || ''}
                                                                                onChange={(e) => updateModuleManagerFinlitTabLink(tabId, linkIndex, { title: e.target.value })}
                                                                                placeholder="Link title"
                                                                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                value={link?.url || ''}
                                                                                onChange={(e) => updateModuleManagerFinlitTabLink(tabId, linkIndex, { url: e.target.value })}
                                                                                placeholder="https://example.com/resource"
                                                                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono"
                                                                            />
                                                                            <textarea
                                                                                value={link?.description || ''}
                                                                                onChange={(e) => updateModuleManagerFinlitTabLink(tabId, linkIndex, { description: e.target.value })}
                                                                                placeholder="Short description shown under the link"
                                                                                className="w-full h-16 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
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
                              
                            {/* Standalone HTML Input */}
                            {moduleManagerType === 'standalone' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                                            Paste Complete HTML File <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            value={moduleManagerHTML}
                                            onChange={(e) => setModuleManagerHTML(e.target.value)}
                                            placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>...</head>&#10;<body>...</body>&#10;</html>"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-indigo-100 text-xs font-mono h-64 resize-y focus:border-indigo-500 outline-none"
                                        />
                                        <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                                            Your code runs AS-IS in an isolated iframe - no modifications needed.
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={addStandaloneModule}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <Plus size={16} /> Add Standalone Module
                                    </button>
                                </>
                            )}

                            {/* Composer Module Input */}
                            {moduleManagerType === 'composer' && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-white">Composer Workspace</h4>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setModuleManagerComposerLeftPaneMode('builder')}
                                                        className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide rounded ${
                                                            moduleManagerComposerLeftPaneMode === 'builder'
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'text-slate-300 hover:text-white'
                                                        }`}
                                                    >
                                                        Block Builder
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModuleManagerComposerLeftPaneMode('editor')}
                                                        className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide rounded ${
                                                            moduleManagerComposerLeftPaneMode === 'editor'
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'text-slate-300 hover:text-white'
                                                        }`}
                                                    >
                                                        Block Editor
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={undoComposerDraftChange}
                                                    disabled={!moduleManagerComposerCanUndo}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Undo last composer change"
                                                >
                                                    <RotateCcw size={12} />
                                                    Undo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={redoComposerDraftChange}
                                                    disabled={!moduleManagerComposerCanRedo}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Redo composer change"
                                                >
                                                    <RefreshCw size={12} />
                                                    Redo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setModuleManagerComposerLeftPaneCollapsed((prev) => !prev)}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                                                >
                                                    {moduleManagerComposerLeftPaneCollapsed ? (
                                                        <>
                                                            <ChevronDown size={12} />
                                                            Show Left Pane
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronUp size={12} />
                                                            Hide Left Pane
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setModuleManagerComposerPreviewCollapsed((prev) => !prev)}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                                                >
                                                    {moduleManagerComposerPreviewCollapsed ? (
                                                        <>
                                                            <ChevronDown size={12} />
                                                            Show Preview
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronUp size={12} />
                                                            Hide Preview
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setModuleManagerComposerWorkspaceControlsCollapsed((prev) => !prev)}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                                                >
                                                    {moduleManagerComposerWorkspaceControlsCollapsed ? (
                                                        <>
                                                            <ChevronDown size={12} />
                                                            Show Controls
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronUp size={12} />
                                                            Hide Controls
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {!moduleManagerComposerWorkspaceControlsCollapsed && (
                                            <>
                                                {moduleManagerBothWorkspacePanesOpen && (
                                                    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Preview Width</label>
                                                            <input
                                                                type="range"
                                                                min="30"
                                                                max="75"
                                                                value={moduleManagerPreviewPaneWidth}
                                                                onChange={(e) =>
                                                                    setModuleManagerComposerPreviewWidth(
                                                                        Math.max(30, Math.min(75, Number.parseInt(e.target.value, 10) || 55)),
                                                                    )
                                                                }
                                                                className="flex-1 accent-indigo-500"
                                                            />
                                                            <p className="text-[11px] text-slate-400 whitespace-nowrap">
                                                                {moduleManagerPreviewPaneWidth}% preview / {moduleManagerEditorPaneWidth}% left pane
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!moduleManagerComposerPreviewCollapsed && (
                                                    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Preview Height</label>
                                                            <input
                                                                type="range"
                                                                min="420"
                                                                max="2000"
                                                                step="20"
                                                                value={moduleManagerPreviewPaneHeight}
                                                                onChange={(e) =>
                                                                    setModuleManagerComposerPreviewHeight(
                                                                        Math.max(420, Math.min(2000, Number.parseInt(e.target.value, 10) || 900)),
                                                                    )
                                                                }
                                                                className="flex-1 accent-indigo-500"
                                                            />
                                                            <p className="text-[11px] text-slate-400 whitespace-nowrap">{moduleManagerPreviewPaneHeight}px tall</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {!moduleManagerComposerLeftPaneCollapsed && moduleManagerComposerLeftPaneMode === 'builder' && (
                                                    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3 space-y-3">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Builder Height</label>
                                                            <input
                                                                type="range"
                                                                min="360"
                                                                max="1800"
                                                                step="20"
                                                                value={moduleManagerBuilderPaneHeight}
                                                                onChange={(e) =>
                                                                    setModuleManagerComposerBuilderHeight(
                                                                        Math.max(360, Math.min(1800, Number.parseInt(e.target.value, 10) || 760)),
                                                                    )
                                                                }
                                                                className="flex-1 accent-indigo-500"
                                                            />
                                                            <p className="text-[11px] text-slate-400 whitespace-nowrap">{moduleManagerBuilderPaneHeight}px tall</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Block Width</label>
                                                            <input
                                                                type="range"
                                                                min="140"
                                                                max="360"
                                                                step="10"
                                                                value={moduleManagerBuilderCellWidth}
                                                                onChange={(e) =>
                                                                    setModuleManagerComposerBuilderCellWidth(
                                                                        Math.max(140, Math.min(360, Number.parseInt(e.target.value, 10) || 220)),
                                                                    )
                                                                }
                                                                className="flex-1 accent-indigo-500"
                                                            />
                                                            <p className="text-[11px] text-slate-400 whitespace-nowrap">{moduleManagerBuilderCellWidth}px per column</p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={moduleManagerComposerLockBuilderScale}
                                                                    onChange={(e) => setModuleManagerComposerLockBuilderScale(Boolean(e.target.checked))}
                                                                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                                                                />
                                                                Lock Block Scale
                                                            </label>
                                                            <p className="text-[11px] text-slate-500">
                                                                {moduleManagerComposerMaxColumns} cols x {moduleManagerBuilderCellWidth}px = {moduleManagerBuilderCanvasWidth}px canvas
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {moduleManagerComposerLeftPaneCollapsed && moduleManagerComposerPreviewCollapsed ? (
                                            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-xs text-slate-400">
                                                Both panes are collapsed. Use the buttons above to reopen either pane.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4 lg:flex-row">
                                                {!moduleManagerComposerLeftPaneCollapsed && (
                                                    <div
                                                        className="bg-slate-950 border border-slate-700 rounded-lg p-3 min-w-0"
                                                        style={moduleManagerBothWorkspacePanesOpen ? { flex: `${moduleManagerEditorPaneWidth} 1 0%` } : { flex: '1 1 100%' }}
                                                    >
                                                        {moduleManagerComposerLeftPaneMode === 'builder' ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-sm font-bold text-white">Block Builder</h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[11px] text-slate-500">{moduleManagerComposerActivities.length} total</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setModuleManagerComposerLeftPaneMode('editor')}
                                                                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wide text-slate-200"
                                                                        >
                                                                            Go To Editor
                                                                        </button>
                                                                    </div>
                                                                </div>
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {[
                                                    { value: 'grid', label: 'Grid' },
                                                    { value: 'outline', label: 'Outline' },
                                                    { value: 'issues', label: 'Issues' },
                                                    { value: 'templates', label: 'Templates' },
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.value}
                                                        type="button"
                                                        onClick={() => setModuleManagerComposerSidebarMode(tab.value)}
                                                        className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide border transition-colors ${
                                                            moduleManagerComposerSidebarMode === tab.value
                                                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mb-3 p-2 rounded border border-slate-700 bg-slate-900/60">
                                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Layout Mode</label>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateComposerLayoutMode('simple')}
                                                        className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide border ${
                                                            moduleManagerComposerLayoutMode === 'simple'
                                                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                    >
                                                        Simple
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateComposerLayoutMode('canvas')}
                                                        className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide border ${
                                                            moduleManagerComposerLayoutMode === 'canvas'
                                                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                    >
                                                        Canvas
                                                    </button>
                                                </div>
                                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Grid Columns</label>
                                                <select
                                                    value={moduleManagerComposerMaxColumns}
                                                    onChange={(e) => updateComposerMaxColumns(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                >
                                                    {[1, 2, 3, 4].map((count) => (
                                                        <option key={count} value={count}>
                                                            {count} {count === 1 ? 'Column' : 'Columns'}
                                                        </option>
                                                    ))}
                                                </select>
                                                {isModuleManagerCanvasMode ? (
                                                    <div className="grid grid-cols-5 gap-2 mt-2">
                                                        <label className="text-[10px] text-slate-400">
                                                            Row H
                                                            <input
                                                                type="number"
                                                                min="8"
                                                                max="200"
                                                                value={normalizedModuleManagerLayout.rowHeight}
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
                                                                value={Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin[0] : 12}
                                                                onChange={(e) =>
                                                                    updateComposerCanvasMetric('margin', [
                                                                        Number.parseInt(e.target.value, 10) || 0,
                                                                        Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin[1] : 12,
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
                                                                value={Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin[1] : 12}
                                                                onChange={(e) =>
                                                                    updateComposerCanvasMetric('margin', [
                                                                        Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin[0] : 12,
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
                                                                value={Array.isArray(normalizedModuleManagerLayout.containerPadding) ? normalizedModuleManagerLayout.containerPadding[0] : 12}
                                                                onChange={(e) =>
                                                                    updateComposerCanvasMetric('containerPadding', [
                                                                        Number.parseInt(e.target.value, 10) || 0,
                                                                        Array.isArray(normalizedModuleManagerLayout.containerPadding) ? normalizedModuleManagerLayout.containerPadding[1] : 12,
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
                                                                value={Array.isArray(normalizedModuleManagerLayout.containerPadding) ? normalizedModuleManagerLayout.containerPadding[1] : 12}
                                                                onChange={(e) =>
                                                                    updateComposerCanvasMetric('containerPadding', [
                                                                        Array.isArray(normalizedModuleManagerLayout.containerPadding) ? normalizedModuleManagerLayout.containerPadding[0] : 12,
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
                                                            onClick={() => updateComposerSimpleMatchTallestRow(!(normalizedModuleManagerLayout.simpleMatchTallestRow === true))}
                                                            className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                                                normalizedModuleManagerLayout.simpleMatchTallestRow === true
                                                                    ? 'border-indigo-300 bg-indigo-500'
                                                                    : 'border-slate-600 bg-slate-800'
                                                            }`}
                                                            aria-label="Toggle simple row height matching"
                                                        >
                                                            <span
                                                                className={`mx-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                                                    normalizedModuleManagerLayout.simpleMatchTallestRow === true ? 'translate-x-4' : ''
                                                                }`}
                                                            />
                                                        </button>
                                                    </label>
                                                )}
                                            </div>

                                            {moduleManagerComposerSidebarMode === 'grid' ? (
                                            <div className="overflow-auto pr-1" style={{ maxHeight: `${moduleManagerBuilderPaneHeight}px` }}>
                                                {isModuleManagerCanvasMode ? (
                                                    <div
                                                        style={{
                                                            minHeight: `${moduleManagerCanvasMinHeight}px`,
                                                            ...(moduleManagerComposerLockBuilderScale
                                                                ? { width: `${moduleManagerBuilderCanvasWidth}px`, minWidth: `${moduleManagerBuilderCanvasWidth}px` }
                                                                : {}),
                                                        }}
                                                    >
                                                        <GridLayout
                                                            className="layout"
                                                            layout={moduleManagerCanvasItems}
                                                            cols={moduleManagerComposerMaxColumns}
                                                            rowHeight={normalizedModuleManagerLayout.rowHeight}
                                                            margin={Array.isArray(normalizedModuleManagerLayout.margin) ? normalizedModuleManagerLayout.margin : [12, 12]}
                                                            containerPadding={Array.isArray(normalizedModuleManagerLayout.containerPadding) ? normalizedModuleManagerLayout.containerPadding : [12, 12]}
                                                            autoSize
                                                            isResizable
                                                            isDraggable
                                                            compactType={null}
                                                            verticalCompact={false}
                                                            allowOverlap
                                                            preventCollision={false}
                                                            draggableHandle=".cf-canvas-handle"
                                                            onDragStart={(_layout, _oldItem, newItem) => beginComposerCanvasInteraction('drag', newItem)}
                                                            onResizeStart={(_layout, _oldItem, newItem) => beginComposerCanvasInteraction('resize', newItem)}
                                                            onDragStop={(layoutItems) => finishComposerCanvasInteraction(layoutItems)}
                                                            onResizeStop={(layoutItems) => finishComposerCanvasInteraction(layoutItems)}
                                                            onLayoutChange={(layoutItems) => {
                                                                if (moduleManagerCanvasInteractionRef.current.mode !== 'resize') return;
                                                                applyCanvasGridLayout(layoutItems, { recordHistory: false });
                                                            }}
                                                        >
                                                            {moduleManagerComposerActivities.map((activity, idx) => {
                                                                const def = getActivityDefinition(activity.type);
                                                                const isSelected = idx === moduleManagerComposerSelectedIndex;
                                                                return (
                                                                    <div key={String(idx)} className="overflow-hidden">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setModuleManagerComposerSelectedIndex(idx)}
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
                                                    </div>
                                                ) : null}
                                                <div
                                                    className={`${isModuleManagerCanvasMode ? 'hidden ' : ''}grid gap-2`}
                                                    style={{
                                                        gridTemplateColumns: `repeat(${moduleManagerComposerMaxColumns}, minmax(0, 1fr))`,
                                                        ...(moduleManagerComposerLockBuilderScale
                                                            ? { width: `${moduleManagerBuilderCanvasWidth}px`, minWidth: `${moduleManagerBuilderCanvasWidth}px` }
                                                            : {}),
                                                    }}
                                                >
                                                    {moduleManagerGridModel.emptySlots.map((slot) => {
                                                        const isSlotTarget =
                                                            moduleManagerComposerDraggingIndex !== null &&
                                                            moduleManagerComposerDragOverSlotKey === slot.key &&
                                                            moduleManagerComposerDragOverIndex === null;
                                                        return (
                                                            <div
                                                                key={slot.key}
                                                                className={`relative rounded border border-dashed transition-colors ${
                                                                    isSlotTarget
                                                                        ? 'border-indigo-400 bg-indigo-500/20'
                                                                        : 'border-slate-700/80 bg-slate-900/35 hover:border-indigo-500/60 hover:bg-slate-900/60'
                                                                } cursor-pointer`}
                                                                style={{ gridColumn: `${slot.col}`, gridRow: `${slot.row}`, minHeight: '58px' }}
                                                                onDragOver={(event) => {
                                                                    if (!Number.isInteger(moduleManagerComposerDraggingIndex)) return;
                                                                    event.preventDefault();
                                                                    if (event.dataTransfer) {
                                                                        event.dataTransfer.dropEffect = 'move';
                                                                    }
                                                                    if (moduleManagerComposerDragOverSlotKey !== slot.key) {
                                                                        setModuleManagerComposerDragOverSlotKey(slot.key);
                                                                    }
                                                                    if (moduleManagerComposerDragOverIndex !== null) {
                                                                        setModuleManagerComposerDragOverIndex(null);
                                                                    }
                                                                }}
                                                                onDragLeave={() => {
                                                                    if (moduleManagerComposerDragOverSlotKey === slot.key) {
                                                                        setModuleManagerComposerDragOverSlotKey(null);
                                                                    }
                                                                }}
                                                                onDrop={(event) => {
                                                                    event.preventDefault();
                                                                    const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                                                                    const fromIndex = Number.isInteger(moduleManagerComposerDraggingIndex) ? moduleManagerComposerDraggingIndex : fallback;
                                                                    moveComposerActivityToGridCell(fromIndex, slot.row, slot.col);
                                                                    setModuleManagerComposerDraggingIndex(null);
                                                                    setModuleManagerComposerDragOverIndex(null);
                                                                    setModuleManagerComposerDragOverSlotKey(null);
                                                                }}
                                                                onClick={() => {
                                                                    if (!selectedComposerActivity) return;
                                                                    moveComposerActivityToGridCell(moduleManagerComposerSelectedIndex, slot.row, slot.col);
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    draggable={false}
                                                                    onDragStart={(event) => event.preventDefault()}
                                                                    onMouseDown={(event) => event.stopPropagation()}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        removeComposerEmptyRowDraft(slot.row);
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
                                                    {moduleManagerComposerActivities.map((activity, idx) => {
                                                        const def = getActivityDefinition(activity.type);
                                                        const colSpan = Math.min(activity?.layout?.colSpan || 1, moduleManagerComposerMaxColumns);
                                                        const placement = moduleManagerPlacementByIndex.get(idx);
                                                        const isSelected = idx === moduleManagerComposerSelectedIndex;
                                                        const isDropTarget =
                                                          idx === moduleManagerComposerDragOverIndex &&
                                                          moduleManagerComposerDraggingIndex !== null &&
                                                          idx !== moduleManagerComposerDraggingIndex;
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
                                                                    setModuleManagerComposerDraggingIndex(idx);
                                                                    setModuleManagerComposerSelectedIndex(idx);
                                                                    setModuleManagerComposerDragOverSlotKey(null);
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
                                                                    if (moduleManagerComposerDragOverIndex !== idx) {
                                                                        setModuleManagerComposerDragOverIndex(idx);
                                                                    }
                                                                    if (moduleManagerComposerDragOverSlotKey !== null) {
                                                                        setModuleManagerComposerDragOverSlotKey(null);
                                                                    }
                                                                }}
                                                                onDrop={(event) => {
                                                                    event.preventDefault();
                                                                    const fallback = Number.parseInt(event.dataTransfer?.getData('text/plain') || '', 10);
                                                                    const fromIndex = Number.isInteger(moduleManagerComposerDraggingIndex) ? moduleManagerComposerDraggingIndex : fallback;
                                                                    const placedSpan = placement?.colSpan || colSpan || 1;
                                                                    const placedCol = placement?.col || 1;
                                                                    const rect = event.currentTarget.getBoundingClientRect();
                                                                    const relativeX = rect.width > 0 ? event.clientX - rect.left : 0;
                                                                    const boundedX = Math.max(0, Math.min(Math.max(0, rect.width - 1), relativeX));
                                                                    const offset = placedSpan > 1 && rect.width > 0 ? Math.floor((boundedX / rect.width) * placedSpan) : 0;
                                                                    const targetCol = placedCol + offset;
                                                                    moveComposerActivityToGridCell(fromIndex, placement?.row || 1, targetCol);
                                                                    setModuleManagerComposerDraggingIndex(null);
                                                                    setModuleManagerComposerDragOverIndex(null);
                                                                    setModuleManagerComposerDragOverSlotKey(null);
                                                                }}
                                                                onDragEnd={() => {
                                                                    setModuleManagerComposerDraggingIndex(null);
                                                                    setModuleManagerComposerDragOverIndex(null);
                                                                    setModuleManagerComposerDragOverSlotKey(null);
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModuleManagerComposerSelectedIndex(idx)}
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
                                                                        removeComposerActivityByIndex(idx);
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
                                                {moduleManagerComposerActivities.length === 0 && <p className="text-xs text-slate-500 mt-1">No activities yet.</p>}
                                            </div>
                                            ) : (
                                            <ComposerSidebarTools
                                                mode={moduleManagerComposerSidebarMode}
                                                activities={moduleManagerComposerActivities}
                                                selectedIndex={moduleManagerComposerSelectedIndex}
                                                selectedActivity={selectedComposerActivity}
                                                onSelectIndex={setModuleManagerComposerSelectedIndex}
                                                onDuplicateSelected={duplicateSelectedComposerActivityDraft}
                                                onDeleteSelected={removeSelectedComposerActivityDraft}
                                                onInsertActivity={addComposerActivityFromTemplate}
                                            />
                                            )}

                                            <div className="mt-4 pt-3 border-t border-slate-700">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <select
                                                        value={moduleManagerComposerStarterType}
                                                        onChange={(e) => setModuleManagerComposerStarterType(e.target.value)}
                                                        className="col-span-2 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                    >
                                                        {moduleManagerActivityTypeGroups.map((group) => (
                                                          <optgroup key={`composer-group-${group.category}`} label={group.label}>
                                                            {group.types.map((activityType) => {
                                                              const def = getActivityDefinition(activityType);
                                                              return (
                                                                <option key={activityType} value={activityType}>
                                                                  {def?.label || activityType}
                                                                </option>
                                                              );
                                                            })}
                                                          </optgroup>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={addComposerActivityDraft}
                                                        className="bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold text-white inline-flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} /> Add
                                                    </button>
                                                </div>
                                                {!isModuleManagerCanvasMode ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={addComposerEmptyRowDraft}
                                                            className="w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 text-white text-xs inline-flex items-center justify-center gap-1"
                                                            title="Add one open row below the selected block (or at bottom if none selected)"
                                                        >
                                                            <Plus size={12} /> Add Open Row
                                                        </button>
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase self-center">Selected Span</label>
                                                            <select
                                                                value={selectedComposerActivity?.layout?.colSpan || 1}
                                                                onChange={(e) => updateSelectedComposerActivitySpan(e.target.value)}
                                                                disabled={!selectedComposerActivity}
                                                                className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs disabled:opacity-40"
                                                            >
                                                                {Array.from({ length: moduleManagerComposerMaxColumns }, (_, idx) => idx + 1).map((span) => (
                                                                    <option key={span} value={span}>
                                                                        Span {span}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveSelectedComposerActivityDraft('left')}
                                                                disabled={!selectedComposerActivity || !selectedComposerPlacement || selectedComposerPlacement.col <= 1}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                                title="Move left"
                                                            >
                                                                <ChevronLeft size={12} /> Left
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveSelectedComposerActivityDraft('right')}
                                                                disabled={
                                                                  !selectedComposerActivity ||
                                                                  !selectedComposerPlacement ||
                                                                  selectedComposerPlacement.col >= Math.max(1, moduleManagerComposerMaxColumns - (selectedComposerActivity?.layout?.colSpan || 1) + 1)
                                                                }
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                                title="Move right"
                                                            >
                                                                <ChevronRight size={12} /> Right
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveSelectedComposerActivityDraft('up')}
                                                                disabled={!selectedComposerActivity || !selectedComposerPlacement || selectedComposerPlacement.row <= 1}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                            >
                                                                <ChevronUp size={12} /> Up
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveSelectedComposerActivityDraft('down')}
                                                                disabled={!selectedComposerActivity}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                            >
                                                                <ChevronDown size={12} /> Down
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                                            <label className="text-[10px] text-slate-400">
                                                                X
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={selectedComposerActivity?.layout?.x || 0}
                                                                    onChange={(e) => updateSelectedComposerActivityCanvasLayout({ x: Number.parseInt(e.target.value, 10) || 0 })}
                                                                    disabled={!selectedComposerActivity}
                                                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                                                />
                                                            </label>
                                                            <label className="text-[10px] text-slate-400">
                                                                Y
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={selectedComposerActivity?.layout?.y || 0}
                                                                    onChange={(e) => updateSelectedComposerActivityCanvasLayout({ y: Number.parseInt(e.target.value, 10) || 0 })}
                                                                    disabled={!selectedComposerActivity}
                                                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                                                />
                                                            </label>
                                                            <label className="text-[10px] text-slate-400">
                                                                W
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={moduleManagerComposerMaxColumns}
                                                                    value={selectedComposerActivity?.layout?.w || 1}
                                                                    onChange={(e) => {
                                                                        const nextW = Math.max(1, Number.parseInt(e.target.value, 10) || 1);
                                                                        updateSelectedComposerActivityCanvasLayout({ w: nextW, colSpan: nextW });
                                                                    }}
                                                                    disabled={!selectedComposerActivity}
                                                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                                                />
                                                            </label>
                                                            <label className="text-[10px] text-slate-400">
                                                                H
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={selectedComposerActivity?.layout?.h || 4}
                                                                    onChange={(e) => updateSelectedComposerActivityCanvasLayout({ h: Math.max(1, Number.parseInt(e.target.value, 10) || 1) })}
                                                                    disabled={!selectedComposerActivity}
                                                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-40"
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                                            <label className="text-[10px] text-slate-400">
                                                                Gap Rows
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="12"
                                                                    value={moduleManagerCanvasGapRowCount}
                                                                    onChange={(e) =>
                                                                        setModuleManagerComposerCanvasGapRows(
                                                                            Math.max(1, Math.min(12, Number.parseInt(e.target.value, 10) || 1)),
                                                                        )
                                                                    }
                                                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs"
                                                                />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => insertCanvasGapRelativeToSelected('above')}
                                                                disabled={!selectedComposerActivity}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1 mt-5"
                                                                title="Insert empty rows above the selected block"
                                                            >
                                                                <ChevronUp size={12} /> Insert Above
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => insertCanvasGapRelativeToSelected('below')}
                                                                disabled={!selectedComposerActivity}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1 mt-5"
                                                                title="Insert empty rows below the selected block"
                                                            >
                                                                <ChevronDown size={12} /> Insert Below
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={addCanvasOpenRowsDraft}
                                                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs inline-flex items-center justify-center gap-1 mt-5"
                                                                title="Add extra open rows at the bottom of canvas"
                                                            >
                                                                <Plus size={12} /> Add Bottom Rows
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={duplicateSelectedComposerActivityDraft}
                                                        disabled={!selectedComposerActivity}
                                                        className="flex-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                        title="Duplicate selected activity"
                                                    >
                                                        <Copy size={12} /> Duplicate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={removeSelectedComposerActivityDraft}
                                                        disabled={!selectedComposerActivity}
                                                        className="flex-1 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs inline-flex items-center justify-center gap-1"
                                                        title="Delete selected activity"
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-3 gap-2">
                                                                    <h4 className="text-sm font-bold text-white">
                                                                        {selectedComposerActivity ? (getActivityDefinition(selectedComposerActivity.type)?.label || selectedComposerActivity.type) : 'Activity Editor'}
                                                                    </h4>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setModuleManagerComposerLeftPaneMode('builder')}
                                                                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wide text-slate-200"
                                                                    >
                                                                        Go To Builder
                                                                    </button>
                                                                </div>
                                                                {renderSelectedComposerActivityStylePanel()}
                                                                {renderModuleManagerComposerActivityEditor()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {!moduleManagerComposerPreviewCollapsed && (
                                                    <div
                                                        className="bg-slate-950 border border-slate-700 rounded-lg p-3 min-w-0"
                                                        style={moduleManagerBothWorkspacePanesOpen ? { flex: `${moduleManagerPreviewPaneWidth} 1 0%` } : { flex: '1 1 100%' }}
                                                    >
                                                        <div className="flex items-center justify-between mb-2 gap-2">
                                                            <h4 className="text-sm font-bold text-white">Live Module Preview</h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    moduleManagerComposerPreviewShouldFollowRef.current = false;
                                                                    setModuleManagerComposerPreviewNonce((n) => n + 1);
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                                                                title="Remount preview iframe"
                                                            >
                                                                <RefreshCw size={12} />
                                                                Reset
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mb-3">Preview updates while you build this composer module.</p>
                                                        <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                                                            {moduleManagerComposerPreviewDoc ? (
                                                                <iframe
                                                                    ref={moduleManagerComposerPreviewIframeRef}
                                                                    key={`composer-create-preview-${moduleManagerComposerPreviewNonce}`}
                                                                    srcDoc={moduleManagerComposerPreviewDoc}
                                                                    className="w-full border-0"
                                                                    style={{ height: `${moduleManagerPreviewPaneHeight}px` }}
                                                                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
                                                                    title="Composer draft live preview"
                                                                    onLoad={() => {
                                                                        if (!moduleManagerComposerPreviewShouldFollowRef.current) return;
                                                                        const targetId = moduleManagerComposerPreviewTargetActivityIdRef.current;
                                                                        if (!targetId) return;
                                                                        if (scrollModuleManagerPreviewToActivity(targetId)) {
                                                                            moduleManagerComposerPreviewShouldFollowRef.current = false;
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
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={addComposerModule}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <Plus size={16} /> Add Composer Module
                                    </button>
                                </>
                            )}
                            
                            {/* External Link Input */}
                            {moduleManagerType === 'external' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                                            External URL <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={moduleManagerURL}
                                                onChange={(e) => {
                                                    setModuleManagerURL(e.target.value);
                                                    setLinkTestResult(null); // Clear test result when URL changes
                                                }}
                                                placeholder="https://myhostedmodule.com"
                                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-indigo-500 outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !testingLink) {
                                                        testExternalLink(moduleManagerURL);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => testExternalLink(moduleManagerURL)}
                                                disabled={!moduleManagerURL || testingLink}
                                                className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="Test if URL is accessible"
                                            >
                                                {testingLink ? 'Testing...' : 'Test'}
                                            </button>
                                        </div>
                                        
                                        {/* Test Result */}
                                        {linkTestResult && (
                                            <div className={`mt-2 p-3 rounded-lg text-xs border ${
                                                linkTestResult.success 
                                                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' 
                                                    : 'bg-rose-900/30 text-rose-400 border-rose-500/30'
                                            }`}>
                                                <div className="flex items-start gap-2">
                                                    <span className="font-bold">{linkTestResult.success ? 'OK' : 'Error'}</span>
                                                    <span>{linkTestResult.message}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <p className="text-[10px] text-slate-500 mt-1 italic">
                                            Full URL to the hosted module page. Press Enter or click Test to verify.
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                                            Link Behavior
                                        </label>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition flex-1">
                                                <input
                                                    type="radio"
                                                    name="linkType"
                                                    value="iframe"
                                                    checked={moduleManagerLinkType === 'iframe'}
                                                    onChange={(e) => setModuleManagerLinkType(e.target.value)}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-xs text-slate-300">Open in iframe</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition flex-1">
                                                <input
                                                    type="radio"
                                                    name="linkType"
                                                    value="newtab"
                                                    checked={moduleManagerLinkType === 'newtab'}
                                                    onChange={(e) => setModuleManagerLinkType(e.target.value)}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-xs text-slate-300">Open in new tab</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={addExternalLinkModule}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <Plus size={16} /> Add External Link Module
                                    </button>
                                </>
                            )}
                            
                            {/* Status Messages */}
                            {moduleManagerStatus && (
                                <div className={`p-4 rounded-lg border ${moduleManagerStatus === 'success' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
                                    <p className={`text-sm ${moduleManagerStatus === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {moduleManagerMessage}
                                    </p>
                                </div>
                            )}
                            
                            {/* Help Section */}
                            <div className="p-4 bg-sky-900/10 border border-sky-500/20 rounded-lg">
                                <h4 className="text-xs font-bold text-sky-400 uppercase mb-2">Module Types</h4>
                                <ul className="text-[10px] text-slate-400 space-y-1 leading-relaxed">
                                    <li><strong className="text-sky-300">Standalone HTML:</strong> Complete HTML file (like HSS3020). CSS auto-scoped, wrapped in view container.</li>
                                    <li><strong className="text-sky-300">Composer Module:</strong> Activity-based module using built-in blocks (content, embeds, resources, checks, submission).</li>
                                    <li><strong className="text-sky-300">External Link:</strong> Link to hosted module. Choose iframe (embedded) or new tab (external).</li>
                                    <li>Modules appear in sidebar navigation.</li>
                                    <li>Can be hidden or shown in Phase 2.</li>
                                    <li>Included in compiled site output.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {harvestType === 'AI_MODULE' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                     {/* STEP 1: PROMPT GENERATOR */}
                     <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                        <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                            <Sparkles size={16} /> Step 1: Generate AI Prompt
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Describe what course module you want to create. We&apos;ll generate an optimized prompt for Google AI Studio.
                        </p>
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase">
                                Describe Your Module
                            </label>
                            <textarea 
                                value={aiDescription}
                                onChange={(e) => setAiDescription(e.target.value)}
                                placeholder="Example: Create a drag-and-drop goal-setting activity with 3 categories (Personal, Professional, Health). Include a save button that stores goals to localStorage and a reset button."
                                className="w-full bg-slate-950 border border-emerald-900 rounded-lg p-3 text-sm text-white h-32 focus:border-emerald-500 outline-none resize-y"
                            />
                            <button 
                                onClick={() => {
                                    const safePrompt = `=== PROMPT FOR GOOGLE AI STUDIO ===

I am building a feature for the "Course Factory" Learning Platform. 
I need you to act as a Senior System Architect. 

**YOUR GOAL:** Analyze my feature request and generate robust, non-conflicting code that is safe for a Single Page Application (SPA).

**OUTPUT FORMAT:**
Return ONLY valid JSON. No markdown. Single-line strings.
\`\`\`json
{
  "id": "view-[descriptive-name]",
  "html": "...",
  "script": "..."
}
\`\`\`

**SYSTEM CONTEXT:**
- **Framework:** HTML5 + Vanilla JS + Tailwind CSS (CDN).
- **Theme:** Dark Mode (Bg: \`bg-slate-950\`, Text: \`text-slate-200\`).
- **Wrapper Logic:** Your code is injected into a parent container that handles visibility. **NEVER use \`hidden\` or \`display:none\` on your root HTML element.**

**SAFETY PROTOCOLS (CRITICAL):**
1. **Namespace Security:** All variables and function names MUST use a unique prefix based on the feature name (e.g., \`featCalc_calculate\`, \`featTimer_start\`). Do not use generic names like \`count\` or \`calcValue\`.
2. **Variable Scope Safety:** Use \`var\` (NOT \`const\` or \`let\`) for any state variables that need to be accessed by inline onclick handlers. This ensures they are accessible from the global scope. Example: \`var featCalc_state = {};\` instead of \`const featCalc_state = {};\`.
3. **Window Attachment (CRITICAL):** After defining each function, you MUST explicitly attach it to the window object for Google Sites compatibility. Example:
   \`\`\`javascript
   function featCalc_calculate() { ... }
   window.featCalc_calculate = featCalc_calculate;
   \`\`\`
   This ensures inline onclick handlers can find the function in sandboxed environments.
4. **No Zombie Listeners:** Prefer inline attributes (e.g., \`onclick="featCalc_handle()"\`) over \`window.addEventListener\`.
5. **Visibility Safety:** The HTML string must be visible by default. Do not add \`hidden\` classes to the outer-most div.
6. **Close Logic:** If building a tool, the close button should trigger \`toggleTool('tool-id')\` (where 'tool-id' matches your div id, e.g. 'tool-calculator').
7. **Initialization Block (REQUIRED):** At the END of your script, you MUST add initialization code to force execution in sandboxed environments (like Google Sites). This ensures all functions are registered before user interaction. Minimum requirement:
   \`\`\`javascript
   // Force script execution
   if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', function() {
           console.log('[feature-name] loaded');
       });
   } else {
       console.log('[feature-name] loaded');
   }
   \`\`\`
   If your code has state to restore from localStorage, call your populate/init function here instead.

**LOGIC ROUTER (How to build this):**

**CASE A: Standard Tool (Calculator, Timer, Notes)**
- Build a fixed position Card UI (\`fixed bottom-4 right-4 z-50 bg-slate-800\`).
- Ensure the UI is visible immediately (no \`hidden\` class).
- Use \`localStorage\` for saving data.

**CASE B: System Integrator (Theme Switcher, Progress Bar)**
- To read data, scan DOM via \`document.querySelectorAll\`.

**CASE C: Visual Overlay (Modal, Popup)**
- Use \`fixed inset-0 z-[100]\` to sit on top of the Sidebar.

**CASE D: External Libraries (Charts, PDF)**
- Inject the required CDN script tag inside the HTML string.

**MY REQUEST:**
${aiDescription}
`;

                                    setGeneratedPrompt(safePrompt);
                                }}
                                disabled={!aiDescription.trim()}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} /> Generate Full Prompt
                            </button>
                        </div>

                        {generatedPrompt && (
                            <div className="mt-4 pt-4 border-t border-emerald-800">
                                <CodeBlock label="Copy this prompt to Google AI Studio" code={generatedPrompt} height="h-64" />
                                <div className="mt-2 p-3 bg-sky-900/20 border border-sky-700/50 rounded text-xs text-sky-200">
                                    <strong>Next:</strong> Copy the prompt above, paste it into Google AI Studio, and copy the JSON response back to Step 2 below.
                                </div>
                            </div>
                        )}
                     </div>

                     {/* STEP 2: JSON PARSER */}
                     <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                            <FileJson size={16} /> Step 2: Import AI Studio Output
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Paste the JSON response from Google AI Studio here. We'll validate and parse it.
                        </p>
                        <div className="space-y-3">
                            <textarea 
                                value={aiOutput}
                                onChange={(e) => {
                                    setAiOutput(e.target.value);
                                    setAiParseError(null);
                                    setParsedAiModule(null);
                                }}
                                placeholder='Paste JSON here: { "id": "view-example", "html": "...", "script": "..." }'
                                className="w-full bg-slate-950 border border-blue-900 rounded-lg p-3 text-xs text-blue-100 font-mono h-48 focus:border-blue-500 outline-none resize-y"
                            />
                            
                            {aiParseError && (
                                <div className="p-3 bg-rose-900/30 border border-rose-600 rounded text-xs text-rose-200">
                                    <strong>Parse Error:</strong> {aiParseError}
                                </div>
                            )}

                            {parsedAiModule && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-emerald-900/20 border border-emerald-700 rounded space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-emerald-300">
                                            <CheckCircle size={14} /> <strong>Valid JSON detected</strong>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            ID: <span className="font-mono text-emerald-400">{parsedAiModule.id}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            HTML length: <span className="text-white">{parsedAiModule.html?.length || 0}</span> chars
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Script: <span className="text-white">{parsedAiModule.script ? 'Present' : 'None'}</span>
                                        </div>
                                    </div>
                                    
                                <input 
                                    type="text" 
                                    value={stagingTitle} 
                                    onChange={(e) => setStagingTitle(e.target.value)} 
                                        placeholder="Module title for sidebar (e.g., Goal Setting Activity)"
                                        className="w-full bg-slate-950 border border-blue-700 rounded-lg p-3 text-white text-sm"
                                    />
                                </div>
                            )}

                                <button 
                                    onClick={() => {
                                    try {
                                        const trimmed = aiOutput.trim();
                                        // Try to extract JSON from markdown code blocks if present
                                        let jsonStr = trimmed;
                                        if (trimmed.includes('```json')) {
                                            const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
                                            if (match) jsonStr = match[1];
                                        } else if (trimmed.includes('```')) {
                                            const match = trimmed.match(/```\s*([\s\S]*?)\s*```/);
                                            if (match) jsonStr = match[1];
                                        }
                                        
                                        const parsed = JSON.parse(jsonStr);
                                        
                                        // Validate required fields
                                        if (!parsed.id) throw new Error('Missing "id" field');
                                        if (!parsed.html) throw new Error('Missing "html" field');
                                        
                                        setParsedAiModule(parsed);
                                        setAiParseError(null);
                                        setStagingJson(JSON.stringify(parsed, null, 2));
                                    } catch (e) {
                                        setAiParseError(e.message);
                                        setParsedAiModule(null);
                                    }
                                }}
                                disabled={!aiOutput.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FileJson size={14} /> Parse & Validate JSON
                                </button>
                            </div>
                     </div>

                     {/* STEP 3: COMMIT */}
                     {parsedAiModule && stagingTitle && (
                         <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle size={16} /> Step 3: Preview & Commit
                            </h3>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        handleSessionSave(stagingJson);
                                        // Reset AI Studio state after commit
                                        setAiDescription("");
                                        setGeneratedPrompt("");
                                        setAiOutput("");
                                        setParsedAiModule(null);
                                        setStagingTitle("");
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg"
                                >
                                    <Zap size={16} /> Add to Project
                                </button>
                            </div>
                            {saveStatus === 'success' && (
                                <div className="mt-3 text-xs text-emerald-400 font-bold animate-in fade-in zoom-in flex items-center gap-2 justify-center bg-emerald-900/20 p-2 rounded border border-emerald-800">
                                    <CheckCircle size={14} /> 
                                    Module added! Check Phase 2 to preview or Phase 4 to compile.
                        </div>
                    )}
                 </div>
                     )}
             </div>
        )}

        </>
      </div>
      
      {/* VAULT BROWSER MODAL */}
      {isVaultOpen && (
        <VaultBrowser 
            mode={
              vaultTargetField &&
              typeof vaultTargetField === 'object' &&
              vaultTargetField.target === 'composer-resource-folder-import'
                ? 'folder'
                : 'file'
            }
            onSelect={handleVaultSelect} 
            onClose={() => { setIsVaultOpen(false); setVaultTargetField(null); }} 
        />
      )}
    </div>
  );
};

export default Phase1;
