import { getActivityDefinition } from './activityRegistry.js';
import { normalizeComposerActivities, normalizeComposerModuleConfig } from './layout.js';
import {
  createFinlitHeroFormState,
  createFinlitTemplateFormState,
  resolveFinlitHeroMediaKind,
} from '../utils/finlitHero.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSafeHref(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  if (/^(\/|\.\/|\.\.\/|#)/.test(raw)) return raw;
  if (/^materials\//i.test(raw)) return `/${raw}`;
  return '';
}

const COMPOSER_BLOCK_FONT_STACKS = {
  Arial: 'Arial, Helvetica, sans-serif',
  Helvetica: 'Helvetica, Arial, sans-serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  Tahoma: 'Tahoma, Geneva, sans-serif',
  'Trebuchet MS': 'Trebuchet MS, Helvetica, sans-serif',
  'Segoe UI': 'Segoe UI, Tahoma, sans-serif',
  Georgia: 'Georgia, serif',
  Garamond: 'Garamond, serif',
  'Palatino Linotype': 'Palatino Linotype, Book Antiqua, Palatino, serif',
  'Times New Roman': 'Times New Roman, Times, serif',
  'Courier New': 'Courier New, Courier, monospace',
  'Lucida Console': 'Lucida Console, Monaco, monospace',
  Impact: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
  'Comic Sans MS': 'Comic Sans MS, Comic Sans, cursive',
  Inter: 'Inter, sans-serif',
  Roboto: 'Roboto, sans-serif',
  'Open Sans': 'Open Sans, sans-serif',
  Lato: 'Lato, sans-serif',
  Montserrat: 'Montserrat, sans-serif',
  Poppins: 'Poppins, sans-serif',
  Raleway: 'Raleway, sans-serif',
  Nunito: 'Nunito, sans-serif',
  'Playfair Display': 'Playfair Display, serif',
  Merriweather: 'Merriweather, serif',
  Oswald: 'Oswald, sans-serif',
  'Bebas Neue': 'Bebas Neue, sans-serif',
};

const COMPOSER_BLOCK_THEME_PRESETS = {
  default: null,
  slate: {
    textColor: '#dbe3ee',
    containerBg: 'rgba(15, 23, 42, 0.82)',
    borderColor: 'rgba(71, 85, 105, 0.7)',
    accentColor: '#7dd3fc',
  },
  ocean: {
    textColor: '#dbeafe',
    containerBg: 'rgba(30, 58, 138, 0.45)',
    borderColor: 'rgba(96, 165, 250, 0.7)',
    accentColor: '#38bdf8',
  },
  forest: {
    textColor: '#dcfce7',
    containerBg: 'rgba(20, 83, 45, 0.5)',
    borderColor: 'rgba(74, 222, 128, 0.6)',
    accentColor: '#4ade80',
  },
  sunset: {
    textColor: '#ffedd5',
    containerBg: 'rgba(154, 52, 18, 0.45)',
    borderColor: 'rgba(251, 146, 60, 0.65)',
    accentColor: '#fb923c',
  },
  mono: {
    textColor: '#f8fafc',
    containerBg: 'rgba(17, 24, 39, 0.82)',
    borderColor: 'rgba(148, 163, 184, 0.6)',
    accentColor: '#cbd5e1',
  },
};

