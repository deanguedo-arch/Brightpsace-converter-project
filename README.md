# Brightspace Course Builder (CLI-first)

Build premium, single-scroll learning units and package them as SCORM 1.2 zips for Brightspace.

## What This Repo Does
- Ingests unit folders (`unit.yml`, `content.md`, optional `flashcards.csv`, optional `resources/*`).
- Compiles standalone offline-safe HTML previews.
- Packages one SCORM 1.2 zip per unit.
- Enforces build guardrails for Brightspace readiness.

Legacy reference code is preserved under:
- `MATERIALS FROM COURSE FACTORY/`

## Prerequisites
1. Install Node LTS (20+ recommended) so `node`, `npm`, and `npx` are on PATH.
   - No-admin option (user scope): `winget install --id OpenJS.NodeJS.LTS -e --scope user --silent --accept-source-agreements --accept-package-agreements`
2. From repo root, run:
   - `npm install`

If PATH is not refreshed yet, restart your terminal or prepend:
- `C:\\Users\\<you>\\AppData\\Local\\Microsoft\\WinGet\\Packages\\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\\node-v24.14.0-win-x64`

No-PATH fallback (works immediately):
- CMD: `cf.cmd doctor`
- PowerShell with policy bypass: `powershell -ExecutionPolicy Bypass -File .\cf.ps1 doctor`
- Optional shell activation: `.\scripts\activate-tools.ps1`

## Skill Setup (Project-local)
- `npm run skills:bootstrap`
- `npm run skills:list`
- `npm run skills:check`

Skill manifest source of truth:
- `skills.manifest.json`

## Authoring Contract
```
courses/<courseSlug>/
  course.yml
  units/
    <unitSlug>/
      unit.yml
      content.md
      flashcards.csv           (optional)
      resources/               (optional)
```

## CLI Commands
- Health check:
  - `npm run cf:doctor`
  - or `.\cf.ps1 doctor`
- Scaffold:
  - `npm run cf:init -- course my-course --title "My Course" --default`
  - `npm run cf:init -- unit my-course unit-01 --title "Unit 01"`
- `npm run cf:import -- <sourcePath> --course example-course --unit unit-01`
- `npm run cf:import -- <sourcePath> --course example-course --unit unit-01 --extract`
- `npm run cf:compile -- <sourcePath> --course example-course --unit unit-01 --extract`
- `npm run cf:preview -- unit-01`
- `npm run cf:preview -- unit-01 --open --watch`
- `npm run cf:preview -- example-course unit-01 --mode=sandbox`
- `npm run cf:build -- unit-01 --scorm`
- `npm run cf:build -- example-course unit-01 --scorm`
- `npm run cf:build -- --all --scorm`
- `npm run cf:build -- example-course --all --scorm`
- `npm run cf:build -- example-course unit-01 --scorm --gate --min-overall 4 --min-dimension 3`
- `npm run cf:score -- example-course unit-01 --min-overall 4 --min-dimension 3`
- `npm run cf:release -- example-course unit-01 --scorm --min-overall 4 --min-dimension 3`
- `npm run cf:validate -- example-course unit-01`

## User-Friendly Workflow
1. `npm run cf:doctor`
2. `npm run cf:init -- course my-course --default`
3. `npm run cf:compile -- <raw-folder-or-file> --course my-course --unit unit-01 --extract`
4. `npm run cf:preview -- my-course unit-01 --open --watch`
5. `npm run cf:release -- my-course unit-01 --scorm --min-overall 4 --min-dimension 3`

`--extract` currently ingests text from `.docx` and `.pdf` files when present, and `cf compile` accepts either a folder path or a single file path.

## Output Paths
- Preview:
  - `dist/preview/<courseSlug>/<unitSlug>/index.html`
- SCORM:
  - `dist/scorm/<courseSlug>/<unitSlug>.zip`

## Brightspace Notes
- SCORM target is **SCORM 1.2 only**.
- Completion uses `cmi.core.lesson_status=completed`.
- Resume data uses `cmi.suspend_data`.

See:
- `BRIGHTSPACE_IMPORT.md`
- `PROMOTION_CHECKLIST.md`
- `DEV_NOTES.md`
