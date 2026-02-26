# Course Factory Dashboard - Improvement Roadmap

## 🟢 Tier 1: Low Cost / High Leverage (Quick Wins)
**Do these immediately. They take < 30 minutes each but drastically improve UX.**

### ✅ 1. Mobile Nav (Hamburger Menu) for Export
**Status:** ✅ COMPLETED - Fixed hamburger menu overlap with padding-top solution

### 2. "Duplicate Module" Button
**Why:** Users hate re-creating the same structure (e.g., "Week 1", "Week 2").
**The Fix:** Add a copy button in Phase 2 or the Sidebar.
**Implementation:** 
- Add duplicate button next to Edit/Delete in Phase 2 grid cards
- Generate new ID: `item-${Date.now()}` or `view-${Date.now()}`
- Copy all properties, append " (Copy)" to title
- Reset history array

### ✅ 3. Sticky "Save" Bars
**Status:** ✅ COMPLETED - Already implemented via flexbox layout. Save buttons stay at bottom while content scrolls.
**Why:** Scrolling down 500px to save an edit is annoying.
**The Fix:** CSS change in Edit Modals.
**Implementation:** 
- Find `bg-slate-800 border-t border-slate-700` div at bottom of edit modal (line ~8166)
- Change to: `sticky bottom-0 z-10 bg-slate-900 border-t border-slate-700 p-4 flex gap-3`

### 4. "Safe" Module Deletion (Trash Can)
**Why:** Accidental deletion causes panic.
**The Fix:** Instead of immediate deletion, move to `deletedModules` array.
**Implementation:**
- Add `deletedModules: []` to PROJECT_DATA structure
- "Delete" button moves item to `deletedModules` with timestamp
- Add "Recycle Bin" tab in Phase 2 to restore/permadelete
- Auto-purge after 30 days (optional)

---

## 🟡 Tier 2: Medium Cost / High Leverage (Pro Features)
**Do these next weekend. They require new logic but no major refactoring.**

### 5. The "Theme Engine" (Corporate vs. Cyberpunk)
**Why:** Expands your market. Not everyone wants "Dark Mode Slate."
**The Fix:** Create a Theme Configuration Object.
**Implementation:**
```javascript
const THEMES = {
  CYBERPUNK: { bg: "#020617", text: "#e2e8f0", accent: "#0ea5e9", font: "JetBrains Mono" },
  CORPORATE: { bg: "#ffffff", text: "#1e293b", accent: "#2563eb", font: "Arial" },
  SPORTS: { bg: "#0a0a0a", text: "#f0f0f0", accent: "#ff6b35", font: "Oswald" }
};
// Pass selectedTheme to generateMasterShell and use variables for colors
```

### 6. Image Upload Handler (Base64)
**Why:** Users want logos and diagrams, but hosting them on Imgur is annoying.
**The Fix:** An `<input type="file">` that converts images to strings.
**Implementation:**
- Add to Phase 1 or Phase 3
- Convert to Base64: `reader.readAsDataURL(file)`
- Save to `projectData['Course Settings'].logo` or `projectData['Course Settings'].assets[]`
- In Export: `<img src="${projectData['Course Settings'].logo}" />`

### 7. Global Search & Replace
**Why:** Changing "Semester 1" to "Semester 2" across 50 modules is painful.
**The Fix:** A tool in Phase 3 that runs a Regex across the entire JSON.stringify(projectData).
**Implementation:**
- Add "Find & Replace" section in Phase 3
- Convert entire state to string
- `string.replaceAll(searchTerm, replaceTerm)` with regex support
- JSON.parse() back to object with strict validation
- Show preview of affected modules before applying

### 8. Storage Scalability (IndexedDB Migration)
**Why:** localStorage is capped at ~5MB. Large courses with embedded images/base64 PDFs will hit this limit.
**The Fix:** Switch storage backend to IndexedDB (allows 100s of MB).
**Implementation:**
- Create simple wrapper around `window.indexedDB` API (no NPM needed)
- Migrate existing localStorage data on first load
- Keep localStorage as fallback for small projects
- Add storage usage indicator in Phase 3

### 9. The "PostMessage" Bridge (Interactivity Gap)
**Why:** Standalone modules (iframes) are isolated. Progress tracking doesn't cross iframe boundary.
**The Fix:** Implement communication protocol.
**Implementation:**
- Master Shell: Listen for `window.onmessage`
- Modules: Inject helper script: `window.parent.postMessage({ type: 'COMPLETE', moduleId: '...' }, '*')`
- Dashboard: Track completion state, show progress bar

