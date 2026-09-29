const STORE = "kibershchit-session";
const NAME_STORE = "kibershchit-name";
const SOUND_STORE = "kibershchit-sound";

const app = document.querySelector("#app");
const toast = document.createElement("div");
const dialog = document.createElement("dialog");
const stamp = document.createElement("div");
toast.className = "toast";
toast.hidden = true;
stamp.className = "stamp";
stamp.textContent = "КАРАНТИН";
stamp.setAttribute("aria-hidden", "true");
document.body.append(toast, dialog, stamp);

let session = null;
let last = null;
let pollTimer = 0;
let refreshing = false;
let busy = false;
let currentShell = "";
let actKey = "";
let seenPhase = "";
let editing = false;
let draftTarget = null;
let draftMode = "save";
let presetCode = "";
let toastTimer = 0;
let stickyToast = false;
let stampTimer = 0;
let seenMood = "";
let soundOn = localStorage.getItem(SOUND_STORE) !== "0";
let audioCtx = null;
let audioUnlocked = false;
let heardLog = "";
let heardChat = "";
let heardThreat = "";
let heardPhase = "";
let ownChatEcho = "";
const regions = {};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function h(tag, props, kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "hidden") node.hidden = !!value;
    else if (key === "disabled") node.disabled = !!value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, String(value));
  }
  for (const kid of kids || []) {
    if (kid != null) node.append(kid);
  }
  return node;
}

function moodFor(state) {
  if (!state) return "lobby";
  if (state.phase === "night") return "night";
  if (state.phase === "discuss" || state.phase === "vote") return "day";
  if (state.phase === "end") return state.winner === "town" ? "town-end" : "threat-end";
  return "lobby";
}

function applyMood(state) {
  const mood = moodFor(state);
  document.body.dataset.mood = mood;
  if (mood !== seenMood) {
    if (seenMood) {
      document.body.classList.remove("mood-flip");
      void document.body.offsetWidth;
      if (!reduceMotion) document.body.classList.add("mood-flip");
      setTimeout(() => document.body.classList.remove("mood-flip"), 700);
    }
    seenMood = mood;
  }
}

function mascot() {
  const wrap = h("span", { class: "mascot", "aria-hidden": "true" });
  wrap.innerHTML = `
    <span class="shield">
      <svg viewBox="0 0 64 72"><path d="M32 4 56 14v20c0 16-10 28-24 34C18 62 8 50 8 34V14Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 16 46 22v12c0 8-6 14-14 18-8-4-14-10-14-18V22Z" fill="currentColor" opacity=".18"/><path d="M24 36 30 42 42 28" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="2.2" fill="currentColor"/><circle cx="40" cy="24" r="2.2" fill="currentColor"/></svg>
    </span>
    <span class="sky-badge">
      <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1"/></g></svg>
      <svg class="moon" viewBox="0 0 24 24"><path fill="currentColor" d="M16.4 3.2a8.8 8.8 0 1 0 4.4 15.4A9.2 9.2 0 0 1 16.4 3.2Z"/></svg>
    </span>`;
  return wrap;
}

function shield() {
  return mascot();
}

function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioUnlocked = true;
  } catch {
    audioUnlocked = false;
  }
}

function setSound(on) {
  soundOn = !!on;
  localStorage.setItem(SOUND_STORE, soundOn ? "1" : "0");
  if (regions.soundBtn) {
    regions.soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    regions.soundBtn.textContent = soundOn ? "Звук: вкл" : "Звук: выкл";
  }
  if (soundOn) unlockAudio();
}

function tone(freq, duration, type, gain, when) {
  if (!soundOn || !audioCtx) return;
  const t0 = (when || audioCtx.currentTime);
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain || 0.05, t0 + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playCue(name) {
  if (!soundOn) return;
  unlockAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (name === "accept") {
    tone(880, 0.08, "triangle", 0.04, now);
    tone(1320, 0.1, "triangle", 0.03, now + 0.07);
  } else if (name === "night") {
    tone(220, 0.22, "sine", 0.05, now);
    tone(165, 0.28, "triangle", 0.035, now + 0.12);
  } else if (name === "day") {
    tone(523, 0.12, "sine", 0.04, now);
    tone(659, 0.14, "sine", 0.035, now + 0.1);
    tone(784, 0.16, "triangle", 0.03, now + 0.2);
  } else if (name === "quarantine") {
    tone(140, 0.18, "sawtooth", 0.045, now);
    tone(110, 0.25, "square", 0.03, now + 0.12);
    tone(90, 0.3, "sine", 0.04, now + 0.22);
  } else if (name === "soft") {
    tone(392, 0.12, "sine", 0.03, now);
    tone(494, 0.14, "triangle", 0.025, now + 0.1);
  } else if (name === "vote") {
    tone(740, 0.07, "square", 0.025, now);
    tone(990, 0.08, "square", 0.02, now + 0.06);
  } else if (name === "chat") {
    tone(980, 0.05, "sine", 0.02, now);
  } else if (name === "threat-chat") {
    tone(420, 0.06, "triangle", 0.025, now);
    tone(560, 0.07, "triangle", 0.02, now + 0.05);
  } else if (name === "win") {
    tone(523, 0.12, "sine", 0.04, now);
    tone(659, 0.12, "sine", 0.035, now + 0.12);
    tone(784, 0.14, "sine", 0.035, now + 0.24);
    tone(1046, 0.2, "triangle", 0.03, now + 0.38);
  } else if (name === "lose") {
    tone(330, 0.18, "sawtooth", 0.035, now);
    tone(247, 0.22, "triangle", 0.03, now + 0.16);
    tone(196, 0.28, "sine", 0.035, now + 0.32);
  }
}

function showStamp() {
  clearTimeout(stampTimer);
  stamp.classList.remove("show");
  void stamp.offsetWidth;
  stamp.classList.add("show");
  stampTimer = setTimeout(() => stamp.classList.remove("show"), 950);
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "null");
  } catch {
    return null;
  }
}

