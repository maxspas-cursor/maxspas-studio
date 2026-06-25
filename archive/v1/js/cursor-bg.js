(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.id = "cursor-bg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let mx = innerWidth * 0.5;
  let my = innerHeight * 0.35;
  let tx = mx;
  let ty = my;

  const blobs = [
    { ox: 0, oy: 0, r: 0.42, color: [124, 58, 237], alpha: 0.22, speed: 0.07 },
    { ox: 0.12, oy: -0.08, r: 0.28, color: [99, 102, 241], alpha: 0.14, speed: 0.11 },
    { ox: -0.1, oy: 0.1, r: 0.2, color: [167, 139, 250], alpha: 0.1, speed: 0.15 },
  ];

  const particles = Array.from({ length: 36 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.8 + Math.random() * 1.6,
    drift: 0.15 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }));

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function drawBlob(cx, cy, radius, rgb, alpha) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(t) {
    tx = lerp(tx, mx, 0.08);
    ty = lerp(ty, my, 0.08);

    ctx.clearRect(0, 0, w, h);

    blobs.forEach((b) => {
      const bx = tx + b.ox * w;
      const by = ty + b.oy * h;
      const cx = lerp(bx, tx, 1 - b.speed);
      const cy = lerp(by, ty, 1 - b.speed);
      drawBlob(cx, cy, Math.max(w, h) * b.r, b.color, b.alpha);
    });

    particles.forEach((p) => {
      const pull = 0.018;
      const px = p.x * w + (tx - p.x * w) * pull;
      const py = p.y * h + (ty - p.y * h) * pull + Math.sin(t * 0.001 + p.phase) * 8 * p.drift;
      ctx.fillStyle = `rgba(196, 181, 253, ${0.15 + p.drift * 0.12})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
    },
    { passive: true }
  );

  resize();
  requestAnimationFrame(frame);
})();