function sanitizeHexColor(value) {
  const raw = String(value || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : '';
}

function resolveComposerBlockTheme(value) {
  const raw = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(COMPOSER_BLOCK_THEME_PRESETS, raw) ? raw : 'default';
}

function resolveComposerBlockFont(value) {
  const raw = String(value || '').trim();
  return COMPOSER_BLOCK_FONT_STACKS[raw] || '';
}

function resolveComposerBlockStyle(data = {}) {
  const themeKey = resolveComposerBlockTheme(data.blockTheme);
  const theme = COMPOSER_BLOCK_THEME_PRESETS[themeKey];
  const fontFamily = resolveComposerBlockFont(data.blockFontFamily);
  const textColor = sanitizeHexColor(data.blockTextColor) || (theme?.textColor || '');
  const containerBg = sanitizeHexColor(data.blockContainerBg || data.containerBg) || (theme?.containerBg || '');
  const borderColor = theme?.borderColor || '';
  const accentColor = theme?.accentColor || '';
  return {
    themeKey,
    fontFamily,
    textColor,
    containerBg,
    borderColor,
    accentColor,
  };
}

export function normalizeActivities(activities, { maxColumns } = {}) {
  return normalizeComposerActivities(activities, { maxColumns });
}

function buildComposerRuntimeScript() {
  return `
    (function() {
      if (window.__CF_COMPOSER_RUNTIME_BOUND__) return;
      window.__CF_COMPOSER_RUNTIME_BOUND__ = true;

      function normalizeSpace(value) {
        return String(value || '').replace(/\\s+/g, ' ').trim();
      }

      function closest(el, selector) {
        while (el) {
          if (el.matches && el.matches(selector)) return el;
          el = el.parentElement;
        }
        return null;
      }

      function resolveViewerUrl(rawUrl) {
        var url = resolveAssetUrl(rawUrl);
        if (!url) return '';
        if (url.indexOf('docs.google.com/viewer') !== -1) return url;

        function isGoogleSitesHost() {
          var ref = '';
          try { ref = document.referrer || ''; } catch (e) { ref = ''; }
          if (/sites\\.google\\.com/i.test(ref)) return true;
          try { return /sites\\.google\\.com/i.test(window.top.location.host || ''); } catch (e) { return /sites\\.google\\.com/i.test(ref); }
        }

        var clean = String(url).trim();
        if (!clean) return clean;

        // Prefer direct Drive preview URLs.
        var isDrive = /docs\\.google\\.com|drive\\.google\\.com/i.test(clean);
        if (isDrive) {
          var driveIdMatch = clean.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/i) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
          if (driveIdMatch && driveIdMatch[1]) {
            return 'https://drive.google.com/file/d/' + driveIdMatch[1] + '/preview';
          }
          if (clean.indexOf('/view') !== -1) {
            return clean.replace('/view', '/preview');
          }
          return clean;
        }

        // Never route local/same-origin URLs through Google Docs Viewer.
        if (/^(\\/|\\.\\/|\\.\\.\\/|blob:|data:)/i.test(clean)) {
          return clean;
        }
        var isSameOrigin = false;
        try {
          var parsed = new URL(clean, window.location.href);
          isSameOrigin = parsed.origin === window.location.origin;
        } catch (e) {
          isSameOrigin = false;
        }
        if (isSameOrigin) {
          return clean;
        }

        // Google Sites embeds often need the Docs viewer, but only for public absolute URLs.
        var forceViewer = isGoogleSitesHost() || window.CF_FORCE_PDF_VIEWER === true;
        if (forceViewer && /^https?:\\/\\//i.test(clean)) {
          return 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(clean);
        }

        return clean;
      }

      function resolveAssetUrl(rawUrl) {
        var url = String(rawUrl || '').trim();
        if (!url) return '';

        // Keep absolute/remote URLs untouched.
        if (/^(https?:|data:|blob:|mailto:)/i.test(url)) return url;
        if (/^\\/\\//.test(url)) return url;

        function smartJoin(base, path) {
          if (!base) return path;
          var baseClean = String(base).replace(/\\/$/, '');
          if (!path || !/^\\//.test(path)) return baseClean + '/' + path;
          var baseParts = baseClean.split('/');
          var lastBaseSegment = baseParts[baseParts.length - 1];
          if (lastBaseSegment && path.indexOf('/' + lastBaseSegment + '/') === 0) {
            return baseClean + path.substring(lastBaseSegment.length + 1);
          }
          return baseClean + path;
        }

        function normalizeLocalMaterialPath(value) {
          var clean = String(value || '').trim();
          var idx = clean.indexOf('/materials/');
          if (idx !== -1) return clean.substring(idx);
          if (/^materials\\//.test(clean)) return '/' + clean;
          return clean;
        }

        function getOriginalLocalMaterialPath(value) {
          var clean = String(value || '').trim();
          var idx = clean.indexOf('/materials/');
          if (idx !== -1) {
            var withPrefix = clean;
            return withPrefix.startsWith('/') ? withPrefix : ('/' + withPrefix);
          }
          if (/^materials\\//.test(clean)) return '/' + clean;
          if (/^\\/materials\\//.test(clean)) return clean;
          return '';
        }

        // Use configured asset base URL when available (Google Sites / CDN).
        var baseUrl = String(window.CF_ASSET_BASE_URL || '').trim().replace(/\\/$/, '');
        var materialPath = normalizeLocalMaterialPath(url);
        var originalMaterialPath = getOriginalLocalMaterialPath(url);
        if (baseUrl && /^\\/materials\\//.test(materialPath)) {
          return smartJoin(baseUrl, materialPath);
        }

        // For embedded/hosted contexts without base URL, prefer preserving the original absolute path.
        if (originalMaterialPath) {
          var pathname = window.location && window.location.pathname ? window.location.pathname : '';
          var host = window.location && window.location.hostname ? window.location.hostname : '';
          var inGoogleEmbed = /googleusercontent\\.com|sites\\.google\\.com/i.test(host) || /\\/embeds\\//.test(pathname);
          if (inGoogleEmbed) {
            return originalMaterialPath;
          }
        }

        // Normalize known local materials paths so they work in local exported modules and ZIPs.
        if (/^\\/materials\\//.test(materialPath)) {
          var rel = materialPath.substring(1); // materials/...
          var path = window.location && window.location.pathname ? window.location.pathname : '';
          var inModulesDir = /\\/modules\\//.test(path) || window.location.protocol === 'file:';
          return inModulesDir ? ('../' + rel) : rel;
        }

        if (/^\\//.test(url)) return url;
        return url;
      }

      function getSubmissionContext(target) {
        var block = closest(target, '[data-submission-block]');
        if (!block) return null;
        return {
          block: block,
          output: block.querySelector('[data-submission-output]'),
        };
      }

      function getSaveLoadContext(target) {
        var block = closest(target, '[data-save-load-block]');
        if (!block) return null;
        return {
          block: block,
          root: closest(block, '[data-composer-root]') || document,
          input: block.querySelector('[data-save-load-upload-input]'),
          status: block.querySelector('[data-save-load-status]'),
          fileName: block.getAttribute('data-save-load-file-name') || 'module-progress',
        };
      }

      function setSaveLoadStatus(ctx, message, tone) {
        if (!ctx || !ctx.status) return;
        var normalizedTone = tone === 'error' ? 'error' : tone === 'success' ? 'success' : 'info';
        var toneClass = normalizedTone === 'error' ? 'text-rose-300' : normalizedTone === 'success' ? 'text-emerald-300' : 'text-cyan-100/75';
        ctx.status.className = 'mt-3 text-xs ' + toneClass;
        ctx.status.textContent = message;
      }

      function getPersistableFields(root) {
        return Array.prototype.slice.call(root.querySelectorAll('input, textarea, select')).filter(function(field) {
          if (closest(field, '[data-submission-block]')) return false;
          if (closest(field, '[data-save-load-block]')) return false;
          var tag = String(field.tagName || '').toLowerCase();
          var type = String(field.type || '').toLowerCase();
          if (tag === 'input' && (type === 'hidden' || type === 'file' || type === 'button' || type === 'submit' || type === 'reset' || type === 'image')) {
            return false;
          }
          return true;
        });
      }

      function ensureSortItemIds(list, listIndex) {
        if (!list) return;
        Array.prototype.slice.call(list.querySelectorAll('[data-sort-item]')).forEach(function(item, itemIndex) {
          if (!item.getAttribute('data-sort-item-id')) {
            item.setAttribute('data-sort-item-id', 'sort-' + listIndex + '-item-' + itemIndex);
          }
        });
      }

      function collectInteractiveUiState(root) {
        var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tabs-block]')).map(function(block) {
          var activeTrigger = block.querySelector('[data-tabs-trigger][aria-selected="true"]');
          if (!activeTrigger) activeTrigger = block.querySelector('[data-tabs-trigger]');
          var idx = parseInt((activeTrigger && activeTrigger.getAttribute('data-tab-index')) || '0', 10);
          return Number.isInteger(idx) ? idx : 0;
        });

        var pathMaps = Array.prototype.slice.call(root.querySelectorAll('[data-path-map-block]')).map(function(block) {
          var activeNode = block.querySelector('[data-path-node].ring-1') || block.querySelector('[data-path-node]');
          var idx = parseInt((activeNode && activeNode.getAttribute('data-path-index')) || '0', 10);
          return Number.isInteger(idx) ? idx : 0;
        });

        var hotspots = Array.prototype.slice.call(root.querySelectorAll('[data-hotspot-block]')).map(function(block) {
          var activeButton = block.querySelector('[data-hotspot-btn].bg-sky-500') || block.querySelector('[data-hotspot-btn]');
          var idx = parseInt((activeButton && activeButton.getAttribute('data-hotspot-index')) || '0', 10);
          return Number.isInteger(idx) ? idx : 0;
        });

        var flashcards = Array.prototype.slice.call(root.querySelectorAll('[data-flashcards-block]')).map(function(block) {
          return Array.prototype.slice
            .call(block.querySelectorAll('[data-flashcard]'))
            .map(function(card, cardIndex) {
              return card.getAttribute('data-flashcard-side') === 'back' ? cardIndex : null;
            })
            .filter(function(index) { return index !== null; });
        });

        var sortLists = Array.prototype.slice.call(root.querySelectorAll('[data-sort-list]')).map(function(list, listIndex) {
          ensureSortItemIds(list, listIndex);
          return Array.prototype.slice
            .call(list.querySelectorAll('[data-sort-item]'))
            .map(function(item) { return item.getAttribute('data-sort-item-id') || ''; })
            .filter(Boolean);
        });

        return {
          tabs: tabs,
          pathMaps: pathMaps,
          hotspots: hotspots,
          flashcards: flashcards,
          sortLists: sortLists,
        };
      }

      function applyInteractiveUiState(root, uiState) {
        var state = uiState && typeof uiState === 'object' ? uiState : {};

        Array.prototype.slice.call(root.querySelectorAll('[data-tabs-block]')).forEach(function(block, idx) {
          if (!Array.isArray(state.tabs)) return;
          var next = parseInt(state.tabs[idx], 10);
          if (!Number.isInteger(next)) return;
          setActiveTab(block, next);
        });

        Array.prototype.slice.call(root.querySelectorAll('[data-path-map-block]')).forEach(function(block, idx) {
          if (!Array.isArray(state.pathMaps)) return;
          var next = parseInt(state.pathMaps[idx], 10);
          if (!Number.isInteger(next)) return;
          setPathMapIndex(block, next);
        });

        Array.prototype.slice.call(root.querySelectorAll('[data-hotspot-block]')).forEach(function(block, idx) {
          if (!Array.isArray(state.hotspots)) return;
          var next = parseInt(state.hotspots[idx], 10);
          if (!Number.isInteger(next)) return;
          setHotspotIndex(block, next);
        });

        Array.prototype.slice.call(root.querySelectorAll('[data-flashcards-block]')).forEach(function(block, idx) {
          var openIndexes = Array.isArray(state.flashcards) && Array.isArray(state.flashcards[idx]) ? state.flashcards[idx] : [];
          var openSet = new Set(openIndexes.map(function(value) { return parseInt(value, 10); }));
          Array.prototype.slice.call(block.querySelectorAll('[data-flashcard]')).forEach(function(card, cardIndex) {
            setFlashcardFace(card, openSet.has(cardIndex));
          });
        });

        Array.prototype.slice.call(root.querySelectorAll('[data-sort-list]')).forEach(function(list, listIndex) {
          ensureSortItemIds(list, listIndex);
          if (!(Array.isArray(state.sortLists) && Array.isArray(state.sortLists[listIndex]))) return;
          var desiredOrder = state.sortLists[listIndex];
          var byId = {};
          Array.prototype.slice.call(list.querySelectorAll('[data-sort-item]')).forEach(function(item) {
            byId[item.getAttribute('data-sort-item-id') || ''] = item;
          });
          desiredOrder.forEach(function(itemId) {
            var item = byId[itemId];
            if (item) list.appendChild(item);
          });
          refreshSortRanks(list);
        });
      }

      function collectModuleProgressSnapshot(root) {
        var fields = getPersistableFields(root).map(function(field) {
          var tag = String(field.tagName || '').toLowerCase();
          var type = String(field.type || '').toLowerCase();
          if (type === 'checkbox' || type === 'radio') {
            return {
              tag: tag,
              type: type,
              checked: Boolean(field.checked),
            };
          }
          return {
            tag: tag,
            type: type,
            value: String(field.value || ''),
          };
        });

        return {
          kind: 'course-factory-module-progress',
          version: 1,
          savedAt: new Date().toISOString(),
          fields: fields,
          ui: collectInteractiveUiState(root),
        };
      }

      function applyModuleProgressSnapshot(root, snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
          return { ok: false, message: 'Invalid progress payload.' };
        }
        var records = Array.isArray(snapshot.fields) ? snapshot.fields : [];
        if (!records.length) {
          return { ok: false, message: 'No saved fields found in this file.' };
        }

        var fields = getPersistableFields(root);
        var appliedCount = 0;
        records.forEach(function(record, idx) {
          var field = fields[idx];
          if (!field) return;
          var tag = String(field.tagName || '').toLowerCase();
          var type = String(field.type || '').toLowerCase();
          if (type === 'checkbox' || type === 'radio') {
            field.checked = Boolean(record && record.checked);
            appliedCount += 1;
            return;
          }
          var nextValue = record && Object.prototype.hasOwnProperty.call(record, 'value') ? String(record.value || '') : '';
          field.value = nextValue;
          appliedCount += 1;
          if (tag === 'select' || type === 'range') return;
        });

        applyInteractiveUiState(root, snapshot.ui || {});

        Array.prototype.slice.call(root.querySelectorAll('[data-checklist-block]')).forEach(function(block) {
          refreshChecklistBlock(block, true);
        });
        Array.prototype.slice.call(root.querySelectorAll('[data-before-after-block]')).forEach(function(block) {
          refreshBeforeAfterBlock(block);
        });
        Array.prototype.slice.call(root.querySelectorAll('[data-decision-block]')).forEach(function(block) {
          refreshDecisionBlock(block);
        });
        Array.prototype.slice.call(root.querySelectorAll('[data-rubric-block]')).forEach(function(block) {
          refreshRubricBlock(block);
        });

        return { ok: true, message: 'Restored ' + appliedCount + ' fields from backup.' };
      }

      function downloadModuleProgressSnapshot(ctx, snapshot) {
        var baseName = String((ctx && ctx.fileName) || 'module-progress').replace(/[^a-z0-9._-]/gi, '-').trim() || 'module-progress';
        var fileName = /\\.json$/i.test(baseName) ? baseName : (baseName + '.json');
        var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function() {
          URL.revokeObjectURL(link.href);
        }, 500);
      }

      function getReadableText(el, fallback) {
        if (!el) return fallback || '';
        var text = normalizeSpace(el.innerText || el.textContent || '');
        return text || fallback || '';
      }

      function getSectionTitle(section, fallback) {
        if (!section) return fallback || 'Section';
        var titleEl = section.querySelector('h3, h2, h4');
        return getReadableText(titleEl, fallback || 'Section');
      }

      function readFieldLabel(field, scope, fallback) {
        if (!field) return fallback || 'Response';
        var labelEl = null;
        var id = field.id;
        if (id) {
          try {
            labelEl = scope.querySelector('label[for="' + id.replace(/"/g, '\\"') + '"]');
          } catch (err) {
            labelEl = null;
          }
        }
        if (!labelEl) labelEl = closest(field, 'label');
        var raw = labelEl ? getReadableText(labelEl, '') : '';
        if (!raw && field.getAttribute) raw = normalizeSpace(field.getAttribute('aria-label') || '');
        if (!raw) raw = normalizeSpace(field.name || field.id || field.placeholder || '');
        return raw || fallback || 'Response';
      }

      function readFieldValue(field) {
        if (!field) return '';
        var tag = String(field.tagName || '').toLowerCase();
        var type = String(field.type || '').toLowerCase();
        if (type === 'checkbox') return field.checked ? 'Yes' : '';
        if (tag === 'select') {
          var selected = field.options && field.selectedIndex >= 0 ? field.options[field.selectedIndex] : null;
          var selectedText = selected ? normalizeSpace(selected.innerText || selected.text || '') : '';
          return selectedText || normalizeSpace(field.value || '');
        }
        return normalizeSpace(field.value || '');
      }

      function formatNumericValue(value) {
        var parsed = Number(value);
        if (!Number.isFinite(parsed)) return '0';
        var rounded = Math.round(parsed * 100) / 100;
        return String(rounded);
      }

      function collectFilledFieldLines(scope, options) {
        var config = options || {};
        var lines = [];
        var textFields = Array.prototype.slice.call(
          scope.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), textarea, select'),
        );
        textFields.forEach(function(field, idx) {
          if (closest(field, '[data-submission-block]')) return;
          if (Array.isArray(config.excludeSelectors) && config.excludeSelectors.some(function(selector) { return closest(field, selector); })) return;
          var value = readFieldValue(field);
          if (!value) return;
          var fallbackLabel = 'Response ' + (idx + 1);
          var label = readFieldLabel(field, scope, fallbackLabel);
          lines.push(label + ': ' + value);
        });

        if (config.includeCheckedCheckboxes !== false) {
          var checkboxes = Array.prototype.slice.call(scope.querySelectorAll('input[type="checkbox"]'));
          checkboxes.forEach(function(field) {
            if (closest(field, '[data-submission-block]')) return;
            if (Array.isArray(config.excludeSelectors) && config.excludeSelectors.some(function(selector) { return closest(field, selector); })) return;
            if (!field.checked) return;
            var label = readFieldLabel(field, scope, 'Checkbox');
            lines.push(label + ': Yes');
          });
        }

        if (config.includeRadioSelections !== false) {
          var radios = Array.prototype.slice.call(scope.querySelectorAll('input[type="radio"]'));
          var radioGroups = {};
          radios.forEach(function(field, idx) {
            if (closest(field, '[data-submission-block]')) return;
            if (Array.isArray(config.excludeSelectors) && config.excludeSelectors.some(function(selector) { return closest(field, selector); })) return;
            var key = field.name || ('__radio_' + idx);
            if (!radioGroups[key]) radioGroups[key] = [];
            radioGroups[key].push(field);
          });
          Object.keys(radioGroups).forEach(function(key) {
            var group = radioGroups[key];
            if (!group || !group.length) return;
            var selected = null;
            group.forEach(function(field) {
              if (field.checked) selected = field;
            });
            if (!selected) return;
            var optionWrap = closest(selected, 'label');
            var optionText = optionWrap ? getReadableText(optionWrap, '') : '';
            if (!optionText) optionText = normalizeSpace(selected.value || 'Selected');
            var label = key && key.indexOf('__radio_') !== 0 ? key : 'Selected Option';
            lines.push(label + ': ' + optionText);
          });
        }

        return lines;
      }

      function pushReportSection(targetLines, title, lines) {
        if (!lines || !lines.length) return;
        targetLines.push('[' + title + ']');
        lines.forEach(function(line) {
          targetLines.push('- ' + line);
        });
        targetLines.push('');
      }

      function buildSubmissionReport(root) {
        var reportLines = [];
        var sections = Array.prototype.slice.call(root.querySelectorAll('[data-activity-type]'));

        sections.forEach(function(section, sectionIdx) {
          var type = normalizeSpace(section.getAttribute('data-activity-type') || '').toLowerCase();
          if (!type || type === 'submission_builder' || type === 'save_load_block') return;
          var title = getSectionTitle(section, 'Activity ' + (sectionIdx + 1));
          var lines = [];

          if (type === 'knowledge_check') {
            var block = section.querySelector('[data-kc-block]');
            if (!block) return;
            var title = getReadableText(block.querySelector('h3'), 'Knowledge Check');
            lines.push('Set: ' + title);
            var questionNodes = Array.prototype.slice.call(block.querySelectorAll('[data-kc-question]'));
            if (questionNodes.length) {
              questionNodes.forEach(function(questionNode, qIdx) {
                var kind = normalizeSpace(questionNode.getAttribute('data-kc-kind') || '').toLowerCase();
                var prompt = getReadableText(questionNode.querySelector('[data-kc-prompt]'), 'Question ' + (qIdx + 1));
                if (kind === 'short_answer') {
                  var responseField = questionNode.querySelector('[data-kc-short-answer]');
                  var responseText = normalizeSpace((responseField && responseField.value) || '');
                  lines.push('Q' + (qIdx + 1) + ': ' + prompt);
                  lines.push('Response: ' + (responseText || '[No response]'));
                  return;
                }
                var selected = questionNode.querySelector('input[type="radio"]:checked');
                var selectedLabel = '[No selection]';
                var outcome = 'Not answered';
                if (selected) {
                  var labelWrap = closest(selected, 'label');
                  selectedLabel = labelWrap ? getReadableText(labelWrap, 'Option ' + (selected.value || '?')) : ('Option ' + (selected.value || '?'));
                  var correct = parseInt(questionNode.getAttribute('data-kc-correct') || '0', 10);
                  var picked = parseInt(selected.value || '-1', 10);
                  if (!isNaN(correct) && !isNaN(picked)) {
                    outcome = picked === correct ? 'Correct' : 'Incorrect';
                  }
                }
                lines.push('Q' + (qIdx + 1) + ': ' + prompt);
                lines.push('Selected Answer: ' + selectedLabel);
                lines.push('Result: ' + outcome);
              });
            } else {
              // Legacy knowledge-check markup fallback.
              var prompt = getReadableText(block.querySelector('h3'), 'Knowledge Check');
              var selected = block.querySelector('input[type="radio"]:checked');
              var selectedLabel = '[No selection]';
              var outcome = 'Not answered';
              if (selected) {
                var labelWrap = closest(selected, 'label');
                selectedLabel = labelWrap ? getReadableText(labelWrap, 'Option ' + (selected.value || '?')) : ('Option ' + (selected.value || '?'));
                var correct = parseInt(block.getAttribute('data-kc-correct') || '0', 10);
                var picked = parseInt(selected.value || '-1', 10);
                if (!isNaN(correct) && !isNaN(picked)) {
                  outcome = picked === correct ? 'Correct' : 'Incorrect';
                }
              }
              lines.push('Prompt: ' + prompt);
              lines.push('Selected Answer: ' + selectedLabel);
              lines.push('Result: ' + outcome);
              var shortAnswer = block.querySelector('[data-kc-short-answer]');
              if (shortAnswer) {
                var shortAnswerText = normalizeSpace(shortAnswer.value || '');
                lines.push('Reflection: ' + (shortAnswerText || '[No response]'));
              }
            }
          } else if (type === 'checklist_block') {
            var checklist = section.querySelector('[data-checklist-block]');
            if (!checklist) return;
            var checklistInputs = Array.prototype.slice.call(checklist.querySelectorAll('[data-checklist-input]'));
            var checkedCount = checklistInputs.filter(function(input) { return input.checked; }).length;
            var total = checklistInputs.length;
            lines.push('Progress: ' + checkedCount + ' / ' + total + ' complete');
            checklistInputs.forEach(function(input) {
              var row = closest(input, 'label');
              var textEl = row ? row.querySelector('span') : null;
              var itemText = getReadableText(textEl, 'Checklist item');
              lines.push((input.checked ? '[x] ' : '[ ] ') + itemText);
            });
          } else if (type === 'drag_sort_block') {
            var sortList = section.querySelector('[data-sort-list]');
            if (!sortList) return;
            var sortItems = Array.prototype.slice.call(sortList.querySelectorAll('[data-sort-item]'));
            if (!sortItems.length) return;
            lines.push('Current Order:');
            sortItems.forEach(function(item, idx) {
              var labelEl = item.querySelector('div span:last-child');
              var itemText = getReadableText(labelEl, getReadableText(item, 'Item ' + (idx + 1)));
              itemText = normalizeSpace(itemText.replace(/\\bUp\\b/g, '').replace(/\\bDown\\b/g, ''));
              lines.push(String(idx + 1) + '. ' + itemText);
            });
          } else if (type === 'reflection_journal') {
            var reflectionPrompt = getReadableText(section.querySelector('p'), 'Reflection Prompt');
            var reflectionInput = section.querySelector('textarea');
            var reflectionValue = normalizeSpace((reflectionInput && reflectionInput.value) || '');
            lines.push('Prompt: ' + reflectionPrompt);
            lines.push('Response: ' + (reflectionValue || '[No response]'));
          } else if (type === 'worksheet_form') {
            lines = collectFilledFieldLines(section, { includeCheckedCheckboxes: false, includeRadioSelections: false });
            if (!lines.length) lines.push('No worksheet fields filled yet.');
          } else if (type === 'portfolio_evidence') {
            var artifactInput = section.querySelector('input[type="text"]');
            var summaryInput = section.querySelector('textarea');
            var artifactValue = normalizeSpace((artifactInput && artifactInput.value) || '');
            var summaryValue = normalizeSpace((summaryInput && summaryInput.value) || '');
            lines.push('Artifact URL: ' + (artifactValue || '[Not provided]'));
            lines.push('Evidence Summary: ' + (summaryValue || '[Not provided]'));
            var checkedCriteria = Array.prototype.slice
              .call(section.querySelectorAll('input[type="checkbox"]'))
              .filter(function(field) { return field.checked; })
              .map(function(field) { return readFieldLabel(field, section, 'Criteria'); });
            lines.push('Self-Check Criteria Met: ' + (checkedCriteria.length ? checkedCriteria.join('; ') : '[None selected]'));
          } else if (type === 'roleplay_simulator') {
            var rolePrompt = getReadableText(section.querySelector('label'), 'Your response');
            var roleInput = section.querySelector('textarea');
            var roleValue = normalizeSpace((roleInput && roleInput.value) || '');
            lines.push('Prompt: ' + rolePrompt);
            lines.push('Response: ' + (roleValue || '[No response]'));
          } else if (type === 'decision_lab') {
            var decisionInputs = Array.prototype.slice.call(section.querySelectorAll('[data-decision-input]'));
            if (!decisionInputs.length) return;
            decisionInputs.forEach(function(input) {
              var card = closest(input, '.rounded-lg');
              var name = getReadableText(card ? card.querySelector('p') : null, 'Variable');
              var weight = normalizeSpace(input.getAttribute('data-decision-weight') || '1');
              var min = normalizeSpace(input.getAttribute('data-decision-min') || '');
              var max = normalizeSpace(input.getAttribute('data-decision-max') || '');
              var value = normalizeSpace(input.value || '');
              lines.push(name + ': ' + value + ' (range ' + min + '-' + max + ', weight ' + weight + ')');
            });
            var score = getReadableText(section.querySelector('[data-decision-score]'), '');
            if (score) lines.push('Projected Outcome Score: ' + score);
          } else if (type === 'rubric_creator') {
            var rubricBlock = section.querySelector('[data-rubric-block]');
            if (!rubricBlock) return;
            var rubricRows = Array.prototype.slice.call(rubricBlock.querySelectorAll('tr[data-rubric-row]'));
            var totalScore = 0;
            rubricRows.forEach(function(row, rowIdx) {
              var rowLabel = getReadableText(row.querySelector('[data-rubric-row-label]'), 'Criterion ' + (rowIdx + 1));
              var selectedChoice = row.querySelector('[data-rubric-choice]:checked');
              if (!selectedChoice) {
                lines.push(rowLabel + ': [No selection]');
                return;
              }
              var scoreValue = Number(selectedChoice.getAttribute('data-rubric-score') || selectedChoice.value);
              if (Number.isFinite(scoreValue)) totalScore += scoreValue;
              var colIdx = parseInt(selectedChoice.getAttribute('data-rubric-col') || '-1', 10);
              var descriptor = '';
              if (Number.isInteger(colIdx) && colIdx >= 0) {
                var cell = row.querySelector('[data-rubric-cell][data-rubric-col="' + colIdx + '"]');
                descriptor = getReadableText(cell ? cell.querySelector('p') : null, '');
              }
              lines.push(rowLabel + ': Score ' + formatNumericValue(scoreValue) + (descriptor ? ' - ' + descriptor : ''));
            });
            var maxText = getReadableText(rubricBlock.querySelector('[data-rubric-max]'), '');
            lines.push('Total: ' + formatNumericValue(totalScore) + (maxText ? ' / ' + maxText : ''));
          } else if (type === 'before_after') {
            var slider = section.querySelector('[data-before-after-slider]');
            var beforeLabel = getReadableText(section.querySelector('[data-before-panel] p'), 'Before');
            var afterLabel = getReadableText(section.querySelector('[data-after-panel] p'), 'After');
            var afterPercent = parseInt((slider && slider.value) || '50', 10);
            if (isNaN(afterPercent)) afterPercent = 50;
            afterPercent = Math.max(0, Math.min(100, afterPercent));
            var beforePercent = 100 - afterPercent;
            lines.push('Comparison Split: ' + beforeLabel + ' ' + beforePercent + ' / ' + afterLabel + ' ' + afterPercent);
          } else if (type === 'tabs_block') {
            var activeTabPanel = section.querySelector('[data-tabs-panel]:not(.hidden)');
            if (activeTabPanel) {
              var activeTabLabel = getReadableText(activeTabPanel.querySelector('h4'), 'Tab');
              lines.push('Active Tab: ' + activeTabLabel);
            }
          } else if (type === 'path_map') {
            var activePath = section.querySelector('[data-path-panel]:not(.hidden)');
            if (activePath) {
              lines.push('Selected Path: ' + getReadableText(activePath.querySelector('h4'), 'Path'));
            }
          } else if (type === 'hotspot_image') {
            var activeHotspot = section.querySelector('[data-hotspot-panel]:not(.hidden)');
            if (activeHotspot) {
              lines.push('Selected Hotspot: ' + getReadableText(activeHotspot.querySelector('p'), 'Hotspot'));
            }
          } else if (type === 'flashcard_deck') {
            var cards = Array.prototype.slice.call(section.querySelectorAll('[data-flashcard]'));
            if (cards.length) {
              var flipped = cards.filter(function(card) { return card.getAttribute('data-flashcard-side') === 'back'; }).length;
              lines.push('Cards Flipped: ' + flipped + ' / ' + cards.length);
            }
          } else if (type === 'scenario_branch' || type === 'accordion_block') {
            var openItems = Array.prototype.slice
              .call(section.querySelectorAll('details[open] summary'))
              .map(function(summary) { return getReadableText(summary, 'Open item'); })
              .filter(Boolean);
            if (openItems.length) {
              lines.push('Expanded Items: ' + openItems.join('; '));
            }
          } else {
            lines = collectFilledFieldLines(section, {});
          }

          pushReportSection(reportLines, title, lines);
        });

        if (!reportLines.length) {
          return 'No responses found to include in this report yet. Fill in one or more activity inputs and generate again.';
        }

        var header = [
          'Course Factory Submission Report',
          'Generated: ' + new Date().toLocaleString(),
          '',
        ];
        return header.concat(reportLines).join('\\n').trim();
      }

      function escapeForHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function decodeDataAttrJson(raw) {
        if (!raw) return null;
        try {
          return JSON.parse(decodeURIComponent(raw));
        } catch (e) {
          return null;
        }
      }

      var resourceReaderState = null;

      function getReaderRefs(card) {
        if (!card) return null;
        return {
          card: card,
          panel: card.querySelector('[data-resource-reader]'),
          title: card.querySelector('[data-resource-reader-title]'),
          toc: card.querySelector('[data-resource-reader-toc]'),
          body: card.querySelector('[data-resource-reader-body]'),
          progress: card.querySelector('[data-resource-reader-progress]'),
          prevBtn: card.querySelector('[data-resource-reader-prev]'),
          nextBtn: card.querySelector('[data-resource-reader-next]'),
        };
      }

      function renderReaderToc(state) {
        if (!state || !state.refs || !state.refs.toc) return;
        var tocHtml = state.chapters
          .map(function(chapter, idx) {
            var chapterTitle = escapeForHtml(chapter && chapter.title ? chapter.title : ('Chapter ' + (idx + 1)));
            var chapterNumber = escapeForHtml(chapter && chapter.number ? String(chapter.number) : String(idx + 1));
            var isActive = idx === state.index;
            var btnClass = isActive
              ? 'w-full text-left px-3 py-2 rounded text-xs font-bold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
              : 'w-full text-left px-3 py-2 rounded text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-transparent';
            return '<button type="button" class="' + btnClass + '" data-resource-reader-chapter="' + idx + '">' + chapterNumber + '. ' + chapterTitle + '</button>';
          })
          .join('');
        state.refs.toc.innerHTML = tocHtml;
      }

      function renderReaderChapter(state) {
        if (!state || !state.refs || !state.refs.body) return;
        if (!state.chapters.length) {
          state.refs.body.innerHTML = '<p class="text-sm text-slate-300">No chapters found.</p>';
          if (state.refs.progress) state.refs.progress.textContent = '';
          if (state.refs.prevBtn) state.refs.prevBtn.disabled = true;
          if (state.refs.nextBtn) state.refs.nextBtn.disabled = true;
          renderReaderToc(state);
          return;
        }

        if (state.index < 0) state.index = 0;
        if (state.index > state.chapters.length - 1) state.index = state.chapters.length - 1;

        var chapter = state.chapters[state.index] || {};
        var chapterTitle = escapeForHtml(chapter.title || ('Chapter ' + (state.index + 1)));
        var chapterNumber = escapeForHtml(chapter.number ? String(chapter.number) : String(state.index + 1));
        var sections = Array.isArray(chapter.sections) ? chapter.sections : [];
        var sectionsHtml = sections
          .map(function(section) {
            var heading = escapeForHtml(section && section.heading ? section.heading : '');
            var body = escapeForHtml(section && section.content ? section.content : '').replace(/\\n/g, '<br>');
            return '<section class="mt-5">' +
              (heading ? '<h5 class="text-sm font-bold text-emerald-300 mb-2">' + heading + '</h5>' : '') +
              '<div class="text-sm text-slate-200 leading-relaxed">' + body + '</div>' +
            '</section>';
          })
          .join('');

        var resourceTitle = escapeForHtml(state.content && state.content.title ? state.content.title : 'Digital Resource');
        state.refs.body.innerHTML =
          '<h3 class="text-xl font-bold text-white mb-1">' + resourceTitle + '</h3>' +
          '<p class="text-xs uppercase tracking-widest text-slate-400 mb-4">Chapter ' + (state.index + 1) + ' of ' + state.chapters.length + '</p>' +
          '<h4 class="text-lg font-bold text-white border-b border-slate-800 pb-2">' + chapterNumber + '. ' + chapterTitle + '</h4>' +
          sectionsHtml;

        if (state.refs.progress) {
          state.refs.progress.textContent = 'Chapter ' + (state.index + 1) + ' / ' + state.chapters.length;
        }
        if (state.refs.prevBtn) state.refs.prevBtn.disabled = state.index === 0;
        if (state.refs.nextBtn) state.refs.nextBtn.disabled = state.index === state.chapters.length - 1;
        renderReaderToc(state);
      }

      function openResourceReader(card, titleText, payload) {
        var refs = getReaderRefs(card);
        if (!refs || !refs.panel || !refs.body) return;
        var content = payload && typeof payload === 'object' ? payload : {};
        var chapters = Array.isArray(content.chapters) ? content.chapters : [];
        resourceReaderState = {
          refs: refs,
          content: content,
          chapters: chapters,
          index: 0,
        };
        refs.panel.classList.remove('hidden');
        if (refs.title) {
          refs.title.textContent = 'Digital Resource: ' + (titleText || content.title || 'Read');
        }
        renderReaderChapter(resourceReaderState);
      }

      function closeResourceReader(card) {
        var refs = getReaderRefs(card);
        if (!refs || !refs.panel) return;
        refs.panel.classList.add('hidden');
        if (refs.body) refs.body.innerHTML = '';
        if (refs.toc) refs.toc.innerHTML = '';
        resourceReaderState = null;
      }

      function safeStorageGet(key) {
        if (!key) return '';
        try {
          return window.localStorage ? window.localStorage.getItem(key) : '';
        } catch (err) {
          return '';
        }
      }

      function safeStorageSet(key, value) {
        if (!key) return;
        try {
          if (window.localStorage) window.localStorage.setItem(key, value);
        } catch (err) {
          // Ignore storage permission/availability errors.
        }
      }

      function getChecklistStorageKey(block) {
        if (!block) return '';
        var rawId = (block.getAttribute('data-checklist-id') || '').trim();
        if (!rawId) return '';
        return 'cf_checklist_v1_' + rawId.replace(/[^a-z0-9_-]/gi, '_');
      }

      function refreshChecklistBlock(block, shouldPersist) {
        if (!block) return;
        var inputs = Array.prototype.slice.call(block.querySelectorAll('[data-checklist-input]'));
        var checkedIndices = [];
        inputs.forEach(function(input, idx) {
          if (input.checked) checkedIndices.push(idx);
          var row = closest(input, 'label');
          if (!row) return;
          var text = row.querySelector('span');
          if (!text) return;
          text.classList.toggle('line-through', input.checked);
          text.classList.toggle('text-slate-500', input.checked);
        });
        var total = parseInt(block.getAttribute('data-checklist-total') || String(inputs.length), 10);
        if (!Number.isFinite(total) || total < 0) total = inputs.length;
        var progress = block.querySelector('[data-checklist-progress]');
        if (progress) progress.textContent = checkedIndices.length + ' / ' + total + ' done';
        if (shouldPersist) {
          safeStorageSet(
            getChecklistStorageKey(block),
            JSON.stringify({
              checked: checkedIndices,
              updatedAt: Date.now(),
            }),
          );
        }
      }

      function restoreChecklistBlock(block) {
        if (!block) return;
        var raw = safeStorageGet(getChecklistStorageKey(block));
        if (raw) {
          try {
            var parsed = JSON.parse(raw);
            var checked = parsed && Array.isArray(parsed.checked) ? parsed.checked : [];
            var checkSet = new Set(checked.map(function(idx) { return parseInt(idx, 10); }).filter(function(idx) { return Number.isInteger(idx) && idx >= 0; }));
            Array.prototype.slice.call(block.querySelectorAll('[data-checklist-input]')).forEach(function(input, idx) {
              input.checked = checkSet.has(idx);
            });
          } catch (err) {
            // Ignore malformed saved checklist JSON.
          }
        }
        refreshChecklistBlock(block, false);
      }

      function setActiveTab(block, nextIndex) {
        if (!block) return;
        var triggers = Array.prototype.slice.call(block.querySelectorAll('[data-tabs-trigger]'));
        var panels = Array.prototype.slice.call(block.querySelectorAll('[data-tabs-panel]'));
        if (!triggers.length || !panels.length) return;
        var hasMatch = triggers.some(function(trigger) {
          return parseInt(trigger.getAttribute('data-tab-index') || '-1', 10) === nextIndex;
        });
        var active = hasMatch ? nextIndex : parseInt(triggers[0].getAttribute('data-tab-index') || '0', 10);
        triggers.forEach(function(trigger) {
          var idx = parseInt(trigger.getAttribute('data-tab-index') || '-1', 10);
          var isActive = idx === active;
          trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
          trigger.classList.toggle('ring-1', isActive);
          trigger.classList.toggle('ring-indigo-400', isActive);
          trigger.classList.toggle('border-indigo-500', isActive);
          trigger.classList.toggle('text-white', isActive);
          trigger.classList.toggle('border-slate-700', !isActive);
          trigger.classList.toggle('text-slate-200', !isActive);
        });
        panels.forEach(function(panel) {
          var idx = parseInt(panel.getAttribute('data-tab-index') || '-1', 10);
          panel.classList.toggle('hidden', idx !== active);
        });
      }

      function setFlashcardFace(card, showBack) {
        if (!card) return;
        var front = card.querySelector('[data-flashcard-front]');
        var back = card.querySelector('[data-flashcard-back]');
        var toggleBtn = card.querySelector('[data-flashcard-toggle]');
        if (front) front.classList.toggle('hidden', showBack);
        if (back) back.classList.toggle('hidden', !showBack);
        card.setAttribute('data-flashcard-side', showBack ? 'back' : 'front');
        if (toggleBtn) toggleBtn.textContent = showBack ? 'Show Front' : 'Show Back';
      }

      function setPathMapIndex(block, nextIndex) {
        if (!block) return;
        var nodes = Array.prototype.slice.call(block.querySelectorAll('[data-path-node]'));
        var panels = Array.prototype.slice.call(block.querySelectorAll('[data-path-panel]'));
        if (!nodes.length || !panels.length) return;
        var hasMatch = nodes.some(function(node) {
          return parseInt(node.getAttribute('data-path-index') || '-1', 10) === nextIndex;
        });
        var active = hasMatch ? nextIndex : parseInt(nodes[0].getAttribute('data-path-index') || '0', 10);
        nodes.forEach(function(node) {
          var idx = parseInt(node.getAttribute('data-path-index') || '-1', 10);
          var isActive = idx === active;
          node.classList.toggle('ring-1', isActive);
          node.classList.toggle('ring-indigo-400', isActive);
          node.classList.toggle('border-indigo-500', isActive);
          node.classList.toggle('text-white', isActive);
          node.classList.toggle('border-slate-700', !isActive);
          node.classList.toggle('text-slate-200', !isActive);
        });
        panels.forEach(function(panel) {
          var idx = parseInt(panel.getAttribute('data-path-index') || '-1', 10);
          panel.classList.toggle('hidden', idx !== active);
        });
      }

      function setHotspotIndex(block, nextIndex) {
        if (!block) return;
        var buttons = Array.prototype.slice.call(block.querySelectorAll('[data-hotspot-btn]'));
        var panels = Array.prototype.slice.call(block.querySelectorAll('[data-hotspot-panel]'));
        if (!buttons.length || !panels.length) return;
        var hasMatch = buttons.some(function(btn) {
          return parseInt(btn.getAttribute('data-hotspot-index') || '-1', 10) === nextIndex;
        });
        var active = hasMatch ? nextIndex : parseInt(buttons[0].getAttribute('data-hotspot-index') || '0', 10);
        buttons.forEach(function(btn) {
          var idx = parseInt(btn.getAttribute('data-hotspot-index') || '-1', 10);
          var isActive = idx === active;
          btn.classList.toggle('border-sky-300', isActive);
          btn.classList.toggle('bg-sky-500', isActive);
          btn.classList.toggle('text-slate-950', isActive);
          btn.classList.toggle('border-slate-200/80', !isActive);
          btn.classList.toggle('bg-slate-900/85', !isActive);
          btn.classList.toggle('text-white', !isActive);
        });
        panels.forEach(function(panel) {
          var idx = parseInt(panel.getAttribute('data-hotspot-index') || '-1', 10);
          panel.classList.toggle('hidden', idx !== active);
        });
      }

      function refreshBeforeAfterBlock(block) {
        if (!block) return;
        var slider = block.querySelector('[data-before-after-slider]');
        if (!slider) return;
        var raw = parseInt(slider.value || '50', 10);
        var afterPct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 50;
        var beforePct = 100 - afterPct;
        var beforePanel = block.querySelector('[data-before-panel]');
        var afterPanel = block.querySelector('[data-after-panel]');
        if (beforePanel) beforePanel.style.opacity = String((Math.max(20, beforePct) / 100).toFixed(2));
        if (afterPanel) afterPanel.style.opacity = String((Math.max(20, afterPct) / 100).toFixed(2));
        var valueEl = block.querySelector('[data-before-after-value]');
        if (valueEl) valueEl.textContent = beforePct + ' / ' + afterPct;
      }

      function refreshDecisionBlock(block) {
        if (!block) return;
        var inputs = Array.prototype.slice.call(block.querySelectorAll('[data-decision-input]'));
        if (!inputs.length) return;
        var totalWeight = 0;
        var weightedSum = 0;
        inputs.forEach(function(input) {
          var min = Number(input.getAttribute('data-decision-min'));
          var max = Number(input.getAttribute('data-decision-max'));
          var weight = Number(input.getAttribute('data-decision-weight'));
          var safeMin = Number.isFinite(min) ? min : 0;
          var safeMax = Number.isFinite(max) && max >= safeMin ? max : safeMin + 10;
          var safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
          var value = Number(input.value);
          var clamped = Number.isFinite(value) ? Math.max(safeMin, Math.min(safeMax, value)) : safeMin;
          if (String(clamped) !== String(input.value)) input.value = String(clamped);
          var normalized = safeMax === safeMin ? 0 : (clamped - safeMin) / (safeMax - safeMin);
          weightedSum += normalized * safeWeight;
          totalWeight += safeWeight;
          var key = input.getAttribute('data-decision-key') || '';
          if (key) {
            var current = block.querySelector('[data-decision-current][data-decision-key="' + key + '"]');
            if (current) current.textContent = String(clamped);
          }
        });
        var score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
        var scoreEl = block.querySelector('[data-decision-score]');
        if (scoreEl) scoreEl.textContent = String(score);
      }

      function refreshRubricBlock(block) {
        if (!block) return;
        var choices = Array.prototype.slice.call(block.querySelectorAll('[data-rubric-choice]'));
        var total = 0;
        choices.forEach(function(choice) {
          var row = parseInt(choice.getAttribute('data-rubric-row') || '-1', 10);
          var col = parseInt(choice.getAttribute('data-rubric-col') || '-1', 10);
          var cell = null;
          if (Number.isInteger(row) && Number.isInteger(col) && row >= 0 && col >= 0) {
            cell = block.querySelector('[data-rubric-cell][data-rubric-row="' + row + '"][data-rubric-col="' + col + '"]');
          }
          if (cell) {
            cell.classList.toggle('ring-1', choice.checked);
            cell.classList.toggle('ring-emerald-400', choice.checked);
            cell.classList.toggle('bg-emerald-900/20', choice.checked);
          }
          if (choice.checked) {
            var score = Number(choice.getAttribute('data-rubric-score') || choice.value);
            if (Number.isFinite(score)) total += score;
          }
        });
        var totalEl = block.querySelector('[data-rubric-total]');
        if (totalEl) totalEl.textContent = formatNumericValue(total);
      }

      function getSortContext(target) {
        var item = closest(target, '[data-sort-item]');
        if (!item) return null;
        var list = closest(item, '[data-sort-list]');
        if (!list) return null;
        return { item: item, list: list };
      }

      function refreshSortRanks(list) {
        if (!list) return;
        Array.prototype.slice.call(list.querySelectorAll('[data-sort-item]')).forEach(function(item, idx) {
          var rank = item.querySelector('[data-sort-rank]');
          if (rank) rank.textContent = String(idx + 1) + '.';
        });
      }

      function moveSortItem(item, offset) {
        if (!item || !offset) return;
        var list = closest(item, '[data-sort-list]');
        if (!list) return;
        var allLists = Array.prototype.slice.call(document.querySelectorAll('[data-sort-list]'));
        var listIndex = allLists.indexOf(list);
        ensureSortItemIds(list, listIndex >= 0 ? listIndex : 0);
        var items = Array.prototype.slice.call(list.querySelectorAll('[data-sort-item]'));
        var fromIndex = items.indexOf(item);
        if (fromIndex < 0) return;
        var toIndex = Math.max(0, Math.min(items.length - 1, fromIndex + offset));
        if (toIndex === fromIndex) return;
        if (toIndex > fromIndex) {
          list.insertBefore(item, items[toIndex].nextSibling);
        } else {
          list.insertBefore(item, items[toIndex]);
        }
        refreshSortRanks(list);
      }

      function initializeComposerRuntime() {
        Array.prototype.slice.call(document.querySelectorAll('[data-checklist-block]')).forEach(function(block) {
          restoreChecklistBlock(block);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-tabs-block]')).forEach(function(block) {
          var first = block.querySelector('[data-tabs-trigger]');
          var start = first ? parseInt(first.getAttribute('data-tab-index') || '0', 10) : 0;
          setActiveTab(block, start);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-flashcard]')).forEach(function(card) {
          setFlashcardFace(card, false);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-path-map-block]')).forEach(function(block) {
          var first = block.querySelector('[data-path-node]');
          var start = first ? parseInt(first.getAttribute('data-path-index') || '0', 10) : 0;
          setPathMapIndex(block, start);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-hotspot-block]')).forEach(function(block) {
          var first = block.querySelector('[data-hotspot-btn]');
          var start = first ? parseInt(first.getAttribute('data-hotspot-index') || '0', 10) : 0;
          setHotspotIndex(block, start);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-before-after-block]')).forEach(function(block) {
          refreshBeforeAfterBlock(block);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-decision-block]')).forEach(function(block) {
          refreshDecisionBlock(block);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-rubric-block]')).forEach(function(block) {
          refreshRubricBlock(block);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-sort-list]')).forEach(function(list, listIndex) {
          ensureSortItemIds(list, listIndex);
          refreshSortRanks(list);
        });
      }

      var activeSortDragItem = null;
      var activeSortDropTarget = null;

      document.addEventListener('click', function(event) {
        var checkBtn = closest(event.target, '[data-kc-check]');
        if (checkBtn) {
          var questionScope = closest(checkBtn, '[data-kc-question]');
          var block = closest(checkBtn, '[data-kc-block]');
          var scope = questionScope || block;
          if (!scope) return;
          var correct = parseInt(scope.getAttribute('data-kc-correct') || '0', 10);
          var chosen = scope.querySelector('input[type="radio"]:checked');
          var resultEl = scope.querySelector('[data-kc-result]');
          if (!chosen) {
            if (resultEl) resultEl.textContent = 'Select an option first.';
            return;
          }
          var selected = parseInt(chosen.value, 10);
          var isCorrect = selected === correct;
          if (resultEl) {
            resultEl.textContent = isCorrect ? 'Correct.' : 'Try again.';
            resultEl.className = isCorrect ? 'text-xs text-emerald-300' : 'text-xs text-rose-300';
          }
          return;
        }

        var tabTrigger = closest(event.target, '[data-tabs-trigger]');
        if (tabTrigger) {
          var tabBlock = closest(tabTrigger, '[data-tabs-block]');
          if (!tabBlock) return;
          var tabIndex = parseInt(tabTrigger.getAttribute('data-tab-index') || '0', 10);
          setActiveTab(tabBlock, Number.isFinite(tabIndex) ? tabIndex : 0);
          return;
        }

        var flashcardToggle = closest(event.target, '[data-flashcard-toggle]');
        if (flashcardToggle) {
          var flashcard = closest(flashcardToggle, '[data-flashcard]');
          if (!flashcard) return;
          var showBack = flashcard.getAttribute('data-flashcard-side') !== 'back';
          setFlashcardFace(flashcard, showBack);
          return;
        }

        var pathNode = closest(event.target, '[data-path-node]');
        if (pathNode) {
          var pathBlock = closest(pathNode, '[data-path-map-block]');
          if (!pathBlock) return;
          var pathIndex = parseInt(pathNode.getAttribute('data-path-index') || '0', 10);
          setPathMapIndex(pathBlock, Number.isFinite(pathIndex) ? pathIndex : 0);
          return;
        }

        var hotspotBtn = closest(event.target, '[data-hotspot-btn]');
        if (hotspotBtn) {
          var hotspotBlock = closest(hotspotBtn, '[data-hotspot-block]');
          if (!hotspotBlock) return;
          var hotspotIndex = parseInt(hotspotBtn.getAttribute('data-hotspot-index') || '0', 10);
          setHotspotIndex(hotspotBlock, Number.isFinite(hotspotIndex) ? hotspotIndex : 0);
          return;
        }

        var sortMoveBtn = closest(event.target, '[data-sort-move]');
        if (sortMoveBtn) {
          var sortContext = getSortContext(sortMoveBtn);
          if (!sortContext) return;
          var delta = parseInt(sortMoveBtn.getAttribute('data-sort-move') || '0', 10);
          if (!Number.isFinite(delta)) return;
          moveSortItem(sortContext.item, delta);
          return;
        }

        var rubricClearBtn = closest(event.target, '[data-rubric-clear]');
        if (rubricClearBtn) {
          var rubricBlock = closest(rubricClearBtn, '[data-rubric-block]');
          if (!rubricBlock) return;
          Array.prototype.slice.call(rubricBlock.querySelectorAll('[data-rubric-choice]')).forEach(function(choice) {
            choice.checked = false;
          });
          refreshRubricBlock(rubricBlock);
          return;
        }

        var viewResourceBtn = closest(event.target, '[data-resource-view]');
        if (viewResourceBtn) {
          var resourceCard = closest(viewResourceBtn, 'article');
          if (!resourceCard) return;
          var viewer = resourceCard.querySelector('[data-resource-viewer]');
          var frame = resourceCard.querySelector('[data-resource-viewer-frame]');
          var title = resourceCard.querySelector('[data-resource-viewer-title]');
          var rawUrl = viewResourceBtn.getAttribute('data-resource-url') || '';
          if (!viewer || !frame || !rawUrl) return;
          frame.src = resolveViewerUrl(rawUrl);
          if (title) title.textContent = 'Viewing: ' + (viewResourceBtn.getAttribute('data-resource-title') || 'Resource');
          viewer.classList.remove('hidden');
          return;
        }

        var closeResourceBtn = closest(event.target, '[data-resource-viewer-close]');
        if (closeResourceBtn) {
          var closeCard = closest(closeResourceBtn, 'article');
          if (!closeCard) return;
          var closeViewer = closeCard.querySelector('[data-resource-viewer]');
          var closeFrame = closeCard.querySelector('[data-resource-viewer-frame]');
          if (closeFrame) closeFrame.src = '';
          if (closeViewer) closeViewer.classList.add('hidden');
          return;
        }

        var readResourceBtn = closest(event.target, '[data-resource-read]');
        if (readResourceBtn) {
          var readCard = closest(readResourceBtn, 'article');
          if (!readCard) return;
          var payload = decodeDataAttrJson(readResourceBtn.getAttribute('data-resource-read-content') || '');
          openResourceReader(readCard, readResourceBtn.getAttribute('data-resource-read-title') || 'Read', payload);
          return;
        }

        var closeReaderBtn = closest(event.target, '[data-resource-reader-close]');
        if (closeReaderBtn) {
          var closeReadCard = closest(closeReaderBtn, 'article');
          if (!closeReadCard) return;
          closeResourceReader(closeReadCard);
          return;
        }

        var tocChapterBtn = closest(event.target, '[data-resource-reader-chapter]');
        if (tocChapterBtn && resourceReaderState) {
          var idx = parseInt(tocChapterBtn.getAttribute('data-resource-reader-chapter') || '0', 10);
          if (!isNaN(idx)) {
            resourceReaderState.index = idx;
            renderReaderChapter(resourceReaderState);
          }
          return;
        }

        var prevReaderBtn = closest(event.target, '[data-resource-reader-prev]');
        if (prevReaderBtn && resourceReaderState) {
          resourceReaderState.index = Math.max(0, resourceReaderState.index - 1);
          renderReaderChapter(resourceReaderState);
          return;
        }

        var nextReaderBtn = closest(event.target, '[data-resource-reader-next]');
        if (nextReaderBtn && resourceReaderState) {
          resourceReaderState.index = Math.min(resourceReaderState.chapters.length - 1, resourceReaderState.index + 1);
          renderReaderChapter(resourceReaderState);
          return;
        }

        var downloadResourceBtn = closest(event.target, '[data-resource-download]');
        if (downloadResourceBtn) {
          var rawDownloadUrl = downloadResourceBtn.getAttribute('data-resource-download-url') || '';
          var downloadUrl = resolveAssetUrl(rawDownloadUrl);
          if (!downloadUrl) return;
          var downloadName = (downloadResourceBtn.getAttribute('data-resource-download-name') || 'resource').replace(/[^a-z0-9._ -]/gi, '');
          var link = document.createElement('a');
          link.href = downloadUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.setAttribute('download', downloadName || 'resource');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }

        var saveLoadDownloadBtn = closest(event.target, '[data-save-load-download]');
        if (saveLoadDownloadBtn) {
          var saveCtx = getSaveLoadContext(saveLoadDownloadBtn);
          if (!saveCtx || !saveCtx.root) return;
          try {
            var snapshot = collectModuleProgressSnapshot(saveCtx.root);
            downloadModuleProgressSnapshot(saveCtx, snapshot);
            setSaveLoadStatus(saveCtx, 'Backup downloaded (' + new Date().toLocaleTimeString() + ').', 'success');
          } catch (err) {
            setSaveLoadStatus(saveCtx, 'Could not create backup JSON.', 'error');
          }
          return;
        }

        var saveLoadUploadTriggerBtn = closest(event.target, '[data-save-load-upload-trigger]');
        if (saveLoadUploadTriggerBtn) {
          var uploadCtx = getSaveLoadContext(saveLoadUploadTriggerBtn);
          if (!uploadCtx || !uploadCtx.input) return;
          uploadCtx.input.value = '';
          uploadCtx.input.click();
          setSaveLoadStatus(uploadCtx, 'Select a JSON backup file to restore.', 'info');
          return;
        }

        var generateBtn = closest(event.target, '[data-submission-generate]');
        if (generateBtn) {
          var submissionContext = getSubmissionContext(generateBtn);
          if (!submissionContext || !submissionContext.output) return;
          var root = closest(generateBtn, '[data-composer-root]') || document;
          var reportText = buildSubmissionReport(root);
          submissionContext.output.textContent = reportText;
          return;
        }

        var copyBtn = closest(event.target, '[data-submission-copy]');
        if (copyBtn) {
          var copyContext = getSubmissionContext(copyBtn);
          var out = copyContext ? copyContext.output : null;
          if (!out) return;
          var text = out.textContent || '';
          if (!text.trim()) return;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function() {});
          } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
          }
          return;
        }

        var downloadBtn = closest(event.target, '[data-submission-download]');
        if (downloadBtn) {
          var downloadContext = getSubmissionContext(downloadBtn);
          var downloadOut = downloadContext ? downloadContext.output : null;
          if (!downloadOut) return;
          var downloadText = downloadOut.textContent || '';
          if (!downloadText.trim()) return;
          var blob = new Blob([downloadText], { type: 'text/plain;charset=utf-8' });
          var link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'module-report.txt';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(function() {
            URL.revokeObjectURL(link.href);
          }, 500);
          return;
        }

        var printBtn = closest(event.target, '[data-submission-print]');
        if (printBtn) {
          var printContext = getSubmissionContext(printBtn);
          var printOut = printContext ? printContext.output : null;
          if (!printOut) return;
          var printText = printOut.textContent || '';
          if (!printText.trim()) return;
          var win = window.open('', '_blank');
          if (!win) return;
          win.document.write('<!DOCTYPE html><html><head><title>Module Report</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.4;}pre{white-space:pre-wrap;}</style></head><body><h1>Module Report</h1><pre>' + escapeForHtml(printText) + '</pre></body></html>');
          win.document.close();
          win.focus();
          win.print();
        }
      });

      document.addEventListener('change', function(event) {
        var checklistInput = closest(event.target, '[data-checklist-input]');
        if (checklistInput) {
          var checklistBlock = closest(checklistInput, '[data-checklist-block]');
          if (!checklistBlock) return;
          refreshChecklistBlock(checklistBlock, true);
          return;
        }

        var rubricChoiceInput = closest(event.target, '[data-rubric-choice]');
        if (rubricChoiceInput) {
          var rubricChoiceBlock = closest(rubricChoiceInput, '[data-rubric-block]');
          if (!rubricChoiceBlock) return;
          refreshRubricBlock(rubricChoiceBlock);
          return;
        }

        var uploadInput = closest(event.target, '[data-save-load-upload-input]');
        if (uploadInput) {
          var uploadCtx = getSaveLoadContext(uploadInput);
          if (!uploadCtx || !uploadCtx.root) return;
          var file = uploadInput.files && uploadInput.files[0];
          if (!file) {
            setSaveLoadStatus(uploadCtx, 'Upload canceled.', 'info');
            return;
          }
          file
            .text()
            .then(function(text) {
              var parsed = null;
              try {
                parsed = JSON.parse(text);
              } catch {
                setSaveLoadStatus(uploadCtx, 'Invalid JSON file. Could not parse backup.', 'error');
                return;
              }
              var payload = parsed;
              if (parsed && typeof parsed === 'object' && parsed.kind && parsed.kind !== 'course-factory-module-progress') {
                setSaveLoadStatus(uploadCtx, 'Unsupported backup type for this module.', 'error');
                return;
              }
              if (parsed && typeof parsed === 'object' && parsed.payload && typeof parsed.payload === 'object') {
                payload = parsed.payload;
              }
              var result = applyModuleProgressSnapshot(uploadCtx.root, payload);
              setSaveLoadStatus(uploadCtx, result.message, result.ok ? 'success' : 'error');
            })
            .catch(function() {
              setSaveLoadStatus(uploadCtx, 'Failed to read selected backup file.', 'error');
            });
        }
      });

      document.addEventListener('input', function(event) {
        var beforeAfterSlider = closest(event.target, '[data-before-after-slider]');
        if (beforeAfterSlider) {
          var beforeAfterBlock = closest(beforeAfterSlider, '[data-before-after-block]');
          if (!beforeAfterBlock) return;
          refreshBeforeAfterBlock(beforeAfterBlock);
          return;
        }

        var decisionInput = closest(event.target, '[data-decision-input]');
        if (decisionInput) {
          var decisionBlock = closest(decisionInput, '[data-decision-block]');
          if (!decisionBlock) return;
          refreshDecisionBlock(decisionBlock);
        }
      });

      document.addEventListener('dragstart', function(event) {
        var sortItem = closest(event.target, '[data-sort-item]');
        if (!sortItem) return;
        activeSortDragItem = sortItem;
        sortItem.classList.add('opacity-70');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', 'sort-item');
        }
      });

      document.addEventListener('dragover', function(event) {
        if (!activeSortDragItem) return;
        var overItem = closest(event.target, '[data-sort-item]');
        var overList = overItem ? closest(overItem, '[data-sort-list]') : closest(event.target, '[data-sort-list]');
        if (!overList) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        if (activeSortDropTarget && activeSortDropTarget !== overItem) {
          activeSortDropTarget.classList.remove('ring-1', 'ring-indigo-400');
        }
        if (overItem && overItem !== activeSortDragItem) {
          overItem.classList.add('ring-1', 'ring-indigo-400');
          activeSortDropTarget = overItem;
        } else {
          activeSortDropTarget = null;
        }
      });

      document.addEventListener('drop', function(event) {
        if (!activeSortDragItem) return;
        var targetItem = closest(event.target, '[data-sort-item]');
        var targetList = targetItem ? closest(targetItem, '[data-sort-list]') : closest(event.target, '[data-sort-list]');
        if (!targetList) return;
        event.preventDefault();
        if (activeSortDropTarget) {
          activeSortDropTarget.classList.remove('ring-1', 'ring-indigo-400');
          activeSortDropTarget = null;
        }
        if (!targetItem || targetItem === activeSortDragItem) {
          targetList.appendChild(activeSortDragItem);
          refreshSortRanks(targetList);
          return;
        }
        var rect = targetItem.getBoundingClientRect();
        var insertAfter = event.clientY > rect.top + rect.height / 2;
        if (insertAfter) {
          targetList.insertBefore(activeSortDragItem, targetItem.nextSibling);
        } else {
          targetList.insertBefore(activeSortDragItem, targetItem);
        }
        refreshSortRanks(targetList);
      });

      document.addEventListener('dragend', function() {
        if (activeSortDropTarget) {
          activeSortDropTarget.classList.remove('ring-1', 'ring-indigo-400');
          activeSortDropTarget = null;
        }
        if (activeSortDragItem) {
          activeSortDragItem.classList.remove('opacity-70');
          var owningList = closest(activeSortDragItem, '[data-sort-list]');
          if (owningList) refreshSortRanks(owningList);
          activeSortDragItem = null;
        }
      });

      initializeComposerRuntime();
    })();
  `;
}

const TEMPLATE_OPTIONS = ['deck', 'finlit', 'coursebook', 'toolkit_dashboard'];
const THEME_OPTIONS = ['dark_cards', 'finlit_clean', 'coursebook_light', 'toolkit_clean'];

function resolveTemplateValue(value, fallback = 'deck') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return fallback;
  return TEMPLATE_OPTIONS.includes(raw) ? raw : fallback;
}

