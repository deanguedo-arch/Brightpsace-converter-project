import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { generateScorm12Manifest } from "./manifest.js";
import { getScormWrapperScript } from "./wrapper.js";

async function listFilesRecursive(rootDir) {
  const files = [];
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  await walk(rootDir);
  return files;
}

function normalizeRel(filePath, rootDir) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function injectWrapper(html) {
  const scriptTag = '<script src="scorm-wrapper.js"></script>';
  if (html.includes(scriptTag)) return html;
  const runtimePattern = /<script\s+src="([^"]*runtime\.js)"><\/script>/i;
  if (runtimePattern.test(html)) {
    return html.replace(runtimePattern, `${scriptTag}\n    <script src="$1"></script>`);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `  ${scriptTag}\n</body>`);
  }
  return `${html}\n${scriptTag}\n`;
}

export async function packageUnitAsScorm12({
  previewDir,
  outZipPath,
  courseSlug,
  unitSlug,
  title
}) {
  const zip = new JSZip();
  const previewFiles = await listFilesRecursive(previewDir);
  if (previewFiles.length === 0) {
    throw new Error(`Preview directory has no files: ${previewDir}`);
  }
  const manifestFiles = [];

  for (const absolutePath of previewFiles) {
    const rel = normalizeRel(absolutePath, previewDir);
    if (rel === "index.html") {
      const html = await fs.readFile(absolutePath, "utf8");
      zip.file(rel, injectWrapper(html));
      manifestFiles.push(rel);
      continue;
    }
    const bytes = await fs.readFile(absolutePath);
    zip.file(rel, bytes);
    manifestFiles.push(rel);
  }

  zip.file("scorm-wrapper.js", getScormWrapperScript());
  manifestFiles.push("scorm-wrapper.js");
  zip.file(
    "imsmanifest.xml",
    generateScorm12Manifest({
      courseSlug,
      unitSlug,
      title,
      files: manifestFiles
    })
  );

  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });
  await fs.mkdir(path.dirname(outZipPath), { recursive: true });
  await fs.writeFile(outZipPath, bytes);
  return outZipPath;
}
