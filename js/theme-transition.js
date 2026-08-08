/**
 * FROZEN — Theme transition Studio ↔ 3D GRBNK (maxspas-hybrid)
 * Не изменять анимацию, тайминги и UX без явной просьбы владельца.
 * Спека: maxspas-studio/.cursor/rules/theme-transition-frozen.mdc
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const STORAGE_KEY = "ms-theme-transition";
  const DURATION = 720;
  const LOGOS = {
    studio: "/assets/logo-mark.svg",
    grbnk: "/assets/logo-3dgrbnk.svg",
  };
  const LABELS = {
    studio: "MAXSPAS Studio",
    grbnk: "3D GRBNK",
  };
  const SUBS = {
    studio: "Сайты · боты · студия",
    grbnk: "Модели · печать · STL",
  };

  let portal = null;
  let busy = false;
  let scrollReady = false;
  const PARTICLE_MIN = 8;
  const PARTICLE_MAX = 14;
  const SCROLL_LOGO_STREAM_MS = 15000;
  const SCROLL_LOGO_PAUSE_MS = 3000;
  const SCROLL_LOGO_INTERVAL_MS = 850;
  const SCROLL_LOGO_MIX_ON = 0.4;
  const SCROLL_LOGO_MIX_OFF = 0.1;

  function scrollMix() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--theme-mix")) || 0;
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scrollLogoInterval = null;
  let scrollLogoStopTimeout = null;
  let scrollLogoCycleTimeout = null;
  let scrollLogoStreamActive = false;
  let scrollLogoLoopEnabled = false;
  let entranceTimer = null;
  let scrollTick = null;

  function themeOfPath(path) {
    const normalized = path.replace(/\.html$/, "").replace(/\/$/, "");
    return /\/grbnk$/.test(normalized) ? "grbnk" : "studio";
  }

  function currentTheme() {
    return themeOfPath(location.pathname);
  }

  function switchAnchor() {
    const btn = document.getElementById("theme-cta-switch");
    const corner = document.querySelector(".corner--br");
    const el = btn || corner;
    if (!el) {
      return { x: window.innerWidth * 0.92, y: window.innerHeight * 0.9 };
    }
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function ensurePortal() {
    if (portal) return portal;
    portal = document.createElement("div");
    portal.id = "theme-portal";
    portal.setAttribute("aria-hidden", "true");
    portal.innerHTML = `
      <div class="theme-portal__origin" aria-hidden="true"></div>
      <div class="theme-portal__scan" aria-hidden="true"></div>
      <div class="theme-portal__wipe theme-portal__wipe--studio" aria-hidden="true"></div>
      <div class="theme-portal__wipe theme-portal__wipe--grbnk" aria-hidden="true"></div>
      <div class="theme-portal__sigil" aria-hidden="true">
        <img class="theme-portal__sigil-logo" alt="" width="48" height="48">
        <span class="theme-portal__sigil-word"></span>
      </div>
      <div class="theme-portal__core">
        <div class="theme-portal__ring" aria-hidden="true"></div>
        <div class="theme-portal__core-mark">
          <div class="theme-portal__cube" aria-hidden="true">
            <div class="theme-portal__cube-face theme-portal__cube-face--top"></div>
            <div class="theme-portal__cube-face theme-portal__cube-face--left"></div>
            <div class="theme-portal__cube-face theme-portal__cube-face--right"></div>
          </div>
        </div>
        <p class="theme-portal__label"></p>
        <p class="theme-portal__sub"></p>
      </div>`;
    document.body.appendChild(portal);
    return portal;
  }

  function setPortalText(to) {
    const label = portal.querySelector(".theme-portal__label");
    const sub = portal.querySelector(".theme-portal__sub");
    if (label) label.textContent = LABELS[to] || to;
    if (sub) sub.textContent = SUBS[to] || "";
    portal.dataset.target = to;
  }

  function aimPortal(to) {
    const { x, y } = switchAnchor();
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.46;
    setPortalText(to);
    portal.style.setProperty("--portal-x", `${x}px`);
    portal.style.setProperty("--portal-y", `${y}px`);
    portal.style.setProperty("--portal-dx", `${cx - x}px`);
    portal.style.setProperty("--portal-dy", `${cy - y}px`);

    const img = portal.querySelector(".theme-portal__sigil-logo");
    if (img) img.src = LOGOS[to] || LOGOS.studio;

    const btn = document.getElementById("theme-cta-switch");
    if (btn) {
      btn.classList.add("is-portal-source");
      btn.dataset.portalTarget = to;
      mountButtonFX(btn, to);
    }
  }

  function clearPortalSource() {
    const btn = document.getElementById("theme-cta-switch");
    if (!btn) return;
    btn.classList.remove("is-portal-source");
    delete btn.dataset.portalTarget;
    unmountButtonFX(btn);
    clearPortalBurst();
  }

  function clearPortalPending() {
    document.documentElement.classList.remove("is-portal-pending");
    delete document.documentElement.dataset.portalEnter;
  }

  function spawnPortalLogos(to) {
    const { x, y } = switchAnchor();
    createLogoBurst({
      id: "theme-portal-burst-btn",
      to,
      x,
      y,
      durMin: 1100,
      durRange: 900,
    });
  }

  function clearScrollLogoStream() {
    scrollLogoLoopEnabled = false;
    if (scrollLogoInterval) {
      window.clearInterval(scrollLogoInterval);
      scrollLogoInterval = null;
    }
    if (scrollLogoStopTimeout) {
      window.clearTimeout(scrollLogoStopTimeout);
      scrollLogoStopTimeout = null;
    }
    if (scrollLogoCycleTimeout) {
      window.clearTimeout(scrollLogoCycleTimeout);
      scrollLogoCycleTimeout = null;
    }
    scrollLogoStreamActive = false;
    document.querySelectorAll(".theme-portal__logo-fly--scroll").forEach((el) => el.remove());
    document.getElementById("theme-portal-burst-scroll")?.remove();
  }

  function runScrollLogoBurst() {
    if (reducedMotion.matches || !scrollLogoLoopEnabled) return;
    if (scrollLogoInterval) {
      window.clearInterval(scrollLogoInterval);
      scrollLogoInterval = null;
    }
    if (scrollLogoStopTimeout) {
      window.clearTimeout(scrollLogoStopTimeout);
      scrollLogoStopTimeout = null;
    }
    scrollLogoStreamActive = true;
    appendScrollPortalLogo();
    appendScrollPortalLogo();
    scrollLogoInterval = window.setInterval(() => {
      appendScrollPortalLogo();
      if (Math.random() > 0.35) appendScrollPortalLogo();
    }, SCROLL_LOGO_INTERVAL_MS);
    scrollLogoStopTimeout = window.setTimeout(() => {
      if (scrollLogoInterval) {
        window.clearInterval(scrollLogoInterval);
        scrollLogoInterval = null;
      }
      scrollLogoStreamActive = false;
      scrollLogoStopTimeout = null;
      if (!scrollLogoLoopEnabled) {
        document.getElementById("theme-portal-burst-scroll")?.remove();
        return;
      }
      scrollLogoCycleTimeout = window.setTimeout(() => {
        scrollLogoCycleTimeout = null;
        if (scrollLogoLoopEnabled) runScrollLogoBurst();
      }, SCROLL_LOGO_PAUSE_MS);
    }, SCROLL_LOGO_STREAM_MS);
  }

  function enableScrollLogoLoop() {
    if (reducedMotion.matches || scrollLogoLoopEnabled) return;
    scrollLogoLoopEnabled = true;
    runScrollLogoBurst();
  }

  function ensureScrollLogoContainer() {
    let container = document.getElementById("theme-portal-burst-scroll");
    if (container) return container;
    container = document.createElement("div");
    container.id = "theme-portal-burst-scroll";
    container.className = "theme-portal-burst theme-portal-burst--scroll";
    container.dataset.target = "grbnk";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
    return container;
  }

  function portalSpawnPoint() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const mix = scrollMix();
    const spread = Math.min(vw * 0.52, 440);
    const baseY = vh - (28 + mix * vh * 0.04) - Math.random() * 20;
    return {
      x: vw * 0.5 + (Math.random() - 0.5) * spread,
      y: baseY,
    };
  }

  function appendScrollPortalLogo() {
    if (reducedMotion.matches) return;
    const { x, y } = portalSpawnPoint();
    const maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.38;
    const dx = (Math.random() - 0.5) * maxDist * 1.15;
    const dy = -(Math.random() * 0.72 + 0.18) * maxDist;
    const size = 28 + Math.random() * 16;
    const rot = Math.random() * 360 - 180;
    const dur = 9000 + Math.random() * 3000;
    const delay = Math.random() * 200;

    const el = document.createElement("div");
    el.className = "theme-portal__logo-fly theme-portal__logo-fly--scroll";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("--lg-dx", `${dx.toFixed(1)}px`);
    el.style.setProperty("--lg-dy", `${dy.toFixed(1)}px`);
    el.style.setProperty("--lg-rot", `${rot.toFixed(1)}deg`);
    el.style.setProperty("--lg-size", `${size.toFixed(0)}px`);
    el.style.setProperty("--lg-dur", `${dur.toFixed(0)}ms`);
    el.style.setProperty("--lg-delay", `${delay.toFixed(0)}ms`);
    el.innerHTML = `<img src="${LOGOS.grbnk}" alt="" width="40" height="40" decoding="async">`;
    document.body.appendChild(el);
    window.requestAnimationFrame(() => {
      void el.offsetWidth;
    });
    window.setTimeout(() => el.remove(), dur + delay + 200);
  }

  function startScrollLogoStream() {
    enableScrollLogoLoop();
  }

  function mountButtonFX(btn, to) {
    if (!btn) return;
    let fx = btn.querySelector(".theme-portal-btn-fx");
    if (!fx) {
      fx = document.createElement("span");
      fx.className = "theme-portal-btn-fx";
      fx.setAttribute("aria-hidden", "true");
      btn.prepend(fx);
    }
    fx.innerHTML = `
      <span class="theme-portal-btn-fx__halo"></span>
      <span class="theme-portal-btn-fx__rays"></span>`;
    fx.dataset.target = to;
  }

  function unmountButtonFX(btn) {
    btn?.querySelector(".theme-portal-btn-fx")?.remove();
  }

  function clearPortalBurst() {
    document.getElementById("theme-portal-burst-btn")?.remove();
  }

  function createLogoBurst({
    id,
    to,
    x,
    y,
    countMin = PARTICLE_MIN,
    countMax = PARTICLE_MAX,
    distScale = 0.48,
    sizeMin = 36,
    sizeRange = 40,
    durMin = 780,
    durRange = 520,
  }) {
    if (reducedMotion.matches) return null;

    document.getElementById(id)?.remove();
    const logo = LOGOS[to] || LOGOS.studio;
    const container = document.createElement("div");
    container.id = id;
    container.className = "theme-portal-burst";
    container.dataset.target = to;
    container.dataset.origin = id.includes("scroll") ? "portal" : "button";
    container.setAttribute("aria-hidden", "true");

    const count = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
    const maxDist = Math.min(window.innerWidth, window.innerHeight) * distScale;
    let maxEnd = 0;

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = maxDist * (0.4 + Math.random() * 0.6);
      const dx = Math.cos(angle) * dist + (Math.random() - 0.5) * 72;
      const dy = Math.sin(angle) * dist + (Math.random() - 0.5) * 72;
      const size = sizeMin + Math.random() * sizeRange;
      const rot = Math.random() * 720 - 360;
      const dur = durMin + Math.random() * durRange;
      const delay = Math.random() * 120;
      maxEnd = Math.max(maxEnd, dur + delay);

      const el = document.createElement("div");
      el.className = "theme-portal__logo-fly";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty("--lg-dx", `${dx.toFixed(1)}px`);
      el.style.setProperty("--lg-dy", `${dy.toFixed(1)}px`);
      el.style.setProperty("--lg-rot", `${rot.toFixed(1)}deg`);
      el.style.setProperty("--lg-size", `${size.toFixed(0)}px`);
      el.style.setProperty("--lg-dur", `${dur.toFixed(0)}ms`);
      el.style.setProperty("--lg-delay", `${delay.toFixed(0)}ms`);
      el.innerHTML = `<img src="${logo}" alt="" width="48" height="48">`;
      container.appendChild(el);
    }

    document.body.appendChild(container);
    window.requestAnimationFrame(() => container.classList.add("is-active"));
    window.setTimeout(() => document.getElementById(id)?.remove(), maxEnd + 120);
    return container;
  }

  function playTransition(to, { mode = "full", navigate = false, onMid } = {}) {
    return new Promise((resolve) => {
      if (busy) {
        resolve();
        return;
      }
      busy = true;
      ensurePortal();
      aimPortal(to);
      portal.classList.remove("is-exit", "is-enter", "is-soft", "is-from-switch");
      portal.classList.add("is-active", "is-from-switch", mode === "soft" ? "is-soft" : "is-exit");
      window.requestAnimationFrame(() => {
        if (mode !== "soft") spawnPortalLogos(to);
      });

      const half = mode === "soft" ? 220 : DURATION * 0.52;
      const navigateAt = navigate ? Math.max(half + 480, 920) : half;

      if (navigate) {
        window.setTimeout(() => {
          if (onMid) onMid();
          clearPortalSource();
          busy = false;
          resolve();
        }, navigateAt);
        return;
      }

      window.setTimeout(() => {
        if (onMid) onMid();
      }, half);

      window.setTimeout(() => {
        portal.classList.remove("is-exit");
        portal.classList.add("is-enter");
        window.setTimeout(() => {
          portal.classList.remove("is-active", "is-enter", "is-soft", "is-from-switch");
          clearPortalSource();
          busy = false;
          resolve();
        }, mode === "soft" ? 280 : DURATION * 0.48);
      }, half);
    });
  }

  function isThemeLink(anchor) {
    if (!anchor.href || anchor.target === "_blank") return null;
    let url;
    try {
      url = new URL(anchor.href, location.href);
    } catch {
      return null;
    }
    if (url.origin !== location.origin) return null;
    const from = currentTheme();
    const to = themeOfPath(url.pathname);
    if (from === to) return null;
    if (url.pathname.startsWith("/idei/") || url.pathname.startsWith("/api/")) return null;
    return { url: url.href, to };
  }

  function bindNavigation() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const jump = isThemeLink(a);
      if (!jump) return;
      e.preventDefault();
      sessionStorage.setItem(STORAGE_KEY, jump.to);
      playTransition(jump.to, { navigate: true }).then(() => {
        location.href = jump.url;
      });
    });
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function updateScrollPortalFX(btn, mix) {
    if (!btn) return;

    if (mix < 0.28) {
      btn.classList.remove("is-scroll-portal", "is-scroll-portal-end");
      btn.style.removeProperty("--scroll-portal-mix");
      return;
    }

    btn.classList.add("is-scroll-portal");
    btn.style.setProperty("--scroll-portal-mix", mix.toFixed(3));
    btn.classList.toggle("is-scroll-portal-end", mix >= 0.72);
  }

  function initScrollTheme() {
    if (scrollReady || document.body.dataset.page !== "home") return;
    const anchor = document.querySelector("[data-theme-scroll='grbnk']");
    if (!anchor) return;
    scrollReady = true;

    const field = document.createElement("div");
    field.id = "theme-scroll-field";
    field.setAttribute("aria-hidden", "true");
    field.innerHTML = `
      <div class="theme-scroll-field__glow"></div>
      <div class="theme-scroll-field__horizon"></div>
      <p class="theme-scroll-field__tag">3D GRBNK</p>
      <div class="theme-scroll-field__mouth" id="theme-scroll-portal-mouth" aria-hidden="true"></div>`;
    document.body.appendChild(field);

    let chromeTheme = "studio";
    let raf = 0;

    function update() {
      raf = 0;
      const rect = anchor.getBoundingClientRect();
      const vh = window.innerHeight;
      const mix = clamp((vh * 0.9 - rect.top) / (vh * 0.62), 0, 1);

      document.documentElement.style.setProperty("--theme-mix", mix.toFixed(3));
      field.classList.toggle("is-strong", mix > 0.72);

      const btn = document.getElementById("theme-cta-switch");
      btn?.classList.toggle("is-charged", mix > 0.22);
      btn?.classList.toggle("is-charged-strong", mix > 0.58);
      updateScrollPortalFX(btn, mix);

      if (mix >= 0.55 && chromeTheme !== "grbnk") {
        chromeTheme = "grbnk";
        window.MSTheme?.setTheme("grbnk", { fromScroll: true });
        field.classList.add("is-pulse");
        window.setTimeout(() => field.classList.remove("is-pulse"), 520);
      } else if (mix <= 0.28 && chromeTheme !== "studio") {
        chromeTheme = "studio";
        window.MSTheme?.setTheme("studio", { fromScroll: true });
      }

      if (mix >= SCROLL_LOGO_MIX_ON) {
        enableScrollLogoLoop();
      } else if (mix < SCROLL_LOGO_MIX_OFF) {
        clearScrollLogoStream();
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!raf) raf = window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    window.addEventListener("resize", update, { passive: true });
    scrollTick = update;
    update();
  }

  function resetPortalFromBfcache() {
    sessionStorage.removeItem(STORAGE_KEY);
    clearPortalPending();
    busy = false;
    if (entranceTimer) {
      window.clearTimeout(entranceTimer);
      entranceTimer = null;
    }
    if (portal) {
      portal.classList.remove(
        "is-active",
        "is-enter-only",
        "is-reveal",
        "is-exit",
        "is-enter",
        "is-soft",
        "is-from-switch"
      );
    }
    clearPortalSource();
    clearPortalBurst();
    clearScrollLogoStream();
  }

  function runEntrance() {
    const enter = sessionStorage.getItem(STORAGE_KEY);
    if (!enter || currentTheme() !== enter) {
      if (enter) sessionStorage.removeItem(STORAGE_KEY);
      clearPortalPending();
      return;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    ensurePortal();
    setPortalText(enter);
    portal.dataset.target = enter;
    document.body.dataset.theme = enter;
    portal.classList.add("is-active", "is-enter-only");
    window.requestAnimationFrame(() => {
      portal.classList.add("is-reveal");
      entranceTimer = window.setTimeout(() => {
        entranceTimer = null;
        portal.classList.remove("is-active", "is-enter-only", "is-reveal");
        clearPortalPending();
        busy = false;
      }, DURATION);
    });
  }

  function boot() {
    ensurePortal();
    bindNavigation();
    initScrollTheme();
    runEntrance();
  }

  function onChromeReady() {
    if (scrollTick) {
      window.requestAnimationFrame(() => {
        scrollTick();
        window.requestAnimationFrame(scrollTick);
      });
      return;
    }
    initScrollTheme();
    if (scrollTick) window.requestAnimationFrame(scrollTick);
  }

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) resetPortalFromBfcache();
  });

  document.addEventListener("mschrome:ready", onChromeReady);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
