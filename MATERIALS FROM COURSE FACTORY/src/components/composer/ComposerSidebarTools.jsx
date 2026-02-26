import * as React from 'react';
import { AlertTriangle, Copy, Search, Trash2 } from 'lucide-react';
import { getActivityDefinition, validateComposerActivities } from '../../composer/activityRegistry.js';

const { useEffect, useMemo, useState } = React;

const TEMPLATES_STORAGE_KEY = 'course_factory_composer_activity_templates_v1';
const MAX_TEMPLATES = 50;

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function deepClone(value) {
  if (value == null) return value;
  try {
    if (typeof structuredClone === 'function') return structuredClone(value);
  } catch {
    // fall through
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function loadTemplates() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  const templates = Array.isArray(safeJsonParse(raw || '[]', [])) ? safeJsonParse(raw || '[]', []) : [];
  return templates
    .filter((t) => t && typeof t === 'object' && t.id && t.activity && t.activity.type)
    .slice(0, MAX_TEMPLATES);
}

function persistTemplates(nextTemplates) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify((nextTemplates || []).slice(0, MAX_TEMPLATES)));
  } catch (err) {
    console.error('Failed to persist composer templates:', err);
  }
}

function countIssues(results) {
  const totals = { error: 0, warn: 0 };
  (results || []).forEach((row) => {
    (row?.issues || []).forEach((issue) => {
      if (issue?.level === 'error') totals.error += 1;
      else totals.warn += 1;
    });
  });
  return totals;
}

