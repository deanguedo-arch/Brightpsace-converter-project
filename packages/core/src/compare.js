import fs from "node:fs/promises";
import path from "node:path";
import { buildPreviewUnit } from "./build.js";
import { emptyDir, copyDirRecursive, ensureDir, writeFileEnsuringDir } from "./fs.js";
import { loadReferenceProfile } from "./referenceProfiles.js";

function compareShellHtml({ title, referenceTitle, generatedTitle }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root {
        --bg: #e8edf2;
        --panel: rgba(255, 255, 255, 0.84);
        --border: rgba(21, 37, 61, 0.14);
        --text: #14263d;
        --muted: rgba(20, 38, 61, 0.68);
        --shadow: 0 24px 54px rgba(21, 37, 61, 0.14);
      }
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; }
      body {
        color: var(--text);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background:
          radial-gradient(circle at 10% 0%, rgba(77, 163, 219, 0.18) 0%, transparent 35%),
          radial-gradient(circle at 88% 12%, rgba(53, 132, 104, 0.16) 0%, transparent 34%),
          linear-gradient(155deg, #eef3f7 0%, #dfe8ef 100%);
      }
      .bar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        padding: 0.8rem 1rem;
        background: rgba(255, 255, 255, 0.85);
        border-bottom: 1px solid var(--border);
        backdrop-filter: blur(14px);
      }
      .bar__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
      }
      .bar__meta {
        margin: 0.15rem 0 0;
        font-size: 0.82rem;
        color: var(--muted);
      }
      .links {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .links a {
        color: var(--text);
        text-decoration: none;
        font-weight: 700;
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
        background: rgba(255, 255, 255, 0.85);
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.85rem;
        height: calc(100% - 72px);
        padding: 0.85rem;
      }
      .panel {
        min-height: 0;
        display: flex;
        flex-direction: column;
        border-radius: 1.2rem;
        overflow: hidden;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .panel__head {
        padding: 0.8rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .panel__title {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 800;
      }
      .panel__sub {
        margin: 0.18rem 0 0;
        font-size: 0.76rem;
        color: var(--muted);
      }
      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        background: #fff;
      }
      @media (max-width: 980px) {
        .grid {
          grid-template-columns: 1fr;
          height: auto;
        }
        .panel {
          height: 78vh;
        }
      }
    </style>
  </head>
  <body>
    <header class="bar">
      <div>
        <h1 class="bar__title">${title}</h1>
        <p class="bar__meta">Left = reference target. Right = generated output from this repo.</p>
      </div>
      <nav class="links" aria-label="Compare links">
        <a href="./reference.html" target="_blank" rel="noreferrer">Open reference</a>
        <a href="./generated/index.html" target="_blank" rel="noreferrer">Open generated</a>
      </nav>
    </header>
    <main class="grid">
      <section class="panel" aria-label="reference preview">
        <div class="panel__head">
          <p class="panel__title">${referenceTitle}</p>
          <p class="panel__sub">Reference artifact</p>
        </div>
        <iframe src="./reference.html" title="${referenceTitle}"></iframe>
      </section>
      <section class="panel" aria-label="generated preview">
        <div class="panel__head">
          <p class="panel__title">${generatedTitle}</p>
          <p class="panel__sub">Repo-generated output</p>
        </div>
        <iframe src="./generated/index.html" title="${generatedTitle}"></iframe>
      </section>
    </main>
  </body>
</html>`;
}

export async function createReferenceCompareWorkspace({
  repoRoot,
  courseSlug,
  unitSlug,
  reference
}) {
  const profile = await loadReferenceProfile(repoRoot, reference);
  const built = await buildPreviewUnit({
    repoRoot,
    courseSlug,
    unitSlug,
    sandbox: false
  });

  const compareDir = path.join(repoRoot, "dist", "preview", "_compare", profile.id, courseSlug, unitSlug);
  const generatedDir = path.join(compareDir, "generated");
  const referenceHtmlPath = path.join(compareDir, "reference.html");
  const compareHtmlPath = path.join(compareDir, "compare.html");

  await emptyDir(compareDir);
  await ensureDir(generatedDir);
  await copyDirRecursive(built.outputDir, generatedDir);

  const referenceRaw = await fs.readFile(profile.referenceFilePath, "utf8");
  await writeFileEnsuringDir(referenceHtmlPath, referenceRaw);
  await writeFileEnsuringDir(
    compareHtmlPath,
    compareShellHtml({
      title: `Compare: ${profile.id} vs ${courseSlug}/${unitSlug}`,
      referenceTitle: profile.title,
      generatedTitle: `${courseSlug}/${unitSlug}`
    })
  );

  return {
    profile,
    built,
    compareDir,
    generatedDir,
    referenceHtmlPath,
    compareHtmlPath
  };
}
