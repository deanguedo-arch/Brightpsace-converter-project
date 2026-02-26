import * as React from 'react';
import { AlertTriangle, Box, Eye, FileCode, X } from 'lucide-react';

const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;
  
  const getErrorIcon = () => {
    switch (error.type) {
      case 'compile': return <FileCode size={20} />;
      case 'preview': return <Eye size={20} />;
      case 'module': return <Box size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };
  
  const getErrorColor = () => {
    switch (error.type) {
      case 'compile': return 'rose';
      case 'preview': return 'amber';
      case 'module': return 'purple';
      default: return 'rose';
    }
  };
  
  const color = getErrorColor();
  const colorClasses = {
    rose: { bg: 'bg-rose-900/20', border: 'border-rose-500/50', text: 'text-rose-400', icon: 'text-rose-500' },
    amber: { bg: 'bg-amber-900/20', border: 'border-amber-500/50', text: 'text-amber-400', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-900/20', border: 'border-purple-500/50', text: 'text-purple-400', icon: 'text-purple-500' }
  };
  const colors = colorClasses[color];
  
  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-md animate-in slide-in-from-top-4 fade-in duration-300 ${colors.bg} ${colors.border} border rounded-xl p-4 shadow-2xl backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {getErrorIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`${colors.text} font-bold text-sm uppercase tracking-wider`}>
              {error.type === 'compile' ? 'Compilation Error' : 
               error.type === 'preview' ? 'Preview Error' : 
               error.type === 'module' ? 'Module Error' : 'Error'}
            </h3>
            <button
              onClick={onDismiss}
              className={`${colors.text} hover:text-white transition-colors flex-shrink-0`}
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-white text-sm mb-2">{error.message}</p>
          {error.details && (
            <details className="mt-2">
              <summary className={`${colors.text} text-xs cursor-pointer hover:text-white transition-colors`}>
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-700 overflow-auto max-h-32 font-mono">
                {error.details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
