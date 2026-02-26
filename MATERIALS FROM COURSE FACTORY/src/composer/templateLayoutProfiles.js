import { normalizeComposerActivities, normalizeComposerLayout } from './layout.js';

export const TEMPLATE_LAYOUT_KEYS = ['deck', 'finlit', 'coursebook', 'toolkit_dashboard'];

function normalizeTemplateToken(value) {
  return String(value || '').trim().toLowerCase();
}

function isTemplateLayoutKey(value) {
  return TEMPLATE_LAYOUT_KEYS.includes(normalizeTemplateToken(value));
}

function parseFiniteInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeActivityLayoutFields(layout) {
  const source = layout && typeof layout === 'object' ? layout : {};
  const next = {};
  const colSpan = parseFiniteInteger(source.colSpan);
  const row = parseFiniteInteger(source.row);
  const col = parseFiniteInteger(source.col);
  const x = parseFiniteInteger(source.x);
  const y = parseFiniteInteger(source.y);
  const w = parseFiniteInteger(source.w);
  const h = parseFiniteInteger(source.h);
  if (colSpan != null) next.colSpan = colSpan;
  if (row != null) next.row = row;
  if (col != null) next.col = col;
  if (x != null) next.x = x;
  if (y != null) next.y = y;
  if (w != null) next.w = w;
  if (h != null) next.h = h;
  return next;
}

function cloneProfile(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};
  return {
    composerLayout: normalizeComposerLayout(source.composerLayout),
    activityLayouts: Object.entries(source.activityLayouts && typeof source.activityLayouts === 'object' ? source.activityLayouts : {}).reduce(
      (acc, [activityId, activityLayout]) => {
        const key = String(activityId || '').trim();
        if (!key) return acc;
        acc[key] = normalizeActivityLayoutFields(activityLayout);
        return acc;
      },
      {},
    ),
  };
}

export function resolveTemplateKey(overrideValue, courseDefaultValue = 'deck') {
  const override = normalizeTemplateToken(overrideValue);
  if (isTemplateLayoutKey(override)) return override;
  const fallback = normalizeTemplateToken(courseDefaultValue);
  if (isTemplateLayoutKey(fallback)) return fallback;
  return 'deck';
}

export function captureTemplateLayoutProfile(composerLayout, activities) {
  const normalizedLayout = normalizeComposerLayout(composerLayout);
  const normalizedActivities = normalizeComposerActivities(activities, {
    maxColumns: normalizedLayout.maxColumns,
    mode: normalizedLayout.mode,
  });
  const activityLayouts = normalizedActivities.reduce((acc, activity) => {
    const key = String(activity?.id || '').trim();
    if (!key) return acc;
    acc[key] = normalizeActivityLayoutFields(activity?.layout);
    return acc;
  }, {});
  return {
    composerLayout: normalizedLayout,
    activityLayouts,
  };
}

export function normalizeTemplateLayoutProfiles(templateLayoutProfiles, { activities = [] } = {}) {
  const source = templateLayoutProfiles && typeof templateLayoutProfiles === 'object' ? templateLayoutProfiles : {};
  const allowedActivityIds = new Set(
    (Array.isArray(activities) ? activities : [])
      .map((activity) => String(activity?.id || '').trim())
      .filter(Boolean),
  );

  return Object.entries(source).reduce((acc, [templateKeyRaw, profileRaw]) => {
    const templateKey = normalizeTemplateToken(templateKeyRaw);
    if (!isTemplateLayoutKey(templateKey)) return acc;
    const profile = cloneProfile(profileRaw);
    const activityLayouts = Object.entries(profile.activityLayouts || {}).reduce((layoutAcc, [activityId, activityLayout]) => {
      if (allowedActivityIds.size > 0 && !allowedActivityIds.has(activityId)) return layoutAcc;
      layoutAcc[activityId] = normalizeActivityLayoutFields(activityLayout);
      return layoutAcc;
    }, {});
    acc[templateKey] = {
      composerLayout: normalizeComposerLayout(profile.composerLayout),
      activityLayouts,
    };
    return acc;
  }, {});
}

export function cloneTemplateLayoutProfile(profile) {
  return cloneProfile(profile);
}

