// Extracted generators (Headless Golden Baseline)
// NOTE: Keep logic stable; edit with care.
import { compileComposerModule } from '../composer/compileModuleHtml.js';

export const getAccentColor = (accentColor) => {
  const colorMap = {
    sky: { hex: '#0ea5e9', dark: '#0284c7', light: '#38bdf8' },
    rose: { hex: '#f43f5e', dark: '#e11d48', light: '#fb7185' },
    emerald: { hex: '#10b981', dark: '#059669', light: '#34d399' },
    amber: { hex: '#f59e0b', dark: '#d97706', light: '#fbbf24' },
    purple: { hex: '#a855f7', dark: '#9333ea', light: '#c084fc' },
    indigo: { hex: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
    pink: { hex: '#ec4899', dark: '#db2777', light: '#f472b6' },
    teal: { hex: '#14b8a6', dark: '#0d9488', light: '#2dd4bf' }
  };
  return colorMap[accentColor] || colorMap.sky;
};

export const getFontFamilyGlobal = (fontFamily) => {
  const fonts = {
    inter: {
      url: 'https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400;0,700;1,400;1,900&display=swap',
      css: "font-family: 'Inter', sans-serif;"
    },
    roboto: {
      url: 'https://fonts.googleapis.com/css?family=Roboto:ital,wght@0,400;0,700;1,400;1,900&display=swap',
      css: "font-family: 'Roboto', sans-serif;"
    },
    opensans: {
      url: 'https://fonts.googleapis.com/css?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Open Sans', sans-serif;"
    },
    lato: {
      url: 'https://fonts.googleapis.com/css?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Lato', sans-serif;"
    },
    montserrat: {
      url: 'https://fonts.googleapis.com/css?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Montserrat', sans-serif;"
    },
    poppins: {
      url: 'https://fonts.googleapis.com/css?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Poppins', sans-serif;"
    },
    raleway: {
      url: 'https://fonts.googleapis.com/css?family=Raleway:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Raleway', sans-serif;"
    },
    nunito: {
      url: 'https://fonts.googleapis.com/css?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      css: "font-family: 'Nunito', sans-serif;"
    }
  };
  return fonts[fontFamily] || fonts.inter;
};

function normalizePreviewStorageToken(value, fallback = 'preview') {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = raw.replace(/[^a-z0-9:_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

export function buildPreviewStorageScope(prefix, identity) {
  const safePrefix = normalizePreviewStorageToken(prefix, 'preview');
  const safeIdentity = normalizePreviewStorageToken(identity, 'module');
  return `${safePrefix}:${safeIdentity}`.slice(0, 160);
}

export function buildScopedStorageBootstrapScript(storageScope) {
  const scope = normalizePreviewStorageToken(storageScope, '');
  if (!scope) return '';
  const safeScope = scope.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
(function() {
  var scope = '${safeScope}';
  if (!scope) return;
  var prefix = 'cf_preview_scope::' + scope + '::';
  if (window.__cfPreviewStoragePrefix === prefix) return;
  window.__cfPreviewStoragePrefix = prefix;

  function toScopedKey(key) {
    var safeKey = key == null ? '' : String(key);
    return safeKey.indexOf(prefix) === 0 ? safeKey : prefix + safeKey;
  }

  function patchStorage(storage) {
    if (!storage) return;
    var proto = Object.getPrototypeOf(storage);
    if (!proto) return;
    if (proto.__cfPreviewStoragePatchedPrefix === prefix) return;
    if (proto.__cfPreviewStoragePatchedPrefix) return;

    var originalGetItem = typeof proto.getItem === 'function' ? proto.getItem : null;
    var originalSetItem = typeof proto.setItem === 'function' ? proto.setItem : null;
    var originalRemoveItem = typeof proto.removeItem === 'function' ? proto.removeItem : null;
    var originalClear = typeof proto.clear === 'function' ? proto.clear : null;
    var originalKey = typeof proto.key === 'function' ? proto.key : null;

    if (originalGetItem) {
      proto.getItem = function(key) {
        return originalGetItem.call(this, toScopedKey(key));
      };
    }
    if (originalSetItem) {
      proto.setItem = function(key, value) {
        return originalSetItem.call(this, toScopedKey(key), value);
      };
    }
    if (originalRemoveItem) {
      proto.removeItem = function(key) {
        return originalRemoveItem.call(this, toScopedKey(key));
      };
    }
    if (originalClear && originalKey && originalRemoveItem) {
      proto.clear = function() {
        var prefixedKeys = [];
        for (var i = 0; i < this.length; i += 1) {
          var current = originalKey.call(this, i);
          if (typeof current === 'string' && current.indexOf(prefix) === 0) {
            prefixedKeys.push(current);
          }
        }
        prefixedKeys.forEach(function(current) {
          originalRemoveItem.call(this, current);
        }, this);
      };
    }

    proto.__cfPreviewStoragePatchedPrefix = prefix;
  }

  try { patchStorage(window.localStorage); } catch (err) {}
  try { patchStorage(window.sessionStorage); } catch (err) {}
})();
`.trim();
}

export function buildScopedStorageBootstrapTag(storageScope) {
  const script = buildScopedStorageBootstrapScript(storageScope);
  if (!script) return '';
  return `<script>${script}<\\/script>`;
}

function injectScopedStorageBootstrapIntoHtml(rawHtml, storageScope) {
  const input = String(rawHtml || '');
  const bootstrapTag = buildScopedStorageBootstrapTag(storageScope);
  if (!bootstrapTag) return input;
  if (/<head[^>]*>/i.test(input)) {
    return input.replace(/<head[^>]*>/i, (match) => `${match}${bootstrapTag}`);
  }
  if (/<body[^>]*>/i.test(input)) {
    return input.replace(/<body[^>]*>/i, (match) => `${match}${bootstrapTag}`);
  }
  return `${bootstrapTag}${input}`;
}

export const generateMasterShell = (data) => {
  const {
    courseName = "Course Factory",
    courseNameUpper = "COURSE FACTORY",
    accentColor = "sky",
    backgroundColor = "slate-900",
    fontFamily = "inter",
    customCSS = "",
    courseInfo = "",
    navItems = "",
    content = "",
    scripts = "",
    progressTracking = "",
    containerBgRgba = null,
    layoutSettings = { showSidebar: true, showFooter: true, navPosition: 'side' }
  } = data;
  
  const colors = getAccentColor(accentColor);
  const font = getFontFamilyGlobal(fontFamily);
  
  // Map Tailwind color names to hex values for background
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
  const textColor = isLightBg ? '#0f172a' : '#e2e8f0';
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(15, 23, 42, ${alpha})`;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return `rgba(15, 23, 42, ${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const sidebarBg = hexToRgba(bgHex, isLightBg ? 0.92 : 0.95);
  const sidebarBorder = isLightBg ? 'rgba(15, 23, 42, 0.12)' : 'rgba(51, 65, 85, 0.5)';
  const sidebarHoverBg = isLightBg ? hexToRgba(bgHex, 0.98) : 'rgba(30, 41, 59, 0.95)';
  const containerBgVar = containerBgRgba || hexToRgba(isLightBg ? '#ffffff' : '#0f172a', 0.8);
  const headingTextClass = isLightBg ? 'text-slate-900' : 'text-white';
  
  const showSidebar = layoutSettings?.showSidebar !== false;
  const showFooter = layoutSettings?.showFooter !== false;
  const navPosition = layoutSettings?.navPosition || 'side';
  const useTopNav = navPosition === 'top';

  // Build styles with accent color applied
  const baseStyles = `        /* --- GLOBAL & SHARED STYLES --- */
        html, body { background-color: ${bgHex} !important; }
        body { ${font.css} color: ${textColor}; margin: 0; height: 100vh; overflow: hidden; }
        :root { --cf-container-bg: ${containerBgVar}; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass-panel { background: ${sidebarBg}; border-right: 1px solid ${sidebarBorder}; }
        .custom-scroll { overflow-y: auto; }
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(51, 65, 85, 0.5); }
        input:not(.assessment-input), textarea:not(.assessment-input), select:not(.assessment-input) { background: #0f172a !important; border: 1px solid #1e293b !important; transition: all 0.2s; color: #e2e8f0; }
        input:not(.assessment-input):focus, textarea:not(.assessment-input):focus, select:not(.assessment-input):focus { border-color: ${colors.hex} !important; outline: none; box-shadow: 0 0 0 1px ${colors.hex}; }
        
        /* Navigation */
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; transition: all 0.2s; border-left: 2px solid transparent; }
        .nav-item:hover { background: rgba(30, 41, 59, 0.5); color: #e2e8f0; }
        .nav-item.active { background: rgba(14, 165, 233, 0.1); color: ${colors.light}; border-left: 2px solid ${colors.light}; }

        /* Module Buttons & Tabs */
        .score-btn, .mod-nav-btn, .nav-btn { background: #0f172a; border: 1px solid #1e293b; color: #64748b; transition: all 0.2s; }
        .score-btn:hover, .mod-nav-btn:hover, .nav-btn:hover { border-color: ${colors.hex}; color: white; }
        .score-btn.active, .mod-nav-btn.active, .nav-btn.active { background: ${colors.hex}; color: #000; font-weight: 900; border-color: ${colors.hex}; }
        
        /* Layout Helpers */
        .phase-header { border-left: 4px solid #334155; padding-left: 1rem; margin-bottom: 1rem; }
        .phase-header.active { border-color: ${colors.hex}; }
        .step-content { display: none; }
        .step-content.active { display: block; }
        .rubric-cell { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .rubric-cell:hover { background: rgba(255,255,255,0.05); }
        .active-proficient { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; }
        .active-developing { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #f59e0b; }
        .active-emerging { background: rgba(244, 63, 94, 0.2); border: 1px solid #f43f5e; color: #f43f5e; }
        .helper-text { font-size: 8px; color: #64748b; font-style: italic; margin-top: 4px; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .info-card { background: rgba(30, 41, 59, 0.4); border-left: 3px solid ${colors.hex}; padding: 1.5rem; border-radius: 0.75rem; }
        .top-ten-input { font-size: 0.75rem; padding: 0.5rem !important; border-radius: 0.375rem !important; }
        
        /* Animations */
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .status-saved { animation: pulse-green 2s infinite; }
        .scan-line { height: 2px; width: 100%; background: rgba(0, 255, 65, 0.2); position: absolute; animation: scan 3s linear infinite; pointer-events: none; }
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
        
        /* Sidebar Toggle - Works on ALL screen sizes */
        .sidebar-toggle { 
            position: fixed; 
            top: 1rem; 
            left: 1rem; 
            z-index: 100; 
            background: ${sidebarBg}; 
            border: 1px solid ${sidebarBorder}; 
            color: ${textColor}; 
            padding: 0.75rem; 
            border-radius: 0.5rem; 
            cursor: pointer; 
            font-size: 1.25rem; 
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
        }
        .sidebar-toggle:hover { background: ${sidebarHoverBg}; border-color: ${colors.hex}; }

        /* Materials & Assessments Container Colors */
        /* Material cards use per-material theme (Phase 1 card theme); do NOT override. */
        #view-assessments .assessment-card {
            background: var(--cf-container-bg) !important;
        }
        #view-assessments .assessment-container [class*="bg-slate-9"],
        #view-assessments .assessment-container [class*="bg-slate-8"],
        #view-assessments .assessment-container [class*="bg-slate-7"],
        #view-assessments .assessment-container [class*="bg-slate-6"],
        #view-assessments .assessment-container [class*="bg-gray-9"],
        #view-assessments .assessment-container [class*="bg-gray-8"],
        #view-assessments .assessment-container [class*="bg-gray-7"] {
            background: var(--cf-container-bg) !important;
        }
        
        /* Overlay for mobile */
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 60; backdrop-filter: blur(4px); pointer-events: none; }
        .sidebar-overlay.active { display: block; pointer-events: auto; }
        
        /* Sidebar - Collapsible on all sizes */
        #sidebar-nav {
            transition: width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
            min-width: 16rem;
            overflow: hidden;
        }
        #sidebar-nav.collapsed {
            width: 0 !important;
            min-width: 0 !important;
            opacity: 0;
            pointer-events: none;
            transform: translateX(-100%);
        }
        
        /* Content fills available space */
        #content-container {
            flex: 1;
            transition: all 0.3s ease;
            width: 100%;
            background: ${bgHex} !important;
            background-color: ${bgHex} !important;
        }
        
        /* Toggle button position */
        .sidebar-toggle {
            transition: left 0.3s ease;
        }
        body:not(.sidebar-collapsed) .sidebar-toggle {
            left: calc(16rem + 1rem); /* 16rem = w-64 sidebar width + margin */
        }
        body.sidebar-collapsed .sidebar-toggle {
            left: 1rem;
        }
        
        @media (max-width: 768px) {
            /* On mobile, sidebar overlays content */
            #sidebar-nav { 
                position: fixed; 
                left: 0;
                top: 0; 
                bottom: 0; 
                z-index: 80; 
                width: 80% !important;
                max-width: 280px;
                min-width: 0;
            }
            #sidebar-nav:not(.collapsed) {
                opacity: 1;
                transform: translateX(0);
            }
            #sidebar-nav.collapsed {
                transform: translateX(-100%);
                width: 80% !important;
            }
            /* Toggle always on left on mobile */
            .sidebar-toggle,
            body:not(.sidebar-collapsed) .sidebar-toggle,
            body.sidebar-collapsed .sidebar-toggle {
                left: 1rem !important;
            }
            #content-container {
                width: 100% !important;
            }
        }`;
  
  const bodyClass = useTopNav ? 'flex flex-col' : 'flex';
  const sidebarToggleHtml = showSidebar && !useTopNav
    ? `    <button class="sidebar-toggle" onclick="toggleSidebar()" aria-label="Toggle navigation" title="Toggle Menu">&#9776;</button>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>`
    : '';
  const sidebarFooterHtml = showFooter
    ? `        <div class="p-6 border-t border-slate-800 text-center"><p class="text-[9px] text-slate-600 italic">"Recognition is the trigger for regulation."</p></div>`
    : '';
  const sidebarHtml = showSidebar && !useTopNav
    ? `    <div id="sidebar-nav" class="w-64 glass-panel flex flex-col h-full z-50">
        <div class="p-8 border-b border-slate-800">
            <h1 class="text-xl font-black italic ${headingTextClass} tracking-tighter uppercase leading-none"><span class="text-${accentColor}-500">${courseName}</span></h1>
            <p class="text-[10px] text-slate-500 mt-2 mono uppercase tracking-widest">Master Console v2.0</p>${courseInfo}
        </div>
        <nav class="flex-1 overflow-y-auto py-4 space-y-1" id="main-nav">
            <div class="px-4 py-2 mt-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest mono">System Modules</div>
            ${navItems}
        </nav>
${sidebarFooterHtml}
    </div>`
    : '';
  const topNavHtml = useTopNav
    ? `    <header class="w-full border-b border-slate-800 backdrop-blur-sm" style="background: ${bgHex}; background-color: ${bgHex};">
        <div class="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
                <h1 class="text-lg font-bold flex items-center gap-2 ${headingTextClass}"><span class="text-${accentColor}-500">${courseName}</span></h1>
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-mono">MASTER CONSOLE</p>
            </div>
            <nav class="flex-1 overflow-x-auto">
                <div class="flex items-center gap-2 justify-end min-w-max">
                    ${navItems}
                </div>
            </nav>
        </div>
    </header>`
    : '';
  const footerHtml = showFooter && (useTopNav || !showSidebar)
    ? `    <footer class="w-full border-t border-slate-800 backdrop-blur-sm" style="background: ${bgHex}; background-color: ${bgHex};">
        <div class="max-w-[1800px] mx-auto px-6 py-4 text-[10px] text-slate-500 uppercase tracking-widest text-center">
            Master Console v2.0
        </div>
    </footer>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${courseNameUpper} | MASTER CONSOLE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="${font.url}" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}${customCSS ? `\n        /* Custom CSS from Settings */\n        ${customCSS}` : ''}
    </style>
    <script>
        // Force background color after Tailwind loads
        (function() {
            function setBackground() {
                document.documentElement.style.backgroundColor = '${bgHex}';
                document.documentElement.style.background = '${bgHex}';
                if (document.body) {
                    document.body.style.backgroundColor = '${bgHex}';
                    document.body.style.background = '${bgHex}';
                }
            }
            setBackground();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setBackground);
            }
            setTimeout(setBackground, 100);
            setTimeout(setBackground, 500);
        })();
    </script>
</head>
<body class="${bodyClass}" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
    <!-- Sidebar Toggle Button (Works on ALL screen sizes) -->
${sidebarToggleHtml}

${topNavHtml}
${sidebarHtml}

    <div class="flex-1 relative h-full overflow-hidden" id="content-container">
        ${content}
        <iframe id="view-external" class="w-full h-full hidden" src=""></iframe>
    </div>

${footerHtml}

    <!-- MODULE SCRIPTS CONTAINER -->
    <script id="module-scripts">
        window.CF_ASSET_BASE_URL = window.CF_ASSET_BASE_URL || '';
        ${scripts}${progressTracking ? '\n        ' + progressTracking : ''}
    </script>

    <script>
        // --- SIDEBAR TOGGLE (Works on ALL screen sizes) ---
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar-nav');
            const overlay = document.getElementById('sidebar-overlay');
            const body = document.body;
            
            if (sidebar) {
                const isCollapsed = sidebar.classList.toggle('collapsed');
                body.classList.toggle('sidebar-collapsed', isCollapsed);
                
                // Show overlay on mobile when sidebar is open
                if (overlay && window.innerWidth <= 768) {
                    overlay.classList.toggle('active', !isCollapsed);
                }
                
                // Save preference
                try {
                    localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
                } catch(e) {}
            }
        }
        
        // Initialize sidebar state from localStorage
        document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.getElementById('sidebar-nav');
            const body = document.body;
            
            try {
                const savedState = localStorage.getItem('sidebarCollapsed');
                // On mobile, default to collapsed. On desktop, respect saved preference
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('collapsed');
                    body.classList.add('sidebar-collapsed');
                } else if (savedState === 'true') {
                    sidebar.classList.add('collapsed');
                    body.classList.add('sidebar-collapsed');
                }
            } catch(e) {}
            
            // Prevent overlay clicks from propagating to sidebar
            if (sidebar) {
                sidebar.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        });
        
        // --- CORE NAVIGATION LOGIC ---
        function switchView(view) {
            console.log('[switchView] Switching to view:', view);
            
            // 1. Close sidebar on mobile after selecting a view
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar-nav');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar && !sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                    document.body.classList.add('sidebar-collapsed');
                    if (overlay) overlay.classList.remove('active');
                }
            }
            
            // 2. Update Nav Buttons
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            const navBtn = document.getElementById('nav-' + view);
            if(navBtn) navBtn.classList.add('active');
            
            // 3. Hide All Views (both native divs and iframe containers)
            const allViews = document.querySelectorAll('[id^="view-"]');
            console.log('[switchView] Hiding', allViews.length, 'views');
            allViews.forEach(v => v.classList.add('hidden'));

            // 4. Show Target View
            const target = document.getElementById('view-' + view);
            if(target) {
                target.classList.remove('hidden');
                console.log('[switchView] Showing view:', 'view-' + view);
            } else {
                console.error('Error: [switchView] View not found:', 'view-' + view);
            }
            
            // Backward compatibility: Call module init if available
            if (window.COURSE_FACTORY_MODULES && window.COURSE_FACTORY_MODULES[view] && window.COURSE_FACTORY_MODULES[view].init) {
                try {
                    window.COURSE_FACTORY_MODULES[view].init();
                } catch(e) {
                    console.error('Module init error:', e);
                }
            }
        }

        function isGoogleSitesHost() {
            var ref = '';
            try { ref = document.referrer || ''; } catch (e) { ref = ''; }
            if (/sites\.google\.com/i.test(ref)) return true;
            try { return /sites\.google\.com/i.test(window.top.location.host || ''); } catch (e) { return /sites\.google\.com/i.test(ref); }
        }
        function getPdfEmbedUrl(url) {
            if (!url) return url;
            var clean = String(url).trim();
            if (!clean) return clean;
            if (clean.indexOf('docs.google.com/viewer') !== -1) return clean;
            var isDrive = clean.indexOf('drive.google.com') !== -1;
            if (isDrive) {
                var driveIdMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
                if (driveIdMatch && driveIdMatch[1]) {
                    return 'https://drive.google.com/file/d/' + driveIdMatch[1] + '/preview';
                }
                if (clean.indexOf('/view') !== -1) {
                    return clean.replace('/view', '/preview');
                }
                return clean;
            }
            if (/^(\/|\.\/|\.\.\/|blob:|data:)/i.test(clean)) {
                return clean;
            }
            var isSameOrigin = false;
            try {
                var parsed = new URL(clean, window.location.href);
                isSameOrigin = parsed.origin === window.location.origin;
            } catch (e) {
                isSameOrigin = false;
            }
            if (isSameOrigin) {
                return clean;
            }
            var forceViewer = isGoogleSitesHost() || window.CF_FORCE_PDF_VIEWER === true;
            if (forceViewer && /^https?:\/\//i.test(clean)) {
                return 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(clean);
            }
            return clean;
        }

        function openPDF(url, title) {
            const container = document.getElementById('pdf-viewer-container');
            const previewUrl = getPdfEmbedUrl(url);
            document.getElementById('pdf-frame').src = previewUrl || '';
            document.getElementById('viewer-title').innerText = "VIEWING: " + title;
            container.classList.remove('hidden');
            container.scrollIntoView({ behavior: 'smooth' });
        }

        function closeViewer() {
            document.getElementById('pdf-viewer-container').classList.add('hidden');
            document.getElementById('pdf-frame').src = "";
        }
        
        // ========================================
        // GLOBAL AUTOSAVE SYSTEM
        // ========================================
        (function() {
            // Course-specific storage key (prevents collisions between courses)
            const COURSE_KEY = 'CF_' + '${courseName}'.replace(/[^a-zA-Z0-9]/g, '_') + '_v1';
            let hasExported = false;
            let saveTimeout = null;
            
            // Get all input state from the parent document (not iframes - they handle themselves)
            function getAllInputState() {
                const state = {};
                // Only target inputs NOT inside iframes
                document.querySelectorAll('#content-container input, #content-container textarea, #content-container select').forEach((el, i) => {
                    // Skip if inside an iframe (parent document only)
                    if (el.closest('iframe')) return;
                    
                    const key = el.id || el.name || ('field_' + i + '_' + (el.className || '').slice(0, 20));
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        if (el.checked) state[key] = el.type === 'radio' ? el.value : true;
                    } else {
                        if (el.value) state[key] = el.value;
                    }
                });
                return state;
            }
            
            // Restore input state
            function restoreInputState(state) {
                if (!state || typeof state !== 'object') return;
                
                document.querySelectorAll('#content-container input, #content-container textarea, #content-container select').forEach((el, i) => {
                    if (el.closest('iframe')) return;
                    
                    const key = el.id || el.name || ('field_' + i + '_' + (el.className || '').slice(0, 20));
                    const savedValue = state[key];
                    
                    if (savedValue !== undefined) {
                        if (el.type === 'checkbox') {
                            el.checked = !!savedValue;
                        } else if (el.type === 'radio') {
                            el.checked = (el.value === savedValue);
                        } else {
                            el.value = savedValue;
                        }
                        // Trigger change event so any listeners update
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
            
            // Save to localStorage
            function saveNow() {
                try {
                    const state = getAllInputState();
                    if (Object.keys(state).length > 0) {
                        localStorage.setItem(COURSE_KEY, JSON.stringify({
                            timestamp: Date.now(),
                            course: '${courseName}',
                            state: state
                        }));
                        console.log('[Autosave] Saved', Object.keys(state).length, 'fields');
                    }
                } catch(e) {
                    console.warn('Autosave failed:', e);
                }
            }
            
            // Debounced save (prevents saving on every keystroke)
            function debouncedSave() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveNow, 1000); // Save 1 second after last change
            }
            
            // Load saved state
            function loadSaved() {
                try {
                    const raw = localStorage.getItem(COURSE_KEY);
                    if (raw) {
                        const { state, timestamp } = JSON.parse(raw);
                        if (state) {
                            restoreInputState(state);
                            const savedDate = new Date(timestamp);
                            console.log('[Autosave] Restored from', savedDate.toLocaleString());
                        }
                    }
                } catch(e) {
                    console.warn('Load saved failed:', e);
                }
            }
            
            // Mark work as exported (disables unsaved warning)
            window.markWorkSaved = function() {
                hasExported = true;
                console.log('[Autosave] Work marked as saved/exported');
            };
            
            // Initialize on DOM ready
            function init() {
                // 1. Load saved state
                setTimeout(loadSaved, 100); // Small delay to let DOM settle
                
                // 2. Autosave on any input change
                document.addEventListener('input', debouncedSave);
                document.addEventListener('change', debouncedSave);
                
                // 3. Save before page unload
                window.addEventListener('pagehide', saveNow);
                window.addEventListener('beforeunload', function(e) {
                    saveNow(); // Always save
                    
                    // Warn if not exported and has content
                    if (!hasExported) {
                        const state = getAllInputState();
                        if (Object.keys(state).length > 0) {
                            e.preventDefault();
                            e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
                            return e.returnValue;
                        }
                    }
                });
                
                console.log('[Autosave] Initialized for course: ${courseName}');
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();
    </script>
</body>
</html>`;
};

export function getModuleType(module) {
  if (module.type === 'standalone' || module.type === 'external') {
    return module.type;
  }
  // Check if it has direct html/css/script (standalone without type)
  if (module.html && !module.code?.html) {
    return 'standalone';
  }
  // Check if it has code property (legacy)
  if (module.code) {
    return 'legacy';
  }
  // Default to legacy for backwards compatibility
  return 'legacy';
}

export function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateUrl(url) {
  if (!url || !url.trim()) {
    return { isValid: false, safeUrl: '#', error: 'Empty URL' };
  }
  
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  // Reject dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return { isValid: false, safeUrl: '#', error: `Dangerous protocol: ${protocol}` };
    }
  }
  
  // Try to construct a URL object to validate format
  try {
    const urlObj = new URL(trimmed);
    // Only allow http, https, and relative URLs
    if (!['http:', 'https:', ''].includes(urlObj.protocol) && urlObj.protocol !== '') {
      return { isValid: false, safeUrl: '#', error: `Unsupported protocol: ${urlObj.protocol}` };
    }
    return { isValid: true, safeUrl: trimmed };
  } catch (e) {
    // If URL parsing fails, it might be a relative URL - allow it but escape it
    return { isValid: true, safeUrl: escapeHtml(trimmed) };
  }
}

