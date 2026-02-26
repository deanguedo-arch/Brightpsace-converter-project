# Project Agent Rules

## Mission
- This repository is a CLI-first Brightspace course builder.
- Build premium single-scroll units and package SCORM 1.2 zips.
- Keep `MATERIALS FROM COURSE FACTORY/` as reference only unless migration is explicitly requested.

## Skill Source Policy
- Trust baseline publishers first: `vercel-labs`, `anthropics`, `obra`.
- Community skills are allowed only after explicit review and addition to `skills.manifest.json`.
- Install skills project-locally and target the `codex` agent.

## Installed Skill Trigger Map
- `find-skills`: use when asked to discover or install agent skills.
- `web-design-guidelines`: use for visual hierarchy, layout quality, and web polish decisions.
- `frontend-design`: use for component-level UX implementation and styling decisions.
- `brand-guidelines`: use when creating or applying visual voice/themes.
- `theme-factory`: use when generating or refactoring reusable theme token systems.
- `webapp-testing`: use when defining browser/UI test strategy and test coverage.
- `executing-plans`: use when implementing phased plans with strict sequencing.
- `test-driven-development`: use for feature-level red/green/refactor loops.
- `systematic-debugging`: use for bug triage and root-cause workflows.
- `verification-before-completion`: use before declaring tasks complete.

## Core Technical Constraints
- SCORM version: 1.2 only.
- Unit output: one scroll page per unit.
- Production output must be offline-safe: no CDN/font/network dependencies unless allowlisted.
- Preview must serve compiled output only.
- Guardrails must run on SCORM builds:
  - fail on inline styles
  - fail on unknown classes
  - fail on external URLs unless allowlisted
