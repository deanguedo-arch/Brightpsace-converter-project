import * as React from 'react';
import { AlertTriangle, Database, Download, Eye, Package, RefreshCw, Settings, Sparkles, Terminal, Trash2, Upload } from 'lucide-react';
import { PROJECT_DATA } from '../data/constants.js';

// --- PHASE 5: SETTINGS & PREFERENCES ---
const Phase5 = ({ projectData, setProjectData, applyVisualDefaults }) => {
  const settings = projectData["Course Settings"] || {
    courseName: "Mental Fitness",
    courseCode: "",
    instructor: "",
    academicYear: "",
    accentColor: "sky",
    backgroundColor: "slate-900", // Default dark background
    fontFamily: "inter", // Default font
    customCSS: "",
    templateDefault: "deck",
    themeDefault: "dark_cards",
    compilationDefaults: {
      includeMaterials: true,
      includeAssessments: true,
      includeToolkit: true,
      enableProgressTracking: true,
      enableComposer: false
    },
    exportSettings: {
      filenamePattern: "{courseName}_compiled",
      includeTimestamp: true
    }
  };

  const THEME_PACKS = [
    {
      id: 'functional-dark',
      label: 'Functional Dark',
      description: 'High contrast, clean defaults for building and previewing.',
      updates: {
        accentColor: 'sky',
        backgroundColor: 'slate-950',
        headingTextColor: 'white',
        secondaryTextColor: 'slate-400',
        assessmentTextColor: 'white',
        assessmentBoxColor: 'slate-900',
        containerColor: 'slate-900/80',
        buttonColor: 'sky-600',
        fontFamily: 'inter',
        defaultMaterialTheme: 'dark',
      },
    },
    {
      id: 'clean-light',
      label: 'Clean Light',
      description: 'Light background with dark text for print-like readability.',
      updates: {
        accentColor: 'indigo',
        backgroundColor: 'slate-50',
        headingTextColor: 'slate-900',
        secondaryTextColor: 'slate-600',
        assessmentTextColor: 'slate-900',
        assessmentBoxColor: 'white',
        containerColor: 'white/90',
        buttonColor: 'indigo-600',
        fontFamily: 'montserrat',
        defaultMaterialTheme: 'high-contrast-light',
      },
    },
    {
      id: 'warm-sunset',
      label: 'Warm Sunset',
      description: 'Warm accent and container fills for a more editorial feel.',
      updates: {
        accentColor: 'amber',
        backgroundColor: 'slate-900',
        headingTextColor: 'white',
        secondaryTextColor: 'slate-300',
        assessmentTextColor: 'white',
        assessmentBoxColor: 'slate-900',
        containerColor: 'slate-900/80',
        buttonColor: 'amber-600',
        fontFamily: 'poppins',
        defaultMaterialTheme: 'muted',
      },
    },
    {
      id: 'emerald-focus',
      label: 'Emerald Focus',
      description: 'Calmer accent with strong readability for long content.',
      updates: {
        accentColor: 'emerald',
        backgroundColor: 'zinc-900',
        headingTextColor: 'white',
        secondaryTextColor: 'slate-300',
        assessmentTextColor: 'white',
        assessmentBoxColor: 'slate-900',
        containerColor: 'slate-900/80',
        buttonColor: 'emerald-600',
        fontFamily: 'nunito',
        defaultMaterialTheme: 'dark',
      },
    },
  ];

  const COURSE_TEMPLATE_OPTIONS = [
    { value: 'deck', label: 'Deck' },
    { value: 'finlit', label: 'FinLit' },
    { value: 'coursebook', label: 'Coursebook' },
    { value: 'toolkit_dashboard', label: 'Toolkit Dashboard' },
  ];

  const COURSE_THEME_OPTIONS = [
    { value: 'dark_cards', label: 'Dark Cards' },
    { value: 'finlit_clean', label: 'FinLit Clean' },
    { value: 'coursebook_light', label: 'Coursebook Light' },
    { value: 'toolkit_clean', label: 'Toolkit Clean' },
  ];

  const ACCENT_SWATCH_HEX = {
    sky: '#0ea5e9',
    rose: '#f43f5e',
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#a855f7',
    indigo: '#6366f1',
    pink: '#ec4899',
    teal: '#14b8a6',
  };
  
  const modules = projectData["Current Course"]?.modules || [];
  const assessmentsModule = modules.find(m => m.id === "item-assessments" || m.title === "Assessments");
  const courseAssessments = (assessmentsModule?.assessments || []).filter(a => !a.hidden);
  const courseMaterials = projectData["Current Course"]?.materials || [];
  
  const updateSettings = (updates) => {
    setProjectData(prev => ({
      ...prev,
      "Course Settings": {
        ...prev["Course Settings"],
        ...updates
      }
    }));
  };
  
  const updateCompilationDefaults = (updates) => {
    updateSettings({
      compilationDefaults: {
        ...(settings.compilationDefaults || {}),
        ...updates
      }
    });
  };

  const applyThemePack = (packId) => {
    const pack = THEME_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    updateSettings({ ...pack.updates, visualThemePack: pack.id });
  };
  
  const exportProject = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${settings.courseName.replace(/\s+/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const importProject = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && imported["Current Course"]) {
          setProjectData(imported);
          alert('Project imported successfully.');
        } else {
          alert('Invalid project file.');
        }
      } catch (error) {
        alert('Failed to import: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  
  const resetProject = () => {
    if (window.confirm('Warning: This will delete all your course data. Are you sure?')) {
      localStorage.removeItem('course_factory_v2_data');
      window.location.reload();
    }
  };
  
  const colorOptions = [
    { value: 'sky', label: 'Sky Blue', class: 'bg-sky-500' },
    { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-500' }
  ];
  
  const textColorOptions = [
    { value: 'white', label: 'White', swatch: 'bg-white border-slate-300', text: 'text-slate-900' },
    { value: 'slate-900', label: 'Slate 900', swatch: 'bg-slate-900 border-slate-700', text: 'text-white' },
    { value: 'slate-700', label: 'Slate 700', swatch: 'bg-slate-700 border-slate-600', text: 'text-white' },
    { value: 'slate-600', label: 'Slate 600', swatch: 'bg-slate-600 border-slate-500', text: 'text-white' },
    { value: 'slate-500', label: 'Slate 500', swatch: 'bg-slate-500 border-slate-400', text: 'text-white' },
    { value: 'gray-900', label: 'Gray 900', swatch: 'bg-gray-900 border-gray-700', text: 'text-white' },
    { value: 'gray-700', label: 'Gray 700', swatch: 'bg-gray-700 border-gray-600', text: 'text-white' },
    { value: 'gray-600', label: 'Gray 600', swatch: 'bg-gray-600 border-gray-500', text: 'text-white' }
  ];
  
  const assessmentTextColorOptions = [
    { value: 'white', label: 'White', swatch: 'bg-white border-slate-300', text: 'text-slate-900' },
    { value: 'slate-900', label: 'Slate 900', swatch: 'bg-slate-900 border-slate-700', text: 'text-white' },
    { value: 'slate-800', label: 'Slate 800', swatch: 'bg-slate-800 border-slate-700', text: 'text-white' },
    { value: 'slate-700', label: 'Slate 700', swatch: 'bg-slate-700 border-slate-600', text: 'text-white' },
    { value: 'slate-600', label: 'Slate 600', swatch: 'bg-slate-600 border-slate-500', text: 'text-white' },
    { value: 'slate-500', label: 'Slate 500', swatch: 'bg-slate-500 border-slate-400', text: 'text-white' },
    { value: 'slate-400', label: 'Slate 400', swatch: 'bg-slate-400 border-slate-300', text: 'text-white' },
    { value: 'slate-300', label: 'Slate 300', swatch: 'bg-slate-300 border-slate-200', text: 'text-slate-900' },
    { value: 'slate-200', label: 'Slate 200', swatch: 'bg-slate-200 border-slate-100', text: 'text-slate-900' },
    { value: 'slate-100', label: 'Slate 100', swatch: 'bg-slate-100 border-slate-50', text: 'text-slate-900' },
    { value: 'gray-900', label: 'Gray 900', swatch: 'bg-gray-900 border-gray-700', text: 'text-white' },
    { value: 'gray-800', label: 'Gray 800', swatch: 'bg-gray-800 border-gray-700', text: 'text-white' },
    { value: 'gray-700', label: 'Gray 700', swatch: 'bg-gray-700 border-gray-600', text: 'text-white' },
    { value: 'gray-600', label: 'Gray 600', swatch: 'bg-gray-600 border-gray-500', text: 'text-white' },
    { value: 'gray-500', label: 'Gray 500', swatch: 'bg-gray-500 border-gray-400', text: 'text-white' },
    { value: 'gray-400', label: 'Gray 400', swatch: 'bg-gray-400 border-gray-300', text: 'text-white' },
    { value: 'gray-300', label: 'Gray 300', swatch: 'bg-gray-300 border-gray-200', text: 'text-slate-900' },
    { value: 'black', label: 'Black', swatch: 'bg-black border-slate-700', text: 'text-white' }
  ];
  
  const buttonColorOptions = [
    { value: 'sky-600', label: 'Sky', swatch: 'bg-sky-600 border-sky-500', text: 'text-white' },
    { value: 'emerald-600', label: 'Emerald', swatch: 'bg-emerald-600 border-emerald-500', text: 'text-white' },
    { value: 'rose-600', label: 'Rose', swatch: 'bg-rose-600 border-rose-500', text: 'text-white' },
    { value: 'amber-600', label: 'Amber', swatch: 'bg-amber-600 border-amber-500', text: 'text-white' },
    { value: 'purple-600', label: 'Purple', swatch: 'bg-purple-600 border-purple-500', text: 'text-white' },
    { value: 'slate-800', label: 'Slate 800', swatch: 'bg-slate-800 border-slate-700', text: 'text-white' },
    { value: 'gray-800', label: 'Gray 800', swatch: 'bg-gray-800 border-gray-700', text: 'text-white' },
    { value: 'black', label: 'Black', swatch: 'bg-black border-slate-700', text: 'text-white' }
  ];
  
  const containerColorOptions = [
    { value: 'slate-900/80', label: 'Slate 900', swatch: 'bg-slate-900 border-slate-700', text: 'text-white' },
    { value: 'slate-800/80', label: 'Slate 800', swatch: 'bg-slate-800 border-slate-700', text: 'text-white' },
    { value: 'slate-700/80', label: 'Slate 700', swatch: 'bg-slate-700 border-slate-600', text: 'text-white' },
    { value: 'gray-800/80', label: 'Gray 800', swatch: 'bg-gray-800 border-gray-700', text: 'text-white' },
    { value: 'gray-700/80', label: 'Gray 700', swatch: 'bg-gray-700 border-gray-600', text: 'text-white' },
    { value: 'white/90', label: 'White', swatch: 'bg-white border-slate-300', text: 'text-slate-900' }
  ];
  
  const getStorageSize = () => {
    try {
      const data = localStorage.getItem('course_factory_v2_data');
      if (!data) return '0 KB';
      const bytes = new Blob([data]).size;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="text-sky-400" /> Phase 5: Settings & Preferences
        </h2>
        
        {/* COURSE CONFIGURATION */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-sky-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Terminal size={20} className="text-sky-400" /> Course Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Course Name</label>
              <input 
                type="text"
                value={settings.courseName || ''}
                onChange={(e) => updateSettings({ courseName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                placeholder="Mental Fitness"
              />
              <p className="text-[10px] text-slate-500 mt-1 italic">This appears in the sidebar as "IN: {(settings.courseName || 'COURSE NAME').toUpperCase()}"</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Course Code</label>
                <input 
                  type="text"
                  value={settings.courseCode || ''}
                  onChange={(e) => updateSettings({ courseCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  placeholder="PSY-101"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Academic Year</label>
                <input 
                  type="text"
                  value={settings.academicYear || ''}
                  onChange={(e) => updateSettings({ academicYear: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  placeholder="2025-2026"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Instructor Name</label>
              <input 
                type="text"
                value={settings.instructor || ''}
                onChange={(e) => updateSettings({ instructor: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                placeholder="Dr. Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Template</label>
                <select
                  value={settings.templateDefault || 'deck'}
                  onChange={(e) => updateSettings({ templateDefault: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                >
                  {COURSE_TEMPLATE_OPTIONS.map((option) => (
                    <option key={`course-template-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Theme</label>
                <select
                  value={settings.themeDefault || 'dark_cards'}
                  onChange={(e) => updateSettings({ themeDefault: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                >
                  {COURSE_THEME_OPTIONS.map((option) => (
                    <option key={`course-theme-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* VISUAL SETTINGS */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-purple-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" /> Visual Settings
          </h3>
          
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">Theme Packs</p>
                  <p className="text-[10px] text-slate-500">Apply a full set of visual defaults in one click.</p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Current: {settings.visualThemePack || 'custom'}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => applyThemePack(pack.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      (settings.visualThemePack || '') === pack.id
                        ? 'border-white bg-slate-900'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                    }`}
                    title="Apply this theme pack"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{pack.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{pack.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ACCENT_SWATCH_HEX[pack.updates.accentColor] || '#0ea5e9' }}
                        ></span>
                        <span className="text-[10px] text-slate-400 font-mono">{pack.updates.backgroundColor}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Primary Accent Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    onClick={() => updateSettings({ accentColor: color.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      settings.accentColor === color.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded ${color.class}`}></div>
                    <span className="text-xs text-white">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Background Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Applies to hub pages and compiled sites</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 mb-2 font-bold">Dark Options</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'slate-900', label: 'Dark Slate', class: 'bg-slate-900 border-slate-700' },
                      { value: 'slate-950', label: 'Darker Slate', class: 'bg-slate-950 border-slate-800' },
                      { value: 'zinc-900', label: 'Dark Zinc', class: 'bg-zinc-900 border-zinc-700' },
                      { value: 'neutral-900', label: 'Dark Neutral', class: 'bg-neutral-900 border-neutral-700' },
                      { value: 'stone-900', label: 'Dark Stone', class: 'bg-stone-900 border-stone-700' },
                      { value: 'gray-900', label: 'Dark Gray', class: 'bg-gray-900 border-gray-700' }
                    ].map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => updateSettings({ backgroundColor: bg.value })}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          (settings.backgroundColor || 'slate-900') === bg.value
                            ? 'border-white bg-slate-700'
                            : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded border ${bg.class}`}></div>
                        <span className="text-xs text-white">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-2 font-bold">Light Options</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'slate-50', label: 'Light Slate', class: 'bg-slate-50 border-slate-300', textClass: 'text-slate-900' },
                      { value: 'zinc-50', label: 'Light Zinc', class: 'bg-zinc-50 border-zinc-300', textClass: 'text-zinc-900' },
                      { value: 'neutral-50', label: 'Light Neutral', class: 'bg-neutral-50 border-neutral-300', textClass: 'text-neutral-900' },
                      { value: 'stone-50', label: 'Light Stone', class: 'bg-stone-50 border-stone-300', textClass: 'text-stone-900' },
                      { value: 'gray-50', label: 'Light Gray', class: 'bg-gray-50 border-gray-300', textClass: 'text-gray-900' },
                      { value: 'white', label: 'White', class: 'bg-white border-gray-200', textClass: 'text-gray-900' }
                    ].map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => updateSettings({ backgroundColor: bg.value })}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          (settings.backgroundColor || 'slate-900') === bg.value
                            ? 'border-white bg-slate-700'
                            : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded border ${bg.class}`}></div>
                        <span className="text-xs text-white">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Heading Text Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Applies to Materials & Assessments titles</p>
              <div className="grid grid-cols-3 gap-2">
                {textColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ headingTextColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.headingTextColor || 'white') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Secondary Text Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Applies to subtext, descriptions, and button text</p>
              <div className="grid grid-cols-3 gap-2">
                {textColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ secondaryTextColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.secondaryTextColor || 'slate-400') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Text Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Text color for questions, answers, and input fields in assessments</p>
              <div className="grid grid-cols-3 gap-2">
                {assessmentTextColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ assessmentTextColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.assessmentTextColor || 'white') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Box Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Default background for assessment cards and input fields</p>
              <div className="grid grid-cols-3 gap-2">
                {assessmentTextColorOptions.map(opt => (
                  <button
                    key={'box-' + opt.value}
                    onClick={() => updateSettings({ assessmentBoxColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.assessmentBoxColor || 'slate-900') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Material Card Theme</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Default card look for materials; overridable per material in Phase 1</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'muted', label: 'Muted' },
                  { value: 'high-contrast-light', label: 'High contrast (light)' },
                  { value: 'high-contrast-dark', label: 'High contrast (dark)' }
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => updateSettings({ defaultMaterialTheme: t.value })}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      (settings.defaultMaterialTheme || 'dark') === t.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs text-white">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Materials & Assessments Button Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Uniform button background for Materials & Assessments</p>
              <div className="grid grid-cols-3 gap-2">
                {buttonColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ buttonColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.buttonColor || 'sky-600') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Materials & Assessments Container Color</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Applies to material cards and assessment containers</p>
              <div className="grid grid-cols-3 gap-2">
                {containerColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ containerColor: opt.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      (settings.containerColor || 'slate-900/80') === opt.value
                        ? 'border-white bg-slate-700'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border ${opt.swatch}`}></div>
                    <span className={`text-xs ${opt.text}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 mb-2 italic">
                Reset to the functional default visual scheme and clear all per-material and per-assessment overrides.
              </p>
              <button
                onClick={applyVisualDefaults}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 rounded-md text-xs w-full justify-center transition-colors"
              >
                <RefreshCw size={14} /> Reset To Functional Visual Defaults
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Font Family</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Primary font for hub pages and compiled sites</p>
              <select
                value={settings.fontFamily || 'inter'}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
              >
                <option value="inter">Inter (Default)</option>
                <option value="roboto">Roboto</option>
                <option value="opensans">Open Sans</option>
                <option value="lato">Lato</option>
                <option value="montserrat">Montserrat</option>
                <option value="poppins">Poppins</option>
                <option value="raleway">Raleway</option>
                <option value="nunito">Nunito</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Custom CSS (Advanced)</label>
              <p className="text-[10px] text-slate-500 mb-2 italic">Applies to all compiled outputs (legacy, beta single-page, and beta multi-file hub)</p>
              <textarea 
                value={settings.customCSS || ''}
                onChange={(e) => updateSettings({ customCSS: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-xs font-mono h-32 resize-none"
                placeholder="/* Custom styles will be injected into compiled site */"
              />
            </div>
          </div>
        </div>
        
        {/* DATA MANAGEMENT */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-emerald-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database size={20} className="text-emerald-400" /> Data Management
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={exportProject}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download size={16} /> Export Project
              </button>
              <label className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Upload size={16} /> Import Project
                <input
                  type="file"
                  accept=".json"
                  onChange={importProject}
                  className="hidden"
                />
              </label>
            </div>
            
            <button
              onClick={resetProject}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={16} /> Reset All Data
            </button>
          </div>
        </div>
        
        {/* COMPILATION DEFAULTS */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-amber-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-amber-400" /> Compilation Defaults
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={settings.compilationDefaults?.includeMaterials || false}
                onChange={(e) => updateCompilationDefaults({ includeMaterials: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-600"
              />
              <div>
                <div className="text-sm font-bold text-white">Auto-include Course Materials</div>
                <div className="text-xs text-slate-500">Automatically include materials in full site compile</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={settings.compilationDefaults?.includeAssessments || false}
                onChange={(e) => updateCompilationDefaults({ includeAssessments: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-600"
              />
              <div>
                <div className="text-sm font-bold text-white">Auto-include Assessments</div>
                <div className="text-xs text-slate-500">Automatically include assessments module in full site compile</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={settings.compilationDefaults?.includeToolkit || false}
                onChange={(e) => updateCompilationDefaults({ includeToolkit: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-600"
              />
              <div>
                <div className="text-sm font-bold text-white">Auto-include Global Toolkit</div>
                <div className="text-xs text-slate-500">Automatically include enabled toolkit items</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={settings.compilationDefaults?.enableProgressTracking || false}
                onChange={(e) => updateCompilationDefaults({ enableProgressTracking: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-600"
              />
              <div>
                <div className="text-sm font-bold text-white">Enable Progress Tracking</div>
                <div className="text-xs text-slate-500">Track student progress in localStorage</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={settings.compilationDefaults?.enableComposer || false}
                onChange={(e) => updateCompilationDefaults({ enableComposer: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-600"
              />
              <div>
                <div className="text-sm font-bold text-white">Enable Composer (MVP)</div>
                <div className="text-xs text-slate-500">Expose activity-based module editing in the module editor</div>
              </div>
            </label>
          </div>
        </div>
        
        {/* DEVELOPER TOOLS */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Terminal size={20} className="text-slate-400" /> Developer Tools
          </h3>
          
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Storage Usage</span>
                <span className="text-sm font-mono text-white">{getStorageSize()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Modules</span>
                <span className="text-sm font-mono text-white">{modules.length}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Assessments</span>
                <span className="text-sm font-mono text-white">{courseAssessments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Materials</span>
                <span className="text-sm font-mono text-white">{courseMaterials.length}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                const dataStr = JSON.stringify(projectData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                URL.revokeObjectURL(url);
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Eye size={16} /> View Raw Project Data
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Clear localStorage cache? This will not delete your project data.')) {
                  const projectBackup = localStorage.getItem('course_factory_v2_data');
                  localStorage.clear();
                  if (projectBackup) {
                    localStorage.setItem('course_factory_v2_data', projectBackup);
                  }
                  alert('Cache cleared.');
                }
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={16} /> Clear Cache
            </button>

            <button
              onClick={async () => {
                if (window.confirm('Force refresh?\n\nThis will:\n- Clear browser cache for this site\n- Clear any service workers\n- Reload with fresh code\n\nYour project data will be preserved.')) {
                  try {
                    // Clear service worker caches
                    if ('caches' in window) {
                      const cacheNames = await caches.keys();
                      await Promise.all(cacheNames.map(name => caches.delete(name)));
                    }
                    
                    // Unregister service workers
                    if ('serviceWorker' in navigator) {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(reg => reg.unregister()));
                    }
                    
                    // Force hard reload bypassing cache
                    window.location.reload(true);
                  } catch (e) {
                    // Fallback: just do a hard reload
                    window.location.reload(true);
                  }
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw size={16} /> Force Refresh (Get Latest Code)
            </button>

            <div className="border-t border-rose-900/50 pt-4 mt-4">
              <p className="text-[10px] text-rose-400 uppercase font-bold mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> Danger Zone
              </p>
              <button
                onClick={() => {
                  if (window.confirm('FULL RESET WARNING!\n\nThis will permanently delete:\n- All your materials (but keep Materials module)\n- All your assessments (but keep Assessments module)\n- All other custom modules\n- All toolkit items\n\nThe Course Materials and Assessments containers will remain empty.\n\nContinue?')) {
                    const userInput = window.prompt('Type RESET to confirm full data wipe:');
                    if (userInput === 'RESET') {
                      // Get the current Course Materials and Assessments modules from PROJECT_DATA defaults
                      // Keep their structure but clear their content arrays
                      const cleanProject = {
                        "Current Course": {
                          name: "New Course",
                          modules: [
                            // Course Materials module - KEEP but empty materials
                            {
                              id: "item-1768749223001",
                              title: "Course Materials",
                              type: "standalone",
                              mode: 'custom_html',
                              activities: [],
                              code: { id: "view-materials" },
                              materials: [], // EMPTY
                              html: `<div id="view-materials" class="w-full h-full custom-scroll p-8 md:p-12">
                                <div class="max-w-5xl mx-auto space-y-8">
                                  <div class="mb-12">
                                    <h2 class="text-3xl font-black text-white italic uppercase tracking-tighter">Course <span class="text-sky-500">Materials</span></h2>
                                    <p class="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2">Access lectures, presentations, and briefing documents.</p>
                                  </div>
                                  <div id="pdf-viewer-container" class="hidden mb-12 bg-black rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
                                    <div class="flex justify-between items-center p-3 bg-slate-800 border-b border-slate-700">
                                      <span id="viewer-title" class="text-xs font-bold text-white uppercase tracking-widest px-2">Document Viewer</span>
                                      <button onclick="closeViewer()" class="text-xs text-rose-400 hover:text-white font-bold uppercase tracking-widest px-2">Close X</button>
                                    </div>
                                    <iframe id="pdf-frame" src="" width="100%" height="600" style="border:none;"></iframe>
                                  </div>
                                  <div class="grid grid-cols-1 gap-4" id="materials-container">
                                    <p class="text-center text-slate-500 italic py-8">No materials yet. Add materials in the builder.</p>
                                  </div>
                                </div>
                              </div>`,
                              css: "",
                              script: `function renderMaterials() {
                                const container = document.getElementById('materials-container');
                                if (!container) return;
                                if (window.courseMaterials && window.courseMaterials.length > 0) {
                                  container.innerHTML = window.courseMaterials.map(mat => \`<div class="material-card">\${mat.title}</div>\`).join('');
                                }
                              }
                              if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', renderMaterials);
                              } else {
                                renderMaterials();
                              }`
                            },
                            // Assessments module - KEEP but empty assessments
                            {
                              id: "item-assessments",
                              title: "Assessments",
                              type: "standalone",
                              mode: 'custom_html',
                              activities: [],
                              assessments: [], // EMPTY
                              html: `<div id="view-assessments" class="w-full h-full custom-scroll p-8 md:p-12">
                                <div class="max-w-5xl mx-auto space-y-8">
                                  <div class="mb-12">
                                    <h2 class="text-3xl font-black text-white italic uppercase tracking-tighter">Assessment <span class="text-purple-500">Center</span></h2>
                                    <p class="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2">Quizzes, tests, and reflection exercises.</p>
                                  </div>
                                  <div id="assessments-container" class="space-y-6">
                                    <p class="text-center text-slate-500 italic py-8">No assessments yet. Create assessments in the builder.</p>
                                  </div>
                                </div>
                              </div>`,
                              css: "",
                              script: `function renderAssessments() {
                                const container = document.getElementById('assessments-container');
                                if (!container) return;
                                if (window.courseAssessments && window.courseAssessments.length > 0) {
                                  container.innerHTML = window.courseAssessments.map(assessment => '<div class="assessment-wrapper mb-8">' + assessment.html + '</div>').join('');
                                  window.courseAssessments.forEach((assessment) => {
                                    if (assessment.script) {
                                      try { eval(assessment.script); } catch(e) { console.error('Assessment script error:', e); }
                                    }
                                  });
                                }
                              }
                              if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', renderAssessments);
                              } else {
                                renderAssessments();
                              }`
                            }
                          ]
                        },
                        "Global Toolkit": []
                      };
                      
                      // IMMEDIATELY update React state (clears UI now)
                      setProjectData(cleanProject);
                      
                      // Save to localStorage (persists after reload)
                      localStorage.setItem('course_factory_v2_data', JSON.stringify(cleanProject));
                      
                      // Clear any other related keys
                      localStorage.removeItem('course_factory_backup');
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('courseProgress_')) {
                          localStorage.removeItem(key);
                        }
                      });
                      
                      // Clear browser caches too
                      if ('caches' in window) {
                        caches.keys().then(names => {
                          names.forEach(name => caches.delete(name));
                        });
                      }
                      
                      alert('Reset complete. Course Materials and Assessments modules were preserved but emptied. All other content was cleared.');
                    } else {
                      alert('Reset cancelled. Your data is safe.');
                    }
                  }
                }}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} /> Full Reset (Delete Everything)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase5;