function saveSession() {
  if (!session) localStorage.removeItem(STORE);
  else localStorage.setItem(STORE, JSON.stringify(session));
}

function showToast(message, bad = false, sticky = false) {
  stickyToast = sticky;
  clearTimeout(toastTimer);
  toast.hidden = !message;
  toast.textContent = message || "";
  toast.classList.toggle("bad", !!bad && !!message);
  if (message && !sticky) toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function api(path, { method = "GET", body = null, token = null } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["X-Token"] = token;
  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Нет связи со столом.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Не вышло.");
  return data;
}

function activeToken() {
  if (!session) return "";
  if (session.view === "player" && session.playerToken) return session.playerToken;
  return session.hostToken || "";
}

function roundLabel(state) {
  if (state.phase === "night") return `Ночь ${state.night}`;
  if (state.phase === "discuss" || state.phase === "vote") return `День ${state.day}`;
  if (state.phase === "end") return state.winner === "town" ? "Контур удержан" : "Контур потерян";
  return "Набор стола";
}

function phaseName(state) {
  return {
    lobby: "Лобби",
    night: "Ночь",
    discuss: "Разбор",
    vote: "Голосование",
    end: "Итог",
  }[state.phase] || state.phase;
}

async function guard(fn) {
  if (busy) return;
  busy = true;
  try {
    await fn();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    busy = false;
  }
}

async function actWith(token, op, extra) {
  const data = await api("/api/act", { method: "POST", token, body: { op, ...extra } });
  if (data.left) return data;
  if (op === "night" || op === "item" || op === "vote") playCue("accept");
  if (op === "vote") playCue("vote");
  if (op === "chat" || op === "threat_chat") {
    ownChatEcho = `${Date.now()}|${(extra && extra.text) || ""}`;
  }
  last = data;
  render(data);
  return data;
}

function actHost(op, extra) {
  return actWith(session.hostToken, op, extra);
}

function actPlayer(op, extra) {
  return actWith(session.playerToken, op, extra);
}

function startPoll() {
  stopPoll();
  refresh();
  pollTimer = setInterval(refresh, 1000);
}

function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = 0;
}

function dropSession(message, sticky = false) {
  session = null;
  last = null;
  saveSession();
  stopPoll();
  currentShell = "";
  heardLog = "";
  heardChat = "";
  heardThreat = "";
  heardPhase = "";
  renderHome();
  if (message) showToast(message, true, sticky);
}

async function refresh() {
  if (!session || refreshing) return;
  refreshing = true;
  try {
    const state = await api("/api/state", { token: activeToken() });
    last = state;
    if (stickyToast) showToast("");
    render(state);
  } catch (error) {
    const lost = /сессия/i.test(error.message) || /связи/i.test(error.message);
    if (lost) {
      dropSession(error.message, false);
    } else {
      showToast(error.message, true, true);
    }
  } finally {
    refreshing = false;
  }
}

function render(state) {
  if (!state) {
    renderHome();
    return;
  }
  document.title = `КиберЩит · ${roundLabel(state)}`;
  document.body.dataset.phase = state.phase;
  document.body.dataset.team = state.you && state.you.team ? state.you.team : "";
  applyMood(state);
  reactToState(state);
  if (state.phase !== seenPhase) {
    editing = false;
    draftTarget = null;
    draftMode = "save";
    seenPhase = state.phase;
  }
  const key = `${session.view}|${state.phase}|${state.canThreatChat ? "tc" : ""}`;
  if (key !== currentShell) {
    currentShell = key;
    actKey = "";
    buildShell(state);
  }
  paint(state);
}

