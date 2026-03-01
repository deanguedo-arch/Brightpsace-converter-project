import path from "node:path";
import { build as esbuild } from "esbuild";
import { ensureDir } from "./fs.js";

function themeSourcePath(repoRoot, relativePath) {
  return path.join(repoRoot, "packages", "theme", "src", relativePath);
}

export async function buildThemeAssets({
  repoRoot,
  outputDir,
  sandbox = false
}) {
  const assetsDir = path.join(outputDir, "assets");
  await ensureDir(assetsDir);

  const cssEntry = sandbox ? "entry-sandbox.css" : "entry.css";
  const jsEntry = sandbox ? "runtime-sandbox.js" : "runtime.js";

  const cssOutPath = path.join(assetsDir, "style.css");
  const jsOutPath = path.join(assetsDir, "runtime.js");

  await esbuild({
    entryPoints: [themeSourcePath(repoRoot, cssEntry)],
    bundle: true,
    outfile: cssOutPath,
    minify: false,
    legalComments: "none",
    loader: {
      ".css": "css",
      ".woff2": "file",
      ".woff": "file",
      ".ttf": "file"
    }
  });

  await esbuild({
    entryPoints: [themeSourcePath(repoRoot, jsEntry)],
    bundle: true,
    outfile: jsOutPath,
    minify: false,
    legalComments: "none",
    format: "iife",
    target: "es2020"
  });

  return {
    cssPath: "assets/style.css",
    runtimePath: "assets/runtime.js"
  };
}
