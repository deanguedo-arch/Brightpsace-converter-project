# Local Skills Workflow

This project installs skills locally to keep the workflow reproducible.

## Install
1. Ensure Node LTS is installed and `npx` is on PATH.
2. Run:
   - `npm run skills:bootstrap`

## List and Check
- `npm run skills:list`
- `npm run skills:check`

## Trust Policy
- Allowed baseline publishers: `vercel-labs`, `anthropics`, `obra`.
- New community skills require review and explicit addition to `skills.manifest.json`.

## Why Local Install
- Team-consistent capabilities in this repo.
- No hidden global dependency drift.
- Easier onboarding and CI reproducibility.
