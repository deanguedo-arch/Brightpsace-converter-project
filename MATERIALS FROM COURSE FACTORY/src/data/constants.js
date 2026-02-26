// Centralized constants extracted from src/App.jsx (Phase 2.1)
// NOTE: Keep stable; changes affect defaults and legacy template display.

export const PROJECT_DATA = {
  projectSchemaVersion: 3,
  "Current Course": {
    name: "Mental Fitness",
    modules: [
      {
        id: "item-1768749223001",
        title: "Course Materials",
        type: "standalone",
        code: { id: "view-materials" },
        materials: [
          {
            id: "mat-00",
            number: "00",
            title: "What is Sports Psychology?",
            description: "The Diagnostic & Baseline Protocol.",
            viewUrl: "/Course-factoryPERFECT/materials/What is sports psychology.pdf",
            downloadUrl: "/Course-factoryPERFECT/materials/What is sports psychology.pdf",
            color: "slate",
            hidden: false,
            order: 0
          },
          {
            id: "mat-01",
            number: "01",
            title: "The Engine",
            description: "Values, Identity & Foundation.",
            viewUrl: "/Course-factoryPERFECT/materials/PHASE 1 THE ENGINE.pdf",
            downloadUrl: "/Course-factoryPERFECT/materials/PHASE 1 THE ENGINE.pdf",
            color: "rose",
            hidden: false,
            order: 1
          },
          {
            id: "mat-02",
            number: "02",
            title: "The Drive",
            description: "Motivation, 7/10 Task & Maintenance.",
            viewUrl: "/Course-factoryPERFECT/materials/PHASE 2 THE DRIVE.pdf",
            downloadUrl: "/Course-factoryPERFECT/materials/PHASE 2 THE DRIVE.pdf",
            color: "amber",
            hidden: false,
            order: 2
          },
          {
            id: "mat-03",
            number: "03",
            title: "The Focus",
            description: "Spotlight, Cues & The Fortress.",
            viewUrl: "/Course-factoryPERFECT/materials/PHASE 3 THE FOCUS.pdf",
            downloadUrl: "/Course-factoryPERFECT/materials/PHASE 3 THE FOCUS.pdf",
            color: "emerald",
            hidden: false,
            order: 3
          },
          {
            id: "mat-04",
            number: "04",
            title: "The Toolkit",
            description: "Confidence & Visualization Protocols.",
            viewUrl: "/Course-factoryPERFECT/materials/PHASE 4 THE TOOLKIT.pdf",
            downloadUrl: "/Course-factoryPERFECT/materials/PHASE 4 THE TOOLKIT.pdf",
            color: "sky",
            hidden: false,
            order: 4
          }
        ],
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
                    <p class="text-center text-slate-500 italic py-8">Materials will be generated dynamically when you compile the site.</p>
                </div>
            </div>
        </div>`,
        css: "",
        script: `
        // Dynamic Materials Renderer (runs in builder and compiled site)
        function renderMaterials() {
            // This will be populated by the compile process
            // For now, shows placeholder in builder
            const container = document.getElementById('materials-container');
            if (!container) return;
            
            // Check if we're in the compiled site with materials data
            if (window.courseMaterials && window.courseMaterials.length > 0) {
                container.innerHTML = window.courseMaterials.map(mat => {
                    const colorClass = mat.color || 'slate';
                    const borderClass = colorClass !== 'slate' ? 'border-l-4 border-l-' + colorClass + '-500' : '';
                    const bgClass = colorClass !== 'slate' ? 'bg-' + colorClass + '-500/10' : 'bg-slate-800';
                    const borderColorClass = colorClass !== 'slate' ? 'border-' + colorClass + '-500/20' : 'border-slate-700';
                    const textColorClass = colorClass !== 'slate' ? 'text-' + colorClass + '-500' : 'text-slate-500';
                    const buttonColorClass = colorClass !== 'slate' ? 'bg-' + colorClass + '-600 hover:bg-' + colorClass + '-500' : 'bg-sky-600 hover:bg-sky-500';
                    
                    const viewBtn = mat.viewUrl ? '<button data-pdf-url="' + (mat.viewUrl || '').replace(/"/g, '&quot;') + '" data-pdf-title="' + (mat.title || '').replace(/"/g, '&quot;') + '" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg border border-slate-600 transition-all">View</button>' : '';
                    const downloadBtn = mat.downloadUrl ? '<a href="' + mat.downloadUrl + '" target="_blank" class="flex-1 ' + buttonColorClass + ' text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all text-center flex items-center justify-center">Download</a>' : '';
                    
                    return '<div class="material-card flex flex-col md:flex-row items-center justify-between gap-6 ' + borderClass + '">' +
                        '<div class="flex items-center gap-6">' +
                            '<div class="w-12 h-12 rounded-lg ' + bgClass + ' flex items-center justify-center ' + textColorClass + ' font-black italic text-xl border ' + borderColorClass + '">' + mat.number + '</div>' +
                            '<div>' +
                                '<h3 class="text-lg font-bold text-white uppercase italic">' + mat.title + '</h3>' +
                                '<p class="text-xs text-slate-400 font-mono">' + mat.description + '</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex gap-3 w-full md:w-auto">' +
                            viewBtn +
                            downloadBtn +
                        '</div>' +
                    '</div>';
                }).join('');
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
        
        // Try to render materials on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderMaterials);
        } else {
            renderMaterials();
        }`
      },
      {
        id: "item-assessments",
        title: "Assessments",
        type: "standalone",
        assessments: [],
        html: `<div id="view-assessments" class="w-full h-full custom-scroll p-8 md:p-12">
            <div class="max-w-5xl mx-auto space-y-8">
                <div class="mb-12">
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-tighter">Assessment <span class="text-purple-500">Center</span></h2>
                    <p class="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2">Quizzes, tests, and reflection exercises.</p>
                </div>
                <div id="assessments-container" class="space-y-6">
                    <p class="text-center text-slate-500 italic py-8">Assessments will be generated dynamically when you compile the site.</p>
                </div>
            </div>
        </div>`,
        css: "",
        script: `
        // Dynamic Assessments Renderer
        function renderAssessments() {
            const container = document.getElementById('assessments-container');
            if (!container) return;
            
            if (window.courseAssessments && window.courseAssessments.length > 0) {
                container.innerHTML = window.courseAssessments.map(assessment => {
                    return '<div class="assessment-wrapper mb-8">' + assessment.html + '</div>';
                }).join('');
                
                // Execute assessment scripts
                window.courseAssessments.forEach((assessment, idx) => {
                    if (assessment.script) {
                        try {
                            eval(assessment.script);
                        } catch(e) {
                            console.error('Assessment script error:', e);
                        }
                    }
                });
            }
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderAssessments);
        } else {
            renderAssessments();
        }`
      },
      {
        id: "item-1768750987350",
        title: "Phase 1: The Engine",
        type: "standalone",
          html: `<div id="view-phase1" class="w-full h-full custom-scroll hidden p-4 md:p-8">
            <div class="max-w-6xl mx-auto">
                <header class="mb-8 text-center"><h1 class="text-3xl font-black italic tracking-tighter text-white uppercase mb-2 text-sky-500">Elite Operator Toolkit</h1><p class="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-6 font-bold underline decoration-sky-500/30 underline-offset-4">Regulation Engine: Tactical Assignment</p><div class="flex flex-wrap justify-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800 max-w-2xl mx-auto"><div class="flex items-center gap-2 px-3"><div id="p1-save-indicator" class="w-2 h-2 rounded-full bg-slate-600"></div><span id="p1-save-text" class="text-[9px] uppercase font-bold text-slate-500 tracking-widest">System Ready</span></div><div class="w-px h-6 bg-slate-800 mx-2 hidden sm:block"></div><button onclick="p1_downloadBackup()" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors border border-slate-700">Save Backup File</button><button onclick="document.getElementById('p1-file-upload').click()" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors border border-slate-700">Load Backup</button><input type="file" id="p1-file-upload" accept=".json" style="display: none;" onchange="p1_loadBackup(this)"></div><div class="flex justify-center gap-2 overflow-x-auto pb-2 px-2"><button onclick="p1_showStep(0)" class="mod-nav-btn active px-4 py-2 rounded-lg border border-slate-700 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">Briefing</button><button onclick="p1_showStep(1)" class="mod-nav-btn px-4 py-2 rounded-lg border border-slate-700 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">01 Stress Reset</button><button onclick="p1_showStep(2)" class="mod-nav-btn px-4 py-2 rounded-lg border border-slate-700 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">02 Arousal</button><button onclick="p1_showStep(3)" class="mod-nav-btn px-4 py-2 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">03 Targeting</button><button onclick="p1_showStep(4)" class="mod-nav-btn px-4 py-2 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">04 Confidence</button><button onclick="p1_showStep(5)" class="mod-nav-btn px-4 py-2 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-widest mono transition-all flex-shrink-0">Review & Print</button></div></header>
                <div class="glass rounded-3xl shadow-2xl overflow-hidden min-h-[500px]">
                    <div id="p1-step0" class="step-content active"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-sky-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">System Briefing: The Regulation Engine</h2></div><div class="p-8 space-y-8 text-center"><div class="max-w-3xl mx-auto space-y-6 text-left"><p class="text-slate-400 text-sm italic leading-relaxed">Elite performance is defined by the ability to regulate your internal operating system under pressure. While physical skill sets the floor, your mental fitness sets the ceiling. This assignment uses four <strong>Manual Overrides</strong> to ensure you stay in your <strong>Ideal Performance State (IPS)</strong>.</p><div class="bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl flex flex-col gap-4 mb-2"><h3 class="text-sky-400 font-bold uppercase text-[10px] tracking-widest">Dashboard Logic: Read then Regulate</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="p-3 bg-slate-900/50 rounded border border-slate-700"><span class="text-[9px] font-black text-rose-400 uppercase block mb-1">Somatic Indicators (Body)</span><p class="text-[10px] text-slate-400">Cold hands, butterflies, muscle tension, sweating.</p></div><div class="p-3 bg-slate-900/50 rounded border border-slate-700"><span class="text-[9px] font-black text-amber-400 uppercase block mb-1">Cognitive Indicators (Mind)</span><p class="text-[10px] text-slate-400">Negative self-talk, doubt, inability to concentrate.</p></div></div></div><div class="flex justify-center pt-6"><button onclick="p1_showStep(1)" class="bg-sky-600 px-12 py-4 rounded-xl text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-sky-500 transition-all shadow-lg active:scale-95">Initialize Stations</button></div></div></div></div>
<div id="p1-step1" class="step-content"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-rose-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">Station 01: The Stress Loop Reset</h2></div><div class="p-8 space-y-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-10"><div class="space-y-4"><h3 class="text-[10px] font-bold text-slate-500 uppercase mono italic underline tracking-widest">The Pivot Point</h3><p class="text-sm text-slate-300 leading-relaxed">Breathing is your manual override switch. It intercepts the Stress Process Loop at the moment a demand is perceived as a "threat." <strong class="text-rose-400">The goal is to identify a specific time you can execute this trigger and how the breath anchor will help you stay present in the moment.</strong></p><div class="bg-rose-500/10 p-3 rounded border border-rose-500/30"><span class="text-[9px] text-rose-300 font-bold uppercase">Warning:</span><p class="text-[10px] text-rose-200">Unchecked loop acceleration leads to performance crash.</p></div></div><div class="space-y-6"><div><label class="block text-[10px] font-bold uppercase text-sky-500 mb-2 mono">Deployment Scenario</label><input type="text" id="p1_breath_scenario" oninput="p1_saveData()" placeholder="When exactly will you use this? (e.g. Between points...)" class="w-full rounded-lg p-3 text-xs italic"><p class="helper-text">Identify a specific time you can execute this trigger.</p></div><div><label class="block text-[10px] font-bold uppercase text-sky-500 mb-2 mono">Centering Action Detail</label><textarea id="p1_breath_detail" oninput="p1_saveData()" placeholder="Describe your rhythmic diaphragmatic breathing habit..." class="w-full h-32 rounded-lg p-3 text-xs italic resize-none"></textarea><p class="helper-text">How will this breath anchor help you stay present in the moment?</p></div></div></div><div class="flex justify-between pt-4"><button onclick="p1_showStep(0)" class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">&larr; Back</button><button onclick="p1_showStep(2)" class="bg-sky-600 px-8 py-3 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest">Next Station &rarr;</button></div></div></div>
                    <div id="p1-step2" class="step-content"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-amber-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">Station 02: Arousal Volume Control</h2></div><div class="p-8 space-y-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-10"><div class="space-y-4"><h3 class="text-[10px] font-bold text-slate-500 uppercase mono italic underline tracking-widest">The Inverted-U</h3><p class="text-sm text-slate-300 leading-relaxed">Performance peaks at moderate arousal. You must 'down-regulate' to discharge tension or 'up-regulate' to wake the nervous system.</p></div><div class="space-y-6"><div><label class="block text-[10px] font-bold uppercase text-amber-500 mb-2 mono">Down-Regulation (Relaxation)</label><p class="text-[10px] text-slate-400 italic mb-2"><strong>PMR (Progressive Muscle Relaxation)</strong> is a technique where you systematically tense and then relax specific muscle groups to release physical tension.</p><textarea id="p1_relax_plan" oninput="p1_saveData()" placeholder="List muscle groups for your PMR routine..." class="w-full h-24 rounded-lg p-3 text-xs italic resize-none"></textarea><p class="helper-text">Describe your routine to discharge somatic tension.</p></div><div><label class="block text-[10px] font-bold uppercase text-rose-500 mb-2 mono">Up-Regulation (Activation)</label><p class="text-[10px] text-slate-400 italic mb-2"><strong>Up-Regulation</strong> involves using physical actions or environmental triggers to increase heart rate and alertness when energy is too low.</p><textarea id="p1_active_plan" oninput="p1_saveData()" placeholder="List your 'Psych-Up' triggers (Music, Cues, Physical actions)..." class="w-full h-24 rounded-lg p-3 text-xs italic resize-none"></textarea><p class="helper-text">Triggers used to discharge apathy and enter the zone.</p></div></div></div><div class="flex justify-between pt-4"><button onclick="p1_showStep(1)" class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">&larr; Back</button><button onclick="p1_showStep(3)" class="bg-sky-600 px-8 py-3 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest">Next Station &rarr;</button></div></div></div>
                    <div id="p1-step3" class="step-content"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">Station 03: The Focus Filter</h2></div><div class="p-8 space-y-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-10"><div class="space-y-4"><h3 class="text-[10px] font-bold text-slate-500 uppercase mono italic underline tracking-widest">Attentional Narrowing</h3><p class="text-sm text-slate-300 leading-relaxed">Under high stress, your peripheral vision and mental focus shrink - often called <strong>"Tunnel Vision."</strong> You lose the big picture. Cue words act as "Decoder Keys" that force the system to lock back onto task-relevant targets.</p><div class="bg-emerald-500/10 p-3 rounded border border-emerald-500/30"><span class="text-[9px] text-emerald-300 font-bold uppercase">The Goal:</span><p class="text-[10px] text-emerald-200">Shift from internal worry (Emotion) to external cues (Action).</p></div></div><div class="space-y-6"><div><label class="block text-[10px] font-bold uppercase text-sky-400 mb-2 mono">Instructional Decoder</label><input type="text" id="p1_cue_inst" oninput="p1_saveData()" placeholder="e.g., 'Elbows in', 'Smooth'..." class="w-full rounded-lg p-3 text-xs font-black italic"><p class="helper-text">Create a 1-2 word key specifically to FIX sloppy mechanics or technical errors.</p></div><div><label class="block text-[10px] font-bold uppercase text-amber-500 mb-2 mono">Motivational Decoder</label><input type="text" id="p1_cue_mot" oninput="p1_saveData()" placeholder="e.g., 'Power', 'Explode'..." class="w-full rounded-lg p-3 text-xs font-black italic"><p class="helper-text">Create a 1-2 word key specifically to FIX low energy or effort when drive is fading.</p></div><div><label class="block text-[10px] font-bold uppercase text-slate-400 mb-2 mono italic underline">Radar Jamming Scenario</label><textarea id="p1_jam_scenario" oninput="p1_saveData()" placeholder="Describe a specific high-pressure moment where you lose focus..." class="w-full h-24 rounded-lg p-3 text-xs italic resize-none"></textarea><p class="helper-text">Identify the exact moment panic sets in and which cue breaks the jam.</p></div></div></div><div class="flex justify-between pt-4"><button onclick="p1_showStep(2)" class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">&larr; Back</button><button onclick="p1_showStep(4)" class="bg-sky-600 px-8 py-3 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest">Next Station &rarr;</button></div></div></div>
                    <div id="p1-step4" class="step-content"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-sky-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">Station 04: Confidence Builder</h2></div><div class="p-8 space-y-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-10"><div class="space-y-4"><h3 class="text-[10px] font-bold text-slate-500 uppercase mono italic underline tracking-widest">Certainty Logic</h3><p class="text-sm text-slate-300 leading-relaxed">Uncertainty generates anxiety; Certainty generates confidence. You cannot control the outcome (Winning), but you can control the process (Mechanics). By shifting your focus to what you control, you build a "High Confidence" state.</p><div class="bg-slate-900 p-4 border border-slate-700 rounded-xl space-y-2"><h4 class="text-[10px] font-black text-white uppercase">S.M.A.R.T. Definition</h4><ul class="text-[9px] text-slate-400 space-y-1 font-mono"><li><strong class="text-sky-400">S</strong>PECIFIC: Clear and defined.</li><li><strong class="text-sky-400">M</strong>EASURABLE: Can be tracked.</li><li><strong class="text-sky-400">A</strong>CHIEVABLE: Realistic to your skill.</li><li><strong class="text-sky-400">R</strong>ELEVANT: Matters to your sport.</li><li><strong class="text-sky-400">T</strong>IME-BOUND: Has a deadline.</li></ul></div></div><div class="space-y-6"><div class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"><label class="block text-[10px] font-bold uppercase text-emerald-400 mb-2 mono underline italic">Process Goal (100% Control)</label><input type="text" id="p1_goal_proc" oninput="p1_saveData()" placeholder="Specific form or mechanics goal..." class="w-full rounded-lg p-3 text-xs font-black italic"><p class="helper-text">This goal builds high confidence because it is entirely under your power.</p></div><div class="grid grid-cols-2 gap-4"><div class="p-4 bg-slate-900 border border-slate-800 rounded-xl"><label class="block text-[10px] font-bold uppercase text-amber-500 mb-2 mono">Performance Goal</label><input type="text" id="p1_goal_perf" oninput="p1_saveData()" placeholder="e.g. 80% accuracy..." class="w-full rounded-lg p-2 text-xs italic"><p class="helper-text">Partial Control.</p></div><div class="p-4 bg-slate-900 border border-slate-800 rounded-xl"><label class="block text-[10px] font-bold uppercase text-rose-500 mb-2 mono">Outcome Goal</label><input type="text" id="p1_goal_out" oninput="p1_saveData()" placeholder="e.g. Winning..." class="w-full rounded-lg p-2 text-xs italic"><p class="helper-text">Low Control.</p></div></div><div><label class="block text-[10px] font-bold uppercase text-white mb-2 mono italic underline leading-none">Final S.M.A.R.T. Goal Statement</label><textarea id="p1_smart_final" oninput="p1_saveData()" placeholder="Write out your full goal statement here using the SMART criteria above..." class="w-full h-24 rounded-lg p-3 text-xs italic resize-none border-2 border-slate-700 focus:border-sky-500"></textarea><p class="helper-text">Combine your goals into one clear sentence.</p></div></div></div><div class="flex justify-between pt-4"><button onclick="p1_showStep(3)" class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">&larr; Back</button><button onclick="p1_showStep(5)" class="bg-sky-600 px-8 py-3 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest">Review & Export &rarr;</button></div></div>
                    </div>
                    <div id="p1-step5" class="step-content"><div class="relative px-6 py-4 border-b border-slate-800 bg-slate-900/50"><div class="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div><h2 class="text-xl font-bold text-white uppercase italic tracking-tight">Final Review & Rubric</h2></div><div class="p-8 space-y-12"><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><label class="block text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest mono italic underline underline-offset-2">Mental Fitness Assessment</label><div id="sc-container" class="space-y-4"></div><div class="border-t border-slate-800 mt-6 pt-6 flex justify-between items-center"><span class="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Readiness Score</span><div class="text-4xl font-black italic text-emerald-500 leading-none"><span id="p1-total-score">00</span><span class="text-xl text-slate-700 font-normal not-italic">/25</span></div></div></div><div class="space-y-6"><label class="block text-[10px] font-bold uppercase text-sky-400 mb-2 tracking-widest mono italic underline leading-none underline-offset-4">Integration Narrative (Required)</label><textarea id="p1_final_narrative" oninput="p1_saveData()" placeholder="Explain how you will use these four stations to monitor your indicators and regulate your performance state..." class="w-full h-[240px] rounded-xl p-4 text-sm resize-none text-slate-200 border-2 border-sky-500/20 focus:border-sky-500 transition-all"></textarea><p class="helper-text">Prove your understanding: How do these tools prevent the "Crash"?</p></div></div><div class="border-t border-slate-800 pt-8"><label class="block text-[10px] font-bold uppercase text-emerald-500 mb-4 tracking-widest mono italic underline underline-offset-4">Tactical Rubric</label><div class="overflow-x-auto glass rounded-2xl border border-slate-800 shadow-xl"><table class="w-full text-left text-[10px] border-collapse min-w-[700px]"><thead><tr class="bg-slate-900 border-b border-slate-800"><th class="p-4 text-slate-500 uppercase font-black">Criteria</th><th class="p-4 text-emerald-400 uppercase font-black tracking-widest">Proficient (4-5)</th><th class="p-4 text-amber-400 uppercase font-black tracking-widest">Developing (2-3)</th><th class="p-4 text-rose-400 uppercase font-black tracking-widest">Emerging (0-1)</th></tr></thead><tbody class="text-[10px] leading-relaxed italic text-slate-400"><tr class="border-b border-slate-800/50"><td class="p-4 font-bold uppercase text-white mono">Stress Reset</td><td onclick="p1_setScore('reset', 5)" id="reset-5" class="rubric-cell p-4">Centering action is clearly defined (diaphragm) with a specific time trigger. Breath anchor logic is clear.</td><td onclick="p1_setScore('reset', 3)" id="reset-3" class="rubric-cell p-4">Breathing technique mentioned but lacks specific trigger or physiological detail.</td><td onclick="p1_setScore('reset', 1)" id="reset-1" class="rubric-cell p-4">Missing centering action or trigger.</td></tr><tr class="border-b border-slate-800/50"><td class="p-4 font-bold uppercase text-white mono">Arousal Tuning</td><td onclick="p1_setScore('tune', 5)" id="tune-5" class="rubric-cell p-4">Clear distinction between Up/Down regulation. PMR definition is accurate. Tools are actionable.</td><td onclick="p1_setScore('tune', 3)" id="tune-3" class="rubric-cell p-4">Tools identified but generic. Lacks personal specificity or clear definition of PMR.</td><td onclick="p1_setScore('tune', 1)" id="tune-1" class="rubric-cell p-4">Incomplete tuning strategies.</td></tr><tr class="border-b border-slate-800/50"><td class="p-4 font-bold uppercase text-white mono">Targeting (Cues)</td><td onclick="p1_setScore('focus', 5)" id="focus-5" class="rubric-cell p-4">Instructional (Technical) & Motivational (Energy) cues are distinct. Scenario breaks the 'jam'.</td><td onclick="p1_setScore('focus', 3)" id="focus-3" class="rubric-cell p-4">Cues are too long or vague. No distinction between instructional/motivational function.</td><td onclick="p1_setScore('focus', 1)" id="focus-1" class="rubric-cell p-4">Missing cues or scenario.</td></tr><tr class="border-b border-slate-800/50"><td class="p-4 font-bold uppercase text-white mono">Confidence</td><td onclick="p1_setScore('goals', 5)" id="goals-5" class="rubric-cell p-4">Full SMART statement is written. Process goal is 100% controllable.</td><td onclick="p1_setScore('goals', 3)" id="goals-3" class="rubric-cell p-4">Process goal relies on partial external factors. SMART statement missing or incomplete.</td><td onclick="p1_setScore('goals', 1)" id="goals-1" class="rubric-cell p-4">Goals are confused (e.g. Outcome listed as Process).</td></tr><tr><td class="p-4 font-bold uppercase text-white mono">Integration</td><td onclick="p1_setScore('intel', 5)" id="intel-5" class="rubric-cell p-4">Narrative demonstrates understanding of the Dashboard (Somatic/Cognitive) and Regulation.</td><td onclick="p1_setScore('intel', 3)" id="intel-3" class="rubric-cell p-4">Restates definitions without demonstrating personal application or logic.</td><td onclick="p1_setScore('intel', 1)" id="intel-1" class="rubric-cell p-4">Incomplete narrative.</td></tr></tbody></table></div></div><div class="flex flex-col md:flex-row gap-4 pt-8"><button onclick="p1_showStep(1)" class="flex-1 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors border border-slate-800 rounded-xl py-4">&larr; Start Over</button><button onclick="p1_generatePDF()" class="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg active:scale-95">Generate Tactical Report</button></div></div></div>
                </div>
            </div>
        </div>`,
          script: `const p1_cats = [ { id: 'reset', label: 'Stress Reset' }, { id: 'tune', label: 'Arousal' }, { id: 'focus', label: 'Targeting' }, { id: 'goals', label: 'Confidence' }, { id: 'intel', label: 'Integration' } ];
        let p1_scores = { reset: 0, tune: 0, focus: 0, goals: 0, intel: 0 };
        function p1_showStep(n) {
            document.querySelectorAll('#view-phase1 .step-content').forEach(s => s.classList.remove('active'));
            document.getElementById('p1-step' + n).classList.add('active');
            document.querySelectorAll('#view-phase1 .mod-nav-btn').forEach((b, i) => b.classList.toggle('active', i === n));
        }
        function p1_setScore(cat, val) {
            p1_scores[cat] = val;
            const group = document.getElementById(\`group-\${cat}\`);
            if(group) { group.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', (i+1) === val)); }
            const total = Object.values(p1_scores).reduce((a, b) => a + b, 0);
            document.getElementById('p1-total-score').innerText = total.toString().padStart(2, '0');
            p1_saveData();
        }
        function p1_getFormData() {
             return { b_scenario: document.getElementById('p1_breath_scenario').value, b_detail: document.getElementById('p1_breath_detail').value, relax: document.getElementById('p1_relax_plan').value, active: document.getElementById('p1_active_plan').value, inst: document.getElementById('p1_cue_inst').value, mot: document.getElementById('p1_cue_mot').value, jam: document.getElementById('p1_jam_scenario').value, proc: document.getElementById('p1_goal_proc').value, perf: document.getElementById('p1_goal_perf').value, out: document.getElementById('p1_goal_out').value, smart_final: document.getElementById('p1_smart_final').value, narr: document.getElementById('p1_final_narrative').value, scores: p1_scores };
        }
        function p1_saveData() { localStorage.setItem('elite_operator_v3_p1', JSON.stringify(p1_getFormData())); document.getElementById('p1-save-text').innerText = "Saved"; setTimeout(() => document.getElementById('p1-save-text').innerText = "System Ready", 1000); }
        function p1_populate(data) { if(!data) return; if(data.b_scenario) document.getElementById('p1_breath_scenario').value = data.b_scenario; if(data.b_detail) document.getElementById('p1_breath_detail').value = data.b_detail; if(data.relax) document.getElementById('p1_relax_plan').value = data.relax; if(data.active) document.getElementById('p1_active_plan').value = data.active; if(data.inst) document.getElementById('p1_cue_inst').value = data.inst; if(data.mot) document.getElementById('p1_cue_mot').value = data.mot; if(data.jam) document.getElementById('p1_jam_scenario').value = data.jam; if(data.proc) document.getElementById('p1_goal_proc').value = data.proc; if(data.perf) document.getElementById('p1_goal_perf').value = data.perf; if(data.out) document.getElementById('p1_goal_out').value = data.out; if(data.smart_final) document.getElementById('p1_smart_final').value = data.smart_final; if(data.narr) document.getElementById('p1_final_narrative').value = data.narr; if(data.scores) { p1_scores = data.scores; Object.keys(p1_scores).forEach(c => { if(p1_scores[c]>0) p1_setScore(c, p1_scores[c]); }); } }
        function p1_downloadBackup() { const data = p1_getFormData(); const blob = new Blob([JSON.stringify(data)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = "phase1-backup.json"; a.click(); }
        function p1_loadBackup(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (e) => { p1_populate(JSON.parse(e.target.result)); alert("Phase 1 Data Loaded"); }; reader.readAsText(file); }
        function p1_generatePDF() { 
            const data = p1_getFormData(); 
            const total = Object.values(p1_scores).reduce((a, b) => a + b, 0);
            const scoreDetails = p1_cats.map(c => \`<div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:6px 0;"><span style="font-size:10px; font-weight:bold; color:#666; text-transform:uppercase;">\${c.label}</span><span style="font-weight:900; font-style:italic;">\${p1_scores[c.id] || 0}/5</span></div>\`).join('');
            const html = \`<!DOCTYPE html><html><head><title>Elite Operator Report</title><link href="https://cdn.tailwindcss.com" rel="stylesheet"><style>body{font-family:sans-serif;padding:40px;color:black;background:white;line-height:1.3}.header{border-bottom:5px solid black;padding-bottom:10px;margin-bottom:25px}.section{margin-bottom:20px;border-left:4px solid black;padding-left:15px}.label{font-size:8px;font-weight:bold;text-transform:uppercase;color:#888}.val{font-size:13px;font-weight:900;font-style:italic;border-bottom:1px solid #ddd;margin-bottom:8px;min-height:18px;color:#111}.narr-val{font-size:11px;line-height:1.4;padding:12px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;margin-top:5px}</style></head><body><div style="max-width:800px;margin:auto"><div class="header flex justify-between items-end"><div><h1 class="text-3xl font-black italic uppercase">Operator Report</h1><p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Regulation Engine Tactical Assessment</p></div><div style="text-align:right"><p style="font-size:10px;text-transform:uppercase;font-weight:bold">Mental Fitness Score</p><p style="font-size:40px;font-weight:900;font-style:italic;line-height:1">\${total}/25</p></div></div><div class="grid grid-cols-2 gap-8"><div class="section" style="border-left-color:#f43f5e"><h2 style="font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:10px;color:#f43f5e">01 Stress Loop Reset</h2><div class="label">Deployment Scenario</div><div class="val">\${data.b_scenario||'...'}</div><div class="label">Centering Action</div><div class="val">\${data.b_detail||'...'}</div></div><div class="section" style="border-left-color:#f59e0b"><h2 style="font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:10px;color:#f59e0b">02 Arousal Tuning</h2><div class="label">Down-Regulation (PMR)</div><div class="val">\${data.relax||'...'}</div><div class="label">Up-Regulation (Active)</div><div class="val">\${data.active||'...'}</div></div></div><div class="grid grid-cols-2 gap-8"><div class="section" style="border-left-color:#10b981"><h2 style="font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:10px;color:#10b981">03 Targeting (Cues)</h2><div class="label">Instructional Cue</div><div class="val">\${data.inst||'...'}</div><div class="label">Motivational Cue</div><div class="val">\${data.mot||'...'}</div><div class="label">Jamming Scenario</div><div class="val" style="font-size:11px">\${data.jam||'...'}</div></div><div class="section" style="border-left-color:#0ea5e9"><h2 style="font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:10px;color:#0ea5e9">04 Confidence (SMART)</h2><div class="label">Process Goal (100% Control)</div><div class="val">\${data.proc||'...'}</div><div class="label">Full SMART Statement</div><div class="val" style="font-size:11px">\${data.smart_final||'...'}</div></div></div><div class="section"><h2 style="font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:5px">Integration Narrative</h2><div class="narr-val">\${data.narr||'---'}</div></div><div style="margin-top:20px;border-top:2px solid black;padding-top:15px"><h2 style="font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:8px">Evaluation Breakdown</h2>\${scoreDetails}</div></div><script>window.onload=function(){setTimeout(function(){window.print()},500)};<\\/script></body></html>\`; 
            const win = window.open('','_blank'); win.document.write(html); win.document.close(); 
        }`,
        css: ""
      },
      {
        id: "item-x",
        title: "Empty Module",
        type: "standalone",
        html: "",
        css: "",
        script: ""
      }
    ],
    materials: []
  },
  "Course Settings": {
    courseName: "Mental Fitness",
    courseCode: "",
    instructor: "",
    academicYear: "",
    accentColor: "sky",
    backgroundColor: "slate-900",
    headingTextColor: "white",
    secondaryTextColor: "slate-400",
    assessmentTextColor: "white",
    assessmentBoxColor: "slate-900",
    defaultMaterialTheme: "dark",
    buttonColor: "sky-600",
    containerColor: "slate-900/80",
    fontFamily: "inter",
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
    },
    layoutSettings: {
      showSidebar: true,
      showFooter: true,
      navPosition: 'side'
    }
  },
  "Global Toolkit": [
      {
        id: "feat-darkmode",
        title: "Dark Mode",
        enabled: true,
        hiddenFromUser: true,
        userToggleable: false,
        includeUi: false,
        category: "theme",
        description: "Sets site theme to dark mode by default",
        code: {
          id: "tool-darkmode",
          html: "",
          script: `(function(){
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.style.background = '#020617';
          })();`
        }
      },
      {
        id: "feat-calculator",
        title: "Calculator",
        enabled: true,
        hiddenFromUser: false,
        userToggleable: true,
        includeUi: true,
        category: "utility",
        description: "Simple calculator widget",
        code: {
          id: "tool-calculator",
          html: `<div id="tool-calculator" class="hidden fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-white">Calculator</h3>
              <button onclick="toggleTool('calculator')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <input id="calc-display" type="text" readonly class="w-full mb-2 p-2 bg-slate-900 border border-slate-700 rounded text-right text-white" value="0">
            <div class="grid grid-cols-4 gap-2">
              <button onclick="calcInput('7')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">7</button>
              <button onclick="calcInput('8')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">8</button>
              <button onclick="calcInput('9')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">9</button>
              <button onclick="calcInput('/')" class="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">/</button>
              <button onclick="calcInput('4')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">4</button>
              <button onclick="calcInput('5')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">5</button>
              <button onclick="calcInput('6')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">6</button>
              <button onclick="calcInput('*')" class="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">x</button>
              <button onclick="calcInput('1')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">1</button>
              <button onclick="calcInput('2')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">2</button>
              <button onclick="calcInput('3')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">3</button>
              <button onclick="calcInput('-')" class="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">-</button>
              <button onclick="calcInput('0')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">0</button>
              <button onclick="calcInput('.')" class="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">.</button>
              <button onclick="calcEquals()" class="p-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white">=</button>
              <button onclick="calcInput('+')" class="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">+</button>
              <button onclick="calcClear()" class="col-span-4 p-2 bg-rose-600 hover:bg-rose-500 rounded text-white">Clear</button>
            </div>
          </div>`,
          script: `let calcValue = '0';
          function calcInput(val) {
            if (calcValue === '0') calcValue = val;
            else calcValue += val;
            document.getElementById('calc-display').value = calcValue;
          }
          function calcEquals() {
            try {
              calcValue = eval(calcValue).toString();
              document.getElementById('calc-display').value = calcValue;
            } catch(e) { calcValue = 'Error'; }
          }
          function calcClear() {
            calcValue = '0';
            document.getElementById('calc-display').value = calcValue;
          }`
        }
      },
      {
        id: "feat-timer",
        title: "Timer",
        enabled: true,
        hiddenFromUser: false,
        userToggleable: true,
        includeUi: true,
        category: "utility",
        description: "Simple countdown timer",
        code: {
          id: "tool-timer",
          html: `<div id="tool-timer" class="hidden fixed bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 w-64">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-white">Timer</h3>
              <button onclick="toggleTool('timer')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <div id="timer-display" class="text-4xl font-bold text-center text-white mb-3">05:00</div>
            <div class="flex gap-2">
              <button onclick="startTimer()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded">Start</button>
              <button onclick="pauseTimer()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded">Pause</button>
              <button onclick="resetTimer()" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded">Reset</button>
            </div>
          </div>`,
          script: `let timerSeconds = 300;
          let timerInterval = null;
          function startTimer() {
            if (timerInterval) return;
            timerInterval = setInterval(() => {
              if (timerSeconds > 0) {
                timerSeconds--;
                const mins = Math.floor(timerSeconds / 60);
                const secs = timerSeconds % 60;
                document.getElementById('timer-display').textContent = mins.toString().padStart(2,'0') + ':' + secs.toString().padStart(2,'0');
              } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert('Timer finished!');
              }
            }, 1000);
          }
          function pauseTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          function resetTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
            timerSeconds = 300;
            document.getElementById('timer-display').textContent = '05:00';
          }`
        }
      },
      {
        id: "feat-print",
        title: "Print Page",
        enabled: true,
        hiddenFromUser: false,
        userToggleable: false,
        includeUi: false,
        category: "utility",
        description: "Adds print button to toolbar",
        code: {
          id: "tool-print",
          html: `<button onclick="window.print()" class="fixed top-4 right-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-50">Print</button>`,
          script: ``
        }
      }
  ]
};

export const MASTER_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MENTAL FITNESS | MASTER CONSOLE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400;0,700;1,400;1,900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
        /* --- GLOBAL & SHARED STYLES --- */
        body { font-family: 'Inter', sans-serif; background-color: #020617; color: #e2e8f0; margin: 0; height: 100vh; overflow: hidden; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass-panel { background: rgba(15, 23, 42, 0.95); border-right: 1px solid rgba(51, 65, 85, 0.5); }
        .custom-scroll { overflow-y: auto; }
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(51, 65, 85, 0.5); }
        input:not(.assessment-input), textarea:not(.assessment-input), select:not(.assessment-input) { background: #0f172a !important; border: 1px solid #1e293b !important; transition: all 0.2s; color: #e2e8f0; }
        input:not(.assessment-input):focus, textarea:not(.assessment-input):focus, select:not(.assessment-input):focus { border-color: #0ea5e9 !important; outline: none; box-shadow: 0 0 0 1px #0ea5e9; }
        
        /* Navigation */
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; transition: all 0.2s; border-left: 2px solid transparent; }
        .nav-item:hover { background: rgba(30, 41, 59, 0.5); color: #e2e8f0; }
        .nav-item.active { background: rgba(14, 165, 233, 0.1); color: #38bdf8; border-left: 2px solid #38bdf8; }

        /* Module Buttons & Tabs */
        .score-btn, .mod-nav-btn, .nav-btn { background: #0f172a; border: 1px solid #1e293b; color: #64748b; transition: all 0.2s; }
        .score-btn:hover, .mod-nav-btn:hover, .nav-btn:hover { border-color: #0ea5e9; color: white; }
        .score-btn.active, .mod-nav-btn.active, .nav-btn.active { background: #0ea5e9; color: #000; font-weight: 900; border-color: #0ea5e9; }
        
        /* Layout Helpers */
        .phase-header { border-left: 4px solid #334155; padding-left: 1rem; margin-bottom: 1rem; }
        .phase-header.active { border-color: #0ea5e9; }
        .step-content { display: none; }
        .step-content.active { display: block; }
        .rubric-cell { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .rubric-cell:hover { background: rgba(255,255,255,0.05); }
        .active-proficient { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; }
        .active-developing { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #f59e0b; }
        .active-emerging { background: rgba(244, 63, 94, 0.2); border: 1px solid #f43f5e; color: #f43f5e; }
        .helper-text { font-size: 8px; color: #64748b; font-style: italic; margin-top: 4px; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .info-card { background: rgba(30, 41, 59, 0.4); border-left: 3px solid #0ea5e9; padding: 1.5rem; border-radius: 0.75rem; }
        .top-ten-input { font-size: 0.75rem; padding: 0.5rem !important; border-radius: 0.375rem !important; }
        
        /* Animations */
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .status-saved { animation: pulse-green 2s infinite; }
        .scan-line { height: 2px; width: 100%; background: rgba(0, 255, 65, 0.2); position: absolute; animation: scan 3s linear infinite; pointer-events: none; }
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
    </style>
</head>
<body class="flex">

    <div class="w-64 glass-panel flex-shrink-0 flex flex-col h-full z-50">
        <div class="p-8 border-b border-slate-800">
            <h1 class="text-xl font-black italic text-white tracking-tighter uppercase leading-none">Mental<br><span class="text-sky-500">Fitness</span></h1>
            <p class="text-[10px] text-slate-500 mt-2 mono uppercase tracking-widest">Master Console v2.0</p>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 space-y-1" id="main-nav">
            <div class="px-4 py-2 mt-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest mono">System Modules</div>
            <!-- Dynamic Modules will be injected here -->
        </nav>
        <div class="p-6 border-t border-slate-800 text-center"><p class="text-[9px] text-slate-600 italic">"Recognition is the trigger for regulation."</p></div>
    </div>

    <div class="flex-1 relative bg-slate-900 h-full overflow-hidden" id="content-container">

        <!-- VIEW: MATERIALS -->
        <div id="view-materials" class="w-full h-full custom-scroll p-8 md:p-12">
            <div class="max-w-5xl mx-auto space-y-8">
                <div class="mb-12">
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-tighter">Course <span class="text-sky-500">Materials</span></h2>
                </div>
                 <div id="pdf-viewer-container" class="hidden mb-12 bg-black rounded-xl border border-slate-700 overflow-hidden shadow-2xl"><div class="flex justify-between items-center p-3 bg-slate-800 border-b border-slate-700"><span id="viewer-title" class="text-xs font-bold text-white uppercase tracking-widest px-2">Document Viewer</span><button data-close-pdf-viewer class="text-xs text-rose-400 hover:text-white font-bold uppercase tracking-widest px-2">Close X</button></div><iframe id="pdf-frame" src="" width="100%" height="600" style="border:none;"></iframe></div>
                 <!-- Initial Materials Placeholder -->
                 <p class="text-slate-500 text-sm">Select a module to begin.</p>
            </div>
        </div>
        
        <!-- Dynamic Views will be injected here -->

        <iframe id="view-external" class="w-full h-full hidden" src=""></iframe>

    </div>

    <!-- MODULE SCRIPTS CONTAINER -->
    <script id="module-scripts">
        // New module logic will be appended here
    </script>

    <script>
        // --- MOBILE NAVIGATION ---
        function toggleMobileNav() {
            const sidebar = document.getElementById('sidebar-nav');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar && overlay) {
                sidebar.classList.toggle('mobile-open');
                overlay.classList.toggle('active');
            }
        }
        
        // Prevent overlay clicks from propagating to sidebar
        document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.getElementById('sidebar-nav');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar && overlay) {
                // Stop clicks on sidebar from bubbling to overlay
                sidebar.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        });
        
        // --- CORE NAVIGATION LOGIC ---
        function switchView(view) {
            console.log('[switchView] Switching to view:', view);
            
            // 1. Handle Mobile Nav
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar-nav');
                const overlay = document.getElementById('mobile-overlay');
                if (sidebar && overlay) {
                    sidebar.classList.remove('mobile-open');
                    overlay.classList.remove('active');
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
    </script>
</body>
</html>`;
