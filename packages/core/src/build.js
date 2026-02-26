import path from "node:path";
import { ingestUnit } from "./ingestUnit.js";
import { renderUnitToPreview } from "./renderUnit.js";
import { emptyDir } from "./fs.js";

export async function buildPreviewUnit({
  repoRoot,
  courseSlug,
  unitSlug,
  sandbox = false
}) {
  const unitModel = await ingestUnit(repoRoot, courseSlug, unitSlug);
  const outputDir = path.join(repoRoot, "dist", "preview", courseSlug, unitSlug);
  await emptyDir(outputDir);
  const rendered = await renderUnitToPreview({
    repoRoot,
    unit: unitModel,
    outputDir,
    sandbox
  });
  return {
    ...rendered,
    unitModel
  };
}
