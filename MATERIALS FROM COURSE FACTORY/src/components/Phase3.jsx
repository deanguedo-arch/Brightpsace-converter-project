import * as React from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Download, Lock, Unlock, Upload } from 'lucide-react';
import { CodeBlock } from './Shared.jsx';

const { useState } = React;

// --- PHASE 3: MANAGE & RESET ---
const Phase3 = ({ onGoToMaster, projectData, setProjectData }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "course_factory_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setUnlocked(true); // Unlock reset after download
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const restored = JSON.parse(e.target.result);
        setProjectData(restored);
        // alert("Project Restored Successfully!"); // Removed Alert
      } catch (error) {
        console.error("Invalid backup file", error);
      }
    };
    reader.readAsText(file);
  };

  const resetPrompt = `I need to reset the Course Factory for a new project.
Please modify the \`PROJECT_DATA\` variable at the top of the file.

**Task:**
1. Locate \`PROJECT_DATA\`.
2. Reset \`PROJECT_DATA["Current Course"].modules\` to empty \`[]\`.
3. Change \`name\` to "New Course".

**CRITICAL SAFETY INSTRUCTION:**
- Do NOT touch \`PROJECT_DATA["Global Toolkit"]\`. (Keep all saved features).
- Do NOT touch \`const MASTER_SHELL\`.
- Do NOT touch any React code.

**Expected Result:**
const PROJECT_DATA = {
  "Current Course": {
    name: "New Course",
    modules: [] // Cleared
  },
  "Global Toolkit": [
    ... // Kept intact
  ]
};`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-400" /> Phase 3: Manage & Reset
        </h2>
        
        <div className="space-y-4">
            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-700/50">
                <h3 className="text-sm font-bold text-blue-400 mb-2">1. Backup & Restore</h3>
                <div className="space-y-2">
                    <button 
                        onClick={handleDownload}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <Download size={16} /> Download Project Backup
                    </button>
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".json"
                            onChange={handleUpload}
                            id="restore-upload"
                            className="hidden"
                        />
                        <label 
                            htmlFor="restore-upload"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <Upload size={16} /> Upload & Restore Backup
                        </label>
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all duration-300 ${unlocked ? 'bg-rose-900/20 border-rose-700/50' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-bold ${unlocked ? 'text-rose-400' : 'text-slate-500'}`}>2. Reset Project</h3>
                    {unlocked ? <Unlock size={16} className="text-rose-400"/> : <Lock size={16} className="text-slate-500"/>}
                </div>
                
                {unlocked && !confirmed && (
                    <div className="animate-in fade-in bg-rose-950/30 p-4 rounded-lg border border-rose-800">
                        <h4 className="text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle size={16}/> Final Safety Check
                        </h4>
                        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                            Did you update the <strong>Phase 0: Master Shell</strong> with any new features (like Dark Mode or Save Buttons) you built during this project?
                            <br/><br/>
                            If you Reset now without updating the Master Shell, those improvements will be lost.
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onGoToMaster()} 
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-3 rounded border border-slate-700 flex items-center justify-center gap-2"
                            >
                                <ArrowRight size={14} className="rotate-180" /> No, Take me there
                            </button>
                            <button 
                                onClick={() => setConfirmed(true)} 
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded shadow-lg shadow-rose-900/20"
                            >
                                Yes, I Updated It
                            </button>
                        </div>
                    </div>
                )}

                {unlocked && confirmed && (
                    <div className="animate-in fade-in">
                        <p className="text-xs text-rose-200/70 mb-4">
                            Copy this prompt to Canvas to wipe the Course Content.
                        </p>
                        <CodeBlock label="Canvas Safe Reset Prompt" code={resetPrompt} height="h-40" />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Phase3;

