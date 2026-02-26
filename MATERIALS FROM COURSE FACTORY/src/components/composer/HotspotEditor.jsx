import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

function clampPercent(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function formatPercent(value) {
  return clampPercent(value).toFixed(1);
}

function buildDefaultHotspot(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const label = index < alphabet.length ? `Point ${alphabet[index]}` : `Point ${index + 1}`;
  return {
    label,
    x: 50,
    y: 50,
    content: 'Explain this area.',
  };
}

function normalizeHotspots(rawHotspots) {
  if (!Array.isArray(rawHotspots)) return [];
  return rawHotspots.map((spot, idx) => ({
    label: typeof spot?.label === 'string' ? spot.label : `Hotspot ${idx + 1}`,
    x: clampPercent(spot?.x),
    y: clampPercent(spot?.y),
    content: typeof spot?.content === 'string' ? spot.content : '',
  }));
}

function toRoundedPercent(value) {
  return Number(clampPercent(value).toFixed(2));
}

export default function HotspotEditor({ data, onChange }) {
  const normalizedHotspots = React.useMemo(() => normalizeHotspots(data?.hotspots), [data?.hotspots]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [draggingIndex, setDraggingIndex] = React.useState(null);
  const previewRef = React.useRef(null);
  const hotspotsRef = React.useRef(normalizedHotspots);
  const dragIndexRef = React.useRef(null);

  React.useEffect(() => {
    hotspotsRef.current = normalizedHotspots;
  }, [normalizedHotspots]);

  React.useEffect(() => {
    if (normalizedHotspots.length === 0) {
      if (selectedIndex !== 0) setSelectedIndex(0);
      return;
    }
    if (selectedIndex > normalizedHotspots.length - 1) {
      setSelectedIndex(normalizedHotspots.length - 1);
    }
  }, [normalizedHotspots.length, selectedIndex]);

  const updateHotspots = React.useCallback(
    (nextHotspots) => {
      onChange({ hotspots: nextHotspots });
    },
    [onChange],
  );

  const setHotspotField = React.useCallback(
    (index, key, value) => {
      const nextHotspots = hotspotsRef.current.map((spot, spotIndex) =>
        spotIndex === index
          ? {
              ...spot,
              [key]:
                key === 'x' || key === 'y'
                  ? toRoundedPercent(value)
                  : value,
            }
          : spot,
      );
      hotspotsRef.current = nextHotspots;
      updateHotspots(nextHotspots);
    },
    [updateHotspots],
  );

  const setHotspotPosition = React.useCallback(
    (index, nextX, nextY) => {
      const nextHotspots = hotspotsRef.current.map((spot, spotIndex) =>
        spotIndex === index
          ? {
              ...spot,
              x: toRoundedPercent(nextX),
              y: toRoundedPercent(nextY),
            }
          : spot,
      );
      hotspotsRef.current = nextHotspots;
      updateHotspots(nextHotspots);
    },
    [updateHotspots],
  );

  const removeHotspot = React.useCallback(
    (index) => {
      const nextHotspots = hotspotsRef.current.filter((_, spotIndex) => spotIndex !== index);
      hotspotsRef.current = nextHotspots;
      updateHotspots(nextHotspots);
      setSelectedIndex((current) => {
        if (nextHotspots.length === 0) return 0;
        if (current > nextHotspots.length - 1) return nextHotspots.length - 1;
        return current;
      });
      if (dragIndexRef.current === index) {
        dragIndexRef.current = null;
        setDraggingIndex(null);
      }
    },
    [updateHotspots],
  );

  const addHotspot = React.useCallback(() => {
    const nextHotspots = [...hotspotsRef.current, buildDefaultHotspot(hotspotsRef.current.length)];
    hotspotsRef.current = nextHotspots;
    updateHotspots(nextHotspots);
    setSelectedIndex(nextHotspots.length - 1);
  }, [updateHotspots]);

  const getPointerPercent = React.useCallback((event) => {
    const preview = previewRef.current;
    if (!preview) return null;
    const rect = preview.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x: toRoundedPercent(x), y: toRoundedPercent(y) };
  }, []);

  const applyDraggedPosition = React.useCallback(
    (event) => {
      const index = dragIndexRef.current;
      if (!Number.isInteger(index)) return;
      const point = getPointerPercent(event);
      if (!point) return;
      setHotspotPosition(index, point.x, point.y);
    },
    [getPointerPercent, setHotspotPosition],
  );

  React.useEffect(() => {
    if (draggingIndex == null) return undefined;
    const handlePointerMove = (event) => {
      applyDraggedPosition(event);
    };
    const handlePointerUp = () => {
      dragIndexRef.current = null;
      setDraggingIndex(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [applyDraggedPosition, draggingIndex]);

  const startDragging = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    dragIndexRef.current = index;
    setDraggingIndex(index);
    setSelectedIndex(index);
    applyDraggedPosition(event);
  };

  const hasImage = Boolean(String(data?.url || '').trim());
  const hotspots = normalizedHotspots;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Block Title</label>
        <input
          type="text"
          value={data?.title || ''}
          onChange={(event) => onChange({ title: event.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
        <input
          type="text"
          value={data?.url || ''}
          onChange={(event) => onChange({ url: event.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
          placeholder="https://... or /materials/image.jpg"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Alt Text</label>
        <input
          type="text"
          value={data?.alt || ''}
          onChange={(event) => onChange({ alt: event.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
        />
      </div>

      <div className="rounded border border-slate-700 bg-slate-900 p-2">
        <div
          ref={previewRef}
          className="relative rounded border border-slate-700 bg-black overflow-hidden min-h-[220px] select-none"
        >
          {hasImage ? (
            <img
              src={data.url}
              alt={data?.alt || 'Hotspot preview'}
              className="block w-full h-auto"
              loading="lazy"
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-slate-400">
              Paste an image URL to preview and drag hotspot markers.
            </div>
          )}
          {hasImage
            ? hotspots.map((spot, idx) => {
                const isSelected = idx === selectedIndex;
                const isDragging = idx === draggingIndex;
                return (
                  <button
                    key={`hotspot-preview-marker-${idx}`}
                    type="button"
                    data-hotspot-editor-marker
                    onPointerDown={(event) => startDragging(event, idx)}
                    onClick={() => setSelectedIndex(idx)}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border text-[11px] font-black touch-none ${
                      isSelected || isDragging
                        ? 'border-sky-300 bg-sky-500 text-slate-950 cursor-grabbing'
                        : 'border-slate-200/80 bg-slate-900/90 text-white hover:bg-sky-500 hover:text-slate-950 cursor-grab'
                    }`}
                    title={spot.label || `Hotspot ${idx + 1}`}
                    aria-label={spot.label || `Hotspot ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })
            : null}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Drag hotspot dots directly on the image to position them.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-300">Hotspots</label>
          <button
            type="button"
            onClick={addHotspot}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white inline-flex items-center gap-1"
          >
            <Plus size={12} /> Add Hotspot
          </button>
        </div>
        {hotspots.length === 0 ? <p className="text-xs text-slate-500">No hotspots yet.</p> : null}
        {hotspots.map((spot, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={`hotspot-editor-item-${idx}`}
              className={`rounded border p-2 ${
                isSelected ? 'border-sky-500 bg-slate-900' : 'border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`col-span-1 w-7 h-7 rounded-full border text-[11px] font-black justify-self-start ${
                    isSelected
                      ? 'border-sky-300 bg-sky-500 text-slate-950'
                      : 'border-slate-200/80 bg-slate-900/85 text-white'
                  }`}
                  title="Select hotspot"
                >
                  {idx + 1}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className="col-span-7 text-left text-xs font-bold text-white truncate"
                  title={spot.label || `Hotspot ${idx + 1}`}
                >
                  {spot.label || `Hotspot ${idx + 1}`}
                </button>
                <p className="col-span-3 text-[10px] text-slate-400 font-mono text-right">
                  {formatPercent(spot.x)}%, {formatPercent(spot.y)}%
                </p>
                <button
                  type="button"
                  onClick={() => removeHotspot(idx)}
                  className="col-span-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs h-7"
                  title="Remove hotspot"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
              </div>
              {isSelected ? (
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Label</label>
                    <input
                      type="text"
                      value={spot.label || ''}
                      onChange={(event) => setHotspotField(idx, 'label', event.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Content</label>
                    <textarea
                      value={spot.content || ''}
                      onChange={(event) => setHotspotField(idx, 'content', event.target.value)}
                      className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
