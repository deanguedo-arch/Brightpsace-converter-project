# Brightspace SCORM Import Guide

## Build Package
- Run `npm run cf:build -- <unitSlug> --scorm`
- Output zip appears at `dist/scorm/<courseSlug>/<unitSlug>.zip`

## Import in Brightspace
1. Open your Brightspace course.
2. Go to **Content**.
3. Select the destination module.
4. Choose **Upload/Create** -> **Import a File**.
5. Select the generated SCORM zip.
6. Wait for processing and publish if needed.

## Completion Tracking
- Learner completion is set via `cmi.core.lesson_status=completed`.
- Resume state is stored in `cmi.suspend_data`.

## Verification Checklist
- Launch item in Brightspace.
- Confirm page loads with local assets (no network dependency).
- Click **Mark complete** and verify completion status.
- Reopen and verify resume state restores.
