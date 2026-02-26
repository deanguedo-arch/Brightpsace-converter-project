export function isComposerEnabled(projectData) {
  return !!projectData?.['Course Settings']?.compilationDefaults?.enableComposer;
}

export function getModuleMode(module) {
  if (module?.mode === 'composer') return 'composer';
  return 'custom_html';
}

export function getModuleActivities(module) {
  return Array.isArray(module?.activities) ? module.activities : [];
}
