export const FINLIT_HERO_MEDIA_TYPES = ['auto', 'image', 'video', 'embed'];
export const FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL = 'Activities';
export const FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL = 'Additional Learning';
export const FINLIT_CORE_TAB_IDS = ['activities'];

function normalizeIdToken(value, fallback = 'tab') {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || fallback;
}

function toStringValue(value) {
  return value == null ? '' : String(value);
}

export function normalizeFinlitHeroMediaType(value) {
  const raw = String(value || '').trim().toLowerCase();
  return FINLIT_HERO_MEDIA_TYPES.includes(raw) ? raw : 'auto';
}

export function createFinlitHeroFormState(heroLike) {
  const source = heroLike && typeof heroLike === 'object' ? heroLike : {};
  const mediaUrl = source.mediaUrl ?? source.image ?? '';
  return {
    title: toStringValue(source.title),
    subtitle: toStringValue(source.subtitle),
    progressLabel: toStringValue(source.progressLabel),
    mediaUrl: toStringValue(mediaUrl),
    mediaType: normalizeFinlitHeroMediaType(source.mediaType),
  };
}

export function normalizeFinlitHeroForSave(heroLike) {
  const form = createFinlitHeroFormState(heroLike);
  const title = form.title.trim();
  const subtitle = form.subtitle.trim();
  const progressLabel = form.progressLabel.trim();
  const mediaUrl = form.mediaUrl.trim();
  const mediaType = normalizeFinlitHeroMediaType(form.mediaType);

  const next = {};
  if (title) next.title = title;
  if (subtitle) next.subtitle = subtitle;
  if (progressLabel) next.progressLabel = progressLabel;
  if (mediaUrl) next.mediaUrl = mediaUrl;
  if (mediaType !== 'auto') next.mediaType = mediaType;

  return Object.keys(next).length ? next : null;
}

