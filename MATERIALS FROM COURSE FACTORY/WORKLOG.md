# Work Log (2026-02-13)

## Context
- Goal: Improve Module Composer usability and visual output quality while keeping changes stability-first.
- Branch state at time of work:
  - `master` with local commits on top of `origin/master`.
  - Workspace contained build output changes in `dist/` (treated as an artifact and intentionally left uncommitted).

## Summary Of Implemented Improvements

### 1) Module Composer: Outline, Issues, Templates, Vault Folder Import
- Added a left-panel mode switch for composer activities:
  - `Grid` (existing), plus `Outline`, `Issues`, and `Templates`.
- Added activity templates:
  - Save the currently selected activity as a template.
  - Insert a template as a new activity.
  - Stored in browser `localStorage`.
- Added a validation-backed Issues panel:
  - Shows warnings/errors per activity with click-to-jump.
- Added Vault folder import for `resource_list` activities:
  - Select a folder in Vault Browser.
  - Append every file in that folder to the resource list.

### 2) Settings: Theme Packs
- Added one-click "Theme Packs" in Phase 5 to apply coherent visual defaults (accent/background/text/button/container/font/material theme) at once.
- Tracks the current selected pack via a `visualThemePack` field in `Course Settings` (falls back to `custom` when not set).

## File-Level Change Log

### `src/components/composer/ComposerSidebarTools.jsx`
- New component that powers the composer left-panel non-grid modes:
  - `Outline` mode: search + jump + quick duplicate/delete.
  - `Issues` mode: validation list + click-to-select.
  - `Templates` mode: save/insert/delete templates.
- Local template storage:
  - Key: `course_factory_composer_activity_templates_v1`
  - Max templates: 50

### `src/composer/activityRegistry.js`
- Added validation helpers:
  - `validateComposerActivity(activity)` returns issues for one activity.
  - `validateComposerActivities(activities)` returns issues for the full list.
- Checks are intentionally lightweight and focused on common authoring footguns:
  - Missing `embed_block.url`, missing `image_block.url`, empty `resource_list.items`, rubric size clamping warnings, etc.

### `src/components/Phase1.jsx`
- Integrated `ComposerSidebarTools` into Module Manager composer mode:
  - Adds left-panel tabs: `Grid / Outline / Issues / Templates`.
  - Uses the new validation functions for Issues view.
  - Adds template insertion (`addComposerActivityFromTemplate`).
- Vault Browser enhancements in composer workflows:
  - Resource list: new `Import Vault Folder` button.
  - Vault Browser is opened in `folder` selection mode for that action.
  - Folder import appends items using `src/data/vault.json` paths under `/Course-factoryPERFECT/materials/...`.
- Updated Vault selection handler to support:
  - `{ kind: 'vault-file', file }`
  - `{ kind: 'vault-folder', segments }`

### `src/components/VaultBrowser.jsx`
- Extended props:
  - `mode = 'file'` (default)
  - `mode = 'folder'` enables a "Use This Folder" action in the current breadcrumb folder.
- Updated `onSelect` payload shape:
  - File: `{ kind: 'vault-file', file }`
  - Folder: `{ kind: 'vault-folder', segments }`

### `src/components/Phase5.jsx`
- Added Theme Packs UI and application logic.
- Uses a stable accent swatch map (hex) to avoid dynamic Tailwind class generation issues.
- Pack application updates multiple `Course Settings` fields in one click.

## How It Works (Nuts And Bolts)

### Composer activity validation
- Validation lives in `src/composer/activityRegistry.js` so it can be reused by other UIs in the future.
- Each validation result is a list of `{ level: 'error' | 'warn', message: string }`.
- The Issues panel is just a view over `validateComposerActivities(...)`, not a separate rules system.

### Templates
- A template stores:
  - `activity.type`
  - a deep-cloned `activity.data`
  - a lightweight `layout.colSpan`
- Insert creates a new activity id and positions it at the end of the grid (next row).

