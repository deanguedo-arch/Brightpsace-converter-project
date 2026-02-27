(() => {
  function readJsonSafe(value, fallback) {
    try {
      return JSON.parse(value);
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
      if (scormState && typeof scormState === "object") return scormState;
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
      document.querySelectorAll(".objectives, .unit-section, .resources, .flashcards")
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
    updateFlashcardProgress();

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
        flashcards: collectFlashcardState()
      };
      saveState(stateKey, state);
    }

    initAccordionHandlers(() => persist());
    initFlashcardHandlers(() => persist());
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