export function getMaterialBadgeLabel(mat) {
  if (!mat) return '';
  const type = (mat.mediaType || '').toLowerCase();
  if (type === 'book') return 'BOOK';
  if (type === 'pdf') return 'PDF';
  if (type === 'video') return 'VID';
  if (type === 'slides') return 'SLD';
  if (type === 'number' || !type) return mat.number || '';
  return mat.number || '';
}

function normalizeMaterialPathForMatch(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const clean = raw.split('#')[0].split('?')[0];
  const marker = '/materials/';
  const idx = clean.indexOf(marker);
  if (idx !== -1) return clean.substring(idx + marker.length).toLowerCase();
  if (clean.startsWith('materials/')) return clean.substring('materials/'.length).toLowerCase();
  return clean.toLowerCase();
}

function enrichComposerModuleResources(module, courseMaterials = []) {
  if (module?.mode !== 'composer') return module;
  const materials = Array.isArray(courseMaterials) ? courseMaterials : [];
  if (!materials.length) return module;

  const withDigital = materials.filter((mat) => mat && mat.digitalContent);
  if (!withDigital.length) return module;

  const findMaterialMatch = (item) => {
    const itemTitle = String(item?.label || '').trim().toLowerCase();
    const itemView = normalizeMaterialPathForMatch(item?.viewUrl || item?.url);
    const itemDownload = normalizeMaterialPathForMatch(item?.downloadUrl || item?.url);

    return withDigital.find((mat) => {
      const matTitle = String(mat?.title || '').trim().toLowerCase();
      const matNumber = String(mat?.number || '').trim().toLowerCase();
      const matId = String(mat?.id || '').trim().toLowerCase();
      const matView = normalizeMaterialPathForMatch(mat?.viewUrl);
      const matDownload = normalizeMaterialPathForMatch(mat?.downloadUrl);

      if (itemView && (itemView === matView || itemView === matDownload)) return true;
      if (itemDownload && (itemDownload === matView || itemDownload === matDownload)) return true;
      if (itemTitle && (itemTitle === matTitle || itemTitle === matNumber || itemTitle === matId)) return true;
      return false;
    });
  };

  const activities = Array.isArray(module?.activities) ? module.activities : [];
  const nextActivities = activities.map((activity) => {
    if (activity?.type !== 'resource_list') return activity;
    const items = Array.isArray(activity?.data?.items) ? activity.data.items : [];
    const nextItems = items.map((item) => {
      if (!item || item.digitalContent) return item;
      const matched = findMaterialMatch(item);
      if (!matched || !matched.digitalContent) return item;
      return {
        ...item,
        digitalContent: matched.digitalContent,
        viewUrl: item.viewUrl || item.url || matched.viewUrl || matched.downloadUrl || '',
        downloadUrl: item.downloadUrl || item.url || matched.downloadUrl || matched.viewUrl || '',
      };
    });
    return {
      ...activity,
      data: {
        ...(activity.data || {}),
        items: nextItems,
      },
    };
  });

  return {
    ...module,
    activities: nextActivities,
  };
}

