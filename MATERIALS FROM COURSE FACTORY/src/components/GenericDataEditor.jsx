import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }
  if (isPlainObject(value)) {
    const next = {};
    Object.entries(value).forEach(([key, item]) => {
      next[key] = cloneDeep(item);
    });
    return next;
  }
  return value;
}

function getAtPath(root, path) {
  return path.reduce((cursor, key) => (cursor == null ? cursor : cursor[key]), root);
}

function setAtPath(root, path, nextValue) {
  const cloned = cloneDeep(root);
  if (!path.length) return cloned;
  let cursor = cloned;
  for (let idx = 0; idx < path.length - 1; idx += 1) {
    const segment = path[idx];
    cursor[segment] = cloneDeep(cursor[segment]);
    cursor = cursor[segment];
  }
  cursor[path[path.length - 1]] = nextValue;
  return cloned;
}

function removeArrayItem(root, path, itemIndex) {
  const cloned = cloneDeep(root);
  const target = getAtPath(cloned, path);
  if (!Array.isArray(target)) return cloned;
  target.splice(itemIndex, 1);
  return cloned;
}

function appendArrayItem(root, path, item) {
  const cloned = cloneDeep(root);
  const target = getAtPath(cloned, path);
  if (!Array.isArray(target)) return cloned;
  target.push(item);
  return cloned;
}

function inferBlankValue(template) {
  if (typeof template === 'number') return 0;
  if (typeof template === 'boolean') return false;
  if (Array.isArray(template)) return [];
  if (isPlainObject(template)) {
    const next = {};
    Object.entries(template).forEach(([key, value]) => {
      next[key] = inferBlankValue(value);
    });
    return next;
  }
  return '';
}