function reactToState(state) {
  const phaseKey = `${state.phase}|${state.night}|${state.day}|${state.winner || ""}`;
  if (!heardPhase) {
    heardPhase = phaseKey;
    heardLog = (state.log || []).map((item) => item.t + item.text).join("|");
    heardChat = (state.chat || []).map((item) => item.t + item.name + item.text).join("|");
    heardThreat = (state.threatChat || []).map((item) => item.t + item.name + item.text).join("|");
    return;
  }
  if (phaseKey !== heardPhase) {
    const prev = heardPhase;
    heardPhase = phaseKey;
    if (state.phase === "night" && !prev.startsWith("night")) playCue("night");
    else if ((state.phase === "discuss" || state.phase === "vote") && prev.startsWith("night")) playCue("day");
    else if (state.phase === "end") playCue(state.winner === "town" ? "win" : "lose");
  }
  const logSig = (state.log || []).map((item) => item.t + item.text).join("|");
  if (logSig !== heardLog) {
    const prevItems = heardLog ? heardLog.split("|").filter(Boolean) : [];
    const nextItems = (state.log || []);
    for (const item of nextItems) {
      const key = item.t + item.text;
      if (prevItems.includes(key)) continue;
      if (/карантин|отключён|отключен/i.test(item.text)) {
        playCue("quarantine");
        showStamp();
      } else if (/критических отключений нет|карантина нет|голосов нет/i.test(item.text)) {
        playCue("soft");
      }
    }
    heardLog = logSig;
  }
  const chatSig = (state.chat || []).map((item) => item.t + item.name + item.text).join("|");
  if (chatSig !== heardChat) {
    const prev = new Set(heardChat ? heardChat.split("|").filter(Boolean) : []);
    for (const item of state.chat || []) {
      const key = item.t + item.name + item.text;
      if (prev.has(key)) continue;
      const mine = ownChatEcho && ownChatEcho.endsWith("|" + item.text);
      if (!mine) playCue("chat");
    }
    heardChat = chatSig;
  }
  const threatSig = (state.threatChat || []).map((item) => item.t + item.name + item.text).join("|");
  if (threatSig !== heardThreat) {
    const prev = new Set(heardThreat ? heardThreat.split("|").filter(Boolean) : []);
    for (const item of state.threatChat || []) {
      const key = item.t + item.name + item.text;
      if (prev.has(key)) continue;
      const mine = ownChatEcho && ownChatEcho.endsWith("|" + item.text);
      if (!mine) playCue("threat-chat");
    }
    heardThreat = threatSig;
  }
}

function toolbar() {
  regions.soundBtn = h("button", {
    class: "sound-toggle",
    type: "button",
    "aria-pressed": soundOn ? "true" : "false",
    text: soundOn ? "Звук: вкл" : "Звук: выкл",
    onClick: () => {
      unlockAudio();
      setSound(!soundOn);
      if (soundOn) playCue("accept");
    },
  });
  return h("div", { class: "toolbar" }, [
    regions.soundBtn,
    h("a", { class: "variant-link", href: "/v0/", text: "Вариант 0" }),
  ]);
}

function renderHome() {
  stopPoll();
  currentShell = "home";
  seenPhase = "";
  document.title = "КиберЩит";
  document.body.dataset.phase = "lobby";
  applyMood({ phase: "lobby" });
  app.replaceChildren();
  const code = h("input", { id: "room-code", maxlength: "4", autocomplete: "off", value: presetCode, spellcheck: "false" });
  const name = h("input", { id: "player-name", maxlength: "18", autocomplete: "name", value: localStorage.getItem(NAME_STORE) || "" });
  code.addEventListener("input", () => { code.value = code.value.toUpperCase(); });
  const form = h("form", { class: "stack" }, [
    h("label", { text: "Код стола" }, [code]),
    h("label", { text: "Имя за столом" }, [name]),
    h("button", { class: "primary", type: "submit", text: "Войти" }),
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    guard(() => joinTable(code.value, name.value, false));
  });
  app.append(
    toolbar(),
    h("header", { class: "top" }, [shield(), h("div", {}, [
      h("h1", { class: "word", text: "КИБЕРЩИТ" }),
      h("p", { class: "sub", text: "Хроники цифровой безопасности" }),
    ])]),
    h("p", { class: "lead", text: "Детектив на одну смену. Ночью роли действуют скрытно. Днём стол читает инцидент и решает, кого отправить в карантин." }),
    h("section", { class: "card" }, [
      h("p", { class: "meta", text: "Ведущий" }),
      h("h2", { text: "Открыть стол" }),
      h("p", { class: "hint", text: "Телефоны игроков должны быть в той же сети, что и этот компьютер." }),
      h("div", { class: "bar" }, [
        h("button", { class: "primary", type: "button", text: "Создать стол", onClick: () => guard(createTable) }),
        h("button", { class: "ghost", type: "button", text: "Правила", onClick: openRules }),
      ]),
    ]),
    h("section", { class: "card" }, [
      h("p", { class: "meta", text: "Игрок" }),
      h("h2", { text: "Войти по коду" }),
      form,
    ]),
  );
}

async function createTable() {
  const data = await api("/api/room", { method: "POST", body: {} });
  session = { code: data.state.code, hostToken: data.hostToken, playerToken: null, view: "host" };
  saveSession();
  last = data.state;
  heardLog = "";
  heardChat = "";
  heardThreat = "";
  heardPhase = "";
  startPoll();
  render(data.state);
}

async function joinTable(code, name, keepHost) {
  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode || !cleanName) throw new Error("Нужны код стола и имя.");
  localStorage.setItem(NAME_STORE, cleanName);
  const data = await api("/api/join", { method: "POST", body: { code: cleanCode, name: cleanName } });
  session = {
    code: data.state.code,
    hostToken: keepHost ? session.hostToken : null,
    playerToken: data.playerToken,
    view: "player",
  };
  saveSession();
  last = data.state;
  currentShell = "";
  heardLog = "";
  heardChat = "";
  heardThreat = "";
  heardPhase = "";
  startPoll();
  render(data.state);
}

function buildShell(state) {
  for (const key of Object.keys(regions)) delete regions[key];
  app.replaceChildren();
  if (state.phase === "lobby") buildLobby(state);
  else buildTable(state);
}