### Vault folder import
- Vault index is a flat list of file records in `src/data/vault.json`.
- Selecting a folder provides a segment array (breadcrumb).
- Import builds a prefix like:
  - `/Course-factoryPERFECT/materials/<segments...>/`
- Then filters vault files by that prefix and appends missing items into the current `resource_list.items`.

### Theme packs
- Theme packs are curated sets of settings updates.
- Clicking a pack calls `updateSettings({ ...pack.updates, visualThemePack: pack.id })`.
- The existing "Reset to Functional Visual Defaults" button remains available.

## Validation / Smoke Checks Performed
- Production build completed successfully via repo-local Node:
  - `npm run build`

## Known Limitations / Notes
- `dist/` is still a build artifact and will change on each build. Keep it uncommitted unless you explicitly decide to commit build output.
- Templates are stored per-browser/per-machine (localStorage), not in project JSON.
- Vault folder import uses the Vault index file list; it assumes `scripts/scan-vault.cjs` is kept up to date when adding/removing files.

## Next Steps (Optional)
- Add an "Include subfolders" toggle for Vault folder import.
- Expand validation rules for more activity types as you find recurring authoring errors.
- Add a "duplicate + insert below" convenience action and/or drag handles in Outline view.

## Update (2026-02-17)

### Scope Completed In This Session
- Fixed M0 regressions:
  - Cleared text no longer auto-reappears for `title_block`, `knowledge_check`, and worksheet title blocks.
  - Space key/input editing works in worksheet and knowledge-check editors (drag now starts from handle only).
- Implemented template/layout foundation and editor parity:
  - Course defaults: `templateDefault`, `themeDefault`.
  - Module overrides: `template`, `theme`.
  - Composer layout modes: `simple` + `canvas`.
  - Activity metadata support: `layout`, `style`, `behavior`.
- Added container activity support:
  - `tab_group` and `card_list`.
  - `card_list` now supports reference target, single inline activity, and inline `activities[]`.
- Added template compiler pipeline support:
  - `deck`, `finlit`, `coursebook`, `toolkit_dashboard`.
  - Theme packs: `dark_cards`, `finlit_clean`, `coursebook_light`, `toolkit_clean`.
- Upgraded create/edit UIs:
  - `Phase1` and `EditModal` now both support template/theme overrides, layout mode toggle, canvas controls, and activity style/behavior controls.
  - Canvas drag/resize integrated with `react-grid-layout`.
- Added canvas overlap safety fix:
  - In canvas output, each cell now clips/scrolls internal content instead of spilling into neighboring cells.

### Key Files Touched
- `src/components/Phase1.jsx`
- `src/components/modals/EditModal.jsx`
- `src/components/Phase5.jsx`
- `src/composer/activityRegistry.js`
- `src/composer/compileModuleHtml.js`
- `src/composer/layout.js`
- `src/hooks/useModuleEditor.js`
- `src/utils/migrations.js`
- `src/utils/generators.js`
- `src/data/constants.js`
- `scripts/release_gate.mjs`
- `package.json`

### Validation Results
- `build`: passed
- `exports:verify`: passed
- `exports:parity`: passed
- `exports:fixtures`: passed
- `release:check`: passed

### Notes For Next Chat
- Repo-wide lint is still noisy due many pre-existing issues (including generated `.vite` deps and legacy code); not fully addressed in this session.
- Export baseline and generated output artifacts were refreshed during verification:
  - `baselines/exports_baseline.json`
  - `out/**`
  - `dist/**`
- If continuing immediately, next practical pass is targeted UX polish and guardrails around canvas sizing defaults, then fixture expansion for new container combinations.

## Update (2026-02-17 - Finlit + Composer Manageability Pass)

### Requested Outcomes
- Make finlit-specific options easier to work with while building.
- Remove dependence on tab switching for Additional Learning authoring.
- Keep block authoring controls beside live preview.
- Make builder/preview panes collapsible and resizable.
- Stop canvas reorg friction when inserting blocks between existing rows.

### Implemented UX Changes

