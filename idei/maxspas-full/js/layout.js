(function () {
  const BASE = "/idei/maxspas-full";
  const NAV = [
    { id: "home", href: BASE, label: "Старт" },
    { id: "services", href: `${BASE}/services`, label: "Услуги" },
    { id: "works", href: `${BASE}/works`, label: "Работы" },
    { id: "prices", href: `${BASE}/prices`, label: "Цены" },
    { id: "grbnk", href: `${BASE}/grbnk`, label: "3D" },
    { id: "contacts", href: `${BASE}/contacts`, label: "Связь" },
  ];

  const SERVICE_ICONS = { web: "web", bot: "bot", bundle: "bundle", "3d": "grbnk" };
  let site = null;

  async function loadSite() {
    const res = await fetch("/config/site.json");
    if (!res.ok) throw new Error("site.json");
    site = await res.json();
    return site;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderChrome(page) {
    const c = site.contacts;
    const el = document.getElementById("site-chrome");
    if (!el) return;

    const side = NAV.map(
      (item) =>
        `<a href="${item.href}" class="${item.id === page ? "is-active" : ""}">${item.label}</a>`
    ).join("");

    el.innerHTML = `
      <div class="draft-badge" aria-hidden="true">DRAFT</div>
      <div class="corner corner--tl">
        <a class="brand-mark" href="${BASE}">
          <img src="/assets/logo-mark.svg" alt="" width="28" height="28">
          MAXSPAS
        </a>
        <span class="pill">полный сайт · v2</span>
      </div>
      <div class="corner corner--tr">
        <div class="lang" aria-label="Язык">
          <button type="button" class="is-active">RU</button>
          <span style="color:var(--muted)">/</span>
          <button type="button">EN</button>
        </div>
        <a class="btn btn--ghost" href="/">Прод</a>
        <a class="btn btn--ghost" href="/idei">Идеи</a>
      </div>
      <nav class="side-nav" aria-label="Страницы">${side}</nav>
      <div class="corner corner--bl">
        <div class="btn-row btn-row--vertical">
          <a class="btn btn--ghost" href="${c.telegramChannelUrl}" target="_blank" rel="noopener">Канал</a>
          <a class="btn btn--ghost" href="${c.telegramUrl}" target="_blank" rel="noopener">Telegram</a>
          <a class="btn btn--ghost" href="mailto:${esc(c.email)}">Почта</a>
        </div>
      </div>
      <div class="corner corner--br">
        <div class="btn-row btn-row--vertical">
          <a class="btn btn--fill" href="${BASE}/contacts">Заявка</a>
          <a class="btn" href="${BASE}/grbnk">3D GRBNK →</a>
        </div>
      </div>`;

    el.querySelectorAll(".lang button").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.querySelectorAll(".lang button").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
  }

  function grbnkLogoImg(className, size) {
    const logo = site.grbnk3d?.logo || "/assets/logo-3dgrbnk.svg";
    return `<img src="${esc(logo)}" alt="" class="${className}" width="${size}" height="${size}" loading="lazy">`;
  }

  function serviceCard(s) {
    const iconName = SERVICE_ICONS[s.id] || "sparkle";
    const icon =
      s.id === "3d"
        ? `<div class="card__icon card__icon--grbnk">${grbnkLogoImg("card__icon-img", 28)}</div>`
        : `<div class="card__icon">${window.MSIcons ? MSIcons.icon(iconName) : ""}</div>`;
    const feats = (s.features || []).map((f) => `<li>${esc(f)}</li>`).join("");
    return `
      <article class="card">
        ${icon}
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
        <div class="card__meta"><span>${esc(s.price)}</span><span>${esc(s.days)}</span></div>
        ${feats ? `<ul class="card__list">${feats}</ul>` : ""}
        <a href="${BASE}/contacts" class="btn btn--ghost btn--block">Обсудить</a>
      </article>`;
  }

  function renderServices() {
    const services = site.services || [];
    const home = document.getElementById("services-grid");
    const full = document.getElementById("services-grid-full");
    if (home) home.innerHTML = services.map(serviceCard).join("");
    if (full) full.innerHTML = services.map(serviceCard).join("");
  }

  function renderHome() {
    const tag = document.getElementById("hero-tagline");
    if (tag) tag.textContent = site.brand.tagline;
  }

  function portfolioCard(item) {
    const iconName = item.icon || item.emoji || "sparkle";
    let visualIcon;
    if (item.logoAsset) {
      visualIcon = `<img src="${esc(item.logoAsset)}" alt="3DGRBNK" class="portfolio-card__logo portfolio-card__logo--grbnk" width="72" height="72" loading="lazy">`;
    } else if (item.logo || item.id === "maxspas-site") {
      visualIcon = `<img src="/assets/logo-mark.svg" alt="" class="portfolio-card__logo" width="72" height="72" loading="lazy">`;
    } else if (window.MSIcons) {
      visualIcon = `<span class="portfolio-card__icon-host">${MSIcons.icon(iconName, { xl: true })}</span>`;
    } else {
      visualIcon = `<span class="portfolio-card__emoji">${esc(item.emoji || "✨")}</span>`;
    }
    const tag = item.tag ? `<span class="portfolio-card__tag">${esc(item.tag)}</span>` : "";
    const isExternal = /^https?:\/\//i.test(item.url || "");
    const link = item.url
      ? `<a href="${esc(item.url)}" class="btn btn--ghost btn--sm"${isExternal ? ' target="_blank" rel="noopener"' : ""}>Смотреть</a>`
      : "";
    return `
      <article class="portfolio-card">
        <div class="portfolio-card__visual" style="background:${esc(item.color || "rgba(124,58,237,0.08)")}">
          ${visualIcon}
        </div>
        <div class="portfolio-card__body">
          ${tag}
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
          <div class="portfolio-card__meta">${esc(item.price || "")}</div>
          <div class="portfolio-card__actions">${link}</div>
        </div>
      </article>`;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    const items = site.portfolio || [];
    if (!grid || !items.length) return;
    grid.innerHTML = items.map(portfolioCard).join("");
    const empty = document.getElementById("portfolio-empty");
    if (empty) empty.style.display = "none";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim());
  }

  function isValidPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return false;
    if (new Set(digits).size === 1) return false;
    return true;
  }

  function isValidContact(value) {
    const text = String(value || "").trim();
    return text && (isValidEmail(text) || isValidPhone(text));
  }

  function renderGrbnk() {
    const g = site.grbnk3d;
    if (!g) return;

    const visual = document.getElementById("grbnk-visual");
    if (visual) {
      visual.innerHTML = `
        <div class="grbnk-visual__card grbnk-visual__card--cube">
          <div class="cube-scene">
            <div class="cube-scene__grid" aria-hidden="true"></div>
            <div class="cube-scene__stars" aria-hidden="true"></div>
            <div class="cube-ring cube-ring--1"></div>
            <div class="cube-ring cube-ring--2"></div>
            <div class="cube-wrap">
              <div class="cube">
                <div class="cube__face cube__face--front"></div>
                <div class="cube__face cube__face--back"></div>
                <div class="cube__face cube__face--right"></div>
                <div class="cube__face cube__face--left"></div>
                <div class="cube__face cube__face--top"></div>
                <div class="cube__face cube__face--bottom"></div>
              </div>
            </div>
          </div>
          <a href="${esc(g.botUrl)}" class="btn btn--fill" target="_blank" rel="noopener">${esc(g.botLabel || g.botUsername)}</a>
        </div>`;
    }

    const brandLogo = document.getElementById("grbnk-brand-logo");
    if (brandLogo) {
      brandLogo.src = g.logo;
      brandLogo.alt = g.title || "3DGRBNK";
    }

    const brandBot = document.getElementById("grbnk-brand-bot");
    if (brandBot) {
      brandBot.href = g.botUrl;
      brandBot.textContent = g.botLabel || g.botUsername;
    }
  }

  function bindContactForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;

    const status = document.getElementById("form-status");
    const submitBtn = document.getElementById("lead-submit");
    const apiUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8787/api/lead"
        : "/api/lead";

    function showStatus(text, ok) {
      if (!status) return;
      status.hidden = false;
      status.textContent = text;
      status.className = "form-status " + (ok ? "form-status--ok" : "form-status--err");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name") || "").trim(),
        contact: String(fd.get("contact") || "").trim(),
        service: String(fd.get("service") || "не указана"),
        message: String(fd.get("message") || "").trim(),
        company: String(fd.get("company") || "").trim(),
        budget: String(fd.get("budget") || "").trim(),
        deadline: String(fd.get("deadline") || "").trim(),
        page: window.location.pathname || "",
        referrer: String(document.referrer || "").slice(0, 500),
        website: String(fd.get("website") || "").trim(),
      };

      if (!fd.get("consent")) {
        showStatus("Нужно согласие на обработку данных.", false);
        return;
      }
      if (!payload.name || !payload.contact || !isValidContact(payload.contact)) {
        showStatus("Укажите имя и контакт (телефон или email).", false);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }
      if (status) status.hidden = true;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Ошибка отправки");
        }
        form.reset();
        showStatus("Заявка отправлена! Свяжемся в ближайшее время.", true);
      } catch (err) {
        showStatus(
          err.message !== "Failed to fetch"
            ? err.message
            : "Не удалось отправить. Запустите бот или напишите в @maxspas_studio_bot",
          false
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить заявку";
        }
      }
    });
  }

  async function init() {
    try {
      await loadSite();
    } catch {
      console.error("Не удалось загрузить /config/site.json");
      return;
    }

    const page = document.body.dataset.page || "home";
    renderChrome(page);
    renderServices();
    renderHome();
    renderPortfolio();
    renderGrbnk();
    bindContactForm();
    if (window.MSIcons) MSIcons.hydrate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
