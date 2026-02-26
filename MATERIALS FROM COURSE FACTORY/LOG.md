# PROJECT LOG: Course Factor

## Project Mission
**Course Factor** - A specialized engine for creating, managing, and compiling sports psychology courses optimized for university students and embedded delivery via Google Sites.

## Tech Stack
- **Frontend:** React 19, Lucide React, Tailwind CSS 4
- **Backend:** Firebase (Auth & Firestore)
- **Build Tool:** Vite
- **Platform:** Google Workspace / Google Sites (via Embed Code)

## Deep Feature Inventory
### Phase 0: Master Shell (The UI Engine)
- **Layout Control:** Real-time toggles for Sidebar, Footer, and Navigation position (Side vs Top).
- **Theming:** Centralized control for fonts, test colors, and material colors.
- **Master Shell Scripting:** Logic to ensure modules work in sandboxed environments (window-scope attachment).

### Phase 1: Harvest (The Content Ingestor)
- **AI Studio Creator:** Optimized prompt generator for Google AI Studio (JSON schema extraction).
- **V7 Gap-Parser:** Custom line-by-line algorithm for extracting code blocks from large "Monolith" HTML files without breaking logic.
- **Assessment Center:** 
  - Multiple Question Types (Multiple Choice, Long Answer).
  - Master Assessment management & Smart Import.
  - Question migration tool.
- **Material Card Generator:** Dedicated tool for PDF embeds and Google Drive link management.
- **Feature Creator:** System for building reusable "Toolkit" components.

### Phase 2: Preview & Test (The Sandbox)
- **Unified Previewer:** Iframe-based sandbox for testing Modules, Assessments, Materials, and Toolkit features.
- **Bulk Operations:** Multi-select tools for hiding/showing modules in mass.
- **Search & Filter:** Instant search across title, ID, and category.

### Phase 3: Manage & Reset (State Control)
- **Local History/Rollback:** `history` array per module for version control.
- **Backup/Restore:** Full project state export/import via JSON.
- **Safety Valves:** Project reset functionality with mandatory backup verification.

### Phase 4: Compile & Export (The Publisher)
- **Legacy Compiler:** Generates a single-file "Monolith" HTML for easy sharing.
- **Beta Multi-File Publisher:** 
  - ZIP export with proper file structure (`index.html`, `manifest.json`, `modules/` folder).
  - Delta Publish (exporting only specific updated modules).
  - Single-Page App (SPA) vs Multi-file structure options.

## Project History (Archaeology)
### Recent Milestones (Jan 2026)
- [x] **Smart Vault Full Integration:** Completed end-to-end integration of the "Smart Vault" system.
  - **Infrastructure:** `public/materials/` folder, `scripts/scan-vault.cjs`, and `SCAN_VAULT.bat` operational.
  - **UI Component:** `VaultBrowser.jsx` integrated into `Phase1` via `App.jsx` props.
  - **Logic:** Fixed React wiring issues (`handleVaultSelect` scope, state prop drilling).
  - **UX Polish:** Materials renderer now smart-checks for URLs (no more duplicate buttons) and uses clear "View" labels.
  - **Compiler Update:** Exported site now respects the smart button logic and "View" label.
- [x] **Vault Architecture:** Adopted "Smart Vault" strategy (Hybrid Repo/External) to solve link rot.
- [x] **Safety Protocol:** Implemented "Confidence Check" rule (Rule 000 & Universal) to prevent AI from making risky changes without a safe test.
- [x] **Cursor Rule System v2.0:** Upgraded from a single `.cursorrules` file to a 7-rule specialized `.cursor/rules/` system (Architect Mode, Token Economy, Parser Protection).
- [x] **Beta ZIP Export:** Completed the multi-file static publish system with ZIP generation.
- [x] **Phase 1 Parser Refinement:** Updated AI Studio prompt generation for better JSON accuracy.
- [x] **Assessment Edit Logic:** Fixed deep-editing bugs in the Assessment Center.
- [x] **Master Shell Visuals:** Added centralized control for fonts and material colors.
- [x] **Validation Suite:** Implemented "Broken Thing" detection and link testers for materials.
- [x] **Google Sites Export Fix:** Added "Asset Base URL" configuration to Phase 4 to support absolute linking for local assets (PDFs) when embedded in Google Sites.
- [x] **Export Logic Refinement:** Implemented "Smart Join" to prevent URL duplication and ensured Beta/ZIP exports ignore the Base URL to maintain portability (relative links).
- [x] **App Entry Point Fix:** Resolved default export/import mismatch between `App.jsx` and `main.jsx`.

