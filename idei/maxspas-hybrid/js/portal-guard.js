/**
 * FROZEN — часть theme transition. См. theme-transition-frozen.mdc
 */
(function () {
  function themeOfPath() {
    var p = location.pathname.replace(/\.html$/, "").replace(/\/$/, "");
    return /\/grbnk$/.test(p) ? "grbnk" : "studio";
  }

  function clearPending() {
    var root = document.documentElement;
    root.classList.remove("is-portal-pending");
    delete root.dataset.portalEnter;
  }

  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    try {
      sessionStorage.removeItem("ms-theme-transition");
      clearPending();
    } catch (err) {}
  });

  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.removeItem("ms-theme-transition");
      return;
    }
    var t = sessionStorage.getItem("ms-theme-transition");
    if (!t) return;
    if (t === themeOfPath()) {
      var root = document.documentElement;
      root.classList.add("is-portal-pending");
      root.dataset.portalEnter = t;
    } else {
      sessionStorage.removeItem("ms-theme-transition");
    }
  } catch (e) {}
})();