function switcher() {
  if (!session.hostToken || !session.playerToken) return null;
  return h("div", { class: "switcher" }, [
    h("button", {
      class: `tab${session.view === "host" ? " selected" : ""}`,
      type: "button",
      text: "Ведущий",
      onClick: () => switchView("host"),
    }),
    h("button", {
      class: `tab${session.view === "player" ? " selected" : ""}`,
      type: "button",
      text: "Мой ход",
      onClick: () => switchView("player"),
    }),
  ]);
}

function switchView(view) {
  session.view = view;
  saveSession();
  currentShell = "";
  refresh();
}

function buildLobby(state) {
  const hostView = session.view !== "player";
  regions.roster = h("div");
  regions.setup = h("p", { class: "hint" });
  regions.code = h("p", { class: "code", text: state.code });
  regions.share = h("p", { class: "share", text: state.shareUrl || "" });
  const controls = h("div", { class: "stack" });
  if (hostView) {
    if (!session.playerToken) {
      const name = h("input", { maxlength: "18", value: localStorage.getItem(NAME_STORE) || "", autocomplete: "name" });
      const sit = h("form", { class: "stack" }, [
        h("label", { text: "Сесть за этот стол" }, [name]),
        h("button", { class: "ghost", type: "submit", text: "Сесть" }),
      ]);
      sit.addEventListener("submit", (event) => {
        event.preventDefault();
        guard(() => joinTable(state.code, name.value, true));
      });
      controls.append(sit);
    } else {
      controls.append(h("p", { class: "hint", text: "Вы уже в списке игроков. Свой бейдж — на вкладке «Мой ход»." }));
      controls.append(h("button", {
        class: "ghost",
        type: "button",
        text: "Встать из-за стола",
        onClick: () => guard(async () => {
          await api("/api/act", { method: "POST", token: session.playerToken, body: { op: "leave" } });
          session.playerToken = null;
          session.view = "host";
          saveSession();
          currentShell = "";
          await refresh();
        }),
      }));
    }
    regions.fill = h("button", { class: "ghost", type: "button", text: "Добрать ботами до 8", onClick: () => guard(() => actHost("fill", { target: 8 })) });
    controls.append(
      h("button", { class: "ghost", type: "button", text: "Добавить бота", onClick: () => guard(() => actHost("bot")) }),
      regions.fill,
    );
    regions.start = h("button", { class: "primary", type: "button", text: "Начать смену", disabled: state.count < 5, onClick: () => guard(() => actHost("start")) });
    controls.append(regions.start);
  } else {
    controls.append(h("p", { class: "wait", text: "Ждём, пока ведущий откроет смену. Не закрывайте страницу." }));
  }
  regions.log = h("div", { class: "log" });
  regions.chat = h("ul", { class: "chat" });
  buildComposer("chat");
  app.append(
    toolbar(),
    switcher(),
    h("header", { class: "top" }, [shield(), h("div", {}, [
      h("p", { class: "meta", text: "Стол" }),
      regions.code,
    ])]),
    h("section", { class: "card" }, [
      h("p", { class: "meta", text: "Ссылка для телефонов" }),
      regions.share,
      h("div", { class: "bar" }, [
        h("button", { class: "primary", type: "button", text: "Скопировать ссылку", onClick: () => copyLink(state.shareUrl) }),
        h("button", { class: "ghost", type: "button", text: "Правила", onClick: openRules }),
      ]),
      h("p", { class: "hint", text: "Если телефон не открывает ссылку, разрешите Python в брандмауэре Windows для частной сети." }),
    ]),
    h("section", { class: "card" }, [
      h("p", { class: "meta", text: "Состав" }),
      regions.setup,
      regions.roster,
    ]),
    h("section", { class: "card" }, [h("p", { class: "meta", text: hostView ? "Ведущий" : "Ожидание" }), controls]),
    h("section", { class: "card" }, [h("p", { class: "meta", text: "Канал" }), regions.chat, regions.composer]),
  );
}

function buildTable(state) {
  regions.phase = h("p", { class: "meta phase" });
  regions.round = h("h2");
  regions.note = h("p", { class: "hint" });
  regions.badge = h("section", { class: "card badge" });
  regions.roster = h("ul", { class: "roster" });
  regions.action = h("div", { class: "stack" });
  regions.echo = h("p", { class: "echo" });
  regions.ballots = h("div");
  regions.log = h("div", { class: "log" });
  regions.chat = h("ul", { class: "chat" });
  regions.threatChat = h("ul", { class: "chat" });
  buildComposer("chat");
  buildComposer("threat");
  const hostbar = h("div", { class: "hostbar" });
  if (session.hostToken) {
    regions.force = h("button", { class: "primary", type: "button", text: "Закрыть фазу" });
    regions.abort = h("button", { class: "ghost", type: "button", text: "Разогнать стол" });
    regions.force.addEventListener("click", () => guard(() => actHost("force")));
    regions.abort.addEventListener("click", () => guard(async () => {
      if (last && last.phase !== "end" && !window.confirm("Разогнать стол и вернуть всех в лобби?")) return;
      await actHost("abort");
    }));
    hostbar.append(regions.force, regions.abort);
  }
  regions.threatSection = h("section", { class: "card threat-card", hidden: true }, [
    h("p", { class: "meta", text: "Канал угрозы" }),
    regions.threatChat,
    regions.threatComposer,
  ]);
  app.append(
    toolbar(),
    switcher(),
    h("header", { class: "top" }, [
      shield(),
      h("div", {}, [regions.phase, regions.round, regions.note]),
      h("button", { class: "ghost rules-btn", type: "button", text: "Правила", onClick: openRules }),
    ]),
    regions.badge,
    h("section", { class: "card" }, [h("p", { class: "meta", text: "Узлы" }), regions.roster]),
    h("section", { class: "card" }, [h("p", { class: "meta", text: "Протокол" }), regions.action, regions.ballots]),
    h("section", { class: "card" }, [h("p", { class: "meta", text: "Журнал" }), regions.log]),
    regions.threatSection,
    h("section", { class: "card" }, [h("p", { class: "meta", text: "Канал" }), regions.chat, regions.composer]),
    hostbar,
  );
}

