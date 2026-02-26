# DEV NOTES

## Refactor Objectives
- Build a CLI-first pipeline for authoring, preview, validation, and SCORM packaging.
- Preserve legacy Course Factory materials as reference only.
- Reduce manual effort with import scaffolding and local skill automation.

## Environment Findings
- `node`, `npm`, and `npx` are not currently on PATH in this shell.
- Attempted `winget install OpenJS.NodeJS.LTS`; installer was canceled during admin prompt flow.
- `.nvmrc` is set to Node `20` for project baseline compatibility.
- Installed Node LTS using `winget --scope user` (no admin). Runtime is available at:
  - `C:\\Users\\dean.guedo\\AppData\\Local\\Microsoft\\WinGet\\Packages\\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\\node-v24.14.0-win-x64`
- Installed Git using user-scope install for skill CLI clone support.

## Implementation Log
- Added npm workspace root and package scripts.
- Added local skill manifest and bootstrap/list/check scripts.
- Added project AGENTS rules and trigger map for installed skills.
- Added full CLI/core/theme/scorm implementation with guardrails and SCORM packaging.
- Added example course and validated end-to-end build to SCORM zip.
- Installed all manifest skills to `.agents/skills/*` with `npm run skills:bootstrap`.
- Added UX commands for lower manual effort:
  - `cf doctor`
  - `cf init course|unit`
  - `cf import --extract` (DOCX/PDF text extraction)
  - `cf preview --open --watch`

## Defaults
- SCORM target is 1.2 only.
- `course.yml` with `default: true` resolves the default course.
- Production output prohibits external URLs, inline styles, and unknown classes.
