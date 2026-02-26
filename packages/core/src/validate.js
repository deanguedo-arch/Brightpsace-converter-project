import fs from "node:fs/promises";
import path from "node:path";
import { listFilesRecursive } from "./fs.js";

const EXTERNAL_URL_PATTERN = /https?:\/\/[^\s"'<>]+/g;
const INLINE_STYLE_PATTERN = /\bstyle\s*=\s*["'][^"']*["']/gi;
const CLASS_ATTR_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/gi;
const ASSET_ATTR_PATTERN = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;

function parseCssClassNames(cssText) {
  const names = new Set();
  const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match = regex.exec(cssText);
  while (match) {
    names.add(match[1]);
    match = regex.exec(cssText);
  }
  return names;
}

function isAllowlistedExternal(url, allowlist) {
  return allowlist.some((entry) => url.startsWith(entry));
}

function shouldIgnoreClass(className) {
  return className.startsWith("language-") || className.startsWith("hljs");
}

function shouldCheckAssetRef(reference) {
  if (!reference) return false;
  if (reference.startsWith("#")) return false;
  if (reference.startsWith("mailto:")) return false;
  if (reference.startsWith("tel:")) return false;
  if (reference.startsWith("javascript:")) return false;
  if (reference.startsWith("data:")) return false;
  if (reference.startsWith("http://") || reference.startsWith("https://")) return false;
  return true;
}

export async function validateBrightspaceBuild({
  buildDir,
  externalAllowlist = []
}) {
  const errors = [];
  const warnings = [];
  const files = await listFilesRecursive(buildDir);
  const textFiles = files.filter((filePath) => /\.(html|css|js)$/i.test(filePath));

  const allowedClasses = new Set();
  for (const cssFile of textFiles.filter((filePath) => filePath.endsWith(".css"))) {
    const cssText = await fs.readFile(cssFile, "utf8");
    for (const className of parseCssClassNames(cssText)) {
      allowedClasses.add(className);
    }
  }

  for (const filePath of textFiles) {
    const rel = path.relative(buildDir, filePath).split(path.sep).join("/");
    const content = await fs.readFile(filePath, "utf8");

    const externalMatches = content.match(EXTERNAL_URL_PATTERN) || [];
    for (const url of externalMatches) {
      if (!isAllowlistedExternal(url, externalAllowlist)) {
        errors.push(`${rel}: external URL not allowed -> ${url}`);
      }
    }

    if (filePath.endsWith(".html")) {
      const inlineStyleMatches = content.match(INLINE_STYLE_PATTERN) || [];
      if (inlineStyleMatches.length > 0) {
        errors.push(`${rel}: inline style attributes are not allowed.`);
      }

      CLASS_ATTR_PATTERN.lastIndex = 0;
      let classMatch = CLASS_ATTR_PATTERN.exec(content);
      while (classMatch) {
        const classes = classMatch[1].split(/\s+/).filter(Boolean);
        for (const className of classes) {
          if (shouldIgnoreClass(className)) continue;
          if (!allowedClasses.has(className)) {
            errors.push(`${rel}: unknown class "${className}"`);
          }
        }
        classMatch = CLASS_ATTR_PATTERN.exec(content);
      }

      ASSET_ATTR_PATTERN.lastIndex = 0;
      let assetMatch = ASSET_ATTR_PATTERN.exec(content);
      while (assetMatch) {
        const reference = assetMatch[1];
        if (!shouldCheckAssetRef(reference)) {
          assetMatch = ASSET_ATTR_PATTERN.exec(content);
          continue;
        }
        const localPath = reference.startsWith("/")
          ? path.join(buildDir, reference.slice(1))
          : path.resolve(path.dirname(filePath), reference);
        const exists = await fs.stat(localPath).then(() => true).catch(() => false);
        if (!exists) {
          errors.push(`${rel}: missing referenced asset "${reference}"`);
        }
        assetMatch = ASSET_ATTR_PATTERN.exec(content);
      }
    }
  }

  let totalBytes = 0;
  for (const filePath of files) {
    const stats = await fs.stat(filePath);
    totalBytes += stats.size;
    if (stats.size > 20 * 1024 * 1024) {
      warnings.push(
        `${path.relative(buildDir, filePath)} is larger than 20MB (${(stats.size / 1024 / 1024).toFixed(1)} MB).`
      );
    }
  }
  if (totalBytes > 50 * 1024 * 1024) {
    warnings.push(`Total build size is larger than 50MB (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`);
  }

  return { errors, warnings };
}
