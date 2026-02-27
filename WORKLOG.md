# WORKLOG

## 2026-02-27

### Completed (Release + Compiler Hardening)
- Added quality scoring and release gates:
  - `cf score`
  - `cf build --gate --min-overall --min-dimension`
  - `cf release --scorm --min-overall --min-dimension`
- Added source-to-blueprint compiler command:
  - `cf compile <sourcePath> --course <courseSlug> --unit <unitSlug> --extract`
  - Supports both source directories and single source files.
- Added interactive directives end-to-end:
  - `:::scenario`
  - `:::ranking`
  - `:::decision-tree`
- Added Playwright smoke gate for release:
  - `scripts/playwright-smoke.mjs`
  - Exercises completion button + interactive controls.
- Fixed production/runtime blockers found during release verification:
  - compiler now filters code-like extracted text so launch summaries avoid code/linkified garbage
  - added missing `.scenario__outcome` class to theme CSS to satisfy unknown-class guardrail
  - hardened runtime state parsing so empty localStorage does not crash initialization
  - made CLI `release` test step Windows-safe (`cmd /c npm test`) to avoid spawn errors

### Verification Status (Release + Compiler Hardening)
- `cmd /c cf.cmd compile "C:\Users\dean.guedo\Downloads\CODE FOR CALM MODULE 1.docx" --course calm-course --unit module-1 --extract`: pass
- `cmd /c cf.cmd score calm-course module-1 --min-overall 4 --min-dimension 3`: pass
- `cmd /c cf.cmd release calm-course module-1 --scorm --min-overall 4 --min-dimension 3`: pass
- `cmd /c cf.cmd build calm-course module-1 --scorm --gate --min-overall 4 --min-dimension 3`: pass
- `cmd /c cf.cmd validate --brightspace calm-course module-1`: pass
- `npm test` (inside release): pass (13/13)

### Completed (Workbook Upgrade)
- Added a new `:::workbook` directive for high-interactivity, SCORM-safe activities in unit content.
- Implemented workbook parsing with YAML config support for:
  - `text`
  - `textarea`
  - `radio`
  - `checklist`
- Implemented workbook rendering in production output with:
  - structured form fields
  - per-workbook completion progress
  - semantic, accessible field wrappers
- Added runtime behavior for workbook fields:
  - persisted state via localStorage/SCORM state bridge
  - restore on reload
  - live completion progress updates
- Added workbook styling in theme CSS with responsive layout and completion states.
- Updated authoring scaffolds/import hints to include workbook usage.
- Upgraded `calm-course/module-1` with workbook activities:
  - Self-Inventory Snapshot
  - SMART Goal Builder
  - Support Plan Check-In

### Verification Status (Workbook Upgrade)
- `npm test`: pass
- `npm run cf:build -- calm-course module-1 --scorm`: pass
- `npm run cf:validate -- calm-course module-1`: pass
- Preview HTML confirms workbook blocks and field bindings:
  - `dist/preview/calm-course/module-1/index.html`

### Completed
- Built a one-shot PDF-to-unit conversion using only:
  - `EXAMPLES/CALM Module 1 - Personal Choices.pdf`
- Created new course/unit scaffold and authored premium interactive output:
  - `courses/calm-course/units/module-1/unit.yml`
  - `courses/calm-course/units/module-1/content.md`
  - `courses/calm-course/units/module-1/flashcards.csv`
  - `courses/calm-course/units/module-1/resources/CALM Module 1 - Personal Choices.pdf`
- Upgraded production theme quality for all units:
  - `packages/theme/src/tokens.css`
  - `packages/theme/src/base.css`
  - `packages/theme/src/components.css`
  - `packages/theme/src/runtime.js`
- Added runtime polish:
  - scroll progress bar
  - section reveal animations
  - retained SCORM/local state behavior

### Verification Status
- `npm test`: pass
- `npm run cf:build -- calm-course module-1 --scorm`: pass
- `npm run cf:validate -- calm-course module-1`: pass
- Preview served successfully at `http://localhost:4173`

### Output
- Preview:
  - `dist/preview/calm-course/module-1/index.html`
- SCORM:
  - `dist/scorm/calm-course/module-1.zip`

## 2026-02-26

### Completed
- Converted repo to CLI-first structure with workspaces:
  - `packages/core`
  - `packages/theme`
  - `packages/scorm`
  - `packages/cli`
- Added command set:
  - `cf doctor`
  - `cf init course ...`
  - `cf init unit ...`
  - `cf import ... --extract`
  - `cf preview ... --open --watch`
  - `cf build ... --scorm`
  - `cf validate --brightspace`
- Added SCORM 1.2 packaging and guardrails.
- Added local skills automation and installed manifest skills.
- Added example course/unit with working preview + SCORM zip output.
- Added docs:
  - `README.md`
  - `BRIGHTSPACE_IMPORT.md`
  - `PROMOTION_CHECKLIST.md`
  - `DEV_NOTES.md`
  - `AGENTS.md`

### Verification Status
- `npm test`: pass
- `npm run cf:doctor`: pass
- `npm run cf:build -- example-course unit-01 --scorm`: pass
- `npm run cf:validate -- example-course unit-01`: pass

### Continue From Any Terminal
1. Open terminal at repo root.
2. Run `npm run cf:doctor`.
3. If PATH is not refreshed yet, use:
   - `cf.cmd doctor` (CMD)
   - `powershell -ExecutionPolicy Bypass -File .\cf.ps1 doctor` (PowerShell)
   - or run `.\scripts\activate-tools.ps1` once per shell session.
4. Continue normal flow:
   - `npm run cf:init -- course <courseSlug> --default`
   - `npm run cf:init -- unit <courseSlug> <unitSlug>`
   - `npm run cf:import -- <sourcePath> --course <courseSlug> --unit <unitSlug> --extract`
   - `npm run cf:preview -- <courseSlug> <unitSlug> --open --watch`
   - `npm run cf:build -- <courseSlug> <unitSlug> --scorm`

### Source of Truth Files
- Agent rules: `AGENTS.md`
- Skill policy + list: `skills.manifest.json`
- Implementation notes: `DEV_NOTES.md`
- This running log: `WORKLOG.md`