### Earlier Development (2025)
- [x] **Auto-Save Monolith:** Implemented persistent state saving to prevent data loss.
- [x] **Hamburger Nav Fix:** Resolved tablet/mobile overlap issues in the navigation.
- [x] **Toast System:** Built a custom React-based notification system from scratch.
- [x] **Initial Extraction Engine:** First versions of the regex-based HTML extractor.

## Lessons Learned & Guardrails
- **Encoding:** Special character encoding is a persistent challenge; refer to `ENCODING_FIX_GUIDE.md`.
- **Sandbox Rules:** Google Sites iframes *require* event delegation and window-global functions.
- **Scaling:** `App.jsx` at 12k lines is approaching the limit of efficient AI processing; modularization is now a priority.
- **Vault Rules:** Videos stay external (YouTube/Vimeo); Docs/PDFs go to Repo (Vault).
- **Vite Base URL:** When using `base: '/RepoName/'`, file paths in code must respect this prefix (e.g., in `scan-vault.cjs`).

## Active Goal
- **Modularization:** Break down the 12k+ line `App.jsx` monolith into smaller, manageable components now that the Vault feature is complete.
- **Refactor:** Headless Verification, Preview Hardening, & Modularization.

## Next Step
- Begin extracting the **"Phase 1: Harvest"** (Content Ingestor/AI Studio Creator) logic from `App.jsx` into a separate file.

## Update (Jan 29, 2026)
- Fixed Master Shell header/brand text color on light backgrounds by deriving heading text from background brightness in `generateMasterShell`. (`src/App.jsx`)
- Added Google Sites-safe PDF embed handling (Docs Viewer fallback when inside iframes) to prevent Edge iframe blocking. (`src/App.jsx`)
- Switched PDF iframe fallback to `docs.google.com/viewer` for wider embed compatibility in Google Sites. (`src/App.jsx`)
- Forced Google Docs Viewer for PDFs when embedded in Google Sites or when `window.CF_FORCE_PDF_VIEWER` is set. (`src/App.jsx`)
- Fixed Asset Vault text visibility on light background by setting modal text color to black. (`src/components/VaultBrowser.jsx`)

