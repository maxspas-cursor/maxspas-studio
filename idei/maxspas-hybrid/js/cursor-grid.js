(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const CELL = 64;
  const GLOW = [167, 139, 250];
  const OFF_SELECTOR = "[data-cursor-grid='off']";

  const canvas = document.createElement("canvas");
  canvas.id = "cursor-grid";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let mx = innerWidth * 0.5;
  let my = innerHeight * 0.35;
  let tx = mx;
  let ty = my;
  let glow = 1;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function isOverOffZone() {
    const stack = document.elementsFromPoint(mx, my);
    return stack.some((el) => el.closest && el.closest(OFF_SELECTOR));
  }

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

  function drawGlow(strength) {
    if (strength <= 0.001) return;

    const cellX = Math.floor(tx / CELL);
    const cellY = Math.floor(ty / CELL);
    const radius = 2.5;

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist > radius) continue;

        const gx = cellX + dx;
        const gy = cellY + dy;
        const x = gx * CELL;
        const y = gy * CELL;
        if (x > w || y > h || x + CELL < 0 || y + CELL < 0) continue;

        const centerX = x + CELL * 0.5;
        const centerY = y + CELL * 0.5;
        const pixelDist = Math.hypot(centerX - tx, centerY - ty);
        const maxDist = CELL * radius;
        const t = Math.max(0, 1 - pixelDist / maxDist);
        const alpha = t * t * 0.11 * strength;

        ctx.fillStyle = `rgba(${GLOW[0]},${GLOW[1]},${GLOW[2]},${alpha})`;
        ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);
      }
    }
  }

  function frame() {
    tx = lerp(tx, mx, 0.14);
    ty = lerp(ty, my, 0.14);
    glow = lerp(glow, isOverOffZone() ? 0 : 1, 0.18);

    ctx.clearRect(0, 0, w, h);
    drawGlow(glow);

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
