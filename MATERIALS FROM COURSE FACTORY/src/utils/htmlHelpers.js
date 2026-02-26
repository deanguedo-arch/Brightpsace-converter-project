/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate URL and reject dangerous protocols
 * Returns: { isValid: boolean, safeUrl: string, error?: string }
 */
export function validateUrl(url) {
  if (!url || !url.trim()) {
    return { isValid: false, safeUrl: '#', error: 'Empty URL' };
  }
  
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  // Reject dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return { isValid: false, safeUrl: '#', error: `Dangerous protocol: ${protocol}` };
    }
  }
  
  // Try to construct a URL object to validate format
  try {
    const urlObj = new URL(trimmed);
    // Only allow http, https, and relative URLs
    if (!['http:', 'https:', ''].includes(urlObj.protocol) && urlObj.protocol !== '') {
      return { isValid: false, safeUrl: '#', error: `Unsupported protocol: ${urlObj.protocol}` };
    }
    return { isValid: true, safeUrl: trimmed };
  } catch (e) {
    // If URL parsing fails, it might be a relative URL - allow it but escape it
    return { isValid: true, safeUrl: escapeHtml(trimmed) };
  }
}

/**
 * Clean module HTML: remove hidden classes, fix sizing, remove comments
 */
export function cleanModuleHTML(html) {
  if (!html) return '';
  
  let cleaned = html;
  
  // Remove HTML comments that break init checks
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove 'hidden' class
  cleaned = cleaned.replace(/class="([^"]*)\bhidden\b([^"]*)"/g, 'class="$1$2"');
  
  // Remove 'custom-scroll' class (not needed without navigation container)
  cleaned = cleaned.replace(/class="([^"]*)\bcustom-scroll\b([^"]*)"/g, 'class="$1$2"');
  
  // Remove 'h-full' and 'w-full' classes that cause overlap issues
  cleaned = cleaned.replace(/class="([^"]*)\bh-full\b([^"]*)"/g, 'class="$1$2"');
  cleaned = cleaned.replace(/class="([^"]*)\bw-full\b([^"]*)"/g, 'class="$1 w-auto max-w-full$2"');
  
  // Clean up any double spaces in class attributes
  cleaned = cleaned.replace(/class="([^"]*)"/g, (match) => {
    const cleanedClass = match.replace(/\s+/g, ' ').trim();
    return cleanedClass;
  });
  
  return cleaned;
}

/**
 * Clean module script: convert const/let to var, fix initialization checks
 */
export function cleanModuleScript(script) {
  if (!script) return '';
  
  let cleaned = script;
  
  // Replace const/let declarations that might conflict (convert to var for compatibility)
  // This prevents "Identifier already declared" errors when scripts run multiple times
  cleaned = cleaned.replace(/\bconst\s+(\w+)\s*=/g, 'var $1 =');
  cleaned = cleaned.replace(/\blet\s+(\w+)\s*=/g, 'var $1 =');
  
  // Replace innerHTML.trim() === "" with a forced clear + check
  cleaned = cleaned.replace(
    /if\s*\(\s*sc\s*&&\s*sc\.innerHTML\.trim\(\)\s*===\s*['"]['""]\s*\)\s*{/g,
    'if (sc) { sc.innerHTML = "";'
  );
  
  // Replace sc.children.length === 0 with a forced clear
  cleaned = cleaned.replace(
    /if\s*\(\s*sc\s*&&\s*sc\.children\.length\s*===\s*0\s*\)\s*{/g,
    'if (sc) { sc.innerHTML = "";'
  );
  
  return cleaned;
}

/**
 * Update HTML root element ID from old ID to new ID
 */
export function updateHTMLRootId(html, oldId, newId) {
  if (!html || !oldId || !newId) return html;
  
  // Replace id="oldId" or id='oldId' with id="newId"
  const idRegex = new RegExp(`id=["']${oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi');
  return html.replace(idRegex, `id="${newId}"`);
}

/**
 * Update JavaScript references to old ID with new ID
 */
export function updateScriptReferences(script, oldId, newId) {
  if (!script || !oldId || !newId) return script;
  
  // Escape special regex characters in oldId
  const escapedOldId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace various patterns:
  // - getElementById('oldId') -> getElementById('newId')
  // - querySelector('#oldId') -> querySelector('#newId')
  // - '#oldId' -> '#newId'
  // - "oldId" in string context (be careful not to replace in comments)
  
  let updated = script;
  
  // Replace getElementById('oldId') or getElementById("oldId")
  updated = updated.replace(
    new RegExp(`getElementById\\(['"]${escapedOldId}['"]\\)`, 'gi'),
    `getElementById('${newId}')`
  );
  
  // Replace querySelector('#oldId') or querySelector("#oldId")
  updated = updated.replace(
    new RegExp(`querySelector\\(['"]#${escapedOldId}['"]\\)`, 'gi'),
    `querySelector('#${newId}')`
  );
  
  // Replace standalone '#oldId' strings (be careful with context)
  updated = updated.replace(
    new RegExp(`(['"])#${escapedOldId}\\1`, 'g'),
    `$1#${newId}$1`
  );
  
  return updated;
}