## Update (Feb 2, 2026)
- Added refactor protocol rule note. (`.cursor/rules/REFACTOR_PROTOCOL.md`)
- Extracted Phase 4 export generators into a Node-safe module and rewired `App.jsx` to import them. (`src/utils/generators.js`, `src/App.jsx`)
- Added headless render/verify harness scripts and npm commands for output drift detection. (`scripts/render_exports.mjs`, `scripts/verify_exports.mjs`, `package.json`)
- Extracted `PROJECT_DATA` + `MASTER_SHELL` into constants module and rewired `App.jsx` imports. (`src/data/constants.js`, `src/App.jsx`)
- Extracted shared UI (`useToast`, `ToastContainer`, `CodeBlock`, `Toggle`) into a reusable component module. (`src/components/Shared.jsx`, `src/App.jsx`)
- Fixed a race condition in the headless export harness by preventing `render_exports.mjs` from auto-running when imported. (`scripts/render_exports.mjs`)
- Hardened Phase 2 Preview: scripts disabled by default with an explicit “Enable Scripts (Unsafe)” toggle, plus “Reset Preview” to force iframe remount; sandbox is now conditional. (`src/App.jsx`)
- Extracted Phase 5 settings UI into a dedicated component and rewired the app to use it. (`src/components/Phase5.jsx`, `src/App.jsx`)
- Extracted Phase 4 compile/export UI into a dedicated component and rewired the app to use it. (`src/components/Phase4.jsx`, `src/App.jsx`)
- Extracted Phase 3 manage/reset UI into a dedicated component and rewired the app to use it. (`src/components/Phase3.jsx`, `src/App.jsx`)
- Extracted Phase 2 preview/test UI into a dedicated component and rewired the app to use it. (`src/components/Phase2.jsx`, `src/App.jsx`)
- Extracted Phase 1 harvest UI into a dedicated component and rewired the app to use it. (`src/components/Phase1.jsx`, `src/App.jsx`)
- Extracted Phase 0 master shell UI into a dedicated component and rewired the app to use it. (`src/components/Phase0.jsx`, `src/App.jsx`)
- Extracted the unified error toast UI into its own component. (`src/components/ErrorDisplay.jsx`, `src/App.jsx`)
- Extracted the delete confirmation modal into its own component. (`src/components/ConfirmationModal.jsx`, `src/App.jsx`)
- Extracted the sidebar phase selector button into its own component. (`src/components/Section.jsx`, `src/App.jsx`)
- Extracted dependency-tracking helper into a dedicated utils module. (`src/utils/dependencies.js`, `src/App.jsx`)
- Extracted the preview modal into its own component. (`src/components/modals/PreviewModal.jsx`, `src/App.jsx`)
- Extracted the edit + version history modals into their own component. (`src/components/modals/EditModal.jsx`, `src/App.jsx`)
- Removed an unused duplicate `scopeCSS` helper from `App.jsx` (the canonical version already exists in `src/utils/cssHelpers.js`). (`src/App.jsx`)
- Extracted auto-load/auto-save localStorage persistence into a dedicated hook. (`src/hooks/useProjectPersistence.js`, `src/App.jsx`)
- Extracted unified error handling state/utilities into a dedicated hook. (`src/hooks/useAppError.js`, `src/App.jsx`)
- Extracted preview modal state (preview selection, script toggle, iframe remount nonce) into a dedicated hook. (`src/hooks/usePreviewState.js`, `src/App.jsx`)
- Extracted module editor state + save/revert logic into a dedicated hook and rewired the app to use it. (`src/hooks/useModuleEditor.js`, `src/App.jsx`)

