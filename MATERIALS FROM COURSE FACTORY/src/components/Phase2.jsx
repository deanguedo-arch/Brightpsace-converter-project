import * as React from 'react';
import { Box, CheckCircle, Download, Eye, FileCode, FolderOpen, Lock, PenTool, Save, Search, Trash2, X } from 'lucide-react';
import { buildPreviewStorageScope, buildScopedStorageBootstrapTag, cleanModuleScript } from '../utils/generators.js';

const { useState } = React;

// --- PHASE 2: PREVIEW & TEST ---
const Phase2 = ({ projectData, setProjectData, editMaterial, onEdit, onPreview, onDelete, deleteMaterial, deleteAssessment }) => {
  const [sourceType, setSourceType] = useState('MODULE'); // 'MODULE', 'ASSESSMENT', or 'MATERIAL'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [materialPreview, setMaterialPreview] = useState(null);
  const [materialEdit, setMaterialEdit] = useState(null);
  const [assessmentPreview, setAssessmentPreview] = useState(null);
  const [assessmentEdit, setAssessmentEdit] = useState(null);
  
  const currentCourse = projectData["Current Course"]?.modules || [];
  const courseMaterials = projectData["Current Course"]?.materials || [];
  const allAssessments = currentCourse.flatMap(m => (m.assessments || []).map(a => ({...a, moduleName: m.title})));
  const assessmentPreviewStorageScope = React.useMemo(
    () => buildPreviewStorageScope('phase2-assessment-preview', assessmentPreview?.id || assessmentPreview?.title || 'assessment'),
    [assessmentPreview?.id, assessmentPreview?.title],
  );
  
  const items = sourceType === 'MODULE'
    ? currentCourse
    : sourceType === 'ASSESSMENT'
      ? allAssessments
      : sourceType === 'MATERIAL'
        ? courseMaterials
        : [];
  
  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreview = (index) => {
    const item = filteredItems[index];
    setSelectedItem(item);
    
    // Show material preview modal
    if (sourceType === 'MATERIAL') {
      setMaterialPreview(item);
      return;
    }
    if (sourceType === 'ASSESSMENT') {
      setAssessmentPreview(item);
      return;
    }
    
    if (onPreview) {
      onPreview(item);
    }
  };

  const handleEdit = (index) => {
    const item = filteredItems[index];
    
    // Show material edit modal
    if (sourceType === 'MATERIAL') {
      setMaterialEdit(item);
      return;
    }
    if (sourceType === 'ASSESSMENT') {
      setAssessmentEdit(item);
      return;
    }
    
    if (onEdit) {
      onEdit(item);
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

  const handleDelete = (index) => {
    const item = filteredItems[index];

    if (sourceType === 'MATERIAL' && deleteMaterial) {
      deleteMaterial(item.id);
      return;
    }
    if (sourceType === 'ASSESSMENT' && deleteAssessment) {
      deleteAssessment(item.id);
      return;
    }
    if (sourceType === 'MODULE') {
      // Prevent deletion of protected modules
      if (isProtectedModule(item)) {
        alert('Warning: Course Materials and Assessments are core modules and cannot be deleted.\n\nYou can hide them instead using the hide/show toggle.');
        return;
      }
      if (onDelete) {
        onDelete(item);
      }
    }
  };

  const getCodeStats = (item) => {
    try {
      // Materials and Assessments don't have code property
      if (!item.code) {
        return { htmlLength: 0, scriptLength: 0, total: 0 };
      }
      const code = typeof item.code === 'string' ? JSON.parse(item.code) : item.code;
      const htmlLength = code.html?.length || 0;
      const scriptLength = code.script?.length || 0;
      return { htmlLength, scriptLength, total: htmlLength + scriptLength };
    } catch (e) {
      return { htmlLength: 0, scriptLength: 0, total: 0 };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="text-purple-400" /> Phase 2: Preview & Test
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Browse, preview, and test your modules, assessments, and materials before compiling.
        </p>

        {/* SOURCE TOGGLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 mb-4">
            <button 
                onClick={() => { setSourceType('MODULE'); setSearchQuery(""); setSelectedItem(null); }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${sourceType === 'MODULE' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Box size={14} /> Modules ({currentCourse.length})
            </button>
            <button 
                onClick={() => { setSourceType('ASSESSMENT'); setSearchQuery(""); setSelectedItem(null); }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${sourceType === 'ASSESSMENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <CheckCircle size={14} /> Assessments
            </button>
            <button 
                onClick={() => { setSourceType('MATERIAL'); setSearchQuery(""); setSelectedItem(null); }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${sourceType === 'MATERIAL' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <FolderOpen size={14} /> Materials
            </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or ID..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
            />
        </div>

        {/* ITEM GRID */}
        {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-700 rounded-xl">
                <Box size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-400 text-sm mb-2">
                    {searchQuery ? 'No items match your search' : `No ${sourceType === 'MODULE' ? 'modules' : sourceType === 'ASSESSMENT' ? 'assessments' : 'materials'} yet`}
                </p>
                <p className="text-slate-600 text-xs">
                    {!searchQuery && 'Go to Phase 1: Harvest to create some!'}
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item, idx) => {
                    const stats = getCodeStats(item);
                    
                    return (
                        <div 
                            key={item.id} 
                            className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 font-mono truncate">{item.id}</p>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                  sourceType === 'MODULE'
                                    ? 'bg-purple-900/30 text-purple-400'
                                    : sourceType === 'ASSESSMENT'
                                      ? 'bg-blue-900/30 text-blue-400'
                                      : 'bg-cyan-900/30 text-cyan-400'
                                }`}>
                                    {sourceType === 'MODULE' ? 'Module' : sourceType === 'ASSESSMENT' ? 'Assessment' : 'Material'}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                                <FileCode size={12} />
                                <span>{(stats.total / 1024).toFixed(1)} KB</span>
                                <span className="text-slate-700">|</span>
                                <span>{stats.htmlLength > 0 ? 'Has HTML' : 'No HTML'}</span>
                                <span className="text-slate-700">|</span>
                                <span>{stats.scriptLength > 0 ? 'Has Script' : 'No Script'}</span>
                            </div>

                            {item.section && (
                                <div className="mb-3">
                                    <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400">
                                        {item.section}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handlePreview(idx)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded transition-colors"
                                >
                                    <Eye size={12} /> Preview
                                </button>
                                <button 
                                    onClick={() => handleEdit(idx)}
                                    className="flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded transition-colors"
                                    title="Edit"
                                >
                                    <PenTool size={12} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(idx)}
                                    disabled={sourceType === 'MODULE' && isProtectedModule(item)}
                                    className={`flex items-center justify-center gap-1 text-white text-xs font-bold px-3 py-2 rounded transition-colors ${
                                        sourceType === 'MODULE' && isProtectedModule(item) 
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                                            : 'bg-slate-700 hover:bg-rose-600'
                                    }`}
                                    title={sourceType === 'MODULE' && isProtectedModule(item) ? 'Core modules cannot be deleted. Hide them instead.' : 'Delete'}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            
                            {/* Protected Module Indicator */}
                            {sourceType === 'MODULE' && isProtectedModule(item) && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
                                    <Lock size={10} />
                                    <span>Core module (cannot be deleted)</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>
      
      {/* MATERIAL PREVIEW MODAL */}
      {materialPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMaterialPreview(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye size={20} className="text-cyan-400" />
                  Material Preview: {materialPreview.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{materialPreview.description}</p>
              </div>
              <button onClick={() => setMaterialPreview(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {materialPreview.viewUrl && (
        <div className="mb-6">
                  <div className="bg-black rounded-lg border border-slate-700 overflow-hidden">
                    <iframe 
                      src={materialPreview.viewUrl.replace('/view', '/preview')} 
                      width="100%" 
                      height="600" 
                      style={{border: 'none'}}
                      title={materialPreview.title}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Number</span>
                  <p className="text-white">{materialPreview.number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Color</span>
                  <p className="text-white capitalize">{materialPreview.color || 'slate'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">View URL</span>
                  <p className="text-cyan-400 text-xs break-all">{materialPreview.viewUrl || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Download URL</span>
                  <p className="text-cyan-400 text-xs break-all">{materialPreview.downloadUrl || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Digital Content</span>
                  {materialPreview.digitalContent ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs rounded font-bold">
                        Enabled - {materialPreview.digitalContent.chapters?.length || 0} Chapters
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">Not configured</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    setMaterialPreview(null);
                    setMaterialEdit(materialPreview);
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <PenTool size={16} /> Edit Material
                </button>
                {materialPreview.downloadUrl && (
                  <a 
                    href={materialPreview.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MATERIAL EDIT MODAL */}
      {materialEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMaterialEdit(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PenTool size={20} className="text-cyan-400" />
                Edit Material
              </h3>
              <button onClick={() => setMaterialEdit(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Number</label>
                    <input 
                      type="text"
                      value={materialEdit.number || ''}
                      onChange={(e) => setMaterialEdit({...materialEdit, number: e.target.value})}
                      placeholder="e.g., 05"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Color</label>
            <select 
                      value={materialEdit.color || 'slate'}
                      onChange={(e) => setMaterialEdit({...materialEdit, color: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                    >
                      <option value="slate">Gray</option>
                      <option value="rose">Red</option>
                      <option value="amber">Orange</option>
                      <option value="emerald">Green</option>
                      <option value="sky">Blue</option>
                      <option value="purple">Purple</option>
            </select>
                  </div>
        </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Title</label>
                  <input 
                    type="text"
                    value={materialEdit.title || ''}
                    onChange={(e) => setMaterialEdit({...materialEdit, title: e.target.value})}
                    placeholder="Material title"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                  <input 
                    type="text"
                    value={materialEdit.description || ''}
                    onChange={(e) => setMaterialEdit({...materialEdit, description: e.target.value})}
                    placeholder="Brief description"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">View URL</label>
                  <input 
                    type="text"
                    value={materialEdit.viewUrl || ''}
                    onChange={(e) => setMaterialEdit({...materialEdit, viewUrl: e.target.value})}
                    placeholder="Google Drive /preview or /view link"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-xs font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Download URL</label>
                  <input 
                    type="text"
                    value={materialEdit.downloadUrl || ''}
                    onChange={(e) => setMaterialEdit({...materialEdit, downloadUrl: e.target.value})}
                    placeholder="Google Drive /view link"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-xs font-mono"
                  />
                </div>
                
                {/* Digital Content */}
                <div className="p-4 bg-black/30 rounded-lg border border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input 
                      type="checkbox"
                      checked={!!materialEdit.digitalContent}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMaterialEdit({...materialEdit, digitalContent: materialEdit.digitalContent || {}, digitalContentJson: materialEdit.digitalContentJson || ''});
                        } else {
                          setMaterialEdit({...materialEdit, digitalContent: null, digitalContentJson: ''});
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-600"
                    />
                    <span className="text-xs font-bold text-emerald-400 uppercase">Enable Digital Resource</span>
                  </label>
                  {materialEdit.digitalContent && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-2">Paste JSON content for a themed, readable digital version</p>
                      <textarea
                        value={materialEdit.digitalContentJson || (materialEdit.digitalContent ? JSON.stringify(materialEdit.digitalContent, null, 2) : '')}
                        onChange={(e) => {
                          const json = e.target.value;
                          try {
                            if (json.trim()) {
                              const parsed = JSON.parse(json);
                              setMaterialEdit({...materialEdit, digitalContent: parsed, digitalContentJson: json});
                            } else {
                              setMaterialEdit({...materialEdit, digitalContentJson: json});
                            }
                          } catch(err) {
                            setMaterialEdit({...materialEdit, digitalContentJson: json});
                          }
                        }}
                        placeholder='{"title": "My Resource", "chapters": [...]}'
                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-xs font-mono h-40 resize-none"
                      />
                      {materialEdit.digitalContentJson && (
                        <div className="mt-2">
                          {(() => {
                            try {
                              const parsed = JSON.parse(materialEdit.digitalContentJson);
                              const chapterCount = parsed.chapters?.length || 0;
                              const sectionCount = parsed.chapters?.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0) || 0;
                              return <p className="text-[10px] text-emerald-400">Valid JSON: {chapterCount} chapter{chapterCount !== 1 ? 's' : ''}, {sectionCount} section{sectionCount !== 1 ? 's' : ''}</p>;
                            } catch(e) {
                              return <p className="text-[10px] text-rose-400">Invalid JSON: {e.message}</p>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setMaterialEdit(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (editMaterial) {
                        editMaterial(materialEdit.id, materialEdit);
                      }
                      setMaterialEdit(null);
                    }}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ASSESSMENT PREVIEW MODAL */}
      {assessmentPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssessmentPreview(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye size={20} className="text-blue-400" />
                  Assessment Preview: {assessmentPreview.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Interactive preview with full functionality</p>
              </div>
              <button onClick={() => setAssessmentPreview(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-0 max-h-[calc(90vh-80px)] overflow-y-auto">
              <iframe 
                srcDoc={(() => {
                  // Sanitize assessment content for preview
                  const safeHtml = assessmentPreview.html || '<p class="text-slate-500">No HTML content</p>';
                  const safeScript = cleanModuleScript(assessmentPreview.script || '');
                  const scopedStorageBootstrapTag = buildScopedStorageBootstrapTag(assessmentPreviewStorageScope);
                  return `<!DOCTYPE html><html><head>${scopedStorageBootstrapTag}<script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css?family=Inter:wght@400;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet"><style>body{background:#020617;color:#e2e8f0;font-family:'Inter',sans-serif;padding:20px;}.mono{font-family:'JetBrains Mono',monospace;}.score-btn{background:#0f172a;border:1px solid #1e293b;color:#64748b;transition:all 0.2s;}.score-btn:hover{border-color:#0ea5e9;color:white;}.score-btn.active{background:#0ea5e9;color:#000;font-weight:900;border-color:#0ea5e9;}.rubric-cell{cursor:pointer;transition:all 0.2s;border:1px solid transparent;}.rubric-cell:hover{background:rgba(255,255,255,0.05);}.active-proficient{background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#10b981;}.active-developing{background:rgba(245,158,11,0.2);border:1px solid #f59e0b;color:#f59e0b;}.active-emerging{background:rgba(244,63,94,0.2);border:1px solid #f43f5e;color:#f43f5e;}</style></head><body>${safeHtml}<script>${safeScript}<\/script></body></html>`;
                })()}
                className="w-full border-0"
                style={{ minHeight: '600px' }}
                title={assessmentPreview.title || 'Assessment Preview'}
              />
            </div>
            
            <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                <strong className="text-white">Tip:</strong> This assessment will function exactly like this in your compiled site
              </div>
              <button 
                onClick={() => {
                  setAssessmentPreview(null);
                  setAssessmentEdit(assessmentPreview);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PenTool size={16} /> Edit Assessment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ASSESSMENT EDIT MODAL */}
      {assessmentEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssessmentEdit(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PenTool size={20} className="text-blue-400" />
                Edit Assessment
              </h3>
              <button onClick={() => setAssessmentEdit(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-amber-300">
                  <strong>Note:</strong> For complex edits, please use Phase 1's Assessment Builder. This editor is for quick title changes only.
                </p>
              </div>
              
              <div className="space-y-4">
                        <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assessment Title</label>
                  <input 
                    type="text"
                    value={assessmentEdit.title || ''}
                    onChange={(e) => setAssessmentEdit({...assessmentEdit, title: e.target.value})}
                    placeholder="Assessment title"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                  />
                        </div>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Type</span>
                    <p className="text-white capitalize">{assessmentEdit.type || 'Quiz'}</p>
                        </div>
                        <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Question Count</span>
                    <p className="text-white">{assessmentEdit.questionCount || 'N/A'}</p>
                        </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Assessment ID</span>
                    <p className="text-blue-400 text-xs font-mono">{assessmentEdit.id}</p>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setAssessmentEdit(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      // Update assessment in projectData
                      const assessmentsModule = projectData["Current Course"]?.modules?.find(m => m.id === "item-assessments" || m.title === "Assessments");
                      if (assessmentsModule) {
                        const updated = assessmentsModule.assessments.map(a => 
                          a.id === assessmentEdit.id ? { ...a, title: assessmentEdit.title } : a
                        );
                        const moduleIndex = projectData["Current Course"].modules.findIndex(m => m.id === assessmentsModule.id);
                        const newModules = [...projectData["Current Course"].modules];
                        newModules[moduleIndex] = { ...assessmentsModule, assessments: updated };
                        setProjectData({
                          ...projectData,
                          "Current Course": { ...projectData["Current Course"], modules: newModules }
                        });
                      }
                      setAssessmentEdit(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                    </div>
            </div>
      </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2;