const FINLIT_HERO_VIDEO_PATTERN = /\.(mp4|webm|ogg|ogv|m4v|mov|m3u8)([?#].*)?$/i;
const FINLIT_HERO_EMBED_HOST_PATTERN = /(youtube\.com|youtu\.be|vimeo\.com|loom\.com|wistia\.)/i;
const FINLIT_HERO_EMBED_PATH_PATTERN = /\/embed\/|\/player\//i;

export function resolveFinlitHeroMediaKind(heroLike) {
  const form = createFinlitHeroFormState(heroLike);
  const mediaUrl = form.mediaUrl.trim();
  if (!mediaUrl) return 'none';

  const explicitType = normalizeFinlitHeroMediaType(form.mediaType);
  if (explicitType === 'image' || explicitType === 'video' || explicitType === 'embed') {
    return explicitType;
  }

  const lower = mediaUrl.toLowerCase();
  if (lower.startsWith('data:video/') || FINLIT_HERO_VIDEO_PATTERN.test(lower)) {
    return 'video';
  }

  if (FINLIT_HERO_EMBED_PATH_PATTERN.test(lower) || FINLIT_HERO_EMBED_HOST_PATTERN.test(lower)) {
    return 'embed';
  }

  return 'image';
}

function normalizeFinlitLink(linkLike) {
  const source = linkLike && typeof linkLike === 'object' ? linkLike : {};
  return {
    title: toStringValue(source.title || source.label),
    url: toStringValue(source.url || source.href),
    description: toStringValue(source.description || source.subtitle),
  };
}

function cloneFinlitTabActivities(activitiesLike) {
  if (!Array.isArray(activitiesLike)) return [];
  return activitiesLike
    .filter((activity) => activity && typeof activity === 'object')
    .map((activity) => {
      try {
        return JSON.parse(JSON.stringify(activity));
      } catch {
        return { ...activity };
      }
    });
}

function normalizeFinlitTab(tabLike, index = 0) {
  const source = tabLike && typeof tabLike === 'object' ? tabLike : {};
  const rawId = toStringValue(source.id || source.key || source.slug || `tab-${index + 1}`);
  const id = normalizeIdToken(rawId, `tab-${index + 1}`);
  const label = toStringValue(source.label || source.title || rawId || `Tab ${index + 1}`);
  const activityIds = (Array.isArray(source.activityIds) ? source.activityIds : [])
    .map((item) => toStringValue(item).trim())
    .filter(Boolean);
  const linksSource =
    Array.isArray(source.links) ? source.links : Array.isArray(source.additionalLinks) ? source.additionalLinks : [];
  const links = linksSource.map((item) => normalizeFinlitLink(item));
  return {
    id,
    label,
    activityIds,
    ...(Object.prototype.hasOwnProperty.call(source, 'activities')
      ? { activities: cloneFinlitTabActivities(source.activities) }
      : {}),
    links,
  };
}

function dedupeFinlitTabs(tabs) {
  const seen = new Set();
  return tabs.map((tab, index) => {
    const normalized = normalizeFinlitTab(tab, index);
    let id = normalized.id;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${normalized.id}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    return {
      ...normalized,
      id,
    };
  });
}

function getLegacyFinlitTabs(source) {
  const activitiesTabLabel = toStringValue(
    source.activitiesTabLabel || source.activitiesLabel || FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL,
  );
  const additionalTabLabel = toStringValue(
    source.additionalTabLabel || source.additionalLabel || FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL,
  );
  const additionalLinks = Array.isArray(source.additionalLinks)
    ? source.additionalLinks.map((item) => normalizeFinlitLink(item))
    : [];
  return [
    {
      id: 'activities',
      label: activitiesTabLabel,
      activityIds: [],
      links: [],
    },
    {
      id: 'additional',
      label: additionalTabLabel,
      activityIds: [],
      links: additionalLinks,
    },
  ];
}

function ensureCoreFinlitTabs(rawTabs, source) {
  const deduped = dedupeFinlitTabs(rawTabs);
  const byId = new Map(deduped.map((tab) => [tab.id, tab]));
  const legacyTabs = getLegacyFinlitTabs(source);
  const legacyById = new Map(legacyTabs.map((tab) => [tab.id, tab]));
  FINLIT_CORE_TAB_IDS.forEach((coreId) => {
    if (byId.has(coreId)) return;
    byId.set(coreId, normalizeFinlitTab(legacyById.get(coreId)));
  });

  const ordered = deduped.map((tab) => byId.get(tab.id)).filter(Boolean);
  FINLIT_CORE_TAB_IDS.forEach((coreId) => {
    if (ordered.some((tab) => tab.id === coreId)) return;
    ordered.push(byId.get(coreId));
  });

  return ordered.map((tab) => {
    const legacy = legacyById.get(tab.id);
    return {
      ...tab,
      label: toStringValue(tab.label || legacy?.label || (tab.id === 'additional' ? FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL : FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL)),
      activityIds: Array.from(
        new Set((Array.isArray(tab.activityIds) ? tab.activityIds : []).map((item) => toStringValue(item).trim()).filter(Boolean)),
      ),
      ...(Object.prototype.hasOwnProperty.call(tab, 'activities')
        ? { activities: cloneFinlitTabActivities(tab.activities) }
        : {}),
      links: (Array.isArray(tab.links) ? tab.links : []).map((item) => normalizeFinlitLink(item)),
    };
  });
}

export function normalizeFinlitTabsForForm(finlitLike) {
  const source = finlitLike && typeof finlitLike === 'object' ? finlitLike : {};
  const rawTabs = Array.isArray(source.tabs) && source.tabs.length > 0 ? source.tabs : getLegacyFinlitTabs(source);
  return ensureCoreFinlitTabs(rawTabs, source);
}

export function createFinlitTemplateFormState(finlitLike) {
  const source = finlitLike && typeof finlitLike === 'object' ? finlitLike : {};
  const tabs = normalizeFinlitTabsForForm(source);
  const activitiesTab = tabs.find((tab) => tab.id === 'activities');
  const additionalTab = tabs.find((tab) => tab.id === 'additional');
  const additionalLinks = Array.isArray(additionalTab?.links) ? additionalTab.links.map((item) => normalizeFinlitLink(item)) : [];
  return {
    activitiesTabLabel: toStringValue(activitiesTab?.label || FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL),
    additionalTabLabel: toStringValue(additionalTab?.label || FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL),
    additionalLinks,
    tabs,
  };
}

export function normalizeFinlitTemplateForSave(finlitLike) {
  const form = createFinlitTemplateFormState(finlitLike);
  const tabs = ensureCoreFinlitTabs(Array.isArray(form.tabs) ? form.tabs : [], form)
    .map((tab, index) => {
      const label = toStringValue(tab?.label || tab?.id || `Tab ${index + 1}`).trim() || `Tab ${index + 1}`;
      const id = normalizeIdToken(tab?.id || `tab-${index + 1}`, `tab-${index + 1}`);
      const activityIds = Array.from(
        new Set((Array.isArray(tab?.activityIds) ? tab.activityIds : []).map((item) => toStringValue(item).trim()).filter(Boolean)),
      );
      const links = (Array.isArray(tab?.links) ? tab.links : [])
        .map((item) => normalizeFinlitLink(item))
        .map((item) => ({
          title: item.title.trim(),
          url: item.url.trim(),
          description: item.description.trim(),
        }))
        .filter((item) => item.title || item.url || item.description)
        .map((item) => ({
          title: item.title || item.url || 'Resource',
          url: item.url,
          description: item.description,
        }));
      return {
        id,
        label,
        activityIds,
        ...(Object.prototype.hasOwnProperty.call(tab || {}, 'activities')
          ? { activities: cloneFinlitTabActivities(tab?.activities) }
          : {}),
        links,
      };
    })
    .filter(
      (tab) =>
        tab.label ||
        tab.activityIds.length > 0 ||
        tab.links.length > 0 ||
        (Array.isArray(tab.activities) && tab.activities.length > 0),
    );

  const activitiesTab = tabs.find((tab) => tab.id === 'activities') || {
    id: 'activities',
    label: FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL,
    activityIds: [],
    links: [],
  };
  const additionalTab = tabs.find((tab) => tab.id === 'additional') || {
    id: 'additional',
    label: FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL,
    activityIds: [],
    links: [],
  };
  const activitiesTabLabel = toStringValue(activitiesTab.label).trim() || FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL;
  const additionalTabLabel = toStringValue(additionalTab.label).trim() || FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL;
  const additionalLinks = (Array.isArray(additionalTab.links) ? additionalTab.links : [])
    .map((item) => normalizeFinlitLink(item))
    .map((item) => ({
      title: item.title.trim(),
      url: item.url.trim(),
      description: item.description.trim(),
    }))
    .filter((item) => item.title || item.url || item.description)
    .map((item) => ({
      title: item.title || item.url || 'Resource',
      url: item.url,
      description: item.description,
    }));

  const next = {};
  const defaultTabs = createFinlitTemplateFormState(null).tabs;
  const hasTabOverrides = JSON.stringify(tabs) !== JSON.stringify(defaultTabs);
  if (hasTabOverrides) next.tabs = tabs;
  if (activitiesTabLabel !== FINLIT_DEFAULT_ACTIVITIES_TAB_LABEL) next.activitiesTabLabel = activitiesTabLabel;
  if (additionalTabLabel !== FINLIT_DEFAULT_ADDITIONAL_TAB_LABEL) next.additionalTabLabel = additionalTabLabel;
  if (additionalLinks.length > 0) next.additionalLinks = additionalLinks;

  if (next.tabs) {
    // Keep legacy readers compatible with the richer tabs model.
    next.activitiesTabLabel = activitiesTabLabel;
    next.additionalTabLabel = additionalTabLabel;
    next.additionalLinks = additionalLinks;
  }

  return Object.keys(next).length ? next : null;
}