function buildComposer(kind) {
  const threat = kind === "threat";
  const input = h("input", {
    maxlength: "300",
    placeholder: threat ? "Сообщение каналу угрозы" : "Сообщение столу",
    autocomplete: "off",
  });
  const form = h("form", { class: "composer" }, [
    input,
    h("button", { class: "primary", type: "submit", text: "Отправить" }),
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const token = session.view === "player" && session.playerToken ? session.playerToken : session.hostToken;
    guard(async () => {
      await actWith(token, threat ? "threat_chat" : "chat", { text });
      input.value = "";
    });
  });
  if (threat) {
    regions.threatComposer = form;
    regions.threatInput = input;
  } else {
    regions.composer = form;
    regions.input = input;
  }
}

function paint(state) {
  if (regions.code) regions.code.textContent = state.code;
  if (regions.share && state.shareUrl) regions.share.textContent = state.shareUrl;
  if (regions.phase) regions.phase.textContent = `${phaseName(state)} · ${state.code}`;
  if (regions.round) regions.round.textContent = roundLabel(state);
  if (regions.note) {
    regions.note.textContent = state.you
      ? ""
      : "Роли, карты и ночные цели игрокам не показываются ведущему.";
  }
  paintRoster(state);
  paintLog(state);
  paintChat(state);
  paintThreatChat(state);
  paintComposer(state);
  if (state.phase === "lobby") paintLobby(state);
  else {
    paintBadge(state);
    paintAction(state);
    paintEcho(state);
    paintBallots(state);
    paintHost(state);
  }
}

function paintLobby(state) {
  if (!regions.setup) return;
  if (state.need) regions.setup.textContent = `До старта ещё ${state.need}. Минимум 5, удобно 8–12.`;
  else regions.setup.textContent = state.setup || "";
  if (regions.start) regions.start.disabled = state.count < 5;
  if (regions.fill) regions.fill.hidden = state.count >= 8;
}

function paintRoster(state) {
  if (!regions.roster) return;
  const hostLobby = state.phase === "lobby" && session.view !== "player";
  regions.roster.replaceChildren();
  if (state.phase === "lobby") {
    for (const person of state.players) {
      const row = h("div", { class: "person" }, [
        h("span", { text: person.name + (person.bot ? " · бот" : "") + (state.you && state.you.id === person.id ? " · вы" : "") }),
      ]);
      if (hostLobby) {
        row.append(h("button", {
          class: "danger",
          type: "button",
          text: "Убрать",
          onClick: () => guard(() => actHost("kick", { id: person.id })),
        }));
      }
      regions.roster.append(row);
    }
    if (!state.players.length) regions.roster.append(h("p", { class: "wait", text: "За столом пока пусто." }));
    return;
  }
  for (const person of state.players) {
    const chip = h("li", { class: `chip${person.alive ? "" : " dead"}${state.you && state.you.id === person.id ? " me" : ""}` }, [
      h("span", { class: "dot" }),
      h("span", { text: person.name }),
    ]);
    if (!person.alive) chip.append(h("span", { class: "tag", text: "карантин" }));
    else if (person.silenced) chip.append(h("span", { class: "tag", text: "без голоса" }));
    regions.roster.append(chip);
  }
}

function paintBadge(state) {
  const you = state.you;
  if (!regions.badge) return;
  if (!you || !you.role) {
    regions.badge.hidden = true;
    regions.badge.replaceChildren();
    return;
  }
  regions.badge.hidden = false;
  regions.badge.className = `card badge ${you.team === "threat" ? "threat" : "town"}`;
  const list = h("ul", { class: "notes" });
  for (const note of you.notes || []) {
    const item = h("li");
    item.append(h("span", { class: "time", text: note.t }), document.createTextNode(note.text));
    list.append(item);
  }
  const allies = (you.allies || []).map((ally) => `${ally.name} — ${ally.roleName}${ally.alive ? "" : " (карантин)"}`).join("; ");
  const kids = [
    h("p", { class: "meta", text: you.team === "threat" ? "Угроза" : "Контур" }),
    h("h2", { text: you.roleName }),
    h("p", { class: "ability", text: you.ability }),
    h("p", { class: "tip", text: you.tip }),
  ];
  if (you.team === "threat") {
    kids.push(h("p", { class: "hint", text: "Ночью у вас есть отдельный канал." }));
  }
  if (you.item) kids.push(h("p", { class: "hint", text: `Карта: ${you.item.name}. ${you.item.text}` }));
  if (allies) kids.push(h("p", { class: "hint", text: `Союзники: ${allies}` }));
  if (list.childNodes.length) kids.push(list);
  regions.badge.replaceChildren(...kids);
}