### 10. Asset Management System
**Why:** If you import HTML with `<img src="images/logo.png">`, that image breaks.
**The Fix:** Create "Media Bay" in Phase 1.
**Implementation:**
- Upload images, convert to Base64
- Store in `projectData['Course Settings'].assets[]`
- Provide "Find & Replace" tool to map broken `src` tags to new URLs
- Auto-detect broken image references during import

---

## 🔴 Tier 3: High Cost / Massive Leverage (Product Features)
**These turn your tool into a SaaS product. They are hard.**

### 11. JSZip Export (Offline Bundle)
**Why:** Makes the course truly portable and professional.
**The Fix:** Integrate jszip library.
**Complexity:**
- Parse HTML strings
- Find all `src="data:image..."`
- Convert Base64 to binary Blobs
- Add to `/images` folder in Zip
- Rewrite HTML `src` to point to `./images/file.png`

### 12. Drag-and-Drop Reordering
**Why:** Clicking "Up/Down" arrows 20 times is bad UX.
**The Fix:** Integrate native HTML5 Drag-and-Drop API (no library needed).
**Complexity:**
- Add `draggable="true"` to module cards in Phase 2
- Handle `onDragStart`, `onDragOver`, `onDrop` events
- Update module order in PROJECT_DATA
- Works for both modules and sidebar navigation

### 13. "Live" Preview (Split Screen)
**Why:** Switching tabs between "Edit" and "Preview" breaks flow.
**The Fix:** A layout in Phase 2 where Editor is Left (50%) and iframe Preview is Right (50%).
**Complexity:**
- Major CSS refactor of Phase 2 layout
- Debounce input (wait 500ms after typing) before updating iframe
- Otherwise app crashes trying to re-render iframe on every keystroke

### 14. Theme Injection (Visual Consistency)
**Why:** Dashboard is Dark Mode, but imported modules might be Light Mode. Compiled course looks disjointed.
**The Fix:** Add "Force Theme" checkbox to Module Editor.
**Implementation:**
- When checked, Compiler injects CSS block into module
- Override `body { background: ...; color: ...; }` to match course accent colors
- Add to `generateMasterShell` function

### 15. Redundant Module Managers Consolidation
**Why:** You can create/edit modules in Phase 1 (Module Manager tab) AND in Phase 2 (Edit button).
**The Fix:** Consolidate.
**Implementation:**
- Phase 1: Strictly for Importing/Harvesting (getting code IN)
- Phase 2: ONLY place for Editing/Configuring (refining code)
- Remove "Module Manager" creation inputs from Phase 1
- Move "Create New" logic to clean button in Phase 2

### 16. Compiler "Templating" (Code Cleanliness)
**Why:** `generateFullSite` uses massive string concatenations and Regex replacements. Fragile.
**The Fix:** Implement simple Token Replacement System.
**Implementation:**
- Define shell with tokens: `{{NAV_ITEMS}}`, `{{CONTENT_INJECTION}}`, `{{THEME_COLORS}}`
- Replace: `shell.split('{{NAV_ITEMS}}').join(navHtml)`
- Faster and safer than Regex

### 17. "Smart" Search in Phase 2
**Why:** Currently filters by Title/ID. Doesn't search inside code.
**The Fix:** Enhance search to look inside `code.html` and `code.script`.
**Implementation:**
- Search in `code.html` and `code.script` strings
- Highlight matches in preview
- Help find "Where did I put that quiz question?" or "Which module uses 'p1_score'?"

