(() => {
  const stage = document.getElementById("stage");
  const intro = document.getElementById("intro");
  const growth = document.getElementById("growth");
  const video = document.getElementById("heroVideo");

  const ensurePlay = (v) => {
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };

  if (video) {
    const arm = () => {
      if (video.currentTime < 0.35) {
        try { video.currentTime = 0.8; } catch (_) {}
      }
      ensurePlay(video);
    };
    video.addEventListener("loadeddata", arm);
    ensurePlay(video);
  }

  const milestones = [
    { y: "2019", t: "Старт", d: "Первые жгуты и отладка линии." },
    { y: "2021", t: "Серия", d: "Стабильный поток заказов и контроль качества." },
    { y: "2023", t: "Цех+", d: "Расширение зон сборки и ОТК." },
    { y: "2024", t: "Цифра", d: "Паспорт изделия и статусы в боте." },
    { y: "2026", t: "Бренд", d: "Знак LORENTZ и витрина процесса — как у Atlantic." },
  ];
  const yTitle = document.getElementById("yTitle");
  const yText = document.getElementById("yText");
  const arcGlow = document.getElementById("arcGlow");
  const arcBase = document.getElementById("arcBase");
  const arcDot = document.getElementById("arcDot");
  let yearIndex = -1;

  const ns = "http://www.w3.org/2000/svg";

  const placeYearMarks = () => {
    if (!arcBase || document.getElementById("yearMarks")) return;
    const svg = arcBase.ownerSVGElement;
    const g = document.createElementNS(ns, "g");
    g.id = "yearMarks";
    const len = arcBase.getTotalLength();
    const last = milestones.length - 1;
    milestones.forEach((m, i) => {
      const p = arcBase.getPointAtLength(len * (i / last));
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("class", "year-dot");
      dot.setAttribute("data-i", String(i));
      dot.setAttribute("cx", p.x.toFixed(2));
      dot.setAttribute("cy", p.y.toFixed(2));
      dot.setAttribute("r", "6");
      const label = document.createElementNS(ns, "text");
      label.setAttribute("class", "year-label");
      label.setAttribute("data-i", String(i));
      label.setAttribute("x", p.x.toFixed(2));
      label.setAttribute("y", (p.y - 16).toFixed(2));
      label.textContent = m.y;
      g.appendChild(dot);
      g.appendChild(label);
    });
    if (arcDot && arcDot.parentNode === svg) svg.insertBefore(g, arcDot);
    else svg.appendChild(g);
  };

  const setYear = (i) => {
    if (i === yearIndex) return;
    yearIndex = i;
    const m = milestones[i];
    if (!m) return;
    document.querySelectorAll(".year").forEach((el, idx) => el.classList.toggle("is-on", idx === i));
    document.querySelectorAll(".year-dot, .year-label").forEach((el) => {
      el.classList.toggle("is-on", Number(el.getAttribute("data-i")) === i);
    });
    if (yTitle) yTitle.textContent = `${m.y} · ${m.t}`;
    if (yText) yText.textContent = m.d;
  };

  const sync = () => {
    if (intro && stage) {
      const total = Math.max(1, intro.offsetHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, -intro.getBoundingClientRect().top / total));
      let p1 = 0;
      let p2 = 0;
      if (t < 0.4) p1 = t / 0.4;
      else p2 = (t - 0.4) / 0.6;
      const markScale = 1.55 + p1 * 3.7;
      const scale = markScale + (1 - markScale) * p2;
      stage.style.setProperty("--p1", p1.toFixed(4));
      stage.style.setProperty("--p2", p2.toFixed(4));
      stage.style.setProperty("--scale", scale.toFixed(4));
    }

    if (growth) {
      const total = Math.max(1, growth.offsetHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, -growth.getBoundingClientRect().top / total));
      const idx = Math.min(milestones.length - 1, Math.floor(t * milestones.length));
      placeYearMarks();
      setYear(idx);
      if (arcGlow) arcGlow.style.strokeDashoffset = String(100 * (1 - t));
      if (arcBase && arcDot) {
        const len = arcBase.getTotalLength();
        const p = arcBase.getPointAtLength(len * t);
        arcDot.setAttribute("cx", p.x.toFixed(2));
        arcDot.setAttribute("cy", p.y.toFixed(2));
      }
    }
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
})();