### 1) Finlit optional editing improvements
- Finlit optional controls now behave as a collapsible authoring block.
- Finlit options are only shown when the active/effective template is `finlit`.
- Additional Learning editing was made persistent in authoring flow (not tab-gated only).
- Additional Learning supports repeatable links with per-link description text.

### 2) Composer workspace restructuring
- Composer left workspace and preview are now organized side by side.
- Left workspace pane has a mode toggle:
  - `Block Builder`
  - `Block Editor`
- Both panes support independent collapse/expand controls.
- Preview remains visible while switching left-pane mode.

### 3) Workspace sizing controls
- Added Preview Width splitter control.
- Added Preview Height control.
- Added Builder Height control.
- Added Builder Block Width control (`px per column`).
- Added `Lock Block Scale` to preserve stable block sizing while resizing panes.
- Builder width math is deterministic in lock mode:
  - `builderCanvasWidth = maxColumns * blockWidth`

### 4) Canvas reorganization improvements
- Removed forced canvas compaction in normalization so intentional gaps persist.
- Applied non-compacting RGL options:
  - `compactType={null}`
  - `verticalCompact={false}`
  - `preventCollision={false}`
- Added canvas insertion tools in Phase1 builder controls:
  - `Gap Rows` (1..12)
  - `Insert Above` (selected block)
  - `Insert Below` (selected block)
  - `Add Bottom Rows` (open space at canvas bottom)
- Added helper to shift canvas items downward from a target row to create insertion space.
- Added canvas min-height growth from occupied rows + extra rows so bottom drops are available.

### File-Level Notes
- `src/components/Phase1.jsx`
  - Workspace/pane layout controls.
  - Finlit optional/editor UX updates.
  - Builder scale and viewport controls.
  - Canvas gap insertion controls and shift logic.
  - Canvas min-height calculation.
- `src/components/modals/EditModal.jsx`
  - Non-compacting canvas grid behavior aligned with Phase1.
- `src/composer/layout.js`
  - Removed post-placement canvas compaction step.
  - Preserved intentional author-created gaps.

### Behavior Notes For Next Session
- Canvas now supports both direct drag placement and explicit row insertion workflows.
- If a stricter behavior is desired, `Lock Block Scale` can be forced on by default and/or made non-optional.
- A future enhancement candidate is explicit drop mode selection:
  - `Insert` mode (current bias)
  - `Swap/Replace` mode

### Validation Notes
- This pass was verified by code inspection and targeted diffs.
- Full build/lint was not executed in this environment during this pass.

## Update (2026-02-17 - Canvas Drag/Resize Collision Rules + Undo/Redo)

### Requested Behavior (This Sequence)
- Stop repeated row push while hovering during drag.
- Cap push behavior to one row/unit.
- Add undo/redo controls for composer authoring.
- Support replace-on-top and push-in-between drop semantics.
- Make resize behavior axis-aware.
- Final refinement: vertical resize should push only on real overlap, not proximity.

### Implemented

### 1) Undo/redo system for composer workspace
- Added snapshot-based history with bounded stack sizes.
- Added toolbar actions in composer workspace:
  - `Undo`
  - `Redo`
- Added keyboard shortcuts:
  - `Ctrl/Cmd + Z` -> Undo
  - `Ctrl/Cmd + Y` -> Redo
  - `Ctrl/Cmd + Shift + Z` -> Redo
- Interaction batching:
  - Drag/resize interactions are captured as one history step on stop events.

### 2) Drag movement behavior change
- Disabled live drag collision mutations to prevent repeated push while hovering.
- Drag now resolves placement on stop/drop rather than continuously during movement.

### 3) Drop rules
- Added replace/swap on direct strong overlap drops.
- Added between-drop push path when overlap is not treated as replace.
- Added strict push caps so one interaction cannot create runaway rows.

### 4) Resize rules (axis-aware)
- Horizontal resize:
  - Actively adjusts neighbors in the same band/row by shifting and shrinking.
- Vertical resize:
  - Push logic is applied only where collisions are real.
  - Final patch enforces overlap-only push; nearby non-overlapping rows no longer move.

