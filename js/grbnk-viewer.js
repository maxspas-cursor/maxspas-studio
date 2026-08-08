import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

function showFatal(msg) {
  const statusEl = document.getElementById("grbnk-viewer-status");
  const frame = document.querySelector(".grbnk-viewer-frame");
  if (statusEl) statusEl.textContent = msg;
  frame?.classList.add("is-loading");
  console.error("[grbnk-viewer]", msg);
}

const MODEL_PRESETS = {
  default: { size: 2.9, rotX: -0.08, dist: 2.7, zUp: true },
  benchy: { size: 2.95, rotX: -0.08, dist: 2.65, zUp: true },
  vase: { size: 2.78, rotX: -0.05, dist: 2.85, fitAxes: "yz", zUp: true },
  gear: { size: 3.2, rotX: 0.08, rotY: -0.32, dist: 2.3, fitAxes: "xy", zUp: false },
  figurine: { size: 2.88, rotX: -0.1, dist: 2.75, zUp: true },
  holder: { size: 2.82, rotX: -0.12, dist: 2.6, zUp: true },
};

const DEMO_SHAPES = new Set(["benchy", "vase", "gear"]);

function resolvePreset(shape, model = {}) {
  const base = MODEL_PRESETS[shape] || MODEL_PRESETS.figurine;
  return { ...MODEL_PRESETS.default, ...base, ...(model.viewer || {}) };
}

