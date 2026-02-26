import * as React from 'react';
import { Database, Layers } from 'lucide-react';

// --- PHASE 0: MASTER SHELL ---
const Phase0 = ({ projectData, setProjectData }) => {
  const layoutSettings = projectData?.["Course Settings"]?.layoutSettings || {
    showSidebar: true,
    showFooter: true,
    navPosition: 'side'
  };

  const updateLayoutSetting = (key, value) => {
    setProjectData(prev => ({
      ...prev,
      "Course Settings": {
        ...prev["Course Settings"],
        layoutSettings: {
          showSidebar: true,
          showFooter: true,
          navPosition: 'side',
          ...(prev["Course Settings"]?.layoutSettings || {}),
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-blue-400" /> Phase 0: Master Shell
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Show Sidebar</p>
                <p className="text-[10px] text-slate-500">Controls left navigation panel</p>
              </div>
              <button
                onClick={() => updateLayoutSetting('showSidebar', !layoutSettings.showSidebar)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${layoutSettings.showSidebar ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
              >
                {layoutSettings.showSidebar ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Show Footer</p>
                <p className="text-[10px] text-slate-500">Controls global footer bar</p>
              </div>
              <button
                onClick={() => updateLayoutSetting('showFooter', !layoutSettings.showFooter)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${layoutSettings.showFooter ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
              >
                {layoutSettings.showFooter ? 'On' : 'Off'}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Navigation Style</label>
              <select
                value={layoutSettings.navPosition}
                onChange={(e) => updateLayoutSetting('navPosition', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="side">Side (Left)</option>
                <option value="top">Top (Header)</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            Changes here update the Master Shell layout without touching raw HTML.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- BATCH HARVESTER COMPONENT ---
const BatchHarvester = ({ onImport }) => {
  const [input, setInput] = useState("");
  const [scanned, setScanned] = useState([]);
  const [selected, setSelected] = useState({});

  // --- V7: GAP PARSER ---
  // Instead of counting braces, we capture lines between known function headers.
  // This is safer for "Monolith" files where formatting is consistent line-by-line.
  const extractScriptBlocks = (fullSource, prefix) => {
    if (!prefix) return "";
    
    const lines = fullSource.split('\n');
    const capturedLines = [];
    let capturing = false;
    let braceCount = 0;
    
    // We look for start of function/var definitions with the specific prefix
    const startRegex = new RegExp(`^(function|const|let|var)\\s+${prefix}`);
    // We look for the start of ANY function/var (to know when to stop if logic fails)
    const genericStartRegex = new RegExp(`^(function|const|let|var)\\s+`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]; // Keep whitespace for safety
        const trimmed = line.trim();
        
        // Check if this line starts a relevant block
        if (startRegex.test(trimmed)) {
            capturing = true;
        }
        
        // If we hit a NEW function that DOESN'T match our prefix, 
        // and our braces are balanced (0), we stop.
        // If braces aren't balanced, it might be a nested function, so we keep going.
        if (capturing && genericStartRegex.test(trimmed) && !startRegex.test(trimmed) && braceCount === 0) {
            capturing = false;
        }

        if (capturing) {
            capturedLines.push(line);
            
            // Simple brace tracking to help know when we are "safe" to stop
            // We strip quotes to avoid counting braces inside strings
            const safeLine = trimmed.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '').replace(/`[^`]*`/g, '');
            const open = (safeLine.match(/{/g) || []).length;
            const close = (safeLine.match(/}/g) || []).length;
            braceCount += (open - close);
        }
    }
    
    return capturedLines.join('\n');
  };

  const scanMonolith = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, "text/html");
      
      // Grab script logic (usually at the end)
      const scripts = Array.from(doc.querySelectorAll("script"));
      // Combine all scripts just in case
      const fullScript = scripts.map(s => s.textContent).join('\n\n');
      
      // Find all views
      const views = Array.from(doc.querySelectorAll('[id^="view-"]'));
      const navItems = Array.from(doc.querySelectorAll('.nav-item'));

      const results = views.map((view) => {
        const id = view.id;
        const shortId = id.replace('view-', '');
        
        // 1. Find Title
        let title = shortId.toUpperCase();
        const navBtn = navItems.find(btn => {
            const onClick = btn.getAttribute('onclick') || "";
            return onClick.includes(`'${shortId}'`) || onClick.includes(`"${shortId}"`) || btn.id === `nav-${shortId}`;
        });
        if (navBtn) title = navBtn.innerText.trim();

        // 2. Identify Prefix
        const outerHtml = view.outerHTML;
        const prefixMatch = outerHtml.match(/onclick="([a-zA-Z0-9]+)_[a-zA-Z0-9]+\(/);
        const prefix = prefixMatch ? prefixMatch[1] + '_' : null;

        // 3. Extract Script
        let script = "";
        if (prefix) {
            script = extractScriptBlocks(fullScript, prefix);
        } else if (id === 'view-materials') {
            // Manual fallback for materials
            const match = fullScript.match(/function openPDF[\s\S]*?closeViewer[\s\S]*?}/);
            if(match) script = match[0];
        }

        return { 
            id: id, 
            title: title, 
            html: view.innerHTML.trim(), 
            script: script, 
            selected: true 
        };
      });

      setScanned(results);
      const selObj = {};
      results.forEach((_, i) => selObj[i] = true);
      setSelected(selObj);

    } catch (e) {
      alert("Error parsing HTML: " + e.message);
    }
  };

  const handleImport = () => {
    const toImport = scanned.filter((_, i) => selected[i]);
    onImport(toImport);
    setScanned([]);
    setInput("");
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-8 mb-8">
      <div className="bg-indigo-900/20 p-6 rounded-xl border border-indigo-500/50">
        <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2"><Database size={16}/> Batch Monolith Importer (V7-GapParser)</h3>
        <p className="text-xs text-slate-400 mb-4">Paste the full <code className="bg-slate-800 px-1 rounded">index.html</code> code below. This version uses line-by-line Gap Parsing to safely extract code blocks.</p>
        
        {scanned.length === 0 ? (
            <>
                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 font-mono h-48 focus:border-indigo-500 outline-none resize-y mb-4" 
                    placeholder="<!DOCTYPE html>..."
                />
                <button onClick={scanMonolith} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg text-xs disabled:opacity-50">Scan Code</button>
            </>
        ) : (
            <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scroll bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    {scanned.map((item, idx) => (
                        <label key={idx} className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors group">
                            <input 
                                type="checkbox" 
                                checked={!!selected[idx]} 
                                onChange={(e) => setSelected({...selected, [idx]: e.target.checked})}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</div>
                                    <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.script.length > 50 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                                        {item.script.length > 50 ? 'JS Found' : 'No JS / Global'}
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1">{item.id}</div>
                                {item.script.length > 0 && (
                                    <div className="mt-2 p-2 bg-black/50 rounded text-[9px] font-mono text-slate-600 truncate border border-slate-800">
                                        {item.script.substring(0, 100).replace(/\n/g, ' ')}...
                                    </div>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setScanned([])} className="flex-1 bg-slate-800 text-slate-400 py-3 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleImport} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 transition-colors">Import {Object.values(selected).filter(x=>x).length} Modules</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// THE BULLETPROOF VEST: Cleans up messy AI output or raw text input
const sanitizeImportData = (input) => {
  let cleanData = [];
  try {
    // 1. Try to parse as JSON first (AI Path)
    let jsonString = input.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
    const parsed = JSON.parse(jsonString);
    const rawArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);

    cleanData = rawArray.map(q => {
      const questionText = String(q.question || q.q || "Untitled Question");
      const optionsArray = Array.isArray(q.options) ? q.options.map(opt => String(opt || '')) : [];
      const hasOptions = optionsArray.length > 0;
      
      return {
        type: hasOptions ? 'multiple-choice' : 'long-answer',
        question: questionText,
        options: optionsArray,
        // Fix Answer Index: Convert "A" to 0 (only for multiple-choice)
        correct: hasOptions 
          ? ((typeof q.correct === 'string') 
              ? (isNaN(q.correct) ? q.correct.toUpperCase().charCodeAt(0) - 65 : parseInt(q.correct)) 
              : (q.correct || 0))
          : 0
      };
    });
    return { data: cleanData, success: true };
  } catch (e) {
    // 2. Fall back to "Smart Text Parser" (Regex Path)
    const lines = input.split('\n').filter(l => l.trim());
    const questions = [];
    let current = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      // Match "1. " or "Q1."
      if (/^(Q?\d+[\.)]|Question\s+\d+)/i.test(trimmed)) {
        if(current) questions.push(current);
        current = { 
          type: 'long-answer', // Default to long-answer, will change if options found
          question: trimmed.replace(/^(Q?\d+[\.)]|Question\s+\d+)\s*/, ''), 
          options: [], 
          correct: 0 
        };
      } 
      // Match "a. " or "- " (multiple choice options)
      else if (/^[a-d][\.)\)]\s/i.test(trimmed) || trimmed.startsWith('- ')) {
        if(current) {
          if(current.options.length === 0) current.type = 'multiple-choice';
          current.options.push(trimmed.replace(/^[a-d][\.)\)]\s/i, '').replace(/^- \s/, ''));
        }
      }
      // Match "Answer: A"
      else if (/^(ans|answer|correct):\s*([a-d])/i.test(trimmed) && current) {
        current.correct = trimmed.match(/([a-d])/i)[1].toUpperCase().charCodeAt(0) - 65;
      }
      // Append loose text to question (if no options yet, it's part of the question)
      else if (current) {
        if (current.options.length === 0) {
          current.question += " " + trimmed;
        }
      }
    });
    if(current) questions.push(current);
    return { data: questions, success: questions.length > 0 };
  }
};

export default Phase0;

