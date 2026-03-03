(() => {
  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeInlineText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function safeFilenamePart(value, fallback) {
    const base = normalizeInlineText(value)
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 64);
    return base || fallback;
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function autoResizeTextarea(textarea) {
    if (!textarea || textarea.tagName !== "TEXTAREA") return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function readJsonSafe(value, fallback) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function createStorageKey() {
    const body = document.body;
    const course = body?.dataset?.course || "course";
    const unit = body?.dataset?.unit || "unit";
    return `cf:${course}:${unit}`;
  }

  function loadState(key) {
    if (window.CF_SCORM && typeof window.CF_SCORM.loadState === "function") {
      const scormState = window.CF_SCORM.loadState();
      if (isPlainObject(scormState)) return scormState;
    }
    const raw = window.localStorage.getItem(key);
    return readJsonSafe(raw, {});
  }

  function saveState(key, nextState) {
    if (window.CF_SCORM && typeof window.CF_SCORM.saveState === "function") {
      window.CF_SCORM.saveState(nextState);
      if (typeof window.CF_SCORM.commit === "function") {
        window.CF_SCORM.commit();
      }
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(nextState));
  }

  function collectAccordionState() {
    const map = {};
    document.querySelectorAll("[data-accordion-item]").forEach((item) => {
      const button = item.querySelector(".accordion__trigger");
      const panelId = button?.getAttribute("aria-controls");
      if (!panelId) return;
      map[panelId] = button.getAttribute("aria-expanded") === "true";
    });
    return map;
  }

  function collectKnowledgeState() {
    const map = {};
    document.querySelectorAll("[data-knowledge]").forEach((item) => {
      const button = item.querySelector("[data-knowledge-toggle]");
      const panelId = button?.getAttribute("aria-controls");
      if (!panelId) return;
      map[panelId] = button.getAttribute("aria-expanded") === "true";
    });
    return map;
  }

  function restoreAccordionState(state) {
    document.querySelectorAll("[data-accordion-item]").forEach((item) => {
      const button = item.querySelector(".accordion__trigger");
      const panel = item.querySelector(".accordion__panel");
      const panelId = button?.getAttribute("aria-controls");
      if (!button || !panel || !panelId) return;
      const open = Boolean(state?.[panelId]);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.classList.toggle("is-open", open);
      panel.hidden = !open;
    });
  }

  function restoreKnowledgeState(state) {
    document.querySelectorAll("[data-knowledge]").forEach((item) => {
      const button = item.querySelector("[data-knowledge-toggle]");
      const panel = item.querySelector("[data-knowledge-panel]");
      const panelId = button?.getAttribute("aria-controls");
      if (!button || !panel || !panelId) return;
      const open = state?.[panelId] === undefined
        ? button.getAttribute("aria-expanded") === "true"
        : Boolean(state?.[panelId]);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.classList.toggle("is-open", open);
      panel.hidden = !open;
    });
  }

  function collectFlashcardState() {
    const reviewed = [];
    const showingBack = [];
    document.querySelectorAll("[data-flashcard]").forEach((card) => {
      const id = card.getAttribute("data-card-id");
      if (!id) return;
      if (card.classList.contains("is-reviewed")) reviewed.push(id);
      const back = card.querySelector("[data-flashcard-back]");
      if (back && !back.hidden) showingBack.push(id);
    });
    return { reviewed, showingBack };
  }

  function collectWorkbookState() {
    const state = {};
    document.querySelectorAll("[data-workbook-field]").forEach((field) => {
      const key = field.getAttribute("data-workbook-key");
      const kind = field.getAttribute("data-workbook-kind");
      if (!key || !kind) return;

      if (kind === "radio") {
        if (field.checked) {
          state[key] = field.value;
        }
        return;
      }

      if (kind === "checklist") {
        if (!Array.isArray(state[key])) {
          state[key] = [];
        }
        if (field.checked) {
          state[key].push(field.value);
        }
        return;
      }

      state[key] = field.value;
    });
    return state;
  }

  function collectScenarioState() {
    const state = {};
    document.querySelectorAll("[data-scenario]").forEach((scenario) => {
      const scenarioId = scenario.getAttribute("data-scenario-id");
      if (!scenarioId) return;
      const answers = {};
      scenario.querySelectorAll("[data-scenario-prompt]").forEach((prompt) => {
        const key = prompt.getAttribute("data-scenario-key");
        if (!key) return;
        const selected = Array.from(
          prompt.querySelectorAll("[data-scenario-choice]")
        ).find((choice) => choice.checked);
        if (selected) {
          answers[key] = selected.value;
        }
      });
      state[scenarioId] = { answers };
    });
    return state;
  }

  function collectRankingState() {
    const state = {};
    document.querySelectorAll("[data-ranking]").forEach((ranking) => {
      const rankingId = ranking.getAttribute("data-ranking-id");
      if (!rankingId) return;
      const values = {};
      ranking.querySelectorAll("[data-ranking-field]").forEach((field) => {
        const key = field.getAttribute("data-ranking-key");
        if (!key) return;
        values[key] = field.value || "";
      });
      state[rankingId] = { values };
    });
    return state;
  }

  function collectDecisionTreeState() {
    const state = {};
    document.querySelectorAll("[data-decision-tree]").forEach((tree) => {
      const treeId = tree.getAttribute("data-decision-tree-id");
      if (!treeId) return;
      const currentNode = tree.getAttribute("data-current-node") || tree.getAttribute("data-start-node") || "";
      const visited = String(tree.getAttribute("data-visited") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      state[treeId] = { currentNode, visited };
    });
    return state;
  }

  function collectSimulatorState() {
    const state = {};
    document.querySelectorAll("[data-simulator]").forEach((simulator) => {
      const simulatorId = simulator.getAttribute("data-simulator-id");
      if (!simulatorId) return;
      const values = {};
      const notes = {};
      simulator.querySelectorAll("[data-simulator-field]").forEach((field) => {
        const key = field.getAttribute("data-simulator-key");
        if (!key) return;
        values[key] = field.value || "";
      });
      simulator.querySelectorAll("[data-simulator-note]").forEach((field) => {
        const key = field.getAttribute("data-simulator-key");
        if (!key) return;
        notes[key] = field.value || "";
      });
      state[simulatorId] = { values, notes };
    });
    return state;
  }

  function collectActiveSectionId() {
    const active = document.querySelector('.content-column > [data-section].is-active-section');
    return active?.getAttribute("id") || "";
  }

  function listCoreSections() {
    return Array.from(document.querySelectorAll('.content-column > [data-section-role="core"]'));
  }

  function listAuxSections() {
    return Array.from(document.querySelectorAll('.content-column > [data-section-role="aux"]'));
  }

  function evaluateSectionCompletion(section) {
    let total = 0;
    let completed = 0;

    const workbookFields = Array.from(section.querySelectorAll("[data-workbook-field-wrap]"));
    workbookFields.forEach((wrapper) => {
      const key = wrapper.getAttribute("data-workbook-key");
      const kind = wrapper.getAttribute("data-workbook-kind");
      if (!key || !kind) return;
      const controls = Array.from(section.querySelectorAll(`[data-workbook-key="${key}"]`));
      total += 1;
      if (kind === "radio" || kind === "checklist") {
        if (controls.some((control) => control.checked)) completed += 1;
        return;
      }
      const input = controls[0];
      if (input && typeof input.value === "string" && input.value.trim()) completed += 1;
    });

    const scenarioPrompts = Array.from(section.querySelectorAll("[data-scenario-prompt]"));
    scenarioPrompts.forEach((prompt) => {
      total += 1;
      const answered = Array.from(prompt.querySelectorAll("[data-scenario-choice]")).some((choice) => choice.checked);
      if (answered) completed += 1;
    });

    const rankingFields = Array.from(section.querySelectorAll("[data-ranking-field]"));
    rankingFields.forEach((field) => {
      total += 1;
      if (String(field.value || "").trim()) completed += 1;
    });

    const treeBlocks = Array.from(section.querySelectorAll("[data-decision-tree]"));
    treeBlocks.forEach((tree) => {
      const treeTotal = Number(tree.getAttribute("data-decision-total") || 0);
      const visited = String(tree.getAttribute("data-visited") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      total += treeTotal;
      completed += new Set(visited).size;
    });

    const simulatorFields = Array.from(section.querySelectorAll("[data-simulator-field-wrap]"));
    simulatorFields.forEach((wrapper) => {
      total += 1;
      const key = wrapper.getAttribute("data-simulator-key");
      const group = wrapper.getAttribute("data-simulator-group");
      if (!key || !group) return;
      const input = section.querySelector(`[data-simulator-field][data-simulator-key="${key}"][data-simulator-group="${group}"]`);
      if (input && String(input.value || "").trim()) completed += 1;
    });

    if (total === 0) {
      total = 1;
      if (section.classList.contains("is-visited-section")) completed = 1;
    }

    return {
      id: section.getAttribute("id") || "",
      total,
      completed,
      isComplete: completed >= total
    };
  }

  function collectSectionCompletionFlags() {
    const flags = {};
    listCoreSections().forEach((section) => {
      const id = section.getAttribute("id");
      if (!id) return;
      flags[id] = section.classList.contains("is-complete-section");
    });
    return flags;
  }

  function restoreWorkbookState(state) {
    document.querySelectorAll("[data-workbook-field]").forEach((field) => {
      const key = field.getAttribute("data-workbook-key");
      const kind = field.getAttribute("data-workbook-kind");
      if (!key || !kind) return;
      const saved = state?.[key];

      if (kind === "radio") {
        field.checked = saved === field.value;
        return;
      }

      if (kind === "checklist") {
        const selected = Array.isArray(saved) ? saved : [];
        field.checked = selected.includes(field.value);
        return;
      }

      field.value = typeof saved === "string" ? saved : "";
      if (kind === "textarea" && field.getAttribute("data-autosize") !== "false") {
        autoResizeTextarea(field);
      }
    });
  }

  function updateWorkbookProgress() {
    let totalOverall = 0;
    let completedOverall = 0;
    document.querySelectorAll("[data-workbook]").forEach((workbook) => {
      const wrappers = Array.from(workbook.querySelectorAll("[data-workbook-field-wrap]"));
      const total = wrappers.length;
      let completed = 0;

      wrappers.forEach((wrapper) => {
        const key = wrapper.getAttribute("data-workbook-key");
        const kind = wrapper.getAttribute("data-workbook-kind");
        if (!key || !kind) return;

        const controls = Array.from(workbook.querySelectorAll(`[data-workbook-key="${key}"]`));
        if (kind === "radio") {
          if (controls.some((control) => control.checked)) completed += 1;
          return;
        }
        if (kind === "checklist") {
          if (controls.some((control) => control.checked)) completed += 1;
          return;
        }

        const input = controls[0];
        if (input && typeof input.value === "string" && input.value.trim()) {
          completed += 1;
        }
      });

      const progress = workbook.querySelector("[data-workbook-progress]");
      if (progress) {
        progress.textContent = `${completed} / ${total} complete`;
      }
      workbook.classList.toggle("is-complete", total > 0 && completed === total);
      totalOverall += total;
      completedOverall += completed;
    });
    return { total: totalOverall, completed: completedOverall };
  }

  function showScenarioOutcome(prompt, selectedValue) {
    prompt.querySelectorAll("[data-scenario-outcome-option]").forEach((item) => {
      item.hidden = item.getAttribute("data-scenario-outcome-option") !== selectedValue;
    });
  }

  function restoreScenarioState(state) {
    document.querySelectorAll("[data-scenario]").forEach((scenario) => {
      const scenarioId = scenario.getAttribute("data-scenario-id");
      const answers = state?.[scenarioId]?.answers || {};
      scenario.querySelectorAll("[data-scenario-prompt]").forEach((prompt) => {
        const key = prompt.getAttribute("data-scenario-key");
        if (!key) return;
        const selectedValue = answers[key];
        prompt.querySelectorAll("[data-scenario-choice]").forEach((choice) => {
          choice.checked = selectedValue === choice.value;
        });
        if (selectedValue) {
          showScenarioOutcome(prompt, selectedValue);
        } else {
          showScenarioOutcome(prompt, "__none__");
        }
      });
    });
  }

  function updateScenarioProgress() {
    let totalOverall = 0;
    let completedOverall = 0;
    document.querySelectorAll("[data-scenario]").forEach((scenario) => {
      const prompts = Array.from(scenario.querySelectorAll("[data-scenario-prompt]"));
      const total = prompts.length;
      const completed = prompts.filter((prompt) => {
        return Array.from(prompt.querySelectorAll("[data-scenario-choice]")).some((choice) => choice.checked);
      }).length;
      const output = scenario.querySelector("[data-scenario-progress]");
      if (output) {
        output.textContent = `${completed} / ${total} complete`;
      }
      scenario.classList.toggle("is-complete", total > 0 && completed === total);
      totalOverall += total;
      completedOverall += completed;
    });
    return { total: totalOverall, completed: completedOverall };
  }

  function restoreRankingState(state) {
    document.querySelectorAll("[data-ranking]").forEach((ranking) => {
      const rankingId = ranking.getAttribute("data-ranking-id");
      const values = state?.[rankingId]?.values || {};
      ranking.querySelectorAll("[data-ranking-field]").forEach((field) => {
        const key = field.getAttribute("data-ranking-key");
        if (!key) return;
        field.value = values[key] || "";
      });
    });
  }

  function updateRankingProgress() {
    let totalOverall = 0;
    let completedOverall = 0;
    document.querySelectorAll("[data-ranking]").forEach((ranking) => {
      const fields = Array.from(ranking.querySelectorAll("[data-ranking-field]"));
      const total = fields.length;
      const completed = fields.filter((field) => String(field.value || "").trim().length > 0).length;
      const output = ranking.querySelector("[data-ranking-progress]");
      if (output) {
        output.textContent = `${completed} / ${total} ranked`;
      }
      ranking.classList.toggle("is-complete", total > 0 && completed === total);
      totalOverall += total;
      completedOverall += completed;
    });
    return { total: totalOverall, completed: completedOverall };
  }

  function showDecisionNode(tree, nodeId, visited = null) {
    const fallbackStart = tree.getAttribute("data-start-node") || "";
    const nextNodeId = nodeId || fallbackStart;
    const nodeExists = tree.querySelector(`[data-decision-node][data-node-id="${nextNodeId}"]`);
    if (!nodeExists) return;

    tree.querySelectorAll("[data-decision-node]").forEach((node) => {
      node.hidden = node.getAttribute("data-node-id") !== nextNodeId;
    });
    tree.setAttribute("data-current-node", nextNodeId);

    const visitedSet = visited
      ? new Set(Array.from(visited))
      : new Set(
          String(tree.getAttribute("data-visited") || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        );
    visitedSet.add(nextNodeId);
    tree.setAttribute("data-visited", Array.from(visitedSet).join(","));
  }

  function restoreDecisionTreeState(state) {
    document.querySelectorAll("[data-decision-tree]").forEach((tree) => {
      const treeId = tree.getAttribute("data-decision-tree-id");
      const startNode = tree.getAttribute("data-start-node") || "";
      const saved = state?.[treeId];
      const currentNode = saved?.currentNode || startNode;
      const visited = new Set(Array.isArray(saved?.visited) ? saved.visited : [startNode].filter(Boolean));
      showDecisionNode(tree, currentNode, visited);
    });
  }

  function restoreSimulatorState(state) {
    document.querySelectorAll("[data-simulator]").forEach((simulator) => {
      const simulatorId = simulator.getAttribute("data-simulator-id");
      const values = state?.[simulatorId]?.values || {};
      const notes = state?.[simulatorId]?.notes || {};
      simulator.querySelectorAll("[data-simulator-field]").forEach((field) => {
        const key = field.getAttribute("data-simulator-key");
        if (!key) return;
        field.value = typeof values[key] === "string" ? values[key] : "";
      });
      simulator.querySelectorAll("[data-simulator-note]").forEach((field) => {
        const key = field.getAttribute("data-simulator-key");
        if (!key) return;
        field.value = typeof notes[key] === "string" ? notes[key] : "";
      });
    });
  }

  function updateDecisionTreeProgress() {
    let totalOverall = 0;
    let completedOverall = 0;
    document.querySelectorAll("[data-decision-tree]").forEach((tree) => {
      const total = Number(tree.getAttribute("data-decision-total") || 0);
      const visited = String(tree.getAttribute("data-visited") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const count = new Set(visited).size;
      const output = tree.querySelector("[data-decision-progress]");
      if (output) {
        output.textContent = `${count} / ${total} visited`;
      }
      tree.classList.toggle("is-complete", total > 0 && count >= total);
      totalOverall += total;
      completedOverall += count;
    });
    return { total: totalOverall, completed: completedOverall };
  }

  function formatCurrency(value) {
    const numeric = Number(value) || 0;
    const sign = numeric < 0 ? "-" : "";
    return `${sign}$${Math.abs(numeric).toFixed(2)}`;
  }

  function updateSimulatorProgress() {
    let totalOverall = 0;
    let completedOverall = 0;

    document.querySelectorAll("[data-simulator]").forEach((simulator) => {
      const fields = Array.from(simulator.querySelectorAll("[data-simulator-field]"));
      const total = fields.length;
      const completed = fields.filter((field) => String(field.value || "").trim().length > 0).length;
      let incomeTotal = 0;
      let expenseTotal = 0;

      fields.forEach((field) => {
        const numeric = Number(field.value || 0);
        if (!Number.isFinite(numeric)) return;
        const group = field.getAttribute("data-simulator-group");
        if (group === "income") incomeTotal += numeric;
        if (group === "expense") expenseTotal += numeric;
      });

      const progress = simulator.querySelector("[data-simulator-progress]");
      if (progress) {
        progress.textContent = `${completed} / ${total} complete`;
      }

      const incomeNode = simulator.querySelector("[data-simulator-income-total]");
      if (incomeNode) incomeNode.textContent = formatCurrency(incomeTotal);
      const expenseNode = simulator.querySelector("[data-simulator-expense-total]");
      if (expenseNode) expenseNode.textContent = formatCurrency(expenseTotal);
      const netNode = simulator.querySelector("[data-simulator-net-total]");
      if (netNode) netNode.textContent = formatCurrency(incomeTotal - expenseTotal);

      simulator.classList.toggle("is-complete", total > 0 && completed === total);
      totalOverall += total;
      completedOverall += completed;
    });

    return { total: totalOverall, completed: completedOverall };
  }

  function restoreFlashcardState(state) {
    const reviewed = new Set(state?.reviewed || []);
    const showingBack = new Set(state?.showingBack || []);
    document.querySelectorAll("[data-flashcard]").forEach((card) => {
      const id = card.getAttribute("data-card-id");
      if (!id) return;
      const front = card.querySelector("[data-flashcard-front]");
      const back = card.querySelector("[data-flashcard-back]");
      const seen = reviewed.has(id);
      const isBack = showingBack.has(id);
      card.classList.toggle("is-reviewed", seen);
      if (front) front.hidden = isBack;
      if (back) back.hidden = !isBack;
    });
  }

  function updateFlashcardProgress() {
    const total = document.querySelectorAll("[data-flashcard]").length;
    const reviewed = document.querySelectorAll("[data-flashcard].is-reviewed").length;
    const output = document.querySelector("[data-flashcards-progress]");
    if (output) {
      output.textContent = `${reviewed} / ${total} reviewed`;
    }
    return { total, completed: reviewed };
  }

  function setDashboardMetric(selector, metric) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.textContent = `${metric.completed} / ${metric.total}`;
  }

  function updateLearningDashboard(metrics) {
    const workbook = metrics.workbook || { total: 0, completed: 0 };
    const scenario = metrics.scenario || { total: 0, completed: 0 };
    const ranking = metrics.ranking || { total: 0, completed: 0 };
    const decisionTree = metrics.decisionTree || { total: 0, completed: 0 };
    const flashcards = metrics.flashcards || { total: 0, completed: 0 };

    setDashboardMetric("[data-dashboard-workbook]", workbook);
    setDashboardMetric("[data-dashboard-scenario]", scenario);
    setDashboardMetric("[data-dashboard-ranking]", ranking);
    setDashboardMetric("[data-dashboard-decision-tree]", decisionTree);
    setDashboardMetric("[data-dashboard-flashcards]", flashcards);

    const total = workbook.total + scenario.total + ranking.total + decisionTree.total + flashcards.total;
    const completed = workbook.completed + scenario.completed + ranking.completed + decisionTree.completed + flashcards.completed;
    const pct = total > 0 ? Math.min(100, Math.max(0, (completed / total) * 100)) : 0;

    const completedNode = document.querySelector("[data-dashboard-completed]");
    if (completedNode) completedNode.textContent = String(completed);
    const totalNode = document.querySelector("[data-dashboard-total]");
    if (totalNode) totalNode.textContent = String(total);

    const fill = document.querySelector("[data-dashboard-fill]");
    if (fill) fill.style.width = `${pct.toFixed(2)}%`;

    const shell = document.querySelector("[data-learning-dashboard]");
    if (shell) {
      shell.classList.toggle("is-complete", total > 0 && completed >= total);
    }
  }

  function updateSectionCompletionUi() {
    const completion = {};
    listCoreSections().forEach((section) => {
      const details = evaluateSectionCompletion(section);
      if (!details.id) return;
      completion[details.id] = details.isComplete;
      section.classList.toggle("is-complete-section", details.isComplete);
      section.setAttribute("data-section-checkpoints", `${details.completed}/${details.total}`);
      const navLink = document.querySelector(`[data-nav-link="${details.id}"]`);
      if (navLink) {
        const count = `${details.completed}/${details.total}`;
        navLink.setAttribute("data-nav-count", count);
        navLink.classList.toggle("is-complete", details.isComplete);
        navLink.classList.toggle("is-in-progress", !details.isComplete && details.completed > 0);
      }
    });

    const activeSectionId = collectActiveSectionId();
    document.querySelectorAll("[data-stepper-item]").forEach((button) => {
      const targetId = button.getAttribute("data-stepper-target");
      if (!targetId) return;
      const stateNode = document.querySelector(`[data-stepper-state-for="${targetId}"]`);
      const isComplete = Boolean(completion[targetId]);
      const isActive = targetId === activeSectionId;
      const section = document.getElementById(targetId);
      const isVisited = Boolean(section?.classList.contains("is-visited-section"));
      button.classList.toggle("is-complete", isComplete);
      button.classList.toggle("is-in-progress", !isComplete && (isActive || isVisited));
      button.setAttribute("aria-current", isActive ? "step" : "false");
      if (stateNode) {
        if (isComplete) {
          stateNode.textContent = "Complete";
        } else if (isActive || isVisited) {
          stateNode.textContent = "In Progress";
        } else {
          stateNode.textContent = "Not Started";
        }
      }
    });

    return completion;
  }

  function refreshProgressUi() {
    const workbookMetrics = updateWorkbookProgress();
    const simulatorMetrics = updateSimulatorProgress();
    const metrics = {
      flashcards: updateFlashcardProgress(),
      workbook: {
        total: workbookMetrics.total + simulatorMetrics.total,
        completed: workbookMetrics.completed + simulatorMetrics.completed
      },
      scenario: updateScenarioProgress(),
      ranking: updateRankingProgress(),
      decisionTree: updateDecisionTreeProgress()
    };
    updateLearningDashboard(metrics);
    const completion = updateSectionCompletionUi();
    updateCompletionChecklist(completion);
    return completion;
  }

  function updateCompletionChecklist(completion = {}) {
    const container = document.querySelector("[data-completion-checklist]");
    if (!container) return;

    const sections = listCoreSections();
    const items = sections
      .map((section) => {
        const id = section.getAttribute("id") || "";
        if (!id) return "";
        const title = normalizeInlineText(section.querySelector(".section-header")?.textContent) || id;
        const checkpoints = section.getAttribute("data-section-checkpoints") || "";
        const isComplete = Boolean(completion[id]);
        const status = isComplete ? "✓" : "·";
        const klass = isComplete ? "completion-checklist__item is-complete" : "completion-checklist__item";
        return `
          <li class="${klass}">
            <span class="completion-checklist__status" aria-hidden="true">${status}</span>
            <span class="completion-checklist__label">${title}</span>
            <span class="completion-checklist__count">${checkpoints}</span>
          </li>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="completion-checklist">
        <ul class="completion-checklist__list">${items}</ul>
      </div>
    `;
  }

  function collectWorkbookAnswer(wrapper) {
    const kind = wrapper.getAttribute("data-workbook-kind") || "";
    const label = normalizeInlineText(wrapper.querySelector(".workbook__label")?.textContent) || "Workbook field";
    const controls = Array.from(wrapper.querySelectorAll("[data-workbook-field]"));

    if (kind === "radio") {
      const selected = controls.find((control) => control.checked);
      const choiceLabel = normalizeInlineText(selected?.closest("label")?.querySelector("span")?.textContent) || selected?.value || "";
      return { label, value: choiceLabel };
    }

    if (kind === "checklist") {
      const selected = controls
        .filter((control) => control.checked)
        .map((control) => normalizeInlineText(control?.closest("label")?.querySelector("span")?.textContent) || control.value)
        .filter(Boolean);
      return { label, value: selected.join(", ") };
    }

    const control = controls[0];
    const value = normalizeInlineText(control?.value || "");
    return { label, value };
  }

  function collectScenarioAnswer(prompt) {
    const question = normalizeInlineText(prompt.querySelector(".scenario__question")?.textContent) || "Scenario prompt";
    const selected = Array.from(prompt.querySelectorAll("[data-scenario-choice]")).find((choice) => choice.checked);
    const choiceLabel = normalizeInlineText(selected?.closest("label")?.querySelector("span")?.textContent) || selected?.value || "";
    const outcome = normalizeInlineText(prompt.querySelector(`[data-scenario-outcome-option="${selected?.value || ""}"]`)?.textContent) || "";
    return {
      question,
      answer: choiceLabel,
      outcome
    };
  }

  function collectDecisionTreeExport(tree) {
    const visitedIds = String(tree.getAttribute("data-visited") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nodeLabels = new Map();
    tree.querySelectorAll("[data-decision-node]").forEach((node) => {
      const nodeId = node.getAttribute("data-node-id");
      const prompt = normalizeInlineText(node.querySelector(".decision-tree__prompt")?.textContent);
      if (nodeId && prompt) nodeLabels.set(nodeId, prompt);
    });
    return visitedIds.map((id) => nodeLabels.get(id) || id).filter(Boolean);
  }

  function collectSimulatorExport(simulator) {
    const values = [];
    simulator.querySelectorAll("[data-simulator-field-wrap]").forEach((wrapper) => {
      const label = normalizeInlineText(wrapper.querySelector(".simulator__label")?.textContent) || "Budget field";
      const key = wrapper.getAttribute("data-simulator-key");
      const group = wrapper.getAttribute("data-simulator-group");
      if (!key || !group) return;
      const input = simulator.querySelector(`[data-simulator-field][data-simulator-key="${key}"][data-simulator-group="${group}"]`);
      const value = normalizeInlineText(input?.value);
      if (!value) return;
      const note = normalizeInlineText(simulator.querySelector(`[data-simulator-note][data-simulator-key="${key}"][data-simulator-group="${group}"]`)?.value);
      values.push(note ? `${label}: ${value} (${note})` : `${label}: ${value}`);
    });
    const income = normalizeInlineText(simulator.querySelector("[data-simulator-income-total]")?.textContent);
    const expenses = normalizeInlineText(simulator.querySelector("[data-simulator-expense-total]")?.textContent);
    const net = normalizeInlineText(simulator.querySelector("[data-simulator-net-total]")?.textContent);
    if (income) values.push(`Income Total: ${income}`);
    if (expenses) values.push(`Expense Total: ${expenses}`);
    if (net) values.push(`Net Total: ${net}`);
    return values;
  }

  function collectStudentName() {
    const wrappers = Array.from(document.querySelectorAll("[data-workbook-field-wrap]"));
    const hit = wrappers.find((wrapper) => {
      const key = wrapper.getAttribute("data-workbook-key") || "";
      const label = normalizeInlineText(wrapper.querySelector(".workbook__label")?.textContent).toLowerCase();
      return key.endsWith("-student-name") || label.includes("student name") || label === "name";
    });
    if (!hit) return "";
    const answer = collectWorkbookAnswer(hit);
    return answer.value || "";
  }

  function buildTeacherExport() {
    const course = document.body?.dataset?.course || "";
    const unit = document.body?.dataset?.unit || "";
    const title = normalizeInlineText(document.querySelector(".unit-header__title")?.textContent) || "Unit Export";
    const studentName = collectStudentName();

    const header = [];
    header.push("========================================================");
    header.push(`  ${title.toUpperCase()} - STUDENT SUBMISSION`);
    header.push("========================================================");
    header.push(`Course: ${course}`);
    header.push(`Unit: ${unit}`);
    header.push(`Student Name: ${studentName || "Not provided"}`);
    header.push(`Exported: ${new Date().toLocaleString()}`);
    header.push("");

    const lines = [];
    listCoreSections().forEach((section) => {
      const title = sectionTitle(section);
      const checkpoints = section.getAttribute("data-section-checkpoints") || "";
      lines.push(`--- ${title}${checkpoints ? ` (${checkpoints})` : ""} ---`);

      const workbookFields = Array.from(section.querySelectorAll("[data-workbook-field-wrap]"));
      workbookFields.forEach((wrapper) => {
        const { label, value } = collectWorkbookAnswer(wrapper);
        if (!value) return;
        lines.push(`${label}: ${value}`);
      });

      const scenarioPrompts = Array.from(section.querySelectorAll("[data-scenario-prompt]"));
      scenarioPrompts.forEach((prompt) => {
        const { question, answer, outcome } = collectScenarioAnswer(prompt);
        if (!answer) return;
        lines.push(`${question}: ${answer}`);
        if (outcome) {
          lines.push(`Outcome: ${outcome}`);
        }
      });

      const rankingRows = Array.from(section.querySelectorAll("[data-ranking-row]"));
      rankingRows.forEach((row) => {
        const label = normalizeInlineText(row.querySelector(".ranking__label")?.textContent) || "Ranking item";
        const value = normalizeInlineText(row.querySelector("[data-ranking-field]")?.value) || "";
        if (!value) return;
        lines.push(`${label}: ${value}`);
      });

      const trees = Array.from(section.querySelectorAll("[data-decision-tree]"));
      trees.forEach((tree, index) => {
        const visited = collectDecisionTreeExport(tree);
        if (visited.length === 0) return;
        const label = trees.length > 1 ? `Decision Path ${index + 1}` : "Decision Path";
        lines.push(`${label}: ${visited.join(" -> ")}`);
      });

      const simulators = Array.from(section.querySelectorAll("[data-simulator]"));
      simulators.forEach((simulator, index) => {
        const values = collectSimulatorExport(simulator);
        if (values.length === 0) return;
        const label = simulators.length > 1 ? `Budget Simulator ${index + 1}` : "Budget Simulator";
        lines.push(`${label}:`);
        values.forEach((entry) => lines.push(`- ${entry}`));
      });

      lines.push("");
    });

    return {
      filename: `${safeFilenamePart(title, "Unit")}_${safeFilenamePart(studentName, "Student")}.txt`,
      text: [...header, ...lines].join("\n")
    };
  }

  function restoreSectionCompletionFlags(flags) {
    if (!isPlainObject(flags)) return;
    listCoreSections().forEach((section) => {
      const id = section.getAttribute("id");
      if (!id) return;
      if (flags[id]) {
        section.classList.add("is-complete-section", "is-visited-section");
      }
    });
  }

  function initAccordionHandlers(onChange) {
    document.querySelectorAll("[data-accordion-item]").forEach((item) => {
      const button = item.querySelector(".accordion__trigger");
      const panel = item.querySelector(".accordion__panel");
      if (!button || !panel) return;
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", open ? "false" : "true");
        button.classList.toggle("is-open", !open);
        panel.hidden = open;
        onChange();
      });
    });
  }

  function initKnowledgeHandlers(onChange) {
    document.querySelectorAll("[data-knowledge]").forEach((item) => {
      const button = item.querySelector("[data-knowledge-toggle]");
      const panel = item.querySelector("[data-knowledge-panel]");
      if (!button || !panel) return;
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", open ? "false" : "true");
        button.classList.toggle("is-open", !open);
        panel.hidden = open;
        onChange();
      });
    });
  }

  function initWorkbookHintHandlers() {
    document.querySelectorAll("[data-workbook-hint-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const panelId = button.getAttribute("aria-controls");
        if (!panelId) return;
        const panel = document.getElementById(panelId);
        if (!panel) return;
        const expanded = button.getAttribute("aria-expanded") === "true";
        const next = !expanded;
        button.setAttribute("aria-expanded", next ? "true" : "false");
        button.textContent = next ? "Hide Hint" : "Show Hint";
        panel.hidden = !next;
      });
    });
  }

  function initFlashcardHandlers(onChange) {
    document.querySelectorAll("[data-flashcard]").forEach((card) => {
      const front = card.querySelector("[data-flashcard-front]");
      const back = card.querySelector("[data-flashcard-back]");
      if (!front || !back) return;

      front.addEventListener("click", () => {
        front.hidden = true;
        back.hidden = false;
        card.classList.add("is-reviewed");
        onChange();
      });

      back.addEventListener("click", () => {
        back.hidden = true;
        front.hidden = false;
        onChange();
      });
    });
  }

  function initWorkbookHandlers(onChange) {
    document.querySelectorAll("[data-workbook-field]").forEach((field) => {
      const kind = field.getAttribute("data-workbook-kind");
      const eventName = kind === "text" || kind === "textarea" ? "input" : "change";
      field.addEventListener(eventName, () => {
        if (kind === "textarea" && field.getAttribute("data-autosize") !== "false") {
          autoResizeTextarea(field);
        }
        onChange();
      });
    });
  }

  function initScenarioHandlers(onChange) {
    document.querySelectorAll("[data-scenario-choice]").forEach((choice) => {
      choice.addEventListener("change", () => {
        const prompt = choice.closest("[data-scenario-prompt]");
        if (prompt) {
          showScenarioOutcome(prompt, choice.value);
        }
        onChange();
      });
    });
  }

  function initRankingHandlers(onChange) {
    document.querySelectorAll("[data-ranking-field]").forEach((field) => {
      field.addEventListener("change", () => {
        onChange();
      });
    });
  }

  function initDecisionTreeHandlers(onChange) {
    document.querySelectorAll("[data-decision-tree]").forEach((tree) => {
      tree.querySelectorAll("[data-decision-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const next = button.getAttribute("data-next-node");
          if (!next) return;
          showDecisionNode(tree, next);
          onChange();
        });
      });
      const restart = tree.querySelector("[data-decision-restart]");
      if (restart) {
        restart.addEventListener("click", () => {
          const startNode = tree.getAttribute("data-start-node") || "";
          showDecisionNode(tree, startNode, new Set(startNode ? [startNode] : []));
          onChange();
        });
      }
    });
  }

  function initSimulatorHandlers(onChange) {
    document.querySelectorAll("[data-simulator-field]").forEach((field) => {
      field.addEventListener("input", () => {
        onChange();
      });
    });
    document.querySelectorAll("[data-simulator-note]").forEach((field) => {
      field.addEventListener("input", () => {
        onChange();
      });
    });
  }

  function sectionTitle(section) {
    const heading = section.querySelector(".section-header");
    const index = section.getAttribute("data-section-index");
    if (heading && heading.textContent) {
      return index ? `Section ${index}: ${heading.textContent.trim()}` : heading.textContent.trim();
    }
    return section.getAttribute("id") || "Section";
  }

  function initSectionStage(initialSectionId = "", reducedMotion = false, onSectionChange = null) {
    const stage = document.querySelector("[data-section-stage]");
    const contentColumn = document.querySelector(".content-column");
    if (!stage || !contentColumn) return false;

    const sections = listCoreSections();
    const auxSections = listAuxSections();
    if (sections.length <= 1) {
      stage.hidden = true;
      return false;
    }

    const titleNode = stage.querySelector("[data-stage-title]");
    const prevButton = stage.querySelector("[data-stage-prev]");
    const nextButton = stage.querySelector("[data-stage-next]");
    if (!titleNode || !prevButton || !nextButton) return false;

    document.body.classList.add("js-paged");

    const stepperButtons = Array.from(stage.querySelectorAll("[data-stepper-item]"));

    const links = new Map();
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const key = link.getAttribute("data-nav-link");
      if (!key) return;
      links.set(key, link);
    });

    const targetSectionIndexById = new Map();
    const auxSectionById = new Map();
    auxSections.forEach((section) => {
      const id = section.getAttribute("id");
      if (!id) return;
      auxSectionById.set(id, section);
    });
    links.forEach((_, id) => {
      const target = document.getElementById(id);
      const parentSection = target?.closest("[data-section]");
      if (!parentSection) return;
      const index = sections.indexOf(parentSection);
      if (index >= 0) {
        targetSectionIndexById.set(id, index);
      }
    });

    let currentIndex = 0;
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (hashId && targetSectionIndexById.has(hashId)) {
      currentIndex = targetSectionIndexById.get(hashId) || 0;
    } else if (initialSectionId && targetSectionIndexById.has(initialSectionId)) {
      currentIndex = targetSectionIndexById.get(initialSectionId) || 0;
    }

    function hideAuxSections() {
      auxSections.forEach((section) => {
        section.hidden = true;
        section.classList.remove("is-active-section");
      });
    }

    function setActive(nextIndex, { updateHash = true, hashIdOverride = "" } = {}) {
      currentIndex = Math.max(0, Math.min(sections.length - 1, nextIndex));
      const activeSection = sections[currentIndex];
      const activeId = activeSection.getAttribute("id") || "";

      hideAuxSections();
      sections.forEach((section, index) => {
        const isActive = index === currentIndex;
        section.hidden = !isActive;
        section.classList.toggle("is-active-section", isActive);
        if (isActive) section.classList.add("is-visible", "is-visited-section");
      });

      titleNode.textContent = sectionTitle(activeSection);
      prevButton.disabled = currentIndex === 0;
      const atEnd = currentIndex === sections.length - 1;
      nextButton.disabled = atEnd;
      nextButton.textContent = atEnd ? "Finish Core Sections" : "Next Section";

      stepperButtons.forEach((button) => {
        const targetId = button.getAttribute("data-stepper-target");
        if (!targetId) return;
        button.setAttribute("aria-current", targetId === activeId ? "step" : "false");
      });

      links.forEach((link, id) => {
        link.classList.toggle("is-active", id === activeId);
      });

      const hashId = hashIdOverride || activeId;
      if (updateHash && hashId) {
        window.history.replaceState(null, "", `#${encodeURIComponent(hashId)}`);
      }
      if (typeof onSectionChange === "function") {
        onSectionChange(activeId);
      }
    }

    function showAuxSection(sectionId, { updateHash = true } = {}) {
      const target = auxSectionById.get(sectionId);
      if (!target) return false;

      sections.forEach((section) => {
        section.hidden = true;
        section.classList.remove("is-active-section");
      });
      hideAuxSections();
      target.hidden = false;
      target.classList.add("is-active-section", "is-visible", "is-visited-section");

      const header = target.querySelector(".section-header");
      titleNode.textContent = header?.textContent?.trim() || sectionId;
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex === sections.length - 1;
      nextButton.textContent = currentIndex === sections.length - 1 ? "Finish Core Sections" : "Next Section";

      stepperButtons.forEach((button) => {
        button.setAttribute("aria-current", "false");
      });
      links.forEach((link, id) => {
        link.classList.toggle("is-active", id === sectionId);
      });

      if (updateHash) {
        window.history.replaceState(null, "", `#${encodeURIComponent(sectionId)}`);
      }
      if (typeof onSectionChange === "function") {
        onSectionChange(sectionId);
      }
      return true;
    }

    prevButton.addEventListener("click", () => {
      setActive(currentIndex - 1);
      updateSectionCompletionUi();
      stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });

    nextButton.addEventListener("click", () => {
      setActive(currentIndex + 1);
      updateSectionCompletionUi();
      stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });

    links.forEach((link, id) => {
      const index = targetSectionIndexById.get(id);
      const isAuxTarget = auxSectionById.has(id);
      if (index === undefined && !isAuxTarget) return;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (index !== undefined) {
          setActive(index, { hashIdOverride: id });
        } else {
          showAuxSection(id);
        }
        const target = document.getElementById(id);
        if (target) {
          window.setTimeout(() => {
            target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          }, 20);
        }
        updateSectionCompletionUi();
      });
    });

    stepperButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-stepper-target");
        const index = targetId ? targetSectionIndexById.get(targetId) : undefined;
        if (index === undefined) return;
        setActive(index);
        updateSectionCompletionUi();
        stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    });

    window.addEventListener("hashchange", () => {
      const nextHash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      const mappedIndex = targetSectionIndexById.get(nextHash);
      if (mappedIndex !== undefined) {
        setActive(mappedIndex, { updateHash: false });
      } else if (auxSectionById.has(nextHash)) {
        showAuxSection(nextHash, { updateHash: false });
      } else {
        return;
      }
      updateSectionCompletionUi();
    });

    if ((hashId && auxSectionById.has(hashId)) || (initialSectionId && auxSectionById.has(initialSectionId))) {
      showAuxSection(hashId && auxSectionById.has(hashId) ? hashId : initialSectionId, { updateHash: false });
    } else {
      setActive(currentIndex, { updateHash: false });
    }
    updateSectionCompletionUi();
    return true;
  }

  function initStickyNav() {
    const links = new Map();
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const key = link.getAttribute("data-nav-link");
      if (!key) return;
      links.set(key, link);
    });
    const sections = Array.from(document.querySelectorAll("[data-section], .section-subheading[id]"));
    if (sections.length === 0 || links.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("id");
          if (!id) continue;
          links.forEach((link, key) => {
            link.classList.toggle("is-active", key === id);
          });
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 1]
      }
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initScrollProgress() {
    const container = document.createElement("div");
    container.className = "scroll-progress";
    const bar = document.createElement("div");
    bar.className = "scroll-progress__bar";
    container.appendChild(bar);
    document.body.prepend(container);

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${Math.min(100, Math.max(0, pct)).toFixed(2)}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initSectionReveal(reducedMotion = false) {
    const targets = Array.from(
      document.querySelectorAll(".objectives, .learning-dashboard, .section-stage, .unit-section, .resources, .flashcards, .workbook, .scenario, .ranking, .simulator, .decision-tree")
    );
    if (targets.length === 0) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const foldBottom = window.innerHeight * 1.18;
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top <= foldBottom) {
        target.classList.add("is-visible");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.15
      }
    );
    targets.forEach((target) => {
      if (!target.classList.contains("is-visible")) {
        observer.observe(target);
      }
    });
  }

  function initMissionBrief() {
    const toggle = document.querySelector("[data-mission-toggle]");
    const list = document.querySelector("[data-mission-list]");
    if (!toggle || !list) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
      toggle.textContent = next ? "Hide Objectives" : "Show Objectives";
      list.hidden = !next;
    });
  }

  function triggerCelebration(anchor, reducedMotion = false) {
    if (reducedMotion || !anchor || !anchor.parentElement) return;
    const burst = document.createElement("div");
    burst.className = "celebration-burst";
    for (let index = 0; index < 12; index += 1) {
      const dot = document.createElement("span");
      dot.className = "celebration-burst__dot";
      const angle = (Math.PI * 2 * index) / 12;
      const distance = 12 + (index % 4) * 6;
      dot.style.setProperty("--dx", `${Math.round(Math.cos(angle) * distance)}px`);
      dot.style.setProperty("--dy", `${Math.round(Math.sin(angle) * distance)}px`);
      burst.appendChild(dot);
    }
    anchor.parentElement.appendChild(burst);
    window.setTimeout(() => burst.remove(), 760);
  }

  function initCompletion(onComplete) {
    const button = document.querySelector("[data-mark-complete]");
    if (!button) return;
    button.addEventListener("click", () => onComplete(button));
  }

  function initTeacherExport() {
    document.querySelectorAll("[data-teacher-export]").forEach((button) => {
      button.addEventListener("click", () => {
        const payload = buildTeacherExport();
        downloadTextFile(payload.filename, payload.text);
      });
    });
  }

  function mount() {
    const stateKey = createStorageKey();
    let state = loadState(stateKey);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

    document.body.classList.add("js-animate");
    if (reducedMotion) {
      document.body.classList.add("js-reduced-motion");
    }
    initScrollProgress();
    initSectionReveal(reducedMotion);
    initMissionBrief();

    restoreAccordionState(state.accordion || {});
    restoreKnowledgeState(state.knowledge || {});
    restoreFlashcardState(state.flashcards || {});
    restoreWorkbookState(state.workbook || {});
    restoreScenarioState(state.scenario || {});
    restoreRankingState(state.ranking || {});
    restoreDecisionTreeState(state.decisionTree || {});
    restoreSimulatorState(state.simulator || {});
    restoreSectionCompletionFlags(state.sectionCompletion || {});
    refreshProgressUi();

    if (state.completed) {
      const completeBtn = document.querySelector("[data-mark-complete]");
      if (completeBtn) {
        completeBtn.setAttribute("aria-pressed", "true");
        const existing = completeBtn.parentElement?.querySelector(".completion-state");
        if (!existing) {
          const marker = document.createElement("span");
          marker.className = "completion-state";
          marker.textContent = "Completed";
          completeBtn.insertAdjacentElement("afterend", marker);
        }
      }
    }

    function persist(extra = {}) {
      state = {
        ...state,
        ...extra,
        scrollY: window.scrollY || 0,
        accordion: collectAccordionState(),
        knowledge: collectKnowledgeState(),
        flashcards: collectFlashcardState(),
        workbook: collectWorkbookState(),
        scenario: collectScenarioState(),
        ranking: collectRankingState(),
        decisionTree: collectDecisionTreeState(),
        simulator: collectSimulatorState(),
        activeSection: collectActiveSectionId(),
        sectionCompletion: collectSectionCompletionFlags()
      };
      saveState(stateKey, state);
    }

    function handleInteractionChange() {
      const prevCompletion = state.sectionCompletion || {};
      const sectionCompletion = refreshProgressUi();
      state = {
        ...state,
        sectionCompletion
      };
      Object.entries(sectionCompletion).forEach(([id, isComplete]) => {
        if (!isComplete) return;
        if (prevCompletion[id]) return;
        const button = document.querySelector(`[data-stepper-item][data-stepper-target="${id}"]`);
        triggerCelebration(button, reducedMotion);
      });
      persist();
    }

    initAccordionHandlers(() => persist());
    initKnowledgeHandlers(() => persist());
    initWorkbookHintHandlers();
    initFlashcardHandlers(handleInteractionChange);
    initWorkbookHandlers(handleInteractionChange);
    initScenarioHandlers(handleInteractionChange);
    initRankingHandlers(handleInteractionChange);
    initDecisionTreeHandlers(handleInteractionChange);
    initSimulatorHandlers(handleInteractionChange);
    initTeacherExport();
    const isPaged = initSectionStage(String(state.activeSection || ""), reducedMotion, () => persist());
    if (!isPaged) {
      initStickyNav();
      if (typeof state.scrollY === "number") {
        window.scrollTo({ top: state.scrollY, behavior: "auto" });
      }
    } else {
      const stage = document.querySelector("[data-section-stage]");
      if (stage) {
        window.requestAnimationFrame(() => {
          const offsetTop = Math.max(0, window.scrollY + stage.getBoundingClientRect().top - 16);
          window.scrollTo({ top: offsetTop, behavior: "auto" });
        });
      }
    }
    initCompletion((button) => {
      button.setAttribute("aria-pressed", "true");
      let marker = button.parentElement?.querySelector(".completion-state");
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "completion-state";
        marker.textContent = "Completed";
        button.insertAdjacentElement("afterend", marker);
      }
      if (window.CF_SCORM && typeof window.CF_SCORM.markComplete === "function") {
        window.CF_SCORM.markComplete();
      }
      triggerCelebration(button, reducedMotion);
      persist({ completed: true });
    });

    window.addEventListener("beforeunload", () => {
      persist();
      if (window.CF_SCORM && typeof window.CF_SCORM.finish === "function") {
        window.CF_SCORM.finish();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "hidden") return;
      persist();
      if (window.CF_SCORM && typeof window.CF_SCORM.commit === "function") {
        window.CF_SCORM.commit();
      }
    });

    window.setInterval(() => {
      persist();
      if (window.CF_SCORM && typeof window.CF_SCORM.commit === "function") {
        window.CF_SCORM.commit();
      }
    }, 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
