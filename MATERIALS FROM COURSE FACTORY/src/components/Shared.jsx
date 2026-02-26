import * as React from 'react';
import { Copy, Check, X, CheckCircle, AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

const { useState } = React;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {toasts.map(toast => {
        const colors = {
          success: 'bg-emerald-600 border-emerald-500 text-white',
          error: 'bg-rose-600 border-rose-500 text-white',
          warning: 'bg-amber-600 border-amber-500 text-white',
          info: 'bg-sky-600 border-sky-500 text-white'
        };
        const icons = {
          success: CheckCircle,
          error: AlertOctagon,
          warning: AlertTriangle,
          info: ShieldCheck
        };
        const Icon = icons[toast.type] || ShieldCheck;

        return (
          <div
            key={toast.id}
            className={`${colors[toast.type] || colors.info} border-2 rounded-lg p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300`}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const CodeBlock = ({ label, code, height = "h-32" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = typeof code === 'string' ? code : JSON.stringify(code, null, 2);
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if(successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <div className="mt-4 border border-slate-700 rounded-lg overflow-hidden bg-slate-950 max-w-full min-w-0">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className={`p-4 w-full max-w-full overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all ${height}`}>
        {typeof code === 'string' ? code : JSON.stringify(code, null, 2)}
      </pre>
    </div>
  );
};

export const Toggle = ({ active, labelA, labelB, labelC, onToggle, iconA: IconA, iconB: IconB, iconC: IconC }) => (
    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 mb-6">
        <button 
            onClick={() => onToggle('A')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-bold transition-all ${active === 'A' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
            <IconA size={14} /> {labelA}
        </button>
        <button 
            onClick={() => onToggle('B')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-bold transition-all ${active === 'B' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
            <IconB size={14} /> {labelB}
        </button>
        {labelC && (
             <button 
                onClick={() => onToggle('C')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-bold transition-all ${active === 'C' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <IconC size={14} /> {labelC}
            </button>
        )}
    </div>
);
