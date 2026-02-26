export function checkModuleDependencies(moduleId, projectData) {
  const dependencies = {
    modules: [],
    assessments: [],
    toolkit: [],
    materials: [],
  };

  const moduleTitle =
    projectData['Current Course']?.modules?.find((m) => m.id === moduleId)?.title ||
    moduleId;
  const shortId = moduleId.replace('view-', '').replace('item-', '');

  // Check all modules for references
  const allModules = projectData['Current Course']?.modules || [];
  allModules.forEach((mod) => {
    if (mod.id === moduleId) return; // Skip self

    // Check HTML content (including rawHtml for new format)
    const moduleContent = mod.rawHtml || mod.html || mod.code?.html || '';
    if (moduleContent.includes(moduleId) || moduleContent.includes(shortId)) {
      dependencies.modules.push({
        id: mod.id,
        title: mod.title,
        type: 'HTML reference',
      });
    }

    // Check script content
    const moduleScript = mod.script || mod.code?.script || '';
    if (moduleScript.includes(moduleId) || moduleScript.includes(shortId)) {
      const existing = dependencies.modules.find((d) => d.id === mod.id);
      if (existing) {
        existing.type = 'HTML & Script reference';
      } else {
        dependencies.modules.push({
          id: mod.id,
          title: mod.title,
          type: 'Script reference',
        });
      }
    }
  });

  // Check assessments
  allModules.forEach((mod) => {
    const assessments = mod.assessments || [];
    assessments.forEach((assess) => {
      const assessHTML = assess.html || '';
      const assessScript = assess.script || '';
      const content = assessHTML + assessScript;

      if (content.includes(moduleId) || content.includes(shortId)) {
        dependencies.assessments.push({
          id: assess.id,
          title: assess.title,
          moduleTitle: mod.title,
        });
      }
    });
  });

  // Check toolkit items
  const toolkit = projectData['Global Toolkit'] || [];
  toolkit.forEach((tool) => {
    const toolCode =
      typeof tool.code === 'string' ? JSON.parse(tool.code || '{}') : tool.code || {};
    const toolContent = (toolCode.html || '') + (toolCode.script || '');

    if (toolContent.includes(moduleId) || toolContent.includes(shortId)) {
      dependencies.toolkit.push({
        id: tool.id,
        title: tool.title,
      });
    }
  });

  // Check materials (less common, but possible)
  const materials = projectData['Current Course']?.materials || [];
  materials.forEach((mat) => {
    const matContent = (mat.title || '') + (mat.description || '') + (mat.viewUrl || '');
    if (matContent.includes(moduleId) || matContent.includes(shortId)) {
      dependencies.materials.push({
        id: mat.id,
        title: mat.title,
      });
    }
  });

  const totalDeps =
    dependencies.modules.length +
    dependencies.assessments.length +
    dependencies.toolkit.length +
    dependencies.materials.length;

  return {
    hasDependencies: totalDeps > 0,
    dependencies,
    totalCount: totalDeps,
    moduleTitle,
  };
}