function paintAction(state) {
  if (!regions.action) return;
  const key = actionSignature(state);
  if (key === actKey) return;
  actKey = key;
  const mount = regions.action;
  mount.replaceChildren();
  const you = state.you;
  if (state.phase === "end") {
    buildEnd(state, mount);
    return;
  }
  if (!you) {
    const text = {
      night: "Ночь закроется сама, когда живые роли сдадут протоколы. Если кто-то завис — закройте ночь, пропущенный ход сгорит.",
      discuss: "Когда разбор выдохся, открывайте голосование. Карты после этого уже не сыграть.",
      vote: "Итог можно подвести раньше, если кто-то не голосует. Молчание считается пропуском.",
    }[state.phase];
    if (text) mount.append(h("p", { class: "wait", text }));
    return;
  }
  if (you.role && !you.alive) {
    mount.append(h("p", { class: "wait", text: "Вы в карантине. Журнал открыт, писать и голосовать нельзя." }));
    return;
  }
  if (state.phase === "night") buildNight(state, mount);
  if (state.phase === "discuss") buildDay(state, mount);
  if (state.phase === "vote") buildVote(state, mount);
}

function actionSignature(state) {
  const you = state.you || {};
  const act = you.act || {};
  return [
    state.phase,
    state.night,
    state.day,
    state.winner,
    you.role || "",
    you.alive,
    you.item && you.item.id,
    you.locked,
    you.silenced,
    you.blocked,
    you.ballot || "",
    you.canVote,
    (act.targets || []).join(","),
    act.type || "",
    editing ? "edit" : "view",
  ].join("|");
}

function buildNight(state, mount) {
  const you = state.you;
  const act = you.act || { type: "wait" };
  if (act.type === "wait") {
    mount.append(h("p", { class: "wait", text: "Ночью у вас нет протокола. Рассвет наступит, когда роли сдадут действия. Если смена замерла, ночь закрывает ведущий." }));
    return;
  }
  if (act.type === "mask") {
    buildMask(state, mount, act);
    return;
  }
  if (you.locked && !editing && act.type !== "mask") {
    mount.append(h("p", { class: "wait", text: "Протокол принят. Пока ночь не закрыта, его можно сменить." }));
    mount.append(h("button", {
      class: "ghost",
      type: "button",
      text: "Изменить протокол",
      onClick: () => { editing = true; actKey = ""; render(last); },
    }));
    return;
  }
  if (you.teamTarget) draftTarget = you.teamTarget;
  if (act.type === "analyst") {
    mount.append(h("p", { class: "hint", text: `В архиве карт: ${act.archive}.` }));
    mount.append(h("button", { class: "primary", type: "button", text: "Смотреть архив", onClick: () => guard(() => sendNight("archive")) }));
    mount.append(h("button", { class: "primary", type: "button", text: "Характер атаки", onClick: () => guard(() => sendNight("hint")) }));
    mount.append(h("button", { class: "ghost", type: "button", text: "Пропустить", onClick: () => guard(() => sendNight("skip")) }));
    return;
  }
  if (act.type === "whitehat") {
    const row = h("div", { class: "modes" });
    for (const [id, label] of [["save", "Отменить удар"], ["block", "Блокировать карту"]]) {
      row.append(h("button", {
        class: `mode${draftMode === id ? " selected" : ""}`,
        type: "button",
        "data-mode": id,
        text: label,
        onClick: () => {
          draftMode = id;
          row.querySelectorAll(".mode").forEach((button) => {
            button.classList.toggle("selected", button.getAttribute("data-mode") === id);
          });
        },
      }));
    }
    mount.append(row);
  }
  pickList(state, act.targets || [], mount);
  const confirm = act.type === "attack" ? "Подтвердить цель" : "Подтвердить";
  const bar = h("div", { class: "bar" }, [
    h("button", {
      class: "primary",
      type: "button",
      text: confirm,
      onClick: () => guard(() => sendNight(nightKind(act.type), draftTarget)),
    }),
  ]);
  if (act.type === "attack") {
    bar.append(h("button", { class: "ghost", type: "button", text: "Пропустить атаку", onClick: () => guard(() => sendNight("pass")) }));
  } else {
    bar.append(h("button", { class: "ghost", type: "button", text: "Пропустить", onClick: () => guard(() => sendNight("skip")) }));
  }
  mount.append(bar);
  if (draftTarget) syncPicks(mount, draftTarget);
}

function buildMask(state, mount, act) {
  const allies = act.targets || [];
  mount.append(h("p", { class: "hint", text: "Это не атака. Маска прячет союзника: проверка руководителя ИБ покажет его чистым." }));
  if (!allies.length) {
    mount.append(h("p", { class: "wait", text: "Живых инсайдеров нет: прикрывать некого." }));
    mount.append(h("button", { class: "ghost", type: "button", text: "Пропустить", onClick: () => guard(() => sendNight("skip")) }));
    return;
  }
  const bar = h("div", { class: "bar" });
  for (const id of allies) {
    const person = state.players.find((item) => item.id === id);
    const name = person ? person.name : id;
    bar.append(h("button", {
      class: "primary",
      type: "button",
      text: `Прикрыть ${name}`,
      onClick: () => guard(() => sendNight("target", id)),
    }));
  }
  bar.append(h("button", {
    class: "ghost",
    type: "button",
    text: "Не прикрывать",
    onClick: () => guard(() => sendNight("skip")),
  }));
  mount.append(bar);
}

