/**
 * Scope CSS selectors to a specific module ID
 * Adds #view-{id} prefix to CSS selectors to prevent conflicts
 */
export function scopeCSS(css, viewId) {
  if (!css || !viewId) return css;
  
  // Add #view-{id} prefix to CSS selectors
  // Handle various CSS patterns
  let scoped = css;
  
  // Scope regular selectors (but not @rules)
  scoped = scoped.replace(/([^{}@]+)\{/g, (match, selector) => {
    // Skip if already scoped or is @rule
    if (selector.trim().startsWith('@') || selector.includes(`#${viewId}`)) {
      return match;
    }
    
    // Clean selector and add scope
    const cleanSelector = selector.trim();
    if (cleanSelector) {
      return `#${viewId} ${cleanSelector} {`;
    }
    return match;
  });
  
  return scoped;
}

/**
 * Re-scope CSS from old ID to new ID
 * Replaces all instances of old ID with new ID in CSS selectors
 */
export function rescopeCSS(css, oldId, newId) {
  if (!css || !oldId || !newId) return css;
  
  // Replace old ID with new ID in CSS selectors
  // Handle various patterns: #oldId, #oldId .class, etc.
  let rescaled = css;
  
  // Replace #oldId with #newId
  const oldIdRegex = new RegExp(`#${oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  rescaled = rescaled.replace(oldIdRegex, `#${newId}`);
  
  // Also handle cases where oldId might be in a selector like "#oldId .class"
  // The above regex should handle this, but we can be more explicit if needed
  
  return rescaled;
}