## Update (Feb 8, 2026)
- Added an architecture map that documents canonical compile/export, preview, and verifier wiring paths. (`docs/ARCHITECTURE_MAP.md`)
- Added a dedicated output safety rule for preview/export parity, generator drift discipline, and verify-before-commit workflow. (`.cursor/rules/COURSE_FACTOR_OUTPUT_SAFETY.md`)
- Hardened export drift verification by switching manifest normalization to deep-stable JSON key sorting while preserving array order. (`scripts/verify_exports.mjs`)
- Re-baselined export hashes to match the corrected manifest normalization behavior. (`baselines/exports_baseline.json`)
- Added a compiler facade (`compileProjectToFilesMap`) for canonical files-map compilation and module HTML resolution. (`src/utils/compiler.js`)
- Routed course-module preview rendering through the canonical Beta module compiler path; retained fallback preview behavior for non-course items. (`src/App.jsx`, `src/utils/compiler.js`)
- Added a parity command to compare preview-compiled module HTML against export-compiled module HTML. (`scripts/exports_parity.mjs`, `package.json`)
- Added project schema versioning + migration pipeline with module defaults (`mode`, `activities`) during persistence load/save. (`src/utils/migrations.js`, `src/hooks/useProjectPersistence.js`, `src/data/constants.js`)
- Added Composer feature-flag defaults (`enableComposer`) plus module mode/activity persistence plumbing across module creation and edit/revert history. (`src/components/Phase1.jsx`, `src/hooks/useModuleEditor.js`, `src/utils/migrations.js`, `src/data/constants.js`)
- Added a Composer activity registry and compiler path; standalone modules in `mode: composer` now compile activities into module HTML for preview/export without altering existing custom HTML modules. (`src/composer/activityRegistry.js`, `src/composer/compileModuleHtml.js`, `src/utils/generators.js`)
- Added Composer toggle in Phase 5 settings and integrated a Composer editor mode in the module edit modal (activity add/remove/reorder/edit) behind the feature flag. (`src/components/Phase5.jsx`, `src/components/modals/EditModal.jsx`)
- Added a standalone Composer creation path in Phase 1 Module Manager so Composer modules can be created directly (not edit-only), with starter activity selection. (`src/components/Phase1.jsx`)
- Added Composer save hardening (auto-seed default activity if empty) and activity duplication control in the editor UX. (`src/hooks/useModuleEditor.js`, `src/components/modals/EditModal.jsx`)
- Added composer fixture verification and a release gate script (`verify -> parity -> fixtures`) for safer incremental activity expansion. (`scripts/verify_composer_fixtures.mjs`, `scripts/release_gate.mjs`, `package.json`)
- Removed accidental tracked generated artifacts with `* 2.html/json` suffix from `out/` so source history stays clean. (`out/beta/* 2.*`, `out/legacy_compiled 2.html`)
- Fixed composer legacy compile path to prefer activity compilation for `mode: composer` (ignore `rawHtml` fallback), removing blank exported composer views in Google Sites/legacy compile. (`src/utils/generators.js`)
- Hardened standalone module save behavior so composer-mode saves no longer persist `rawHtml` shells that bypass activity compilation. (`src/hooks/useModuleEditor.js`)
- Expanded Module Manager Composer creation UX to support full activity authoring before module creation (add/remove/reorder/duplicate/edit), eliminating the required “create then edit” loop. (`src/components/Phase1.jsx`)
- Expanded Composer activity system with:
  - `Image` block support
  - `Assessment Block` support (embed saved assessment HTML/script snapshots)
  - `Generate Report` improvements (copy/download/print report actions)
  - module-bank resource insertion from stored materials
  in both create and edit composer flows. (`src/composer/activityRegistry.js`, `src/composer/compileModuleHtml.js`, `src/components/Phase1.jsx`, `src/components/modals/EditModal.jsx`)
- Extended composer fixture verification to cover new activity types and guard against composer/rawHtml precedence regressions. (`scripts/verify_composer_fixtures.mjs`)

## Update (Feb 8, 2026 — Compile/Embed Stabilization)
- Fixed composer report actions in generated output by scoping runtime handlers to each submission block and preserving copy/download/print flows in compiled pages. (`src/composer/compileModuleHtml.js`, `src/composer/activityRegistry.js`)
- Added composer resource list parity with Materials behavior:
  - separate `viewUrl` + `downloadUrl`
  - inline viewer support
  - download button runtime handling
  - digital `Read` support in resource items
  (`src/composer/activityRegistry.js`, `src/composer/compileModuleHtml.js`)
- Added vault picker support for composer resource rows (view/download fields) in module creation flow. (`src/components/Phase1.jsx`)
- Extended edit modal resource rows to support `viewUrl`/`downloadUrl`/description + material-bank resource insertion parity. (`src/components/modals/EditModal.jsx`)
- Hardened preview/compiled sandbox capabilities for popup/print/download actions. (`src/hooks/usePreviewState.js`, `src/utils/generators.js`)
- Fixed legacy compile behavior so composer modules render directly in compiled shell instead of iframe fallback, preventing sandbox-related action failures. (`src/utils/generators.js`)
- Added URL resolution hardening for embed contexts (Google Sites/Googleusercontent) and asset-base aware path resolution for resource links. (`src/composer/compileModuleHtml.js`, `src/utils/generators.js`)
- Added composer resource digital-content enrichment from material bank matches (title/url match), including chapter-based reader support in compiled modules. (`src/utils/generators.js`, `src/composer/compileModuleHtml.js`)
- Added ZIP export bundling of local `materials/*` assets referenced by course materials and composer resource lists. (`src/components/Phase4.jsx`)
- Fixed Phase 4 dashboard overflow by hardening container width constraints and code block wrapping (`min-w-0`, `overflow-x-hidden`, `break-all`). (`src/App.jsx`, `src/components/Phase4.jsx`, `src/components/Shared.jsx`)

