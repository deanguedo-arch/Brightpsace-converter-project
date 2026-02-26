# WORKLOG

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