### 5) Safety guards
- Added bottom growth guard for non-active blocks to cap push side effects.
- Preserved one-unit push limit semantics across drag/resize collision resolution.

### File-Level Detail
- `src/components/Phase1.jsx`
  - Added history refs/state and snapshot helpers.
  - Added undo/redo handlers and shortcut listener.
  - Added interaction lifecycle handlers (`onDragStart/onDragStop/onResizeStart/onResizeStop`).
  - Reworked collision resolver for:
    - replace vs push drop behavior
    - capped push limits
    - axis-aware resize outcomes
    - overlap-only vertical push.

### Validation
- Build succeeded after each major iteration using repo-local node runtime:
  - `node node_modules/vite/bin/vite.js build`

### Current Behavioral Intent
- Drag:
  - Pass-through during movement.
  - Replace on strong/direct overlap at drop.
  - Push-between at drop with hard cap.
- Resize:
  - Horizontal -> adjust horizontal neighbors.
  - Vertical -> push only on actual overlap collisions.

## Update (2026-02-19 - FinLit Tab-Scoped Composer + Preview Focus)

### Requested Outcomes
- Convert FinLit tabs from selector-only to independently editable tab-local composer content.
- Keep backward compatibility with legacy FinLit modules.
- Ensure preview follows the tab being edited instead of resetting to first tab.
- Add quality-of-life controls for composer workspace ergonomics.

### Implemented

### 1) FinLit data model and compatibility
- Extended FinLit tabs to support local activities per tab:
  - `module.finlit.tabs[] = { id, label, activityIds?, activities?, links }`
- Kept legacy compatibility fields and behavior:
  - `activitiesTabLabel`, `additionalTabLabel`, `additionalLinks`, `activityIds`.
- Core-tab policy updated:
  - `activities` remains required.
  - `additional` is optional/removable.
- Added conversion + normalization utility for legacy modules:
  - Converts `activityIds` tabs to local `tab.activities`.
  - Ensures unique activity IDs across all tab-local lists.
  - Keeps canonical `module.activities` synced to `activities` tab.

### 2) Authoring surfaces (Phase1 + EditModal)
- Added FinLit authoring-tab state in both surfaces.
- Added explicit tab action in FinLit options:
  - `Open In Builder` / `Editing This Tab`
- Routed composer mutations (add/edit/move/delete/reorder) through active FinLit tab.
- Preserved shared layout settings across tabs.
- Added FinLit hero media vault selection in both flows (single-file path into media URL).

### 3) Compile/runtime behavior
- FinLit compile now renders per-tab content priority:
  1. `tab.activities` (new primary model, full layout render)
  2. legacy `tab.activityIds` mapped to module activities
  3. legacy tab-group fallback where applicable
- Preview can pass active tab (`finlitActiveTabId`) into compile output.
- Runtime tab initialization now respects pre-selected active tab and no longer always clicks the first tab.

### 4) Preview follow-scroll behavior
- Preview follow now targets active tab panel first, then selected `data-activity-id`.
- Follow-scroll is no longer triggered by unrelated FinLit options edits.
- Follow-scroll remains active for actual block selection/edit activity updates.

### 5) Composer workspace controls collapse
- Added a dedicated `Show Controls / Hide Controls` toggle for the workspace controls strip in Phase1.
- Collapses/expands:
  - Preview Width
  - Preview Height
  - Builder Height
  - Block Width
  - Lock Block Scale
- Added draft persistence for this collapsed state in module manager draft payloads.

### Key Files
- `src/utils/finlitHero.js`
- `src/utils/finlitTabActivities.js` (new)
- `src/hooks/useModuleEditor.js`
- `src/components/Phase1.jsx`
- `src/components/modals/EditModal.jsx`
- `src/composer/compileModuleHtml.js`

### Validation
- `npm run build`: passed
- `npm run exports:fixtures`: passed
- `npm run lint`: fails due large pre-existing repo/global lint debt (including generated `.vite` deps and unrelated legacy files), not introduced by this pass.
