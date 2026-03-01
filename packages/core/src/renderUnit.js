import fs from "node:fs/promises";
import path from "node:path";
import { buildThemeAssets } from "./buildThemeAssets.js";
import { escapeHtml, slugify } from "./utils.js";
import { ensureDir, writeFileEnsuringDir, copyDirRecursive } from "./fs.js";

const SECTION_TONES = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5", "tone-6"];
const SECTION_ICONS = [
  { key: "spark", glyph: "SP" },
  { key: "focus", glyph: "FC" },
  { key: "growth", glyph: "GR" },
  { key: "balance", glyph: "BL" },
  { key: "strategy", glyph: "ST" },
  { key: "mastery", glyph: "MS" }
];

function sectionMetaForIndex(index) {
  return {
    index: index + 1,
    tone: SECTION_TONES[index % SECTION_TONES.length],
    icon: SECTION_ICONS[index % SECTION_ICONS.length]
  };
}

function renderObjectives(objectives) {
  if (!objectives || objectives.length === 0) return "";
  const items = objectives.map((item) => `<li class="objectives__item">${escapeHtml(item)}</li>`).join("");
  return `
    <section id="mission-brief" class="objectives mission-brief card" aria-labelledby="mission-brief-heading">
      <div class="mission-brief__header">
        <h2 id="mission-brief-heading" class="section-header">Mission Brief</h2>
        <button
          class="button button--ghost mission-brief__toggle"
          type="button"
          data-mission-toggle
          aria-expanded="false"
          aria-controls="mission-brief-list"
        >
          Show Objectives
        </button>
      </div>
      <p class="mission-brief__summary">Track your choices, practice safer decisions, and finish with a usable action plan.</p>
      <ul id="mission-brief-list" class="objectives__list" data-mission-list hidden>${items}</ul>
    </section>
  `;
}

function renderLearningDashboard() {
  return `
    <section id="progress-dashboard" class="learning-dashboard card" data-learning-dashboard data-section>
      <div class="learning-dashboard__header">
        <h2 class="section-header">Progress Dashboard</h2>
        <p class="learning-dashboard__summary"><span data-dashboard-completed>0</span> / <span data-dashboard-total>0</span> checkpoints complete</p>
      </div>
      <div class="learning-dashboard__bar" aria-hidden="true">
        <div class="learning-dashboard__fill" data-dashboard-fill></div>
      </div>
      <div class="learning-dashboard__grid">
        <article class="dashboard-metric">
          <p class="dashboard-metric__label">Workbook Fields</p>
          <p class="dashboard-metric__value" data-dashboard-workbook>0 / 0</p>
        </article>
        <article class="dashboard-metric">
          <p class="dashboard-metric__label">Scenario Choices</p>
          <p class="dashboard-metric__value" data-dashboard-scenario>0 / 0</p>
        </article>
        <article class="dashboard-metric">
          <p class="dashboard-metric__label">Ranking Inputs</p>
          <p class="dashboard-metric__value" data-dashboard-ranking>0 / 0</p>
        </article>
        <article class="dashboard-metric">
          <p class="dashboard-metric__label">Decision Paths</p>
          <p class="dashboard-metric__value" data-dashboard-decision-tree>0 / 0</p>
        </article>
        <article class="dashboard-metric">
          <p class="dashboard-metric__label">Flashcards Reviewed</p>
          <p class="dashboard-metric__value" data-dashboard-flashcards>0 / 0</p>
        </article>
      </div>
    </section>
  `;
}

