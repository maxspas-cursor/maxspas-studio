(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initReveals() {
    const items = document.querySelectorAll(".reveal, .reveal-stagger > *");
    if (!items.length) return;

    if (reduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el, i) => {
      if (el.parentElement?.classList.contains("reveal-stagger")) {
        el.style.setProperty("--reveal-i", String(i));
      }
      io.observe(el);
    });
  }

  function initSpecBars() {
    const bars = document.querySelectorAll(".spec-bar");
    if (!bars.length || reduced) {
      bars.forEach((b) => b.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );
    bars.forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        b.classList.add("is-visible");
        return;
      }
      io.observe(b);
    });
  }

  function initParallax() {
    const layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || reduced) return;

    let raf = 0;
    window.addEventListener(
      "mousemove",
      (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const cx = (e.clientX / window.innerWidth - 0.5) * 2;
          const cy = (e.clientY / window.innerHeight - 0.5) * 2;
          layers.forEach((el) => {
            const depth = Number(el.getAttribute("data-parallax")) || 8;
            el.style.transform = `translate(${cx * depth}px, ${cy * depth * 0.6}px)`;
          });
        });
      },
      { passive: true }
    );
  }

  function initScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    window.addEventListener(
      "scroll",
      () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
      },
      { passive: true }
    );
  }

  function initThemeZones() {
    if (document.body.dataset.page === "home") return;

    const zones = document.querySelectorAll("main > section[data-theme-zone]");
    if (!zones.length || !window.MSTheme) return;

    let lastSwitch = 0;
    const COOLDOWN_MS = 500;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const t = visible.target.getAttribute("data-theme-zone");
        if (!t || window.MSTheme.getTheme() === t) return;

        const now = Date.now();
        if (now - lastSwitch < COOLDOWN_MS) return;
        lastSwitch = now;
        window.MSTheme.setTheme(t, { fromScroll: true });
      },
      { threshold: [0.35, 0.55], rootMargin: "-18% 0px -30% 0px" }
    );

    zones.forEach((z) => io.observe(z));
  }

  function boot() {
    initReveals();
    initSpecBars();
    initParallax();
    initScrollProgress();
    initThemeZones();
  }

  window.MSMotion = {
    refresh() {
      initReveals();
      initSpecBars();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
