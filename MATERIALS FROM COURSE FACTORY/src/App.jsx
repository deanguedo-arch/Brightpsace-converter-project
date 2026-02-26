import * as React from 'react';
import { Terminal, BookOpen, Layers, Copy, Check, FileJson, Settings, Scissors, Sparkles, RefreshCw, Search, Clipboard, Upload, Save, Database, Trash2, LayoutTemplate, PenTool, Plus, FolderOpen, Download, AlertTriangle, AlertOctagon, ShieldCheck, FileCode, Lock, Unlock, Box, ArrowUpCircle, ArrowRight, Zap, CheckCircle, Package, Link as LinkIcon, ToggleLeft, ToggleRight, Eye, EyeOff, ChevronUp, ChevronDown, X, Edit, Clock, RotateCcw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import {
  buildSiteHtml,
  generateMasterShell,
  buildModuleFrameHTML,
  buildPreviewStorageScope,
  validateProject,
  validateModule,
  cleanModuleHTML,
  cleanModuleScript,
  extractModuleContent,
  getModuleType,
  getFontFamilyGlobal,
  getAccentColor,
  escapeHtml,
  validateUrl,
  getMaterialBadgeLabel,
  buildBetaManifest as buildBetaManifestGen,
  generateHubPageBeta as generateHubPageBetaGen,
  generateModuleHtmlBeta as generateModuleHtmlBetaGen,
  buildStaticFilesBeta as buildStaticFilesBetaGen,
} from './utils/generators.js';
import { compileModuleToHtml } from './utils/compiler.js';
import { checkModuleDependencies } from './utils/dependencies.js';
import { useToast, ToastContainer, CodeBlock, Toggle } from './components/Shared.jsx';
// Shared UI (useToast/ToastContainer/CodeBlock/Toggle) moved to src/components/Shared.jsx
import { PROJECT_DATA, MASTER_SHELL } from './data/constants.js';
import { useProjectPersistence } from './hooks/useProjectPersistence.js';
import { useAppError } from './hooks/useAppError.js';
import { usePreviewState } from './hooks/usePreviewState.js';
import { useModuleEditor } from './hooks/useModuleEditor.js';
import Phase5 from './components/Phase5.jsx';
import Phase4 from './components/Phase4.jsx';
import Phase3 from './components/Phase3.jsx';
import Phase2 from './components/Phase2.jsx';
import Phase1 from './components/Phase1.jsx';
import Phase0 from './components/Phase0.jsx';
import ErrorDisplay from './components/ErrorDisplay.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import Section from './components/Section.jsx';
import PreviewModal from './components/modals/PreviewModal.jsx';
import EditModal from './components/modals/EditModal.jsx';

const { useState, useEffect, useRef } = React;

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
// (moved to src/components/Shared.jsx)

// ==========================================
// FIREBASE CONFIG & INIT (DISABLED LOCALLY)
// ==========================================
// const firebaseConfig = JSON.parse(__firebase_config);
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
const appId = 'course-factory-v1';

const FUNCTIONAL_VISUAL_DEFAULTS = {
  accentColor: 'sky',
  backgroundColor: 'slate-900',
  headingTextColor: 'white',
  secondaryTextColor: 'slate-400',
  assessmentTextColor: 'white',
  assessmentBoxColor: 'slate-900',
  defaultMaterialTheme: 'dark',
  buttonColor: 'sky-600',
  containerColor: 'slate-900/80',
  fontFamily: 'inter',
};

// ==========================================
// PROJECT DATA (THE LIVING LIBRARY)
// ==========================================


// PROJECT_DATA and MASTER_SHELL moved to src/data/constants.js

// Shared UI moved to src/components/Shared.jsx

// ==========================================
// MODULE UTILITY FUNCTIONS (Unified)
// ==========================================

/**
 * Get module type: 'standalone', 'external', or 'legacy'
 */

// --- Phases ---


// Phase 0 extracted to src/components/Phase0.jsx



// Phase 1 extracted to src/components/Phase1.jsx



// Phase 2 extracted to src/components/Phase2.jsx



// Phase 3 extracted to src/components/Phase3.jsx


// Pure function to build site HTML - used by both Phase 2 preview and Phase 4 compile


// Phase 4 extracted to src/components/Phase4.jsx



// Phase 5 extracted to src/components/Phase5.jsx


// --- UNIFIED ERROR DISPLAY COMPONENT ---

// ErrorDisplay extracted to src/components/ErrorDisplay.jsx


// --- DEPENDENCY TRACKING UTILITY ---
// checkModuleDependencies moved to src/utils/dependencies.js

// --- CONFIRMATION MODAL HELPER (Enhanced with Dependencies) ---

// ConfirmationModal extracted to src/components/ConfirmationModal.jsx


export function App() {
  const [activePhase, setActivePhase] = useState(0);
  // Initialize state with PROJECT_DATA constant
  const [projectData, setProjectData] = useState(PROJECT_DATA);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTargetField, setVaultTargetField] = useState(null); // 'view' or 'download'

  // --- AUTO-SAVE STATE ---
  const STORAGE_KEY = 'course_factory_v2_data';
  
  // --- TOAST NOTIFICATIONS ---
  const { toasts, showToast, removeToast } = useToast();

  // --- AUTO-LOAD / AUTO-SAVE ---
  const { isAutoLoaded, lastSaved } = useProjectPersistence({
    projectData,
    setProjectData,
    showToast,
    storageKey: STORAGE_KEY,
  });

  // --- UNIFIED ERROR HANDLING ---
  const { appError, handleError, dismissError } = useAppError({ autoDismissMs: 10000 });

  // (auto-load/auto-save moved to src/hooks/useProjectPersistence.js)

  const [excludedIds, setExcludedIds] = useState([]);
  const {
    previewModule,
    enablePreviewScripts,
    openPreview,
    closePreview,
    resetPreview,
    togglePreviewScripts,
    sandbox: previewSandbox,
    iframeKey: previewIframeKey,
  } = usePreviewState();

  const {
    editingModule,
    setEditingModule,
    editForm,
    setEditForm,
    moduleHistory,
    setModuleHistory,
    openEditModule,
    saveEditModule,
    revertModuleVersion,
  } = useModuleEditor({ projectData, setProjectData });
  
  // Custom Confirmation State to replace window.confirm
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { id, type: 'module' | 'tool', dependencies?: {...} }
  
  // Course Name Rename State
  const [isRenamingCourse, setIsRenamingCourse] = useState(false);
  const [tempCourseName, setTempCourseName] = useState("");

  // Assessment Builder State
  const [assessmentType, setAssessmentType] = useState('quiz');
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: 0 }]);
  const [generatedAssessment, setGeneratedAssessment] = useState("");
  const [printInstructions, setPrintInstructions] = useState("");
  const [editingAssessment, setEditingAssessment] = useState(null);
  
  // Master Assessment System
  const [masterQuestions, setMasterQuestions] = useState([]);
  const [masterAssessmentTitle, setMasterAssessmentTitle] = useState("");
  const [currentQuestionType, setCurrentQuestionType] = useState('multiple-choice');
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Note: Preview scripts execute inside the iframe, not in the parent window
  // The iframe's srcDoc includes the script, so it runs in the iframe's scope

  const currentCourse = projectData["Current Course"] || { name: "Error", modules: [] };
  const previewStorageScope = React.useMemo(
    () => buildPreviewStorageScope('phase2-preview', previewModule?.id || previewModule?.title || 'module'),
    [previewModule?.id, previewModule?.title],
  );
  const previewSrcDoc = React.useMemo(() => {
    if (!previewModule) return '';
    const courseModules = projectData["Current Course"]?.modules || [];
    const isCourseModule = courseModules.some((m) => m.id === previewModule.id);
    if (isCourseModule) {
      return (
        compileModuleToHtml({
          projectData,
          moduleId: previewModule.id,
          renderSettings: { __storageScope: previewStorageScope },
        }) || ''
      );
    }
    // Keep fallback behavior for non-course items like toolkit previews.
    return (
      buildModuleFrameHTML(previewModule, {
        ...(projectData['Course Settings'] || {}),
        __storageScope: previewStorageScope,
      }) || ''
    );
  }, [previewModule, previewStorageScope, projectData]);

  // Rename Course Function
  const renameCourse = (newName) => {
    if (!newName || newName.trim() === "") {
      alert("Course name cannot be empty");
      return;
    }
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        name: newName
      }
    });
    setIsRenamingCourse(false);
  };

  const toggleModuleExclusion = (moduleId) => {
    setExcludedIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Toggle module hidden state
  const toggleModuleHidden = (moduleId) => {
    const modules = projectData["Current Course"]?.modules || [];
    const module = modules.find(m => m.id === moduleId);
    const newHiddenState = !(module?.hidden || false);
    
    const updated = modules.map(m => 
      m.id === moduleId ? { ...m, hidden: newHiddenState } : m
    );
    
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        modules: updated
      }
    });
    
    // Sync with Phase 4 excludedIds
    if (newHiddenState) {
      setExcludedIds(prev => prev.includes(moduleId) ? prev : [...prev, moduleId]);
    } else {
      setExcludedIds(prev => prev.filter(id => id !== moduleId));
    }
  };

  // Check if module is protected (Course Materials or Assessments)
  const isProtectedModule = (item) => {
    let itemCode = item.code || {};
    if (typeof itemCode === 'string') {
      try { itemCode = JSON.parse(itemCode); } catch(e) {}
    }
    return itemCode.id === 'view-materials' || 
           item.id === 'item-assessments' || 
           item.title === 'Assessments';
  };

  const deleteModule = (item) => {
    // Prevent deletion of protected modules
    if (isProtectedModule(item)) {
      alert('Warning: Course Materials and Assessments are core modules and cannot be deleted.\n\nYou can hide them instead using the hide/show toggle in Phase 2.');
      return;
    }
    
    // Determine if this is a module or a toolkit feature
    const isToolkitItem = projectData["Global Toolkit"]?.some(t => t.id === item.id);
    
    // Check dependencies for modules
    let dependencies = null;
    if (!isToolkitItem) {
      dependencies = checkModuleDependencies(item.id, projectData);
    }
    
    setDeleteConfirmation({ 
      id: item.id, 
      type: isToolkitItem ? 'tool' : 'module',
      dependencies: dependencies
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === 'module') {
      // Safety check: prevent deletion of protected modules
      const moduleToDelete = projectData["Current Course"]?.modules?.find(m => m.id === deleteConfirmation.id);
      if (moduleToDelete && isProtectedModule(moduleToDelete)) {
        alert('Warning: Course Materials and Assessments are core modules and cannot be deleted.');
        setDeleteConfirmation(null);
        return;
      }
      
      let items = projectData["Current Course"]?.modules || [];
      items = items.filter(m => m.id !== deleteConfirmation.id);
    setProjectData({
      ...projectData,
        "Current Course": {
          ...projectData["Current Course"],
          modules: items
        }
      });
    } else if (deleteConfirmation.type === 'tool') {
      let tools = projectData["Global Toolkit"] || [];
      tools = tools.filter(t => t.id !== deleteConfirmation.id);
      setProjectData({
        ...projectData,
        "Global Toolkit": tools
      });
    }
    
    setDeleteConfirmation(null);
  };

  // MATERIALS MANAGEMENT FUNCTIONS
  const getMaterialsModule = () => {
    const currentCourse = projectData["Current Course"] || { modules: [] };
    return currentCourse.modules.find(m => {
      let itemCode = m.code || {};
      if (typeof itemCode === 'string') {
        try { itemCode = JSON.parse(itemCode); } catch(e) {}
      }
      return itemCode.id === "view-materials";
    });
  };

  // ASSESSMENTS MANAGEMENT FUNCTIONS
  const getAssessmentsModule = () => {
    return currentCourse.modules.find(m => m.id === "item-assessments" || m.title === "Assessments");
  };

  const updateMaterialsModule = (updatedMaterials) => {
    const moduleIndex = currentCourse.modules.findIndex(m => {
      let itemCode = m.code || {};
      if (typeof itemCode === 'string') {
        try { itemCode = JSON.parse(itemCode); } catch(e) {}
      }
      return itemCode.id === "view-materials";
    });
    if (moduleIndex === -1) return;
    
    const newModules = [...currentCourse.modules];
    newModules[moduleIndex] = {
      ...newModules[moduleIndex],
      materials: updatedMaterials
    };
    
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        modules: newModules
      }
    });
  };

  function updateAssessmentsModule(updatedAssessments) {
    const moduleIndex = currentCourse.modules.findIndex(m => m.id === "item-assessments" || m.title === "Assessments");
    if (moduleIndex === -1) return;
    
    const newModules = [...currentCourse.modules];
    newModules[moduleIndex] = {
      ...newModules[moduleIndex],
      assessments: updatedAssessments
    };
    
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        modules: newModules
      }
    });
  }

  const applyVisualDefaults = () => {
    const currentCourseState = projectData["Current Course"] || {};
    const currentSettings = projectData["Course Settings"] || {};
    const currentMaterials = currentCourseState.materials || [];
    const currentModules = currentCourseState.modules || [];

    const materialsChanged = currentMaterials.some((mat) => mat.themeOverride);
    const clearedMaterials = currentMaterials.map((mat) =>
      mat.themeOverride ? { ...mat, themeOverride: null } : mat,
    );

    let assessmentsChanged = false;
    const updatedModules = currentModules.map((module) => {
      if (!(module.id === "item-assessments" || module.title === "Assessments")) return module;
      const assessments = module.assessments || [];
      const clearedAssessments = assessments.map((assessment) => {
        const hasOverride = Boolean(assessment.textColorOverride || assessment.boxColorOverride);
        if (hasOverride) assessmentsChanged = true;
        return hasOverride
          ? {
              ...assessment,
              textColorOverride: null,
              boxColorOverride: null,
            }
          : assessment;
      });
      return {
        ...module,
        assessments: clearedAssessments,
      };
    });

    const settingsChanged = Object.entries(FUNCTIONAL_VISUAL_DEFAULTS).some(([key, value]) => currentSettings[key] !== value);

    if (!materialsChanged && !assessmentsChanged && !settingsChanged) {
      showToast('Visuals already use the functional defaults.', 'info');
      return;
    }

    setProjectData((prev) => ({
      ...prev,
      "Course Settings": {
        ...(prev["Course Settings"] || {}),
        ...FUNCTIONAL_VISUAL_DEFAULTS,
      },
      "Current Course": {
        ...(prev["Current Course"] || {}),
        materials: clearedMaterials,
        modules: updatedModules,
      },
    }));

    showToast('Functional visual defaults applied. Material and assessment overrides were cleared.', 'success');
  };

  const addMaterial = (materialData) => {
    const currentMaterials = projectData["Current Course"]?.materials || [];
    const newMaterial = {
      id: `mat-${Date.now()}`,
      number: materialData.number,
      mediaType: materialData.mediaType || 'number',
      title: materialData.title,
      description: materialData.description,
      viewUrl: materialData.viewUrl,
      downloadUrl: materialData.downloadUrl,
      color: materialData.color || 'slate',
      themeOverride: materialData.themeOverride || null,
      hidden: false,
      order: currentMaterials.length,
      assignedModules: materialData.assignedModules || [],
      digitalContent: materialData.digitalContent || null
    };
    
      setProjectData({
        ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        materials: [...currentMaterials, newMaterial]
      }
    });
  };

  const editMaterial = (materialId, updates) => {
    const currentMaterials = projectData["Current Course"]?.materials || [];
    const updated = currentMaterials.map(m => 
      m.id === materialId ? { ...m, ...updates } : m
    );
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        materials: updated
      }
    });
  };

  const deleteMaterial = (materialId) => {
    const currentMaterials = projectData["Current Course"]?.materials || [];
    const updated = currentMaterials.filter(m => m.id !== materialId);
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        materials: updated
      }
    });
  };

  const moveMaterial = (materialId, direction) => {
    const currentMaterials = projectData["Current Course"]?.materials || [];
    const index = currentMaterials.findIndex(m => m.id === materialId);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentMaterials.length) return;
    
    const reordered = [...currentMaterials];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    
    // Update order values
    reordered.forEach((mat, idx) => {
      mat.order = idx;
    });
    
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        materials: reordered
      }
    });
  };

  const toggleMaterialHidden = (materialId) => {
    const currentMaterials = projectData["Current Course"]?.materials || [];
    const updated = currentMaterials.map(m => 
      m.id === materialId ? { ...m, hidden: !m.hidden } : m
    );
    setProjectData({
      ...projectData,
      "Current Course": {
        ...projectData["Current Course"],
        materials: updated
      }
    });
  };

  const handleVaultSelect = (file) => {
    if (vaultTargetField === 'view') {
        setMaterialForm(prev => ({ ...prev, viewUrl: file.path }));
    } else if (vaultTargetField === 'download') {
        setMaterialForm(prev => ({ ...prev, downloadUrl: file.path }));
    }
    setIsVaultOpen(false);
    setVaultTargetField(null);
  };

  const addAssessment = (assessment) => {
    const assessmentsModule = getAssessmentsModule();
    const assessments = assessmentsModule?.assessments || [];
    const newAssessment = {
      ...assessment,
      id: `assess_${Date.now()}`,
      order: assessments.length,
      hidden: false
    };
    const updated = [...assessments, newAssessment];
    updateAssessmentsModule(updated);
  };

  const editAssessment = (assessmentId, updates) => {
    const assessmentsModule = getAssessmentsModule();
    const assessments = assessmentsModule?.assessments || [];
    const updated = assessments.map(a => 
      a.id === assessmentId ? { ...a, ...updates } : a
    );
    updateAssessmentsModule(updated);
  };

  const deleteAssessment = (assessmentId) => {
    const assessmentsModule = getAssessmentsModule();
    const assessments = assessmentsModule?.assessments || [];
    const updated = assessments.filter(a => a.id !== assessmentId);
    updateAssessmentsModule(updated);
  };

  const moveAssessment = (assessmentId, direction) => {
    const assessmentsModule = getAssessmentsModule();
    const assessments = assessmentsModule?.assessments || [];
    const index = assessments.findIndex(a => a.id === assessmentId);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assessments.length) return;
    
    const reordered = [...assessments];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    
    // Update order values
    reordered.forEach((assess, idx) => {
      assess.order = idx;
    });
    
    updateAssessmentsModule(reordered);
  };

  const toggleAssessmentHidden = (assessmentId) => {
    const assessmentsModule = getAssessmentsModule();
    const assessments = assessmentsModule?.assessments || [];
    const updated = assessments.map(a => 
      a.id === assessmentId ? { ...a, hidden: !a.hidden } : a
    );
    updateAssessmentsModule(updated);
  };

  // MASTER ASSESSMENT FUNCTIONS
  const generateQuestionId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const buildMasterQuestion = (payload, fallbackType = 'multiple-choice') => {
    const questionType = payload.type || fallbackType;
    return {
      id: payload.id || generateQuestionId(),
      question: payload.question || '',
      options: payload.options?.slice() || ['', '', '', ''],
      correct: typeof payload.correct === 'number' ? payload.correct : 0,
      type: questionType,
      order: typeof payload.order === 'number' ? payload.order : 0
    };
  };

  const addQuestionToMaster = (questionData = null) => {
    const payload = questionData || { ...currentQuestion, type: currentQuestionType };
    setMasterQuestions(prev => {
      const existingIndex = prev.findIndex(q => q.id === payload.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        const preservedOrder = updated[existingIndex]?.order ?? existingIndex;
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...buildMasterQuestion(payload, currentQuestionType),
          order: preservedOrder
        };
        return updated;
      }
      const newQuestion = {
        ...buildMasterQuestion(payload, currentQuestionType),
        order: prev.length
      };
      return [...prev, newQuestion];
    });

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct: 0
    });
  };

  const moveQuestion = (questionId, direction) => {
    setMasterQuestions(prev => {
      const index = prev.findIndex(q => q.id === questionId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const reordered = [...prev];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered.map((q, idx) => ({ ...q, order: idx }));
    });
  };

  const deleteQuestion = (questionId) => {
    setMasterQuestions(prev => {
      const filtered = prev.filter(q => q.id !== questionId);
      return filtered.map((q, idx) => ({ ...q, order: idx }));
    });
  };

  const updateQuestion = (questionId, updates) => {
    setMasterQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
  };

  const clearMasterAssessment = () => {
    setMasterQuestions([]);
    setMasterAssessmentTitle("");
    setCurrentQuestion({ question: '', options: ['', '', '', ''], correct: 0 });
    setEditingQuestion(null);
  };

  const generateMixedAssessment = () => {
    if (!masterAssessmentTitle || masterQuestions.length === 0) {
      alert('Please add a title and at least one question to the Master Assessment.');
      return;
    }

    const assessmentId = `mixed_${Date.now()}`;
    
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
    
    // Helper function to determine question type consistently
    const getQuestionType = (q) => {
      if (q.type) return q.type;
      // Fallback: if options array has content, it's multiple-choice
      return (q.options && q.options.length > 0 && q.options.some(opt => opt && opt.trim())) 
        ? 'multiple-choice' 
        : 'long-answer';
    };
    
    const mcQuestions = masterQuestions.filter(q => getQuestionType(q) === 'multiple-choice');
    const laQuestions = masterQuestions.filter(q => getQuestionType(q) === 'long-answer');
    
    // Build HTML for all questions
    let questionsHtml = '';
    let questionIndex = 0;
    let mcIndex = 0;
    let laIndex = 0;

    masterQuestions.forEach((q, idx) => {
      const isMC = getQuestionType(q) === 'multiple-choice';
      const qNum = idx + 1;

      if (isMC && q.options && q.options.length > 0) {
        // Multiple Choice Question
        questionsHtml += `
          <div class="mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass}">
            <h3 class="text-lg font-bold ${headingTextClass} mb-4">${qNum}. ${q.question || 'Untitled Question'}</h3>
            <div class="space-y-2">
              ${q.options.map((opt, optIdx) => `
                <label class="flex items-center gap-3 p-3 ${optionBgClass} rounded-lg cursor-pointer ${optionHoverClass} transition-colors">
                  <input type="radio" name="q${idx}" value="${optIdx}" class="w-4 h-4 assessment-input" />
                  <span class="${bodyTextClass}">${opt || ''}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
        mcIndex++;
      } else {
        // Long Answer Question
        questionsHtml += `
          <div class="mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass} print-section">
            <h3 class="text-lg font-bold ${headingTextClass} mb-4 print-question">${qNum}. ${q.question || 'Untitled Question'}</h3>
            <textarea 
              id="${assessmentId}-answer-${laIndex}" 
              placeholder="Type your answer here..."
              class="w-full h-48 ${inputBgClass} border ${cardBorderClass} rounded-lg p-4 ${inputTextClass} resize-none focus:border-${accentColor}-500 focus:outline-none print-response assessment-input"
            ></textarea>
            <p class="text-xs ${secondaryTextClass} italic mt-2 no-print">Auto-saved to browser</p>
          </div>
        `;
        laIndex++;
      }
      questionIndex++;
    });

    const html = `<div id="${assessmentId}" class="w-full h-full custom-scroll p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-black ${headingTextClass} italic mb-2 print-title">${masterAssessmentTitle}</h1>
          <p class="text-sm ${secondaryTextClass} no-print">
            ${mcQuestions.length > 0 && laQuestions.length > 0 
              ? `Complete ${mcQuestions.length} multiple-choice and ${laQuestions.length} long-answer questions.`
              : mcQuestions.length > 0 
                ? `Select the best answer for each of ${mcQuestions.length} questions.`
                : `Complete all ${laQuestions.length} questions. Your responses are auto-saved.`
            }
          </p>
        </header>
        
        ${laQuestions.length > 0 ? `
          <!-- Student Info (only for long-answer assessments) -->
          <div class="grid grid-cols-2 gap-4 mb-8 p-6 ${cardBgClass} rounded-xl border ${cardBorderClass} print-header no-print">
            <div>
              <label class="block text-xs font-bold ${secondaryTextClass} uppercase mb-2">Student Name</label>
              <input 
                type="text" 
                id="${assessmentId}-student-name"
                placeholder="Enter your name..."
                class="w-full ${inputBgClass} border ${cardBorderClass} rounded p-3 ${inputTextClass} text-sm focus:border-${accentColor}-500 focus:outline-none assessment-input"
              />
            </div>
            <div>
              <label class="block text-xs font-bold ${secondaryTextClass} uppercase mb-2">Date</label>
              <input 
                type="date" 
                id="${assessmentId}-student-date"
                class="w-full ${inputBgClass} border ${cardBorderClass} rounded p-3 ${inputTextClass} text-sm focus:border-${accentColor}-500 focus:outline-none assessment-input"
              />
            </div>
          </div>
        ` : ''}

        <!-- Questions -->
        <form id="${assessmentId}-form" class="space-y-6">
          ${questionsHtml}
        </form>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mt-8 no-print">
          <button type="button" onclick="${assessmentId}_reset()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Reset
          </button>
          ${laQuestions.length > 0 ? `
          <button type="button" onclick="${assessmentId}_download()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Download Backup
          </button>
          <button type="button" onclick="document.getElementById('${assessmentId}-upload').click()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Upload Backup
          </button>
          ` : ''}
          <button type="button" onclick="${assessmentId}_generateReport()" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-3 px-6 rounded-lg flex items-center gap-2">
            Print & Submit
          </button>
        </div>
        
        ${laQuestions.length > 0 ? `
        <input type="file" id="${assessmentId}-upload" accept=".json" style="display: none;" onchange="${assessmentId}_loadBackup(this)" />
        <div id="${assessmentId}-loaded" class="hidden mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500">
          <p class="text-blue-400 font-bold">Backup loaded successfully!</p>
        </div>
        ` : ''}

        <!-- Reset Confirmation Modal -->
        <div id="${assessmentId}-reset-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center hidden">
          <div class="${modalBgClass} border ${modalBorderClass} rounded-xl p-6 max-w-md mx-4">
            <h3 class="text-lg font-bold ${headingTextClass} mb-4">Reset Assessment?</h3>
            <p class="${bodyTextClass} mb-6">Are you sure you want to reset all your answers? This cannot be undone.</p>
            <div class="flex gap-3">
              <button onclick="document.getElementById('${assessmentId}-reset-modal').classList.add('hidden')" class="flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold py-2 rounded">Cancel</button>
              <button onclick="${assessmentId}_confirmReset()" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded">Reset</button>
            </div>
          </div>
        </div>

        <!-- Print Instructions -->
        <div class="mt-8 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg no-print">
          <p class="text-amber-300 text-sm">
            <strong>Instructions:</strong> Complete all questions, then click "Print & Submit" to generate a clean printable report.
          </p>
        </div>

        <!-- Print Styles -->
        <style>
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-title { color: black !important; font-size: 24pt; text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px; }
            .print-header { background: white !important; border: 2px solid black !important; margin-bottom: 20px; }
            .print-header label { color: black !important; }
            .print-header input { border: none !important; border-bottom: 1px solid black !important; background: white !important; color: black !important; }
            .print-section { page-break-inside: avoid; background: white !important; border: 1px solid #ccc !important; margin-bottom: 20px; }
            .print-question { color: black !important; border-bottom: 2px solid #666; padding-bottom: 5px; }
            .print-response { background: white !important; color: black !important; border: 1px solid #999 !important; min-height: 200px; font-family: Arial, sans-serif; }
          }
        </style>
      </div>
    </div>`;

    // Build script
    let script = '';
    
    // Core Assessment Functions
    script += `
      // Reset function - shows confirmation modal
      function ${assessmentId}_reset() {
        var modal = document.getElementById('${assessmentId}-reset-modal');
        if (modal) modal.classList.remove('hidden');
      }
      
      // Confirm Reset - actually performs the reset
      function ${assessmentId}_confirmReset() {
        document.getElementById('${assessmentId}-reset-modal').classList.add('hidden');
        var form = document.getElementById('${assessmentId}-form');
        if (form) form.reset();
        
        // Clear localStorage for this assessment
        try {
          localStorage.removeItem('${assessmentId}-student-name');
          localStorage.removeItem('${assessmentId}-student-date');
          var container = document.getElementById('${assessmentId}');
          if (container) {
            container.querySelectorAll('textarea, input').forEach(function(el) {
              if (el.id) localStorage.removeItem(el.id);
            });
          }
        } catch(e) {}
      }
      
      // Generate Report - creates a clean printable page in new window
      function ${assessmentId}_generateReport() {
        var container = document.getElementById('${assessmentId}');
        if (!container) { alert('Assessment not found'); return; }
        
        // Gather all data
        var studentName = document.getElementById('${assessmentId}-student-name')?.value || 'Not Provided';
        var studentDate = document.getElementById('${assessmentId}-student-date')?.value || new Date().toLocaleDateString();
        
        // Build questions HTML
        var questionsHTML = '';
        var questions = container.querySelectorAll('[class*="print-section"], [class*="mb-8 p-6"]');
        var qNum = 1;
        
        questions.forEach(function(q) {
          var questionText = q.querySelector('h3')?.textContent || 'Question ' + qNum;
          var textarea = q.querySelector('textarea');
          var answer = textarea ? textarea.value : '';
          
          // Check for radio buttons (MC questions)
          var selectedRadio = q.querySelector('input[type="radio"]:checked');
          if (selectedRadio) {
            var label = selectedRadio.closest('label');
            answer = label ? label.textContent.trim() : 'Selected: Option ' + (parseInt(selectedRadio.value) + 1);
          }
          
          if (questionText.trim()) {
            questionsHTML += '<div style="margin-bottom:25px; border-left:4px solid #333; padding-left:15px;">' +
              '<h3 style="font-size:14px; font-weight:bold; margin-bottom:10px; color:#333;">' + questionText + '</h3>' +
              '<div style="background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid #ddd; min-height:60px; white-space:pre-wrap; font-size:13px;">' + 
              (answer || '<em style="color:#999;">No answer provided</em>') + 
              '</div></div>';
            qNum++;
          }
        });
        
        // Build the print HTML
        var printHTML = '<!DOCTYPE html><html><head><title>${masterAssessmentTitle} - Submission</title>' +
          '<style>' +
          'body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: white; line-height: 1.5; max-width: 800px; margin: 0 auto; }' +
          '.header { border-bottom: 4px solid #333; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }' +
          '.header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin: 0; }' +
          '.student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }' +
          '.student-info div { font-size: 14px; }' +
          '.student-info strong { display: block; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; }' +
          '</style></head><body>' +
          '<div class="header">' +
          '<div><h1>${masterAssessmentTitle}</h1><p style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#666; margin-top:5px;">Assessment Submission</p></div>' +
          '</div>' +
          '<div class="student-info">' +
          '<div><strong>Student Name</strong>' + studentName + '</div>' +
          '<div><strong>Date</strong>' + studentDate + '</div>' +
          '</div>' +
          '<div class="questions">' + questionsHTML + '</div>' +
          '<div style="margin-top:40px; border-top:2px solid #333; padding-top:20px; text-align:center;">' +
          '<p style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#999;">End of Submission</p>' +
          '</div>' +
          '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }<\\/script>' +
          '</body></html>';
        
        var pw = window.open('', '_blank');
        if (pw) {
          pw.document.open();
          pw.document.write(printHTML);
          pw.document.close();
        } else {
          alert('Please allow popups to print.');
        }
      }
    `;

    // Long Answer Auto-Save (if applicable)
    if (laQuestions.length > 0) {
      script += `
      var ${assessmentId}_laCount = ${laQuestions.length};
      
      // Initialize: Load saved data on page load
      window.addEventListener('load', function() {
        ${assessmentId}_loadFromLocalStorage();
      });
      
      // Auto-save on input for all fields
      function ${assessmentId}_setupAutoSave() {
        var nameField = document.getElementById('${assessmentId}-student-name');
        var dateField = document.getElementById('${assessmentId}-student-date');
        if (nameField) {
          nameField.addEventListener('input', function() {
            localStorage.setItem('${assessmentId}-student-name', this.value);
          });
        }
        if (dateField) {
          dateField.addEventListener('input', function() {
            localStorage.setItem('${assessmentId}-student-date', this.value);
          });
        }
        
        for (var i = 0; i < ${assessmentId}_laCount; i++) {
          var textarea = document.getElementById('${assessmentId}-answer-' + i);
          if (textarea) {
            (function(idx) {
              textarea.addEventListener('input', function() {
                localStorage.setItem('${assessmentId}-answer-' + idx, this.value);
              });
            })(i);
          }
        }
      }
      
      // Load from localStorage
      function ${assessmentId}_loadFromLocalStorage() {
        var nameField = document.getElementById('${assessmentId}-student-name');
        var dateField = document.getElementById('${assessmentId}-student-date');
        
        if (nameField) {
          var savedName = localStorage.getItem('${assessmentId}-student-name');
          if (savedName) nameField.value = savedName;
        }
        if (dateField) {
          var savedDate = localStorage.getItem('${assessmentId}-student-date');
          if (savedDate) dateField.value = savedDate;
        }
        
        for (var i = 0; i < ${assessmentId}_laCount; i++) {
          var textarea = document.getElementById('${assessmentId}-answer-' + i);
          if (textarea) {
            var saved = localStorage.getItem('${assessmentId}-answer-' + i);
            if (saved) textarea.value = saved;
          }
        }
        
        ${assessmentId}_setupAutoSave();
      }
      
      // Download Backup
      function ${assessmentId}_download() {
        var data = {
          studentName: document.getElementById('${assessmentId}-student-name')?.value || '',
          studentDate: document.getElementById('${assessmentId}-student-date')?.value || '',
          answers: []
        };
        
        for (var i = 0; i < ${assessmentId}_laCount; i++) {
          var textarea = document.getElementById('${assessmentId}-answer-' + i);
          data.answers.push(textarea ? textarea.value : '');
        }
        
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '${masterAssessmentTitle.replace(/[^a-z0-9]/gi, '_')}_backup.json';
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Load Backup
      function ${assessmentId}_loadBackup(input) {
        var file = input.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result);
            
            var nameField = document.getElementById('${assessmentId}-student-name');
            var dateField = document.getElementById('${assessmentId}-student-date');
            
            if (nameField && data.studentName) {
              nameField.value = data.studentName;
              localStorage.setItem('${assessmentId}-student-name', data.studentName);
            }
            if (dateField && data.studentDate) {
              dateField.value = data.studentDate;
              localStorage.setItem('${assessmentId}-student-date', data.studentDate);
            }
            
            data.answers.forEach(function(answer, i) {
              var textarea = document.getElementById('${assessmentId}-answer-' + i);
              if (textarea) {
                textarea.value = answer;
                localStorage.setItem('${assessmentId}-answer-' + i, answer);
              }
            });
            
            var loadedDiv = document.getElementById('${assessmentId}-loaded');
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
      `;
    }

    const assessment = {
      id: assessmentId,
      title: masterAssessmentTitle,
      type: 'mixed',
      questionCount: masterQuestions.length,
      mcCount: mcQuestions.length,
      laCount: laQuestions.length,
      html: html,
      script: script
    };
    
    setGeneratedAssessment(JSON.stringify(assessment, null, 2));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Settings className="text-blue-400" size={20} />
              Course Factory Dashboard
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-mono">
              LIVING DOC - SAVED {lastSaved ? lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toUpperCase() : '---'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isRenamingCourse ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempCourseName}
                  onChange={(e) => setTempCourseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameCourse(tempCourseName);
                    if (e.key === 'Escape') setIsRenamingCourse(false);
                  }}
                  className="bg-slate-800 border border-blue-500 rounded px-3 py-1 text-sm"
                  placeholder="Course Name"
                  autoFocus
                />
                <button onClick={() => renameCourse(tempCourseName)} className="text-emerald-400 hover:text-emerald-300">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsRenamingCourse(false)} className="text-slate-500 hover:text-slate-400">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempCourseName(currentCourse.name);
                  setIsRenamingCourse(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold flex items-center gap-2 transition-colors"
              >
                PROJECT: {currentCourse.name.toUpperCase()}
                <PenTool size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-[1800px] mx-auto w-full min-w-0">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 min-h-[calc(100vh-73px)] flex flex-col">
          <div className="flex-grow space-y-6">
            {/* FACTORY LINE */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">Factory Line</h3>
              <div className="space-y-1">
            <Section 
              title="Phase 0: Master Shell" 
              icon={Layers} 
              isActive={activePhase === 0} 
              onClick={() => setActivePhase(0)}
            />
            <Section 
              title="Phase 1: Harvest" 
              icon={FileJson} 
              isActive={activePhase === 1} 
              onClick={() => setActivePhase(1)} 
            />
            <Section 
                  title="Phase 2: Preview & Test" 
                  icon={Eye} 
              isActive={activePhase === 2} 
              onClick={() => setActivePhase(2)}
                  badge={currentCourse.modules.length}
                  badgeColor="bg-purple-600"
            />
             <Section 
              title="Phase 3: Manage & Reset" 
              icon={BookOpen} 
              isActive={activePhase === 3} 
              onClick={() => setActivePhase(3)} 
            />
            <Section 
              title="Phase 4: Compile" 
              icon={Package} 
              isActive={activePhase === 4} 
              onClick={() => setActivePhase(4)} 
                />
                <Section 
                  title="Phase 5: Settings" 
                  icon={Settings} 
                  isActive={activePhase === 5} 
                  onClick={() => setActivePhase(5)} 
                />
              </div>
            </div>
            
            {/* IN: CURRENT COURSE */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">
                IN: {(projectData["Course Settings"]?.courseName || currentCourse.name).toUpperCase()}
              </h3>
              <div className="space-y-1">
                {currentCourse.modules.map((mod, idx) => (
                  <div key={mod.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors group">
                    <button
                      onClick={() => toggleModuleHidden(mod.id)}
                      className="p-0.5 hover:text-emerald-400 transition-colors"
                      title={mod.hidden ? "Show module" : "Hide module"}
                    >
                      {mod.hidden ? <EyeOff size={12} className="text-slate-600" /> : <Eye size={12} className="text-emerald-500" />}
                    </button>
                    <span className="text-slate-300 truncate flex-1">{mod.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                        onClick={() => {
                          if (idx === 0) return;
                          const newModules = [...currentCourse.modules];
                          [newModules[idx], newModules[idx - 1]] = [newModules[idx - 1], newModules[idx]];
                          setProjectData({
                            ...projectData,
                            "Current Course": { ...projectData["Current Course"], modules: newModules }
                          });
                        }}
                                                        disabled={idx === 0}
                        className="p-0.5 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                                                    >
                        <ChevronUp size={12} />
                                                    </button>
                                                    <button 
                        onClick={() => {
                          if (idx === currentCourse.modules.length - 1) return;
                          const newModules = [...currentCourse.modules];
                          [newModules[idx], newModules[idx + 1]] = [newModules[idx + 1], newModules[idx]];
                          setProjectData({
                            ...projectData,
                            "Current Course": { ...projectData["Current Course"], modules: newModules }
                          });
                        }}
                                                        disabled={idx === currentCourse.modules.length - 1}
                        className="p-0.5 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                                                    >
                        <ChevronDown size={12} />
                                                    </button>
                                                    <button 
                        onClick={() => deleteModule(mod)}
                        disabled={isProtectedModule(mod)}
                        className={`p-0.5 ${isProtectedModule(mod) ? 'opacity-30 cursor-not-allowed' : 'hover:text-rose-400'}`}
                        title={isProtectedModule(mod) ? 'Core module (cannot be deleted)' : 'Delete'}
                      >
                        <X size={12} />
                                                    </button>
                                                </div>
                            </div>
                ))}
                </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow min-h-[600px] min-w-0 overflow-x-hidden">
          {activePhase === 0 && <Phase0 projectData={projectData} setProjectData={setProjectData} />}
          {activePhase === 1 && <Phase1 
            projectData={projectData} 
            setProjectData={setProjectData} 
            addMaterial={addMaterial} 
            editMaterial={editMaterial} 
            deleteMaterial={deleteMaterial} 
            moveMaterial={moveMaterial} 
            toggleMaterialHidden={toggleMaterialHidden} 
            addAssessment={addAssessment} 
            editAssessment={editAssessment} 
            deleteAssessment={deleteAssessment} 
            moveAssessment={moveAssessment} 
            toggleAssessmentHidden={toggleAssessmentHidden} 
            addQuestionToMaster={addQuestionToMaster} 
            moveQuestion={moveQuestion} 
            deleteQuestion={deleteQuestion} 
            updateQuestion={updateQuestion} 
            clearMasterAssessment={clearMasterAssessment} 
            masterQuestions={masterQuestions} 
            setMasterQuestions={setMasterQuestions} 
            masterAssessmentTitle={masterAssessmentTitle} 
            setMasterAssessmentTitle={setMasterAssessmentTitle} 
            currentQuestionType={currentQuestionType} 
            setCurrentQuestionType={setCurrentQuestionType} 
            currentQuestion={currentQuestion} 
            setCurrentQuestion={setCurrentQuestion} 
            editingQuestion={editingQuestion} 
            setEditingQuestion={setEditingQuestion} 
            generateMixedAssessment={generateMixedAssessment} 
            generatedAssessment={generatedAssessment} 
            setGeneratedAssessment={setGeneratedAssessment} 
            assessmentType={assessmentType} 
            setAssessmentType={setAssessmentType} 
            assessmentTitle={assessmentTitle} 
            setAssessmentTitle={setAssessmentTitle} 
            quizQuestions={quizQuestions} 
            setQuizQuestions={setQuizQuestions} 
            printInstructions={printInstructions} 
            setPrintInstructions={setPrintInstructions} 
            editingAssessment={editingAssessment} 
            setEditingAssessment={setEditingAssessment} 
            isVaultOpen={isVaultOpen}
            setIsVaultOpen={setIsVaultOpen}
            setVaultTargetField={setVaultTargetField}
            vaultTargetField={vaultTargetField}
          />}
          {activePhase === 2 && <Phase2 projectData={projectData} setProjectData={setProjectData} editMaterial={editMaterial} onEdit={openEditModule} onPreview={openPreview} onDelete={deleteModule} deleteMaterial={deleteMaterial} deleteAssessment={deleteAssessment} />}
          {activePhase === 3 && <Phase3 onGoToMaster={() => setActivePhase(0)} projectData={projectData} setProjectData={setProjectData} />}
          {activePhase === 4 && <Phase4 projectData={projectData} setProjectData={setProjectData} excludedIds={excludedIds} toggleModule={toggleModuleExclusion} onToggleHidden={toggleModuleHidden} onError={handleError} />}
          {activePhase === 5 && (
            <Phase5
              projectData={projectData}
              setProjectData={setProjectData}
              applyVisualDefaults={applyVisualDefaults}
            />
          )}
        </main>
      </div>

      {/* UNIFIED ERROR DISPLAY */}
      <ErrorDisplay error={appError} onDismiss={dismissError} />

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!deleteConfirmation}
        message={deleteConfirmation?.type === 'module' ? "This will permanently delete this module and all its content." : "This will permanently delete this toolkit item."}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
        dependencies={deleteConfirmation?.dependencies || null}
      />
      
      {/* EDIT MODAL */}
      <EditModal
        editingModule={editingModule}
        editForm={editForm}
        setEditForm={setEditForm}
        setEditingModule={setEditingModule}
        projectData={projectData}
        saveEditModule={saveEditModule}
        moduleHistory={moduleHistory}
        setModuleHistory={setModuleHistory}
        revertModuleVersion={revertModuleVersion}
      />
      {/* PREVIEW MODAL */}
      <PreviewModal
        previewModule={previewModule}
        enablePreviewScripts={enablePreviewScripts}
        onReset={resetPreview}
        onToggleScripts={togglePreviewScripts}
        onClose={closePreview}
        srcDoc={previewSrcDoc}
        sandbox={previewSandbox}
        iframeKey={previewIframeKey}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
    </div>
  );
}

// Helper Section Component

// Section extracted to src/components/Section.jsx