function resolveThemeValue(value, fallback = 'dark_cards') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return fallback;
  return THEME_OPTIONS.includes(raw) ? raw : fallback;
}

function normalizeActivityStyleMeta(style = {}) {
  const next = style && typeof style === 'object' ? style : {};
  const variantRaw = String(next.variant || '').trim().toLowerCase();
  const paddingRaw = String(next.padding || '').trim().toLowerCase();
  const titleRaw = String(next.titleVariant || '').trim().toLowerCase();
  return {
    border: next.border !== false,
    variant: variantRaw === 'flat' ? 'flat' : 'card',
    padding: paddingRaw === 'sm' || paddingRaw === 'lg' ? paddingRaw : 'md',
    titleVariant: ['xs', 'sm', 'md', 'lg', 'xl'].includes(titleRaw) ? titleRaw : 'md',
  };
}

function normalizeActivityBehaviorMeta(behavior = {}) {
  const next = behavior && typeof behavior === 'object' ? behavior : {};
  const collapsible = next.collapsible === true;
  return {
    collapsible,
    collapsedByDefault: collapsible ? next.collapsedByDefault === true : false,
  };
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value, fallback = 'item') {
  const raw = String(value || '').trim().toLowerCase();
  const slug = raw.replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function parseHeadingEntries(html = '', fallbackAnchor = '') {
  const entries = [];
  const pattern = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match = pattern.exec(html);
  while (match) {
    const text = stripHtml(match[2]);
    if (text) {
      entries.push({
        level: Number.parseInt(match[1], 10) || 3,
        text,
        anchor: fallbackAnchor,
      });
    }
    match = pattern.exec(html);
  }
  return entries;
}

function buildTemplateRuntimeScript() {
  return `
    (function() {
      if (window.__CF_TEMPLATE_RUNTIME_BOUND__) return;
      window.__CF_TEMPLATE_RUNTIME_BOUND__ = true;

      function closest(el, selector) {
        while (el) {
          if (el.matches && el.matches(selector)) return el;
          el = el.parentElement;
        }
        return null;
      }

      document.addEventListener('click', function(event) {
        var finlitTab = closest(event.target, '[data-finlit-tab-trigger]');
        if (finlitTab) {
          event.preventDefault();
          var root = closest(finlitTab, '[data-finlit-root]') || document;
          var nextId = finlitTab.getAttribute('data-finlit-tab-trigger');
          Array.prototype.slice.call(root.querySelectorAll('[data-finlit-tab-trigger]')).forEach(function(trigger) {
            var active = trigger.getAttribute('data-finlit-tab-trigger') === nextId;
            trigger.setAttribute('aria-selected', active ? 'true' : 'false');
            trigger.classList.toggle('cf-finlit-tab-active', active);
          });
          Array.prototype.slice.call(root.querySelectorAll('[data-finlit-tab-panel]')).forEach(function(panel) {
            panel.classList.toggle('hidden', panel.getAttribute('data-finlit-tab-panel') !== nextId);
          });
          return;
        }

        var expandToggle = closest(event.target, '[data-expand-toggle]');
        if (expandToggle) {
          event.preventDefault();
          var panelId = expandToggle.getAttribute('data-expand-toggle');
          var root = closest(expandToggle, '[data-composer-root]') || document;
          var panel = root.querySelector('[data-expand-panel="' + panelId + '"]');
          if (panel) panel.classList.toggle('hidden');
          return;
        }

        var openModal = closest(event.target, '[data-toolkit-open-modal]');
        if (openModal) {
          event.preventDefault();
          var modalRoot = closest(openModal, '[data-toolkit-dashboard]') || document;
          var modalId = openModal.getAttribute('data-toolkit-open-modal');
          var modal = modalRoot.querySelector('[data-toolkit-modal-id="' + modalId + '"]');
          if (modal) modal.classList.remove('hidden');
          return;
        }

        var closeModal = closest(event.target, '[data-toolkit-close-modal]') || closest(event.target, '[data-toolkit-modal-backdrop]');
        if (closeModal) {
          event.preventDefault();
          var modal = closest(closeModal, '[data-toolkit-modal-id]');
          if (modal) modal.classList.add('hidden');
        }
      });

      function applyToolkitFilters(root) {
        var queryInput = root.querySelector('[data-toolkit-query]');
        var query = String(queryInput && queryInput.value || '').toLowerCase().trim();
        var activeBtn = root.querySelector('[data-toolkit-category-filter].bg-slate-700');
        var category = activeBtn ? String(activeBtn.getAttribute('data-toolkit-category-filter') || 'all').toLowerCase() : 'all';
        Array.prototype.slice.call(root.querySelectorAll('[data-toolkit-card]')).forEach(function(card) {
          var cardCategory = String(card.getAttribute('data-toolkit-category') || '').toLowerCase();
          var search = String(card.getAttribute('data-toolkit-search') || '').toLowerCase();
          var passCategory = category === 'all' || cardCategory === category;
          var passQuery = !query || search.indexOf(query) !== -1;
          card.classList.toggle('hidden', !(passCategory && passQuery));
        });
      }

      document.addEventListener('click', function(event) {
        var filterBtn = closest(event.target, '[data-toolkit-category-filter]');
        if (!filterBtn) return;
        event.preventDefault();
        var root = closest(filterBtn, '[data-toolkit-dashboard]') || document;
        Array.prototype.slice.call(root.querySelectorAll('[data-toolkit-category-filter]')).forEach(function(btn) {
          btn.classList.remove('bg-slate-700', 'text-white');
          btn.classList.add('text-slate-300');
        });
        filterBtn.classList.add('bg-slate-700', 'text-white');
        filterBtn.classList.remove('text-slate-300');
        applyToolkitFilters(root);
      });

      document.addEventListener('input', function(event) {
        var queryInput = closest(event.target, '[data-toolkit-query]');
        if (!queryInput) return;
        var root = closest(queryInput, '[data-toolkit-dashboard]') || document;
        applyToolkitFilters(root);
      });

      Array.prototype.slice.call(document.querySelectorAll('[data-finlit-root]')).forEach(function(root) {
        var trigger = root.querySelector('[data-finlit-tab-trigger][aria-selected="true"]');
        if (!trigger) {
          trigger = root.querySelector('[data-finlit-tab-trigger].cf-finlit-tab-active');
        }
        if (!trigger) {
          var visiblePanel = root.querySelector('[data-finlit-tab-panel]:not(.hidden)');
          if (visiblePanel) {
            var panelId = visiblePanel.getAttribute('data-finlit-tab-panel');
            if (panelId) {
              trigger = root.querySelector('[data-finlit-tab-trigger="' + panelId + '"]');
            }
          }
        }
        if (!trigger) {
          trigger = root.querySelector('[data-finlit-tab-trigger]');
        }
        if (trigger) trigger.click();
      });
    })();
  `;
}

export function compileComposerModule(module, { courseSettings = {} } = {}) {
  const { composerLayout, activities } = normalizeComposerModuleConfig(module);
  const activityMap = new Map();
  activities.forEach((activity) => {
    const key = String(activity?.id || '').trim();
    if (key) activityMap.set(key, activity);
  });

  const template = resolveTemplateValue(module?.template, resolveTemplateValue(courseSettings?.templateDefault, 'deck'));
  const theme = resolveThemeValue(module?.theme, resolveThemeValue(courseSettings?.themeDefault, 'dark_cards'));
  const themeClass = `cf-theme-${theme}`;

  const renderInlineActivities = (list, prefix = 'inline') =>
    normalizeComposerActivities(
      (Array.isArray(list) ? list : []).map((item, idx) => ({
        id: item?.id || `${prefix}-${idx + 1}-${Math.random().toString(36).slice(2, 8)}`,
        type: item?.type || 'content_block',
        data: item?.data || {},
        layout: item?.layout || { colSpan: 1 },
        style: item?.style || {},
        behavior: item?.behavior || {},
      })),
      { maxColumns: composerLayout.maxColumns, mode: composerLayout.mode },
    );

  const renderActivity = (activity, idx, { withLayout = true, trail = [] } = {}) => {
    const activityId = String(activity?.id || `activity-${idx + 1}`);
    if (trail.includes(activityId)) {
      return `<section class="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4"><p class="text-rose-300 text-sm">Cycle detected for activity "${escapeHtml(activityId)}".</p></section>`;
    }
    const data = activity?.data || {};
    let compiled = '';
    if (activity?.type === 'tab_group') {
      const tabs = Array.isArray(data.tabs) ? data.tabs : [];
      compiled = `
        <article class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 cf-template-surface">
          ${String(data.title || '').trim() ? `<h3 class="text-lg font-bold text-white mb-3">${escapeHtml(String(data.title || ''))}</h3>` : ''}
          <div class="space-y-2">
            ${
              tabs.length
                ? tabs
                    .map((tab, tabIdx) => {
                      const refs = (Array.isArray(tab?.activityIds) ? tab.activityIds : []).map((id) => activityMap.get(String(id || '').trim())).filter(Boolean);
                      const inline = renderInlineActivities(tab?.activities, `${activityId}-tab-${tabIdx + 1}`);
                      const content = [...refs, ...inline];
                      return `
                        <details class="rounded-lg border border-slate-700 bg-slate-950/60 p-3" ${tabIdx === 0 ? 'open' : ''}>
                          <summary class="cursor-pointer text-sm font-bold text-slate-200">${escapeHtml(String(tab?.label || tab?.id || `Tab ${tabIdx + 1}`))}</summary>
                          <div class="mt-3 space-y-3">
                            ${content.length ? content.map((item, nestedIdx) => renderActivity(item, nestedIdx, { withLayout: false, trail: [...trail, activityId] })).join('\n') : '<p class="text-sm text-slate-400">No linked activities.</p>'}
                          </div>
                        </details>
                      `;
                    })
                    .join('\n')
                : '<p class="text-sm text-slate-400">No tabs configured.</p>'
            }
          </div>
        </article>
      `;
    } else if (activity?.type === 'card_list') {
      const cards = Array.isArray(data.cards) ? data.cards : [];
      const cardRows = cards
        .map((card, cardIdx) => {
          const openModeRaw = String(card?.openMode || 'expand').trim().toLowerCase();
          const openMode =
            openModeRaw === 'modal' || openModeRaw === 'navigate_section' || openModeRaw === 'navigate_page' ? openModeRaw : 'expand';
          const target = activityMap.get(String(card?.targetActivityId || '').trim());
          const inlineList = renderInlineActivities(
            [
              ...(card?.activity && typeof card.activity === 'object' ? [card.activity] : []),
              ...(Array.isArray(card?.activities) ? card.activities : []),
            ],
            `${activityId}-card-${cardIdx + 1}`,
          );
          const linkedItems = target ? [target, ...inlineList] : inlineList;
          const panelId = `${slugify(activityId, 'card-list')}-panel-${cardIdx + 1}`;
          const content = linkedItems.length
            ? linkedItems.map((item, nestedIdx) => renderActivity(item, nestedIdx, { withLayout: false, trail: [...trail, activityId] })).join('\n')
            : '<p class="text-sm text-slate-400">No linked activity.</p>';
          return `
            <article class="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <h4 class="text-sm font-bold text-white">${escapeHtml(String(card?.title || `Card ${cardIdx + 1}`))}</h4>
              ${String(card?.subtitle || '').trim() ? `<p class="mt-1 text-xs text-slate-400">${escapeHtml(String(card.subtitle || ''))}</p>` : ''}
              <div class="mt-2">
                ${
                  openMode === 'expand'
                    ? `<button type="button" data-expand-toggle="${panelId}" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wide">Open</button>
                       <div data-expand-panel="${panelId}" class="hidden mt-3">${content}</div>`
                    : openMode === 'modal'
                      ? `<button type="button" data-toolkit-open-modal="${panelId}" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wide">Open Modal</button>
                         <div class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" data-toolkit-modal-id="${panelId}" data-toolkit-modal-backdrop>
                           <div class="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-950 p-4 max-h-[85vh] custom-scroll">
                             <div class="flex items-center justify-between mb-3">
                               <h4 class="text-sm font-bold text-white">${escapeHtml(String(card?.title || `Card ${cardIdx + 1}`))}</h4>
                               <button type="button" data-toolkit-close-modal class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white">Close</button>
                             </div>
                             ${content}
                           </div>
                         </div>`
                      : `<a href="#${panelId}" class="inline-block px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wide">${openMode === 'navigate_page' ? 'Open Page' : 'Go to Section'}</a>
                         <section id="${panelId}" class="mt-3">${content}</section>`
                }
              </div>
            </article>
          `;
        })
        .join('\n');
      compiled = `
        <article class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 cf-template-surface" data-toolkit-dashboard>
          ${String(data.title || '').trim() ? `<h3 class="text-lg font-bold text-white mb-3">${escapeHtml(String(data.title || ''))}</h3>` : ''}
          <div class="grid gap-3 md:grid-cols-2">${cardRows || '<p class="text-sm text-slate-400">No cards configured.</p>'}</div>
        </article>
      `;
    } else {
      const def = getActivityDefinition(activity.type);
      compiled = def
        ? def.compileToHtml({
            data: activity.data,
            index: idx,
            activityId: activity.id,
          })
        : `<article class="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5"><p class="text-rose-300 text-sm font-semibold">Unknown activity type: ${escapeHtml(activity.type)}</p></article>`;
    }

    const colSpan = activity?.layout?.colSpan || 1;
    const row = Number.isInteger(activity?.layout?.row) ? activity.layout.row : null;
    const col = Number.isInteger(activity?.layout?.col) ? activity.layout.col : null;
    const x = Number.isInteger(activity?.layout?.x) ? activity.layout.x : Math.max(0, (col || 1) - 1);
    const y = Number.isInteger(activity?.layout?.y) ? activity.layout.y : Math.max(0, (row || 1) - 1);
    const w = Number.isInteger(activity?.layout?.w) ? activity.layout.w : colSpan;
    const h = Number.isInteger(activity?.layout?.h) ? activity.layout.h : 4;
    const sectionGridStyle =
      withLayout === false
        ? ''
        : composerLayout.mode === 'canvas'
          ? `grid-column: ${x + 1} / span ${w}; grid-row: ${y + 1} / span ${h};`
          : col
            ? `grid-column: ${col} / span ${colSpan};${row ? ` grid-row: ${row};` : ''}`
            : `grid-column: span ${colSpan} / span ${colSpan};${row ? ` grid-row: ${row};` : ''}`;

    const blockStyle = resolveComposerBlockStyle(activity?.data || {});
    const styleMeta = normalizeActivityStyleMeta(activity?.style || {});
    const behaviorMeta = normalizeActivityBehaviorMeta(activity?.behavior || {});
    const sectionStyleParts = [sectionGridStyle];
    const sectionClasses = ['cf-composer-activity', `cf-pad-${styleMeta.padding}`, `cf-title-${styleMeta.titleVariant}`];
    if (withLayout !== false && composerLayout.mode === 'canvas') sectionClasses.push('cf-canvas-item');
    if (!styleMeta.border) sectionClasses.push('cf-no-border');
    if (styleMeta.variant === 'flat') sectionClasses.push('cf-variant-flat');
    if (blockStyle.fontFamily) {
      sectionClasses.push('cf-block-font-override');
      sectionStyleParts.push(`--cf-block-font:${blockStyle.fontFamily};`);
    }
    if (blockStyle.textColor) {
      sectionClasses.push('cf-block-text-override');
      sectionStyleParts.push(`--cf-block-text:${blockStyle.textColor};`);
    }
    if (blockStyle.containerBg) {
      sectionClasses.push('cf-block-bg-override');
      sectionStyleParts.push(`--cf-block-bg:${blockStyle.containerBg};`);
    }
    if (blockStyle.borderColor) {
      sectionClasses.push('cf-block-border-override');
      sectionStyleParts.push(`--cf-block-border:${blockStyle.borderColor};`);
    }
    if (blockStyle.accentColor) {
      sectionClasses.push('cf-block-accent-override');
      sectionStyleParts.push(`--cf-block-accent:${blockStyle.accentColor};`);
    }
    const sectionStyle = sectionStyleParts.filter(Boolean).join(' ');
    const headingLabel = stripHtml(activity?.data?.title || activity?.data?.text || getActivityDefinition(activity?.type)?.label || `Activity ${idx + 1}`);
    const activityHtml = behaviorMeta.collapsible
      ? `<details class="rounded-xl border border-slate-700/60 bg-slate-950/20" ${behaviorMeta.collapsedByDefault ? '' : 'open'}><summary class="cursor-pointer select-none px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">${escapeHtml(headingLabel)}</summary><div class="p-1">${compiled}</div></details>`
      : compiled;

    return `
      <section
        id="cf-activity-${slugify(activityId, `activity-${idx + 1}`)}"
        data-activity-type="${escapeHtml(activity.type)}"
        data-activity-id="${escapeHtml(activity.id)}"
        data-block-theme="${escapeHtml(blockStyle.themeKey)}"
        data-composer-col-span="${colSpan}"
        data-composer-row="${row || ''}"
        data-composer-col="${col || ''}"
        data-composer-x="${x}"
        data-composer-y="${y}"
        data-composer-w="${w}"
        data-composer-h="${h}"
        style="${sectionStyle}"
        class="${sectionClasses.join(' ')}"
      >
        ${activityHtml}
      </section>
    `;
  };

  const renderLayout = (list) => {
    const sections = list.length ? list.map((activity, idx) => renderActivity(activity, idx)).join('\n') : '<p class="text-slate-400" style="grid-column: 1 / -1;">No composer activities added yet.</p>';
    if (composerLayout.mode === 'canvas') {
      const rowHeight = Number.parseInt(composerLayout.rowHeight, 10) || 24;
      const margin = Array.isArray(composerLayout.margin) ? composerLayout.margin : [12, 12];
      const containerPadding = Array.isArray(composerLayout.containerPadding) ? composerLayout.containerPadding : [12, 12];
      return `
        <div class="grid" data-composer-root data-composer-columns="${composerLayout.maxColumns}" data-composer-layout-mode="canvas" style="grid-template-columns: repeat(${composerLayout.maxColumns}, minmax(0, 1fr)); grid-auto-rows: ${rowHeight}px; gap: ${margin[1]}px ${margin[0]}px; padding: ${containerPadding[1]}px ${containerPadding[0]}px;">
          ${sections}
        </div>
      `;
    }
    const simpleMatchTallestRow = composerLayout.simpleMatchTallestRow === true;
    return `
      <div class="grid gap-6" data-composer-root data-composer-columns="${composerLayout.maxColumns}" data-composer-layout-mode="simple" data-composer-simple-match-tallest-row="${simpleMatchTallestRow ? 'true' : 'false'}" style="grid-template-columns: repeat(${composerLayout.maxColumns}, minmax(0, 1fr)); grid-auto-flow: row;">
        ${sections}
      </div>
    `;
  };

  const renderTemplate = () => {
    if (template === 'finlit') {
      const finlit = createFinlitTemplateFormState(module?.finlit);
      const finlitTabs = Array.isArray(finlit?.tabs) ? finlit.tabs : [];
      const requestedFinlitTabId = String(module?.finlitActiveTabId || module?.__finlitActiveTabId || '').trim();
      const nonTabGroupActivities = activities.filter((activity) => activity?.type !== 'tab_group');

      const tabGroups = activities.filter((activity) => activity?.type === 'tab_group');
      const firstTabGroup = tabGroups[0] || null;
      const legacyTabGroups = [];
      if (firstTabGroup) {
        const t = Array.isArray(firstTabGroup?.data?.tabs) ? firstTabGroup.data.tabs : [];
        const renderTabLinked = (tab) => {
          if (!tab) return '';
          const refs = (Array.isArray(tab?.activityIds) ? tab.activityIds : []).map((id) => activityMap.get(String(id || '').trim())).filter(Boolean);
          const inline = renderInlineActivities(tab?.activities, `${firstTabGroup.id || 'tab-group'}-${tab?.id || 'tab'}`);
          const merged = [...refs, ...inline];
          return merged.length ? merged.map((item, nestedIdx) => renderActivity(item, nestedIdx, { withLayout: false, trail: [firstTabGroup.id] })).join('\n') : '';
        };
        t.forEach((tab) => {
          legacyTabGroups.push({
            id: String(tab?.id || '').trim().toLowerCase(),
            html: renderTabLinked(tab),
          });
        });
      }

      const getLegacyTabHtml = (tabId) => {
        const target = String(tabId || '').trim().toLowerCase();
        if (!target) return '';
        let match = legacyTabGroups.find((tab) => tab.id === target);
        if (!match && target === 'activities') {
          match = legacyTabGroups.find((tab) => tab.id.includes('activit'));
        }
        if (!match && target === 'additional') {
          match = legacyTabGroups.find((tab) => tab.id.includes('additional'));
        }
        if (!match) {
          match = legacyTabGroups.find((tab) => tab.id && target.includes(tab.id));
        }
        return match?.html || '';
      };

      const renderFinlitLinks = (links) =>
        (Array.isArray(links) ? links : [])
          .map((link, idx) => {
            const title = String(link?.title || '').trim() || `Resource ${idx + 1}`;
            const description = String(link?.description || '').trim();
            const href = toSafeHref(link?.url);
            const openAttrs = href && !href.startsWith('#') ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `
              <article class="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                ${
                  href
                    ? `<a href="${escapeHtml(href)}"${openAttrs} class="text-sm font-bold text-sky-300 hover:text-sky-200 underline">${escapeHtml(title)}</a>`
                    : `<p class="text-sm font-bold text-slate-200">${escapeHtml(title)}</p>`
                }
                ${description ? `<p class="mt-1 text-xs text-slate-400 leading-relaxed">${escapeHtml(description)}</p>` : ''}
              </article>
            `;
          })
          .join('\n');

      const referencedActivityIds = new Set(
        finlitTabs
          .flatMap((tab) => (Array.isArray(tab?.activityIds) ? tab.activityIds : []))
          .map((id) => String(id || '').trim())
          .filter(Boolean),
      );
      const unlinkedDirectActivities = nonTabGroupActivities.filter((activity) => {
        const id = String(activity?.id || '').trim();
        return id && !referencedActivityIds.has(id);
      });
      const unlinkedDirectActivitiesHtml = unlinkedDirectActivities.length ? renderLayout(unlinkedDirectActivities) : '';

      const renderedTabs = finlitTabs.map((tab, tabIndex) => {
        const tabId = String(tab?.id || `tab-${tabIndex + 1}`).trim() || `tab-${tabIndex + 1}`;
        const tabLabel = String(tab?.label || tabId || `Tab ${tabIndex + 1}`).trim() || `Tab ${tabIndex + 1}`;
        const hasLocalTabActivities = Object.prototype.hasOwnProperty.call(tab || {}, 'activities');
        const localTabActivities = hasLocalTabActivities
          ? normalizeComposerActivities(Array.isArray(tab?.activities) ? tab.activities : [], {
              maxColumns: composerLayout.maxColumns,
              mode: composerLayout.mode,
            })
          : [];
        const localTabHtml = localTabActivities.length ? renderLayout(localTabActivities) : '';
        const linkedActivities =
          hasLocalTabActivities
            ? []
            : (Array.isArray(tab?.activityIds) ? tab.activityIds : [])
                .map((id) => activityMap.get(String(id || '').trim()))
                .filter(Boolean);
        const linkedHtml = linkedActivities.length ? renderLayout(linkedActivities) : '';
        const legacyHtml = getLegacyTabHtml(tabId);
        const linksHtml = renderFinlitLinks(tab?.links);
        const panelParts = [];

        if (localTabHtml) panelParts.push(localTabHtml);
        if (linkedHtml) panelParts.push(linkedHtml);
        if (tabId === 'activities' && !hasLocalTabActivities && !localTabHtml && unlinkedDirectActivitiesHtml) {
          panelParts.push(unlinkedDirectActivitiesHtml);
        }
        if (legacyHtml) panelParts.push(legacyHtml);
        if (linksHtml) panelParts.push(`<div class="space-y-2">${linksHtml}</div>`);

        const panelHtml =
          panelParts.length > 0
            ? panelParts.join('\n')
            : `<p class="text-slate-400 text-sm">No ${escapeHtml(tabLabel.toLowerCase() || 'tab')} content.</p>`;

        return {
          tabId,
          tabLabel,
          panelHtml,
          isActive: false,
        };
      });

      if (renderedTabs.length === 0) {
        renderedTabs.push({
          tabId: 'activities',
          tabLabel: String(finlit?.activitiesTabLabel || 'Activities'),
          panelHtml: unlinkedDirectActivitiesHtml || '<p class="text-slate-400 text-sm">No activities yet.</p>',
          isActive: true,
        });
      }
      const resolvedActiveTabId = renderedTabs.some((tab) => tab.tabId === requestedFinlitTabId)
        ? requestedFinlitTabId
        : renderedTabs[0]?.tabId || 'activities';
      renderedTabs.forEach((tab) => {
        tab.isActive = tab.tabId === resolvedActiveTabId;
      });
      const hero = createFinlitHeroFormState(module?.hero);
      const rawHeroMediaUrl = String(hero.mediaUrl || '').trim();
      const heroMediaUrl = /^((https?:)?\/\/|\/|\.\/|\.\.\/|data:image\/|data:video\/|blob:|materials\/)/i.test(rawHeroMediaUrl)
        ? (/^materials\//i.test(rawHeroMediaUrl) ? `/${rawHeroMediaUrl}` : rawHeroMediaUrl)
        : '';
      const heroMediaKind = resolveFinlitHeroMediaKind(hero);
      const heroTitle = String(hero.title || module?.title || 'Module');
      const heroMediaHtml =
        heroMediaUrl && heroMediaKind === 'video'
          ? `<div class="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-black"><video src="${escapeHtml(heroMediaUrl)}" class="w-full h-auto" controls preload="metadata"></video></div>`
          : heroMediaUrl && heroMediaKind === 'embed'
            ? `<div class="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video"><iframe src="${escapeHtml(heroMediaUrl)}" title="${escapeHtml(heroTitle)}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`
            : heroMediaUrl
              ? `<div class="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-black"><img src="${escapeHtml(heroMediaUrl)}" alt="${escapeHtml(heroTitle)}" class="w-full h-auto" loading="lazy" /></div>`
              : '';
      return `
        <section class="space-y-6 rounded-xl border border-slate-700 p-5 cf-template-surface" data-finlit-root>
          <header class="rounded-xl border border-slate-700 bg-slate-950/40 p-5">
            <h2 class="text-2xl font-black text-white">${escapeHtml(heroTitle)}</h2>
            ${String(hero.subtitle || '').trim() ? `<p class="mt-2 text-sm text-slate-300">${escapeHtml(String(hero.subtitle || ''))}</p>` : ''}
            ${String(hero.progressLabel || '').trim() ? `<p class="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">${escapeHtml(String(hero.progressLabel || ''))}</p>` : ''}
            ${heroMediaHtml}
          </header>
          <div class="flex flex-wrap gap-3 border-b border-slate-700 pb-2">
            ${renderedTabs
              .map(
                (tab) => `
                  <button
                    type="button"
                    data-finlit-tab-trigger="${escapeHtml(tab.tabId)}"
                    class="px-2 py-1 text-sm font-bold ${tab.isActive ? 'text-slate-200 cf-finlit-tab-active' : 'text-slate-400'}"
                  >
                    ${escapeHtml(tab.tabLabel)}
                  </button>
                `,
              )
              .join('\n')}
          </div>
          ${renderedTabs
            .map(
              (tab) => `
                <div data-finlit-tab-panel="${escapeHtml(tab.tabId)}" class="${tab.isActive ? '' : 'hidden'}">
                  ${tab.panelHtml}
                </div>
              `,
            )
            .join('\n')}
        </section>
      `;
    }

    if (template === 'coursebook') {
      const sections = activities.map((activity, idx) => {
        const anchor = `cb-${slugify(activity?.id || `section-${idx + 1}`, `section-${idx + 1}`)}`;
        const html = renderActivity(activity, idx, { withLayout: false });
        const titleText = activity?.type === 'title_block' ? stripHtml(activity?.data?.textHtml || activity?.data?.text || '') : stripHtml(activity?.data?.title || '');
        return {
          anchor,
          html: `<section id="${anchor}">${html}</section>`,
          entries: [
            ...(titleText ? [{ level: 2, text: titleText, anchor }] : []),
            ...parseHeadingEntries(html, anchor),
          ],
        };
      });
      const seen = new Set();
      const toc = sections
        .flatMap((section) => section.entries)
        .filter((entry) => {
          const key = `${entry.anchor}:${entry.text.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      return `
        <section class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 h-max sticky top-4 cf-template-surface">
            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Contents</h3>
            <nav class="space-y-2">
              ${toc.length ? toc.map((entry) => `<a href="#${entry.anchor}" class="block text-sm text-slate-200 hover:text-white" style="padding-left:${Math.max(0, entry.level - 2) * 0.75}rem;">${escapeHtml(entry.text)}</a>`).join('\n') : '<p class="text-sm text-slate-400">No headings found.</p>'}
            </nav>
          </aside>
          <article class="rounded-xl border border-slate-700 bg-slate-900/70 p-6 cf-template-surface cf-prose">
            <div class="space-y-6">${sections.map((item) => item.html).join('\n')}</div>
          </article>
        </section>
      `;
    }

    if (template === 'toolkit_dashboard') {
      const cards = [];
      const cardListActivities = activities.filter((activity) => activity?.type === 'card_list');
      if (cardListActivities.length) {
        cardListActivities.forEach((activity, listIdx) => {
          const sourceCards = Array.isArray(activity?.data?.cards) ? activity.data.cards : [];
          sourceCards.forEach((card, cardIdx) => {
            cards.push({
              id: `tool-card-${listIdx + 1}-${cardIdx + 1}`,
              title: String(card?.title || `Tool ${cardIdx + 1}`),
              subtitle: String(card?.subtitle || ''),
              category: String(card?.category || 'General'),
              openMode: String(card?.openMode || 'expand').trim().toLowerCase(),
              linked: (() => {
                const target = activityMap.get(String(card?.targetActivityId || '').trim());
                const inlineList = renderInlineActivities(
                  [
                    ...(card?.activity && typeof card.activity === 'object' ? [card.activity] : []),
                    ...(Array.isArray(card?.activities) ? card.activities : []),
                  ],
                  `tool-inline-${listIdx + 1}-${cardIdx + 1}`,
                );
                return target ? [target, ...inlineList] : inlineList;
              })(),
            });
          });
        });
      } else {
        activities.forEach((activity, idx) => {
          cards.push({
            id: `tool-card-auto-${idx + 1}`,
            title: stripHtml(activity?.data?.title || activity?.data?.text || getActivityDefinition(activity?.type)?.label || `Tool ${idx + 1}`),
            subtitle: '',
            category: getActivityDefinition(activity?.type)?.label || 'General',
            openMode: 'expand',
            linked: [activity],
          });
        });
      }
      const normalizedCards = cards.map((card) => ({
        ...card,
        openMode:
          card.openMode === 'modal' || card.openMode === 'navigate_section' || card.openMode === 'navigate_page' ? card.openMode : 'expand',
      }));
      const cardHtml = normalizedCards
        .map((card) => {
          const panelId = `${card.id}-panel`;
          const linkedItems = Array.isArray(card.linked) ? card.linked : [];
          const content = linkedItems.length
            ? linkedItems.map((item, nestedIdx) => renderActivity(item, nestedIdx, { withLayout: false, trail: [card.id] })).join('\n')
            : '<p class="text-sm text-slate-400">No linked activity.</p>';
          const searchText = `${card.title} ${card.subtitle} ${card.category}`.trim().toLowerCase();
          const categorySlug = slugify(card.category, 'general');
          return `
            <article class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 cf-toolkit-card cf-template-surface" data-toolkit-card data-toolkit-category="${categorySlug}" data-toolkit-search="${escapeHtml(searchText)}">
              <h4 class="text-sm font-bold text-white">${escapeHtml(card.title)}</h4>
              ${card.subtitle ? `<p class="mt-1 text-xs text-slate-400">${escapeHtml(card.subtitle)}</p>` : ''}
              <div class="mt-3">
                ${
                  card.openMode === 'expand'
                    ? `<button type="button" data-expand-toggle="${panelId}" class="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold uppercase tracking-wide text-white">Open</button><div class="hidden mt-3" data-expand-panel="${panelId}">${content}</div>`
                    : card.openMode === 'modal'
                      ? `<button type="button" data-toolkit-open-modal="${panelId}" class="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold uppercase tracking-wide text-white">Open Modal</button><div class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" data-toolkit-modal-id="${panelId}" data-toolkit-modal-backdrop><div class="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-950 p-4 max-h-[85vh] custom-scroll"><div class="flex items-center justify-between mb-3"><h4 class="text-sm font-bold text-white">${escapeHtml(card.title)}</h4><button type="button" data-toolkit-close-modal class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white">Close</button></div>${content}</div></div>`
                      : `<a href="#${panelId}" class="inline-block px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold uppercase tracking-wide text-white">${card.openMode === 'navigate_page' ? 'Open Page' : 'Go to Section'}</a><section id="${panelId}" class="mt-3">${content}</section>`
                }
              </div>
            </article>
          `;
        })
        .join('\n');
      return `
        <section class="space-y-4" data-toolkit-dashboard>
          <div class="flex flex-wrap gap-2">
            <input type="search" data-toolkit-query class="flex-1 min-w-56 rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" placeholder="Search tools..." />
            <button type="button" data-toolkit-category-filter="all" class="px-3 py-2 rounded bg-slate-700 text-white text-xs font-bold">All</button>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${cardHtml || '<p class="text-slate-400 text-sm">No tools configured.</p>'}</div>
        </section>
      `;
    }

    return renderLayout(activities);
  };

  const themeCss =
    theme === 'finlit_clean'
      ? `.cf-theme-finlit_clean { --cf-surface:#ffffff; --cf-border:#d1d5db; --cf-text:#0f172a; } .cf-theme-finlit_clean .cf-template-surface{background:var(--cf-surface);border-color:var(--cf-border);color:var(--cf-text);} .cf-theme-finlit_clean .cf-finlit-tab-active{color:#0284c7!important;border-color:#0284c7!important;}`
      : theme === 'coursebook_light'
        ? `.cf-theme-coursebook_light { --cf-surface:#ffffff; --cf-border:#d1d5db; --cf-text:#111827; } .cf-theme-coursebook_light .cf-template-surface{background:var(--cf-surface);border-color:var(--cf-border);color:var(--cf-text);} .cf-theme-coursebook_light .cf-prose{font-family:Georgia, "Times New Roman", serif;line-height:1.75;}`
        : theme === 'toolkit_clean'
          ? `.cf-theme-toolkit_clean { --cf-surface:#ffffff; --cf-border:#d1d5db; --cf-text:#111827; } .cf-theme-toolkit_clean .cf-template-surface{background:var(--cf-surface);border-color:var(--cf-border);color:var(--cf-text);}`
          : `.cf-theme-dark_cards { --cf-surface:rgba(15, 23, 42, 0.72); --cf-border:rgba(71, 85, 105, 0.65); --cf-text:#e2e8f0; } .cf-theme-dark_cards .cf-template-surface{background:var(--cf-surface);border-color:var(--cf-border);color:var(--cf-text);}`;

  const html = `
    <style>
      .cf-composer-activity { position: relative; }
      .cf-composer-activity.cf-block-font-override,
      .cf-composer-activity.cf-block-font-override * { font-family: var(--cf-block-font); }
      .cf-composer-activity.cf-block-text-override :is(h1, h2, h3, h4, h5, h6, p, span, div, li, ul, ol, label, summary, small, strong, em, blockquote, pre, a, button, input, textarea, select) { color: var(--cf-block-text); }
      .cf-composer-activity.cf-block-bg-override > :first-child { background: var(--cf-block-bg); }
      .cf-composer-activity.cf-block-border-override > :first-child,
      .cf-composer-activity.cf-block-border-override > :first-child [class*='border-'] { border-color: var(--cf-block-border); }
      .cf-composer-activity.cf-block-accent-override a,
      .cf-composer-activity.cf-block-accent-override [class*='text-indigo'],
      .cf-composer-activity.cf-block-accent-override [class*='text-sky'],
      .cf-composer-activity.cf-block-accent-override [class*='text-emerald'],
      .cf-composer-activity.cf-block-accent-override [class*='text-cyan'] { color: var(--cf-block-accent); }
      .cf-composer-activity.cf-no-border > :first-child,
      .cf-composer-activity.cf-no-border > :first-child [class*='border-'] { border: 0 !important; box-shadow: none !important; }
      .cf-composer-activity.cf-variant-flat > :first-child { background: transparent !important; }
      .cf-composer-activity.cf-pad-sm > :first-child { padding: 0.5rem !important; }
      .cf-composer-activity.cf-pad-md > :first-child { padding: 1rem !important; }
      .cf-composer-activity.cf-pad-lg > :first-child { padding: 1.5rem !important; }
      .cf-composer-activity.cf-title-xs :is(h1,h2,h3,h4) { font-size: 0.875rem !important; }
      .cf-composer-activity.cf-title-sm :is(h1,h2,h3,h4) { font-size: 1rem !important; }
      .cf-composer-activity.cf-title-md :is(h1,h2,h3,h4) { font-size: 1.125rem !important; }
      .cf-composer-activity.cf-title-lg :is(h1,h2,h3,h4) { font-size: 1.375rem !important; }
      .cf-composer-activity.cf-title-xl :is(h1,h2,h3,h4) { font-size: 1.75rem !important; }
      .cf-composer-activity.cf-canvas-item { min-height: 0; overflow: hidden; }
      .cf-composer-activity.cf-canvas-item > :first-child { height: 100%; overflow: auto; box-sizing: border-box; }
      [data-composer-root][data-composer-layout-mode="simple"][data-composer-simple-match-tallest-row="true"] { align-items: stretch; }
      [data-composer-root][data-composer-layout-mode="simple"][data-composer-simple-match-tallest-row="true"] > .cf-composer-activity { height: 100%; }
      [data-composer-root][data-composer-layout-mode="simple"][data-composer-simple-match-tallest-row="true"] > .cf-composer-activity > :first-child { height: 100%; box-sizing: border-box; }
      [data-composer-root][data-composer-layout-mode="simple"] textarea { resize: none !important; overflow-y: auto; }
      ${themeCss}
    </style>
    <div class="space-y-6 ${themeClass}" data-template="${escapeHtml(template)}" data-theme="${escapeHtml(theme)}">
      ${renderTemplate()}
    </div>
  `;

  return {
    html,
    css: '',
    script: `${buildComposerRuntimeScript()}\n${buildTemplateRuntimeScript()}`,
  };
}
