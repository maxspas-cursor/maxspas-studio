/**
 * NORDLINE workshop 3D — Three.js without OrbitControls (CDN-safe)
 */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

function makeLabel(text, color = "#e8ebe6") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(12,17,16,0.78)";
  ctx.fillRect(12, 20, 488, 88);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 20, 488, 88);
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(4.2, 1.05, 1);
  return spr;
}

function box(w, h, d, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.08,
    transparent: opts.opacity != null && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    emissive: new THREE.Color(opts.emissive || 0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildWorkshop() {
  const root = new THREE.Group();

  const slab = box(22, 0.35, 28, 0x2a2f2c, { roughness: 0.92 });
  slab.position.y = -0.175;
  root.add(slab);

  const grid = new THREE.GridHelper(24, 24, 0x3a4540, 0x222826);
  grid.position.y = 0.02;
  root.add(grid);

  const zones = [
    { name: "ОФИС", color: 0x3a4a58, y: 9.0, h: 3.4, n: 2, accent: "#9ec0d8" },
    { name: "СБОРКА", color: 0x2f4a3a, y: 5.2, h: 3.6, n: 3, accent: "#8fbf9a" },
    { name: "ОТК", color: 0x2a3a52, y: 1.8, h: 3.0, n: 2, accent: "#8aa4c8" },
    { name: "СКЛАД", color: 0x4a3a2e, y: -1.4, h: 3.2, n: 3, accent: "#c4a574" },
  ];

  zones.forEach((z, zi) => {
    const g = new THREE.Group();
    const floor = box(14, 0.2, 8, z.color);
    floor.position.set(0, z.y - z.h / 2 + 0.1, 0);
    g.add(floor);

    const back = box(14, z.h, 0.22, z.color);
    back.position.set(0, z.y, -4);
    g.add(back);
    const left = box(0.22, z.h, 8, z.color);
    left.position.set(-7, z.y, 0);
    g.add(left);
    const right = box(0.22, z.h, 8, z.color);
    right.position.set(7, z.y, 0);
    g.add(right);

    const roof = box(14, 0.12, 8, z.color, { opacity: 0.32 });
    roof.position.set(0, z.y + z.h / 2 - 0.06, 0);
    g.add(roof);

    for (let i = 0; i < z.n; i++) {
      const isRack = zi === 3;
      const fw = isRack ? 1.1 : 2.4;
      const fh = isRack ? 2.4 : 0.9;
      const fd = isRack ? 2.2 : 1.2;
      const furn = box(fw, fh, fd, [0x5a4638, 0x6a5a48, 0x4a5560, 0x6b5340][zi]);
      const x = -4.5 + i * 3.2;
      furn.position.set(x, z.y - z.h / 2 + fh / 2 + 0.2, isRack ? -1 + (i % 2) : 0.5);
      g.add(furn);
      if (zi === 1) {
        const spool = new THREE.Mesh(
          new THREE.TorusGeometry(0.35, 0.12, 10, 24),
          new THREE.MeshStandardMaterial({ color: 0xc4a574, metalness: 0.45, roughness: 0.35 })
        );
        spool.rotation.x = Math.PI / 2;
        spool.position.set(x + 0.9, z.y - z.h / 2 + 1.1, 1.4);
        g.add(spool);
      }
    }

    const strip = box(13.2, 0.08, 0.08, 0xffffff, {
      emissive: z.accent,
      emissiveIntensity: 1.5,
    });
    strip.position.set(0, z.y + z.h / 2 - 0.25, 3.6);
    g.add(strip);

    const label = makeLabel(z.name, z.accent);
    label.position.set(-4.2, z.y + z.h / 2 - 0.5, 3.2);
    g.add(label);
    root.add(g);
  });

  for (let i = 0; i < 14; i++) {
    const step = box(2.2, 0.35, 1.4, 0x8a7a62);
    step.position.set(9.2, -2.2 + i * 0.85, -2 + (i % 3) * 0.15);
    root.add(step);
  }
  const rail = box(0.12, 11.5, 0.12, 0xc4a574, { metalness: 0.6, roughness: 0.3 });
  rail.position.set(10.2, 3.5, -2);
  root.add(rail);

  const badge = makeLabel("ЦЕХ · 2400 м²", "#c4a574");
  badge.position.set(-6.5, -2.6, 5.2);
  badge.scale.set(5.5, 1.3, 1);
  root.add(badge);

  root.position.y = -2.2;
  return root;
}

export function mountWorkshop3D(container, kind = "schematic") {
  if (!container) return null;
  const foundry = kind === "foundry";
  const showcase = kind === "showcase";

  const size = () => ({
    w: Math.max(container.clientWidth || 640, 320),
    h: Math.max(container.clientHeight || 420, 280),
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1110);
  if (!foundry && !showcase) scene.fog = new THREE.Fog(0x0c1110, 30, 58);

  let { w, h } = size();
  const camera = new THREE.PerspectiveCamera(foundry ? 32 : showcase ? 35 : 42, w / h, showcase ? 0.01 : 0.1, foundry ? 500 : 50);
  camera.position.set(18, 12, 18);
  camera.lookAt(0, 3, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.innerHTML = "";
  const canvas = renderer.domElement;
  canvas.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
  container.appendChild(canvas);

  let fire = null;
  const puffs = [];
  if (foundry) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    scene.add(new THREE.AmbientLight(0xd5dde8, 0.72));
    const sun = new THREE.DirectionalLight(0xfff6ee, 2.4);
    sun.position.set(6, 10, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9eb6d4, 0.55);
    fill.position.set(-7, 4, -6);
    scene.add(fill);
    fire = new THREE.PointLight(0xff7a22, 6, 7, 2);
    fire.position.set(0.42, 1.4, -0.31);
    scene.add(fire);
  } else {
    scene.add(new THREE.HemisphereLight(0xc8d4cc, 0x1a1e1c, 0.9));
    const key = new THREE.DirectionalLight(0xfff2dd, 1.2);
    key.position.set(12, 22, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6f8f7a, 0.4);
    fill.position.set(-10, 8, -8);
    scene.add(fill);
  }

  if (!foundry && !showcase) {
    scene.add(buildWorkshop());
  }

  // Custom orbit (no OrbitControls import)
  let spherical = new THREE.Spherical(foundry ? 14.2 : showcase ? 2 : 26, foundry ? 1.23 : showcase ? 0.72 : 1.05, foundry ? 0.7 : 0.75);
  const target = new THREE.Vector3(0, foundry ? 1.9 : 3, 0);
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const syncCam = () => {
    camera.position.setFromSpherical(spherical).add(target);
    camera.lookAt(target);
  };
  syncCam();

  const onDown = (e) => {
    e.preventDefault();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    spherical.theta -= dx * 0.008;
    const maxPhi = foundry ? Math.PI * 0.49 : Math.PI * 0.45;
    spherical.phi = Math.min(maxPhi, Math.max(0.25, spherical.phi + dy * 0.008));
    syncCam();
  };
  const onUp = () => {
    dragging = false;
    canvas.style.cursor = "grab";
  };
  const onWheel = (e) => {
    e.preventDefault();
    const maxR = foundry ? 28 : showcase ? 8 : 42;
    const minR = foundry ? 4 : showcase ? 0.25 : 12;
    const wheel = foundry ? 0.012 : showcase ? 0.004 : 0.02;
    spherical.radius = Math.min(maxR, Math.max(minR, spherical.radius + e.deltaY * wheel));
    syncCam();
  };

  if (foundry) {
    const ladle = new THREE.Vector3(0.42, 1.4, -0.31);
    const smokeTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grd.addColorStop(0, "rgba(255,244,230,0.95)");
      grd.addColorStop(0.35, "rgba(190,180,170,0.45)");
      grd.addColorStop(1, "rgba(40,40,40,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    for (let i = 0; i < 80; i++) {
      const mat = new THREE.SpriteMaterial({
        map: smokeTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.4,
        color: 0xffe2c8,
      });
      const s = new THREE.Sprite(mat);
      scene.add(s);
      puffs.push({
        s,
        t: Math.random(),
        speed: 0.11 + Math.random() * 0.16,
        drift: (Math.random() - 0.5) * 0.55,
        sway: Math.random() * Math.PI * 2,
      });
    }
    const stepSmoke = (dt) => {
      for (const p of puffs) {
        p.t += dt * p.speed;
        if (p.t > 1) p.t -= 1;
        const u = p.t;
        const rise = u * 2.6;
        const spread = u * 0.55;
        p.sway += dt * 1.3;
        p.s.position.set(
          ladle.x + Math.sin(p.sway) * spread + p.drift * u,
          ladle.y + rise,
          ladle.z + Math.cos(p.sway * 0.8) * spread * 0.65
        );
        p.s.scale.setScalar(0.18 + u * 0.95);
        const hot = u < 0.22;
        p.s.material.color.set(hot ? 0xffb060 : 0xd8d3cd);
        p.s.material.opacity = Math.sin(u * Math.PI) * (hot ? 0.7 : 0.34);
      }
    };
    container.__stepSmoke = stepSmoke;

    const loader = new GLTFLoader();
    loader.load(
      "media/liteyny-diorama.glb",
      (gltf) => {
        try {
          const model = new THREE.Group();
          const obj = gltf.scene;
          obj.quaternion.set(0.7071067811865476, 0, 0, 0.7071067811865476);
          model.add(obj);
          scene.add(model);
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.set(-center.x, -box.min.y, -center.z);
          container.dataset.model = "diorama";
        } catch (e) {
          console.error(e);
          container.dataset.model = String(e && (e.message || e));
        }
      },
      undefined,
      (err) => {
        console.error(err);
        container.insertAdjacentHTML(
          "beforeend",
          `<div style="position:absolute;left:16px;right:16px;bottom:16px;color:#c4a574;font:14px system-ui">Модель цеха не загрузилась</div>`
        );
      }
    );
  }

  if (showcase) {
    const loader = new GLTFLoader();
    loader.load(
      "media/showcase.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const sizeV = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        scene.add(model);
        const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z);
        target.set(0, 0, 0);
        spherical.radius = maxDim * 1.35;
        spherical.phi = 0.72;
        spherical.theta = 0.8;
        syncCam();
        container.dataset.model = "showcase";
      },
      undefined,
      (err) => {
        console.error(err);
        container.insertAdjacentHTML(
          "beforeend",
          `<div style="position:absolute;left:16px;right:16px;bottom:16px;color:#c4a574;font:14px system-ui">Модель не загрузилась</div>`
        );
      }
    );
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  let alive = true;
  let raf = 0;
  let last = performance.now();
  const tick = () => {
    if (!alive) return;
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (container.__stepSmoke) container.__stepSmoke(dt);
    if (fire) fire.intensity = 4.5 + Math.sin(now * 0.007) * 1.6;
    if (!dragging) {
      spherical.theta += foundry ? 0.003 : 0.0015;
      syncCam();
    }
    renderer.render(scene, camera);
  };
  tick();

  const onResize = () => {
    ({ w, h } = size());
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener("resize", onResize);

  // show error overlay helper
  container.dataset.ready = "1";
  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.innerHTML = "";
    },
  };
}

function boot() {
  const main = document.getElementById("workshop3d");
  const mini = document.getElementById("workshop3dMini");
  try {
    if (main) mountWorkshop3D(main, "foundry");
    if (mini) mountWorkshop3D(mini, "showcase");
  } catch (err) {
    console.error("workshop3d", err);
    [main, mini].forEach((el) => {
      if (!el) return;
      el.innerHTML = `<div style="padding:24px;color:#c4a574;font:14px system-ui">3D не загрузился: ${String(err.message || err)}</div>`;
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
