export function getScormWrapperScript() {
  return `(function () {
  var API = null;
  var initialized = false;
  var stateCache = null;

  function findApi(win) {
    var attempts = 0;
    while (win && attempts < 10) {
      if (win.API) return win.API;
      if (win.parent && win.parent !== win) {
        win = win.parent;
      } else {
        break;
      }
      attempts += 1;
    }
    return null;
  }

  function getApi() {
    if (API) return API;
    API = findApi(window) || (window.opener ? findApi(window.opener) : null);
    return API;
  }

  function callApi(method, args) {
    var api = getApi();
    if (!api || typeof api[method] !== "function") return "";
    try {
      return api[method].apply(api, args || []);
    } catch (error) {
      return "";
    }
  }

  function init() {
    if (initialized) return true;
    var result = callApi("LMSInitialize", [""]);
    initialized = result === "true" || result === true || result === "1";
    return initialized;
  }

  function loadState() {
    if (stateCache) return stateCache;
    if (!init()) return {};
    var raw = callApi("LMSGetValue", ["cmi.suspend_data"]);
    if (!raw) {
      stateCache = {};
      return stateCache;
    }
    try {
      stateCache = JSON.parse(raw);
      return stateCache;
    } catch (error) {
      stateCache = {};
      return stateCache;
    }
  }

  function saveState(state) {
    stateCache = state || {};
    if (!init()) return false;
    var payload = JSON.stringify(stateCache);
    callApi("LMSSetValue", ["cmi.suspend_data", payload]);
    return true;
  }

  function markComplete() {
    if (!init()) return false;
    callApi("LMSSetValue", ["cmi.core.lesson_status", "completed"]);
    return true;
  }

  function commit() {
    if (!init()) return false;
    callApi("LMSCommit", [""]);
    return true;
  }

  function finish() {
    if (!initialized) return false;
    callApi("LMSFinish", [""]);
    initialized = false;
    return true;
  }

  window.CF_SCORM = {
    init: init,
    loadState: loadState,
    saveState: saveState,
    markComplete: markComplete,
    commit: commit,
    finish: finish
  };

  init();
})();`;
}