### 18. Global Undo/History
**Why:** You have history per module (great!), but if you delete an entire module, it's gone forever.
**The Fix:** Implement Project-Level "Trash Bin" (see #4 above).
**Implementation:**
- Already covered in #4 (Safe Module Deletion)

### 19. Accessibility (A11y) Guardrails
**Why:** AI generates `div` elements with `onclick`. Bad for screen readers.
**The Fix:** Update MASTER_SHELL and Generator logic.
**Implementation:**
- Enforce semantic HTML: `<button>`, `<nav>`, `<main>`
- Ensure ARIA labels: `aria-expanded="false"`, `aria-label="..."` 
- Auto-generate for all interactive elements

---

## 🆕 Additional Recommendations (Not in Original Lists)

### 20. Module Templates Library
**Why:** Users create similar modules repeatedly (quizzes, activities, lessons).
**The Fix:** Save common module structures as reusable templates.
**Implementation:**
- Add "Save as Template" button in Module Editor
- Store in `projectData['Templates']` or separate localStorage key
- "Create from Template" button in Phase 1
- Include: Quiz Template, Activity Template, Lesson Template, etc.

### 21. Batch Operations
**Why:** Selecting/deleting/exporting modules one-by-one is tedious.
**The Fix:** Multi-select checkboxes in Phase 2.
**Implementation:**
- Add checkbox to each module card
- "Select All" / "Deselect All" buttons
- Batch actions: Delete Selected, Export Selected, Duplicate Selected
- Show count: "3 modules selected"

### 22. Module Dependencies/Relationships
**Why:** Some modules depend on others (e.g., "Quiz 2" requires "Lesson 2").
**The Fix:** Track module relationships.
**Implementation:**
- Add `dependencies: []` field to module structure
- Show warning if deleting a module that others depend on
- Auto-include dependencies when compiling
- Visual graph in Phase 2 showing relationships

### 23. Performance Monitoring
**Why:** Large modules can slow down the compiled site.
**The Fix:** Add performance warnings.
**Implementation:**
- Calculate module size (HTML + Script bytes)
- Show warning if module > 500KB
- Display load time estimate
- Suggest splitting large modules

### 24. Export Presets
**Why:** Different compilation settings for different use cases (Google Sites vs standalone).
**The Fix:** Save compilation configurations.
**Implementation:**
- "Save Preset" button in Phase 4
- Store: selected modules, theme, options
- "Load Preset" dropdown
- Quick export: "Export for Google Sites", "Export Standalone", etc.

### 25. Module Metadata/Tags System
**Why:** Hard to organize 50+ modules without categories.
**The Fix:** Add tags/metadata to modules.
**Implementation:**
- Add `tags: []` and `category: ""` fields
- Filter by tag in Phase 2
- Color-code by category
- Auto-suggest tags based on module content

### 26. Code Quality Checks
**Why:** AI-generated code might have issues (missing semicolons, undefined variables).
**The Fix:** Add linting/validation on import.
**Implementation:**
- Run basic checks: syntax errors, undefined variables, missing IDs
- Show warnings before committing
- Auto-fix common issues (optional)
- Integration with existing `validateModule` function

### 27. Keyboard Shortcuts
**Why:** Power users want faster workflows.
**The Fix:** Add keyboard shortcuts.
**Implementation:**
- `Ctrl+S`: Save current edit
- `Ctrl+D`: Duplicate selected module
- `Ctrl+F`: Focus search
- `Ctrl+/`: Show shortcuts help
- `Esc`: Close modals

### 28. Import Validation Warnings
**Why:** Users paste bad code and don't know until it breaks.
**The Fix:** Pre-commit validation with detailed warnings.
**Implementation:**
- Enhanced `validateModule` function
- Show preview of issues before "Add to Project"
- Color-code: Errors (red) vs Warnings (yellow)
- Suggest fixes for common issues

### 29. Module Versioning/Rollback UI
**Why:** History exists but hard to use.
**The Fix:** Better history UI in Module Editor.
**Implementation:**
- Timeline view of history
- "Restore this version" button
- Diff view (show what changed)
- "Compare versions" side-by-side

### 30. Export Analytics
**Why:** Users want to know what they're exporting.
**The Fix:** Show export summary before download.
**Implementation:**
- Total modules count
- Total file size estimate
- List of included modules
- Warnings (e.g., "Module X has no script")
- "Export Report" PDF option

---

## 📊 Priority Summary

**Immediate (This Week):**
1. ✅ Mobile Nav Fix (DONE)
2. Duplicate Module Button
3. ✅ Sticky Save Bars (DONE - Already working via flexbox)
4. Safe Module Deletion (Trash Bin)

**Next Sprint (This Month):**
5. Theme Engine
6. Image Upload Handler
7. Global Search & Replace
8. Storage Scalability (IndexedDB)

**Future (Next Quarter):**
9-19. All Tier 3 features
20-30. Additional recommendations

---

## 🎯 Quick Win Strategy

Start with **#2 (Duplicate)** - it's low-hanging fruit that immediately makes the tool feel 2x more valuable. Then do **#6 (Image Uploads)** - being able to add a custom logo makes the user feel like they "own" the course. (Note: #3 Sticky Save Bars is already working via flexbox layout.)
