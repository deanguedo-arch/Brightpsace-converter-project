# Sandbox to Production Promotion Checklist

## Rules
- Sandbox code is preview-only.
- Sandbox files must never be included in SCORM builds.

## Promotion Steps
1. Capture the sandbox experiment objective and expected learner impact.
2. Port visual changes into:
   - `packages/theme/src/tokens.css`
   - `packages/theme/src/components.css`
   - `packages/theme/src/base.css` (only when globally applicable)
3. Update `packages/theme/examples/unit_gold.html` to reflect the promoted result.
4. Run:
   - `npm run cf:build -- <unitSlug> --scorm`
   - `npm run cf:validate`
5. Confirm guardrails pass:
   - no external URLs (unless allowlisted)
   - no inline styles
   - no unknown classes
6. Confirm sandbox files are excluded from production output.

## Required Evidence
- Before/after screenshots from preview mode.
- Validation output summary.
- Link to changed token/component classes.