function bootViewer(canvas) {
  const frame = canvas.closest(".grbnk-viewer-frame");
  const viewport = canvas.closest(".grbnk-stage__viewport");
  const statusEl = document.getElementById("grbnk-viewer-status");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    showFatal("WebGL недоступен в браузере");
    throw err;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 5000);

  const ambient = new THREE.AmbientLight(0xc7d2e8, 0.9);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 2);
  const rim = new THREE.DirectionalLight(0x8b9dc8, 0.95);
  rim.position.set(-2, 1, -3);
  const fill = new THREE.DirectionalLight(0xa8b8d8, 0.5);
  fill.position.set(0, -2, 2);
  scene.add(ambient, key, rim, fill);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.85;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.75;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.minPolarAngle = 0.12;

  let mesh = null;
  let loadToken = 0;
  let activePreset = MODEL_PRESETS.benchy;
  const palette = {
    main: 0x8b9dc8,
    accent: 0xc4d2e8,
    dark: 0x3d4a66,
  };

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  function setStatus(text, loading) {
    if (statusEl) statusEl.textContent = text || "";
    frame?.classList.toggle("is-loading", Boolean(loading));
  }

  function clearMesh() {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.traverse?.((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material?.dispose();
      }
    });
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material?.dispose();
    }
    mesh = null;
  }

  function mat(color, metal = 0.28) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: metal,
      roughness: 0.38,
      side: THREE.DoubleSide,
    });
  }

  function resetCamera(preset = activePreset) {
    const dist = preset?.dist || 2.2;
    if (preset?.cam) {
      const [cx, cy, cz] = preset.cam;
      camera.position.set(cx * dist, cy * dist, cz * dist);
    } else {
      camera.position.set(dist * 0.62, dist * 0.4, dist * 0.78);
    }
    const t = preset?.target || [0, 0, 0];
    controls.target.set(t[0], t[1], t[2]);
    controls.update();
  }

  function fitObject(object, preset, options = {}) {
    activePreset = preset;
    const zUp = options.zUp ?? false;

    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);

    if (object.isMesh?.geometry?.isBufferGeometry) {
      object.geometry.center();
      object.geometry.computeBoundingBox();
    }

    const pivot = new THREE.Group();
    pivot.add(object);

    if (zUp) {
      object.rotation.x = -Math.PI / 2;
    }

    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(pivot);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    object.position.sub(center);

    const maxDim =
      preset.fitAxes === "yz"
        ? Math.max(size.y, size.z)
        : preset.fitAxes === "xy"
          ? Math.max(size.x, size.y)
          : preset.fitAxes === "xz"
            ? Math.max(size.x, size.z)
            : Math.max(size.x, size.y, size.z);
    if (maxDim > 0) pivot.scale.setScalar((preset.size || 2.2) / maxDim);

    pivot.rotation.set(preset.rotX || 0, preset.rotY || 0, preset.rotZ || 0);
    if (preset.offset) {
      pivot.position.set(preset.offset[0], preset.offset[1], preset.offset[2] || 0);
    } else {
      pivot.position.set(0, 0, 0);
    }
    resetCamera(preset);
    return pivot;
  }

  function buildShape(shape) {
    clearMesh();
    const group = new THREE.Group();
    const preset = MODEL_PRESETS[shape] || MODEL_PRESETS.benchy;

    if (shape === "vase") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.2, 12), mat(palette.main));
      body.position.y = 0.6;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.35, 10), mat(palette.accent));
      neck.position.y = 1.25;
      group.add(body, neck);
    } else if (shape === "gear") {
      const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.22, 24), mat(palette.dark, 0.5));
      gear.rotation.x = Math.PI / 2;
      gear.position.y = 0.35;
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 16), mat(palette.accent));
      hole.rotation.x = Math.PI / 2;
      hole.position.y = 0.35;
      for (let i = 0; i < 12; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.22), mat(palette.main));
        const a = (i / 12) * Math.PI * 2;
        tooth.position.set(Math.cos(a) * 0.82, 0.35, Math.sin(a) * 0.82);
        tooth.rotation.y = -a;
        group.add(tooth);
      }
      group.add(gear, hole);
    } else {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.8), mat(palette.main));
      hull.position.y = 0.35;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), mat(palette.accent));
      cabin.position.set(0, 0.72, 0.35);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), mat(palette.dark));
      chimney.position.set(-0.2, 1.05, 0.2);
      group.add(hull, cabin, chimney);
    }

    mesh = fitObject(group, preset);
    scene.add(mesh);
    setStatus("", false);
    resize();
  }

  function prepareLoadedObject(object, shape) {
    const metal = shape === "gear" ? 0.42 : 0.28;
    object.traverse((child) => {
      if (!child.isMesh || !child.geometry?.isBufferGeometry) return;
      if (!child.geometry.getAttribute("normal")) {
        child.geometry.computeVertexNormals();
      }
      child.material = mat(palette.main, metal);
    });
  }

  async function loadFile(url, shape = "figurine", model = {}) {
    if (!url) return;
    const token = ++loadToken;
    const preset = resolvePreset(shape, model);
    setStatus("Загрузка модели…", true);

    const ext = String(url).split("?")[0].split(".").pop().toLowerCase();

    try {
      if (ext === "glb" || ext === "gltf") {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        if (token !== loadToken) return;
        clearMesh();
        prepareLoadedObject(gltf.scene, shape);
        mesh = fitObject(gltf.scene, preset, { zUp: Boolean(preset.zUp) });
        scene.add(mesh);
      } else if (ext === "stl") {
        const loader = new STLLoader();
        const geometry = await loader.loadAsync(url);
        if (token !== loadToken) return;
        geometry.computeVertexNormals();
        clearMesh();
        const object = new THREE.Mesh(
          geometry,
          mat(palette.main, shape === "gear" ? 0.42 : 0.28)
        );
        mesh = fitObject(object, preset, { zUp: Boolean(preset.zUp) });
        scene.add(mesh);
      } else {
        buildShape(shape);
        return;
      }
      setStatus("", false);
      resize();
    } catch (err) {
      if (token !== loadToken) return;
      console.error("[grbnk-viewer] Failed to load", url, err);
      clearMesh();
      const en = document.documentElement.lang === "en";
      setStatus(en ? "Model failed to load" : "Не удалось загрузить модель", false);
    }
  }

  function resize() {
    const box = viewport || frame || canvas.parentElement;
    if (!box) return;
    const w = Math.max(box.clientWidth, 1);
    const h = Math.max(box.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function applyModel(model) {
    if (!model) return;
    const shape = model.shape || "figurine";
    const url = model.previewFile || model.file;
    if (url) {
      if (DEMO_SHAPES.has(shape)) buildShape(shape);
      else {
        clearMesh();
        setStatus("Загрузка модели…", true);
      }
      loadFile(url, shape, model);
      return;
    }
    loadToken++;
    buildShape(DEMO_SHAPES.has(shape) ? shape : "benchy");
  }

  window.MSGrbnkViewer = {
    loadShape(id) {
      loadToken++;
      buildShape(DEMO_SHAPES.has(id) ? id : "benchy");
    },
    loadModel(model) {
      if (!model) return;
      applyModel(model);
    },
    resetView() {
      resetCamera(activePreset);
    },
  };

  canvas.addEventListener("dblclick", () => resetCamera(activePreset));

  const resizeTarget = viewport || frame;
  if (resizeTarget && "ResizeObserver" in window) {
    new ResizeObserver(() => resize()).observe(resizeTarget);
  }
  window.addEventListener("resize", resize);

  buildShape("benchy");
  animate();
  requestAnimationFrame(() => {
    resize();
    requestAnimationFrame(resize);
  });

  document.dispatchEvent(new CustomEvent("grbnk-viewer:ready"));
}

const canvas = document.getElementById("grbnk-viewer");
if (canvas) {
  try {
    bootViewer(canvas);
  } catch (err) {
    showFatal("3D не запустился — обновите страницу");
    console.error(err);
  }
}
