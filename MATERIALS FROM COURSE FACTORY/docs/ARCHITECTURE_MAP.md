# Course Factor Architecture Map

## Canonical Data
- Primary module source of truth: `projectData["Current Course"].modules`
- Global feature source: `projectData["Global Toolkit"]`
- Course-wide settings source: `projectData["Course Settings"]`

## Compile/Export Pipeline
- Core generators live in `src/utils/generators.js`.
- Canonical Beta file-map builder: `buildStaticFilesBetaFromProject` in `src/utils/generators.js`.
- Beta structure generator chain:
  - `buildStaticFilesBeta` in `src/utils/generators.js`
  - `buildBetaManifest` in `src/utils/generators.js`
  - `generateHubPageBeta` in `src/utils/generators.js`
  - `generateModuleHtmlBeta` in `src/utils/generators.js`
  - `buildModuleFrameHTML` in `src/utils/generators.js`
- Legacy output generator: `buildLegacyCompiledHtml` in `src/utils/generators.js`.

## Verification Harness
- Render script: `scripts/render_exports.mjs`.
  - Loads baseline JSON from `baselines/project_baseline.json`.
  - Writes generated outputs into `out/legacy_compiled.html` and `out/beta/*`.
- Drift verifier: `scripts/verify_exports.mjs`.
  - Hashes generated content and compares against `baselines/exports_baseline.json`.
  - Normalizes unstable timestamp fields before hashing.
- NPM entrypoints in `package.json`:
  - `exports:render`
  - `exports:baseline`
  - `exports:verify`

## Preview Pipeline (Current)
- Preview state and iframe security toggles live in `src/hooks/usePreviewState.js`.
- Preview modal UI lives in `src/components/modals/PreviewModal.jsx`.
- App wiring currently builds preview HTML directly via:
  - `buildModuleFrameHTML(previewModule, projectData["Course Settings"])` in `src/App.jsx`.
- Planned parity target: preview should resolve module HTML from the same canonical Beta files map used by export.

## Module Authoring Paths
- Module creation (Harvest / Phase 1):
  - `addStandaloneModule` in `src/components/Phase1.jsx`
  - `addExternalLinkModule` in `src/components/Phase1.jsx`
- Module editing:
  - State + save/revert logic in `src/hooks/useModuleEditor.js`
  - UI editor modal in `src/components/modals/EditModal.jsx`

## Export UI/Actions
- Compile/publish UI in `src/components/Phase4.jsx`.
- Full publish calls `buildStaticFilesBeta` wrapper in `src/components/Phase4.jsx`.
- Delta publish calls `buildDeltaFilesBeta` in `src/components/Phase4.jsx`.
- ZIP packing/downloading happens in `downloadZipFromFilesMap` in `src/components/Phase4.jsx`.

## Current Risk Hotspots
- Preview context mismatch risk:
  - Export path passes `__toolkit`, `__materials`, and `ignoreAssetBaseUrl` in `generateModuleHtmlBeta`.
  - App preview path currently passes only raw course settings in `src/App.jsx`.
- Generated artifacts in tracked paths (`out/`, `dist/`) can create noisy workspace drift and should not be treated as source edits.
