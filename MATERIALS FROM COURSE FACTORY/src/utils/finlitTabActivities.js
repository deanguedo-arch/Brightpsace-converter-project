import { normalizeComposerActivities, normalizeComposerLayout } from '../composer/layout.js';
import { createFinlitTemplateFormState } from './finlitHero.js';

function cloneDeep(value) {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    if (Array.isArray(value)) return value.map((item) => cloneDeep(item));
    if (typeof value === 'object') return { ...value };
    return value;
  }
}

function sanitizeToken(value, fallback = 'tab') {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || fallback;
}

function toActivityId(value, fallback) {
  const raw = String(value || '').trim();
  return raw || fallback;
}

function ensureUniqueActivityId(rawId, usedIds) {
  let id = String(rawId || '').trim();
  if (!id) id = 'activity';
  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }
  let suffix = 2;
  while (usedIds.has(`${id}-${suffix}`)) {
    suffix += 1;
  }
  const nextId = `${id}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function normalizeTabActivityList(rawActivities, composerLayout, usedIds, tabId = 'tab') {
  const normalized = normalizeComposerActivities(Array.isArray(rawActivities) ? rawActivities : [], {
    maxColumns: composerLayout.maxColumns,
    mode: composerLayout.mode,
  });
  const tabToken = sanitizeToken(tabId, 'tab');
  return normalized.map((activity, index) => {
    const fallbackId = `activity-${tabToken}-${index + 1}`;
    const uniqueId = ensureUniqueActivityId(toActivityId(activity?.id, fallbackId), usedIds);
    return {
      ...cloneDeep(activity),
      id: uniqueId,
    };
  });
}

function buildActivityMap(activities) {
  const map = new Map();
  (Array.isArray(activities) ? activities : []).forEach((activity) => {
    const id = String(activity?.id || '').trim();
    if (!id || map.has(id)) return;
    map.set(id, cloneDeep(activity));
  });
  return map;
}

function sanitizeActivityIds(ids) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean);
}

export function resolveFinlitTabComposerState({
  finlit,
  moduleActivities = [],
  composerLayout,
  activeTabId = 'activities',
  activeTabActivities = null,
} = {}) {
  const normalizedLayout = normalizeComposerLayout(composerLayout);
  const baseFinlit = createFinlitTemplateFormState(finlit);
  const globalActivities = normalizeComposerActivities(moduleActivities, {
    maxColumns: normalizedLayout.maxColumns,
    mode: normalizedLayout.mode,
  });
  const globalActivityMap = buildActivityMap(globalActivities);
  const referencedLegacyIds = new Set(
    (Array.isArray(baseFinlit?.tabs) ? baseFinlit.tabs : [])
      .flatMap((tab) => sanitizeActivityIds(tab?.activityIds))
      .filter(Boolean),
  );
  const usedIds = new Set();

  const nextTabs = (Array.isArray(baseFinlit?.tabs) ? baseFinlit.tabs : []).map((tab) => {
    const tabKey = String(tab?.id || '').trim() || 'tab';
    const legacyIds = sanitizeActivityIds(tab?.activityIds);
    const hasLocalActivities = Object.prototype.hasOwnProperty.call(tab || {}, 'activities');
    let sourceActivities = [];

    if (String(activeTabId || '').trim() === tabKey && Array.isArray(activeTabActivities)) {
      sourceActivities = cloneDeep(activeTabActivities);
    } else if (hasLocalActivities) {
      sourceActivities = Array.isArray(tab?.activities) ? cloneDeep(tab.activities) : [];
    } else if (legacyIds.length > 0) {
      sourceActivities = legacyIds.map((id) => cloneDeep(globalActivityMap.get(id))).filter(Boolean);
    }

    if (!hasLocalActivities && tabKey === 'activities') {
      const existingIds = new Set(
        (Array.isArray(sourceActivities) ? sourceActivities : [])
          .map((item) => String(item?.id || '').trim())
          .filter(Boolean),
      );
      const unlinked = globalActivities
        .filter((activity) => {
          const id = String(activity?.id || '').trim();
          if (!id) return false;
          if (existingIds.has(id)) return false;
          return !referencedLegacyIds.has(id);
        })
        .map((activity) => cloneDeep(activity));
      sourceActivities = [...sourceActivities, ...unlinked];
    }

    const normalizedActivities = normalizeTabActivityList(sourceActivities, normalizedLayout, usedIds, tabKey);
    return {
      ...cloneDeep(tab),
      id: tabKey,
      activityIds: legacyIds,
      activities: normalizedActivities,
    };
  });

  const resolvedActiveTabId = nextTabs.some((tab) => tab.id === activeTabId) ? activeTabId : 'activities';
  const activitiesTab = nextTabs.find((tab) => tab.id === 'activities') || { activities: [] };
  const activeTab = nextTabs.find((tab) => tab.id === resolvedActiveTabId) || activitiesTab;
  const canonicalActivities = normalizeComposerActivities(Array.isArray(activitiesTab.activities) ? activitiesTab.activities : [], {
    maxColumns: normalizedLayout.maxColumns,
    mode: normalizedLayout.mode,
  });
  const activeActivities = normalizeComposerActivities(Array.isArray(activeTab.activities) ? activeTab.activities : [], {
    maxColumns: normalizedLayout.maxColumns,
    mode: normalizedLayout.mode,
  });

  return {
    finlit: {
      ...baseFinlit,
      tabs: nextTabs,
    },
    canonicalActivities,
    activeTabId: resolvedActiveTabId,
    activeTabActivities: activeActivities,
  };
}

export function listFinlitTabActivities(finlitLike, tabId = 'activities') {
  const targetTabId = String(tabId || '').trim();
  const formState = createFinlitTemplateFormState(finlitLike);
  const tab = (Array.isArray(formState?.tabs) ? formState.tabs : []).find((entry) => String(entry?.id || '').trim() === targetTabId);
  return Array.isArray(tab?.activities) ? cloneDeep(tab.activities) : [];
}