## Surgical Plan (Feb 8, 2026 — Composer Grid Layout + Drag/Drop)
### Goal
- Add module composer layout control with max 4 columns, side-by-side block placement, uneven rows (example: `3 + 1`), drag/drop ordering, and arrow controls (`Up/Down/Left/Right`).

### Scope (Do First)
1. Data model + migration (no breaking changes).
2. Compiler/rendering support (preview/export parity).
3. Editor UX in both composer flows (Phase 1 + Edit Modal).
4. Validation + fixtures + release checks.

### File-by-File Plan
1. `src/utils/migrations.js`
- Add composer layout defaults:
  - module-level `composerLayout.maxColumns` (default `1`, clamp `1..4`).
  - activity-level `layout.colSpan` (default `1`, clamp `1..maxColumns`).
- Auto-heal missing/invalid values during load.

2. `src/data/constants.js`
- Add default `composerLayout` in project/module seeds to keep new modules predictable.

3. `src/hooks/useModuleEditor.js`
- Persist `composerLayout` in save + history snapshots + revert flow.
- Ensure normalize/clamp runs on save.

4. `src/components/Phase1.jsx`
- In composer create flow:
  - Add module-level layout control (`Max columns: 1/2/3/4`).
  - Add per-activity width control (`Span: 1..maxColumns`).
  - Keep `Up/Down`, add `Left/Right`.
  - Arrow semantics:
    - `Left/Right` = move index `-1/+1`.
    - `Up/Down` = move index by `-maxColumns/+maxColumns` (grid row jump).
- Add drag-and-drop reordering for activity tiles (dnd-kit sortable grid).

5. `src/components/modals/EditModal.jsx`
- Mirror the same controls/behavior as Phase 1:
  - max columns selector
  - span selector
  - arrow movement semantics
  - drag/drop reorder
- Keep live preview enabled and driven by updated layout metadata.

6. `src/composer/compileModuleHtml.js`
- Render composer root as CSS grid:
  - `grid-template-columns: repeat(maxColumns, minmax(0, 1fr))`.
  - activity wrapper uses `grid-column: span colSpan`.
- Keep existing runtime features (submission/report/resource handlers) unchanged.

7. `src/utils/generators.js`
- Ensure composer compile calls pass module layout metadata through unchanged for preview/export/legacy paths.
- Confirm no rawHtml fallback path overrides composer layout.

8. `scripts/verify_composer_fixtures.mjs`
- Add fixture assertions for:
  - max columns rendering markers
  - colSpan markers
  - order persistence after compilation.

### Acceptance Criteria
1. In composer mode, user can set columns `1..4`.
2. Blocks can render side-by-side and produce uneven rows naturally.
3. Drag/drop updates order and survives save/reload.
4. Arrow controls work with new semantics and survive save/reload.
5. Preview, beta export, and legacy compile render the same block layout.
6. Existing composer modules without layout metadata still work (stacked/default).

### Execution Order (Fastest Path)
1. Migration + schema defaults.
2. Compiler grid rendering.
3. EditModal controls.
4. Phase1 controls.
5. Drag/drop integration.
6. Fixture/script updates + release check.

### Runbook After Implementation
- `npm run build`
- `npm run exports:fixtures`
- `npm run release:check`

## Update (Feb 10, 2026 — Tuesday Morning Fixes)
- Added composer text-style reset hardening for content/title blocks:
  - `Reset Style` now clears block style + body style overrides.
  - Added `Reset Body Style` in rich editor toolbars.
  - Body container override now defaults to block style unless explicitly changed.
  (`src/components/modals/EditModal.jsx`, `src/components/Phase1.jsx`, `src/composer/activityRegistry.js`)
