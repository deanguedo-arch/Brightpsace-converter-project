(() => {
  function mountSandboxBanner() {
    if (document.body?.dataset?.mode !== "sandbox") return;
    const note = document.createElement("div");
    note.className = "sandbox-note";
    note.textContent = "Sandbox overlays active. Not included in SCORM builds.";
    document.body.prepend(note);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSandboxBanner, { once: true });
  } else {
    mountSandboxBanner();
  }
})();