export function applyTemplateLayoutProfile(activities, profile, composerLayoutMode, maxColumns) {
  const fallbackLayout = normalizeComposerLayout({
    mode: composerLayoutMode,
    maxColumns,
  });
  const normalizedProfile = cloneProfile(profile);
  const targetLayout =
    normalizedProfile && normalizedProfile.composerLayout && typeof normalizedProfile.composerLayout === 'object'
      ? normalizeComposerLayout(normalizedProfile.composerLayout)
      : fallbackLayout;
  const targetActivityLayouts =
    normalizedProfile && normalizedProfile.activityLayouts && typeof normalizedProfile.activityLayouts === 'object'
      ? normalizedProfile.activityLayouts
      : {};
  const normalizedActivities = normalizeComposerActivities(activities, {
    maxColumns: targetLayout.maxColumns,
    mode: targetLayout.mode,
  });
  const mergedActivities = normalizedActivities.map((activity) => {
    const activityId = String(activity?.id || '').trim();
    const overrides = activityId ? targetActivityLayouts[activityId] : null;
    if (!overrides || typeof overrides !== 'object') return activity;
    return {
      ...activity,
      layout: {
        ...(activity.layout || {}),
        ...normalizeActivityLayoutFields(overrides),
      },
    };
  });
  const hasProfileLayout = (activity) => {
    const activityId = String(activity?.id || '').trim();
    return Boolean(activityId && targetActivityLayouts[activityId]);
  };
  const normalizedMerged = normalizeComposerActivities(mergedActivities, {
    maxColumns: targetLayout.maxColumns,
    mode: targetLayout.mode,
  });
  const missingIndexes = normalizedMerged
    .map((activity, idx) => (hasProfileLayout(activity) ? null : idx))
    .filter((idx) => Number.isInteger(idx));
  if (!missingIndexes.length) {
    return {
      composerLayout: targetLayout,
      activities: normalizedMerged,
    };
  }

  const missingIndexSet = new Set(missingIndexes);
  const anchoredIndexes = new Set(normalizedMerged.map((_, idx) => idx).filter((idx) => !missingIndexSet.has(idx)));
  const hasAnchoredLayouts = anchoredIndexes.size > 0;

  if (targetLayout.mode === 'canvas') {
    let nextY = hasAnchoredLayouts
      ? Array.from(anchoredIndexes).reduce((largest, idx) => {
          const layout = normalizedMerged[idx]?.layout || {};
          const top = Number.parseInt(layout.y, 10);
          const height = Number.parseInt(layout.h, 10);
          const safeTop = Number.isFinite(top) ? Math.max(0, top) : 0;
          const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 4;
          return Math.max(largest, safeTop + safeHeight);
        }, 0) || 0
      : 0;
    const adjusted = normalizedMerged.map((activity, idx) => {
      if (!missingIndexSet.has(idx)) return activity;
      const layout = activity?.layout || {};
      const width = Number.parseInt(layout.w, 10);
      const height = Number.parseInt(layout.h, 10);
      const safeWidth = Number.isFinite(width) ? Math.max(1, width) : Math.max(1, Number.parseInt(layout.colSpan, 10) || 1);
      const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 4;
      const next = {
        ...activity,
        layout: {
          ...(layout || {}),
          x: 0,
          y: nextY,
          w: safeWidth,
          h: safeHeight,
          col: 1,
          row: nextY + 1,
          colSpan: safeWidth,
        },
      };
      nextY += safeHeight;
      return next;
    });
    return {
      composerLayout: targetLayout,
      activities: normalizeComposerActivities(adjusted, {
        maxColumns: targetLayout.maxColumns,
        mode: targetLayout.mode,
      }),
    };
  }

  let nextRow = hasAnchoredLayouts
    ? Array.from(anchoredIndexes).reduce((largest, idx) => {
        const row = Number.parseInt(normalizedMerged[idx]?.layout?.row, 10);
        const safeRow = Number.isFinite(row) ? Math.max(1, row) : 1;
        return Math.max(largest, safeRow);
      }, 1) + 1
    : 1;
  const adjusted = normalizedMerged.map((activity, idx) => {
    if (!missingIndexSet.has(idx)) return activity;
    const layout = activity?.layout || {};
    const next = {
      ...activity,
      layout: {
        ...(layout || {}),
        row: nextRow,
        col: 1,
        x: 0,
        y: nextRow - 1,
      },
    };
    nextRow += 1;
    return next;
  });
  return {
    composerLayout: targetLayout,
    activities: normalizeComposerActivities(adjusted, {
      maxColumns: targetLayout.maxColumns,
      mode: targetLayout.mode,
    }),
  };
}