export function extractModuleContent(module, courseMaterials = [], courseSettings = {}) {
  if (module?.mode === 'composer') {
    const composerModule = enrichComposerModuleResources(module, courseMaterials);
    const compiled = compileComposerModule(composerModule, { courseSettings });
    return {
      html: compiled.html || '',
      css: compiled.css || '',
      script: compiled.script || '',
      type: 'composer'
    };
  }

  const type = getModuleType(module);
  
  if (type === 'standalone') {
    return {
      html: module.html || '',
      css: module.css || '',
      script: module.script || '',
      type: 'standalone'
    };
  }
  
  if (type === 'external') {
    // Generate HTML based on linkType
    let html = '';
    if (module.linkType === 'iframe') {
      html = `<div id="${module.id}" class="w-full h-full" style="min-height: 600px;">
        <iframe src="${module.url}" width="100%" height="100%" style="border:none;" frameborder="0"></iframe>
      </div>`;
    } else {
      html = `<div id="${module.id}" class="w-full h-full p-8 text-center">
        <h2 class="text-2xl font-bold text-white mb-4">${module.title || 'External Module'}</h2>
        <p class="text-slate-400 mb-6">This module opens in a new tab.</p>
        <a href="${module.url}" target="_blank" rel="noopener noreferrer" 
           class="inline-block bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-lg text-sm font-bold uppercase transition-all">
          Open ${module.title || 'Module'}
        </a>
      </div>`;
    }
    return {
      html: html,
      css: '',
      script: '',
      type: 'external'
    };
  }
  
  // Legacy format
  let code = module.code || {};
  if (typeof code === 'string') {
    try {
      code = JSON.parse(code);
    } catch (e) {
      console.error('Failed to parse module code:', e);
      code = {};
    }
  }
  
  // Fallback: check if html/script are directly on module
  return {
    html: code.html || module.html || '',
    css: code.css || module.css || '',
    script: code.script || module.script || '',
    type: 'legacy'
  };
}

export function cleanModuleHTML(html) {
  if (!html) return '';
  
  let cleaned = html;
  
  // Remove HTML comments that break init checks
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove 'hidden' class
  cleaned = cleaned.replace(/class="([^"]*)\bhidden\b([^"]*)"/g, 'class="$1$2"');
  
  // Remove 'custom-scroll' class (not needed without navigation container)
  cleaned = cleaned.replace(/class="([^"]*)\bcustom-scroll\b([^"]*)"/g, 'class="$1$2"');
  
  // Remove 'h-full' and 'w-full' classes that cause overlap issues
  cleaned = cleaned.replace(/class="([^"]*)\bh-full\b([^"]*)"/g, 'class="$1$2"');
  cleaned = cleaned.replace(/class="([^"]*)\bw-full\b([^"]*)"/g, 'class="$1 w-auto max-w-full$2"');
  
  // Clean up any double spaces in class attributes
  cleaned = cleaned.replace(/class="([^"]*)"/g, (match) => {
    const cleanedClass = match.replace(/\s+/g, ' ').trim();
    return cleanedClass;
  });
  
  return cleaned;
}

export function cleanModuleScript(script) {
  return script ? script.trim() : '';
}

