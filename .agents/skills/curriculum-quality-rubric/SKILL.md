---
name: curriculum-quality-rubric
description: Score a Brightspace/SCORM unit against a strict quality rubric and produce concrete upgrade actions. Use when reviewing generated course quality, comparing versions, or deciding if a unit is ready to ship.
---

# Curriculum Quality Rubric

Use this skill to evaluate whether a generated unit is actually high quality, not just valid.

## When To Use
- User asks if a unit is "good enough", "better than Canvas", "premium", or "ready".
- Before packaging SCORM for delivery.
- When comparing two unit versions.
- When planning upgrades for weak course content.

## Inputs
- Unit files:
  - `courses/<courseSlug>/units/<unitSlug>/content.md`
  - `courses/<courseSlug>/units/<unitSlug>/unit.yml`
  - `courses/<courseSlug>/units/<unitSlug>/resources/*`
- Build outputs:
  - `dist/preview/<courseSlug>/<unitSlug>/index.html`
  - `dist/scorm/<courseSlug>/<unitSlug>.zip`

## Required Verification
Run and report:
1. `npm test`
2. `npm run cf:build -- <courseSlug> <unitSlug> --scorm`
3. `npm run cf:validate -- <courseSlug> <unitSlug>`

If any command fails, stop and report blockers before scoring.

## Rubric Dimensions
Score each dimension 0-5. Use [references/rubric.md](references/rubric.md).

1. Pedagogy and clarity
2. Activity richness and interaction density
3. Assessment quality and feedback loops
4. Accessibility and readability
5. Production safety (SCORM/Brightspace/offline compliance)
6. Visual hierarchy and UI quality

## Pass/Fail Gate
- Ship-ready requires:
  - No failed verification commands
  - No dimension below 3
  - Average score >= 4.0

## Output Format
Return:
1. Score table by dimension.
2. Top 5 gaps with file references.
3. A prioritized fix plan:
   - `Must fix now`
   - `Should fix next`
   - `Nice to have`
4. Final verdict: `Not Ready`, `Conditional`, or `Ship Ready`.

## Guidance
- Be strict and specific.
- Prefer concrete edits over general advice.
- Tie each finding to a file path and observable behavior.