function renderSectionStage(coreSections) {
  const stepperItems = coreSections
    .map((section) => {
      return `
        <li class="section-stepper__item">
          <button
            class="section-stepper__button"
            type="button"
            data-stepper-item
            data-stepper-target="${escapeHtml(section.id)}"
            aria-label="Jump to ${escapeHtml(section.title)}"
          >
            <span class="section-stepper__badge" aria-hidden="true">${escapeHtml(section.index)}</span>
            <span class="section-stepper__label">
              <span class="section-stepper__icon-chip" data-stepper-icon="${escapeHtml(section.icon.key)}" aria-hidden="true">${escapeHtml(section.icon.glyph)}</span>
              <span>${escapeHtml(section.title)}</span>
            </span>
            <span class="section-stepper__state" data-stepper-state-for="${escapeHtml(section.id)}">Not Started</span>
          </button>
        </li>
      `;
    })
    .join("");

  return `
    <section class="section-stage card" data-section-stage aria-live="polite">
      <div class="section-stage__meta">
        <p class="section-stage__eyebrow">Learning Path</p>
        <h2 class="section-stage__title" data-stage-title>Section</h2>
      </div>
      <ul class="section-stepper" data-stepper-list>
        ${stepperItems}
      </ul>
      <div class="section-stage__actions">
        <button class="button button--ghost" type="button" data-stage-prev>Previous</button>
        <button class="button button--primary" type="button" data-stage-next>Next Section</button>
      </div>
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
  if (block.type === "workbook") {
    const workbookId = `${sectionId}-workbook-${blockIndex + 1}`;
    const total = block.fields.length;
    const fields = block.fields
      .map((field, fieldIndex) => {
        const fieldId = `${workbookId}-field-${fieldIndex + 1}-${slugify(field.id) || "item"}`;
        const fieldKey = fieldId;

        if (field.kind === "text") {
          return `
            <div class="workbook__field" data-workbook-field-wrap data-workbook-key="${escapeHtml(fieldKey)}" data-workbook-kind="text">
              <label class="workbook__label" for="${escapeHtml(fieldId)}">${escapeHtml(field.label)}</label>
              <input
                id="${escapeHtml(fieldId)}"
                class="workbook__input"
                type="text"
                placeholder="${escapeHtml(field.placeholder || "")}"
                data-workbook-field
                data-workbook-kind="text"
                data-workbook-key="${escapeHtml(fieldKey)}"
              >
            </div>
          `;
        }

        if (field.kind === "textarea") {
          return `
            <div class="workbook__field" data-workbook-field-wrap data-workbook-key="${escapeHtml(fieldKey)}" data-workbook-kind="textarea">
              <label class="workbook__label" for="${escapeHtml(fieldId)}">${escapeHtml(field.label)}</label>
              <textarea
                id="${escapeHtml(fieldId)}"
                class="workbook__textarea"
                rows="${escapeHtml(field.rows || 4)}"
                placeholder="${escapeHtml(field.placeholder || "")}"
                data-workbook-field
                data-workbook-kind="textarea"
                data-workbook-key="${escapeHtml(fieldKey)}"
              ></textarea>
            </div>
          `;
        }

        if (field.kind === "radio") {
          const options = field.options
            .map((option, optionIndex) => {
              const optionId = `${fieldId}-option-${optionIndex + 1}`;
              return `
                <label class="workbook__choice" for="${escapeHtml(optionId)}">
                  <input
                    id="${escapeHtml(optionId)}"
                    type="radio"
                    name="${escapeHtml(fieldId)}"
                    value="${escapeHtml(option.value)}"
                    data-workbook-field
                    data-workbook-kind="radio"
                    data-workbook-key="${escapeHtml(fieldKey)}"
                  >
                  <span>${escapeHtml(option.label)}</span>
                </label>
              `;
            })
            .join("");
          return `
            <fieldset class="workbook__field workbook__field--options" data-workbook-field-wrap data-workbook-key="${escapeHtml(fieldKey)}" data-workbook-kind="radio">
              <legend class="workbook__label">${escapeHtml(field.label)}</legend>
              <div class="workbook__options">${options}</div>
            </fieldset>
          `;
        }

        if (field.kind === "checklist") {
          const options = field.options
            .map((option, optionIndex) => {
              const optionId = `${fieldId}-check-${optionIndex + 1}`;
              return `
                <label class="workbook__choice" for="${escapeHtml(optionId)}">
                  <input
                    id="${escapeHtml(optionId)}"
                    type="checkbox"
                    value="${escapeHtml(option.value)}"
                    data-workbook-field
                    data-workbook-kind="checklist"
                    data-workbook-key="${escapeHtml(fieldKey)}"
                  >
                  <span>${escapeHtml(option.label)}</span>
                </label>
              `;
            })
            .join("");
          return `
            <fieldset class="workbook__field workbook__field--options" data-workbook-field-wrap data-workbook-key="${escapeHtml(fieldKey)}" data-workbook-kind="checklist">
              <legend class="workbook__label">${escapeHtml(field.label)}</legend>
              <div class="workbook__options">${options}</div>
            </fieldset>
          `;
        }

        return "";
      })
      .join("");

    return `
      <section class="workbook card" data-workbook data-workbook-id="${escapeHtml(workbookId)}" data-workbook-total="${escapeHtml(total)}">
        <div class="workbook__header">
          <h3 class="workbook__title">${escapeHtml(block.title || "Workbook")}</h3>
          <p class="workbook__progress" data-workbook-progress>0 / ${escapeHtml(total)} complete</p>
        </div>
        ${block.descriptionHtml ? `<div class="workbook__description">${block.descriptionHtml}</div>` : ""}
        <div class="workbook__grid">${fields}</div>
      </section>
    `;
  }
  if (block.type === "scenario") {
    const scenarioId = `${sectionId}-scenario-${blockIndex + 1}`;
    const prompts = (block.prompts || [])
      .map((prompt, promptIndex) => {
        const promptKey = `${scenarioId}-prompt-${promptIndex + 1}-${slugify(prompt.id) || "item"}`;
        const options = (prompt.options || [])
          .map((option, optionIndex) => {
            const optionId = `${promptKey}-choice-${optionIndex + 1}`;
            return `
              <label class="scenario__choice" for="${escapeHtml(optionId)}">
                <input
                  id="${escapeHtml(optionId)}"
                  type="radio"
                  name="${escapeHtml(promptKey)}"
                  value="${escapeHtml(option.value)}"
                  data-scenario-choice
                  data-scenario-key="${escapeHtml(promptKey)}"
                >
                <span>${escapeHtml(option.label)}</span>
              </label>
            `;
          })
          .join("");
        const outcomes = (prompt.options || [])
          .map((option) => {
            if (!option.outcomeHtml) return "";
            return `
              <div class="scenario__outcome-item" data-scenario-outcome-option="${escapeHtml(option.value)}" hidden>
                ${option.outcomeHtml}
              </div>
            `;
          })
          .join("");
        return `
          <article class="scenario__prompt" data-scenario-prompt data-scenario-key="${escapeHtml(promptKey)}">
            <h4 class="scenario__question">${escapeHtml(prompt.question)}</h4>
            <div class="scenario__choices">${options}</div>
            <div class="scenario__outcome" data-scenario-outcome="${escapeHtml(promptKey)}">${outcomes}</div>
          </article>
        `;
      })
      .join("");
    return `
      <section class="scenario card" data-scenario data-scenario-id="${escapeHtml(scenarioId)}" data-scenario-total="${escapeHtml((block.prompts || []).length)}">
        <div class="scenario__header">
          <h3 class="scenario__title">${escapeHtml(block.title || "Scenario")}</h3>
          <p class="scenario__progress" data-scenario-progress>0 / ${escapeHtml((block.prompts || []).length)} complete</p>
        </div>
        ${block.descriptionHtml ? `<div class="scenario__description">${block.descriptionHtml}</div>` : ""}
        <div class="scenario__grid">${prompts}</div>
      </section>
    `;
  }
  if (block.type === "ranking") {
    const rankingId = `${sectionId}-ranking-${blockIndex + 1}`;
    const total = (block.items || []).length;
    const rows = (block.items || [])
      .map((item, itemIndex) => {
        const key = `${rankingId}-item-${itemIndex + 1}-${slugify(item.id) || "item"}`;
        const options = Array.from({ length: total }, (_, rankIndex) => {
          const rank = rankIndex + 1;
          return `<option value="${rank}">${rank}</option>`;
        }).join("");
        return `
          <div class="ranking__row" data-ranking-row data-ranking-key="${escapeHtml(key)}">
            <label class="ranking__label" for="${escapeHtml(key)}">${escapeHtml(item.label)}</label>
            <select id="${escapeHtml(key)}" class="ranking__select" data-ranking-field data-ranking-key="${escapeHtml(key)}">
              <option value="">Select rank</option>
              ${options}
            </select>
          </div>
        `;
      })
      .join("");
    return `
      <section class="ranking card" data-ranking data-ranking-id="${escapeHtml(rankingId)}" data-ranking-total="${escapeHtml(total)}">
        <div class="ranking__header">
          <h3 class="ranking__title">${escapeHtml(block.title || "Ranking")}</h3>
          <p class="ranking__progress" data-ranking-progress>0 / ${escapeHtml(total)} ranked</p>
        </div>
        ${block.descriptionHtml ? `<div class="ranking__description">${block.descriptionHtml}</div>` : ""}
        <div class="ranking__grid">${rows}</div>
      </section>
    `;
  }
  if (block.type === "decision-tree") {
    const treeId = `${sectionId}-decision-tree-${blockIndex + 1}`;
    const startNode = block.nodes?.[0]?.id || "";
    const nodeMarkup = (block.nodes || [])
      .map((node) => {
        const choices = (node.choices || [])
          .map((choice) => {
            return `
              <button
                type="button"
                class="decision-tree__choice"
                data-decision-choice
                data-next-node="${escapeHtml(choice.next)}"
              >
                ${escapeHtml(choice.label)}
              </button>
            `;
          })
          .join("");
        return `
          <article class="decision-tree__node" data-decision-node data-node-id="${escapeHtml(node.id)}" ${node.id === startNode ? "" : "hidden"}>
            <p class="decision-tree__prompt">${escapeHtml(node.prompt)}</p>
            ${node.end ? "<p class=\"decision-tree__end\">End of path.</p>" : `<div class="decision-tree__choices">${choices}</div>`}
          </article>
        `;
      })
      .join("");
    return `
      <section
        class="decision-tree card"
        data-decision-tree
        data-decision-tree-id="${escapeHtml(treeId)}"
        data-start-node="${escapeHtml(startNode)}"
        data-decision-total="${escapeHtml((block.nodes || []).length)}"
      >
        <div class="decision-tree__header">
          <h3 class="decision-tree__title">${escapeHtml(block.title || "Decision Tree")}</h3>
          <p class="decision-tree__progress" data-decision-progress>1 / ${escapeHtml((block.nodes || []).length)} visited</p>
        </div>
        ${block.descriptionHtml ? `<div class="decision-tree__description">${block.descriptionHtml}</div>` : ""}
        <div class="decision-tree__canvas">${nodeMarkup}</div>
        <div class="decision-tree__controls">
          <button type="button" class="button button--ghost" data-decision-restart>Restart path</button>
        </div>
      </section>
    `;
  }
  return "";
}

function renderSections(sections) {
  return sections
    .map((section, index) => {
      const meta = sectionMetaForIndex(index);
      const blocks = section.blocks
        .map((block, blockIndex) => renderBlock(block, section.id, blockIndex))
        .join("");
      return `
        <section
          id="${escapeHtml(section.id)}"
          class="unit-section card"
          data-section
          data-section-role="core"
          data-section-index="${escapeHtml(meta.index)}"
          data-section-tone="${escapeHtml(meta.tone)}"
          data-section-icon="${escapeHtml(meta.icon.key)}"
        >
          <header class="unit-section__header">
            <span class="unit-section__chip" aria-hidden="true">${escapeHtml(meta.icon.glyph)}</span>
            <div class="unit-section__heading-wrap">
              <p class="unit-section__kicker">Section ${escapeHtml(meta.index)}</p>
              <h2 class="section-header">${escapeHtml(section.title)}</h2>
            </div>
          </header>
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
    <section id="resources" class="resources card" data-section data-section-role="aux">
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
    <section id="flashcards" class="flashcards card" data-section data-section-role="aux">
      <div class="flashcards__header">
        <h2 class="section-header">Flashcards</h2>
        <p class="flashcards__progress" data-flashcards-progress>0 / ${flashcards.length} reviewed</p>
      </div>
      <div class="flashcards__grid">${cards}</div>
    </section>
  `;
}

function renderUnitHtml({ unit, cssPath, runtimePath, sandbox }) {
  const coreSections = unit.sections.map((section, index) => ({
    ...section,
    ...sectionMetaForIndex(index)
  }));
  const nav = [{ id: "progress-dashboard", title: "Progress Dashboard", depth: 2 }, ...unit.nav];
  if (unit.resources.length) nav.push({ id: "resources", title: "Resources", depth: 2 });
  if (unit.flashcards.length) nav.push({ id: "flashcards", title: "Flashcards", depth: 2 });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f5f1ea">
    <title>${escapeHtml(unit.title)}</title>
    <link rel="stylesheet" href="${escapeHtml(cssPath)}">
  </head>
  <body data-course="${escapeHtml(unit.courseSlug)}" data-unit="${escapeHtml(unit.unitSlug)}" data-mode="${sandbox ? "sandbox" : "production"}">
    <a class="skip-link" href="#main-content">Skip to Main Content</a>
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
      ${renderLearningDashboard()}
      <div class="layout">
        ${renderNav(nav)}
        <main id="main-content" class="content-column">
          ${renderSectionStage(coreSections)}
          ${renderSections(coreSections)}
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
