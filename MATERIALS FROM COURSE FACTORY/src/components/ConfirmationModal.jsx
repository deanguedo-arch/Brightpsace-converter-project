import * as React from 'react';
import { AlertOctagon } from 'lucide-react';

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel, dependencies }) => {
    if (!isOpen) return null;
    
    const hasDeps = dependencies && dependencies.hasDependencies;
    
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onCancel}>
            <div className={`bg-slate-900 border rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto ${hasDeps ? 'border-amber-900' : 'border-rose-900'}`} onClick={e => e.stopPropagation()}>
                <div className={`flex items-center gap-3 mb-4 ${hasDeps ? 'text-amber-500' : 'text-rose-500'}`}>
                    <AlertOctagon size={24} />
                    <h3 className="text-lg font-bold">{hasDeps ? 'Warning: Dependencies Found' : 'Delete Item?'}</h3>
                </div>
                
                {hasDeps ? (
                    <>
                        <div className="mb-4 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                            <p className="text-amber-200 text-sm mb-3">
                                <strong>"{dependencies.moduleTitle}"</strong> is referenced in {dependencies.totalCount} place{dependencies.totalCount !== 1 ? 's' : ''}:
                            </p>
                            
                            {dependencies.dependencies.modules.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-amber-400 uppercase mb-1">Modules ({dependencies.dependencies.modules.length}):</p>
                                    <ul className="text-xs text-amber-200 space-y-1 ml-4">
                                        {dependencies.dependencies.modules.map(dep => (
                                            <li key={dep.id}>- {dep.title} <span className="text-amber-500">({dep.type})</span></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {dependencies.dependencies.assessments.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-amber-400 uppercase mb-1">Assessments ({dependencies.dependencies.assessments.length}):</p>
                                    <ul className="text-xs text-amber-200 space-y-1 ml-4">
                                        {dependencies.dependencies.assessments.map(dep => (
                                            <li key={dep.id}>- {dep.title} <span className="text-amber-500">(in {dep.moduleTitle})</span></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {dependencies.dependencies.toolkit.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-amber-400 uppercase mb-1">Toolkit Items ({dependencies.dependencies.toolkit.length}):</p>
                                    <ul className="text-xs text-amber-200 space-y-1 ml-4">
                                        {dependencies.dependencies.toolkit.map(dep => (
                                            <li key={dep.id}>- {dep.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {dependencies.dependencies.materials.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-amber-400 uppercase mb-1">Materials ({dependencies.dependencies.materials.length}):</p>
                                    <ul className="text-xs text-amber-200 space-y-1 ml-4">
                                        {dependencies.dependencies.materials.map(dep => (
                                            <li key={dep.id}>- {dep.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <p className="text-xs text-amber-300 mt-3 italic">
                                Deleting this module may break these items. Proceed with caution.
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-slate-300 text-sm mb-6">{message}</p>
                )}
                
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors ${hasDeps ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'}`}>
                        {hasDeps ? 'Delete Anyway (Risky)' : 'Delete Forever'}
                    </button>
                </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