export function validateModule(module, isNew = false) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!module.id || !module.id.trim()) {
    errors.push('Module ID is required');
  } else {
    // ID format validation
    if (!module.id.startsWith('view-') && !module.id.startsWith('item-')) {
      warnings.push('Module ID should start with "view-" or "item-"');
    }
    
    // Check for invalid characters
    if (!/^[a-z0-9-_]+$/i.test(module.id)) {
      errors.push('Module ID can only contain letters, numbers, hyphens, and underscores');
    }
  }

  if (!module.title || !module.title.trim()) {
    errors.push('Module title is required');
  }

  // Type-specific validation
  if (module.type === 'standalone') {
    const moduleMode = module.mode === 'composer' ? 'composer' : 'custom_html';
    if (moduleMode === 'composer') {
      if (!Array.isArray(module.activities)) {
        errors.push('Composer modules must have an activities array');
      }
    } else {
      // Check for rawHtml (new format) OR html (legacy format)
      const hasContent = (module.rawHtml && module.rawHtml.trim()) || (module.html && module.html.trim());
      if (!hasContent) {
        errors.push('Standalone modules must have HTML content');
      }
    }
    // Note: We no longer require a root element with matching ID since modules run in iframes
  } else if (module.type === 'external') {
    if (!module.url || !module.url.trim()) {
      errors.push('External modules must have a URL');
    } else {
      // URL validation
      try {
        new URL(module.url);
      } catch (e) {
        errors.push('Invalid URL format');
      }
    }
    if (!module.linkType || !['iframe', 'newtab'].includes(module.linkType)) {
      errors.push('External modules must specify linkType as "iframe" or "newtab"');
    }
  } else if (!module.type) {
    // Legacy module
    if (!module.code) {
      errors.push('Legacy modules must have a code property');
    } else {
      let code = module.code;
      if (typeof code === 'string') {
        try {
          code = JSON.parse(code);
        } catch (e) {
          errors.push('Invalid code JSON format');
          return { isValid: false, errors, warnings };
        }
      }
      if (!code.html || !code.html.trim()) {
        errors.push('Legacy modules must have code.html');
      }
    }
  }

  // Script validation (warnings only - scripts might be optional)
  if (module.script) {
    // Check for common issues
    // Allow document.write() when used on popup windows (pw.document.write, win.document.write)
    // This is safe and commonly used for print functionality
    if (module.script.includes('document.write') && 
        !module.script.includes('pw.document.write') && 
        !module.script.includes('win.document.write')) {
      warnings.push('Using document.write() in the main window can cause issues. Ensure this is used on a popup window only.');
    }
    if (module.script.includes('window.location') && !module.script.includes('preventDefault')) {
      warnings.push('Direct window.location changes may break navigation');
    }
  }

  // CSS validation (warnings only)
  if (module.css) {
    // Check for unscoped selectors that might conflict (basic check)
    const hasUnscopedSelectors = /^[^{}@]+{/gm.test(module.css);
    if (hasUnscopedSelectors && module.id && !module.css.includes('#' + module.id)) {
      warnings.push('Some CSS selectors may not be scoped to the module ID - may cause conflicts');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateProject(projectData) {
  const errors = [];
  const warnings = [];
  const idsSeen = new Map(); // id -> { context, type: 'module'|'toolkit' }

  const modules = projectData["Current Course"]?.modules || [];
  const toolkit = projectData["Global Toolkit"] || [];

  const checkDuplicateId = (id, context, type) => {
    if (!id || !id.trim()) return;
    const existing = idsSeen.get(id);
    if (existing) {
      errors.push({
        message: `Duplicate ID "${id}" (also used in ${existing.context})`,
        context
      });
    } else {
      idsSeen.set(id, { context, type });
    }
  };

  modules.forEach((mod, idx) => {
    const ctx = `Module "${mod.title || mod.id || 'Untitled'}"`;
    checkDuplicateId(mod.id, ctx, 'module');
    const v = validateModule(mod, false);
    v.errors.forEach((e) => errors.push({ message: e, context: ctx }));
    v.warnings.forEach((w) => warnings.push({ message: w, context: ctx }));
  });

  toolkit.forEach((t, idx) => {
    const ctx = `Toolkit "${t.title || t.id || 'Untitled'}"`;
    checkDuplicateId(t.id, ctx, 'toolkit');
    const v = validateModule(t, false);
    v.errors.forEach((e) => errors.push({ message: e, context: ctx }));
    v.warnings.forEach((w) => warnings.push({ message: w, context: ctx }));
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export const buildModuleFrameHTML = (module, courseSettings) => {
  if (!module) return null;

  const settings = courseSettings || {};
  const scopedStorageBootstrapTag = buildScopedStorageBootstrapTag(settings.__storageScope);
  const courseName = settings.courseName || settings.__courseName || "Course";
  const accentColor = settings.accentColor || "sky";
  const backgroundColor = settings.backgroundColor || "slate-900";
  const fontFamily = settings.fontFamily || "inter";
  const customCSS = settings.customCSS || "";
  const enabledTools = (settings.__toolkit || []).filter(t => t.enabled);
  const courseMaterials = Array.isArray(settings.__materials)
    ? settings.__materials
    : (module.materials || []);

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
  const textColor = isLightBg ? 'text-slate-900' : 'text-white';
  const textColorSecondary = isLightBg ? 'text-slate-600' : 'text-slate-400';
  const textColorTertiary = isLightBg ? 'text-slate-500' : 'text-slate-500';
  const cardBorder = isLightBg ? 'border-slate-300' : 'border-slate-700';
  const headingTextColor = settings.headingTextColor || (isLightBg ? 'slate-900' : 'white');
  const secondaryTextColor = settings.secondaryTextColor || (isLightBg ? 'slate-600' : 'slate-400');
  const buttonColor = settings.buttonColor || `${accentColor}-600`;
  const containerColor = settings.containerColor || (isLightBg ? 'white/80' : 'slate-900/80');

  const toTextClass = (value) => value.startsWith('text-') ? value : `text-${value}`;
  const toBgBase = (value) => value.startsWith('bg-') ? value.slice(3) : value;
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
    ...bgColorMap,
    'slate-800': '#1e293b',
    'slate-700': '#334155',
    'slate-600': '#475569',
    'slate-500': '#64748b',
    'gray-800': '#1f2937',
    'gray-700': '#374151',
    'gray-600': '#4b5563',
    'zinc-800': '#27272a'
  };

  const headingTextClass = toTextClass(headingTextColor);
  const secondaryTextClass = toTextClass(secondaryTextColor);
  const buttonBgBase = toBgBase(buttonColor);
  const buttonBgClass = `bg-${buttonBgBase}`;
  const buttonHoverClass = buttonBgBase.endsWith('-600') ? `hover:bg-${buttonBgBase.replace(/-600$/, '-500')}` : `hover:bg-${buttonBgBase}`;
  const buttonTextClass = secondaryTextClass;
  const containerToken = parseColorToken(containerColor);
  const containerBgClass = containerToken.alphaRaw ? `bg-${containerToken.base}/${containerToken.alphaRaw}` : `bg-${containerToken.base}`;
  const containerHex = colorHexMap[containerToken.base] || (isLightBg ? '#ffffff' : '#0f172a');
  const containerBgRgba = hexToRgba(containerHex, containerToken.alpha);

  // Asset Base URL (Ignore for Beta/ZIP exports to keep links relative)
  const assetBaseUrl = settings.ignoreAssetBaseUrl ? "" : (settings.assetBaseUrl || "").replace(/\/$/, '');

  if (module.type === 'external') {
    const urlValidation = validateUrl(module.url || '');
    const safeUrl = urlValidation.safeUrl;
    const safeTitle = escapeHtml(module.title || 'External Module');

    if (module.linkType === 'iframe') {
      return `<!DOCTYPE html>
<html>
<head>
  ${scopedStorageBootstrapTag}
  <style>
    body { margin: 0; padding: 0; background: ${bgHex}; ${font.css} }
    iframe { width: 100%; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe src="${safeUrl}" width="100%" height="100%" style="border:none;"></iframe>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  ${scopedStorageBootstrapTag}
  <style>
    body { background: ${bgHex}; color: ${isLightBg ? '#0f172a' : '#e2e8f0'}; ${font.css}; padding: 40px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    a { color: #0ea5e9; text-decoration: underline; }
  </style>
</head>
<body>
  <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${safeTitle}</h2>
  <p style="margin-bottom: 1.5rem; color: #94a3b8;">This module opens in a new tab.</p>
  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open ${safeTitle} -></a>
</body>
</html>`;
  }

  let itemCode = module.code || {};
  if (typeof itemCode === 'string') {
    try { itemCode = JSON.parse(itemCode); } catch (e) {}
  }
  const isMaterialsModule = itemCode.id === "view-materials";
  const isAssessmentsModule = module.id === "item-assessments" || module.title === "Assessments";

  let moduleContentHTML = '';
  let moduleCSS = '';
  let moduleScript = '';

  if (isMaterialsModule) {
    const materials = courseMaterials.filter(m => !m.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
    const digitalMaterials = materials.filter(m => m.digitalContent);
    const digitalContentData = {};
    digitalMaterials.forEach(dm => {
      digitalContentData[dm.id] = dm.digitalContent;
    });
    const digitalContentJSON = JSON.stringify(digitalContentData)
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e');

    const defaultMaterialTheme = settings.defaultMaterialTheme || 'dark';
    const materialThemeMap = {
      dark: { cardBg: 'bg-slate-900', cardBorder: 'border-slate-700', heading: 'text-white', body: 'text-slate-400' },
      light: { cardBg: 'bg-white', cardBorder: 'border-slate-300', heading: 'text-slate-900', body: 'text-slate-600' },
      muted: { cardBg: 'bg-slate-800', cardBorder: 'border-slate-700', heading: 'text-slate-200', body: 'text-slate-500' },
      'high-contrast-light': { cardBg: 'bg-white', cardBorder: 'border-slate-300', heading: 'text-black', body: 'text-slate-800' },
      'high-contrast-dark': { cardBg: 'bg-black', cardBorder: 'border-slate-600', heading: 'text-white', body: 'text-slate-300' }
    };

    const materialCards = materials.map(mat => {
      const themeKey = (mat.themeOverride != null && mat.themeOverride !== '') ? mat.themeOverride : defaultMaterialTheme;
      const theme = materialThemeMap[themeKey] || materialThemeMap.dark;
      const colorClass = mat.color || 'slate';
      const borderClass = colorClass !== 'slate' ? `border-l-4 border-l-${colorClass}-500` : '';
      const bgClass = colorClass !== 'slate' ? `bg-${colorClass}-500/10` : 'bg-slate-800';
      const borderColorClass = colorClass !== 'slate' ? `border-${colorClass}-500/20` : 'border-slate-700';
      const textColorClass = colorClass !== 'slate' ? `text-${colorClass}-500` : theme.body;
      const buttonColorClass = `${buttonBgClass} ${buttonHoverClass}`;
      const badgeLabel = getMaterialBadgeLabel(mat) || mat.number || '';
      const badgeTextClass = mat.mediaType && mat.mediaType !== 'number'
        ? 'text-[9px] font-black uppercase tracking-widest'
        : 'font-black italic text-xl';
      
      // Apply Asset Base URL logic (Smart Join)
      let finalViewUrl = mat.viewUrl || '';
      let finalDownloadUrl = mat.downloadUrl || '';

      if (assetBaseUrl) {
          try {
              const baseUrlObj = new URL(assetBaseUrl);
              const basePath = baseUrlObj.pathname.replace(/\/$/, '');
              
              if (finalViewUrl.startsWith('/')) {
                  if (basePath && basePath !== '/' && finalViewUrl.startsWith(basePath)) {
                      finalViewUrl = baseUrlObj.origin + finalViewUrl;
                  } else {
                      finalViewUrl = assetBaseUrl + finalViewUrl;
                  }
              }
              if (finalDownloadUrl.startsWith('/')) {
                  if (basePath && basePath !== '/' && finalDownloadUrl.startsWith(basePath)) {
                      finalDownloadUrl = baseUrlObj.origin + finalDownloadUrl;
                  } else {
                      finalDownloadUrl = assetBaseUrl + finalDownloadUrl;
                  }
              }
          } catch(e) {
              if (finalViewUrl.startsWith('/')) finalViewUrl = assetBaseUrl + finalViewUrl;
              if (finalDownloadUrl.startsWith('/')) finalDownloadUrl = assetBaseUrl + finalDownloadUrl;
          }
      }

      const escapedViewUrl = finalViewUrl.replace(/'/g, "\\'");
      const escapedTitle = (mat.title || '').replace(/'/g, "\\'");
      const matId = mat.id || `mat-${Date.now()}`;

      let buttonsHTML = '';
      if (mat.viewUrl) {
        buttonsHTML += `<button onclick="openPDF('${escapedViewUrl}', '${escapedTitle}')" class="flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg border border-slate-600 transition-all">View Slides</button>`;
      }
      if (mat.downloadUrl) {
        buttonsHTML += `<a href="${finalDownloadUrl}" target="_blank" class="flex-1 ${buttonColorClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all text-center flex items-center justify-center">Download</a>`;
      }
      if (mat.digitalContent) {
        buttonsHTML += `<button data-digital-reader="${matId}" class="digital-reader-btn flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">Read</button>`;
      }

      return `<div class="material-card flex flex-col md:flex-row items-center justify-between gap-6 p-6 ${theme.cardBg} rounded-xl border ${theme.cardBorder} ${borderClass}">
        <div class="flex items-center gap-6">
          <div class="w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center ${textColorClass} ${badgeTextClass} border ${borderColorClass}">${badgeLabel}</div>
          <div>
            <h3 class="text-lg font-bold ${theme.heading} uppercase italic">${mat.title}</h3>
            <p class="text-xs ${theme.body} font-mono">${mat.description || ''}</p>
          </div>
        </div>
        <div class="flex gap-3 w-full md:w-auto">${buttonsHTML}</div>
      </div>`;
    }).join('\n');

    moduleContentHTML = `
      <div class="space-y-8">
        <div class="mb-8">
          <h2 class="text-3xl font-black ${headingTextClass} italic uppercase tracking-tighter">Course Materials</h2>
          <p class="text-xs ${secondaryTextClass} font-mono uppercase tracking-widest mt-2">Access lectures, presentations, and briefing documents.</p>
        </div>
        <div id="pdf-viewer-container" class="hidden mb-8 ${isLightBg ? 'bg-white' : 'bg-black'} rounded-xl border ${cardBorder} overflow-hidden shadow-2xl">
          <div class="flex justify-between items-center p-3 ${isLightBg ? 'bg-slate-100' : 'bg-slate-800'} border-b ${cardBorder}">
            <span id="viewer-title" class="text-xs font-bold text-white uppercase tracking-widest px-2">Document Viewer</span>
            <button onclick="closeViewer()" class="text-xs text-rose-400 hover:${isLightBg ? 'text-slate-900' : 'text-white'} font-bold uppercase tracking-widest px-2">Close X</button>
          </div>
          <iframe id="pdf-frame" src="" width="100%" height="600" style="border:none;"></iframe>
        </div>
        <div id="digital-reader-container" class="hidden mb-8 ${isLightBg ? 'bg-white' : 'bg-slate-900'} rounded-xl border border-emerald-500/30 overflow-hidden shadow-2xl">
          <div class="flex justify-between items-center p-3 ${isLightBg ? 'bg-slate-100' : 'bg-slate-800'} border-b border-emerald-500/30">
            <span id="reader-title" class="text-xs font-bold text-emerald-400 uppercase tracking-widest px-2 flex items-center gap-2">Digital Resource</span>
            <button onclick="closeDigitalReader()" class="text-xs text-rose-400 hover:${isLightBg ? 'text-slate-900' : 'text-white'} font-bold uppercase tracking-widest px-2">Close X</button>
          </div>
          <div class="flex" style="height: 600px;">
            <div id="reader-toc" class="w-64 ${isLightBg ? 'bg-slate-50' : 'bg-slate-950'} border-r ${cardBorder} p-4 overflow-y-auto hidden md:block">
              <h4 class="text-xs font-bold ${textColorSecondary} uppercase tracking-wider mb-4">Contents</h4>
              <div id="reader-toc-items" class="space-y-1"></div>
            </div>
            <div id="reader-content" class="flex-1 p-6 md:p-8 overflow-y-auto">
              <div id="reader-body" class="prose ${isLightBg ? 'prose-slate' : 'prose-invert'} max-w-none"></div>
              <div class="flex justify-between items-center mt-8 pt-4 border-t ${cardBorder}">
                <button id="prev-btn" onclick="prevChapter()" class="px-4 py-2 ${isLightBg ? 'bg-slate-200 hover:bg-slate-300 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-white'} text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-30">Previous</button>
                <span id="reader-progress" class="text-xs ${textColorSecondary}"></span>
                <button id="next-btn" onclick="nextChapter()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-30">Next</button>
              </div>
            </div>
          </div>
        </div>
        <div id="materials-list" class="grid grid-cols-1 gap-4">
          ${materials.length > 0 ? materialCards : `<p class="text-center ${secondaryTextClass} italic py-8">No materials available.</p>`}
        </div>
      </div>`;

    let digitalReaderScript = '';
    if (digitalMaterials.length > 0) {
      digitalReaderScript = `
      var DIGITAL_CONTENT = ${digitalContentJSON};
      var currentReader = { matId: null, chapterIdx: 0, data: null };

      function openDigitalReader(matId) {
        var content = DIGITAL_CONTENT[matId];
        if (!content) { console.error('No digital content for', matId); return; }

        currentReader = { matId: matId, chapterIdx: 0, data: content };

        document.getElementById('reader-title').innerText = (content.title || 'Digital Resource');

        var tocHTML = '';
        (content.chapters || []).forEach(function(ch, idx) {
          tocHTML += '<button onclick="goToChapter(' + idx + ')" class="toc-item w-full text-left px-3 py-2 rounded text-xs hover:bg-slate-800 transition-colors ' + (idx === 0 ? 'bg-emerald-900/50 text-emerald-400' : 'text-slate-400') + '">' +
            '<span class="font-bold">' + (ch.number || (idx + 1)) + '.</span> ' + ch.title +
          '</button>';
        });
        document.getElementById('reader-toc-items').innerHTML = tocHTML;

        renderChapter(0);

        document.getElementById('digital-reader-container').classList.remove('hidden');
        document.getElementById('materials-list').classList.add('hidden');
        document.getElementById('pdf-viewer-container').classList.add('hidden');
      }

      function closeDigitalReader() {
        document.getElementById('digital-reader-container').classList.add('hidden');
        document.getElementById('materials-list').classList.remove('hidden');
        currentReader = { matId: null, chapterIdx: 0, data: null };
      }

      function renderChapter(idx) {
        if (!currentReader.data || !currentReader.data.chapters) return;
        var chapters = currentReader.data.chapters;
        if (idx < 0 || idx >= chapters.length) return;

        currentReader.chapterIdx = idx;
        var chapter = chapters[idx];

        var html = '<h2 class="text-2xl font-bold text-white mb-2">' + (chapter.number || (idx + 1)) + '. ' + chapter.title + '</h2>';

        (chapter.sections || []).forEach(function(sec) {
          html += '<div class="mt-6">';
          if (sec.heading) {
            html += '<h3 class="text-lg font-bold text-emerald-400 mb-3">' + sec.heading + '</h3>';
          }
          var content = (sec.content || '').replace(/\\n/g, '<br>').replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.+?)\\*/g, '<em>$1</em>').replace(/^- /gm, '- ');
          html += '<div class="text-slate-300 leading-relaxed whitespace-pre-line">' + content + '</div>';
          html += '</div>';
        });

        document.getElementById('reader-body').innerHTML = html;

        document.querySelectorAll('.toc-item').forEach(function(btn, i) {
          if (i === idx) {
            btn.classList.add('bg-emerald-900/50', 'text-emerald-400');
            btn.classList.remove('text-slate-400');
          } else {
            btn.classList.remove('bg-emerald-900/50', 'text-emerald-400');
            btn.classList.add('text-slate-400');
          }
        });

        document.getElementById('prev-btn').disabled = idx === 0;
        document.getElementById('next-btn').disabled = idx === chapters.length - 1;
        document.getElementById('reader-progress').textContent = 'Chapter ' + (idx + 1) + ' of ' + chapters.length;

        document.getElementById('reader-content').scrollTop = 0;
      }

      function goToChapter(idx) {
        renderChapter(idx);
      }

      function prevChapter() {
        if (currentReader.chapterIdx > 0) {
          renderChapter(currentReader.chapterIdx - 1);
        }
      }

      function nextChapter() {
        if (currentReader.data && currentReader.data.chapters && currentReader.chapterIdx < currentReader.data.chapters.length - 1) {
          renderChapter(currentReader.chapterIdx + 1);
        }
      }

      document.addEventListener('click', function(e) {
        var readerBtn = e.target.closest('[data-digital-reader]');
        if (readerBtn) {
          e.preventDefault();
          openDigitalReader(readerBtn.getAttribute('data-digital-reader'));
          return;
        }
      });`;
    }

    moduleScript = `
      function isGoogleSitesHost() {
        var ref = '';
        try { ref = document.referrer || ''; } catch (e) { ref = ''; }
        if (/sites\\.google\\.com/i.test(ref)) return true;
        try { return /sites\\.google\\.com/i.test(window.top.location.host || ''); } catch (e) { return /sites\\.google\\.com/i.test(ref); }
      }
      function getPdfEmbedUrl(url) {
        if (!url) return url;
        var clean = String(url).trim();
        if (!clean) return clean;
        if (clean.indexOf('docs.google.com/viewer') !== -1) return clean;
        var isDrive = clean.indexOf('drive.google.com') !== -1;
        if (isDrive) {
          var driveIdMatch = clean.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/i) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
          if (driveIdMatch && driveIdMatch[1]) {
            return 'https://drive.google.com/file/d/' + driveIdMatch[1] + '/preview';
          }
          if (clean.indexOf('/view') !== -1) {
            return clean.replace('/view', '/preview');
          }
          return clean;
        }
        if (/^(\\/|\\.\\/|\\.\\.\\/|blob:|data:)/i.test(clean)) {
          return clean;
        }
        var isSameOrigin = false;
        try {
          var parsed = new URL(clean, window.location.href);
          isSameOrigin = parsed.origin === window.location.origin;
        } catch (e) {
          isSameOrigin = false;
        }
        if (isSameOrigin) {
          return clean;
        }
        var forceViewer = isGoogleSitesHost() || window.CF_FORCE_PDF_VIEWER === true;
        if (forceViewer && /^https?:\\/\\//i.test(clean)) {
          return 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(clean);
        }
        return clean;
      }
      function openPDF(url, title) {
        var container = document.getElementById('pdf-viewer-container');
        var previewUrl = getPdfEmbedUrl(url);
        document.getElementById('pdf-frame').src = previewUrl || '';
        document.getElementById('viewer-title').innerText = "VIEWING: " + title;
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth' });
      }
      function closeViewer() {
        document.getElementById('pdf-viewer-container').classList.add('hidden');
        document.getElementById('pdf-frame').src = "";
      }
      ${digitalReaderScript}`;
  } else if (isAssessmentsModule) {
    const assessments = (module.assessments || []).filter(a => !a.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
    const cardBg = containerBgClass;

    const assessmentListHTML = assessments.map((assess, idx) => {
      const typeLabel = assess.type === 'quiz' ? 'Multiple Choice' : assess.type === 'longanswer' ? 'Long Answer' : assess.type === 'print' ? 'Print & Submit' : 'Mixed Assessment';
      const typeBadge = assess.type === 'quiz' ? 'MC' : assess.type === 'longanswer' ? 'LA' : assess.type === 'print' ? 'PRINT' : 'MIX';

      return `<div class="assessment-card p-6 ${cardBg} rounded-xl border ${cardBorder} hover:border-${accentColor}-500 transition-all cursor-pointer group" onclick="showAssessment(${idx})">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-[10px] font-black uppercase tracking-widest ${secondaryTextClass}">${typeBadge}</span>
              <div>
                <h3 class="text-xl font-bold ${headingTextClass} group-hover:text-${accentColor}-400 transition-colors">${assess.title}</h3>
                <p class="text-xs ${secondaryTextClass} uppercase tracking-wider">${typeLabel}</p>
              </div>
            </div>
          </div>
          <div class="text-${accentColor}-400 group-hover:translate-x-1 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>`;
    }).join('\n');

    const assessmentContainersHTML = assessments.map((assess, idx) => {
      return `<div id="assessment-${idx}" class="assessment-container hidden">
        <button onclick="backToAssessmentList()" class="mb-6 inline-flex items-center gap-2 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Assessments
        </button>
        ${assess.html || ''}
      </div>`;
    }).join('\n');

    const assessmentScripts = assessments.map(assess => assess.script || '').filter(s => s).join('\n');
    const defaultTextColor = settings.assessmentTextColor || 'white';
    const defaultBoxColor = settings.assessmentBoxColor || 'slate-900';
    const overrideHexMap = {
      'white': '#ffffff', 'black': '#000000',
      'slate-950': '#020617', 'slate-900': '#0f172a', 'slate-800': '#1e293b', 'slate-700': '#334155',
      'slate-600': '#475569', 'slate-500': '#64748b', 'slate-400': '#94a3b8', 'slate-300': '#cbd5e1',
      'slate-200': '#e2e8f0', 'slate-100': '#f1f5f9', 'slate-50': '#f8fafc',
      'gray-900': '#111827', 'gray-800': '#1f2937', 'gray-700': '#374151', 'gray-600': '#4b5563',
      'gray-500': '#6b7280', 'gray-400': '#9ca3af', 'gray-300': '#d1d5db', 'gray-200': '#e5e7eb', 'gray-100': '#f3f4f6', 'gray-50': '#f9fafb'
    };
    const assessmentOverrideCSS = assessments.map((assess) => {
      const textColor = assess.textColorOverride != null && assess.textColorOverride !== '' ? assess.textColorOverride : defaultTextColor;
      const boxColor = assess.boxColorOverride != null && assess.boxColorOverride !== '' ? assess.boxColorOverride : defaultBoxColor;
      let genId = assess.generatedId;
      if (!genId && (assess.html || '').match(/id="(quiz_|mixed_)\\d+"/)) {
        const m = (assess.html || '').match(/id="((?:quiz_|mixed_)\\d+)"/);
        genId = m ? m[1] : null;
      }
      if (!genId) return '';
      const textHex = overrideHexMap[textColor] || overrideHexMap['white'];
      const boxHex = overrideHexMap[boxColor] || overrideHexMap['slate-900'];
      const isLightBox = ['white','slate-50','slate-100','slate-200','slate-300','slate-400','gray-50','gray-100','gray-200','gray-300','gray-400'].includes(boxColor);
      const borderHex = isLightBox ? '#cbd5e1' : '#334155';
      return `#${genId} .assessment-input,#${genId} textarea.assessment-input,#${genId} input.assessment-input{color:${textHex} !important;background-color:${boxHex} !important;border-color:${borderHex} !important;}`;
    }).filter(Boolean).join('\n');

    moduleContentHTML = `
      <div class="space-y-8">
        ${assessmentOverrideCSS ? `<style>/* per-assessment overrides */\n${assessmentOverrideCSS}</style>` : ''}
        <div class="mb-8">
          <h2 class="text-3xl font-black ${headingTextClass} italic uppercase tracking-tighter">Assessment Center</h2>
          <p class="text-xs ${secondaryTextClass} font-mono uppercase tracking-widest mt-2">Quizzes, tests, and reflection exercises.</p>
        </div>
        <div id="assessment-list" class="grid grid-cols-1 gap-4">
          ${assessments.length > 0 ? assessmentListHTML : `<p class="text-center ${secondaryTextClass} italic py-8">No assessments available.</p>`}
        </div>
        ${assessmentContainersHTML}
      </div>`;

    moduleScript = `
      function showAssessment(index) {
        document.getElementById('assessment-list').classList.add('hidden');
        document.querySelectorAll('.assessment-container').forEach(function(c) { c.classList.add('hidden'); });
        var target = document.getElementById('assessment-' + index);
        if (target) target.classList.remove('hidden');
        window.scrollTo(0, 0);
      }
      function backToAssessmentList() {
        document.querySelectorAll('.assessment-container').forEach(function(c) { c.classList.add('hidden'); });
        document.getElementById('assessment-list').classList.remove('hidden');
        window.scrollTo(0, 0);
      }
      ${assessmentScripts}`;
  } else if (module.mode === 'composer') {
    const composerModule = enrichComposerModuleResources(module, courseMaterials);
    const compiledComposer = compileComposerModule(composerModule, { courseSettings: settings });
    moduleContentHTML = compiledComposer.html || '';
    moduleCSS = compiledComposer.css || '';
    moduleScript = compiledComposer.script || '';
  } else if (module.rawHtml) {
    const rawHtmlWithScopedStorage = injectScopedStorageBootstrapIntoHtml(module.rawHtml, settings.__storageScope);
    const escapedRawHtml = rawHtmlWithScopedStorage
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    moduleContentHTML = `<div class="w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <iframe srcdoc="${escapedRawHtml}" class="w-full border-0" style="min-height: 80vh; height: 100%;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"></iframe>
    </div>`;
  } else {
    const html = module.html || (module.code && module.code.html) || '';
    const css = module.css || (module.code && module.code.css) || '';
    const script = module.script || (module.code && module.code.script) || '';
    moduleContentHTML = html;
    moduleCSS = css;
    moduleScript = script;
  }

  let toolkitScripts = '';
  let toolkitHTML = '';
  enabledTools.forEach(tool => {
    if (tool.code) {
      if (tool.code.script) toolkitScripts += tool.code.script + '\n';
      if (tool.code.html && tool.includeUi) toolkitHTML += tool.code.html + '\n';
    }
  });

  const moduleTitleSafe = (module.title || module.id || 'module').replace(/[^a-zA-Z0-9]/g, '_');
  const autosaveScript = `
(function() {
  var MODULE_KEY = 'CF_Module_${moduleTitleSafe}_v1';
  var saveTimeout = null;
  function getAllInputState() {
    var state = {};
    document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
      var key = el.id || el.name || ('field_' + i);
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) state[key] = el.type === 'radio' ? el.value : true;
      } else {
        if (el.value) state[key] = el.value;
      }
    });
    return state;
  }
  function restoreInputState(state) {
    if (!state || typeof state !== 'object') return;
    document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
      var key = el.id || el.name || ('field_' + i);
      var savedValue = state[key];
      if (savedValue !== undefined) {
        if (el.type === 'checkbox') {
          el.checked = !!savedValue;
        } else if (el.type === 'radio') {
          el.checked = (el.value === savedValue);
        } else {
          el.value = savedValue;
        }
      }
    });
  }
  function saveNow() {
    try {
      var state = getAllInputState();
      if (Object.keys(state).length > 0) {
        localStorage.setItem(MODULE_KEY, JSON.stringify({
          timestamp: Date.now(),
          state: state
        }));
      }
    } catch (e) {}
  }
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNow, 800);
  }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(MODULE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.state) restoreInputState(parsed.state);
      }
    } catch (e) {}
  }
  function init() {
    loadSaved();
    document.addEventListener('input', debouncedSave);
    document.addEventListener('change', debouncedSave);
    window.addEventListener('pagehide', saveNow);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;

  return `<!DOCTYPE html>
<html lang="en" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${module.title} | ${courseName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="${font.url}" rel="stylesheet">
  ${scopedStorageBootstrapTag}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      background: ${bgHex} !important;
      background-color: ${bgHex} !important;
      ${font.css}
    }
    body {
      min-height: 100vh;
    }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: ${isLightBg ? '#e2e8f0' : '#1e293b'}; }
    .custom-scroll::-webkit-scrollbar-thumb { background: ${isLightBg ? '#94a3b8' : '#475569'}; border-radius: 3px; }
    .glass { background: ${isLightBg ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)'}; backdrop-filter: blur(10px); }
    .material-card { transition: all 0.2s; }
    .material-card:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .assessment-container [class*="bg-slate-9"],
    .assessment-container [class*="bg-slate-8"],
    .assessment-container [class*="bg-slate-7"],
    .assessment-container [class*="bg-slate-6"],
    .assessment-container [class*="bg-gray-9"],
    .assessment-container [class*="bg-gray-8"],
    .assessment-container [class*="bg-gray-7"] {
      background: var(--cf-container-bg) !important;
    }
    :root { --cf-container-bg: ${containerBgRgba}; }
    ${moduleCSS}
    ${customCSS ? `\n    /* Custom CSS from Settings */\n    ${customCSS}` : ''}
  </style>
  <script>
    (function() {
      function setBackground() {
        document.documentElement.style.backgroundColor = '${bgHex}';
        document.documentElement.style.background = '${bgHex}';
        if (document.body) {
          document.body.style.backgroundColor = '${bgHex}';
          document.body.style.background = '${bgHex}';
        }
      }
      setBackground();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setBackground);
      }
      setTimeout(setBackground, 100);
      setTimeout(setBackground, 500);
    })();
  <\/script>
</head>
<body class="${textColor} custom-scroll" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
  <header class="sticky top-0 z-50 ${isLightBg ? 'bg-white/95' : 'bg-slate-900/95'} backdrop-blur border-b ${cardBorder}">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="../index.html" class="flex items-center gap-2 ${textColorSecondary} hover:text-${accentColor}-400 transition-colors text-sm font-bold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to Course
      </a>
      <h1 class="text-sm font-bold ${textColor} uppercase tracking-wider">${module.title}</h1>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-8">
    ${moduleContentHTML}
  </main>

  ${toolkitHTML}

  <script>
    window.CF_ASSET_BASE_URL = ${JSON.stringify(assetBaseUrl || '')};
    ${toolkitScripts}
    ${moduleScript}
    ${autosaveScript}
  <\/script>
</body>
</html>`;
};

export const buildSiteHtml = ({ modules, toolkit, excludedIds = [], initialViewKey = null, projectData, ignoreAssetBaseUrl = false }) => {
  // ========================================
  // PHASE 5 SETTINGS APPLICATION
  // ========================================
  const courseSettings = projectData["Course Settings"] || {};
  const courseName = courseSettings.courseName || projectData["Current Course"]?.name || "Course Factory";
  const courseNameUpper = courseName.toUpperCase();
  const courseCode = courseSettings.courseCode || "";
  const instructor = courseSettings.instructor || "";
  const academicYear = courseSettings.academicYear || "";
  const accentColor = courseSettings.accentColor || "sky";
  const backgroundColor = courseSettings.backgroundColor || "slate-900";
  const fontFamily = courseSettings.fontFamily || "inter";
  const customCSS = courseSettings.customCSS || "";
  const compDefaults = courseSettings.compilationDefaults || {};
  const isLightBg = ['slate-50', 'zinc-50', 'neutral-50', 'stone-50', 'gray-50', 'white'].includes(backgroundColor);
  const headingTextColor = courseSettings.headingTextColor || (isLightBg ? 'slate-900' : 'white');
  const secondaryTextColor = courseSettings.secondaryTextColor || (isLightBg ? 'slate-600' : 'slate-400');
  const buttonColor = courseSettings.buttonColor || `${accentColor}-600`;
  const containerColor = courseSettings.containerColor || (isLightBg ? 'white/80' : 'slate-900/80');
  
  const toTextClass = (value) => value.startsWith('text-') ? value : `text-${value}`;
  const toBgBase = (value) => value.startsWith('bg-') ? value.slice(3) : value;
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
  
  const headingTextClass = toTextClass(headingTextColor);
  const secondaryTextClass = toTextClass(secondaryTextColor);
  const buttonBgBase = toBgBase(buttonColor);
  const buttonBgClass = `bg-${buttonBgBase}`;
  const buttonHoverClass = buttonBgBase.endsWith('-600') ? `hover:bg-${buttonBgBase.replace(/-600$/, '-500')}` : `hover:bg-${buttonBgBase}`;
  const buttonTextClass = secondaryTextClass;
  const containerToken = parseColorToken(containerColor);
  const containerBgClass = containerToken.alphaRaw ? `bg-${containerToken.base}/${containerToken.alphaRaw}` : `bg-${containerToken.base}`;
  const containerHex = colorHexMap[containerToken.base] || (isLightBg ? '#ffffff' : '#0f172a');
  const containerBgRgba = hexToRgba(containerHex, containerToken.alpha);
  
  // Asset Base URL for Google Sites/CDN
  const assetBaseUrl = ignoreAssetBaseUrl ? "" : (courseSettings.assetBaseUrl || "").replace(/\/$/, '');

  // Build course info HTML
  const courseInfoParts = [];
  if (courseCode) courseInfoParts.push(courseCode);
  if (instructor) courseInfoParts.push(instructor);
  if (academicYear) courseInfoParts.push(academicYear);
  const courseInfoHTML = courseInfoParts.length > 0 
    ? `\n            <p class="text-[9px] text-slate-600 uppercase tracking-widest mono mt-1">${courseInfoParts.join(' | ')}</p>`
    : "";
  
  // FILTER MODULES & TOOLKIT BASED ON COMPILATION DEFAULTS
  let activeModules = modules.filter(m => !excludedIds.includes(m.id) && !m.hidden);
  
  // Respect compilation defaults (only exclude if explicitly set to false)
  if (compDefaults.includeMaterials === false) {
    activeModules = activeModules.filter(m => {
      let itemCode = m.code || {};
      if (typeof itemCode === 'string') {
        try { itemCode = JSON.parse(itemCode); } catch(e) {}
      }
      return itemCode.id !== "view-materials";
    });
  }
  
  if (compDefaults.includeAssessments === false) {
    activeModules = activeModules.filter(m => 
      m.id !== 'item-assessments' && m.title !== 'Assessments'
    );
  }
  
  // Filter enabled toolkit items
  let enabledTools = toolkit.filter(t => t.enabled);
  if (compDefaults.includeToolkit === false) {
    enabledTools = [];
  }
  
  const hiddenTools = enabledTools.filter(t => t.hiddenFromUser);
  const visibleTools = enabledTools.filter(t => !t.hiddenFromUser);

  let navInjection = "";
  let contentInjection = "";
  let scriptInjection = `window.CF_ASSET_BASE_URL = ${JSON.stringify(assetBaseUrl || '')};\n`;

  // Build Injections for Modules
  activeModules.forEach(item => {
    let itemCode = item.code || {};
    if (typeof itemCode === 'string') {
        try { itemCode = JSON.parse(itemCode); } catch(e) {}
    }
    
    // Special handling for Course Materials module - detect by code.id
    if (itemCode.id === "view-materials") {
      // Use course-level materials instead of module-specific materials
      const courseMaterials = projectData["Current Course"]?.materials || [];
      const materials = courseMaterials.filter(m => !m.hidden).sort((a, b) => a.order - b.order);
      
      // Collect digital content for all materials
      const digitalMaterials = materials.filter(m => m.digitalContent);
      
      const defaultMaterialTheme = courseSettings.defaultMaterialTheme || 'dark';
      const materialThemeMap = {
        dark: { cardBg: 'bg-slate-900', cardBorder: 'border-slate-700', heading: 'text-white', body: 'text-slate-400', inner: 'bg-slate-800', proseClass: 'prose-invert', tocHover: 'hover:bg-slate-700' },
        light: { cardBg: 'bg-white', cardBorder: 'border-slate-300', heading: 'text-slate-900', body: 'text-slate-600', inner: 'bg-slate-100', proseClass: 'prose', tocHover: 'hover:bg-slate-200' },
        muted: { cardBg: 'bg-slate-800', cardBorder: 'border-slate-700', heading: 'text-slate-200', body: 'text-slate-500', inner: 'bg-slate-800', proseClass: 'prose-invert', tocHover: 'hover:bg-slate-700' },
        'high-contrast-light': { cardBg: 'bg-white', cardBorder: 'border-slate-300', heading: 'text-black', body: 'text-slate-800', inner: 'bg-slate-100', proseClass: 'prose', tocHover: 'hover:bg-slate-200' },
        'high-contrast-dark': { cardBg: 'bg-black', cardBorder: 'border-slate-600', heading: 'text-white', body: 'text-slate-300', inner: 'bg-slate-900', proseClass: 'prose-invert', tocHover: 'hover:bg-slate-800' }
      };
      const chromeTheme = materialThemeMap[defaultMaterialTheme] || materialThemeMap.dark;
      const tocActive = chromeTheme.inner + ' ' + chromeTheme.heading;
      
      // Generate material cards dynamically
      const materialCards = materials.map(mat => {
        const themeKey = (mat.themeOverride != null && mat.themeOverride !== '') ? mat.themeOverride : defaultMaterialTheme;
        const theme = materialThemeMap[themeKey] || materialThemeMap.dark;
        const colorClass = mat.color || 'slate';
        const borderClass = colorClass !== 'slate' ? `border-l-4 border-l-${colorClass}-500` : '';
        const bgClass = colorClass !== 'slate' ? `bg-${colorClass}-500/10` : 'bg-slate-800';
        const borderColorClass = colorClass !== 'slate' ? `border-${colorClass}-500/20` : 'border-slate-700';
        const textColorClass = colorClass !== 'slate' ? `text-${colorClass}-500` : theme.body;
        const buttonColorClass = `${buttonBgClass} ${buttonHoverClass}`;
        const badgeLabel = getMaterialBadgeLabel(mat) || '00';
        const badgeTextClass = mat.mediaType && mat.mediaType !== 'number'
          ? 'text-[9px] font-black uppercase tracking-widest'
          : 'font-black italic text-xl';
        const isCustomColor = colorClass !== 'slate';
        const actionBtnBase = isCustomColor
          ? `bg-${colorClass}-600 hover:bg-${colorClass}-500 text-white`
          : `${buttonBgClass} ${buttonHoverClass} ${buttonTextClass}`;
        const actionBtnBorder = isCustomColor
          ? `border border-${colorClass}-500/30`
          : 'border border-slate-600';
        
        // Apply Asset Base URL logic (Smart Join to prevent repo name duplication)
        let finalViewUrl = mat.viewUrl || '';
        let finalDownloadUrl = mat.downloadUrl || '';

        // Helper to smart join URLs
        const smartJoin = (base, path) => {
            if (!base || !path.startsWith('/')) return base + path;
            
            // Remove trailing slash from base
            const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
            
            // Check if the path starts with the last segment of the base URL
            // Example: Base ends in "/Course-factoryPERFECT" and Path starts with "/Course-factoryPERFECT"
            const baseParts = baseClean.split('/');
            const lastBaseSegment = baseParts[baseParts.length - 1];
            
            if (lastBaseSegment && path.startsWith('/' + lastBaseSegment + '/')) {
                // Remove the duplicate segment from the start of the path
                return baseClean + path.substring(lastBaseSegment.length + 1);
            }
            
            return baseClean + path;
        };

        if (assetBaseUrl) {
            finalViewUrl = smartJoin(assetBaseUrl, finalViewUrl);
            finalDownloadUrl = smartJoin(assetBaseUrl, finalDownloadUrl);
        }

        const escapedViewUrl = finalViewUrl.replace(/'/g, "\\'");
        const escapedTitle = (mat.title || '').replace(/'/g, "\\'");
        const escapedDownloadUrl = finalDownloadUrl.replace(/'/g, "\\'");
        const matId = mat.id || `mat-${Date.now()}`;
        
        let buttonsHTML = '';
        if (mat.viewUrl) {
          buttonsHTML += `<button data-pdf-url="${escapedViewUrl}" data-pdf-title="${escapedTitle}" class="pdf-viewer-btn flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg border border-slate-600 transition-all">View</button>`;
        }
        if (mat.downloadUrl) {
          buttonsHTML += `<a href="${escapedDownloadUrl}" target="_blank" class="flex-1 ${buttonColorClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all text-center flex items-center justify-center">Download</a>`;
        }
        if (mat.digitalContent) {
          buttonsHTML += `<button data-digital-reader="${matId}" class="digital-reader-btn flex-1 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">Read</button>`;
        }
        
        return `<div class="material-card flex flex-col md:flex-row items-center justify-between gap-6 ${theme.cardBg} rounded-xl border ${theme.cardBorder} p-6 ${borderClass}">
    <div class="flex items-center gap-6">
        <div class="w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center ${textColorClass} ${badgeTextClass} border ${borderColorClass}">${badgeLabel}</div>
        <div>
            <h3 class="text-lg font-bold ${theme.heading} uppercase italic">${mat.title}</h3>
            <p class="text-xs ${theme.body} font-mono">${mat.description}</p>
        </div>
    </div>
    <div class="flex gap-3 w-full md:w-auto">
        ${buttonsHTML}
    </div>
</div>`;
      }).join('\n                    ');
      
      // Generate digital content data for embedding
      const digitalContentData = {};
      digitalMaterials.forEach(dm => {
        digitalContentData[dm.id] = dm.digitalContent;
      });
      const digitalContentJSON = JSON.stringify(digitalContentData)
        .replace(/`/g, '\\`')             // Escape backticks for template literals
        .replace(/\$\{/g, '\\${')         // Escape template expressions
        .replace(/</g, '\\u003c')         // Escape < for HTML safety
        .replace(/>/g, '\\u003e');        // Escape > for HTML safety
      
      // Generate the full materials view HTML (chrome themed by defaultMaterialTheme)
      const materialsHTML = `<div id="view-materials" class="w-full h-full custom-scroll p-8 md:p-12">
            <div class="max-w-5xl mx-auto space-y-8">
                <div class="mb-12">
                    <h2 class="text-3xl font-black ${headingTextClass} italic uppercase tracking-tighter">Course Materials</h2>
                    <p class="text-xs ${secondaryTextClass} font-mono uppercase tracking-widest mt-2">Access lectures, presentations, and briefing documents.</p>
                </div>
                <div id="pdf-viewer-container" class="hidden mb-12 ${chromeTheme.cardBg} rounded-xl border ${chromeTheme.cardBorder} overflow-hidden shadow-2xl">
                    <div class="flex justify-between items-center p-3 ${chromeTheme.inner} border-b ${chromeTheme.cardBorder}">
                        <span id="viewer-title" class="text-xs font-bold ${chromeTheme.heading} uppercase tracking-widest px-2">Document Viewer</span>
                        <button data-close-pdf-viewer class="text-xs ${chromeTheme.body} hover:opacity-80 font-bold uppercase tracking-widest px-2">Close X</button>
                    </div>
                    <iframe id="pdf-frame" src="" width="100%" height="600" style="border:none;"></iframe>
                </div>
                <div id="digital-reader-container" class="hidden mb-12 ${chromeTheme.cardBg} rounded-xl border ${chromeTheme.cardBorder} overflow-hidden shadow-2xl">
                    <div class="flex justify-between items-center p-3 ${chromeTheme.inner} border-b ${chromeTheme.cardBorder}">
                        <span id="reader-title" class="text-xs font-bold ${chromeTheme.heading} uppercase tracking-widest px-2 flex items-center gap-2">Digital Resource</span>
                        <button data-close-digital-reader class="text-xs ${chromeTheme.body} hover:opacity-80 font-bold uppercase tracking-widest px-2">Close X</button>
                    </div>
                    <div class="flex" style="height: 600px;">
                        <div id="reader-toc" class="w-64 ${chromeTheme.inner} border-r ${chromeTheme.cardBorder} p-4 overflow-y-auto hidden md:block">
                            <h4 class="text-xs font-bold ${chromeTheme.heading} uppercase tracking-wider mb-4">Contents</h4>
                            <div id="reader-toc-items" class="space-y-1"></div>
                        </div>
                        <div id="reader-content" class="flex-1 p-6 md:p-8 overflow-y-auto ${chromeTheme.cardBg}">
                            <div id="reader-body" class="prose ${chromeTheme.proseClass} max-w-none"></div>
                            <div class="flex justify-between items-center mt-8 pt-4 border-t ${chromeTheme.cardBorder}">
                                <button data-prev-chapter id="prev-btn" class="px-4 py-2 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-30">Previous</button>
                                <span id="reader-progress" class="text-xs ${chromeTheme.body}"></span>
                                <button data-next-chapter id="next-btn" class="px-4 py-2 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-30">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="materials-list" class="grid grid-cols-1 gap-4">
                    ${materialCards}
                </div>
            </div>
        </div>`;
      
      // Add nav button
      navInjection += `\n            <button onclick="switchView('materials')" id="nav-materials" class="nav-item">\n                <span class="w-2 h-2 rounded-full bg-slate-600"></span>${item.title}\n            </button>`;
      
      // Inject the dynamically generated HTML
      contentInjection += '\n        ' + materialsHTML + '\n';
      
      // Inject the scripts (use standalone format if available, fallback to legacy)
      const materialsScript = item.script || itemCode.script || '';
      if (materialsScript) scriptInjection += '\n        ' + materialsScript + '\n';
      
      // Add event delegation for PDF viewer buttons (always needed for materials)
      const pdfViewerEventScript = `
        // PDF Viewer Event Delegation
        document.addEventListener('click', function(e) {
            // PDF Viewer button
            var pdfBtn = e.target.closest('[data-pdf-url]');
            if (pdfBtn) {
                e.preventDefault();
                var url = pdfBtn.getAttribute('data-pdf-url');
                var title = pdfBtn.getAttribute('data-pdf-title');
                if (typeof openPDF === 'function') {
                    openPDF(url, title);
                } else {
                    // Fallback
                    var container = document.getElementById('pdf-viewer-container');
                    if (container) {
                        var embedUrl = (typeof getPdfEmbedUrl === 'function')
                          ? getPdfEmbedUrl(url)
                          : (function(u) {
                              if (!u) return u;
                              var clean = String(u).trim();
                              if (!clean) return clean;
                              if (clean.indexOf('docs.google.com/viewer') !== -1) return clean;
                              var isDrive = clean.indexOf('drive.google.com') !== -1;
                              if (isDrive) {
                                var driveIdMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
                                if (driveIdMatch && driveIdMatch[1]) {
                                  return 'https://drive.google.com/file/d/' + driveIdMatch[1] + '/preview';
                                }
                                if (clean.indexOf('/view') !== -1) {
                                  return clean.replace('/view', '/preview');
                                }
                                return clean;
                              }
                              if (/^(\/|\.\/|\.\.\/|blob:|data:)/i.test(clean)) {
                                return clean;
                              }
                              var sameOrigin = false;
                              try {
                                var parsed = new URL(clean, window.location.href);
                                sameOrigin = parsed.origin === window.location.origin;
                              } catch (e) {}
                              if (sameOrigin) return clean;
                              var ref = '';
                              try { ref = document.referrer || ''; } catch (e) { ref = ''; }
                              var isSites = /sites\\.google\\.com/i.test(ref);
                              try { isSites = isSites || /sites\\.google\\.com/i.test(window.top.location.host || ''); } catch (e) {}
                              var forceViewer = isSites || window.CF_FORCE_PDF_VIEWER === true;
                              if (forceViewer && /^https?:\/\//i.test(clean)) {
                                return 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(clean);
                              }
                              return clean;
                            })(url);
                        document.getElementById('pdf-frame').src = embedUrl || '';
                        document.getElementById('viewer-title').innerText = 'VIEWING: ' + title;
                        container.classList.remove('hidden');
                        container.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                return;
            }
            
            // Close PDF Viewer button
            var closePdfBtn = e.target.closest('[data-close-pdf-viewer]');
            if (closePdfBtn) {
                if (typeof closeViewer === 'function') {
                    closeViewer();
                } else {
                    // Fallback
                    var container = document.getElementById('pdf-viewer-container');
                    if (container) {
                        container.classList.add('hidden');
                        document.getElementById('pdf-frame').src = '';
                    }
                }
                return;
            }
        });
      `;
      scriptInjection += '\n        ' + pdfViewerEventScript + '\n';
      
      // Add digital reader script
      if (digitalMaterials.length > 0) {
        const cfMatTheme = { heading: chromeTheme.heading, body: chromeTheme.body, tocActive, tocInactive: chromeTheme.body, tocHover: chromeTheme.tocHover };
        const digitalReaderScript = `
        // Digital Reader System - Using Event Delegation for Google Sites compatibility
        var CF_MAT_THEME = ${JSON.stringify(cfMatTheme)};
        var DIGITAL_CONTENT = ${digitalContentJSON};
        var currentReader = { matId: null, chapterIdx: 0, data: null };
        
        function openDigitalReaderFn(matId) {
            var content = DIGITAL_CONTENT[matId];
            if (!content) { console.error('No digital content for', matId); return; }
            
            currentReader = { matId: matId, chapterIdx: 0, data: content };
            
            // Update title
            document.getElementById('reader-title').innerText = (content.title || 'Digital Resource');
            
            // Build table of contents (using data attributes, not onclick) - themed
            var tocHTML = '';
            (content.chapters || []).forEach(function(ch, idx) {
                var tocCls = 'toc-item w-full text-left px-3 py-2 rounded text-xs ' + CF_MAT_THEME.tocHover + ' transition-colors ' + (idx === 0 ? CF_MAT_THEME.tocActive : CF_MAT_THEME.tocInactive);
                tocHTML += '<button data-toc-chapter="' + idx + '" class="' + tocCls + '" data-chapter="' + idx + '">' +
                    '<span class="font-bold">' + (ch.number || (idx + 1)) + '.</span> ' + ch.title +
                '</button>';
            });
            document.getElementById('reader-toc-items').innerHTML = tocHTML;
            
            // Show first chapter
            renderChapterFn(0);
            
            // Show reader, hide materials list
            document.getElementById('digital-reader-container').classList.remove('hidden');
            document.getElementById('materials-list').classList.add('hidden');
            document.getElementById('pdf-viewer-container').classList.add('hidden');
        }
        
        function closeDigitalReaderFn() {
            document.getElementById('digital-reader-container').classList.add('hidden');
            document.getElementById('materials-list').classList.remove('hidden');
            currentReader = { matId: null, chapterIdx: 0, data: null };
        }
        
        function renderChapterFn(idx) {
            if (!currentReader.data || !currentReader.data.chapters) return;
            var chapters = currentReader.data.chapters;
            if (idx < 0 || idx >= chapters.length) return;
            
            currentReader.chapterIdx = idx;
            var chapter = chapters[idx];
            
            // Build chapter content - themed
            var html = '<h2 class="text-2xl font-bold ' + CF_MAT_THEME.heading + ' mb-2">' + (chapter.number || (idx + 1)) + '. ' + chapter.title + '</h2>';
            
            (chapter.sections || []).forEach(function(sec) {
                html += '<div class="mt-6">';
                if (sec.heading) {
                    html += '<h3 class="text-lg font-bold ' + CF_MAT_THEME.heading + ' mb-3">' + sec.heading + '</h3>';
                }
                // Simple markdown-like rendering
                var content = (sec.content || '').replace(/\\n/g, '<br>').replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.+?)\\*/g, '<em>$1</em>').replace(/^- /gm, '- ');
                html += '<div class="' + CF_MAT_THEME.body + ' leading-relaxed whitespace-pre-line">' + content + '</div>';
                html += '</div>';
            });
            
            document.getElementById('reader-body').innerHTML = html;
            
            // Update TOC highlighting - themed
            var tocActiveArr = CF_MAT_THEME.tocActive.split(' ').filter(Boolean);
            var tocInactiveArr = CF_MAT_THEME.tocInactive.split(' ').filter(Boolean);
            document.querySelectorAll('.toc-item').forEach(function(btn) {
                var chIdx = parseInt(btn.getAttribute('data-chapter'));
                if (chIdx === idx) {
                    tocInactiveArr.forEach(function(c) { btn.classList.remove(c); });
                    tocActiveArr.forEach(function(c) { btn.classList.add(c); });
                } else {
                    tocActiveArr.forEach(function(c) { btn.classList.remove(c); });
                    tocInactiveArr.forEach(function(c) { btn.classList.add(c); });
                }
            });
            
            // Update navigation buttons
            document.getElementById('prev-btn').disabled = idx === 0;
            document.getElementById('next-btn').disabled = idx === chapters.length - 1;
            document.getElementById('reader-progress').textContent = 'Chapter ' + (idx + 1) + ' of ' + chapters.length;
            
            // Scroll to top
            document.getElementById('reader-content').scrollTop = 0;
        }
        
        // EVENT DELEGATION for Digital Reader - More reliable in sandboxed environments like Google Sites
        document.addEventListener('click', function(e) {
            // Digital Reader button
            var readerBtn = e.target.closest('[data-digital-reader]');
            if (readerBtn) {
                e.preventDefault();
                openDigitalReaderFn(readerBtn.getAttribute('data-digital-reader'));
                return;
            }
            
            // Close Digital Reader button
            var closeReaderBtn = e.target.closest('[data-close-digital-reader]');
            if (closeReaderBtn) {
                closeDigitalReaderFn();
                return;
            }
            
            // TOC chapter buttons
            var tocBtn = e.target.closest('[data-toc-chapter]');
            if (tocBtn) {
                renderChapterFn(parseInt(tocBtn.getAttribute('data-toc-chapter')));
                return;
            }
            
            // Prev/Next buttons
            if (e.target.closest('#prev-btn') || e.target.closest('[data-prev-chapter]')) {
                renderChapterFn(currentReader.chapterIdx - 1);
                return;
            }
            if (e.target.closest('#next-btn') || e.target.closest('[data-next-chapter]')) {
                renderChapterFn(currentReader.chapterIdx + 1);
                return;
            }
        });
        
        console.log('Digital Reader initialized with event delegation');
        `;
        scriptInjection += '\n        ' + digitalReaderScript + '\n';
      }
      
    }
    // Special handling for Assessments module
    else if (item.id === "item-assessments" || item.title === "Assessments") {
      const assessments = (item.assessments || []).filter(a => !a.hidden).sort((a, b) => a.order - b.order);
      
      // Generate assessment cards for selection page
      const assessmentCards = assessments.map((assess, idx) => {
        const typeLabel = assess.type === 'quiz' ? 'Multiple Choice' : assess.type === 'longanswer' ? 'Long Answer' : assess.type === 'print' ? 'Print & Submit' : 'Mixed Assessment';
        const typeBadge = assess.type === 'quiz' ? 'MC' : assess.type === 'longanswer' ? 'LA' : assess.type === 'print' ? 'PRINT' : 'MIX';
        const questionCount = assess.questionCount || (assess.type === 'mixed' ? 'Multiple' : 'Unknown');
        
        return `
            <div class="assessment-card p-6 ${containerBgClass} rounded-xl border border-slate-700 hover:border-${accentColor}-500 transition-all cursor-pointer group" onclick="showAssessment(${idx})">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-[10px] font-black uppercase tracking-widest ${secondaryTextClass}">${typeBadge}</span>
                  <div>
                    <h3 class="text-xl font-bold ${headingTextClass} group-hover:text-${accentColor}-400 transition-colors">${assess.title}</h3>
                    <p class="text-xs ${secondaryTextClass} uppercase tracking-wider">${typeLabel}${assess.questionCount ? ' | ' + questionCount + ' Questions' : ''}</p>
                  </div>
                </div>
              </div>
              <div class="text-${accentColor}-400 group-hover:translate-x-1 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>`;
      }).join('\n          ');
      
      // Generate individual assessment containers (hidden by default) WITH INLINE SCRIPTS
      const assessmentContainers = assessments.map((assess, idx) => {
        return '\n        <div id="assessment-' + idx + '" class="assessment-container hidden">\n' +
        '          <button onclick="backToAssessmentList()" class="mb-6 inline-flex items-center gap-2 ${buttonBgClass} ${buttonHoverClass} ${buttonTextClass} font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors">\n' +
        '            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n' +
        '              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>\n' +
        '            </svg>\n' +
        '            Back to Assessments\n' +
        '          </button>\n' +
        '          ' + assess.html + '\n' +
        '          \n' +
        '          <!-- INLINE ASSESSMENT SCRIPT -->\n' +
        '          <script>\n' +
        '          ' + (assess.script || '') + '\n' +
        '          </script>\n' +
        '        </div>';
      }).join('\n        ');
      
      // Per-assessment text/box color overrides (Phase 1 Edit). Phase 5 defaults.
      const defaultTextColor = courseSettings.assessmentTextColor || 'white';
      const defaultBoxColor = courseSettings.assessmentBoxColor || 'slate-900';
      const overrideHexMap = {
        'white': '#ffffff', 'black': '#000000',
        'slate-950': '#020617', 'slate-900': '#0f172a', 'slate-800': '#1e293b', 'slate-700': '#334155',
        'slate-600': '#475569', 'slate-500': '#64748b', 'slate-400': '#94a3b8', 'slate-300': '#cbd5e1',
        'slate-200': '#e2e8f0', 'slate-100': '#f1f5f9', 'slate-50': '#f8fafc',
        'gray-900': '#111827', 'gray-800': '#1f2937', 'gray-700': '#374151', 'gray-600': '#4b5563',
        'gray-500': '#6b7280', 'gray-400': '#9ca3af', 'gray-300': '#d1d5db', 'gray-200': '#e5e7eb', 'gray-100': '#f3f4f6', 'gray-50': '#f9fafb'
      };
      const assessmentOverrideCSS = assessments.map((assess) => {
        const textColor = assess.textColorOverride != null && assess.textColorOverride !== '' ? assess.textColorOverride : defaultTextColor;
        const boxColor = assess.boxColorOverride != null && assess.boxColorOverride !== '' ? assess.boxColorOverride : defaultBoxColor;
        let genId = assess.generatedId;
        if (!genId && (assess.html || '').match(/id="(quiz_|mixed_)\d+"/)) {
          const m = (assess.html || '').match(/id="((?:quiz_|mixed_)\d+)"/);
          genId = m ? m[1] : null;
        }
        if (!genId) return '';
        const textHex = overrideHexMap[textColor] || overrideHexMap['white'];
        const boxHex = overrideHexMap[boxColor] || overrideHexMap['slate-900'];
        const isLightBox = ['white','slate-50','slate-100','slate-200','slate-300','slate-400','gray-50','gray-100','gray-200','gray-300','gray-400'].includes(boxColor);
        const borderHex = isLightBox ? '#cbd5e1' : '#334155';
        return `#${genId} .assessment-input,#${genId} textarea.assessment-input,#${genId} input.assessment-input{color:${textHex} !important;background-color:${boxHex} !important;border-color:${borderHex} !important;}`;
      }).filter(Boolean).join('\n');
      
      // Generate the full assessments view HTML with selection page (WITH INLINE SCRIPTS)
      const assessmentViewHTML = `<div id="view-assessments" class="w-full h-full custom-scroll p-8 md:p-12">
            ${assessmentOverrideCSS ? `<style>/* per-assessment overrides */\n${assessmentOverrideCSS}</style>` : ''}
            <div class="max-w-5xl mx-auto">
                <!-- Assessment Selection Page -->
                <div id="assessment-list">
                    <div class="mb-12">
                        <h2 class="text-3xl font-black ${headingTextClass} italic uppercase tracking-tighter">Assessment Center</h2>
                        <p class="text-xs ${secondaryTextClass} font-mono uppercase tracking-widest mt-2">Select an assessment to begin</p>
                    </div>
                    ${assessments.length > 0 ? `
                    <div class="grid grid-cols-1 gap-4">
                        ${assessmentCards}
                    </div>` : `<p class="text-center ${secondaryTextClass} italic py-12">No assessments available.</p>`}
                </div>
                
                <!-- Individual Assessments (hidden by default) -->
                ${assessmentContainers}
            </div>
            
            <!-- INLINE ASSESSMENT NAVIGATION SCRIPTS -->
            <script>
            (function() {
              console.log('Initializing assessment navigation functions...');
              
              window.showAssessment = function(index) {
                console.log('Showing assessment:', index);
                var listEl = document.getElementById('assessment-list');
                var targetEl = document.getElementById('assessment-' + index);
                
                if (listEl) listEl.classList.add('hidden');
                document.querySelectorAll('.assessment-container').forEach(function(c) {
                  c.classList.add('hidden');
                });
                if (targetEl) {
                  targetEl.classList.remove('hidden');
                } else {
                  console.error('Error: Assessment container not found:', 'assessment-' + index);
                }
                window.scrollTo(0, 0);
              };
              
              window.backToAssessmentList = function() {
                console.log('[INLINE] Returning to assessment list');
                document.querySelectorAll('.assessment-container').forEach(function(c) {
                  c.classList.add('hidden');
                });
                var listEl = document.getElementById('assessment-list');
                if (listEl) listEl.classList.remove('hidden');
                window.scrollTo(0, 0);
              };
              
              // Global Toolkit Menu Toggle
              window.toggleToolkitMenu = function() {
                console.log('[INLINE] Toggling toolkit menu');
                var dropdown = document.getElementById('toolkit-dropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              };
              
              // Global Toolkit Tool Toggle
              var toolkitState = JSON.parse(localStorage.getItem('mf_toolkit') || '{}');
              
              window.toggleTool = function(toolId) {
                console.log('[INLINE] Toggling tool:', toolId);
                console.log('[DEBUG] Looking for element ID:', 'feat-' + toolId);
                
                toolkitState[toolId] = !toolkitState[toolId];
                localStorage.setItem('mf_toolkit', JSON.stringify(toolkitState));
                
                var toolElement = document.getElementById('feat-' + toolId);
                var toggleButton = document.getElementById('toggle-' + toolId);
                
                console.log('[DEBUG] Tool element found:', !!toolElement);
                console.log('[DEBUG] Toggle button found:', !!toggleButton);
                console.log('[DEBUG] New state:', toolkitState[toolId]);
                
                if (toolElement) {
                  if (toolkitState[toolId]) {
                    toolElement.classList.remove('hidden');
                    console.log('[DEBUG] Showing tool');
                  } else {
                    toolElement.classList.add('hidden');
                    console.log('[DEBUG] Hiding tool');
                  }
                }
                
                if (toggleButton) {
                  if (toolkitState[toolId]) {
                    toggleButton.classList.remove('bg-slate-600');
                    toggleButton.classList.add('bg-emerald-600');
                    var dot = toggleButton.querySelector('div');
                    if (dot) dot.classList.add('translate-x-4');
                    console.log('[DEBUG] Toggle ON visual');
                  } else {
                    toggleButton.classList.remove('bg-emerald-600');
                    toggleButton.classList.add('bg-slate-600');
                    var dot = toggleButton.querySelector('div');
                    if (dot) dot.classList.remove('translate-x-4');
                    console.log('[DEBUG] Toggle OFF visual');
                  }
                }
              };
              
              // Initialize toolkit state on load
              window.initializeToolkit = function() {
                console.log('[INLINE] Initializing toolkit state');
                Object.keys(toolkitState).forEach(function(toolId) {
                  if (toolkitState[toolId]) {
                    var toolElement = document.getElementById('feat-' + toolId);
                    var toggleButton = document.getElementById('toggle-' + toolId);
                    if (toolElement) toolElement.classList.remove('hidden');
                    if (toggleButton) {
                      toggleButton.classList.remove('bg-slate-600');
                      toggleButton.classList.add('bg-emerald-600');
                      var dot = toggleButton.querySelector('div');
                      if (dot) dot.classList.add('translate-x-4');
                    }
                  }
                });
              };
              
              // Initialize on load
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', window.initializeToolkit);
              } else {
                window.initializeToolkit();
              }
              
              console.log('[INLINE] Assessment navigation + toolkit functions ready!');
            })();
            </script>
        </div>`;
      
      // Generate combined assessment scripts
      const assessmentScripts = assessments.map(assess => assess.script || '').join('\n        ');
      
      // Add navigation functions (attached to window for onclick access)
      const navScripts = `
        (function() {
          console.log('Initializing assessment navigation functions...');
          
          window.showAssessment = function(index) {
            console.log('Showing assessment:', index);
            var listEl = document.getElementById('assessment-list');
            var targetEl = document.getElementById('assessment-' + index);
            
            if (listEl) listEl.classList.add('hidden');
            document.querySelectorAll('.assessment-container').forEach(function(c) {
              c.classList.add('hidden');
            });
            if (targetEl) {
              targetEl.classList.remove('hidden');
            } else {
              console.error('Error: Assessment container not found:', 'assessment-' + index);
            }
            window.scrollTo(0, 0);
          };
          
          window.backToAssessmentList = function() {
            console.log('[INLINE] Returning to assessment list');
            document.querySelectorAll('.assessment-container').forEach(function(c) {
              c.classList.add('hidden');
            });
            var listEl = document.getElementById('assessment-list');
            if (listEl) listEl.classList.remove('hidden');
            window.scrollTo(0, 0);
          };
          
          console.log('Assessment navigation functions ready!');
        })();
        `;
      
      // Add to navigation
      navInjection += `\n            <button onclick="switchView('assessments')" id="nav-assessments" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Assessments
            </button>`;
      
      // Add HTML and scripts
      contentInjection += `\n        ${assessmentViewHTML}\n`;
      scriptInjection += `\n        ${navScripts}\n        ${assessmentScripts}\n`;
      
    } else {
      // ========================================
      // CUSTOM MODULES (Iframe Isolation Strategy)
      // ========================================
      // Each custom module runs in its own iframe - completely isolated
      // This prevents ID collisions, JS conflicts, and CSS pollution
      
      const moduleId = item.id || itemCode.id || '';
      const shortId = moduleId.replace('view-', '');
      
      // Add Navigation Button
      if (moduleId) {
        // External link modules with newtab open in new window - No iframe needed
        if (item.type === 'external' && item.linkType === 'newtab') {
          navInjection += `\n            <button onclick="window.open('${item.url}', '_blank', 'noopener,noreferrer')" id="nav-${shortId}" class="nav-item">\n                <span class="w-2 h-2 rounded-full bg-slate-600"></span>${item.title}\n            </button>`;
        } else {
          navInjection += `\n            <button onclick="switchView('${shortId}')" id="nav-${shortId}" class="nav-item">\n                <span class="w-2 h-2 rounded-full bg-slate-600"></span>${item.title}\n            </button>`;
        }
      }
      
      // Skip content injection for external links that open in new tab
      if (item.type === 'external' && item.linkType === 'newtab') {
        // No content injection needed - handled by nav button onclick
      } else if (item.mode === 'composer') {
        // Render composer modules directly in the compiled legacy shell so report/download/print actions
        // are not limited by iframe sandbox restrictions.
        const moduleContent = extractModuleContent(
          item,
          projectData["Current Course"]?.materials || [],
          projectData["Course Settings"] || {},
        );
        if (!moduleContent.html) {
          return;
        }

        const composerContainerHTML = `
        <div id="view-${shortId}" class="w-full h-full hidden module-container custom-scroll p-6 md:p-8">
            ${moduleContent.html}
        </div>`;
        contentInjection += '\n' + composerContainerHTML + '\n';

        if (moduleContent.css) {
          contentInjection += `\n<style>\n${moduleContent.css}\n</style>\n`;
        }
        if (moduleContent.script) {
          scriptInjection += '\n' + moduleContent.script + '\n';
        }
      } else {
        // Determine the iframe content
        let iframeDoc = '';
        
        // PRIORITY 1: Use rawHtml if available (new simplified format)
        // This is the complete HTML document as pasted by the user - no transformation
        if (item.mode !== 'composer' && item.rawHtml) {
          iframeDoc = item.rawHtml;
        } 
        // PRIORITY 2: Fallback for legacy modules (parsed html/css/script)
        else {
          const moduleContent = extractModuleContent(item, projectData["Current Course"]?.materials || [], projectData["Course Settings"] || {});
          if (!moduleContent.html) {
            // No content to render
            return;
          }
          
          let rawHTML = moduleContent.html || '';
          let rawScript = moduleContent.script || '';
          let rawCSS = moduleContent.css || '';
          
          // Build a complete HTML document for legacy modules
          iframeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;1,400;1,900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
        body { 
            background-color: #0f172a; 
            color: #e2e8f0; 
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        ${rawCSS}
    </style>
</head>
<body class="min-h-screen p-4 md:p-8">
    ${rawHTML}
    <script>
        (function() {
            ${rawScript}
        })();
    <\/script>
</body>
</html>`;
        }
        
        // Escape the HTML for use in srcdoc attribute
        const escapedDoc = iframeDoc
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        
        // Create the Container DIV with iframe
        const containerHTML = `
        <div id="view-${shortId}" class="w-full h-full hidden module-container">
            <iframe 
                srcdoc="${escapedDoc}" 
                class="w-full h-full border-0" 
                style="min-height: 100vh;"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"
            ></iframe>
        </div>`;
        
        contentInjection += '\n' + containerHTML + '\n';
      }
    }
  });

  // Inject Hidden Tools (apply silently) WITH INLINE SCRIPTS
  hiddenTools.forEach(tool => {
    const toolCode = typeof tool.code === 'string' ? JSON.parse(tool.code) : tool.code;
    if (tool.includeUi && toolCode.html) {
      const htmlWithScript = toolCode.html + (toolCode.script ? '\n<script>\n' + toolCode.script + '\n</script>' : '');
      contentInjection += '\n        ' + htmlWithScript + '\n';
    }
  });

  // Inject Global Toolkit Dropdown (if there are visible tools)
  if (visibleTools.length > 0) {
    // Add Global Toolkit nav button
    navInjection += `\n            <button onclick="toggleToolkitMenu()" id="nav-toolkit" class="nav-item mt-4 border-t border-slate-800 pt-4">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Global Toolkit
            </button>`;
    
    // Build dropdown HTML
    let dropdownItems = '';
    visibleTools.forEach(tool => {
      const toolCode = typeof tool.code === 'string' ? JSON.parse(tool.code) : tool.code;
      const toolId = tool.id.replace('feat-', '');
      
      if (tool.userToggleable) {
        dropdownItems += `
                        <div class="flex items-center justify-between p-2 hover:bg-slate-700 rounded">
                            <span class="text-xs text-slate-300">${tool.title}</span>
                            <button onclick="toggleTool('${toolId}')" id="toggle-${toolId}" class="relative w-8 h-4 rounded-full transition-colors bg-slate-600 cursor-pointer">
                                <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform pointer-events-none"></div>
                            </button>
                        </div>`;
      } else {
        dropdownItems += `
                        <div class="p-2 hover:bg-slate-700 rounded">
                            <span class="text-xs text-slate-300">${tool.title}</span>
                        </div>`;
      }
      
      // Inject tool content WITH INLINE SCRIPT wrapped in container
      if (tool.includeUi && toolCode.html) {
        const htmlWithScript = toolCode.html + (toolCode.script ? '\n<script>\n' + toolCode.script + '\n</script>' : '');
        // Wrap in a container div with the correct ID for toggling
        contentInjection += '\n        <div id="feat-' + toolId + '" class="' + (tool.userToggleable ? 'hidden' : '') + '">\n' + htmlWithScript + '\n        </div>\n';
      }
    });

    // Add dropdown container
    contentInjection += `
        <div id="toolkit-dropdown" class="hidden fixed top-16 left-4 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 w-64">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-bold text-white">Global Toolkit</h3>
                <button onclick="toggleToolkitMenu()" class="text-slate-400 hover:text-white">x</button>
            </div>
            <div class="space-y-1">
                ${dropdownItems}
            </div>
        </div>`;

    // Add toolkit toggle scripts
    const toolIds = visibleTools.filter(t => t.userToggleable).map(t => t.id.replace('feat-', ''));
    scriptInjection += `
        // Global Toolkit Menu Logic
        function toggleToolkitMenu() {
            const dropdown = document.getElementById('toolkit-dropdown');
            dropdown.classList.toggle('hidden');
        }

        // Tool Toggle State Management
        let toolkitState = JSON.parse(localStorage.getItem('mf_toolkit') || '{}');
        
        function toggleTool(toolId) {
            toolkitState[toolId] = !toolkitState[toolId];
            localStorage.setItem('mf_toolkit', JSON.stringify(toolkitState));
            applyToolState(toolId);
        }

        function applyToolState(toolId) {
            const isActive = toolkitState[toolId];
            const toolEl = document.getElementById('tool-' + toolId);
            const toggleBtn = document.getElementById('toggle-' + toolId);
            
            if (toolEl) {
                toolEl.classList.toggle('hidden', !isActive);
            }
            
            if (toggleBtn) {
                const slider = toggleBtn.querySelector('div');
                if (isActive) {
                    toggleBtn.classList.remove('bg-slate-600');
                    toggleBtn.classList.add('bg-emerald-600');
                    slider.classList.add('translate-x-4');
                } else {
                    toggleBtn.classList.add('bg-slate-600');
                    toggleBtn.classList.remove('bg-emerald-600');
                    slider.classList.remove('translate-x-4');
                }
            }
        }

        // Initialize tool states on load
        ${toolIds.map(id => `applyToolState('${id}');`).join('\n        ')}
      `;
  }

  // Build progress tracking script if enabled
  const progressTrackingScript = compDefaults.enableProgressTracking === true ? `
        
        // ========================================
        // PROGRESS TRACKING SYSTEM
        // ========================================
        let moduleProgress = JSON.parse(localStorage.getItem('courseProgress_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}') || '{}');
        
        // Track when a module is viewed
        function trackModuleView(moduleId) {
          if (!moduleProgress[moduleId]) {
            moduleProgress[moduleId] = {
              viewed: true,
              viewedAt: new Date().toISOString(),
              completed: false
            };
            localStorage.setItem('courseProgress_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}', JSON.stringify(moduleProgress));
            updateProgressIndicators();
          }
        }
        
        // Mark module as completed
        function markModuleComplete(moduleId) {
          if (!moduleProgress[moduleId]) {
            moduleProgress[moduleId] = { viewed: true, viewedAt: new Date().toISOString() };
          }
          moduleProgress[moduleId].completed = true;
          moduleProgress[moduleId].completedAt = new Date().toISOString();
          localStorage.setItem('courseProgress_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}', JSON.stringify(moduleProgress));
          updateProgressIndicators();
        }
        
        // Update visual progress indicators
        function updateProgressIndicators() {
          const allModules = document.querySelectorAll('nav button[onclick^="switchView"]');
          allModules.forEach(btn => {
            const moduleId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (moduleProgress[moduleId]) {
              // Add checkmark indicator
              if (moduleProgress[moduleId].completed && !btn.querySelector('.progress-check')) {
                btn.insertAdjacentHTML('beforeend', '<span class="progress-check ml-2 text-emerald-400">Done</span>');
              } else if (moduleProgress[moduleId].viewed && !moduleProgress[moduleId].completed && !btn.querySelector('.progress-dot')) {
                btn.insertAdjacentHTML('beforeend', '<span class="progress-dot ml-2 text-amber-400">In Progress</span>');
              }
            }
          });
        }
        
        // Hook into module switching to track views
        const originalSwitchView = window.switchView;
        window.switchView = function(viewId) {
          trackModuleView(viewId);
          return originalSwitchView(viewId);
        };
        
        // Initialize on load
        updateProgressIndicators();
      ` : '';

  // Add initialization script for initialViewKey if provided
  const initScript = initialViewKey ? `
        // Auto-open to initial view on load
        (function() {
          function initView() {
            const targetView = document.getElementById('view-${initialViewKey}');
            if (targetView) {
              // Hide all views first
              document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
              // Show target view
              targetView.classList.remove('hidden');
              // Activate nav button
              const navBtn = document.getElementById('nav-${initialViewKey}');
              if (navBtn) {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                navBtn.classList.add('active');
              }
              // Call module init if available (backward compatibility)
              if (window.COURSE_FACTORY_MODULES && window.COURSE_FACTORY_MODULES['${initialViewKey}'] && window.COURSE_FACTORY_MODULES['${initialViewKey}'].init) {
                try {
                  window.COURSE_FACTORY_MODULES['${initialViewKey}'].init();
                } catch(e) {
                  console.error('Module init error:', e);
                }
              }
            }
          }
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initView);
          } else {
            initView();
          }
        })();
      ` : '';

  // Generate final HTML using template function
  const finalCode = generateMasterShell({
    courseName,
    courseNameUpper,
    accentColor,
    backgroundColor,
    fontFamily,
    customCSS,
    courseInfo: courseInfoHTML,
    navItems: navInjection,
    content: contentInjection,
    scripts: scriptInjection + initScript,
    progressTracking: progressTrackingScript,
    containerBgRgba,
    layoutSettings: projectData["Course Settings"]?.layoutSettings
  });

  return finalCode;
};

const getFontFamily = getFontFamilyGlobal;

export const buildBetaManifest = ({ projectData, modules, excludedIds = [] }) => {
  const courseSettings = projectData["Course Settings"] || {};
  const courseName = courseSettings.courseName || projectData["Current Course"]?.name || "Course";
  const activeModules = modules.filter(m => !excludedIds.includes(m.id) && !m.hidden);
  
  return {
    courseTitle: courseName,
    updatedAt: new Date().toISOString(),
    modules: activeModules.map(m => ({
      id: m.id,
      title: m.title,
      path: `modules/${m.id}.html`
    }))
  };
};

export const generateHubPageBeta = ({ projectData, manifest }) => {
  const courseSettings = projectData["Course Settings"] || {};
  const accentColor = courseSettings.accentColor || "sky";
  const backgroundColor = courseSettings.backgroundColor || "slate-900";
  const fontFamily = courseSettings.fontFamily || "inter";
  const customCSS = courseSettings.customCSS || "";
  const courseName = manifest.courseTitle;
  
  const font = getFontFamily(fontFamily);
  
  // Determine if background is light (for text color)
  const isLightBg = ['slate-50', 'zinc-50', 'neutral-50', 'stone-50', 'gray-50', 'white'].includes(backgroundColor);
  const headingTextColor = courseSettings.headingTextColor || (isLightBg ? 'slate-900' : 'white');
  const secondaryTextColor = courseSettings.secondaryTextColor || (isLightBg ? 'slate-600' : 'slate-400');
  const containerColor = courseSettings.containerColor || (isLightBg ? 'white/80' : 'slate-900/80');
  const toTextClass = (value) => value.startsWith('text-') ? value : `text-${value}`;
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
  const headingTextClass = toTextClass(headingTextColor);
  const secondaryTextClass = toTextClass(secondaryTextColor);
  const tertiaryTextClass = toTextClass(isLightBg ? 'slate-500' : 'slate-500');
  const borderColor = isLightBg ? 'border-slate-300' : 'border-slate-700';
  const containerToken = parseColorToken(containerColor);
  const containerBgClass = containerToken.alphaRaw ? `bg-${containerToken.base}/${containerToken.alphaRaw}` : `bg-${containerToken.base}`;
  const containerHoverClass = `hover:bg-${containerToken.base}`;
  const containerHex = colorHexMap[containerToken.base] || (isLightBg ? '#ffffff' : '#0f172a');
  const containerBgRgba = hexToRgba(containerHex, containerToken.alpha);
  const arrowColor = secondaryTextClass;
  
  const moduleListHTML = manifest.modules.map((mod, idx) => `
    <a href="./${mod.path}" class="block p-6 ${containerBgClass} rounded-xl border ${borderColor} hover:border-${accentColor}-500 ${containerHoverClass} transition-all group">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-${accentColor}-500/20 flex items-center justify-center text-${accentColor}-400 font-bold">
            ${String(idx + 1).padStart(2, '0')}
          </div>
          <div>
            <h3 class="text-lg font-bold ${headingTextClass} group-hover:text-${accentColor}-400 transition-colors">${mod.title}</h3>
            <p class="text-xs ${tertiaryTextClass} font-mono">${mod.id}</p>
          </div>
        </div>
        <svg class="w-5 h-5 ${arrowColor} group-hover:text-${accentColor}-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </a>
  `).join('\n');

  // Map Tailwind color names to hex values for background
  const bgColorMap = {
    // Dark backgrounds
    'slate-900': '#0f172a',
    'slate-950': '#020617',
    'zinc-900': '#18181b',
    'neutral-900': '#171717',
    'stone-900': '#1c1917',
    'gray-900': '#111827',
    // Light backgrounds
    'slate-50': '#f8fafc',
    'zinc-50': '#fafafa',
    'neutral-50': '#fafafa',
    'stone-50': '#fafaf9',
    'gray-50': '#f9fafb',
    'white': '#ffffff'
  };
  const bgHex = bgColorMap[backgroundColor] || bgColorMap['slate-900'];
  const scrollbarTrack = isLightBg ? '#e2e8f0' : '#1e293b';
  const scrollbarThumb = isLightBg ? '#94a3b8' : '#475569';
  
  return `<!DOCTYPE html>
<html lang="en" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${courseName}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="${font.url}" rel="stylesheet">
<style>
  * { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body { 
    background: ${bgHex} !important;
    background-color: ${bgHex} !important;
    ${font.css}
  }
  body { 
    min-height: 100vh;
  }
  :root { --cf-container-bg: ${containerBgRgba}; }
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: ${scrollbarTrack}; }
  .custom-scroll::-webkit-scrollbar-thumb { background: ${scrollbarThumb}; border-radius: 3px; }
  ${customCSS ? `\n    /* Custom CSS from Settings */\n    ${customCSS}` : ''}
</style>
<script>
  // Force background color after Tailwind loads
  (function() {
    function setBackground() {
      document.documentElement.style.backgroundColor = '${bgHex}';
      document.documentElement.style.background = '${bgHex}';
      if (document.body) {
        document.body.style.backgroundColor = '${bgHex}';
        document.body.style.background = '${bgHex}';
      }
    }
    setBackground();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setBackground);
    }
    setTimeout(setBackground, 100);
    setTimeout(setBackground, 500);
  })();
<\/script>
</head>
<body class="${secondaryTextClass} custom-scroll" style="background: ${bgHex} !important; background-color: ${bgHex} !important;">
<div class="max-w-4xl mx-auto px-6 py-12">
  <header class="mb-12 text-center">
    <h1 class="text-4xl font-black ${headingTextClass} uppercase tracking-tight mb-2">${courseName}</h1>
    <p class="text-sm ${secondaryTextClass}">Select a module to begin</p>
    <p class="text-xs ${tertiaryTextClass} mt-2 font-mono">Last updated: ${new Date(manifest.updatedAt).toLocaleDateString()}</p>
  </header>
  
  <nav class="space-y-4">
    ${moduleListHTML}
  </nav>
  
  <footer class="mt-16 pt-8 border-t ${borderColor} text-center">
    <p class="text-xs ${tertiaryTextClass}">Built with Course Factory</p>
  </footer>
</div>
</body>
</html>`;
};

export const generateModuleHtmlBeta = ({ projectData, modules, moduleId, renderSettings = null }) => {
  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return null;

  const courseSettings = projectData["Course Settings"] || {};
  const safeRenderSettings = renderSettings && typeof renderSettings === 'object' ? renderSettings : {};
  return buildModuleFrameHTML(mod, {
    ...courseSettings,
    __courseName: courseSettings.courseName || projectData["Current Course"]?.name || "Course",
    __toolkit: projectData["Global Toolkit"] || [],
    __materials: projectData["Current Course"]?.materials || [],
    ignoreAssetBaseUrl: true, // Force relative links for ZIP export
    ...safeRenderSettings,
  });
};

export const buildStaticFilesBeta = ({ projectData, modules, excludedIds = [] }) => {
  const manifest = buildBetaManifest({ projectData, modules, excludedIds });
  const filesMap = {};
  
  // Add index.html (hub page)
  filesMap['index.html'] = generateHubPageBeta({ projectData, manifest });
  
  // Add manifest.json
  filesMap['manifest.json'] = JSON.stringify(manifest, null, 2);
  
  // Add individual module pages
  manifest.modules.forEach(mod => {
    const moduleHtml = generateModuleHtmlBeta({ projectData, modules, moduleId: mod.id });
    if (moduleHtml) {
      filesMap[`modules/${mod.id}.html`] = moduleHtml;
    }
  });
  
  return filesMap;
};

export function buildLegacyCompiledHtml({ projectData, excludedIds = [], initialViewKey = null }) {
  const modules = projectData?.["Current Course"]?.modules || [];
  const toolkit = projectData?.["Global Toolkit"] || [];
  return buildSiteHtml({ modules, toolkit, excludedIds, initialViewKey, projectData });
}

export function buildStaticFilesBetaFromProject({ projectData, excludedIds = [] }) {
  const modules = projectData?.["Current Course"]?.modules || [];
  return buildStaticFilesBeta({ projectData, modules, excludedIds });
}