function formatLabel(key) {
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getPathKey(path) {
  return path.join('.');
}

export default function GenericDataEditor({ data, onChange, schemaTemplate = null }) {
  const source = isPlainObject(data) ? data : {};
  const topLevelEntries = Object.entries(source);
  const [jsonErrors, setJsonErrors] = React.useState({});

  const getTemplateAtPath = (path) => {
    const fromSchema = getAtPath(schemaTemplate, path);
    if (fromSchema !== undefined) return fromSchema;
    return getAtPath(source, path);
  };

  const clearJsonError = (path) => {
    const key = getPathKey(path);
    setJsonErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applyPathUpdate = (path, value) => {
    clearJsonError(path);
    onChange(setAtPath(source, path, value));
  };

  const removeAtPath = (path, itemIndex) => {
    onChange(removeArrayItem(source, path, itemIndex));
  };

  const appendAtPath = (path, template) => {
    onChange(appendArrayItem(source, path, inferBlankValue(template)));
  };

  const resolveArrayItemTemplate = (path, items) => {
    const fromSchema = getTemplateAtPath(path);
    if (Array.isArray(fromSchema) && fromSchema.length > 0) {
      return fromSchema[0];
    }
    if (Array.isArray(items) && items.length > 0) {
      const firstDefined = items.find((item) => item !== undefined);
      if (firstDefined !== undefined) return firstDefined;
    }
    return '';
  };

  const renderPrimitiveEditor = (path, label, value) => {
    if (typeof value === 'boolean') {
      return (
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => applyPathUpdate(path, event.target.checked)}
            className="w-4 h-4"
          />
          {label}
        </label>
      );
    }

    if (typeof value === 'number') {
      return (
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
          <input
            type="number"
            value={Number.isFinite(value) ? value : 0}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              applyPathUpdate(path, Number.isFinite(parsed) ? parsed : 0);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
          />
        </div>
      );
    }

    const textValue = value == null ? '' : String(value);
    const useTextarea = textValue.length > 120 || textValue.includes('\n');
    if (useTextarea) {
      return (
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
          <textarea
            value={textValue}
            onChange={(event) => applyPathUpdate(path, event.target.value)}
            className="w-full min-h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
        <input
          type="text"
          value={textValue}
          onChange={(event) => applyPathUpdate(path, event.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
        />
      </div>
    );
  };

  const renderJsonFallback = (path, label, value) => {
    const errorKey = getPathKey(path);
    const errorText = jsonErrors[errorKey] || '';
    return (
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
        <textarea
          key={`json-field-${errorKey}`}
          defaultValue={JSON.stringify(value, null, 2)}
          onBlur={(event) => {
            try {
              const parsed = JSON.parse(event.target.value || 'null');
              clearJsonError(path);
              applyPathUpdate(path, parsed);
            } catch {
              setJsonErrors((prev) => ({ ...prev, [errorKey]: 'Invalid JSON. Fix syntax to apply changes.' }));
            }
          }}
          className={`w-full min-h-24 bg-slate-950 border rounded p-2 text-xs text-slate-200 font-mono ${
            errorText ? 'border-rose-500' : 'border-slate-700'
          }`}
          spellCheck={false}
        />
        {errorText ? <p className="text-[11px] text-rose-400 mt-1">{errorText}</p> : null}
      </div>
    );
  };

  const renderArrayOfPrimitives = (path, label, items) => (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
      {items.map((item, idx) => {
        const itemType = typeof item;
        const itemPath = [...path, idx];
        if (itemType === 'boolean') {
          return (
            <div key={`${path.join('.')}-${idx}`} className="grid grid-cols-12 gap-2">
              <label className="col-span-10 inline-flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-700 rounded p-2">
                <input
                  type="checkbox"
                  checked={Boolean(item)}
                  onChange={(event) => applyPathUpdate(itemPath, event.target.checked)}
                  className="w-4 h-4"
                />
                Item {idx + 1}
              </label>
              <button
                type="button"
                onClick={() => removeAtPath(path, idx)}
                className="col-span-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
                title="Remove item"
              >
                <Trash2 size={12} className="mx-auto" />
              </button>
            </div>
          );
        }
        return (
          <div key={`${path.join('.')}-${idx}`} className="grid grid-cols-12 gap-2">
            <input
              type={itemType === 'number' ? 'number' : 'text'}
              value={item == null ? '' : item}
              onChange={(event) => {
                if (itemType === 'number') {
                  const parsed = Number(event.target.value);
                  applyPathUpdate(itemPath, Number.isFinite(parsed) ? parsed : 0);
                  return;
                }
                applyPathUpdate(itemPath, event.target.value);
              }}
              className="col-span-10 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              placeholder={`Item ${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => removeAtPath(path, idx)}
              className="col-span-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs"
              title="Remove item"
            >
              <Trash2 size={12} className="mx-auto" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => appendAtPath(path, resolveArrayItemTemplate(path, items))}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
      >
        <Plus size={12} /> Add Item
      </button>
    </div>
  );

  const renderArrayOfObjects = (path, label, items) => {
    const keys = Array.from(
      new Set(
        items.flatMap((item) => {
          if (!isPlainObject(item)) return [];
          return Object.keys(item);
        }),
      ),
    );
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
        {items.map((item, idx) => (
          <div key={`${path.join('.')}-${idx}`} className="rounded border border-slate-700 bg-slate-900 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label} #{idx + 1}</p>
              <button
                type="button"
                onClick={() => removeAtPath(path, idx)}
                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs"
                title="Remove row"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {keys.map((fieldKey) => {
              const fieldValue = isPlainObject(item) ? item[fieldKey] : undefined;
              const fieldPath = [...path, idx, fieldKey];
              if (fieldValue == null || ['string', 'number', 'boolean'].includes(typeof fieldValue)) {
                return (
                  <div key={`${path.join('.')}-${idx}-${fieldKey}`}>
                    {renderPrimitiveEditor(fieldPath, formatLabel(fieldKey), fieldValue == null ? '' : fieldValue)}
                  </div>
                );
              }
              return (
                <div key={`${path.join('.')}-${idx}-${fieldKey}`}>
                  {renderJsonFallback(fieldPath, formatLabel(fieldKey), fieldValue)}
                </div>
              );
            })}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const template = resolveArrayItemTemplate(path, items);
            appendAtPath(path, isPlainObject(template) ? template : items[0] || {});
          }}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>
    );
  };

  const renderArrayEditor = (path, label, value) => {
    if (!Array.isArray(value)) return null;
    if (!value.length) {
      const template = resolveArrayItemTemplate(path, value);
      const addLabel = isPlainObject(template) ? 'Add Row' : 'Add Item';
      return (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
          <p className="text-xs text-slate-500">No items yet.</p>
          <button
            type="button"
            onClick={() => appendAtPath(path, template)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-bold inline-flex items-center gap-1"
          >
            <Plus size={12} /> {addLabel}
          </button>
        </div>
      );
    }
    const primitivesOnly = value.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item));
    if (primitivesOnly) {
      return renderArrayOfPrimitives(path, label, value);
    }
    const objectsOnly = value.every((item) => isPlainObject(item));
    if (objectsOnly) {
      return renderArrayOfObjects(path, label, value);
    }
    return renderJsonFallback(path, label, value);
  };

  const renderObjectEditor = (path, label, value) => {
    if (!isPlainObject(value)) return null;
    const entries = Object.entries(value);
    if (!entries.length) return renderJsonFallback(path, label, value);
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300 mb-1">{label}</label>
        <div className="rounded border border-slate-700 bg-slate-900 p-2 space-y-2">
          {entries.map(([childKey, childValue]) => {
            const childPath = [...path, childKey];
            if (childValue == null || ['string', 'number', 'boolean'].includes(typeof childValue)) {
              return (
                <div key={`${path.join('.')}-${childKey}`}>
                  {renderPrimitiveEditor(childPath, formatLabel(childKey), childValue == null ? '' : childValue)}
                </div>
              );
            }
            if (Array.isArray(childValue)) {
              return (
                <div key={`${path.join('.')}-${childKey}`}>
                  {renderArrayEditor(childPath, formatLabel(childKey), childValue)}
                </div>
              );
            }
            return (
              <div key={`${path.join('.')}-${childKey}`}>
                {renderJsonFallback(childPath, formatLabel(childKey), childValue)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!topLevelEntries.length) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">No settings yet for this block.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topLevelEntries.map(([key, value]) => {
        const path = [key];
        const label = formatLabel(key);
        if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) {
          return <div key={`field-${key}`}>{renderPrimitiveEditor(path, label, value == null ? '' : value)}</div>;
        }
        if (Array.isArray(value)) {
          return <div key={`field-${key}`}>{renderArrayEditor(path, label, value)}</div>;
        }
        if (isPlainObject(value)) {
          return <div key={`field-${key}`}>{renderObjectEditor(path, label, value)}</div>;
        }
        return <div key={`field-${key}`}>{renderJsonFallback(path, label, value)}</div>;
      })}
    </div>
  );
}
