(() => {
  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    });
  }

  function updateWorkbookProgress() {
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
    });
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
    });
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
    document.querySelectorAll("[data-ranking]").forEach((ranking) => {
      const fields = Array.from(ranking.querySelectorAll("[data-ranking-field]"));
      const total = fields.length;
      const completed = fields.filter((field) => String(field.value || "").trim().length > 0).length;
      const output = ranking.querySelector("[data-ranking-progress]");
      if (output) {
        output.textContent = `${completed} / ${total} ranked`;
      }
      ranking.classList.toggle("is-complete", total > 0 && completed === total);
    });
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

  function updateDecisionTreeProgress() {
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
    });
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

  function initFlashcardHandlers(onChange) {
    document.querySelectorAll("[data-flashcard]").forEach((card) => {
      const front = card.querySelector("[data-flashcard-front]");
      const back = card.querySelector("[data-flashcard-back]");
      if (!front || !back) return;

      front.addEventListener("click", () => {
        front.hidden = true;
        back.hidden = false;
        card.classList.add("is-reviewed");
        updateFlashcardProgress();
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
        updateWorkbookProgress();
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
        updateScenarioProgress();
        onChange();
      });
    });
  }

  function initRankingHandlers(onChange) {
    document.querySelectorAll("[data-ranking-field]").forEach((field) => {
      field.addEventListener("change", () => {
        updateRankingProgress();
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
          updateDecisionTreeProgress();
          onChange();
        });
      });
      const restart = tree.querySelector("[data-decision-restart]");
      if (restart) {
        restart.addEventListener("click", () => {
          const startNode = tree.getAttribute("data-start-node") || "";
          showDecisionNode(tree, startNode, new Set(startNode ? [startNode] : []));
          updateDecisionTreeProgress();
          onChange();
        });
      }
    });
  }

  function initStickyNav() {
    const links = new Map();
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      links.set(link.getAttribute("data-nav-link"), link);
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

  function initSectionReveal() {
    const targets = Array.from(
      document.querySelectorAll(".objectives, .unit-section, .resources, .flashcards, .workbook, .scenario, .ranking, .decision-tree")
    );
    if (targets.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

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
    targets.forEach((target) => observer.observe(target));
  }

  function initCompletion(onComplete) {
    const button = document.querySelector("[data-mark-complete]");
    if (!button) return;
    button.addEventListener("click", () => onComplete(button));
  }

  function mount() {
    const stateKey = createStorageKey();
    let state = loadState(stateKey);

    document.body.classList.add("js-animate");
    initScrollProgress();
    initSectionReveal();

    restoreAccordionState(state.accordion || {});
    restoreFlashcardState(state.flashcards || {});
    restoreWorkbookState(state.workbook || {});
    restoreScenarioState(state.scenario || {});
    restoreRankingState(state.ranking || {});
    restoreDecisionTreeState(state.decisionTree || {});
    updateFlashcardProgress();
    updateWorkbookProgress();
    updateScenarioProgress();
    updateRankingProgress();
    updateDecisionTreeProgress();

    if (typeof state.scrollY === "number") {
      window.scrollTo({ top: state.scrollY, behavior: "auto" });
    }

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
        flashcards: collectFlashcardState(),
        workbook: collectWorkbookState(),
        scenario: collectScenarioState(),
        ranking: collectRankingState(),
        decisionTree: collectDecisionTreeState()
      };
      saveState(stateKey, state);
    }

    initAccordionHandlers(() => persist());
    initFlashcardHandlers(() => persist());
    initWorkbookHandlers(() => persist());
    initScenarioHandlers(() => persist());
    initRankingHandlers(() => persist());
    initDecisionTreeHandlers(() => persist());
    initStickyNav();
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
