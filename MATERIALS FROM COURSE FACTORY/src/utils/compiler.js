import { buildStaticFilesBetaFromProject, generateModuleHtmlBeta } from './generators.js';

export const BETA_MULTI_FILE_TARGET = 'beta-multi-file';

export function compileProjectToFilesMap({
  projectData,
  excludedIds = [],
  target = BETA_MULTI_FILE_TARGET,
} = {}) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('compileProjectToFilesMap requires a valid projectData object');
  }
  if (target !== BETA_MULTI_FILE_TARGET) {
    throw new Error(`Unsupported compile target: ${target}`);
  }
  return buildStaticFilesBetaFromProject({ projectData, excludedIds });
}

export function getCompiledModulePath(moduleId) {
  if (!moduleId) return null;
  return `modules/${moduleId}.html`;
}

export function getCompiledModuleHtml({
  projectData,
  moduleId,
  excludedIds = [],
  target = BETA_MULTI_FILE_TARGET,
  renderSettings = null,
} = {}) {
  const modulePath = getCompiledModulePath(moduleId);
  if (!modulePath) return null;
  const filesMap = compileProjectToFilesMap({ projectData, excludedIds, target });
  return filesMap[modulePath] || compileModuleToHtml({ projectData, moduleId, renderSettings });
}

export function compileModuleToHtml({ projectData, moduleId, renderSettings = null } = {}) {
  if (!projectData || !moduleId) return null;
  const modules = projectData?.["Current Course"]?.modules || [];
  return generateModuleHtmlBeta({ projectData, modules, moduleId, renderSettings });
}