function nightKind(type) {
  if (type === "attack") return "attack";
  if (type === "whitehat") return draftMode;
  return "target";
}

function buildDay(state, mount) {
  const you = state.you;
  const item = you.item;
  if (you.blocked) mount.append(h("p", { class: "wait", text: "Техподдержка заблокировала ваши карты до конца дня." }));
  if (!item) {
    mount.append(h("p", { class: "wait", text: "Карты в руке нет. Пишите в канал. Голосование откроет ведущий." }));
    return;
  }
  mount.append(h("p", { class: "hint", text: `${item.name}. ${item.text}` }));
  if (item.id === "2fa" || you.blocked) return;
  const ids = item.id === "phishing"
    ? state.players.filter((person) => person.alive && person.id !== you.id).map((person) => person.id)
    : state.players.filter((person) => !person.alive).map((person) => person.id);
  if (!ids.length) {
    mount.append(h("p", { class: "wait", text: item.id === "phishing" ? "Некому отправить письмо." : "В карантине пока никого нет." }));
    return;
  }
  pickList(state, ids, mount);
  mount.append(h("button", {
    class: "primary",
    type: "button",
    text: "Сыграть карту",
    onClick: () => guard(async () => {
      if (!draftTarget) throw new Error("Сначала выберите игрока.");
      editing = false;
      await actPlayer("item", { target: draftTarget });
    }),
  }));
}

function buildVote(state, mount) {
  const you = state.you;
  if (!you.canVote) {
    mount.append(h("p", { class: "wait", text: you.silenced ? "Фишинг закрыл ваш голос на этом совете." : "Голос сейчас недоступен." }));
    return;
  }
  const ids = state.players.filter((person) => person.alive && person.id !== you.id).map((person) => person.id);
  pickList(state, ids, mount);
  if (you.ballot) syncPicks(mount, you.ballot);
  mount.append(h("button", {
    class: "primary",
    type: "button",
    text: you.ballot ? "Изменить голос" : "Отдать голос",
    onClick: () => guard(async () => {
      const target = draftTarget || you.ballot;
      if (!target) throw new Error("Сначала выберите игрока.");
      await actPlayer("vote", { target });
    }),
  }));
}

function buildEnd(state, mount) {
  const title = state.winner === "town" ? "Сотрудники удержали контур." : "Инсайдеры вывели контур из строя.";
  mount.append(h("h2", { text: title }));
  const list = h("ul", { class: "reveal" });
  for (const person of state.reveal || []) {
    const row = h("li", { class: `${person.team}${person.alive ? "" : " gone"}` });
    row.append(h("span", { text: person.name }), h("span", { text: person.roleName + (person.alive ? "" : " · карантин") }));
    list.append(row);
  }
  mount.append(list);
  const lessons = h("ul", { class: "lessons" });
  for (const lesson of state.lessons || []) lessons.append(h("li", { text: lesson }));
  mount.append(h("p", { class: "meta", text: "После смены" }), lessons);
}

function pickList(state, ids, mount, onChoose) {
  const you = state.you;
  for (const id of ids) {
    const person = state.players.find((item) => item.id === id);
    const label = !person ? id : person.id === you.id ? "Себя" : person.name;
    const button = h("button", {
      class: "pick",
      type: "button",
      "data-pick": id,
      onClick: () => {
        draftTarget = id;
        syncPicks(mount, id);
        if (onChoose) onChoose(id);
      },
    }, [h("span", { text: label })]);
    if (you.checked && you.checked.includes(id)) button.append(h("small", { text: "уже смотрели" }));
    mount.append(button);
  }
}

function syncPicks(mount, id) {
  mount.querySelectorAll("[data-pick]").forEach((button) => {
    button.classList.toggle("selected", button.getAttribute("data-pick") === id);
  });
}

async function sendNight(kind, target) {
  if ((kind === "attack" || kind === "target" || kind === "save" || kind === "block") && !target) {
    throw new Error("Сначала выберите игрока.");
  }
  editing = false;
  await actPlayer("night", { kind, target: target || null });
}

function paintEcho(state) {
  if (!regions.echo || !regions.action) return;
  if (!regions.action.contains(regions.echo)) regions.action.prepend(regions.echo);
  regions.echo.textContent = state.you && state.you.echo ? state.you.echo : "";
  if (state.phase === "night" && state.you && state.you.role === "insider" && state.you.teamTarget) {
    draftTarget = state.you.teamTarget;
    syncPicks(regions.action, state.you.teamTarget);
  }
}

function paintBallots(state) {
  if (!regions.ballots) return;
  regions.ballots.replaceChildren();
  if (state.phase !== "vote" || !(state.ballots || []).length) return;
  const list = h("ul", { class: "ballots" });
  for (const ballot of state.ballots) {
    const item = h("li");
    item.append(h("span", { text: ballot.voter }), document.createTextNode(" → "), h("span", { text: ballot.target }));
    list.append(item);
  }
  regions.ballots.append(h("p", { class: "meta", text: "Голоса открыты" }), list);
}