const ComposerSidebarTools = ({
  mode,
  activities,
  selectedIndex,
  selectedActivity,
  onSelectIndex,
  onDuplicateSelected,
  onDeleteSelected,
  onInsertActivity,
}) => {
  const [search, setSearch] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState(() => loadTemplates());

  useEffect(() => {
    if (!selectedActivity) return;
    const def = getActivityDefinition(selectedActivity.type);
    setTemplateName(def?.label ? `${def.label} Template` : `${selectedActivity.type} Template`);
  }, [selectedActivity?.id, selectedActivity?.type]);

  const filteredActivities = useMemo(() => {
    const term = String(search || '').trim().toLowerCase();
    const list = Array.isArray(activities) ? activities : [];
    if (!term) return list.map((a, idx) => ({ activity: a, idx }));
    return list
      .map((activity, idx) => ({ activity, idx }))
      .filter(({ activity }) => {
        const def = getActivityDefinition(activity?.type);
        const label = String(def?.label || activity?.type || '').toLowerCase();
        const id = String(activity?.id || '').toLowerCase();
        return label.includes(term) || id.includes(term);
      });
  }, [activities, search]);

  const validationResults = useMemo(() => validateComposerActivities(activities), [activities]);
  const validationTotals = useMemo(() => countIssues(validationResults), [validationResults]);
  const rowsWithIssues = useMemo(
    () => validationResults.filter((row) => Array.isArray(row.issues) && row.issues.length > 0),
    [validationResults],
  );

  const saveTemplateFromSelected = () => {
    if (!selectedActivity) return;
    const name = String(templateName || '').trim() || 'Untitled Template';
    const template = {
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: new Date().toISOString(),
      activity: {
        type: selectedActivity.type,
        data: deepClone(selectedActivity.data || {}),
        layout: { colSpan: selectedActivity?.layout?.colSpan || 1 },
      },
    };
    const nextTemplates = [template, ...(templates || [])].slice(0, MAX_TEMPLATES);
    setTemplates(nextTemplates);
    persistTemplates(nextTemplates);
  };

  const deleteTemplate = (templateId) => {
    const nextTemplates = (templates || []).filter((t) => t?.id !== templateId);
    setTemplates(nextTemplates);
    persistTemplates(nextTemplates);
  };

  if (mode === 'templates') {
    return (
      <div className="space-y-3">
        <div className="p-2 rounded border border-slate-700 bg-slate-900/60">
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Templates</p>
          <p className="text-[10px] text-slate-500">
            Save an activity as a reusable snippet. Templates are stored in your browser (localStorage).
          </p>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="col-span-9 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            placeholder="Template name"
          />
          <button
            type="button"
            onClick={saveTemplateFromSelected}
            disabled={!selectedActivity}
            className="col-span-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded text-xs font-bold text-white inline-flex items-center justify-center gap-1"
            title="Save the selected activity as a template"
          >
            <Copy size={12} /> Save
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
          {(templates || []).length === 0 ? (
            <p className="text-xs text-slate-500">No templates saved yet.</p>
          ) : (
            (templates || []).map((tpl) => (
              <div key={tpl.id} className="p-2 rounded border border-slate-700 bg-slate-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{tpl.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{tpl.activity?.type || ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onInsertActivity && onInsertActivity(tpl.activity)}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(tpl.id)}
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white"
                      title="Delete template"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (mode === 'issues') {
    return (
      <div className="space-y-3">
        <div className="p-2 rounded border border-slate-700 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Validation</p>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className={validationTotals.error ? 'text-rose-400' : 'text-slate-500'}>
                {validationTotals.error} errors
              </span>
              <span className={validationTotals.warn ? 'text-amber-300' : 'text-slate-500'}>
                {validationTotals.warn} warnings
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Click an activity to jump to it.</p>
        </div>

        <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
          {rowsWithIssues.length === 0 ? (
            <p className="text-xs text-slate-500">No issues found.</p>
          ) : (
            rowsWithIssues.map((row) => {
              const def = getActivityDefinition(row.type);
              const isSelected = row.index === selectedIndex;
              return (
                <button
                  key={`${row.id || row.index}`}
                  type="button"
                  onClick={() => onSelectIndex && onSelectIndex(row.index)}
                  className={`w-full text-left p-2 rounded border transition-colors ${
                    isSelected
                      ? 'bg-emerald-900/30 border-emerald-600 text-white'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{def?.label || row.type}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{row.id || `activity-${row.index + 1}`}</p>
                    </div>
                    <AlertTriangle
                      size={14}
                      className={row.issues.some((i) => i.level === 'error') ? 'text-rose-400' : 'text-amber-300'}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {row.issues.slice(0, 3).map((issue, idx) => (
                      <p
                        key={`${row.index}-issue-${idx}`}
                        className={`text-[10px] ${
                          issue.level === 'error' ? 'text-rose-300' : 'text-amber-200'
                        }`}
                      >
                        {issue.level === 'error' ? 'Error' : 'Warn'}: {issue.message}
                      </p>
                    ))}
                    {row.issues.length > 3 ? (
                      <p className="text-[10px] text-slate-500">+{row.issues.length - 3} more…</p>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Outline view
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-9 text-white text-xs"
          placeholder="Search by type or id..."
        />
      </div>

      <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
        {filteredActivities.length === 0 ? (
          <p className="text-xs text-slate-500">No matching activities.</p>
        ) : (
          filteredActivities.map(({ activity, idx }) => {
            const def = getActivityDefinition(activity?.type);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={activity?.id || `${activity?.type}-${idx}`}
                type="button"
                onClick={() => onSelectIndex && onSelectIndex(idx)}
                className={`w-full text-left p-2 rounded border transition-colors ${
                  isSelected
                    ? 'bg-emerald-900/30 border-emerald-600 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-900'
                }`}
              >
                <p className="text-xs font-bold truncate">
                  {idx + 1}. {def?.label || activity?.type || 'Unknown'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{activity?.id || `activity-${idx + 1}`}</p>
              </button>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onDuplicateSelected}
          disabled={!selectedActivity}
          className="rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold py-2 inline-flex items-center justify-center gap-1"
        >
          <Copy size={12} /> Duplicate
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!selectedActivity}
          className="rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold py-2 inline-flex items-center justify-center gap-1"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
};

export default ComposerSidebarTools;

