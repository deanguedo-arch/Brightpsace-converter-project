import * as React from 'react';
import { Eye, X } from 'lucide-react';

export default function PreviewModal({
  previewModule,
  enablePreviewScripts,
  onReset,
  onToggleScripts,
  onClose,
  srcDoc,
  sandbox,
  iframeKey,
}) {
  if (!previewModule) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye size={20} className="text-purple-400" />
            Preview: {previewModule.title || 'Untitled Module'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              title="Forces the iframe to remount"
              type="button"
            >
              Reset Preview
            </button>
            <button
              onClick={onToggleScripts}
              className={`border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                enablePreviewScripts
                  ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
              title="Script execution can run untrusted code. Disable if you only need static preview."
              type="button"
            >
              Warning: Enable Scripts (Unsafe): {enablePreviewScripts ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
              type="button"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-0 overflow-hidden max-h-[calc(90vh-80px)]">
          <iframe
            srcDoc={srcDoc || ''}
            sandbox={sandbox || undefined}
            key={iframeKey}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(90vh - 80px)' }}
          />
        </div>
      </div>
    </div>
  );
}