function paintLog(state) {
  if (!regions.log) return;
  const signature = (state.log || []).map((item) => item.t + item.text).join("|");
  if (regions.log.dataset.sig === signature) return;
  const follow = regions.log.scrollHeight - regions.log.scrollTop - regions.log.clientHeight < 80;
  regions.log.dataset.sig = signature;
  regions.log.replaceChildren();
  for (const item of state.log || []) {
    const row = h("article", { class: item.tone || "info" });
    row.append(h("span", { class: "time", text: item.t }), document.createTextNode(item.text));
    regions.log.append(row);
  }
  if (follow) regions.log.scrollTop = regions.log.scrollHeight;
}

function paintChat(state) {
  if (!regions.chat) return;
  const signature = (state.chat || []).map((item) => item.t + item.name + item.text).join("|");
  if (regions.chat.dataset.sig === signature) return;
  regions.chat.dataset.sig = signature;
  regions.chat.replaceChildren();
  for (const item of state.chat || []) {
    const row = h("li");
    row.append(h("span", { class: item.gm ? "who gm" : "who", text: item.name }), document.createTextNode(" " + item.text));
    regions.chat.append(row);
  }
}

function paintThreatChat(state) {
  if (!regions.threatSection) return;
  const open = !!state.canThreatChat;
  regions.threatSection.hidden = !open;
  if (!open) return;
  const signature = (state.threatChat || []).map((item) => item.t + item.name + item.text).join("|");
  if (regions.threatChat.dataset.sig === signature) return;
  regions.threatChat.dataset.sig = signature;
  regions.threatChat.replaceChildren();
  for (const item of state.threatChat || []) {
    const row = h("li");
    row.append(h("span", { class: "who", text: item.name }), document.createTextNode(" " + item.text));
    regions.threatChat.append(row);
  }
}

function paintComposer(state) {
  if (!regions.composer) return;
  const dead = state.you && state.you.role && !state.you.alive && state.phase !== "end";
  regions.composer.hidden = state.phase === "night" || !!dead;
  if (regions.threatComposer) {
    regions.threatComposer.hidden = !state.canThreatChat;
  }
}

function paintHost(state) {
  if (!regions.force) return;
  const labels = { night: "Закрыть ночь", discuss: "К голосованию", vote: "Подвести итог" };
  if (state.phase === "end") {
    regions.force.hidden = true;
    regions.abort.textContent = "Новая партия";
  } else if (labels[state.phase]) {
    regions.force.hidden = false;
    regions.force.textContent = labels[state.phase];
    regions.abort.textContent = "Разогнать стол";
  }
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast("Ссылка скопирована.");
  } catch {
    showToast(url);
  }
}

function openRules() {
  if (dialog.showModal) dialog.showModal();
  else dialog.setAttribute("open", "");
}

function fillRules() {
  dialog.replaceChildren(
    h("p", { class: "meta", text: "Как играть" }),
    h("h2", { text: "КиберЩит" }),
    h("p", { text: "Смена идёт ночь за ночью. Ночью роли сдают протоколы скрытно. Утром журнал говорит только, отключили ли кого-то. Днём стол обсуждает инцидент, играет карты и голосует, кого отправить в карантин." }),
    h("h3", { text: "Состав" }),
    h("p", { text: "От 5 до 15 игроков. Чем больше стол, тем больше инсайдеров. С 8 игроков появляется фейкомёт, с 7 — полный набор защитных ролей. Остальные — сотрудники без ночного протокола." }),
    h("h3", { text: "Роли" }),
    h("ul", {}, [
      h("li", { text: "Руководитель ИБ проверяет одного живого и видит только инсайдера. Фейкомёт для этой проверки чист." }),
      h("li", { text: "Специалист по кибергигиене делает один узел неуязвимым до рассвета." }),
      h("li", { text: "Белый хакер за ночь делает одно: отменяет удар по узлу или блокирует его карту до конца дня." }),
      h("li", { text: "Аналитик либо смотрит верхнюю карту архива, либо утром узнаёт характер атаки без имени исполнителя." }),
      h("li", { text: "Инсайдеры вместе выбирают, кого отключить. Союзники им видны. Ночью у угроз есть отдельный канал." }),
      h("li", { text: "Фейкомёт прикрывает одного живого инсайдера: проверка покажет его чистым." }),
    ]),
    h("h3", { text: "Карты" }),
    h("ul", {}, [
      h("li", { text: "Второй фактор срабатывает сам, один раз, если удар дошёл и карту не заблокировали." }),
      h("li", { text: "Цифровой след тайно называет роль того, кто уже в карантине." }),
      h("li", { text: "Резервная копия возвращает мирного. На угрозе карта сгорает, и об этом узнаёт только тот, кто её сыграл." }),
      h("li", { text: "Фишинговое письмо публично снимает голос. Журнал называет адресата, не отправителя." }),
    ]),
    h("h3", { text: "Победа" }),
    h("p", { text: "Сотрудники побеждают, когда все инсайдеры и фейкомёт в карантине. Угрозы побеждают, когда их среди активных не меньше, чем остальных. Ничья на голосовании никого не уводит." }),
    h("p", { text: "Ведущий не видит роли, карты и ночные цели. Он только открывает стол и закрывает застрявшую фазу." }),
    h("button", { class: "primary", type: "button", text: "Понятно", onClick: () => dialog.close() }),
  );
}

document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

fillRules();
presetCode = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
session = loadSession();
if (session && presetCode && session.code && presetCode !== session.code) session = null;
if (session && (session.hostToken || session.playerToken)) startPoll();
else renderHome();
