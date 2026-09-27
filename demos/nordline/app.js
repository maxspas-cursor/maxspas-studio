(() => {
  const nav = document.getElementById("nav");
  const glow = document.getElementById("glow");
  const form = document.getElementById("briefForm");
  const filmStage = document.getElementById("filmStage");
  const filmKen = document.getElementById("filmKen");

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-solid", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (glow && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    }, { passive: true });
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // Film clips — flower video OR still; persist, no snap-back
  const filmVideo = document.getElementById("filmVideo");
  const heroVideo = document.getElementById("heroVideo");
  const applyClip = (btn) => {
    document.querySelectorAll(".clip").forEach((c) => c.classList.toggle("is-on", c === btn));
    const title = document.getElementById("filmCaptionTitle");
    const sub = document.getElementById("filmCaptionSub");
    if (title) title.textContent = btn.dataset.title || "";
    if (sub) sub.textContent = btn.dataset.sub || "";
    const mode = btn.dataset.mode || "still";
    const live = filmStage && filmStage.querySelector(".film__live");
    if (mode === "video" && btn.dataset.src) {
      if (filmKen) {
        filmKen.hidden = true;
        if (btn.dataset.poster) filmKen.style.backgroundImage = `url("${btn.dataset.poster}")`;
      }
      if (filmStage) {
        filmStage.classList.remove("is-fallback");
        filmStage.dataset.activePoster = btn.dataset.poster || "";
      }
      if (filmVideo) {
        filmVideo.hidden = false;
        filmVideo.poster = btn.dataset.poster || "";
        filmVideo.innerHTML = "";
        if (btn.dataset.webm) {
          const w = document.createElement("source");
          w.src = btn.dataset.webm;
          w.type = "video/webm";
          filmVideo.appendChild(w);
        }
        const s = document.createElement("source");
        s.src = btn.dataset.src;
        s.type = "video/mp4";
        filmVideo.appendChild(s);
        filmVideo.load();
        filmVideo.play().catch(() => {});
      }
      if (live) live.textContent = "LIVE · LOOP";
    } else {
      if (filmVideo) {
        filmVideo.pause();
        filmVideo.hidden = true;
      }
      if (filmKen) {
        filmKen.hidden = false;
        if (btn.dataset.poster) filmKen.style.backgroundImage = `url("${btn.dataset.poster}")`;
      }
      if (filmStage) {
        filmStage.classList.add("is-fallback");
        filmStage.dataset.activePoster = btn.dataset.poster || "";
      }
      if (live) live.textContent = "STILL · LOOP";
    }
  };
  document.querySelectorAll(".clip").forEach((btn) => {
    btn.addEventListener("click", () => applyClip(btn));
  });
  const initial = document.querySelector(".clip.is-on");
  if (initial) applyClip(initial);
  if (heroVideo) heroVideo.play().catch(() => {});

  // Theme A / B switcher
  const themeSwitch = document.getElementById("themeSwitch");
  const themeRange = document.getElementById("themeRange");
  const themeNote = document.getElementById("themeNote");
  const themeB = document.getElementById("themeB");

  const applyThemePos = (v) => {
    const n = Math.max(0, Math.min(100, Number(v)));
    if (themeSwitch) themeSwitch.style.setProperty("--pos", `${n}%`);
    if (themeB) themeB.style.clipPath = `inset(0 0 0 ${n}%)`;
    if (themeRange && String(themeRange.value) !== String(n)) themeRange.value = String(n);
    const theme = n < 50 ? "a" : "b";
    document.body.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    if (themeNote) {
      themeNote.textContent = theme === "a"
        ? "Сейчас: ЗАВОД · тёмный цех, металл, индустриальный hero"
        : "Сейчас: MODERN · светлый studio, стекло, contemporary";
    }
    // hero atmosphere: factory = greyer globe; modern = brighter/cooler
    const hv = document.getElementById("heroVideo");
    if (hv) hv.dataset.mood = theme;
  };
  if (themeRange) {
    applyThemePos(themeRange.value);
    themeRange.addEventListener("input", () => applyThemePos(themeRange.value));
  }

  // Three.js workshop owns 3D — skip CSS orbit

  // Gallery drag
  const rail = document.getElementById("rail");
  if (rail) {
    let down = false;
    let startX = 0;
    let scrollLeft = 0;
    rail.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      down = true;
      startX = e.clientX;
      scrollLeft = rail.scrollLeft;
      rail.classList.add("is-drag");
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", (e) => {
      if (!down) return;
      rail.scrollLeft = scrollLeft - (e.clientX - startX);
    });
    const end = () => {
      down = false;
      rail.classList.remove("is-drag");
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
  }

  const sumEl = document.getElementById("cSum");
  const fields = ["cType", "cVideo", "cBot", "cRush"].map((id) => document.getElementById(id));
  const calc = () => {
    const [type, video, bot, rush] = fields.map((el) => Number(el?.value || 0));
    const total = Math.round((type + video + bot) * rush);
    if (sumEl) sumEl.textContent = total.toLocaleString("ru-RU") + " ₽";
    return total;
  };
  fields.forEach((el) => el && el.addEventListener("change", calc));
  calc();
  const cSend = document.getElementById("cSend");
  if (cSend) {
    cSend.addEventListener("click", () => {
      sessionStorage.setItem("nordline_estimate", String(calc()));
    });
  }

  document.querySelectorAll(".pack-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".pack-tab").forEach((t) => t.classList.toggle("is-on", t === tab));
      document.querySelectorAll(".pack").forEach((p) => {
        p.classList.toggle("is-on", p.dataset.pack === tab.dataset.pack);
      });
    });
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const estimate = sessionStorage.getItem("nordline_estimate");
      const text = [
        "Бриф NORDLINE (демо):",
        `Имя: ${data.get("name") || ""}`,
        `Компания: ${data.get("company") || ""}`,
        `Задача: ${data.get("task") || ""}`,
        data.get("wantVideo") ? "Видео-блок: да" : "Видео-блок: нет",
        estimate ? `Смета с калькулятора: ${Number(estimate).toLocaleString("ru-RU")} ₽` : "",
      ].filter(Boolean).join("\n");
      window.open(`https://t.me/Maxspas?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      const hint = document.getElementById("formHint");
      if (hint) hint.textContent = "Открыл Telegram · демо-форма";
    });
  }
})();
