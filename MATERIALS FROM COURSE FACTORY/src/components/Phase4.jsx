import * as React from 'react';
import { AlertTriangle, CheckCircle, Copy, Download, FileCode, FileJson, FolderOpen, LayoutTemplate, Package, RefreshCw, Zap } from 'lucide-react';
import { CodeBlock } from './Shared.jsx';
import {
  buildSiteHtml,
  buildModuleFrameHTML,
  validateProject,
  getFontFamilyGlobal,
  buildBetaManifest as buildBetaManifestGen,
  generateHubPageBeta as generateHubPageBetaGen,
  generateModuleHtmlBeta as generateModuleHtmlBetaGen,
  buildStaticFilesBeta as buildStaticFilesBetaGen,
} from '../utils/generators.js';

const { useState } = React;

// --- PHASE 4: COMPILE & EXPORT ---
const Phase4 = ({ projectData, setProjectData, excludedIds, toggleModule, onToggleHidden, onError }) => {
  const [fullSiteCode, setFullSiteCode] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [compileValidation, setCompileValidation] = useState(null); // { isValid, errors, warnings }

  // --- EXPORT MODULE PAGE STATE ---
  const [exportModuleId, setExportModuleId] = useState('');
  const [exportAssessments, setExportAssessments] = useState([]);
  const [exportMaterials, setExportMaterials] = useState([]);
  const [exportTools, setExportTools] = useState([]);
  const [exportedHTML, setExportedHTML] = useState('');
  
  // --- HUB PAGE STATE ---
  const [hubPageHTML, setHubPageHTML] = useState('');
  const [hubCourseTitle, setHubCourseTitle] = useState('Mental Fitness Course');
  const [hubCourseDescription, setHubCourseDescription] = useState('Master your mental game and unlock peak performance.');

  // --- BETA STATIC PUBLISH STATE ---
  const [publishMode, setPublishMode] = useState('legacy'); // 'legacy' | 'beta'
  const [betaStructureMode, setBetaStructureMode] = useState('multi-file'); // 'multi-file' | 'single-page'
  const [betaSelectedModules, setBetaSelectedModules] = useState([]); // for delta publish
  const [betaIncludeManifest, setBetaIncludeManifest] = useState(true);
  const [betaPublishStatus, setBetaPublishStatus] = useState(''); // '', 'loading', 'success', 'error'
  const [betaPublishMessage, setBetaPublishMessage] = useState('');

  const modules = projectData["Current Course"]?.modules || [];

  // ========================================
  // BETA STATIC PUBLISH HELPER FUNCTIONS
  // ========================================

  // Load JSZip from CDN dynamically
  const loadJSZip = async () => {
    if (window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  };

  // Beta generator wrappers (moved to src/utils/generators.js)
  const buildBetaManifest = () => buildBetaManifestGen({ projectData, modules, excludedIds });
  const generateHubPageBeta = (manifest) => generateHubPageBetaGen({ projectData, manifest });
  const generateModuleHtmlBeta = (moduleId) => generateModuleHtmlBetaGen({ projectData, modules, moduleId });
  const buildStaticFilesBeta = () => buildStaticFilesBetaGen({ projectData, modules, excludedIds });


  // Build single-page app (with sidebar) for beta publish
  const buildSinglePageAppBeta = () => {
    const manifest = buildBetaManifest();
    const filesMap = {};
    const toolkit = projectData["Global Toolkit"] || [];
    
    // Use buildSiteHtml to generate single-page app (same as legacy but for beta)
    const singlePageHtml = buildSiteHtml({
      modules,
      toolkit,
      excludedIds,
      initialViewKey: null,
      projectData,
      ignoreAssetBaseUrl: true // Force relative links for ZIP export
    });
    
    // Add index.html (single-page app)
    filesMap['index.html'] = singlePageHtml;
    
    // Add manifest.json
    filesMap['manifest.json'] = JSON.stringify(manifest, null, 2);
    
    return filesMap;
  };


  // Build delta files for selective publish
  const buildDeltaFilesBeta = (selectedModuleIds, includeManifest) => {
    const filesMap = {};
    
    // Add manifest if requested
    if (includeManifest) {
      const manifest = buildBetaManifest();
      filesMap['manifest.json'] = JSON.stringify(manifest, null, 2);
    }
    
    // Add selected module pages only
    selectedModuleIds.forEach(modId => {
      const moduleHtml = generateModuleHtmlBeta(modId);
      if (moduleHtml) {
        filesMap[`modules/${modId}.html`] = moduleHtml;
      }
    });
    
    return filesMap;
  };

  const getLocalMaterialZipPath = (url) => {
    const raw = String(url || '').trim();
    if (!raw) return null;
    if (/^(https?:|data:|blob:|mailto:)/i.test(raw)) return null;
    const clean = raw.split('#')[0].split('?')[0];
    const marker = '/materials/';
    const idx = clean.indexOf(marker);
    if (idx !== -1) {
      return clean.substring(idx + 1); // materials/...
    }
    if (clean.startsWith('materials/')) return clean;
    return null;
  };

  const collectLocalMaterialAssets = () => {
    const assetMap = new Map();
    const add = (rawUrl) => {
      const zipPath = getLocalMaterialZipPath(rawUrl);
      if (!zipPath) return;
      if (!assetMap.has(zipPath)) {
        assetMap.set(zipPath, String(rawUrl || '').trim());
      }
    };

    const courseMaterials = projectData["Current Course"]?.materials || [];
    courseMaterials.forEach((mat) => {
      add(mat?.viewUrl);
      add(mat?.downloadUrl);
    });

    modules.forEach((mod) => {
      if (mod?.mode !== 'composer') return;
      const activities = Array.isArray(mod?.activities) ? mod.activities : [];
      activities.forEach((activity) => {
        if (activity?.type !== 'resource_list') return;
        const items = Array.isArray(activity?.data?.items) ? activity.data.items : [];
        items.forEach((item) => {
          add(item?.viewUrl || item?.url);
          add(item?.downloadUrl || item?.url);
        });
      });
    });

    return Array.from(assetMap.entries()).map(([zipPath, rawUrl]) => ({ zipPath, rawUrl }));
  };

  const fetchLocalMaterialBlob = async (rawUrl, zipPath) => {
    const candidates = [];
    const rel = zipPath.startsWith('materials/') ? zipPath : null;

    if (rel) {
      // Relative candidate (works when app is hosted under a subpath like /Course-factoryPERFECT/).
      candidates.push(rel);
      // Root candidate.
      candidates.push('/' + rel);
    }

    if (rawUrl) {
      const raw = String(rawUrl).trim();
      candidates.push(raw);
      if (raw.includes('/Course-factoryPERFECT/materials/')) {
        const tail = raw.split('/Course-factoryPERFECT/materials/')[1];
        if (tail) candidates.push('/materials/' + tail);
      }
    }

    const seen = new Set();
    for (const candidate of candidates) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      try {
        const res = await fetch(candidate);
        if (res.ok) {
          return await res.blob();
        }
      } catch (e) {
        // Try next candidate.
      }
    }
    return null;
  };

  // Download files as ZIP
  const downloadZipFromFilesMap = async (filesMap, zipName) => {
    try {
      setBetaPublishStatus('loading');
      setBetaPublishMessage('Loading ZIP library...');
      
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      
      setBetaPublishMessage('Creating ZIP archive...');
      
      // Add files to ZIP
      Object.entries(filesMap).forEach(([path, content]) => {
        zip.file(path, content);
      });

      // Include local /materials assets referenced by the project so exported links work offline.
      const localAssets = collectLocalMaterialAssets();
      if (localAssets.length > 0) {
        setBetaPublishMessage(`Bundling ${localAssets.length} local material file(s)...`);
        for (const asset of localAssets) {
          if (zip.file(asset.zipPath)) continue;
          const blob = await fetchLocalMaterialBlob(asset.rawUrl, asset.zipPath);
          if (blob) {
            zip.file(asset.zipPath, blob);
          }
        }
      }
      
      setBetaPublishMessage('Generating download...');
      
      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setBetaPublishStatus('success');
      setBetaPublishMessage(`Downloaded ${zipName}`);
      setTimeout(() => {
        setBetaPublishStatus('');
        setBetaPublishMessage('');
      }, 3000);
    } catch (error) {
      setBetaPublishStatus('error');
      setBetaPublishMessage(`Failed: ${error.message}`);
    }
  };

  // Get safe filename from course name
  const getSafeFilename = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  // Full publish handler
  const handleFullPublishBeta = async () => {
    const courseSettings = projectData["Course Settings"] || {};
    const courseName = courseSettings.courseName || projectData["Current Course"]?.name || "course";
    const safeTitle = getSafeFilename(courseName);
    const dateStr = new Date().toISOString().split('T')[0];
    const zipName = `course_${safeTitle}_${dateStr}.zip`;
    
    // Use appropriate function based on structure mode
    const filesMap = betaStructureMode === 'single-page' 
      ? buildSinglePageAppBeta()
      : buildStaticFilesBeta();
    
    await downloadZipFromFilesMap(filesMap, zipName);
  };

  // Delta publish handler
  const handleDeltaPublishBeta = async () => {
    if (betaSelectedModules.length === 0) {
      setBetaPublishStatus('error');
      setBetaPublishMessage('Please select at least one module');
      return;
    }
    
    const courseSettings = projectData["Course Settings"] || {};
    const courseName = courseSettings.courseName || projectData["Current Course"]?.name || "course";
    const safeTitle = getSafeFilename(courseName);
    const dateStr = new Date().toISOString().split('T')[0];
    const zipName = `delta_${safeTitle}_${dateStr}.zip`;
    
    const filesMap = buildDeltaFilesBeta(betaSelectedModules, betaIncludeManifest);
    await downloadZipFromFilesMap(filesMap, zipName);
  };

  // Toggle module selection for delta publish
  const toggleBetaModuleSelection = (moduleId) => {
    setBetaSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Select/deselect all modules for delta
  const selectAllBetaModules = () => {
    const activeModules = modules.filter(m => !excludedIds.includes(m.id) && !m.hidden);
    setBetaSelectedModules(activeModules.map(m => m.id));
  };

  const deselectAllBetaModules = () => {
    setBetaSelectedModules([]);
  };
  const materials = projectData["Current Course"]?.materials || [];
  const toolkit = projectData["Global Toolkit"] || [];
  const localMaterialAssets = collectLocalMaterialAssets();
  const hasAssetBaseUrl = Boolean((projectData["Course Settings"]?.assetBaseUrl || '').trim());
  const legacyEmbedNeedsAssetBase = !hasAssetBaseUrl && localMaterialAssets.length > 0;

  // Toolkit toggle functions
  const toggleToolkitField = (index, field) => {
    const newToolkit = [...toolkit];
    newToolkit[index] = { ...newToolkit[index], [field]: !newToolkit[index][field] };
    setProjectData({
      ...projectData,
      "Global Toolkit": newToolkit
    });
  };

  // Generate Single Module Page HTML
  const generateModulePageHTML = () => {
    try {
      const selectedMod = modules.find(m => m.id === exportModuleId);
      if (!selectedMod) {
        if (onError) onError('module', `Module "${exportModuleId}" not found. Please select a valid module.`);
        return;
      }

      const courseSettings = projectData["Course Settings"] || {};
      const finalHTML = buildModuleFrameHTML(selectedMod, {
        ...courseSettings,
        __courseName: courseSettings.courseName || projectData["Current Course"]?.name || "Course",
        __toolkit: projectData["Global Toolkit"] || [],
        __materials: projectData["Current Course"]?.materials || []
      });

      if (finalHTML) setExportedHTML(finalHTML);
    } catch (error) {
      if (onError) {
        onError('compile', `Failed to generate module page HTML: ${error.message}`, error.stack);
      }
      console.error('Module page generation error:', error);
    }
  };

  const generateHubPage = () => {
    const courseSettings = projectData["Course Settings"] || {};
    const accentColor = courseSettings.accentColor || "sky";
    const backgroundColor = courseSettings.backgroundColor || "slate-900";
    const fontFamily = courseSettings.fontFamily || "inter";
    const font = getFontFamilyGlobal(fontFamily);
    
    const bgColorMap = {
      'slate-900': '#0f172a',
      'slate-950': '#020617',
      'zinc-900': '#18181b',
      'neutral-900': '#171717',
      'stone-900': '#1c1917',
      'gray-900': '#111827',
      'slate-50': '#f8fafc',
      'zinc-50': '#fafafa',
      'neutral-50': '#fafafa',
      'stone-50': '#fafaf9',
      'gray-50': '#f9fafb',
      'white': '#ffffff'
    };
    const bgHex = bgColorMap[backgroundColor] || bgColorMap['slate-900'];
    const isLightBg = ['slate-50', 'zinc-50', 'neutral-50', 'stone-50', 'gray-50', 'white'].includes(backgroundColor);
    const headingTextColor = courseSettings.headingTextColor || (isLightBg ? 'slate-900' : 'white');
    const secondaryTextColor = courseSettings.secondaryTextColor || (isLightBg ? 'slate-600' : 'slate-400');
    const buttonColor = courseSettings.buttonColor || `${accentColor}-600`;
    const toTextClass = (value) => value.startsWith('text-') ? value : `text-${value}`;
    const toBgBase = (value) => value.startsWith('bg-') ? value.slice(3) : value;
    const headingTextClass = toTextClass(headingTextColor);
    const secondaryTextClass = toTextClass(secondaryTextColor);
    const buttonBgBase = toBgBase(buttonColor);
    const buttonBgClass = `bg-${buttonBgBase}`;
    const buttonHoverClass = buttonBgBase.endsWith('-600') ? `hover:bg-${buttonBgBase.replace(/-600$/, '-500')}` : `hover:bg-${buttonBgBase}`;
    const buttonTextClass = secondaryTextClass;
    const badgeBgClass = isLightBg ? 'bg-black/10' : 'bg-white/20';
    const containerColor = courseSettings.containerColor || (isLightBg ? 'white/80' : 'slate-900/80');
    const hexToRgba = (hex, alpha = 1) => {
      if (!hex) return `rgba(15, 23, 42, ${alpha})`;
      const clean = hex.replace('#', '');
      if (clean.length !== 6) return `rgba(15, 23, 42, ${alpha})`;
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const parseColorToken = (value) => {
      const raw = (value || '').toString().trim();
      if (!raw) return { base: isLightBg ? 'white' : 'slate-900', alpha: 0.8, alphaRaw: '80' };
      let token = raw;
      if (token.startsWith('bg-')) token = token.slice(3);
      if (token.startsWith('text-')) token = token.slice(5);
      const parts = token.split('/');
      const base = parts[0] || (isLightBg ? 'white' : 'slate-900');
      const alphaRaw = parts[1] || null;
      const alpha = alphaRaw ? Math.max(0, Math.min(1, parseInt(alphaRaw, 10) / 100)) : 1;
      return { base, alpha, alphaRaw };
    };
    const colorHexMap = {
      'slate-900': '#0f172a',
      'slate-800': '#1e293b',
      'slate-700': '#334155',
      'slate-600': '#475569',
      'slate-500': '#64748b',
      'slate-950': '#020617',
      'gray-900': '#111827',
      'gray-800': '#1f2937',
      'gray-700': '#374151',
      'gray-600': '#4b5563',
      'zinc-900': '#18181b',
      'zinc-800': '#27272a',
      'neutral-900': '#171717',
      'stone-900': '#1c1917',
      'white': '#ffffff'
    };
    const containerToken = parseColorToken(containerColor);
    const containerBgClass = containerToken.alphaRaw ? `bg-${containerToken.base}/${containerToken.alphaRaw}` : `bg-${containerToken.base}`;
    const containerHex = colorHexMap[containerToken.base] || (isLightBg ? '#ffffff' : '#0f172a');
    const containerBgRgba = hexToRgba(containerHex, containerToken.alpha);
    const cardBorderClass = isLightBg ? 'border-slate-300' : 'border-slate-700';

    // Filter out special modules
    const regularModules = modules.filter(m => {
      let itemCode = m.code || {};
      if (typeof itemCode === 'string') {
        try { itemCode = JSON.parse(itemCode); } catch(e) {}
      }
      return itemCode.id !== 'view-materials' && 
             m.title !== 'Assessments' &&
             !m.title.includes('Empty');
    });
    
    const allAssessments = modules.flatMap(m => m.assessments || []);
    const assessmentCount = allAssessments.length;
    const materialCount = materials.length;
    
    // Generate module cards
    let moduleCardsHTML = '';
    regularModules.forEach((mod, idx) => {
      const modAssessments = mod.assessments || [];
      const colorClasses = [
        'from-rose-500 to-pink-500',
        'from-amber-500 to-orange-500',
        'from-emerald-500 to-teal-500',
        'from-sky-500 to-blue-500',
        'from-purple-500 to-violet-500',
        'from-indigo-500 to-purple-500'
      ];
      const gradientClass = colorClasses[idx % colorClasses.length];
      
      moduleCardsHTML += `
        <div class="group relative ${containerBgClass} rounded-2xl border ${cardBorderClass} overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-${gradientClass.split(' ')[0].split('-')[1]}-500/20">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass}"></div>
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-black text-xl shadow-lg">
                ${idx + 1}
              </div>
              <div class="flex gap-2">
                ${modAssessments.length > 0 ? `<span class="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 text-xs font-bold">${modAssessments.length} ${modAssessments.length === 1 ? 'Assessment' : 'Assessments'}</span>` : ''}
              </div>
            </div>
            <h3 class="text-xl font-black ${headingTextClass} mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${gradientClass} transition-all">
              ${mod.title}
            </h3>
            <p class="text-sm ${secondaryTextClass} mb-4 line-clamp-2">
              ${mod.description || 'Click to explore this module'}
            </p>
            <div class="flex gap-3">
              <button 
                onclick="window.open('MODULE_${mod.id}_URL', '_blank')"
                class="flex-1 bg-gradient-to-r ${gradientClass} text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Start Module
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${hubCourseTitle}</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="${font.url}" rel="stylesheet">
    <style>
        body {
            ${font.css}
            background: ${bgHex};
            background-color: ${bgHex};
            min-height: 100vh;
        }
        :root { --cf-container-bg: ${containerBgRgba}; }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .hero-gradient {
            background: ${bgHex};
            background-color: ${bgHex};
        }
        .stat-card {
            background: var(--cf-container-bg);
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body class="antialiased">
    <!-- Hero Section -->
    <div class="hero-gradient">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center">
                <h1 class="text-5xl md:text-6xl font-black ${headingTextClass} mb-4 tracking-tight">
                    ${hubCourseTitle}
                </h1>
                <p class="text-xl ${secondaryTextClass} mb-8 max-w-2xl mx-auto">
                    ${hubCourseDescription}
                </p>
                <div class="flex flex-wrap justify-center gap-4">
                    ${materialCount > 0 ? `
                    <a href="MATERIALS_PAGE_URL" target="_blank" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                        Course Materials
                        <span class="${badgeBgClass} px-2 py-1 rounded text-sm">${materialCount}</span>
                    </a>
                    ` : ''}
                    ${assessmentCount > 0 ? `
                    <a href="ASSESSMENTS_PAGE_URL" target="_blank" class="${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                        All Assessments
                        <span class="${badgeBgClass} px-2 py-1 rounded text-sm">${assessmentCount}</span>
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Bar -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="stat-card border ${cardBorderClass} rounded-xl p-6 text-center">
                <div class="text-4xl font-black text-sky-400 mb-2">${regularModules.length}</div>
                <div class="text-sm ${secondaryTextClass} uppercase tracking-wider font-bold">Modules</div>
            </div>
            <div class="stat-card border ${cardBorderClass} rounded-xl p-6 text-center">
                <div class="text-4xl font-black text-purple-400 mb-2">${assessmentCount}</div>
                <div class="text-sm ${secondaryTextClass} uppercase tracking-wider font-bold">Assessments</div>
            </div>
            <div class="stat-card border ${cardBorderClass} rounded-xl p-6 text-center">
                <div class="text-4xl font-black text-emerald-400 mb-2">${materialCount}</div>
                <div class="text-sm ${secondaryTextClass} uppercase tracking-wider font-bold">Materials</div>
            </div>
        </div>
    </div>

    <!-- Modules Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="mb-12">
            <h2 class="text-3xl font-black ${headingTextClass} mb-2">Course Modules</h2>
            <p class="${secondaryTextClass}">Select a module to begin your journey</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${moduleCardsHTML}
        </div>
    </div>

    <!-- Footer -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800">
    <div class="text-center ${secondaryTextClass} text-sm">
      <p class="font-bold">Built with Course Factory</p>
      <p class="mt-2">Ready to begin? Click any module above to start.</p>
    </div>
    </div>

    <script>
        // Progress tracking (localStorage based)
        const courseId = '${projectData["Current Course"]?.name || "course"}';
        const progressKey = courseId + '_progress';
        
        function getProgress() {
            try {
                return JSON.parse(localStorage.getItem(progressKey) || '{}');
            } catch(e) {
                return {};
            }
        }
        
        function saveProgress(moduleId, status) {
            const progress = getProgress();
            progress[moduleId] = status;
            localStorage.setItem(progressKey, JSON.stringify(progress));
        }
        
        console.log('Hub Page Loaded - Course: ${hubCourseTitle}');
    <\/script>
</body>
</html>`;
    
    setHubPageHTML(htmlContent);
  };

  const generateFullSite = () => {
    try {
      const finalCode = buildSiteHtml({
        modules,
        toolkit,
        excludedIds,
        initialViewKey: null,
        projectData
      });
      setFullSiteCode(finalCode);
      setIsGenerated(true);
    } catch (error) {
      if (onError) {
        onError('compile', `Failed to compile full site: ${error.message}`, error.stack);
      }
      console.error('Full site compilation error:', error);
      setIsGenerated(false);
    }
  };

  const handleCompileClick = () => {
    const v = validateProject(projectData);
    if (!v.isValid) {
      setCompileValidation(v);
      return;
    }
    setCompileValidation(v.warnings.length > 0 ? v : null);
    generateFullSite();
  };

  const downloadFile = () => {
    const blob = new Blob([fullSiteCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Apply export settings from Phase 5
    const exportSettings = projectData["Course Settings"]?.exportSettings || {};
    const courseName = projectData["Course Settings"]?.courseName || "course";
    let filename = exportSettings.filenamePattern || "{courseName}_compiled";
    
    // Replace placeholders
    filename = filename.replace(/{courseName}/g, courseName.replace(/[^a-zA-Z0-9]/g, '_'));
    
    // Add timestamp if enabled
    if (exportSettings.includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      filename += `_${timestamp}`;
    }
    
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 min-w-0 overflow-x-hidden">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 min-w-0">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Package className="text-purple-400" /> Phase 4: Compile & Export
        </h2>

        {/* ASSET BASE URL CONFIG */}
        <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Asset Base URL (CDN)</h3>
                <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800">Required for Google Sites</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">
                If your PDFs/files are in a local folder (e.g. <code>/materials/doc.pdf</code>), Google Sites cannot see them. 
                Enter your GitHub Pages URL here to convert them to absolute links.
            </p>
            <input 
                type="text" 
                value={projectData["Course Settings"]?.assetBaseUrl || ""}
                onChange={(e) => setProjectData(prev => ({
                    ...prev,
                    "Course Settings": { ...prev["Course Settings"], assetBaseUrl: e.target.value }
                }))}
                placeholder="https://username.github.io/repo-name"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-blue-500 outline-none"
            />
        </div>

        {/* --- PUBLISHING MODE SELECTOR --- */}
        <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Publishing Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPublishMode('legacy')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                publishMode === 'legacy'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Legacy Compile (Single HTML)
            </button>
            <button
              onClick={() => setPublishMode('beta')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                publishMode === 'beta'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Static Multi-File Publish
              <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">BETA</span>
            </button>
          </div>
        </div>

        {/* --- BETA STATIC PUBLISH UI --- */}
        {publishMode === 'beta' && (
          <div className="mb-8 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 p-6 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={20} className="text-emerald-400" /> Static Multi-File Publish
              <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">BETA</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Generate a proper static site structure with <code className="bg-slate-800 px-1 rounded">index.html</code>, <code className="bg-slate-800 px-1 rounded">manifest.json</code>, and individual module pages in <code className="bg-slate-800 px-1 rounded">modules/</code> folder.
            </p>

            {/* Structure Mode Selector */}
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Site Structure</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBetaStructureMode('multi-file')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                    betaStructureMode === 'multi-file'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Multi-File (Separate Pages)
                </button>
                <button
                  onClick={() => setBetaStructureMode('single-page')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                    betaStructureMode === 'single-page'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Single-Page App (With Sidebar)
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {betaStructureMode === 'multi-file' ? (
                  <span>Separate HTML files per module - Bookmarkable URLs - Delta publish support</span>
                ) : (
                  <span>Single HTML file - Sidebar navigation - Instant switching - State preserved</span>
                )}
              </div>
            </div>

            {/* Status indicator */}
            {betaPublishStatus && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                betaPublishStatus === 'loading' ? 'bg-sky-900/50 border border-sky-700 text-sky-300' :
                betaPublishStatus === 'success' ? 'bg-emerald-900/50 border border-emerald-700 text-emerald-300' :
                'bg-rose-900/50 border border-rose-700 text-rose-300'
              }`}>
                {betaPublishStatus === 'loading' && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                {betaPublishStatus === 'success' && <CheckCircle size={14} />}
                {betaPublishStatus === 'error' && <AlertTriangle size={14} />}
                {betaPublishMessage}
              </div>
            )}

            {/* Full Publish Section */}
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">Full Publish</h4>
              <p className="text-xs text-slate-500 mb-4">Downloads a complete ZIP containing all active modules.</p>
              
              {/* Preview of files to be generated */}
              <div className="mb-4 p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Files to be generated:</div>
                <div className="text-xs font-mono text-slate-400 space-y-1">
                  {betaStructureMode === 'multi-file' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400"><FileCode size={14} /></span> index.html
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400"><FileJson size={14} /></span> manifest.json
                      </div>
                      {modules.filter(m => !excludedIds.includes(m.id) && !m.hidden).map(m => (
                        <div key={m.id} className="flex items-center gap-2 pl-2">
                          <span className="text-sky-400"><FolderOpen size={14} /></span> modules/{m.id}.html
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400"><FileCode size={14} /></span> index.html (single-page app with sidebar)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400"><FileJson size={14} /></span> manifest.json
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleFullPublishBeta}
                disabled={betaPublishStatus === 'loading' || modules.filter(m => !excludedIds.includes(m.id) && !m.hidden).length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download size={16} /> Full Publish (ZIP)
              </button>
            </div>

            {/* Delta Publish Section (only for multi-file mode) */}
            {betaStructureMode === 'multi-file' && (
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <h4 className="text-sm font-bold text-sky-400 mb-2 uppercase tracking-wider">Delta Publish (Selected Modules Only)</h4>
              <p className="text-xs text-slate-500 mb-4">Select specific modules to include in a partial update ZIP.</p>

              {/* Include manifest checkbox */}
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={betaIncludeManifest}
                  onChange={(e) => setBetaIncludeManifest(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-sky-600"
                />
                <span className="text-sm text-slate-300">Include manifest.json</span>
              </label>

              {/* Module selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Select Modules</label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllBetaModules}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={deselectAllBetaModules}
                      className="text-[10px] text-slate-500 hover:text-slate-400 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="bg-slate-950 rounded-lg border border-slate-800 max-h-48 overflow-y-auto p-2 space-y-1">
                  {modules.filter(m => !excludedIds.includes(m.id) && !m.hidden).map(m => (
                    <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={betaSelectedModules.includes(m.id)}
                        onChange={() => toggleBetaModuleSelection(m.id)}
                        className="rounded border-slate-600 bg-slate-900 text-sky-600"
                      />
                      <span className="text-sm text-slate-300">{m.title}</span>
                      <span className="text-[10px] text-slate-600 font-mono ml-auto">{m.id}</span>
                    </label>
                  ))}
                  {modules.filter(m => !excludedIds.includes(m.id) && !m.hidden).length === 0 && (
                    <p className="text-xs text-slate-500 italic p-2 text-center">No active modules</p>
                  )}
                </div>
              </div>

              {/* Delta files preview */}
              {betaSelectedModules.length > 0 && (
                <div className="mb-4 p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Delta ZIP will contain:</div>
                  <div className="text-xs font-mono text-slate-400 space-y-1">
                    {betaIncludeManifest && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400"><FileJson size={14} /></span> manifest.json
                      </div>
                    )}
                    {betaSelectedModules.map(modId => {
                      const mod = modules.find(m => m.id === modId);
                      return (
                        <div key={modId} className="flex items-center gap-2 pl-2">
                          <span className="text-sky-400"><FolderOpen size={14} /></span> modules/{modId}.html
                          {mod && <span className="text-slate-600 text-[10px]">({mod.title})</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleDeltaPublishBeta}
                disabled={betaPublishStatus === 'loading' || betaSelectedModules.length === 0}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download size={16} /> Publish Selected (Delta ZIP)
                {betaSelectedModules.length > 0 && (
                  <span className="bg-sky-800 px-2 py-0.5 rounded text-xs">{betaSelectedModules.length} selected</span>
                )}
              </button>
            </div>
            )}
          </div>
        )}

        {/* --- EXPORT MODULE PAGE UI --- */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LayoutTemplate size={20} className="text-blue-400" /> Export Single Module Page
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Primary Module</label>
                    <select 
                        value={exportModuleId} 
                        onChange={(e) => setExportModuleId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                    >
                        <option value="">-- Choose a Module --</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                </div>

                {exportModuleId && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-48 overflow-y-auto">
                            <label className="block text-xs font-bold text-purple-400 uppercase mb-2 sticky top-0 bg-slate-950 pb-2">Include Assessments</label>
                            <div className="space-y-2">
                                {modules.flatMap(m => m.assessments || []).map(a => (
                                    <label key={a.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={exportAssessments.includes(a.id)}
                                            onChange={(e) => e.target.checked ? setExportAssessments([...exportAssessments, a.id]) : setExportAssessments(exportAssessments.filter(id => id !== a.id))}
                                            className="rounded border-slate-700 bg-slate-900 text-purple-600"
                                        />
                                        <span className="text-xs text-slate-300 truncate">{a.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-48 overflow-y-auto">
                            <label className="block text-xs font-bold text-cyan-400 uppercase mb-2 sticky top-0 bg-slate-950 pb-2">Include Materials</label>
                            <div className="space-y-2">
                                {materials.map(mat => (
                                    <label key={mat.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={exportMaterials.includes(mat.id)}
                                            onChange={(e) => e.target.checked ? setExportMaterials([...exportMaterials, mat.id]) : setExportMaterials(exportMaterials.filter(id => id !== mat.id))}
                                            className="rounded border-slate-700 bg-slate-900 text-cyan-600"
                                        />
                                        <span className="text-xs text-slate-300 truncate">{mat.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-48 overflow-y-auto">
                            <label className="block text-xs font-bold text-orange-400 uppercase mb-2 sticky top-0 bg-slate-950 pb-2">Include Tools</label>
                            <div className="space-y-2">
                                {toolkit.map(t => (
                                    <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={exportTools.includes(t.id)}
                                            onChange={(e) => e.target.checked ? setExportTools([...exportTools, t.id]) : setExportTools(exportTools.filter(id => id !== t.id))}
                                            className="rounded border-slate-700 bg-slate-900 text-orange-600"
                                        />
                                        <span className="text-xs text-slate-300 truncate">{t.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={generateModulePageHTML} 
                    disabled={!exportModuleId}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileCode size={16} /> Generate Module HTML
                </button>

                {exportedHTML && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-emerald-400">Successfully generated.</span>
                            <button onClick={() => navigator.clipboard.writeText(exportedHTML)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded flex items-center gap-1"><Copy size={12}/> Copy Code</button>
                        </div>
                        <textarea readOnly value={exportedHTML} className="w-full h-32 bg-black border border-emerald-900/50 rounded-lg p-3 text-[10px] font-mono text-emerald-500/80 focus:outline-none resize-y" />
                    </div>
                )}
            </div>
        </div>

        {/* --- LEGACY COMPILE UI (only shown in legacy mode) --- */}
        {publishMode === 'legacy' && (
        <>
        {!isGenerated ? (
            <div className="text-center py-6">
                <div className="mb-6 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden text-left">
                    <div className="p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Build Configuration
                    </div>
                    <div className="divide-y divide-slate-800">
                        {modules.length === 0 && (
                             <div className="p-4 text-xs text-slate-500 italic text-center">No modules found. Go to Phase 1.</div>
                        )}
                        {modules.map((mod) => {
                            const isExcluded = excludedIds.includes(mod.id) || mod.hidden;
                            return (
                                <div key={mod.id} className="p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isExcluded ? 'bg-slate-600' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                        <span className={`text-sm ${isExcluded ? 'text-slate-500' : 'text-slate-200 font-medium'}`}>{mod.title}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (mod.hidden && onToggleHidden) {
                                                // If hidden, show it first (which will also remove from excludedIds)
                                                onToggleHidden(mod.id);
                                            } else {
                                                // Otherwise toggle exclusion
                                                toggleModule(mod.id);
                                            }
                                        }}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${!isExcluded ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${!isExcluded ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* GLOBAL TOOLKIT CONTROLS */}
                {toolkit.length > 0 && (
                    <div className="mb-6 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden text-left">
                        <div className="p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-orange-500 uppercase tracking-wider">
                            Global Toolkit (Builder Controls)
                        </div>
                        <div className="divide-y divide-slate-800">
                            {toolkit.map((tool, idx) => (
                                <div key={tool.id || idx} className="p-4 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${tool.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                            <div>
                                                <div className={`text-sm font-medium ${tool.enabled ? 'text-slate-200' : 'text-slate-500'}`}>{tool.title}</div>
                                                <div className="text-[10px] text-slate-500 italic">{tool.description}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleToolkitField(idx, 'enabled')}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${tool.enabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${tool.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                    {tool.enabled && (
                                        <div className="ml-5 mt-2 flex flex-wrap gap-3 text-[10px]">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={!!tool.hiddenFromUser}
                                                    onChange={() => toggleToolkitField(idx, 'hiddenFromUser')}
                                                    className="w-3 h-3 rounded"
                                                />
                                                <span className="text-slate-400">Hidden from user</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={!!tool.userToggleable}
                                                    onChange={() => toggleToolkitField(idx, 'userToggleable')}
                                                    disabled={!!tool.hiddenFromUser}
                                                    className="w-3 h-3 rounded disabled:opacity-30"
                                                />
                                                <span className={`${tool.hiddenFromUser ? 'text-slate-600' : 'text-slate-400'}`}>User can toggle</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={!!tool.includeUi}
                                                    onChange={() => toggleToolkitField(idx, 'includeUi')}
                                                    className="w-3 h-3 rounded"
                                                />
                                                <span className="text-slate-400">Include UI</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Validation summary */}
                {compileValidation && (
                  <div className={`mb-6 rounded-xl border p-4 text-left ${compileValidation.errors.length > 0 ? 'bg-rose-950/40 border-rose-700' : 'bg-amber-950/40 border-amber-700'}`}>
                    {compileValidation.errors.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 text-rose-300 font-bold mb-2">
                          <AlertTriangle size={18} />
                          {compileValidation.errors.length} validation error{compileValidation.errors.length !== 1 ? 's' : ''} - fix before compiling
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-rose-200/90">
                          {compileValidation.errors.map((e, i) => (
                            <li key={i}>
                              <span className="text-rose-400/80">{typeof e === 'object' && e.context ? e.context + ': ' : ''}</span>
                              {typeof e === 'object' && e.message ? e.message : e}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : compileValidation.warnings.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                          <AlertTriangle size={18} />
                          {compileValidation.warnings.length} warning{compileValidation.warnings.length !== 1 ? 's' : ''}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-amber-200/90">
                          {compileValidation.warnings.map((w, i) => (
                            <li key={i}>
                              <span className="text-amber-400/80">{typeof w === 'object' && w.context ? w.context + ': ' : ''}</span>
                              {typeof w === 'object' && w.message ? w.message : w}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                )}

                {legacyEmbedNeedsAssetBase && (
                  <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-left">
                    <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                      <AlertTriangle size={16} />
                      Google Sites warning: local material files need Asset Base URL
                    </div>
                    <p className="text-sm text-amber-200/90">
                      Found {localMaterialAssets.length} local material reference(s) (for example <code>/materials/file.pdf</code>).
                      These paths will fail in Google Sites unless you set <strong>Asset Base URL</strong> above.
                    </p>
                  </div>
                )}

                <button 
                    onClick={handleCompileClick}
                    disabled={modules.length === 0}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Package size={24} /> Compile Selected Modules
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-purple-400">Final Assembled Code (index.html)</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={downloadFile}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded flex items-center gap-2"
                        >
                            <Download size={12} /> Download File
                        </button>
                        <button 
                            onClick={() => { setIsGenerated(false); setCompileValidation(null); }}
                            className="text-xs text-slate-500 hover:text-white px-2 py-1"
                        >
                            Reset
                        </button>
                    </div>
                </div>
                {compileValidation?.warnings?.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-950/40 border border-amber-700 rounded-xl text-left">
                    <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                      <AlertTriangle size={16} />
                      Compiled with {compileValidation.warnings.length} warning{compileValidation.warnings.length !== 1 ? 's' : ''}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-200/90">
                      {compileValidation.warnings.map((w, i) => (
                        <li key={i}>
                          <span className="text-amber-400/80">{typeof w === 'object' && w.context ? w.context + ': ' : ''}</span>
                          {typeof w === 'object' && w.message ? w.message : w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <CodeBlock label="Full Website Source" code={fullSiteCode} height="h-96" />
                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg text-sm text-purple-200">
                    <strong>Next Step:</strong> Download the file above, or copy the block and paste it into your Google Sites "Embed Code" widget.
                </div>
            </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default Phase4;
