/**
 * Get module type (standalone, external, or legacy)
 */
export function getModuleType(module) {
  if (module.type === 'standalone' || module.type === 'external') {
    return module.type;
  }
  // Check if it has direct html/css/script (standalone without type)
  if (module.html && !module.code?.html) {
    return 'standalone';
  }
  // Check if it has code property (legacy)
  if (module.code) {
    return 'legacy';
  }
  // Default to legacy for backwards compatibility
  return 'legacy';
}

/**
 * Extract module content (HTML, CSS, Script) from any module type
 * Returns: { html, css, script, type }
 */
export function extractModuleContent(module) {
  const type = getModuleType(module);
  
  if (type === 'standalone') {
    return {
      html: module.html || '',
      css: module.css || '',
      script: module.script || '',
      type: 'standalone'
    };
  }
  
  if (type === 'external') {
    // Generate HTML based on linkType
    let html = '';
    if (module.linkType === 'iframe') {
      html = `<div id="${module.id}" class="w-full h-full" style="min-height: 600px;">
        <iframe src="${module.url}" width="100%" height="100%" style="border:none;" frameborder="0"></iframe>
      </div>`;
    } else {
      html = `<div id="${module.id}" class="w-full h-full p-8 text-center">
        <h2 class="text-2xl font-bold text-white mb-4">${module.title || 'External Module'}</h2>
        <p class="text-slate-400 mb-6">This module opens in a new tab.</p>
        <a href="${module.url}" target="_blank" rel="noopener noreferrer" 
           class="inline-block bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-lg text-sm font-bold uppercase transition-all">
          Open ${module.title || 'Module'}
        </a>
      </div>`;
    }
    return {
      html: html,
      css: '',
      script: '',
      type: 'external'
    };
  }
  
  // Legacy format
  let code = module.code || {};
  if (typeof code === 'string') {
    try {
      code = JSON.parse(code);
    } catch (e) {
      console.error('Failed to parse module code:', e);
      code = {};
    }
  }
  
  // Fallback: check if html/script are directly on module
  return {
    html: code.html || module.html || '',
    css: code.css || module.css || '',
    script: code.script || module.script || '',
    type: 'legacy'
  };
}

/**
 * Validate module before saving
 * Returns: { isValid, errors, warnings }
 */
export function validateModule(module, isNew = false) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!module.id || !module.id.trim()) {
    errors.push('Module ID is required');
  } else {
    // ID format validation
    if (!module.id.startsWith('view-') && !module.id.startsWith('item-')) {
      warnings.push('Module ID should start with "view-" or "item-"');
    }
    
    // Check for invalid characters
    if (!/^[a-z0-9-_]+$/i.test(module.id)) {
      errors.push('Module ID can only contain letters, numbers, hyphens, and underscores');
    }
  }

  if (!module.title || !module.title.trim()) {
    errors.push('Module title is required');
  }

  // Type-specific validation
  if (module.type === 'standalone') {
    if (!module.html || !module.html.trim()) {
      errors.push('Standalone modules must have HTML content');
    } else {
      // Check if HTML has a root container with matching ID
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(module.html, 'text/html');
        const rootElement = doc.querySelector(`#${module.id}`);
        if (!rootElement) {
          warnings.push(`HTML should contain a root element with id="${module.id}"`);
        }
      } catch (e) {
        warnings.push('Could not parse HTML to check for root element');
      }
    }
  } else if (module.type === 'external') {
    if (!module.url || !module.url.trim()) {
      errors.push('External modules must have a URL');
    } else {
      // URL validation
      try {
        new URL(module.url);
      } catch (e) {
        errors.push('Invalid URL format');
      }
    }
    if (!module.linkType || !['iframe', 'newtab'].includes(module.linkType)) {
      errors.push('External modules must specify linkType as "iframe" or "newtab"');
    }
  } else if (!module.type) {
    // Legacy module
    if (!module.code) {
      errors.push('Legacy modules must have a code property');
    } else {
      let code = module.code;
      if (typeof code === 'string') {
        try {
          code = JSON.parse(code);
        } catch (e) {
          errors.push('Invalid code JSON format');
          return { isValid: false, errors, warnings };
        }
      }
      if (!code.html || !code.html.trim()) {
        errors.push('Legacy modules must have code.html');
      }
    }
  }

  // Script validation (warnings only - scripts might be optional)
  if (module.script) {
    // Check for common issues
    if (module.script.includes('document.write')) {
      warnings.push('Using document.write() can cause issues in iframes');
    }
    if (module.script.includes('window.location') && !module.script.includes('preventDefault')) {
      warnings.push('Direct window.location changes may break navigation');
    }
  }

  // CSS validation (warnings only)
  if (module.css) {
    // Check for unscoped selectors that might conflict (basic check)
    const hasUnscopedSelectors = /^[^{}@]+{/gm.test(module.css);
    if (hasUnscopedSelectors && module.id && !module.css.includes('#' + module.id)) {
      warnings.push('Some CSS selectors may not be scoped to the module ID - may cause conflicts');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