- Added drag-and-drop hotspot authoring UI:
  - New hotspot editor with live image preview and draggable hotspot points.
  - Inline hotspot label/content editing in the same panel.
  (`src/components/composer/HotspotEditor.jsx`, `src/components/modals/EditModal.jsx`, `src/components/Phase1.jsx`)
- Updated hotspot output behavior:
  - Hotspot points render on-image at saved coordinates.
  - Hotspot detail panels show label + content (no coordinate text).
  (`src/composer/activityRegistry.js`)
- Workspace state note for this chat:
  - Intention is to revert to yesterday’s baseline in the work terminal and then re-apply these targeted fixes there.
  - Consolidated patch saved at `docs/patches/2026-02-10-tuesday-morning-fixes.patch`.
- Recovery diagnosis (missing work):
  - Multiple local clones were in use:
    - `/Users/deanguedo/Library/Mobile Documents/com~apple~CloudDocs/Course-factoryPERFECT`
    - `/Users/deanguedo/Documents/GitHub/Course-factoryPERFECT`
    - `/Users/deanguedo/Projects/Course-factoryPERFECT`
  - The iCloud workspace was behind the GitHub-backed repo and tracking a local-path remote (`/Users/deanguedo/Documents/GitHub/Course-factoryPERFECT`) rather than direct GitHub.
  - This mismatch explains why prior changes appeared to be missing when switching workspaces.

## Update (Feb 17, 2026 - Finlit + Composer UX Refinement)
- Finlit authoring in Module Manager was expanded so template-specific controls are practical during build:
  - Finlit optional controls are now collapsible.
  - Finlit options only surface when the effective template is `finlit`.
  - Additional Learning editing moved from tab-only behavior into an always-available editor block.
  - Additional Learning supports repeatable link rows with description text.
- Composer workspace was restructured for faster side-by-side authoring:
  - Left workspace pane now toggles between `Block Builder` and `Block Editor`.
  - Left pane and Preview pane can each be collapsed independently.
  - Preview now stays accessible while switching builder/editor context.
- Composer sizing controls were added to improve layout stability:
  - Preview width splitter.
  - Preview height control.
  - Builder height control.
  - Builder block width control.
  - `Lock Block Scale` option for deterministic puzzle-style block sizing.
- Builder grid/canvas sizing behavior was hardened:
  - Fixed-scale mode now uses deterministic width math (`columns x blockWidth`).
  - Scroll behavior preserves visibility instead of shrinking blocks as panes resize.
- Canvas reorganization behavior was improved to support insertion workflows:
  - Disabled forced vertical compaction in canvas layout handling.
  - Added `Gap Rows`, `Insert Above`, `Insert Below`, and `Add Bottom Rows` controls.
  - Added canvas min-height growth based on occupied rows + extra rows so lower drops are usable.
  - Applied non-compacting drag settings in both create and edit canvas grids.
- Primary files updated:
  - `src/components/Phase1.jsx`
  - `src/components/modals/EditModal.jsx`
  - `src/composer/layout.js`

## Update (Feb 17, 2026 - Canvas Interaction Rules Hardening)
- Added composer canvas undo/redo support with toolbar buttons and keyboard shortcuts:
  - Undo: `Ctrl/Cmd + Z`
  - Redo: `Ctrl/Cmd + Y` and `Ctrl/Cmd + Shift + Z`
  - History captures drag/resize as single interactions (not every frame update).
- Reworked drag behavior to reduce accidental cascade effects:
  - Drag movement can pass through blocks without repeated live push spam.
  - Drop on strong direct overlap performs replace/swap.
  - Drop between blocks uses push logic with strict push caps.
- Added strict push constraints to stop runaway row creation:
  - One push unit max per interaction.
  - Added bottom growth guard so collisions cannot keep creating rows repeatedly.
- Refined axis-specific resize behavior:
  - Horizontal resize adjusts nearby row neighbors directly.
  - Vertical resize pushes lower content only when needed.
- Final fix from this chat:
  - Vertical resize now pushes rows only on actual overlap collision, not when blocks are merely close.
- Primary file updated:
  - `src/components/Phase1.jsx`
