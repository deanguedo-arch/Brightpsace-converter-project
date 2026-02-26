import fs from "node:fs/promises";
import path from "node:path";
import { buildThemeAssets } from "./buildThemeAssets.js";
import { escapeHtml, slugify } from "./utils.js";
import { ensureDir, writeFileEnsuringDir, copyDirRecursive } from "./fs.js";

function renderObjectives(objectives) {
  if (!objectives || objectives.length === 0) return "";
  const items = objectives.map((item) => `<li class="objectives__item">${escapeHtml(item)}</li>`).join("");
  return `
    <section class="objectives card" aria-labelledby="objectives-heading">
      <h2 id="objectives-heading" class="section-header">Objectives</h2>
      <ul class="objectives__list">${items}</ul>
    </section>
  `;
}

function renderNav(nav) {
  const items = nav
    .map((item) => {
      const itemClass = item.depth === 3 ? "sticky-nav__item sticky-nav__item--child" : "sticky-nav__item";
      return `
        <li class="${itemClass}">
          <a class="sticky-nav__link" href="#${escapeHtml(item.id)}" data-nav-link="${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>
        </li>
      `;
    })
    .join("");
  return `
    <aside class="sticky-nav card" aria-label="Section navigation">
      <h2 class="section-header">On this page</h2>
      <ul class="sticky-nav__list">${items}</ul>
    </aside>
  `;
}

function renderBlock(block, sectionId, blockIndex) {
  if (block.type === "markdown") {
    return `<div class="content-block markdown">${block.html}</div>`;
  }
  if (block.type === "subheading") {
    return `<h3 id="${escapeHtml(block.id)}" class="section-subheading">${escapeHtml(block.title)}</h3>`;
  }
  if (block.type === "callout") {
    return `
      <aside class="callout callout--${escapeHtml(block.kind)}">
        <div class="callout__body">${block.html}</div>
      </aside>
    `;
  }
  if (block.type === "accordion") {
    const items = block.items
      .map((item, index) => {
        const itemId = `${sectionId}-acc-${blockIndex + 1}-${index + 1}-${slugify(item.title) || "item"}`;
        return `
          <div class="accordion__item" data-accordion-item>
            <button class="accordion__trigger" type="button" aria-expanded="false" aria-controls="${itemId}">
              <span>${escapeHtml(item.title)}</span>
            </button>
            <div id="${itemId}" class="accordion__panel" hidden>
              <div class="accordion__content">${item.bodyHtml}</div>
            </div>
          </div>
        `;
      })
      .join("");
    return `<section class="accordion card" data-accordion>${items}</section>`;
  }
  return "";
}

function renderSections(sections) {
  return sections
    .map((section) => {
      const blocks = section.blocks
        .map((block, blockIndex) => renderBlock(block, section.id, blockIndex))
        .join("");
      return `
        <section id="${escapeHtml(section.id)}" class="unit-section card" data-section>
          <h2 class="section-header">${escapeHtml(section.title)}</h2>
          ${blocks}
        </section>
      `;
    })
    .join("");
}

function renderResources(resources) {
  if (!resources || resources.length === 0) return "";
  const cards = resources
    .map((resource) => {
      return `
        <article class="resource-card">
          <div class="resource-card__meta">${escapeHtml(resource.kind)}</div>
          <h3 class="resource-card__title">${escapeHtml(resource.title)}</h3>
          <a class="button button--ghost" href="${escapeHtml(resource.href)}" target="_blank" rel="noreferrer">Open resource</a>
        </article>
      `;
    })
    .join("");
  return `
    <section id="resources" class="resources card" data-section>
      <h2 class="section-header">Resources</h2>
      <div class="resource-grid">${cards}</div>
    </section>
  `;
}

function renderFlashcards(flashcards) {
  if (!flashcards || flashcards.length === 0) return "";
  const cards = flashcards
    .map((card) => {
      return `
        <article class="flashcard" data-flashcard data-card-id="${escapeHtml(card.id)}">
          <div class="flashcard__inner" data-flashcard-inner>
            <button class="flashcard__face flashcard__face--front" type="button" data-flashcard-front>
              <span class="flashcard__label">Front</span>
              <span>${escapeHtml(card.front)}</span>
            </button>
            <button class="flashcard__face flashcard__face--back" type="button" data-flashcard-back hidden>
              <span class="flashcard__label">Back</span>
              <span>${escapeHtml(card.back)}</span>
            </button>
          </div>
          ${card.tag ? `<p class="flashcard__tag">${escapeHtml(card.tag)}</p>` : ""}
        </article>
      `;
    })
    .join("");
  return `
    <section id="flashcards" class="flashcards card" data-section>
      <div class="flashcards__header">
        <h2 class="section-header">Flashcards</h2>
        <p class="flashcards__progress" data-flashcards-progress>0 / ${flashcards.length} reviewed</p>
      </div>
      <div class="flashcards__grid">${cards}</div>
    </section>
  `;
}

function renderUnitHtml({ unit, cssPath, runtimePath, sandbox }) {
  const nav = [...unit.nav];
  if (unit.resources.length) nav.push({ id: "resources", title: "Resources", depth: 2 });
  if (unit.flashcards.length) nav.push({ id: "flashcards", title: "Flashcards", depth: 2 });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(unit.title)}</title>
    <link rel="stylesheet" href="${escapeHtml(cssPath)}">
  </head>
  <body data-course="${escapeHtml(unit.courseSlug)}" data-unit="${escapeHtml(unit.unitSlug)}" data-mode="${sandbox ? "sandbox" : "production"}">
    <div class="page-shell">
      <header class="unit-header card">
        <p class="unit-header__eyebrow">${escapeHtml(unit.courseSlug)}</p>
        <h1 class="unit-header__title">${escapeHtml(unit.title)}</h1>
        ${unit.subtitle ? `<p class="unit-header__subtitle">${escapeHtml(unit.subtitle)}</p>` : ""}
        <div class="unit-header__meta">
          ${unit.estimatedMinutes ? `<span class="pill">${escapeHtml(unit.estimatedMinutes)} min</span>` : ""}
          <button class="button button--primary" type="button" data-mark-complete>Mark complete</button>
        </div>
      </header>
      ${renderObjectives(unit.objectives)}
      <div class="layout">
        ${renderNav(nav)}
        <main class="content-column">
          ${renderSections(unit.sections)}
          ${renderResources(unit.resources)}
          ${renderFlashcards(unit.flashcards)}
        </main>
      </div>
    </div>
    <script src="${escapeHtml(runtimePath)}"></script>
  </body>
</html>`;
}

export async function renderUnitToPreview({
  repoRoot,
  unit,
  outputDir,
  sandbox = false
}) {
  await ensureDir(outputDir);

  const resourcesSource = path.join(unit.sourceDir, "resources");
  const resourcesDest = path.join(outputDir, "resources");
  const resourcesStats = await fs.stat(resourcesSource).catch(() => null);
  if (resourcesStats?.isDirectory()) {
    await copyDirRecursive(resourcesSource, resourcesDest);
  }

  const assets = await buildThemeAssets({
    repoRoot,
    outputDir,
    sandbox
  });

  const html = renderUnitHtml({
    unit,
    cssPath: assets.cssPath,
    runtimePath: assets.runtimePath,
    sandbox
  });
  await writeFileEnsuringDir(path.join(outputDir, "index.html"), html);
  return {
    outputDir,
    indexPath: path.join(outputDir, "index.html")
  };
}
