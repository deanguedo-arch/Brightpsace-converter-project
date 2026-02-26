import * as React from 'react';

const Section = ({ title, icon: Icon, isActive, onClick, badge, badgeColor }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    <div className="flex items-center gap-2">
      <Icon size={16} />
      <span>{title}</span>
    </div>
    {badge !== undefined && (
      <span className={`${badgeColor || 'bg-slate-700'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
        {badge}
      </span>
    )}
  </button>
);

export default Section;
